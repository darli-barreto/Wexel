import { useWexelStore, type CellPosition } from '@/store/useWexelStore';
import { useExcelEditingStore } from '@/store/useExcelEditingStore';
import { processFormula } from './excel';
import { sheetRowCount } from './excelGrid';
export const cellAddress = (cell: CellPosition) => String.fromCharCode(65 + cell.col) + (cell.row + 1);
function itemInput(sheetId: string, address: string, value: string) {
    const state = useWexelStore.getState();
    const sheet = state.sheets.find(s => s.id === sheetId) ?? Object.values(state.workbooks).flatMap(w => w.sheets).find(s => s.id === sheetId);
    const binding = sheet?.template?.generated[address];
    if (!binding) return value;
    const [kind, , , field] = JSON.parse(binding.key) as string[];
    return kind === 'item' && (field === 'description' || field === 'code') ? value.toUpperCase() : value;
}
export function beginEdit(address: string, caretMode = false) {
    const state = useWexelStore.getState();
    const current = useExcelEditingStore.getState().draft;
    if (current?.sheetId === state.activeSheetId && current.address === address) {
        if (caretMode)
            useExcelEditingStore.getState().setDraft({ ...current, caretMode: true });
        return;
    }
    commitEdit();
    const sheet = useWexelStore.getState().sheets.find(s => s.id === state.activeSheetId)!;
    useExcelEditingStore.getState().setDraft({ sheetId: sheet.id, address, value: sheet.cells[address]?.rawValue ?? '', caretMode });
}
export function changeDraft(value: string) {
    const draft = useExcelEditingStore.getState().draft;
    if (!draft)
        return;
    value = itemInput(draft.sheetId, draft.address, value);
    useExcelEditingStore.getState().setDraft({ ...draft, value });
    useWexelStore.getState().updateSheet(draft.sheetId, s => ({ ...s, formulaInput: value }));
}
export function commitEdit() {
    const current = useExcelEditingStore.getState().draft;
    if (!current)
        return;
    const draft = { ...current, value: itemInput(current.sheetId, current.address, current.value) };
    useExcelEditingStore.getState().setDraft(null);
    useWexelStore.getState().updateSheet(draft.sheetId, s => {
        if ((s.cells[draft.address]?.rawValue ?? '') === draft.value) return s;
        const cells = { ...s.cells, [draft.address]: { ...s.cells[draft.address], rawValue: draft.value, displayValue: draft.value, formula: draft.value.startsWith('=') ? draft.value : undefined, dependencies: [] } };
        const rows = Array.from({ length: sheetRowCount({ cells }) }, (_, i) => String(i + 1)), cols = Array.from({ length: 26 }, (_, i) => String.fromCharCode(65 + i));
        const matrix = rows.map(r => cols.map(c => cells[c + r] ?? { rawValue: '', displayValue: '', dependencies: [] }));
        for (const [address, cell] of Object.entries(cells))
            if (cell.rawValue.startsWith('='))
                cells[address] = { ...cell, ...processFormula(cell.rawValue, matrix, rows, cols) };
        return { ...s, cells, formulaInput: draft.value };
    });
}
export function cancelEdit() {
    const draft = useExcelEditingStore.getState().draft;
    if (!draft)
        return;
    useExcelEditingStore.getState().setDraft(null);
    useWexelStore.getState().updateSheet(draft.sheetId, s => ({ ...s, formulaInput: s.cells[draft.address]?.rawValue ?? '' }));
}
export function blurEdit(event: React.FocusEvent<HTMLInputElement | HTMLTextAreaElement>) {
    if ((event.relatedTarget as HTMLElement | null)?.dataset.excelInput === 'true')
        return;
    commitEdit();
}
