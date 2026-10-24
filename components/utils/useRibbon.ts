"use client";

import { useEditorState, type Editor } from "@tiptap/react";
import { useWexelStore, type CellData, type SheetData } from "@/store/useWexelStore";
import { useWordEditorStore } from "@/store/useWordEditorStore";
import { useShallow } from "zustand/react/shallow";
import { clearCellFormatting } from "./cellFormatting";
import { commitEdit } from './excelEditing';

export type RibbonAction = "bold" | "italic" | "underline" | "strike" | "subscript" | "superscript"
  | "left" | "center" | "right" | "justify" | "top" | "middle" | "bottom"
  | "grow" | "shrink" | "clear" | "bullets" | "numbering" | "indent" | "outdent"
  | "wrap" | "currency" | "percent" | "increaseDecimal" | "decreaseDecimal";
export type RibbonValue = "fontFamily" | "fontSize" | "color" | "highlight";

const emptyCell: CellData = { rawValue: "", displayValue: "", dependencies: [] };
export function activeAddress(sheet: SheetData): string {
  if (!sheet.selectedCell) return /^[A-Z]+[1-9]\d*$/.test(sheet.currentCell) ? sheet.currentCell : "A1";
  let column = sheet.selectedCell.col + 1;
  let letters = "";
  while (column > 0) { column--; letters = String.fromCharCode(65 + column % 26) + letters; column = Math.floor(column / 26); }
  return `${letters}${sheet.selectedCell.row + 1}`;
}
function wordFormat(editor: Editor | null) {
  const style = editor?.getAttributes("textStyle") ?? {};
  const headingSizes: Record<number, number> = { 1: 28, 2: 24, 3: 20, 4: 16, 5: 16, 6: 16 };
  const defaultSize = editor?.isActive("heading") ? headingSizes[Number(editor.getAttributes("heading").level)] ?? 14 : 14;
  const rawSize = String(style.fontSize ?? `${defaultSize}px`);
  const size = parseFloat(rawSize) * (rawSize.endsWith("px") ? 0.75 : 1);
  return {
    bold: editor?.isActive("bold") ?? false, italic: editor?.isActive("italic") ?? false,
    underline: editor?.isActive("underline") ?? false, strike: editor?.isActive("strike") ?? false,
    subscript: editor?.isActive("subscript") ?? false, superscript: editor?.isActive("superscript") ?? false,
    left: editor?.isActive({ textAlign: "left" }) ?? false,
    center: editor?.isActive({ textAlign: "center" }) ?? false,
    right: editor?.isActive({ textAlign: "right" }) ?? false,
    justify: editor?.isActive({ textAlign: "justify" }) ?? false,
    bullets: editor?.isActive("bulletList") ?? false, numbering: editor?.isActive("orderedList") ?? false,
    fontFamily: String(style.fontFamily || "Arial"), fontSize: Number.isFinite(size) ? size : 10.5,
    color: String(style.color ?? "#171717"), highlight: String(editor?.getAttributes("highlight").color ?? "#ffff00"),
  };
}

export function editCell(update: (cell: CellData) => CellData) {
  // Commit a raw cell edit before formatting it; formatting never changes its numeric value.
  commitEdit();
  const store = useWexelStore.getState();
  store.updateSheet(store.activeSheetId, (sheet) => {
    const address = activeAddress(sheet);
    return { ...sheet, cells: { ...sheet.cells, [address]: update(sheet.cells[address] ?? emptyCell) } };
  });
}

export function executeRibbonAction(action: RibbonAction) {
  if (useWexelStore.getState().activeFocus === "excel") {
    editCell((cell) => {
      switch (action) {
        case "bold": return { ...cell, bold: !cell.bold };
        case "italic": return { ...cell, italic: !cell.italic };
        case "underline": return { ...cell, underline: !cell.underline };
        case "strike": return { ...cell, strikethrough: !cell.strikethrough };
        case "left": case "center": case "right": return { ...cell, align: action };
        case "top": case "middle": case "bottom": return { ...cell, verticalAlign: action };
        case "grow": case "shrink": return { ...cell, fontSize: Math.max(6, Math.min(96, (cell.fontSize ?? 9) + (action === "grow" ? 2 : -2))) };
        case "clear": return clearCellFormatting(cell);
        case "indent": case "outdent": return { ...cell, indent: Math.max(0, Math.min(10, (cell.indent ?? 0) + (action === "indent" ? 1 : -1))) };
        case "wrap": return { ...cell, wrapText: !cell.wrapText };
        case "currency": return { ...cell, numberFormat: "currency", decimals: 2 };
        case "percent": return { ...cell, numberFormat: "percent", decimals: 0 };
        case "increaseDecimal": case "decreaseDecimal": {
          const initial = cell.decimals ?? (cell.numberFormat === "currency" ? 2 : cell.numberFormat === "percent" ? 0 : (cell.displayValue.split(".")[1]?.length ?? 0));
          return { ...cell, decimals: Math.max(0, Math.min(10, initial + (action === "increaseDecimal" ? 1 : -1))) };
        }
        default: return cell;
      }
    });
    return;
  }
  const editor = useWordEditorStore.getState().editor;
  if (!editor || editor.isDestroyed) return;
  const chain = editor.chain().focus();
  switch (action) {
    case "bold": chain.toggleBold().run(); break;
    case "italic": chain.toggleItalic().run(); break;
    case "underline": chain.toggleUnderline().run(); break;
    case "strike": chain.toggleStrike().run(); break;
    case "subscript": chain.unsetSuperscript().toggleSubscript().run(); break;
    case "superscript": chain.unsetSubscript().toggleSuperscript().run(); break;
    case "left": case "center": case "right": case "justify": chain.setTextAlign(action).run(); break;
    case "grow": case "shrink": chain.setFontSize(`${Math.max(6, Math.min(96, wordFormat(editor).fontSize + (action === "grow" ? 2 : -2)))}pt`).run(); break;
    case "clear": chain.unsetAllMarks().clearNodes().resetAttributes("paragraph", ["indent", "textAlign", "borderStyle", "lineHeight", "spaceAfter"]).run(); break;
    case "bullets": chain.toggleBulletList().run(); break;
    case "numbering": chain.toggleOrderedList().run(); break;
    case "indent": chain.changeIndent(1).run(); break;
    case "outdent": chain.changeIndent(-1).run(); break;
  }
}

export function setRibbonValue(name: RibbonValue, value: string) {
  if (name === "fontSize" && (!Number.isFinite(Number(value)) || Number(value) < 6 || Number(value) > 96)) return;
  if (useWexelStore.getState().activeFocus === "excel") {
    editCell((cell) => ({ ...cell, [name === "highlight" ? "backgroundColor" : name]: name === "fontSize" ? Number(value) : value }));
    return;
  }
  const editor = useWordEditorStore.getState().editor;
  if (!editor || editor.isDestroyed) return;
  const chain = editor.chain().focus();
  switch (name) {
    case "fontFamily": chain.setFontFamily(value).run(); break;
    case "fontSize": chain.setFontSize(`${value}pt`).run(); break;
    case "color": chain.setColor(value).run(); break;
    case "highlight": chain.setHighlight({ color: value }).run(); break;
  }
}

export function useRibbon() {
  const focus = useWexelStore((state) => state.activeFocus);
  const cell = useWexelStore(useShallow((state) => {
    const sheet = state.sheets.find((sheet) => sheet.id === state.activeSheetId);
    const cell = sheet?.cells[activeAddress(sheet)] ?? emptyCell;
    // Ribbon controls depend on formatting, never on the selected address or value.
    const { fontFamily, fontSize, color, backgroundColor, bold, italic, underline, strikethrough, align, verticalAlign, wrapText, numberFormat } = cell;
    return { fontFamily, fontSize, color, backgroundColor, bold, italic, underline, strikethrough, align, verticalAlign, wrapText, numberFormat };
  }));
  const editor = useWordEditorStore((state) => state.editor);
  const word = useEditorState({ editor, selector: ({ editor }) => wordFormat(editor) });
  const format = focus === "word" ? word ?? wordFormat(null) : {
    fontFamily: cell.fontFamily ?? "monospace", fontSize: cell.fontSize ?? 9,
    color: cell.color ?? "#171717", highlight: cell.backgroundColor ?? "#ffff00",
  };
  const isActive = (action: RibbonAction): boolean => {
    if (focus === "word") return Boolean(word && action in word && word[action as keyof typeof word] === true);
    switch (action) {
      case "bold": case "italic": case "underline": return Boolean(cell[action]);
      case "strike": return Boolean(cell.strikethrough);
      case "left": case "center": case "right": return (cell.align ?? "right") === action;
      case "top": case "middle": case "bottom": return (cell.verticalAlign ?? "middle") === action;
      case "wrap": return Boolean(cell.wrapText);
      case "currency": case "percent": return cell.numberFormat === action;
      default: return false;
    }
  };
  return { focus, format, isActive, execute: executeRibbonAction, setValue: setRibbonValue };
}
