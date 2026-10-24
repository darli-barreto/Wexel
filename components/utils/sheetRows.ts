import type { CellData, SheetData } from '../../store/useWexelStore';
import { formulaReferences } from './formulaReferences';

/** Remove complete rows, including notes, sizing, bindings and references. Rows are 1-based. */
export function removeSheetRows(sheet: SheetData, removed: ReadonlySet<number>): SheetData {
  const deleted = [...removed].sort((a, b) => a - b);
  if (!deleted.length) return sheet;
  const move = (row: number) => {
    let low = 0, high = deleted.length;
    while (low < high) { const middle = (low + high) >>> 1; if (deleted[middle] < row) low = middle + 1; else high = middle; }
    return row - low;
  };
  const address = (value: string) => value.replace(/\d+$/, row => String(move(Number(row))));
  const translate = (raw: string) => {
    let result = raw;
    for (const ref of formulaReferences(raw).reverse()) {
      const parts = ref.text.split(/\s*:\s*/);
      let replacement: string;
      if (parts.length === 1) replacement = removed.has(ref.from.row + 1) ? '#REF!' : address(parts[0]);
      else {
        const low = Math.min(ref.from.row, ref.to.row) + 1, high = Math.max(ref.from.row, ref.to.row) + 1;
        let first = low, last = high;
        while (first <= last && removed.has(first)) first++;
        while (last >= first && removed.has(last)) last--;
        const ascending = ref.from.row <= ref.to.row;
        replacement = first > last ? '#REF!' :
          parts[0].replace(/\d+$/, String(move(ascending ? first : last))) + ':' +
          parts[1].replace(/\d+$/, String(move(ascending ? last : first)));
      }
      result = result.slice(0, ref.start) + replacement + result.slice(ref.end);
    }
    return result;
  };
  const cells: Record<string, CellData> = {};
  for (const [key, cell] of Object.entries(sheet.cells)) {
    if (removed.has(Number(key.match(/\d+$/)?.[0]))) continue;
    const rawValue = translate(cell.rawValue);
    cells[address(key)] = { ...cell, rawValue, formula: rawValue.startsWith('=') ? rawValue : undefined, dependencies: [] };
  }
  const rowHeights: Record<string, number> = {};
  for (const [row, height] of Object.entries(sheet.rowHeights)) if (!removed.has(Number(row))) rowHeights[move(Number(row))] = height;
  const merges = sheet.merges?.flatMap(range => {
    const [start, end = start] = range.split(':');
    let first = Number(start.match(/\d+$/)![0]), last = Number(end.match(/\d+$/)![0]);
    while (first <= last && removed.has(first)) first++;
    while (last >= first && removed.has(last)) last--;
    return first > last ? [] : [start.replace(/\d+$/, String(move(first))) + ':' + end.replace(/\d+$/, String(move(last)))];
  });
  const template = sheet.template && { ...sheet.template,
    rows: Object.fromEntries(Object.entries(sheet.template.rows).filter(([, row]) => !removed.has(row)).map(([key, row]) => [key, move(row)])),
    generated: Object.fromEntries(Object.entries(sheet.template.generated).filter(([key]) => !removed.has(Number(key.match(/\d+$/)?.[0]))).map(([key, entry]) => [address(key), { ...entry, rawValue: translate(entry.rawValue) }])),
  };
  const row = Math.max(sheet.template ? (sheet.id === 'metrados-acero' ? 2 : 1) : 0, move(deleted[0]) - 1);
  const selectedCell = { row, col: sheet.selectedCell?.col ?? 0 };
  const currentCell = String.fromCharCode(65 + selectedCell.col) + (row + 1);
  return { ...sheet, cells, template, rowHeights, merges,
    manualRowHeights: sheet.manualRowHeights?.filter(row => !removed.has(Number(row))).map(row => String(move(Number(row)))),
    hiddenRows: sheet.hiddenRows?.filter(row => !removed.has(Number(row))).map(row => String(move(Number(row)))),
    selectedCell, currentCell, selectionEnd: undefined, selectionMode: 'cells', formulaInput: cells[currentCell]?.rawValue ?? '' };
}
