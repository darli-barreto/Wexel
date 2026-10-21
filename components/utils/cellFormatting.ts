import { textEffects } from "./wordTypography";
import type { CSSProperties } from "react";
import type { CellData } from "@/store/useWexelStore";

export function formatCellValue(cell: CellData): string {
  const text = cell.displayValue;
  if (!text.trim() || !Number.isFinite(Number(text))) return text;
  const value = Number(text);
  const decimals = Math.max(0, Math.min(10, cell.decimals ?? (cell.numberFormat === "currency" ? 2 : 0)));
  if (cell.numberFormat === "currency") return new Intl.NumberFormat("en-US", {
    style: "currency", currency: "USD", minimumFractionDigits: decimals, maximumFractionDigits: decimals,
  }).format(value);
  if (cell.numberFormat === "percent") return new Intl.NumberFormat("en-US", {
    style: "percent", minimumFractionDigits: decimals, maximumFractionDigits: decimals,
  }).format(value);
  if (cell.decimals !== undefined) return value.toFixed(decimals);
  return text;
}

export function cellTextStyle(cell: CellData): CSSProperties {
  return {
    textShadow: textEffects[cell.textEffect ?? "none"],
    lineHeight: cell.lineHeight,
    fontWeight: cell.bold ? "bold" : "normal",
    fontStyle: cell.italic ? "italic" : "normal",
    textDecoration: [cell.underline ? "underline" : "", cell.strikethrough ? "line-through" : ""].filter(Boolean).join(" ") || "none",
    fontFamily: cell.fontFamily,
    fontSize: cell.fontSize ? `${cell.fontSize}pt` : undefined,
    color: cell.color,
    textAlign: cell.align ?? "right",
    whiteSpace: cell.wrapText ? "pre-wrap" : "nowrap",
    overflowWrap: cell.wrapText ? "anywhere" : undefined,
    paddingLeft: cell.indent ? `${cell.indent * 12}px` : undefined,
  };
}

// Borders belong to the cell, never to its text or editing input.
export function cellBorderStyle(cell: CellData): CSSProperties {
  const all = cell.borderStyle === "all";
  const bottom = all || cell.borderStyle === "bottom";
  return {
    borderTopWidth: all ? 1 : undefined,
    borderTopStyle: all ? "solid" : undefined,
    borderTopColor: all ? "#333" : undefined,
    borderRightWidth: all ? 1 : undefined,
    borderRightStyle: all ? "solid" : undefined,
    borderRightColor: all ? "#333" : undefined,
    borderBottomWidth: bottom ? 1 : undefined,
    borderBottomStyle: bottom ? "solid" : undefined,
    borderBottomColor: bottom ? "#333" : undefined,
    borderLeftWidth: all ? 1 : undefined,
    borderLeftStyle: all ? "solid" : undefined,
    borderLeftColor: all ? "#333" : undefined,
  };
}

export function clearCellFormatting(cell: CellData): CellData {
  return { rawValue: cell.rawValue, displayValue: cell.displayValue, formula: cell.formula, dependencies: cell.dependencies };
}
