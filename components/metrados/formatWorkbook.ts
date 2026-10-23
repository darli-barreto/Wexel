import type { CellData, SheetData } from "../../store/useWexelStore";
import type { MetradoSnapshot } from "../../store/useMetradoStore";
import { COLORS, PALETTE_SIGNATURE } from "../../config/colors";

export type MetradoAppearance = Pick<MetradoSnapshot, "items" | "tableStyle" | "showFill" | "showFrame">;
export const METRADO_FORMAT_VERSION = 11;
/** Format native cells only. Keep all existing Excel interactions and formulas. */
export function formatMetradoSheet(sheet: SheetData, state: MetradoAppearance, force = false): SheetData {
  if (!sheet.template || (!force && sheet.template.formatVersion === METRADO_FORMAT_VERSION && sheet.template.paletteSignature === PALETTE_SIGNATURE)) return sheet;
  const steel = sheet.id.endsWith("acero");
  const cells = { ...sheet.cells }, widths: Record<string, number> = steel ? { A: 32, B: 20, C: 100, D: 340, E: 42, F: 48, G: 54, H: 54, I: 54, J: 48, K: 52, L: 52, M: 52, N: 52, O: 52, P: 52, Q: 52, R: 52, S: 52, T: 52, U: 54, V: 70, W: 74 } : { A: 56, B: 30, C: 110, D: 380, E: 54, F: 70, G: 72, H: 72, I: 72, J: 72, K: 78, L: 78, M: 78, N: 78, O: 64, P: 86 };
  if(steel){widths.F=55;widths.H=64;widths.J=60;}
  const rowHeights = { ...sheet.rowHeights };
  if (sheet.template.formatVersion === 1) {
    const generatedRows = new Set(Object.keys(sheet.template.generated).map((a) => a.match(/\d+$/)?.[0]));
    for (const row of Object.keys(rowHeights)) {
      const r=Number(row), heading=sheet.id.endsWith("metrado")?1:10;
      const oldDefault = r===heading ? 40 : r>heading ? Math.max(26,Math.max(1,Math.ceil((sheet.cells['D'+row]?.rawValue.length??0)/48))*17+10) : undefined;
      const metadataDefaults=[28,42,59,76,93,110];
      if (generatedRows.has(row) && !sheet.manualRowHeights?.includes(row) && (rowHeights[row]===oldDefault || (r<heading && metadataDefaults.includes(rowHeights[row])))) delete rowHeights[row];
    }
  }
  const levels = COLORS.metrado.levels;
  const rowInfo = new Map(Object.entries(sheet.template.rows).map(([id, row]) => [row, JSON.parse(id) as string[]]));
  const headingRow = 1;
  const lastCol = sheet.id.endsWith("resumen") ? "H" : steel ? "W" : "P";
  const lastIndex = lastCol.charCodeAt(0) - 65;
  const generated = { ...sheet.template.generated };
  const lastRow = Math.max(headingRow, ...Object.values(sheet.template.rows), ...Object.keys(cells).map((a) => Number(a.match(/\d+$/)?.[0]) || 0));
  for (let row = headingRow; row <= lastRow; row++) {
    const info = rowInfo.get(row), item = state.items.find((entry) => entry.id === info?.[1]);
    const isHeading = row === headingRow || (steel && row === 2);
    const isItem = info?.[0] === "item", chapter = isItem && item?.kind === "chapter";
    const level = item?.norma?.level ?? item?.code.split(".").length ?? 1;
    const color = isItem && state.tableStyle === "color" ? levels[Math.min(levels.length - 1, Math.max(0, level - 1))] : state.tableStyle === "blue" && isItem ? COLORS.metrado.blue : COLORS.excel.text;
    const levelIndex = Math.min(levels.length - 1, Math.max(0, level - 1));
    const backgroundColor = !state.showFill ? COLORS.excel.cell : isHeading ? COLORS.metrado.heading : isItem ? COLORS.metrado.levelBackgrounds[levelIndex] ?? (chapter ? COLORS.metrado.chapter : COLORS.metrado.item) : COLORS.excel.cell;
    for (let col = 0; col <= lastIndex; col++) {
      const address = String.fromCharCode(65 + col) + row;
      const cell = cells[address] ?? { rawValue: "", displayValue: "", dependencies: [] };
      const numeric = col >= 5 && Boolean(cell.rawValue) && (cell.rawValue.startsWith("=") || Number.isFinite(Number(cell.rawValue)));
      const countColumn = !sheet.id.endsWith("resumen") && (col === 5 || col === 9);
      const format: Partial<CellData> = { align: (col === 2 || col === 3) && !isHeading ? "left" : "center", verticalAlign: "middle", fontFamily: "Helvetica, sans-serif", fontSize: 9, wrapText: col === 3 || isHeading, bold: isItem || isHeading, color, backgroundColor, borderStyle: "none", ...(numeric ? { decimals: countColumn ? undefined : 2 } : {}) };
      cells[address] = { ...cell, ...format, ...(steel&&row===2?{fontSize:8}: {}) };
      if (isItem && !isHeading) {
        if (col === 3) cells[address].indent = 0;
      }
      if (!generated[address]) generated[address] = { key: JSON.stringify(["format", info?.join(":" ) ?? String(row), "", String(col)]), rawValue: "" };
    }
  }
  return { ...sheet, cells, colWidths: { ...widths, ...sheet.colWidths }, rowHeights, template: { ...sheet.template, generated, formatVersion: METRADO_FORMAT_VERSION, paletteSignature: PALETTE_SIGNATURE } };
}
