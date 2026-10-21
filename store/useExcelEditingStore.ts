import { create } from 'zustand';
export interface ExcelDraft {
    sheetId: string;
    address: string;
    value: string;
    caretMode: boolean;
}
export const useExcelEditingStore = create<{
    draft: ExcelDraft | null;
    setDraft: (draft: ExcelDraft | null) => void;
}>(set => ({ draft: null, setDraft: draft => set({ draft }) }));
