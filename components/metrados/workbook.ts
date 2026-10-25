import { type CellData, type SheetData, type WorkbookData } from "../../store/useWexelStore";
import { calculateItemTotal, calculateMeasurement, canonicalUnit, type EstimateItem, type MetradoState, type MetradoView } from "../../store/useMetradoStore";
import { processFormula } from "../utils/excel";
import { formatMetradoSheet } from "./formatWorkbook";
import { projectSteelWorksheet, readSteelWorksheet } from "./steelWorkbook";
import { appliedSwelling } from './measurementGuidance';
import { formulaReferences } from '../utils/formulaReferences';
import { surplusSources } from './surplusBalance';
import { formworkLinkedFields } from './sobrecimientoFormwork';
import {compactHeader,completeHeader} from './compactHeader';
import {fieldColumn} from './explicitInputs';

export const METRADO_WORKBOOK = "Metrados";
export const METRADO_SHEETS: Record<MetradoView, string> = { metrado: "metrados-metrado", acero: "metrados-acero", resumen: "metrados-resumen" };
const columns = Array.from({ length: 26 }, (_, index) => String.fromCharCode(65 + index));
const key = (kind: string, itemId = "", lineId = "", field = "") => JSON.stringify([kind, itemId, lineId, field]);
const rawNumber = (value: number) => Number.isFinite(value) ? String(value) : "#ERROR!";
const pendingItem = (item: EstimateItem) => (item.norma || item.detailVariant) && !item.measurements.some(line => !line.pending) && !item.steelLines.length;
export const measurementFormula = (kind: string, row: number, factor = 1, sectionMethod?: 'endAreas' | 'meanArea', columnSection = false, surplus = false) => (columnSection || surplus) && kind === 'volume' ? `=F${row}*G${row}*H${row}*J${row}` : sectionMethod && kind === 'volume'
  ? `=F${row}*G${row}*${sectionMethod === 'endAreas' ? `K${row}` : `H${row}`}*J${row}` + (factor !== 1 ? '*' + factor : '')
  : "=F" + row + "*G" + row + (kind === "area" || kind === "volume" ? "*H" + row : "") + (kind === "volume" ? "*I" + row : "") + "*J" + row + (kind === 'volume' && factor !== 1 ? '*' + factor : '');
const steelFormula = (view: MetradoView, row: number) => view === "metrado" ? "=K" + row + "*M" + row : "=F" + row + "*(G" + row + "+H" + row + "+I" + row + "+J" + row + ")*K" + row + "*L" + row;
export function recalculateSheet(sheet: SheetData): SheetData {
  const count = Math.max(99, ...Object.keys(sheet.cells).map((address) => Number(address.match(/\d+$/)?.[0]) || 0));
  const rows = Array.from({ length: count }, (_, index) => String(index + 1));
  const matrix = rows.map((r) => columns.map((c) => sheet.cells[c + r] ?? { rawValue: "", displayValue: "", dependencies: [] }));
  const cells = { ...sheet.cells };
  for (const [address, cell] of Object.entries(cells)) if (cell.rawValue.startsWith("=")) {
    const result = processFormula(cell.rawValue, matrix, rows, columns);
    if (cell.formula !== cell.rawValue || cell.displayValue !== result.displayValue || cell.dependencies.length !== result.dependencies.length || cell.dependencies.some((dep,index) => dep.row !== result.dependencies[index].row || dep.col !== result.dependencies[index].col))
      cells[address] = { ...cell, formula: cell.rawValue, ...result };
  }
  return { ...sheet, cells };
}
function makeSheet(view: MetradoView) {
  const sheet: SheetData = { id: METRADO_SHEETS[view], name: view === "metrado" ? "Metrado" : view === "acero" ? "Acero" : "RESUMEN", cells: {}, colWidths: {}, rowHeights: {}, selectedCell: null, currentCell: "A1", formulaInput: "", hiddenRows: [], template: { id: "metrados", rows: {}, generated: {} } };
  const put = (address: string, rawValue: string | number, cellKey: string) => {
    const full = typeof rawValue === "number" ? rawNumber(rawValue) : rawValue;
    const special=JSON.parse(cellKey)[0]==='sectionHeader'&&!address.startsWith('D');
    const raw=special?compactHeader(full):full;
    sheet.cells[address] = { rawValue: raw, displayValue: raw, dependencies: [],...(special?{headerFullLabel:completeHeader(full)}: {}) };
    sheet.template!.generated[address] = { key: cellKey, rawValue: raw };
  };
  const label = (row: number, values: Record<string, string>) => { for (const [col, value] of Object.entries(values)) put(col + row, value, key("label", col + row)); };
  return { sheet, put, label };
}
export function projectMetrado(state: Pick<MetradoState, "items" | "steelSheetItems" | "header" | "view" | "summaryVisible" | "summaryFactor" | "collapsedItemIds" | "showSteelTotals" | "tableStyle" | "showFill" | "showFrame">): SheetData[] {
  const visible: Array<{ item: EstimateItem; depth: number; hidden: boolean }> = [];
  const visited = new Set<string>();
  const visit = (parentId: string | null, depth: number, hidden: boolean) => {
    state.items.filter((item) => item.parentId === parentId).sort((a, b) => a.order - b.order).forEach((item) => {
      if (visited.has(item.id)) return;
      visited.add(item.id); visible.push({ item, depth, hidden });
      visit(item.id, depth + 1, hidden || state.collapsedItemIds.includes(item.id));
    });
  };
  visit(null, 0, false);
  return (["metrado", "acero", "resumen"] as const).map((view) => {
    if (view === "acero") return projectSteelWorksheet(state);
    const { sheet, put, label } = makeSheet(view);
    let row = 1;
    if (view === "metrado") label(row, { A: "Nivel", C: "Ítem", D: "Descripción", E: "Und", F: "Elem. simil.", G: "Largo", H: "Ancho", I: "Alto", J: "Nº veces", K: "Long.", L: "Área", M: "Vol.", N: "Kg.", O: "Und.", P: "Total" });
    if (view === "resumen") label(row, { A: "Nivel", C: "Ítem", D: "Descripción", E: "Und", F: "Metrado", G: "Factor", H: "Total" });
    row++;
    if (view === "resumen" && !state.summaryVisible) return formatMetradoSheet(sheet, state);
    for (const { item, depth, hidden } of visible) {
      const itemRow = row++;
      sheet.template!.rows[key("item", item.id)] = itemRow;
      if (hidden) sheet.hiddenRows!.push(String(itemRow));
      put("A" + itemRow, depth + 1, key("item", item.id, "", "level"));
      for (const [col, field] of [["C", "code"], ["D", "description"], ["E", "unit"]] as const) put(col + itemRow, field === "unit" ? item[field] : item[field].toUpperCase(), key("item", item.id, "", field));
      if (view === "resumen") {
        if (item.cleanupAreaTemplateVersion) {
          const areas = item.measurements.filter(line => line.referenceOnly && !line.pending && line.kind === 'area' && canonicalUnit(line.unit) === 'm2');
          put('D' + itemRow, item.description.toUpperCase() + ' · ÁREA DE INTERVENCIÓN (REFERENCIA)', key('referenceSummary', item.id, '', 'description'));
          put('E' + itemRow, 'm2', key('referenceSummary', item.id, '', 'unit'));
          put('F' + itemRow, areas.length ? areas.reduce((sum, line) => sum + calculateMeasurement(line), 0) : '', key('referenceSummary', item.id, '', 'referenceAreaQuantity'));
          put('H' + itemRow, areas.length ? '=F' + itemRow : '', key('referenceSummary', item.id, '', 'referenceAreaTotal'));
        } else if (item.kind === "item") {
          const pending = pendingItem(item);
          put("F" + itemRow, pending ? "" : calculateItemTotal(item), key("summary", item.id, "", "quantity"));
          put("G" + itemRow, pending ? "" : state.summaryFactor, key("summary", item.id, "", "factor"));
          put("H" + itemRow, pending ? "" : "=F" + itemRow + "*G" + itemRow, key("summary", item.id, "", "total"));
        }
        continue;
      }
      const totals: string[] = [];
      const referenceAreas: string[] = [];
      if (view === "metrado") for (const line of item.measurements) {
        for(let offset=0;offset<(line.formulaInputs?.length??0);offset+=10){
          const inputs=line.formulaInputs!.slice(offset,offset+10),h=row++,v=row++;
          sheet.template!.rows[key('sectionHeader',item.id,line.id,'inputs'+offset)]=h;
          sheet.template!.rows[key('formulaInput',item.id,line.id,'inputs'+offset)]=v;
          if(hidden||state.collapsedItemIds.includes(item.id))sheet.hiddenRows!.push(String(h),String(v));
          put('D'+h,'Datos · '+line.description,key('sectionHeader',item.id,line.id,'description'+offset));
          inputs.forEach((input,index)=>{
            const col=String.fromCharCode(71+index),address=col+h;
            put(address,compactHeader(input.label),key('sectionHeader',item.id,line.id,'inputLabel:'+input.id));
            sheet.cells[address].headerFullLabel=input.label;
            put(col+v,input.value,key('formulaInput',item.id,line.id,input.id));
          });
        }
        if (line.formworkSource) {
          const h = row++;
          sheet.template!.rows[key('sectionHeader', item.id, line.id)] = h;
          if (hidden || state.collapsedItemIds.includes(item.id)) sheet.hiddenRows!.push(String(h));
          const labels = { D: line.formworkSource.face === 'sides' ? 'ENCOFRADO · CARAS LATERALES VINCULADAS AL CONCRETO' : 'TAPAS · ANCHO × ALTURA · SOLO EXTREMOS ENCOFRADOS', G: line.formworkSource.face === 'sides' ? 'Largo (m)' : 'Ancho (m)', H: 'Altura (m)', I: '', J: line.formworkSource.face === 'sides' ? 'Caras × veces' : 'Tapas / elem.' };
          for (const [col, text] of Object.entries(labels)) put(col + h, text, key('sectionHeader', item.id, line.id, col));
        }
        const prismDeduction = line.sign < 0 && (line.fillGroup?.role === 'deduction' || line.description.startsWith('Descuento · ')) && !line.columnSection && !line.crossSections;
        if ((line.surplus || line.columnSection || line.crossSections || prismDeduction) && line.kind === 'volume') {
          const h = row++;
          sheet.template!.rows[key('sectionHeader', item.id, line.id)] = h;
          if (hidden || state.collapsedItemIds.includes(item.id)) sheet.hiddenRows!.push(String(h));
          const labels = line.surplus ? { D: 'EXCEDENTES · (EXCAVACIÓN − RELLENO PROPIO) × FACTOR', G: 'Vol. base (m³)', H: 'Factor', I: '' } : line.columnSection ? { D: line.columnSection.element === 'planArea' ? 'VOLUMEN · ÁREA EN PLANTA × ALTURA / PROFUNDIDAD' : line.columnSection.element === 'stripFooting' ? 'CIMIENTO CORRIDO · V = ÁREA ACUMULADA × ALTURA' : 'COLUMNA · V = ÁREA DE SECCIÓN × h ENTERRADA', G: line.columnSection.element === 'stripFooting' || line.columnSection.element === 'planArea' ? 'Altura (m)' : 'h ent. (m)', H: line.columnSection.element === 'planArea' ? 'Área (m²)' : line.columnSection.element === 'stripFooting' ? 'A cim. (m²)' : 'A col. (m²)', I: '' } : prismDeduction ? { D: 'VOLUMEN OCUPADO · V = LARGO × ANCHO × ALTO', G: 'Largo (m)', H: 'Ancho (m)', I: 'Alto (m)' } : { D: line.crossSections!.method === 'endAreas' ? 'SECCIONES · V = (Ai + Af) / 2 × L' : 'SECCIONES · V = ÁREA MEDIA × L', G: 'L (m)', H: line.crossSections!.method === 'endAreas' ? 'Ai (m²)' : 'Am (m²)', I: line.crossSections!.method === 'endAreas' ? 'Af (m²)' : '' };
          for (const [col, text] of Object.entries(labels)) put(col + h, text, key('sectionHeader', item.id, line.id, col));
        }
        if(line.crossSections?.method==='endAreas')put('K'+(row-1),'Am (m²)',key('sectionHeader',item.id,line.id,'K'));
        const r = row++;
        sheet.template!.rows[key("measurement", item.id, line.id)] = r;
        if (hidden || state.collapsedItemIds.includes(item.id)) sheet.hiddenRows!.push(String(r));
        const field = (col: string, name: string, value: string | number) => put(col + r, value, key("measurement", item.id, line.id, name));
        if (line.presentation === 'separator') { field('D', 'description', line.description); continue; }
        field("D", "description", line.description); field("E", "unit", line.unit);
        const quantityRow = line.quantitySourceId ? sheet.template!.rows[key('measurement', item.id, line.quantitySourceId)] : undefined;
        field("F", "similarElements", line.quantitySourceId ? quantityRow ? '=F' + quantityRow : '=#REF!' : line.expressions?.similarElements ?? line.similarElements);
        if (line.surplus && line.kind === 'volume') {
          const sources = surplusSources(state.items, line);
          const measured = sources.some(source => source.measurements.some(detail => !detail.pending && !detail.presentation && !detail.referenceOnly));
          const addresses = sources.map(source => sheet.template!.rows[key('item', source.id)]).filter(Boolean).map(row => 'P' + row);
          field('G', 'length', line.surplus.manual ? line.expressions?.length ?? line.length : measured && addresses.length ? '=SUM(' + addresses.join(',') + ')' : '');
          field('H', 'swellingFactor', line.swelling?.factor ?? 1);
        } else if (line.columnSection && line.kind === 'volume') {
          field('G', 'buriedHeight', line.columnSection.heightExpression);
          field('H', 'columnArea', line.columnSection.areaExpression);
        } else {
          field("G", line.kind === "units" || line.kind === "weight" ? "manualQuantity" : "length", (line.kind === "units" || line.kind === "weight") ? line.expressions?.manualQuantity ?? line.manualQuantity ?? 1 : line.expressions?.length ?? line.length);
          if (line.crossSections && line.kind === 'volume') {
            const c = line.crossSections;
            field('H', c.method === 'endAreas' ? 'initialArea' : 'meanArea', c.expressions[c.method === 'endAreas' ? 'initialArea' : 'meanArea']);
            if (c.method === 'endAreas') field('I', 'finalArea', c.expressions.finalArea);
            if (c.method === 'endAreas') field('K','meanAreaCalculated',`=(H${r}+I${r})/2`);
          } else {
            field("H", "width", line.expressions?.width ?? line.width);
            field("I", "height", line.expressions?.height ?? line.height);
          }
        }
        field("J", "repetitions", line.expressions?.repetitions ?? line.repetitions * line.sign);
        const resultCol = { length: "K", area: "L", volume: "M", weight: "N", units: "O" }[line.kind];
        field(resultCol, "result", line.pending ? "" : ((line.columnSection || line.crossSections) && line.calculationError?.startsWith('Secciones:') && !Object.keys(line.formulaTemplates??{}).length || line.surplus && line.calculationError?.startsWith('Excedentes:')) ? '#ERROR!' : line.resultRaw ?? measurementFormula(line.kind, r, appliedSwelling(line), line.crossSections?.method, Boolean(line.columnSection), Boolean(line.surplus)));
        if (!line.referenceOnly && !line.pending && canonicalUnit(line.unit) === canonicalUnit(item.unit)) totals.push(resultCol + r);
        if (line.referenceOnly && !line.pending && line.kind === 'area' && canonicalUnit(line.unit) === 'm2') referenceAreas.push(resultCol + r);
      }
      for (const line of item.steelLines) {
        const r = row++;
        sheet.template!.rows[key("steel", item.id, line.id)] = r;
        if (hidden || state.collapsedItemIds.includes(item.id)) sheet.hiddenRows!.push(String(r));
        const field = (col: string, name: string, value: string | number) => put(col + r, value, key("steel", item.id, line.id, name));
        field("D", "description", line.description);
        field("F", "similarElements", line.similarElements); field("G", "length", line.length);
        const result = "N";
          field("E", "unit", "kg"); field("H", "hooks", line.hookStart + line.hookEnd); field("I", "spliceTotal", line.splices * line.spliceLength);
          field("J", "quantity", line.quantity); field("M", "kgPerMeter", line.kgPerMeter);
          field("K", "totalLength", "=F" + r + "*(G" + r + "+H" + r + "+I" + r + ")*J" + r);
        field(result, "weight", line.weightView === view && line.weightRaw !== undefined ? line.weightRaw : line.weightOverride !== undefined ? line.weightOverride : steelFormula(view, r));
        if (canonicalUnit(item.unit) === "kg") totals.push(result + r);
      }
      if (item.kind === "item") put("P" + itemRow, totals.length ? "=SUM(" + totals.join(";") + ")" : pendingItem(item) ? "" : "=0", key("item", item.id, "", "total"));
      else if (item.cleanupAreaTemplateVersion) put('P' + itemRow, referenceAreas.length ? '=SUM(' + referenceAreas.join(';') + ')' : '', key('item', item.id, '', 'referenceAreaTotal'));
    }
    // Resolve stable source IDs after every row has been assigned, including sources below the target.
    if(view==='metrado')for(const {item} of visible)for(const line of item.measurements){
      const r=sheet.template!.rows[key('measurement',item.id,line.id)];if(!r)continue;
      const inputAddress=(id:string)=>Object.entries(sheet.template!.generated).find(([,binding])=>binding.key===key('formulaInput',item.id,line.id,id))?.[0];
      for(const [field,template] of Object.entries(line.formulaTemplates??{})){
        const col=fieldColumn(line,field);if(!col)continue;
        put(col+r,template.replaceAll('@row',String(r)).replace(/@\{([^}]+)\}/g,(_,id)=>inputAddress(id)??'#REF!'),key('measurement',item.id,line.id,field));
        sheet.cells[col+r].semanticFormula=true;
      }
      for(const [field,link] of Object.entries(line.inputLinks??{})){
        const source=state.items.find(i=>i.id===link.itemId)?.measurements.find(l=>l.id===link.lineId),sourceRow=sheet.template!.rows[key('measurement',link.itemId,link.lineId)];
        const col=fieldColumn(line,field),sourceCol=source&&fieldColumn(source,link.field);
        if(col){put(col+r,sourceCol&&sourceRow?'='+sourceCol+sourceRow:'=#REF!',key('measurement',item.id,line.id,field));sheet.cells[col+r].semanticFormula=true;}
      }
      const factor=inputAddress('swelling');
      if(factor&&!line.surplus&&!line.formulaTemplates?.result&&!line.resultRaw)put('M'+r,measurementFormula(line.kind,r,1,line.crossSections?.method,Boolean(line.columnSection))+'*'+factor,key('measurement',item.id,line.id,'result'));
      if(factor&&!line.surplus&&!line.resultRaw)sheet.cells['M'+r].semanticFormula=true;
      const faces=inputAddress('faces'),source=line.formworkSource;
      if(faces&&source&&(!source.manualFields?.includes('repetitions')||/^=J\d+\*G\d+$/.test(line.expressions?.repetitions??''))){
        const sourceRow=sheet.template!.rows[key('measurement',source.itemId,source.lineId)];
        put('J'+r,sourceRow?'=J'+sourceRow+'*'+faces:'=#REF!',key('measurement',item.id,line.id,'repetitions'));
        sheet.cells['J'+r].semanticFormula=true;
      }
    }
    if (view === 'metrado') for (const { item } of visible) for (const line of item.measurements) {
      if (!line.formworkSource) continue;
      const r = sheet.template!.rows[key('measurement', item.id, line.id)];
      const sourceRow = sheet.template!.rows[key('measurement', line.formworkSource.itemId, line.formworkSource.lineId)];
      for (const [field, formula] of Object.entries(formworkLinkedFields(line, sourceRow))) {
        const col = { similarElements: 'F', length: 'G', width: 'H', repetitions: 'J' }[field];
        put(col + String(r), formula, key('measurement', item.id, line.id, field));
      }
      if (r) {
        sheet.cells['D' + r].hint = line.formworkSource.face === 'sides' ? 'Vinculado al concreto: 2 × largo × altura. N.º veces permite ajustar las caras encofradas. Editar una medida la desvincula del concreto.' : 'Ancho × altura del concreto. N.º veces = tapas por elemento (0, 1 o 2 según contacto efectivo). La cantidad de elementos y repeticiones viene del concreto.';
      }
    }
    sheet.template!.explicitInputsVersion=1;
    return recalculateSheet(formatMetradoSheet(sheet, state));
  });
}

/** Keep free cells, custom formulas, formats and user sizing while moving generated rows. */
export function reconcileMetradoSheet(previous: SheetData | undefined, desired: SheetData): SheetData {
  if (!previous?.template) return desired;
  const oldRows = previous.template.rows, newRows = desired.template!.rows;
  const rowMap = new Map<number, number>();
  for (const [id, oldRow] of Object.entries(oldRows)) if (newRows[id]) rowMap.set(oldRow, newRows[id]);
  const oldEnd = Math.max(1, ...Object.values(oldRows)), newEnd = Math.max(1, ...Object.values(newRows)), delta = newEnd - oldEnd;
  const movedRow = (r: number) => rowMap.get(r) ?? (r > oldEnd ? Math.max(1, r + delta) : r);
  const translate = (raw: string) => {
    let result = raw;
    for (const ref of formulaReferences(raw).reverse()) {
      const translated = ref.text.replace(/(\$?[A-Z]+\$?)(\d+)/gi, (_, col: string, r: string) => col + movedRow(Number(r)));
      result = result.slice(0, ref.start) + translated + result.slice(ref.end);
    }
    return result;
  };
  const cells: Record<string, CellData> = {};
  const byKey = new Map(Object.entries(previous.template.generated).map(([address, entry]) => [entry.key, { address, raw: entry.rawValue }]));
  for (const [address, cell] of Object.entries(previous.cells)) {
    if (previous.template.generated[address]) continue;
    const match = address.match(/^([A-Z]+)(\d+)$/);
    if (!match) continue;
    const destination = match[1] + movedRow(Number(match[2]));
    // A free note is retained outside the generated region if a new generated cell occupies it.
    const target = desired.cells[destination] ? match[1] + (newEnd + 2 + Number(match[2])) : destination;
    cells[target] = { ...cell, rawValue: translate(cell.rawValue) };
  }
  for (const [address, entry] of Object.entries(desired.template!.generated)) {
    const old = byKey.get(entry.key), oldCell = old ? previous.cells[old.address] : undefined;
    const summaryOverride = old && oldCell && JSON.parse(entry.key)[0] === "summary" && oldCell.rawValue !== old.raw;
    let rawValue = !desired.cells[address].semanticFormula&&old && oldCell && (summaryOverride || translate(old.raw) === entry.rawValue || old.raw === entry.rawValue) ? translate(oldCell.rawValue) : entry.rawValue;
    const [kind, , , field] = JSON.parse(entry.key) as string[];
    if (kind === "item" && (field === "code" || field === "description")) rawValue = rawValue.toUpperCase();
    const projected = desired.cells[address];
    // Reuse untouched cells so typing does not invalidate every visible cell and ribbon.
    // Existing user formats win; newly introduced properties (e.g. decimals) still apply.
    const inputChanged = oldCell?.input !== projected.input;
    const compactHeader = kind === 'sectionHeader';
    cells[address] = oldCell && oldCell.rawValue === rawValue && !inputChanged && oldCell.hint === projected.hint && (!compactHeader || oldCell.wrapText === false) && Object.keys(projected).every(field => field in oldCell)
      ? oldCell : { ...projected, ...oldCell, input: projected.input, hint: projected.hint, ...(compactHeader ? { wrapText: false } : {}), ...(inputChanged ? { backgroundColor: projected.backgroundColor } : {}), rawValue, displayValue: rawValue, formula: undefined, dependencies: [] };
  }
  const rowHeights: Record<string, number> = { ...desired.rowHeights };
  for (const [r, height] of Object.entries(previous.rowHeights)) rowHeights[String(movedRow(Number(r)))] = height;
  const currentCell = previous.currentCell.replace(/\d+$/, (r) => String(movedRow(Number(r))));
  return recalculateSheet({ ...previous, merges: desired.merges, colWidths: { ...desired.colWidths, ...previous.colWidths }, template: { ...desired.template!, formatVersion: previous.template.formatVersion, paletteSignature: previous.template.paletteSignature }, hiddenRows: desired.hiddenRows, cells, rowHeights, currentCell,
    selectedCell: previous.selectedCell ? { ...previous.selectedCell, row: movedRow(previous.selectedCell.row + 1) - 1 } : null,
    selectionEnd: previous.selectionEnd ? { ...previous.selectionEnd, row: movedRow(previous.selectionEnd.row + 1) - 1 } : undefined,
    formulaInput: cells[currentCell]?.rawValue ?? "" });
}
export function mergeMetradoWorkbook(previous: WorkbookData | undefined, projected: SheetData[], view: MetradoView): WorkbookData {
  const ids = new Set(Object.values(METRADO_SHEETS));
  return { activeSheetId: METRADO_SHEETS[view], sheets: [...projected.map((sheet) => reconcileMetradoSheet(previous?.sheets.find((old) => old.id === sheet.id), sheet)), ...(previous?.sheets.filter((sheet) => !ids.has(sheet.id) && (sheet.id !== "Metrados-sheet-1" || Object.keys(sheet.cells).length)) ?? [])] };
}
const itemRows = new WeakMap<object, Map<number, string>>();
export function selectedMetradoItem(sheet: SheetData): string | null {
  const row = Number(sheet.currentCell.match(/\d+$/)?.[0]);
  const rows = sheet.template?.rows;
  if (!rows) return null;
  let lookup = itemRows.get(rows);
  if (!lookup) {
    lookup = new Map(Object.entries(rows).map(([key, row]) => [row, (JSON.parse(key) as string[])[1]]));
    itemRows.set(rows, lookup);
  }
  return lookup.get(row) || null;
}

/** Read the edited native worksheet back into the calculator model, without restricting any cell. */
export function readMetradoSheet(sheet: SheetData, state: MetradoState): { items: EstimateItem[]; header: MetradoState["header"]; steelSheetItems?: EstimateItem[] } {
  if (sheet.template?.id === "acero-q7") return readSteelWorksheet(sheet,state);
  const fields = new Map<string, { cell: CellData; row: number }>();
  for (const [address, entry] of Object.entries(sheet.template?.generated ?? {})) {
    const cell = sheet.cells[address];
    if (cell) fields.set(entry.key, { cell, row: Number(address.match(/\d+$/)?.[0]) });
  }
  const get = (kind: string, item: string, line: string, name: string) => fields.get(key(kind, item, line, name));
  const text = (kind: string, item: string, line: string, name: string, fallback: string) => get(kind, item, line, name)?.cell.rawValue ?? fallback;
  const value = (kind: string, item: string, line: string, name: string, fallback: number) => {
    const cell = get(kind, item, line, name)?.cell;
    if (!cell) return fallback;
    const raw = cell.rawValue.startsWith("=") ? cell.displayValue : cell.rawValue;
    const numeric = Number(raw.replace(",", "."));
    return Number.isFinite(numeric) ? numeric : fallback;
  };
  const view: MetradoView = sheet.id === METRADO_SHEETS.acero ? "acero" : "metrado";
  const items = state.items.map((item) => ({
    ...item,
    code: text("item", item.id, "", "code", item.code).toUpperCase(),
    description: text("item", item.id, "", "description", item.description).toUpperCase(),
    unit: text("item", item.id, "", "unit", item.unit),
    measurements: item.measurements.map((line) => {
      if (line.presentation === 'separator') return { ...line, description: text('measurement', item.id, line.id, 'description', line.description) };
      if (!get("measurement", item.id, line.id, "description")) return line;
      const read = (name: string, fallback: number) => value("measurement", item.id, line.id, name, fallback);
      const formulaInputs=line.formulaInputs?.map(input=>({...input,value:text('formulaInput',item.id,line.id,input.id,input.value)}));
      const formulaTemplates={...line.formulaTemplates},inputLinks={...line.inputLinks};
      const formulaTemplateOverrides=[...line.formulaTemplateOverrides??[]];
      if(sheet.template?.explicitInputsVersion)for(const field of new Set([...Object.keys(formulaTemplates),...Object.keys(inputLinks)])){
        const col=fieldColumn(line,field),r=sheet.template.rows[key('measurement',item.id,line.id)];
        if(col&&sheet.cells[col+r]?.rawValue!==sheet.template.generated[col+r]?.rawValue){if(formulaTemplates[field]&&!formulaTemplateOverrides.includes(field))formulaTemplateOverrides.push(field);delete formulaTemplates[field];delete inputLinks[field];}
      }
      const itemUnit = text("item", item.id, "", "unit", item.unit);
      const detailUnit = text("measurement", item.id, line.id, "unit", line.unit);
      const unit = line.pending !== undefined && detailUnit === item.unit && itemUnit !== item.unit ? itemUnit : detailUnit;
      const kind = state.unitCatalog.find((entry) => entry.code === canonicalUnit(unit))?.kind ?? line.kind;
      const columnSection = kind === 'volume' && line.columnSection ? { ...line.columnSection, area: read('columnArea', line.columnSection.area), buriedHeight: read('buriedHeight', line.columnSection.buriedHeight), areaExpression: text('measurement',item.id,line.id,'columnArea',line.columnSection.areaExpression), heightExpression: text('measurement',item.id,line.id,'buriedHeight',line.columnSection.heightExpression) } : undefined;
      const crossSections = kind === 'volume' && line.crossSections ? { ...line.crossSections, expressions: { ...line.crossSections.expressions } } : undefined;
      if (crossSections) for (const name of ['initialArea', 'finalArea', 'meanArea'] as const) {
        const cell = get('measurement', item.id, line.id, name)?.cell;
        if (cell) { crossSections.expressions[name] = cell.rawValue; crossSections[name] = read(name, crossSections[name]); }
      }
      const expressions = { ...line.expressions };
      let formworkSource = kind === 'area' ? line.formworkSource : undefined;
      if (formworkSource) {
        const sourceRow = sheet.template?.rows[key('measurement', formworkSource.itemId, formworkSource.lineId)];
        const manualFields = new Set(formworkSource.manualFields ?? []);
        for (const [field, expected] of Object.entries(formworkLinkedFields(line, sourceRow))) {
          const cell = get('measurement', item.id, line.id, field)?.cell;
          if (cell && cell.rawValue !== expected) manualFields.add(field);
        }
        if (manualFields.size) formworkSource = { ...formworkSource, manualFields: [...manualFields] };
      }
      for (const name of ["similarElements", "length", "width", "height", "repetitions", "manualQuantity"] as const) {
        const cell = get("measurement", item.id, line.id, name)?.cell;
        if (cell) expressions[name] = line.pending !== undefined || cell.rawValue.startsWith("=") ? cell.rawValue : undefined;
      }
      const repetitions = read("repetitions", line.repetitions * line.sign);
      const quantityRow = line.quantitySourceId ? sheet.template?.rows[key('measurement', item.id, line.quantitySourceId)] : undefined;
      const expectedQuantity = quantityRow ? '=F' + quantityRow : '=#REF!';
      const quantitySourceId = line.quantitySourceId && get('measurement',item.id,line.id,'similarElements')?.cell.rawValue === expectedQuantity ? line.quantitySourceId : undefined;
      let surplus = kind === 'volume' ? line.surplus : undefined;
      if (surplus && !surplus.manual) {
        const sources = surplusSources(state.items, line);
        const measured = sources.some(source => source.measurements.some(detail => !detail.pending && !detail.presentation && !detail.referenceOnly));
        const addresses = sources.map(source => sheet.template?.rows[key('item', source.id)]).filter(Boolean).map(row => 'P' + row);
        const expected = measured && addresses.length ? '=SUM(' + addresses.join(',') + ')' : '';
        const raw = get('measurement',item.id,line.id,'length')?.cell.rawValue;
        if (raw?.trim() && raw !== expected) surplus = { ...surplus, manual: true };
      }
      const factorInput=get('formulaInput',item.id,line.id,'swelling')?.cell;
      const swelling = kind !== 'volume' ? undefined : surplus ? { factor: read('swellingFactor',line.swelling?.factor ?? 1), basis: 'inSitu' as const, support: line.swelling?.support ?? 'Factor asignado por el usuario al balance de excedentes.' } : line.swelling&&factorInput ? {...line.swelling,factor:Number(factorInput.displayValue.replace(',','.'))} : line.swelling;
      const surplusInvalid = surplus && (!Number.isFinite(swelling?.factor) || (swelling?.factor ?? 0) < 1 || read('length',line.length) < 0);
      const result = get("measurement", item.id, line.id, "result");
      const resultCol=fieldColumn(line,'result');
      const expectedResult=sheet.template?.explicitInputsVersion&&result&&(formulaTemplates.result||factorInput&&!line.surplus)?sheet.template.generated[resultCol+result.row]?.rawValue:undefined;
      const required = ["similarElements", "repetitions", ...(surplus ? ['length', 'swellingFactor'] : columnSection ? ['columnArea', 'buriedHeight'] : crossSections ? crossSections.method === 'endAreas' ? ['length', 'initialArea', 'finalArea'] : ['length', 'meanArea'] : kind === "units" || kind === "weight" ? ["manualQuantity"] : kind === "length" ? ["length"] : kind === "area" ? ["length", "width"] : ["length", "width", "height"])];
      const factor = appliedSwelling({ kind, swelling });
      const validationResult = result?.cell.rawValue === '#ERROR!' && ((columnSection || crossSections) && line.calculationError?.startsWith('Secciones:') || surplus && line.calculationError?.startsWith('Excedentes:'));
      const manualResult = !validationResult && result?.cell.rawValue.trim() && result.cell.rawValue !== (expectedResult??measurementFormula(kind, result.row, factor, crossSections?.method, Boolean(columnSection), Boolean(line.surplus)));
      const concrete = formworkSource ? state.items.find(item => item.id === formworkSource.itemId)?.measurements.find(detail => detail.id === formworkSource.lineId) : undefined;
      const missingConcrete = formworkSource && (!concrete || concrete.pending || concrete.presentation || concrete.columnSection || concrete.crossSections || concrete.kind !== 'volume' || !['length', 'width', 'height'].every(field => {
        const cell = get('measurement', formworkSource.itemId, formworkSource.lineId, field)?.cell;
        return cell && cell.rawValue.trim() && Number(cell.displayValue.replace(',', '.')) > 0;
      }));
      const pending = line.pending === undefined ? undefined : !unit.trim() || (!manualResult && (Boolean(missingConcrete) || required.some(name => !get("measurement", item.id, line.id, name)?.cell.rawValue.trim())));
      const overridden = !validationResult && kind === line.kind && result && Boolean(result.cell.rawValue) && result.cell.rawValue !== (expectedResult??measurementFormula(kind, result.row, factor, crossSections?.method, Boolean(columnSection), Boolean(line.surplus)));
      const sectionInvalid = columnSection ? [columnSection.area, columnSection.buriedHeight].some(value => !Number.isFinite(value) || value <= 0) : crossSections && (!Number.isFinite(read('length', line.length)) || read('length', line.length) <= 0 || (crossSections.method === 'endAreas' ? [crossSections.initialArea, crossSections.finalArea] : [crossSections.meanArea]).some(area => !Number.isFinite(area) || area < 0));
      return { ...line, unit, kind, formulaInputs, formulaTemplates, formulaTemplateOverrides, inputLinks, formworkSource, quantitySourceId, surplus, columnSection, crossSections, swelling, description: text("measurement", item.id, line.id, "description", line.description), similarElements: read("similarElements", line.similarElements), length: read("length", line.length), width: read("width", line.width), height: read("height", line.height), manualQuantity: read("manualQuantity", line.manualQuantity ?? 1), repetitions: Math.abs(repetitions), sign: (repetitions < 0 ? -1 : 1) as 1 | -1, expressions,
        ...(pending !== undefined ? { pending } : {}),
        resultRaw: overridden ? result.cell.rawValue : undefined, quantityOverride: overridden ? read("result", line.quantityOverride ?? 0) : undefined, calculationError: surplusInvalid && !pending ? 'Excedentes: usa volumen no negativo y factor igual o mayor que 1.' : sectionInvalid && !pending ? columnSection ? 'Secciones: usa área y altura enterrada positivas.' : 'Secciones: usa distancia positiva y áreas no negativas.' : !validationResult && result?.cell.displayValue.startsWith("#") ? result.cell.displayValue : undefined };
    }),
    steelLines: item.steelLines.map((line) => {
      if (!get("steel", item.id, line.id, "description")) return line;
      const read = (name: string, fallback: number) => value("steel", item.id, line.id, name, fallback);
      const hooks = read("hooks", line.hookStart + line.hookEnd), totalSplice = read("spliceTotal", line.splices * line.spliceLength);
      const weight = get("steel", item.id, line.id, "weight");
      const overridden = weight && weight.cell.rawValue !== steelFormula(view, weight.row);
      const mirror = line.weightView && line.weightView !== view && weight?.cell.rawValue === rawNumber(line.weightOverride ?? line.weightKg);
      return { ...line, description: text("steel", item.id, line.id, "description", line.description), bar: text("steel", item.id, line.id, "bar", line.bar),
        similarElements: read("similarElements", line.similarElements), length: read("length", line.length), quantity: read("quantity", line.quantity), kgPerMeter: read("kgPerMeter", line.kgPerMeter),
        hookStart: view === "metrado" && hooks !== line.hookStart + line.hookEnd ? hooks : read("hookStart", line.hookStart), hookEnd: view === "metrado" && hooks !== line.hookStart + line.hookEnd ? 0 : read("hookEnd", line.hookEnd),
        splices: totalSplice ? line.splices || 1 : 0, spliceLength: totalSplice / (line.splices || 1),
        weightKg: read("weight", line.weightKg), weightRaw: mirror ? line.weightRaw : overridden ? weight.cell.rawValue : undefined, weightOverride: mirror ? line.weightOverride : overridden ? read("weight", line.weightKg) : undefined, weightView: mirror ? line.weightView : overridden ? view : undefined,
        calculationError: weight?.cell.displayValue.startsWith("#") ? weight.cell.displayValue : undefined };
    }),
  }));
  const header = { ...state.header };
  for (const name of ["title", "project", "owner", "date", "specialty", "module", "preparedBy", "reviewedBy"] as const) header[name] = text("header", "", "", name, header[name]);
  return { items, header };
}
