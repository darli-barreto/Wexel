import { useWexelStore, type CellData, type CellPosition, type SheetData } from '../../store/useWexelStore';
import { commitEdit } from './excelEditing';
import { formatCellValue } from './cellFormatting';
import { formulaReferences } from './formulaReferences';
import { mergedCells } from './mergedCells';
import { recalculateSheet } from '../metrados/workbook';

export const GRID_CLIPBOARD_TYPE = 'application/x-wexel-cells+json';
export interface CopiedRange { version: 1; origin: CellPosition; cells: CellData[][] }
let lastCopy: { text: string; range: CopiedRange } | undefined;
const emptyCell = (): CellData => ({ rawValue: '', displayValue: '', dependencies: [] });
const bounds = (sheet: SheetData) => {
  const start = sheet.selectedCell ?? { row: Number(sheet.currentCell.match(/\d+$/)?.[0] ?? 1) - 1, col: sheet.currentCell.charCodeAt(0) - 65 };
  const end = sheet.selectionEnd ?? start;
  return { top: Math.min(start.row, end.row), bottom: Math.max(start.row, end.row), left: Math.min(start.col, end.col), right: Math.max(start.col, end.col) };
};
const field = (text: string) => /[\t\r\n"]/.test(text) ? '"' + text.replaceAll('"', '""') + '"' : text;
export function copyCellRange(sheet: SheetData) {
  const { top, bottom, left, right } = bounds(sheet);
  const cells: CellData[][] = [];
  for (let row = top; row <= bottom; row++) {
    const line: CellData[] = [];
    for (let col = left; col <= right; col++) line.push({ ...(sheet.cells[String.fromCharCode(65 + col) + (row + 1)] ?? emptyCell()), dependencies: [] });
    cells.push(line);
  }
  const range: CopiedRange = { version: 1, origin: { row: top, col: left }, cells };
  const text = cells.map(line => line.map(cell => field(formatCellValue(cell))).join('\t')).join('\r\n');
  lastCopy = { text, range };
  return { text, range };
}

/** TSV from Excel/Sheets, including quoted tabs, newlines, and empty cells. */
export function parseClipboardTable(text: string): string[][] {
  const rows: string[][] = [], row: string[] = [];
  let current = '', quoted = false;
  for (let index = 0; index < text.length; index++) {
    const char = text[index];
    if (char === '"' && (quoted || current === '')) {
      if (quoted && text[index + 1] === '"') { current += '"'; index++; } else quoted = !quoted;
    } else if (!quoted && (char === '\t' || char === '\n' || char === '\r')) {
      row.push(current); current = '';
      if (char !== '\t') { rows.push([...row]); row.length = 0; if (char === '\r' && text[index + 1] === '\n') index++; }
    } else current += char;
  }
  if (current || row.length || !rows.length) { row.push(current); rows.push([...row]); }
  const width = Math.max(...rows.map(line => line.length));
  return rows.map(line => Array.from({ length: width }, (_, col) => line[col] ?? ''));
}

export function moveCopiedFormula(raw: string, rowDelta: number, colDelta: number) {
  let translated = raw;
  for (const reference of formulaReferences(raw).reverse()) {
    const value = reference.text.replace(/(\$?)([A-Z]+)(\$?)(\d+)/gi, (_, absoluteCol: string, letters: string, absoluteRow: string, row: string) => {
      let col = 0;
      for (const char of letters.toUpperCase()) col = col * 26 + char.charCodeAt(0) - 64;
      col += absoluteCol ? 0 : colDelta;
      const nextRow = Number(row) + (absoluteRow ? 0 : rowDelta);
      if (col < 1 || nextRow < 1) return '#REF!';
      let nextCol = '';
      while (col) { col--; nextCol = String.fromCharCode(65 + col % 26) + nextCol; col = Math.floor(col / 26); }
      return absoluteCol + nextCol + absoluteRow + nextRow;
    });
    translated = translated.slice(0, reference.start) + value + translated.slice(reference.end);
  }
  return translated;
}

function readRange(data: string): CopiedRange | undefined {
  try {
    const value = JSON.parse(data) as CopiedRange;
    if (value.version !== 1 || !Number.isInteger(value.origin?.row) || !Number.isInteger(value.origin?.col) || !Array.isArray(value.cells) || !value.cells.length || !value.cells[0].length) return;
    const width = value.cells[0].length;
    if (width > 26 || value.cells.some(row => !Array.isArray(row) || row.length !== width || row.some(cell => typeof cell?.rawValue !== 'string'))) return;
    return value;
  } catch { return; }
}

/** Write the whole rectangle in one update, then synchronize/recalculate once. */
export function pasteCellRange(text: string, encoded = '', plain = false) {
  commitEdit();
  const store = useWexelStore.getState(), sheet = store.sheets.find(entry => entry.id === store.activeSheetId)!;
  const copied = plain ? undefined : readRange(encoded) ?? (lastCopy?.text === text ? lastCopy.range : undefined);
  const source = copied?.cells ?? parseClipboardTable(text).map(row => row.map(rawValue => ({ ...emptyCell(), rawValue, displayValue: rawValue })));
  const { top, bottom, left, right } = bounds(sheet);
  const sourceHeight = source.length, sourceWidth = source[0].length;
  const fillSelection = (bottom - top + 1) % sourceHeight === 0 && (right - left + 1) % sourceWidth === 0;
  const height = fillSelection ? bottom - top + 1 : sourceHeight, width = fillSelection ? right - left + 1 : sourceWidth;
  if (left + width > 26) throw new Error('El rango no cabe desde esa columna. Selecciona una celda más a la izquierda.');
  const merges = mergedCells(sheet.merges);
  for (let row = 0; row < height; row++) for (let col = 0; col < width; col++) {
    const merge = merges?.get(String.fromCharCode(65 + left + col) + (top + row + 1));
    if (merge && (merge.hidden || merge.colSpan > 1 || merge.rowSpan > 1)) throw new Error('Pega el rango en celdas sin combinar.');
  }
  store.updateSheet(sheet.id, current => {
    const cells = { ...current.cells };
    for (let row = 0; row < height; row++) for (let col = 0; col < width; col++) {
      const sourceRow = row % sourceHeight, sourceCol = col % sourceWidth;
      const cell = source[sourceRow][sourceCol], address = String.fromCharCode(65 + left + col) + (top + row + 1);
      let rawValue = copied ? moveCopiedFormula(cell.rawValue, top + row - copied.origin.row - sourceRow, left + col - copied.origin.col - sourceCol) : cell.rawValue;
      const binding = current.template?.generated[address];
      if (binding) {
        const [kind, , , name] = JSON.parse(binding.key) as string[];
        if (kind === 'item' && (name === 'code' || name === 'description')) rawValue = rawValue.toUpperCase();
      }
      cells[address] = { ...cells[address], ...(copied ? cell : {}), rawValue, displayValue: rawValue, formula: rawValue.startsWith('=') ? rawValue : undefined, dependencies: [] };
    }
    const currentCell = String.fromCharCode(65 + left) + (top + 1);
    return recalculateSheet({ ...current, cells, currentCell, selectedCell: { row: top, col: left }, selectionEnd: height > 1 || width > 1 ? { row: top + height - 1, col: left + width - 1 } : undefined, selectionMode: 'cells', formulaInput: cells[currentCell].rawValue });
  });
}
