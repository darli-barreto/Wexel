"use client";

import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";

export type ViewMode = "word" | "excel" | "split";
export type ActiveFocus = Exclude<ViewMode, "split">;
export const MIN_CELL_SIZE = 30;
export const DEFAULT_COLUMN_WIDTH = 100;
export interface CellPosition { row: number; col: number }
export interface CellData {
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
  selectedCell: CellPosition | null;
  selectionEnd?: CellPosition;
  currentCell: string;
  formulaInput: string;
}
export interface WordDocument {
  content: string;
  totalPages: number;
  wordCount: number;
  header?: PageBand;
  footer?: PageBand;
}
export interface WexelState {
  viewMode: ViewMode;
  activeFocus: ActiveFocus;
  sheets: SheetData[];
  activeSheetId: string;
  word: WordDocument;
  setViewMode: (mode: ViewMode) => void;
  setActiveFocus: (focus: ActiveFocus) => void;
  updateSheet: (id: string, update: (sheet: SheetData) => SheetData) => void;
  addSheet: () => void;
  setActiveSheet: (id: string) => void;
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
    (set) => ({
      viewMode: "excel",
      activeFocus: "excel",
      sheets: [newSheet("sheet-1", "Sheet 1")],
      activeSheetId: "sheet-1",
      word: { content: "", totalPages: 1, wordCount: 0 },
      setViewMode: (viewMode) => set((state) => ({
        viewMode, activeFocus: viewMode === "split" ? state.activeFocus : viewMode,
      })),
      setActiveFocus: (activeFocus) => set({ activeFocus }),
      updateSheet: (id, update) => set((state) => ({
        sheets: state.sheets.map((sheet) => sheet.id === id ? update(sheet) : sheet),
      })),
      addSheet: () => set((state) => {
        const sheet = newSheet(crypto.randomUUID(), `Hoja ${state.sheets.length + 1}`);
        return { sheets: [...state.sheets, sheet], activeSheetId: sheet.id };
      }),
      setActiveSheet: (id) => set((state) =>
        state.sheets.some((sheet) => sheet.id === id) ? { activeSheetId: id } : state),
      setColumnWidth: (sheetId, column, width) => {
        if (!Number.isFinite(width)) return;
        const size = Math.max(MIN_CELL_SIZE, Math.round(width));
        set((state) => ({ sheets: state.sheets.map((sheet) =>
          sheet.id === sheetId && sheet.colWidths[column] !== size
            ? { ...sheet, colWidths: { ...sheet.colWidths, [column]: size } }
            : sheet),
        }));
      },
      setRowHeight: (sheetId, row, height) => {
        if (!Number.isFinite(height)) return;
        const size = Math.max(MIN_CELL_SIZE, Math.round(height));
        set((state) => ({ sheets: state.sheets.map((sheet) =>
          sheet.id === sheetId && sheet.rowHeights[row] !== size
            ? { ...sheet, rowHeights: { ...sheet.rowHeights, [row]: size } }
            : sheet),
        }));
      },
      setWordContent: (content, wordCount) => set((state) => ({
        word: { ...state.word, content, wordCount },
      })),
      setWordPages: (pages) => set((state) => ({
        word: { ...state.word, totalPages: Math.max(1, Math.floor(pages)) },
      })),
      setPageBand: (band, value) => set((state) => ({ word: { ...state.word, [band]: value } })),
    }),
    {
      name: "wexel-document-v1",
      version: 1,
      storage: createJSONStorage(() => localStorage),
      skipHydration: true,
      partialize: ({ viewMode, activeFocus, sheets, activeSheetId, word }) => ({
        viewMode, activeFocus, sheets, activeSheetId, word,
      }),
    },
  ),
);
