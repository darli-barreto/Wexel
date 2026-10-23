import { type CellData, type SheetData, type WorkbookData } from "../../store/useWexelStore";
import { calculateItemTotal, canonicalUnit, type EstimateItem, type MetradoState, type MetradoView } from "../../store/useMetradoStore";
import { processFormula } from "../utils/excel";
import { formatMetradoSheet } from "./formatWorkbook";
import { projectSteelWorksheet, readSteelWorksheet } from "./steelWorkbook";

export const METRADO_WORKBOOK = "Metrados";
export const METRADO_SHEETS: Record<MetradoView, string> = { metrado: "metrados-metrado", acero: "metrados-acero", resumen: "metrados-resumen" };
const columns = Array.from({ length: 26 }, (_, index) => String.fromCharCode(65 + index));
const key = (kind: string, itemId = "", lineId = "", field = "") => JSON.stringify([kind, itemId, lineId, field]);
const rawNumber = (value: number) => Number.isFinite(value) ? String(value) : "#ERROR!";
const pendingItem = (item: EstimateItem) => item.norma && !item.measurements.some(line => !line.pending) && !item.steelLines.length;
export const measurementFormula = (kind: string, row: number) => "=F" + row + "*G" + row + (kind === "area" || kind === "volume" ? "*H" + row : "") + (kind === "volume" ? "*I" + row : "") + "*J" + row;
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
    const raw = typeof rawValue === "number" ? rawNumber(rawValue) : rawValue;
    sheet.cells[address] = { rawValue: raw, displayValue: raw, dependencies: [] };
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
        if (item.kind === "item") {
          const pending = pendingItem(item);
          put("F" + itemRow, pending ? "" : calculateItemTotal(item), key("summary", item.id, "", "quantity"));
          put("G" + itemRow, pending ? "" : state.summaryFactor, key("summary", item.id, "", "factor"));
          put("H" + itemRow, pending ? "" : "=F" + itemRow + "*G" + itemRow, key("summary", item.id, "", "total"));
        }
        continue;
      }
      const totals: string[] = [];
      if (view === "metrado") for (const line of item.measurements) {
        const r = row++;
        sheet.template!.rows[key("measurement", item.id, line.id)] = r;
        if (hidden || state.collapsedItemIds.includes(item.id)) sheet.hiddenRows!.push(String(r));
        const field = (col: string, name: string, value: string | number) => put(col + r, value, key("measurement", item.id, line.id, name));
        field("D", "description", line.description); field("E", "unit", line.unit);
        field("F", "similarElements", line.expressions?.similarElements ?? line.similarElements);
        field("G", line.kind === "units" || line.kind === "weight" ? "manualQuantity" : "length", (line.kind === "units" || line.kind === "weight") ? line.expressions?.manualQuantity ?? line.manualQuantity ?? 1 : line.expressions?.length ?? line.length);
        field("H", "width", line.expressions?.width ?? line.width);
        field("I", "height", line.expressions?.height ?? line.height);
        field("J", "repetitions", line.expressions?.repetitions ?? line.repetitions * line.sign);
        const resultCol = { length: "K", area: "L", volume: "M", weight: "N", units: "O" }[line.kind];
        field(resultCol, "result", line.pending ? "" : line.resultRaw ?? measurementFormula(line.kind, r));
        if (!line.pending && canonicalUnit(line.unit) === canonicalUnit(item.unit)) totals.push(resultCol + r);
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
    }
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
  const translate = (raw: string) => raw.startsWith("=") ? raw.replace(/(\$?[A-Z]+\$?)(\d+)/gi, (_, col: string, r: string) => col + movedRow(Number(r))) : raw;
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
    let rawValue = old && oldCell && (summaryOverride || translate(old.raw) === entry.rawValue || old.raw === entry.rawValue) ? translate(oldCell.rawValue) : entry.rawValue;
    const [kind, , , field] = JSON.parse(entry.key) as string[];
    if (kind === "item" && (field === "code" || field === "description")) rawValue = rawValue.toUpperCase();
    const projected = desired.cells[address];
    // Reuse untouched cells so typing does not invalidate every visible cell and ribbon.
    // Existing user formats win; newly introduced properties (e.g. decimals) still apply.
    cells[address] = oldCell && oldCell.rawValue === rawValue && Object.keys(projected).every(field => field in oldCell)
      ? oldCell : { ...projected, ...oldCell, rawValue, displayValue: rawValue, formula: undefined, dependencies: [] };
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
      if (!get("measurement", item.id, line.id, "description")) return line;
      const read = (name: string, fallback: number) => value("measurement", item.id, line.id, name, fallback);
      const itemUnit = text("item", item.id, "", "unit", item.unit);
      const detailUnit = text("measurement", item.id, line.id, "unit", line.unit);
      const unit = line.pending !== undefined && detailUnit === item.unit && itemUnit !== item.unit ? itemUnit : detailUnit;
      const kind = state.unitCatalog.find((entry) => entry.code === canonicalUnit(unit))?.kind ?? line.kind;
      const expressions = { ...line.expressions };
      for (const name of ["similarElements", "length", "width", "height", "repetitions", "manualQuantity"] as const) {
        const cell = get("measurement", item.id, line.id, name)?.cell;
        if (cell) expressions[name] = line.pending !== undefined || cell.rawValue.startsWith("=") ? cell.rawValue : undefined;
      }
      const repetitions = read("repetitions", line.repetitions * line.sign);
      const result = get("measurement", item.id, line.id, "result");
      const required = ["similarElements", "repetitions", ...(kind === "units" || kind === "weight" ? ["manualQuantity"] : kind === "length" ? ["length"] : kind === "area" ? ["length", "width"] : ["length", "width", "height"])];
      const manualResult = result?.cell.rawValue.trim() && result.cell.rawValue !== measurementFormula(kind, result.row);
      const pending = line.pending === undefined ? undefined : !unit.trim() || (!manualResult && required.some(name => !get("measurement", item.id, line.id, name)?.cell.rawValue.trim()));
      const overridden = kind === line.kind && result && Boolean(result.cell.rawValue) && result.cell.rawValue !== measurementFormula(kind, result.row);
      return { ...line, unit, kind, description: text("measurement", item.id, line.id, "description", line.description), similarElements: read("similarElements", line.similarElements), length: read("length", line.length), width: read("width", line.width), height: read("height", line.height), manualQuantity: read("manualQuantity", line.manualQuantity ?? 1), repetitions: Math.abs(repetitions), sign: (repetitions < 0 ? -1 : 1) as 1 | -1, expressions,
        ...(pending !== undefined ? { pending } : {}),
        resultRaw: overridden ? result.cell.rawValue : undefined, quantityOverride: overridden ? read("result", line.quantityOverride ?? 0) : undefined, calculationError: result?.cell.displayValue.startsWith("#") ? result.cell.displayValue : undefined };
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
