import type { CellData, SheetData } from "../../store/useWexelStore";
import { mergedCells } from './mergedCells';

export const COMPACT_ROW_HEIGHT = 21;
type RowSheet = Pick<SheetData,"cells"|"rowHeights"|"colWidths"|"hiddenRows"|"merges">;
const wrappedHeights = new WeakMap<CellData, { width: number; rowSpan: number; height: number }>();
/** Estimate wrapped text using the same 12px Helvetica / 16px line-height as the grid. */
export function rowHeight(sheet: RowSheet, row: string): number {
  if (sheet.rowHeights[row]) return Math.max(18, sheet.rowHeights[row]);
  let height = COMPACT_ROW_HEIGHT;
  const merges=mergedCells(sheet.merges);
  for (let col = 0; col < 26; col++) {
    const c = String.fromCharCode(65 + col), cell = sheet.cells[c + row];
    const merge=merges?.get(c+row);
    if (merge?.hidden || !cell?.wrapText || !cell.rawValue) continue;
    let combinedWidth=0;
    for(let offset=0;offset<(merge?.colSpan??1);offset++)combinedWidth+=sheet.colWidths[String.fromCharCode(65+col+offset)]??100;
    const width = Math.max(12, combinedWidth - 18 - (cell.indent ?? 0) * 12);
    const rowSpan = merge?.rowSpan ?? 1;
    const cached = wrappedHeights.get(cell);
    if (cached?.width === width && cached.rowSpan === rowSpan) { height = Math.max(height, cached.height); continue; }
    const size = (cell.fontSize ?? 9) / 9;
    let lines = 0;
    for (const paragraph of (cell.rawValue.startsWith("=") ? cell.displayValue : cell.rawValue).split("\n")) {
      let used = 0; lines++;
      for (const word of paragraph.split(/(\s+)/)) {
        const pixels = [...word].reduce((n, char) => n + (/[ilI.,' :]/.test(char) ? 2.8 : /[MW@]/.test(char) ? 9 : /[A-Z]/.test(char) ? 7 : 5.8), 0) * size;
        if (used && used + pixels > width) { lines++; used = 0; }
        if (pixels > width) { lines += Math.ceil(pixels / width) - 1; used = pixels % width; } else used += pixels;
      }
    }
    const wrappedHeight = Math.ceil((lines * 16 * size + 2) / rowSpan);
    wrappedHeights.set(cell, { width, rowSpan, height: wrappedHeight });
    height = Math.max(height, wrappedHeight);
  }
  return height;
}
export interface VirtualRow { row: string; index: number; top: number; height: number }
const layouts = new WeakMap<RowSheet["cells"], { columns: RowSheet["colWidths"]; heights: RowSheet["rowHeights"]; hidden: RowSheet["hiddenRows"]; merges: RowSheet["merges"]; rows: string[]; layout: VirtualRow[] }>();
export function layoutRows(sheet: RowSheet, rows: string[]): VirtualRow[] {
  const cached = layouts.get(sheet.cells);
  if (cached && cached.columns === sheet.colWidths && cached.heights === sheet.rowHeights && cached.hidden === sheet.hiddenRows && cached.merges === sheet.merges && (cached.rows === rows || (cached.rows.length === rows.length && cached.rows.every((row, i) => row === rows[i])))) return cached.layout;
  const hidden = new Set(sheet.hiddenRows), result: VirtualRow[] = [];
  let top = 0;
  for (let index = 0; index < rows.length; index++) if (!hidden.has(rows[index])) {
    const height = rowHeight(sheet, rows[index]);
    result.push({ row: rows[index], index, top, height }); top += height;
  }
  layouts.set(sheet.cells, { columns: sheet.colWidths, heights: sheet.rowHeights, hidden: sheet.hiddenRows, merges: sheet.merges, rows, layout: result });
  return result;
}
export function visibleRows(rows: VirtualRow[], scrollTop: number, height: number, overscan = 8) {
  let low = 0, high = rows.length;
  while (low < high) { const mid = (low + high) >>> 1; if (rows[mid].top + rows[mid].height < scrollTop) low = mid + 1; else high = mid; }
  const start = Math.max(0, low - overscan);
  let end = low; while (end < rows.length && rows[end].top < scrollTop + height) end++;
  end = Math.min(rows.length, end + overscan);
  const total = rows.length ? rows.at(-1)!.top + rows.at(-1)!.height : 0;
  return { rows: rows.slice(start, end), before: rows[start]?.top ?? 0, after: total - (rows[end - 1] ? rows[end - 1].top + rows[end - 1].height : 0) };
}
