import type { SheetData } from "../../store/useWexelStore";
import { STEEL_CATALOG, type EstimateItem, type MetradoState, type SteelLine } from "../../store/useMetradoStore";
import source from "./data/quispe-example.json";
import { recalculateSheet } from "./workbook";
import { formatMetradoSheet } from "./formatWorkbook";

const key = (kind: string, item = "", line = "", field = "") => JSON.stringify([kind, item, line, field]);
export const STEEL_HEADER_OFFSET = 13;
export const steelSourceAddress = (address: string) => address.replace(/\d+$/, (row) => String(Number(row) - STEEL_HEADER_OFFSET));
export const diameterColumn = (line: SteelLine) => String.fromCharCode(75 + Math.max(0, STEEL_CATALOG.findIndex((bar) => bar.bar === line.bar || Math.abs(bar.diameterMm - line.diameterMm) < .01)));
export const steelLengthFormula = (r: number) => `=F${r}*SUM(G${r}:I${r})*J${r}`;
export const steelWeightFormula = (r: number) => `=SUM(K${r}:T${r})*U${r}`;
export type SteelProjectionState = Pick<MetradoState, "items" | "steelSheetItems" | "header" | "showSteelTotals" | "tableStyle" | "showFill" | "showFrame">;
/** Q7 layout: K:T lengths by diameter, U kg/m, V partial, W partida total. */
export function projectSteelWorksheet(state: SteelProjectionState): SheetData {
  const sheet: SheetData = { id: "metrados-acero", name: "Acero", cells: {}, colWidths: {}, rowHeights: {}, currentCell: "A1", formulaInput: "", selectedCell: null, merges: source.steelMerges.filter((range) => Number(range.match(/\d+/)?.[0]) >= 14).map((range) => range.split(":").map(steelSourceAddress).join(":")), template: { id: "acero-q7", rows: {}, generated: {} } };
  const put = (address: string, value: string | number, binding: string) => {
    const rawValue = String(value); sheet.cells[address] = { rawValue, displayValue: rawValue, dependencies: [] };
    sheet.template!.generated[address] = { key: binding, rawValue };
  };
  for (const [address, raw] of Object.entries(source.steelReference)) {
    const sourceRow = Number(address.match(/\d+$/)?.[0]);
    if (sourceRow >= 14 && sourceRow < 17) put(steelSourceAddress(address), raw, key("label",address));
  }
  const items = (state.steelSheetItems ?? state.items).filter((item) => item.steelLines.length || state.steelSheetItems !== undefined || (item.norma && item.kind === "item" && item.unit === "kg"));
  let row = 4;
  for (let index = 0; index < items.length; index++) {
    const item = items[index], itemRow = Math.max(row,item.sourceRow === undefined ? row : item.sourceRow - STEEL_HEADER_OFFSET);
    sheet.template!.rows[key("item",item.id)] = itemRow;
    put("C"+itemRow,item.code.toUpperCase(),key("item",item.id,"","code")); put("D"+itemRow,item.description.toUpperCase(),key("item",item.id,"","description")); put("E"+itemRow,"kg",key("item",item.id,"","unit"));
    row = itemRow+1;
    for (const annotation of item.annotations ?? []) {
      put("D"+(annotation.row-STEEL_HEADER_OFFSET),annotation.description,key("annotation",item.id,String(annotation.row)));
      sheet.template!.rows[key("annotation",item.id,String(annotation.row))] = annotation.row-STEEL_HEADER_OFFSET;
    }
    for (const line of item.steelLines) {
      const r = Math.max(row,line.sourceRow === undefined ? row : line.sourceRow - STEEL_HEADER_OFFSET); row = r+1;
      sheet.template!.rows[key("steel",item.id,line.id)] = r;
      const field = (col: string, name: string, value: string | number) => put(col+r,value,key("steel",item.id,line.id,name));
      field("D","description",line.description); field("E","unit","kg"); field("F","similarElements",line.expressions?.similarElements ?? line.similarElements);
      field("G","length",line.expressions?.length ?? line.length); field("H","hooks",line.expressions?.hooks ?? (line.hookStart+line.hookEnd || ""));
      field("I","spliceTotal",line.expressions?.spliceTotal ?? (line.splices*line.spliceLength || "")); field("J","quantity",line.expressions?.quantity ?? line.quantity);
      field(diameterColumn(line),"totalLength",line.expressions?.totalLength ?? steelLengthFormula(r)); field("U","kgPerMeter",line.expressions?.kgPerMeter ?? line.kgPerMeter);
      field("V","weight",line.weightView === "acero" && line.weightRaw !== undefined ? line.weightRaw : line.weightOverride !== undefined ? line.weightOverride : steelWeightFormula(r));
    }
    const nextSourceRow = items[index+1]?.sourceRow;
    const end = Math.max(row-1, (nextSourceRow === undefined ? row : nextSourceRow-STEEL_HEADER_OFFSET)-1);
    put("W"+itemRow,item.norma && !item.steelLines.length ? "" : `=SUM(V${itemRow+1}:V${Math.max(itemRow+1,end)})`,key("item",item.id,"","total"));
  }
  if (state.showSteelTotals) {
    put("D"+row,"TOTAL",key("label","total"));
    const pending = items.length > 0 && items.every(item => item.norma && !item.steelLines.length);
    for (const col of "KLMNOPQRSTV") put(col+row,pending ? "" : `=SUM(${col}4:${col}${Math.max(4,row-1)})`,key("total","","",col));
  }
  return recalculateSheet(formatMetradoSheet(sheet,{ ...state, items },true));
}

export function readSteelWorksheet(sheet: SheetData, state: MetradoState) {
  const fields = new Map<string, { raw: string; value: string; row: number }>();
  for (const [address, binding] of Object.entries(sheet.template?.generated ?? {})) {
    const cell = sheet.cells[address]; if (cell) fields.set(binding.key,{raw:cell.rawValue,value:cell.displayValue,row:Number(address.match(/\d+$/)?.[0])});
  }
  const get = (item: string,line: string,field: string) => fields.get(key("steel",item,line,field));
  const number = (item: string,line: string,field: string,fallback: number) => { const c=get(item,line,field); if (!c) return fallback; const n=Number(c.raw.startsWith("=")?c.value:c.raw); return Number.isFinite(n)?n:fallback; };
  const items = (state.steelSheetItems ?? state.items).map((item): EstimateItem => ({ ...item,
    code: (fields.get(key("item",item.id,"","code"))?.raw ?? item.code).toUpperCase(),
    description: (fields.get(key("item",item.id,"","description"))?.raw ?? item.description).toUpperCase(),
    steelLines:item.steelLines.map((line) => {
      const weight=get(item.id,line.id,"weight"); if (!weight) return line;
      const read=(field:string,fallback:number)=>number(item.id,line.id,field,fallback);
      const hooks=read("hooks",line.hookStart+line.hookEnd), splice=read("spliceTotal",line.splices*line.spliceLength);
      const expressions={...line.expressions};
      for (const field of ["similarElements","length","hooks","spliceTotal","quantity","kgPerMeter","totalLength"] as const) {
        const c=get(item.id,line.id,field); if(c) expressions[field] = c.raw.startsWith("=") && !(field==="totalLength" && c.raw===steelLengthFormula(c.row)) ? c.raw : undefined;
      }
      const overridden=weight.raw!==steelWeightFormula(weight.row);
      return {...line,description:get(item.id,line.id,"description")?.raw??line.description,similarElements:read("similarElements",line.similarElements),length:read("length",line.length),quantity:read("quantity",line.quantity),kgPerMeter:read("kgPerMeter",line.kgPerMeter),
        hookStart:hooks===line.hookStart+line.hookEnd?line.hookStart:hooks,hookEnd:hooks===line.hookStart+line.hookEnd?line.hookEnd:0,splices:splice?line.splices||1:0,spliceLength:splice/(line.splices||1),expressions,
        weightKg:read("weight",line.weightKg),weightRaw:overridden?weight.raw:undefined,weightOverride:overridden?read("weight",line.weightKg):undefined,weightView:overridden?"acero":undefined,calculationError:weight.value.startsWith("#")?weight.value:undefined};
    }) }));
  const header={...state.header};
  for (const field of ["project","owner","date","specialty","module","preparedBy","reviewedBy"] as const) header[field]=fields.get(key("header","","",field))?.raw??header[field];
  return {items:state.steelSheetItems===undefined?items:state.items,steelSheetItems:state.steelSheetItems===undefined?undefined:items,header};
}
