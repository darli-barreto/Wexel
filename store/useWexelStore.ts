"use client";

import { create } from "zustand";
import { persist } from "zustand/middleware";
import { deferredStorage } from "./deferredStorage";

export type ViewMode = "word" | "excel" | "split";
export type ActiveFocus = Exclude<ViewMode, "split">;
export type RibbonSection = "Home" | "Diagnóstico" | "Diseño" | "Metrados" | "Costos" | "Programación" | "Documentos" | "Presupuesto";
export const MIN_CELL_SIZE = 30;
export const MIN_ROW_HEIGHT = 18;
export const DEFAULT_COLUMN_WIDTH = 100;
export interface CellPosition { row: number; col: number }
export interface CellData {
  headerFullLabel?: string;
  semanticFormula?: boolean;
  input?: boolean;
  hint?: string;
  rawValue: string;
  displayValue: string;
  formula?: string;
  dependencies: CellPosition[];
  bold?: boolean;
  italic?: boolean;
  underline?: boolean;
  strikethrough?: boolean;
  align?: "left" | "center" | "right";
  verticalAlign?: "top" | "middle" | "bottom";
  fontFamily?: string;
  fontSize?: number;
  color?: string;
  backgroundColor?: string;
  indent?: number;
  wrapText?: boolean;
  numberFormat?: "general" | "currency" | "percent";
  decimals?: number;
  textEffect?: "none" | "shadow" | "outline" | "glow";
  borderStyle?: "none" | "all" | "bottom";
  lineHeight?: number;
}
export interface PageBand { text: string; logo: string }
export interface SheetData {
  id: string;
  name: string;
  cells: Record<string, CellData>;
  colWidths: Record<string, number>;
  rowHeights: Record<string, number>;
  manualRowHeights?: string[];
  merges?: string[];
  selectedCell: CellPosition | null;
  selectionEnd?: CellPosition;
  selectionMode?: 'cells' | 'row' | 'column' | 'all';
  currentCell: string;
  formulaInput: string;
  hiddenRows?: string[];
  template?: {
    explicitInputsVersion?: number;
    id: string;
    formatVersion?: number;
    paletteSignature?: string;
    rows: Record<string, number>;
    generated: Record<string, { key: string; rawValue: string }>;
  };
}
export interface WorkbookData { sheets: SheetData[]; activeSheetId: string }
export const workbookForSection = (section: RibbonSection) => section === "Home" ? "blank" : section;
export interface WordDocument {
  content: string;
  totalPages: number;
  wordCount: number;
  header?: PageBand;
  footer?: PageBand;
}
export interface WexelState {
  contentRevision: number;
  viewMode: ViewMode;
  activeSection: RibbonSection;
  activeFocus: ActiveFocus;
  sheets: SheetData[];
  activeSheetId: string;
  activeWorkbookId: string;
  workbooks: Record<string, WorkbookData>;
  word: WordDocument;
  setViewMode: (mode: ViewMode) => void;
  setActiveSection: (section: RibbonSection) => void;
  openBlankWorkbook: () => void;
  setActiveFocus: (focus: ActiveFocus) => void;
  updateSheet: (id: string, update: (sheet: SheetData) => SheetData) => void;
  addSheet: () => void;
  setActiveSheet: (id: string) => void;
  replaceWorkbook: (id: string, workbook: WorkbookData) => void;
  setColumnWidth: (sheetId: string, column: string, width: number) => void;
  setRowHeight: (sheetId: string, row: string, height: number) => void;
  setWordContent: (content: string, wordCount: number) => void;
  setWordPages: (pages: number) => void;
  setPageBand: (band: "header" | "footer", value: PageBand) => void;
}

const newSheet = (id: string, name: string): SheetData => ({
  id, name, cells: {}, colWidths: {}, rowHeights: {},
  selectedCell: null, currentCell: "A1", formulaInput: "",
});

export const useWexelStore = create<WexelState>()(
  persist(
    (set, get) => ({
      contentRevision: 0,
      viewMode: "excel",
      activeSection: "Home",
      activeFocus: "excel",
      sheets: [newSheet("sheet-1", "Sheet 1")],
      activeSheetId: "sheet-1",
      activeWorkbookId: "blank",
      workbooks: {},
      word: { content: "", totalPages: 1, wordCount: 0 },
      setViewMode: (viewMode) => set((state) => ({
        viewMode, activeFocus: viewMode === "split" ? state.activeFocus : viewMode,
      })),
      setActiveSection: (activeSection) => set((state) => {
        // Home is a shared ribbon, not a different document. Reopening the
        // current module also preserves Word/split mode and the editing target.
        if (activeSection === 'Home' || workbookForSection(activeSection) === state.activeWorkbookId) return state.activeSection === activeSection ? state : { activeSection };
        const id = workbookForSection(activeSection);
        const workbooks = { ...state.workbooks, [state.activeWorkbookId]: { sheets: state.sheets, activeSheetId: state.activeSheetId } };
        const first = newSheet(id + "-sheet-1", "Sheet 1");
        const workbook = workbooks[id] ?? { sheets: [first], activeSheetId: first.id };
        return { activeSection, activeWorkbookId: id, workbooks: { ...workbooks, [id]: workbook }, ...workbook,
          ...(activeSection === "Metrados" ? { activeFocus: "excel" as const, viewMode: state.viewMode === "word" ? "excel" as const : state.viewMode } : {}) };
      }),
      openBlankWorkbook: () => set(state => {
        const workbooks = { ...state.workbooks, [state.activeWorkbookId]: { sheets: state.sheets, activeSheetId: state.activeSheetId } };
        const first = newSheet('sheet-1', 'Sheet 1');
        const workbook = workbooks.blank ?? { sheets: [first], activeSheetId: first.id };
        return { activeSection: 'Home', activeWorkbookId: 'blank', activeFocus: 'excel', viewMode: 'excel', ...workbook, workbooks: { ...workbooks, blank: workbook } };
      }),
      setActiveFocus: (activeFocus) => set(state => state.activeFocus === activeFocus ? state : { activeFocus }),
      updateSheet: (id, update) => set((state) => {
        const owner = state.sheets.some((sheet) => sheet.id === id) ? state.activeWorkbookId : Object.keys(state.workbooks).find((key) => state.workbooks[key].sheets.some((sheet) => sheet.id === id));
        if (!owner) return state;
        const workbook = owner === state.activeWorkbookId ? { sheets: state.sheets, activeSheetId: state.activeSheetId } : state.workbooks[owner];
        const before = workbook.sheets.find((sheet) => sheet.id === id)!;
        const after = update(before);
        if (before === after) return state;
        const durable = before.cells !== after.cells || before.colWidths !== after.colWidths || before.rowHeights !== after.rowHeights || before.template !== after.template || before.hiddenRows !== after.hiddenRows;
        const sheets = workbook.sheets.map((sheet) => sheet.id === id ? after : sheet);
        return { contentRevision: state.contentRevision + (durable ? 1 : 0), workbooks: { ...state.workbooks, [owner]: { ...workbook, sheets } }, ...(owner === state.activeWorkbookId ? { sheets } : {}) };
      }),
      addSheet: () => set((state) => {
        const sheet = newSheet(crypto.randomUUID(), `Hoja ${state.sheets.length + 1}`);
        const workbook = { sheets: [...state.sheets, sheet], activeSheetId: sheet.id };
        return { ...workbook, contentRevision: state.contentRevision + 1, workbooks: { ...state.workbooks, [state.activeWorkbookId]: workbook } };
      }),
      setActiveSheet: (id) => set((state) =>
        state.activeSheetId !== id && state.sheets.some((sheet) => sheet.id === id) ? { activeSheetId: id, workbooks: { ...state.workbooks, [state.activeWorkbookId]: { sheets: state.sheets, activeSheetId: id } } } : state),
      replaceWorkbook: (id, workbook) => set((state) => ({
        contentRevision: state.contentRevision + 1,
        workbooks: { ...state.workbooks, [id]: workbook },
        ...(state.activeWorkbookId === id ? workbook : {}),
      })),
      setColumnWidth: (sheetId, column, width) => {
        if (!Number.isFinite(width)) return;
        const size = Math.max(MIN_CELL_SIZE, Math.round(width));
        get().updateSheet(sheetId, (sheet) => sheet.colWidths[column] === size ? sheet : { ...sheet, colWidths: { ...sheet.colWidths, [column]: size } });
      },
      setRowHeight: (sheetId, row, height) => {
        if (!Number.isFinite(height)) return;
        const size = Math.max(MIN_ROW_HEIGHT, Math.round(height));
        get().updateSheet(sheetId, (sheet) => sheet.rowHeights[row] === size ? sheet : { ...sheet, rowHeights: { ...sheet.rowHeights, [row]: size }, manualRowHeights: [...new Set([...(sheet.manualRowHeights ?? []), row])] });
      },
      setWordContent: (content, wordCount) => set((state) => ({
        contentRevision: state.contentRevision + 1,
        word: { ...state.word, content, wordCount },
      })),
      setWordPages: (pages) => set((state) => ({
        contentRevision: state.contentRevision + 1,
        word: { ...state.word, totalPages: Math.max(1, Math.floor(pages)) },
      })),
      setPageBand: (band, value) => set((state) => ({ contentRevision: state.contentRevision + 1, word: { ...state.word, [band]: value } })),
    }),
    {
      name: "wexel-document-v1",
      version: 2,
      migrate: (persisted) => {
        const previous = persisted as Partial<WexelState>;
        const sheets = previous.sheets?.length ? previous.sheets : [newSheet("sheet-1", "Sheet 1")];
        const blank = { sheets, activeSheetId: previous.activeSheetId ?? sheets[0].id };
        const activeWorkbookId = workbookForSection(previous.activeSection ?? "Home");
        const first = newSheet(activeWorkbookId + "-sheet-1", "Sheet 1");
        const workbook = activeWorkbookId === "blank" ? blank : { sheets: [first], activeSheetId: first.id };
        return { ...previous, ...workbook, activeWorkbookId, workbooks: { blank, [activeWorkbookId]: workbook } };
      },
      storage: deferredStorage<Partial<WexelState>>((state) => [state.contentRevision, state.activeWorkbookId, state.viewMode, state.activeSection, state.activeFocus], (state) => ({ activeSheetId: state.activeSheetId }), true),
      merge: (persisted, current) => {
        const saved=persisted as Partial<WexelState>;
        const activeId=saved.activeWorkbookId??current.activeWorkbookId;
        const workbook=saved.workbooks?.[activeId];
        const activeSheetId = saved.activeSheetId && workbook?.sheets.some(sheet => sheet.id === saved.activeSheetId) ? saved.activeSheetId : workbook?.activeSheetId;
        return {...current,...saved,...(workbook??{}),...(activeSheetId ? { activeSheetId } : {}),activeWorkbookId:activeId};
      },
      skipHydration: true,
      partialize: ({ contentRevision, viewMode, activeSection, activeFocus, sheets, activeSheetId, word, activeWorkbookId, workbooks }) => ({
        contentRevision, viewMode, activeSection, activeFocus, activeSheetId, word, activeWorkbookId,
        workbooks: { ...workbooks, [activeWorkbookId]: { sheets, activeSheetId } },
      }),
    },
  ),
);
