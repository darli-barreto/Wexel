import FormulaInput from "./FormulaInput";
import { formulaReferences, referenceAt } from "./utils/formulaReferences";
import React, { memo } from "react";
import { COLORS } from "../config/colors";
import { mergedCells, type MergeCell } from './utils/mergedCells';
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
  height: number;
  row: string;
  rowIdx: number;
  columns: string[];
  sheet: SheetData;
  startResize: StartResize;
  select: (cell: CellPosition | null) => void;
  rowCount: number;
}
function TableRowExcel({
  height,
  row,
  rowIdx,
  columns,
  sheet,
  startResize,
  select,
  rowCount,
}: Props) {
  const draft = useExcelEditingStore((s) => s.draft?.sheetId === sheet.id && (s.draft.value.startsWith("=") || s.draft.address.match(/\d+$/)?.[0] === row) ? s.draft : null);
  const references = formulaReferences(
    draft?.sheetId === sheet.id ? draft.value : "",
  );
  const merges=mergedCells(sheet.merges);
  return (
    <tr style={{ height }}>
      <td style={{borderColor:COLORS.excel.grid,backgroundColor:COLORS.excel.heading,color:COLORS.excel.headingText}} className="border border-[#d6d6d6] bg-[#fafafa] px-1.5 text-center text-[#7f7f7d] text-sm font-bold sticky left-0 z-10">
        {row}
        <div
          aria-label={"Cambiar alto de fila " + row}
          title={"Cambiar alto de fila " + row}
          className="absolute bottom-0 left-0 right-0 h-1.5 cursor-row-resize z-20 select-none"
          onMouseDown={(e) => startResize(e, "row", row)}
        />
      </td>
      {columns.map((col, colIdx) => {
        const address = col + row, merge = merges?.get(address);
        if (merge?.hidden) return null;
        const start = sheet.selectedCell, end = sheet.selectionEnd ?? start;
        const active = start?.row === rowIdx && start.col === colIdx;
        const inRange = Boolean(start && end && rowIdx >= Math.min(start.row,end.row) && rowIdx <= Math.max(start.row,end.row) && colIdx >= Math.min(start.col,end.col) && colIdx <= Math.max(start.col,end.col));
        return <GridCell key={address} address={address} rowIdx={rowIdx} colIdx={colIdx}
          cell={sheet.cells[address] ?? emptyCell} merge={merge} active={active} inRange={inRange}
          draft={draft?.address === address ? draft : null} reference={referenceAt(references,rowIdx,colIdx)}
          rowCount={rowCount} columns={columns} select={select} />;
      })}
    </tr>
  );
}

const emptyCell: CellData = { rawValue: "", displayValue: "", dependencies: [] };
const GridCell = memo(function GridCell({ address, rowIdx, colIdx, cell, merge, active, inRange, draft, reference, rowCount, columns, select }: {
  address: string; rowIdx: number; colIdx: number; cell: CellData;
  merge: MergeCell | undefined;
  active: boolean; inRange: boolean;
  draft: ReturnType<typeof useExcelEditingStore.getState>["draft"];
  reference: ReturnType<typeof referenceAt>;
  rowCount: number; columns: string[]; select: Props["select"];
}) {
  const position = { row: rowIdx, col: colIdx };
  const editing =
    draft?.address === address;
  const style = cellTextStyle(cell);
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
      colSpan={merge?.colSpan}
      rowSpan={merge?.rowSpan}
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
        borderTopColor: COLORS.excel.grid,
        borderRightColor: COLORS.excel.grid,
        borderBottomColor: COLORS.excel.grid,
        borderLeftColor: COLORS.excel.grid,
        boxShadow: active ? `inset 0 0 0 2px ${COLORS.excel.selection}` : undefined,
        backgroundColor: reference
          ? reference.color + "22"
          : inRange && !active
            ? COLORS.excel.range
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
          onBlur={blurEdit}
          onChange={(e) => {
            beginEdit(address);
            changeDraft(e.target.value);
          }}
          onKeyDown={(e) => {
            if (e.nativeEvent.isComposing) return;
            if (!editing && !e.ctrlKey && !e.metaKey && !e.altKey && (e.key.length === 1 || e.key === "Backspace" || e.key === "Delete")) {
              e.preventDefault();
              beginEdit(address);
              changeDraft(e.key.length === 1 ? e.key : "");
              return;
            }
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
          style={{ ...style, display: "block", paddingLeft: 0, height: cell.verticalAlign ? "auto" : undefined }}
        >
          {formatCellValue(cell)}
        </div>
      )}
    </td>
  );

});

function selectionOnRow(sheet: SheetData, row: number) {
  const a = sheet.selectedCell, b = sheet.selectionEnd ?? a;
  if (!a || !b || row < Math.min(a.row,b.row) || row > Math.max(a.row,b.row)) return "";
  return [a.row === row ? a.col : -1, Math.min(a.col,b.col), Math.max(a.col,b.col)].join(":");
}
export default memo(TableRowExcel, (a, b) => {
  if (a.sheet.id !== b.sheet.id || a.sheet.merges !== b.sheet.merges || a.height !== b.height || a.select !== b.select || a.startResize !== b.startResize || a.rowCount !== b.rowCount || selectionOnRow(a.sheet,a.rowIdx) !== selectionOnRow(b.sheet,b.rowIdx)) return false;
  return a.sheet.cells === b.sheet.cells || a.columns.every((col) => a.sheet.cells[col+a.row] === b.sheet.cells[col+b.row]);
});
