import FormulaInput from "./FormulaInput";
import { formulaReferences, referenceAt } from "./utils/formulaReferences";
import React from "react";
import { useExcelEditingStore } from "@/store/useExcelEditingStore";
import type { CellData, CellPosition, SheetData } from "@/store/useWexelStore";
import {
  beginEdit,
  changeDraft,
  commitEdit,
  cancelEdit,
  blurEdit,
} from "./utils/excelEditing";
import { cellBorderStyle, cellTextStyle, formatCellValue } from "./utils/cellFormatting";
import type { StartResize } from "./utils/useExcelResize";
interface Props {
  row: string;
  rowIdx: number;
  columns: string[];
  sheet: SheetData;
  startResize: StartResize;
  select: (cell: CellPosition | null) => void;
  rowCount: number;
}
export default function TableRowExcel({
  row,
  rowIdx,
  columns,
  sheet,
  startResize,
  select,
  rowCount,
}: Props) {
  const draft = useExcelEditingStore((s) => s.draft);
  const references = formulaReferences(
    draft?.sheetId === sheet.id ? draft.value : "",
  );
  return (
    <tr style={{ height: sheet.rowHeights[row] }}>
      <td className="border border-[#d6d6d6] bg-[#fafafa] px-1.5 text-center text-[#7f7f7d] text-sm font-bold sticky left-0 z-10">
        {row}
        <div
          aria-label={"Cambiar alto de fila " + row}
          title={"Cambiar alto de fila " + row}
          className="absolute bottom-0 left-0 right-0 h-1.5 cursor-row-resize z-20 select-none"
          onMouseDown={(e) => startResize(e, "row", row)}
        />
      </td>
      {columns.map((col, colIdx) => {
        const address = col + row,
          position = { row: rowIdx, col: colIdx };
        const cell: CellData = sheet.cells[address] ?? {
          rawValue: "",
          displayValue: "",
          dependencies: [],
        };
        const active =
          sheet.selectedCell?.row === rowIdx &&
          sheet.selectedCell.col === colIdx;
        const start = sheet.selectedCell,
          end = sheet.selectionEnd ?? start;
        const inRange = Boolean(
          start &&
          end &&
          rowIdx >= Math.min(start.row, end.row) &&
          rowIdx <= Math.max(start.row, end.row) &&
          colIdx >= Math.min(start.col, end.col) &&
          colIdx <= Math.max(start.col, end.col),
        );
        const editing =
          draft?.sheetId === sheet.id && draft.address === address;
        const style = cellTextStyle(cell);
        const reference = referenceAt(references, rowIdx, colIdx);
        const edges = reference
          ? {
              top: rowIdx === Math.min(reference.from.row, reference.to.row),
              bottom: rowIdx === Math.max(reference.from.row, reference.to.row),
              left: colIdx === Math.min(reference.from.col, reference.to.col),
              right: colIdx === Math.max(reference.from.col, reference.to.col),
            }
          : null;
        const navigate = (r: number, c: number) => {
          commitEdit();
          select({
            row: Math.max(0, Math.min(rowCount - 1, r)),
            col: Math.max(0, Math.min(columns.length - 1, c)),
          });
        };
        return (
          <td
            key={address}
            data-cell-address={address}
            data-row={rowIdx}
            data-col={colIdx}
            aria-selected={inRange}
            data-reference-color={reference?.color}
            className={
              "border border-[#d6d6d6] bg-white px-2 text-xs h-4 relative overflow-visible " +
              (active ? "ring-2 ring-[#217346] ring-inset" : "")
            }
            style={{
              ...style,
              ...cellBorderStyle(cell),
              backgroundColor: reference
                ? reference.color + "22"
                : inRange && !active
                  ? "#e2f0e8"
                  : cell.backgroundColor,
              verticalAlign: cell.verticalAlign ?? "middle",
            }}
            onDoubleClick={() => {
              select(position);
              beginEdit(address, true);
            }}
          >
            {reference && edges && (
              <div
                aria-hidden="true"
                className="absolute inset-0 pointer-events-none z-20"
                style={{
                  borderColor: reference.color,
                  borderStyle: "solid",
                  borderTopWidth: edges.top ? 2 : 0,
                  borderBottomWidth: edges.bottom ? 2 : 0,
                  borderLeftWidth: edges.left ? 2 : 0,
                  borderRightWidth: edges.right ? 2 : 0,
                }}
              />
            )}
            {active ? (
              <FormulaInput
                multiline={Boolean(cell.wrapText)}
                highlight={editing}
                aria-label={"Celda " + address}
                data-excel-input="true"
                value={editing ? draft.value : formatCellValue(cell)}
                onFocus={() => beginEdit(address)}
                onBlur={blurEdit}
                onChange={(e) => {
                  beginEdit(address);
                  changeDraft(e.target.value);
                }}
                onKeyDown={(e) => {
                  if (e.nativeEvent.isComposing) return;
                  if (e.key === "F2") {
                    e.preventDefault();
                    beginEdit(address, true);
                    const input = e.currentTarget;
                    requestAnimationFrame(() =>
                      input.setSelectionRange(
                        input.value.length,
                        input.value.length,
                      ),
                    );
                    return;
                  }
                  if (e.key === "Escape") {
                    e.preventDefault();
                    cancelEdit();
                    return;
                  }
                  if (e.key === "Tab") {
                    e.preventDefault();
                    const next =
                      rowIdx * columns.length + colIdx + (e.shiftKey ? -1 : 1);
                    const bounded = Math.max(
                      0,
                      Math.min(rowCount * columns.length - 1, next),
                    );
                    navigate(
                      Math.floor(bounded / columns.length),
                      bounded % columns.length,
                    );
                    return;
                  }
                  if (e.key === "Enter") {
                    if (e.shiftKey && cell.wrapText) return;
                    e.preventDefault();
                    navigate(rowIdx + (e.shiftKey ? -1 : 1), colIdx);
                    return;
                  }
                  if (e.key.startsWith("Arrow")) {
                    if (
                      editing &&
                      (draft.caretMode || draft.value.startsWith("="))
                    )
                      return;
                    e.preventDefault();
                    navigate(
                      rowIdx +
                        (e.key === "ArrowDown"
                          ? 1
                          : e.key === "ArrowUp"
                            ? -1
                            : 0),
                      colIdx +
                        (e.key === "ArrowRight"
                          ? 1
                          : e.key === "ArrowLeft"
                            ? -1
                            : 0),
                    );
                  }
                }}
                style={{
                  ...style,
                  paddingLeft: 0,
                  height: "auto",
                  display: "block",
                  resize: "none",
                  fieldSizing: "content",
                  lineHeight: "inherit",
                }}
                className="w-full h-full bg-transparent border-none outline-none font-mono whitespace-nowrap overflow-visible"
                autoFocus
              />
            ) : (
              <div
                className="w-full text-xs h-full flex items-center justify-end font-mono overflow-visible whitespace-nowrap"
                style={{ ...style, display: "block", paddingLeft: 0 }}
              >
                {formatCellValue(cell)}
              </div>
            )}
          </td>
        );
      })}
    </tr>
  );
}
