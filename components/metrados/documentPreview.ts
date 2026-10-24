import type { CellData, WorkbookData } from '../../store/useWexelStore';
import type { MetradoHeader, MetradoState } from '../../store/useMetradoStore';
import { mergeMetradoWorkbook, projectMetrado } from './workbook';
import { mergedCells } from '../utils/mergedCells';
import { formatCellValue } from '../utils/cellFormatting';
import { swellingNote } from './measurementGuidance';
import { crossSectionNote } from './crossSections';
import { surplusNote } from './surplusBalance';

export const REPORT_WIDTH = 1123, REPORT_HEIGHT = 794, REPORT_MARGIN = 40;
const CONTENT_WIDTH = REPORT_WIDTH - REPORT_MARGIN * 2;
export interface ReportCell { text: string; col: number; span: number; rowSpan: number; align: 'left' | 'center' | 'right'; bold: boolean; italic?: boolean; underline?: boolean; strike?: boolean; color: string; background: string }
export interface ReportRow { sourceRow: number; cells: ReportCell[]; height: number; keepNext: boolean }
export interface ReportPage { sheet: string; label: string; columns: Array<{ col: number; width: number }>; headings: ReportRow[]; rows: ReportRow[]; sectionPage: number }
export interface MetradoReport { header: MetradoHeader; headerHeight: number; pages: ReportPage[]; wordCount: number }
export const reportMetadata = (header: MetradoHeader) => [
  ['Proyecto', header.project], ['Propietario', header.owner], ['Especialidad', header.specialty], ['Módulo', header.module],
  ['Fecha', header.date], ['Hecho por', header.preparedBy], ['Revisado por', header.reviewedBy],
];
export type MeasureText = (text: string, bold: boolean, size: number) => number;
const estimateText: MeasureText = (text, bold, size) => text.length * size * (bold ? .58 : .54);
function lineCount(text: string, width: number, measure: MeasureText, bold: boolean, size: number): number {
  let count = 0;
  for (const paragraph of text.split('\n')) {
    let used = 0; count++;
    for (const word of paragraph.split(/(\s+)/)) {
      const length = measure(word, bold, size);
      if (used && used + length > width) { count++; used = 0; }
      if (length > width) { count += Math.ceil(length / width) - 1; used = length % width; } else used += length;
    }
  }
  return count;
}

/** A read-only snapshot of native calculated cells, never a second calculation engine. */
export function buildMetradoReport(state: MetradoState, workbook?: WorkbookData, measure: MeasureText = estimateText): MetradoReport {
  // The report includes the complete hierarchy and a summary even when the grid is collapsed/hidden.
  const snapshot = { ...state, summaryVisible: true, collapsedItemIds: [] };
  const sheets = mergeMetradoWorkbook(workbook, projectMetrado(snapshot), snapshot.view).sheets;
  const header = { ...state.header }, metadata = reportMetadata(header);
  let metadataLines = 0;
  for (let i = 0; i < metadata.length; i += 2) metadataLines += Math.max(...metadata.slice(i, i + 2).map(([label, value]) => lineCount(`${label}: ${value || '—'}`, CONTENT_WIDTH / 2 - 8, measure, false, 10)));
  const headerHeight = lineCount(header.title || 'METRADOS', CONTENT_WIDTH, measure, true, 14) * 18 + 16 + 16 + metadataLines * 14 + 12 + 10;
  const pages: ReportPage[] = [];
  const itemsById = new Map(state.items.map(item => [item.id, item]));
  for (const view of ['metrado', 'acero', 'resumen'] as const) {
    const sheet = sheets.find(entry => entry.id === `metrados-${view}`)!;
    const headingCount = view === 'acero' ? 2 : 1;
    const labels = { metrado: 'HOJA DE METRADOS', acero: 'HOJA DE METRADO DE ACERO', resumen: 'RESUMEN DE METRADOS' };
    const nonempty = Object.entries(sheet.cells).filter(([, cell]) => cell.rawValue.trim());
    const lastRow = Math.max(headingCount, ...nonempty.map(([address]) => Number(address.match(/\d+$/)![0])));
    const lastCol = Math.max(view === 'acero' ? 22 : view === 'resumen' ? 7 : 15, ...nonempty.map(([address]) => address.charCodeAt(0) - 65));
    const columns = Array.from({ length: lastCol + 1 }, (_, col) => col).filter(col => {
      if (col !== 1 && !(view === 'acero' && col === 0)) return true;
      return nonempty.some(([address]) => address.charCodeAt(0) - 65 === col);
    }).map(col => ({ col, width: sheet.colWidths[String.fromCharCode(65 + col)] ?? 80 }));
    const totalWidth = columns.reduce((sum, col) => sum + col.width, 0);
    for (const column of columns) column.width = column.width / totalWidth * CONTENT_WIDTH;
    const merges = mergedCells(sheet.merges);
    const rowInfo = new Map(Object.entries(sheet.template?.rows ?? {}).map(([key, row]) => [row, JSON.parse(key) as string[]]));
    const makeRow = (row: number): ReportRow => {
      const cells: ReportCell[] = [];
      let height = 18;
      for (const column of columns) {
        const address = String.fromCharCode(65 + column.col) + row, merge = merges?.get(address);
        if (merge?.hidden) continue;
        const cell: CellData | undefined = sheet.cells[address];
        const spanColumns = columns.filter(other => other.col >= column.col && other.col < column.col + (merge?.colSpan ?? 1));
        let text = cell ? formatCellValue(cell) : '';
        const info = rowInfo.get(row);
        if (view === 'metrado' && column.col === 3 && info?.[0] === 'item' && itemsById.get(info[1])?.cleanupAreaTemplateVersion) text += '\nTotal: área de intervención de referencia en m²; no constituye otra partida cobrable.';
        if (view === 'metrado' && column.col === 3 && info?.[0] === 'measurement') {
          const line = itemsById.get(info[1])?.measurements.find(line => line.id === info[2]);
          const note = line ? [surplusNote(line), crossSectionNote(line), swellingNote(line)].filter(Boolean).join('\n') : '';
          if (note) text += '\n' + note;
        }
        const rowSpan = merge?.rowSpan ?? 1;
        const width = Math.max(8, spanColumns.reduce((sum, col) => sum + col.width, 0) - 9);
        height = Math.max(height, Math.ceil((lineCount(text, width, measure, Boolean(cell?.bold), 28 / 3) * 12 + 5) / rowSpan));
        cells.push({ text, col: column.col, span: spanColumns.length, rowSpan,
          align: cell?.align ?? (column.col === 2 || column.col === 3 ? 'left' : 'center'),
          bold: Boolean(cell?.bold), italic: cell?.italic, underline: cell?.underline, strike: cell?.strikethrough, color: cell?.color ?? '#374151', background: cell?.input ? '#ffffff' : cell?.backgroundColor ?? '#ffffff' });
      }
      return { sourceRow: row, cells, height, keepNext: ['item', 'sectionHeader'].includes(rowInfo.get(row)?.[0] ?? '') };
    };
    const headings = Array.from({ length: headingCount }, (_, i) => makeRow(i + 1));
    const budget = REPORT_HEIGHT - REPORT_MARGIN * 2 - headerHeight - 24 - headings.reduce((sum, row) => sum + row.height, 0) - 4;
    let rows: ReportRow[] = [], used = 0, sectionPage = 1;
    const push = () => { pages.push({ sheet: view, label: labels[view], columns, headings, rows, sectionPage: sectionPage++ }); rows = []; used = 0; };
    const body = Array.from({ length: lastRow - headingCount }, (_, i) => makeRow(i + headingCount + 1));
    for (let index = 0; index < body.length; index++) {
      const row = body[index], next = body[index + 1];
      const needed = row.height + (row.keepNext && next ? next.height : 0);
      if (rows.length && used + needed > budget) push();
      rows.push(row); used += row.height;
    }
    if (rows.length || sectionPage === 1) push();
  }
  return { header, headerHeight, pages, wordCount: pages.reduce((sum, page) => sum + page.rows.reduce((n, row) => n + row.cells.reduce((v, cell) => v + (cell.text.trim() ? cell.text.trim().split(/\s+/).length : 0), 0), 0), 0) };
}
