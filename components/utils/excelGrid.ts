import type { SheetData } from "../../store/useWexelStore";

/** Preserve the original 99-row blank canvas and include populated template rows beyond it. */
export function sheetRowCount(sheet: Pick<SheetData, "cells">): number {
  return Math.max(99, ...Object.keys(sheet.cells).map((address) => Number(address.match(/\d+$/)?.[0]) || 0));
}
