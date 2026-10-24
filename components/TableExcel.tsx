import React, { Profiler, useEffect, useRef, useMemo, useState, type RefObject } from 'react';
import { useGridProfile } from './utils/useGridProfile';
import { layoutRows, visibleRows } from './utils/virtualRows';
import { useWexelStore, DEFAULT_COLUMN_WIDTH, type CellPosition } from '@/store/useWexelStore';
import { useExcelEditingStore } from '@/store/useExcelEditingStore';
export type { CellData } from '@/store/useWexelStore';
import { commitEdit, changeDraft, cellAddress } from './utils/excelEditing';
import { useExcelResize } from './utils/useExcelResize';
import TableHeaderExcel, { EXCEL_COLUMN_HEADER_HEIGHT } from './TableHeaderExcel';
import TableRowExcel from './TableRowExcel';
import { axisSelection } from './utils/gridSelection';
import { copyCellRange, pasteCellRange, GRID_CLIPBOARD_TYPE } from './utils/gridClipboard';
interface Props {
    scrollRef: RefObject<HTMLDivElement | null>;
    columns: string[];
    rows: string[];
    selectedCell: CellPosition | null;
    setSelectedCell: (cell: CellPosition | null) => void;
    formulaInput: string;
    setFormulaInput: (value: string) => void;
}
type Input = HTMLInputElement | HTMLTextAreaElement;
export default function TableExcel({ columns, rows, setSelectedCell, scrollRef }: Props) {
    const { target: profileTarget, onRender } = useGridProfile();
    const sheet = useWexelStore(s => s.sheets.find(sheet => sheet.id === s.activeSheetId)!);
    const resize = useExcelResize(sheet.id);
    const [viewport, setViewport] = useState({ top: 0, height: 700 });
    const [clipboardError, setClipboardError] = useState('');
    const {cells,colWidths,rowHeights,hiddenRows,merges}=sheet;
    const layout = useMemo(() => layoutRows({cells,colWidths,rowHeights,hiddenRows,merges}, rows), [cells,colWidths,rowHeights,hiddenRows,merges,rows]);
    // Keep template headings mounted outside the virtual window; blank sheets scroll normally.
    const frozenCount = sheet.template ? (sheet.id === 'metrados-acero' ? 2 : 1) : 0;
    const frozenRows = useMemo(() => layout.filter(entry => entry.index < frozenCount), [layout, frozenCount]);
    const bodyRows = useMemo(() => layout.filter(entry => entry.index >= frozenCount), [layout, frozenCount]);
    const frozenHeight = frozenRows.reduce((total, entry) => total + entry.height, 0);
    const gridHeadingHeight = 32 + EXCEL_COLUMN_HEADER_HEIGHT;
    const windowed = visibleRows(bodyRows, viewport.top, viewport.height);
    useEffect(() => {
        const container = scrollRef.current; if (!container) return;
        let frame = 0;
        const measure = () => { frame = 0; const top = Math.max(0, container.scrollTop), height = container.clientHeight; setViewport(previous => previous.top === top && previous.height === height ? previous : { top, height }); };
        const scroll = () => { if (!frame) frame = requestAnimationFrame(measure); };
        container.addEventListener('scroll', scroll, { passive: true });
        const observer = new ResizeObserver(scroll); observer.observe(container); scroll();
        return () => { cancelAnimationFrame(frame); observer.disconnect(); container.removeEventListener('scroll', scroll); };
    }, [scrollRef]);
    useEffect(() => {
        const container = scrollRef.current;
        const current = sheet.selectedCell ? layout.find((entry) => entry.index === sheet.selectedCell!.row) : undefined;
        if (!container || !current || current.index < frozenCount) return;
        const top = current.top + gridHeadingHeight, bottom = top + current.height;
        if (top < container.scrollTop + gridHeadingHeight + frozenHeight) container.scrollTop = Math.max(0, current.top - frozenHeight);
        else if (bottom > container.scrollTop + container.clientHeight) container.scrollTop = bottom - container.clientHeight;
    }, [sheet.id, sheet.selectedCell, layout, scrollRef, frozenCount, frozenHeight, gridHeadingHeight]);
    const drag = useRef<{
        anchor: CellPosition;
        input?: Input;
        before?: string;
        after?: string;
        axis?: 'row' | 'column' | 'all';
    } | null>(null);
    const last = useRef<{
        input: Input;
        start: number;
        end: number;
        text: string;
    } | null>(null);
    const suppress = useRef(false);
    useEffect(() => { const up = () => { drag.current = null; }; window.addEventListener('mouseup', up); window.addEventListener('blur', up); return () => { window.removeEventListener('mouseup', up); window.removeEventListener('blur', up); }; }, []);
    const point = (target: EventTarget) => { const td = (target as HTMLElement).closest<HTMLElement>('[data-cell-address]'); return td ? { row: Number(td.dataset.row), col: Number(td.dataset.col) } : null; };
    const insert = (position: CellPosition) => {
        const current = drag.current;
        if (!current?.input)
            return;
        const reference = cellAddress(current.anchor) + (current.anchor.row === position.row && current.anchor.col === position.col ? '' : ':' + cellAddress(position));
        const before = current.before ?? '', after = current.after ?? '';
        changeDraft(before + reference + after);
        last.current = { input: current.input, start: before.length, end: before.length + reference.length, text: reference };
        const input = current.input;
        requestAnimationFrame(() => { if (input.isConnected) {
            input.focus();
            input.setSelectionRange(before.length + reference.length, before.length + reference.length);
        } });
    };
    const grid = <div ref={profileTarget} className="border-x border-gray-300" onCopyCapture={event => {
            if ((event.target as HTMLElement).closest('[data-detail-picker]')) return;
            if (useExcelEditingStore.getState().draft?.caretMode) return;
            commitEdit();
            const current = useWexelStore.getState().sheets.find(entry => entry.id === sheet.id)!;
            const { text, range } = copyCellRange(current);
            event.preventDefault();
            event.clipboardData.setData('text/plain', text);
            event.clipboardData.setData(GRID_CLIPBOARD_TYPE, JSON.stringify(range));
        }} onPasteCapture={event => {
            if ((event.target as HTMLElement).closest('[data-detail-picker]')) return;
            if (useExcelEditingStore.getState().draft?.caretMode) return;
            if (!event.clipboardData.types.includes('text/plain') && !event.clipboardData.types.includes(GRID_CLIPBOARD_TYPE)) return;
            event.preventDefault();
            try {
                pasteCellRange(event.clipboardData.getData('text/plain'), event.clipboardData.getData(GRID_CLIPBOARD_TYPE));
                setClipboardError('');
            } catch (error) { setClipboardError(error instanceof Error ? error.message : 'No se pudo pegar el rango.'); }
        }} onMouseDownCapture={e => {
            if ((e.target as HTMLElement).closest('[data-detail-picker]')) return;
            if (e.button !== 0)
                return;
            const target = e.target as HTMLElement;
            const heading = target.closest<HTMLElement>('[data-selection-axis]');
            if (heading && !target.closest('[data-excel-resize]')) {
                e.preventDefault();
                commitEdit();
                const axis = heading.dataset.selectionAxis as 'row' | 'column' | 'all';
                const index = Number(heading.dataset.selectionIndex);
                const current = useWexelStore.getState().sheets.find(entry => entry.id === sheet.id)!;
                const patch = axisSelection(current, axis, index, rows.length, columns.length, e.shiftKey);
                useWexelStore.getState().updateSheet(sheet.id, s => ({ ...s, ...patch }));
                drag.current = { anchor: patch.selectedCell!, axis };
                suppress.current = true;
                return;
            }
            const position = point(e.target);
            if (!position)
                return;
            const input = document.activeElement, draft = useExcelEditingStore.getState().draft;
            suppress.current = false;
            if ((input instanceof HTMLInputElement || input instanceof HTMLTextAreaElement) && input.dataset.excelInput === 'true' && draft?.sheetId === sheet.id && draft.value.startsWith('=') && cellAddress(position) !== draft.address) {
                e.preventDefault();
                suppress.current = true;
                let start = input.selectionStart ?? draft.value.length;
                const end = input.selectionEnd ?? start;
                if (last.current?.input === input && start === last.current.end && end === start && draft.value.slice(last.current.start, last.current.end) === last.current.text)
                    start = last.current.start;
                start = Math.max(1, start);
                drag.current = { anchor: position, input, before: draft.value.slice(0, start), after: draft.value.slice(end) };
                insert(position);
                return;
            }
            if ((e.target as HTMLElement).dataset.excelInput === 'true' && draft?.caretMode)
                return;
            e.preventDefault();
            suppress.current = true;
            commitEdit();
            last.current = null;
            const anchor = e.shiftKey && sheet.selectedCell ? sheet.selectedCell : position;
            if (!e.shiftKey || !sheet.selectedCell)
                setSelectedCell(position);
            if (e.shiftKey) useWexelStore.getState().updateSheet(sheet.id, s => ({ ...s, selectionEnd: position, selectionMode: 'cells' }));
            drag.current = { anchor };
            // A newly selected editor focuses on mount. Only reuse the existing editor here.
            if (sheet.selectedCell?.row === anchor.row && sheet.selectedCell.col === anchor.col) {
                const editor = document.querySelector<HTMLInputElement | HTMLTextAreaElement>('[aria-label="Celda ' + cellAddress(anchor) + '"]');
                editor?.focus({ preventScroll: true });
                if (editor) editor.setSelectionRange(editor.value.length, editor.value.length);
            }
        }} onMouseOver={e => {
            const axisDrag = drag.current;
            if (axisDrag?.axis) {
                const heading = (e.target as HTMLElement).closest<HTMLElement>('[data-selection-axis]');
                if (heading?.dataset.selectionAxis !== axisDrag.axis || axisDrag.axis === 'all') return;
                const index = Number(heading.dataset.selectionIndex);
                useWexelStore.getState().updateSheet(sheet.id, s => {
                    if ((axisDrag.axis === 'row' ? s.selectionEnd?.row : s.selectionEnd?.col) === index) return s;
                    return { ...s, ...axisSelection(s, axisDrag.axis!, index, rows.length, columns.length, true) };
                });
                return;
            }
            const current = drag.current, position = point(e.target);
            if (!current || !position)
                return;
            if (current.input)
                insert(position);
            else
                useWexelStore.getState().updateSheet(sheet.id, s =>
                    (!s.selectionEnd && current.anchor.row === position.row && current.anchor.col === position.col) ||
                    (s.selectionEnd?.row === position.row && s.selectionEnd.col === position.col) ? s : ({ ...s, selectionEnd: position }));
        }} onClickCapture={e => { if ((e.target as HTMLElement).closest('[data-detail-picker]')) return; if (suppress.current) {
        e.stopPropagation();
        suppress.current = false;
    } }}>
  <table className="w-full" style={{ tableLayout: 'fixed', width: 40 + columns.reduce((total, col) => total + (sheet.colWidths[col] ?? DEFAULT_COLUMN_WIDTH), 0) }}>
   <colgroup><col style={{ width: 40 }}/>{columns.map(col => <col key={col} style={{ width: sheet.colWidths[col] ?? DEFAULT_COLUMN_WIDTH }}/>)}</colgroup>
   <TableHeaderExcel columns={columns} startResize={resize} selectedCell={sheet.selectedCell} selectionEnd={sheet.selectionEnd}/>
   <tbody>
    {frozenRows.map(({ row, index, height, top }) => <TableRowExcel key={sheet.id + ':' + row} row={row} rowIdx={index} height={height} stickyTop={gridHeadingHeight + top} sheet={sheet} columns={columns} startResize={resize} select={setSelectedCell} rowCount={rows.length}/>)}
    {windowed.before > frozenHeight && <tr aria-hidden="true"><td colSpan={columns.length + 1} style={{ height: windowed.before - frozenHeight, padding: 0, border: 0 }}/></tr>}
    {windowed.rows.map(({ row, index, height }) => <TableRowExcel key={sheet.id + ':' + row} row={row} rowIdx={index} height={height} sheet={sheet} columns={columns} startResize={resize} select={setSelectedCell} rowCount={rows.length}/>)}
    {windowed.after > 0 && <tr aria-hidden="true"><td colSpan={columns.length + 1} style={{ height: windowed.after, padding: 0, border: 0 }}/></tr>}
   </tbody>
  </table>
  {clipboardError && <p role="alert" className="fixed bottom-9 left-4 z-40 border border-[#d0d0d0] bg-white px-3 py-2 text-xs text-[#b42318]">{clipboardError}<button className="ml-3 underline" onClick={() => setClipboardError('')}>Cerrar</button></p>}
 </div>;
    return process.env.NODE_ENV === "development" ? <Profiler id="excel-grid" onRender={onRender}>{grid}</Profiler> : grid;
}
