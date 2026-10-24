"use client";

import React, { useRef, useMemo, useCallback } from "react";
import { useWexelStore, type SheetData } from "@/store/useWexelStore";
import HeaderExcel from "./HeaderExcel";
import TableExcel from "./TableExcel";
import FooterExcel from "./FooterExcel";
import { commitEdit } from "./utils/excelEditing";
import { sheetRowCount } from "./utils/excelGrid";
import { mergedCells } from './utils/mergedCells';

function CanvaExcel() {
  // Keep the same columns mounted in every view, including the split view.
  const columns = useMemo(() => Array.from({ length: 26 }, (_, i) => String.fromCharCode(65 + i)), []);
  const scrollRef = useRef<HTMLDivElement>(null);
  const sheets = useWexelStore((state) => state.sheets);
  const activeSheetId = useWexelStore((state) => state.activeSheetId);
  const updateSheet = useWexelStore((state) => state.updateSheet);
  const addSheet = useWexelStore((state) => state.addSheet);
  const selectSheet = (id: string) => { commitEdit(); useWexelStore.getState().setActiveSheet(id); };
  const activeSheet = sheets.findIndex((sheet) => sheet.id === activeSheetId);
  const cells = sheets[activeSheet].cells;
  const rowCount = useMemo(() => sheetRowCount({cells}), [cells]);
  const rows = useMemo(() => Array.from({ length: rowCount }, (_, i) => String(i + 1)), [rowCount]);
  const { currentCell, selectedCell, formulaInput } = sheets[activeSheet];
  const patchSheet = (patch: Partial<SheetData>) => updateSheet(activeSheetId, (sheet) => ({ ...sheet, ...patch }));
  const setCurrentCell = (currentCell: string) => patchSheet({ currentCell });
  const setFormulaInput = (formulaInput: string) => patchSheet({ formulaInput });

  const incrementRow = () => {
    const match = currentCell.match(/^([A-Z]+)(\d+)$/);
    if (match) {
      const col = match[1];
      const row = parseInt(match[2]) + 1;
      handleCurrentCellChange(`${col}${Math.min(rows.length, row)}`);
    }
  };

  const decrementRow = () => {
    const match = currentCell.match(/^([A-Z]+)(\d+)$/);
    if (match) {
      const col = match[1];
      const row = Math.max(1, parseInt(match[2]) - 1);
      handleCurrentCellChange(`${col}${row}`);
    }
  };


  // Elimina el setState en cascada. Actualiza currentCell solo cuando el usuario selecciona una celda.
  const handleSelectCell = useCallback((cell: { row: number; col: number } | null) => {
    const excel = useWexelStore.getState();
    const id = excel.activeSheetId;
    if (!cell) { excel.updateSheet(id, (s) => s.selectedCell ? { ...s, selectedCell: null } : s); return; }
    let address = columns[cell.col] + rows[cell.row];
    const sheet=excel.sheets.find(s=>s.id===id)!;
    const merge=mergedCells(sheet.merges)?.get(address);
    if(merge?.hidden){cell={row:merge.row,col:merge.col};address=columns[cell.col]+rows[cell.row];}
    excel.updateSheet(id, (s) => s.currentCell === address && !s.selectionEnd && s.selectedCell && (!s.selectionMode || s.selectionMode === 'cells') ? s : { ...s, selectedCell: cell, selectionEnd: undefined, selectionMode: 'cells', currentCell: address, formulaInput: s.cells[address]?.rawValue ?? "" });
  }, [columns, rows]);

  // Elimina el setState en cascada. Actualiza la celda seleccionada solo en el evento de cambio de currentCell.
  const handleCurrentCellChange = (cellStr: string) => {
    const match = cellStr.match(/^([A-Z]+)(\d+)$/);
    if (match) {
      const colLetters = match[1];
      const rowNum = parseInt(match[2]);
      let colIdx = 0;
      for (let i = 0; i < colLetters.length; i++) {
        colIdx = colIdx * 26 + (colLetters.charCodeAt(i) - 65 + 1);
      }
      colIdx -= 1;
      const rowIdx = rowNum - 1;
      if (
        rowIdx >= 0 && rowIdx < rows.length &&
        colIdx >= 0 && colIdx < columns.length
      ) {
        handleSelectCell({ row: rowIdx, col: colIdx });
      }
    } else setCurrentCell(cellStr);
  };

  return (
    <div className="flex flex-col h-full w-full">
      <div
        ref={scrollRef}
        className="flex-1 border-y border-tertiary overflow-auto hide-scrollbar"
      >
        <HeaderExcel
          rowCount={rows.length}
          currentCell={currentCell}
          setCurrentCell={handleCurrentCellChange}
          incrementRow={incrementRow}
          decrementRow={decrementRow}
          selectedCell={selectedCell}
          setSelectedCell={handleSelectCell}
          formulaInput={formulaInput}
          setFormulaInput={setFormulaInput}
        />
        <TableExcel
          scrollRef={scrollRef}
          columns={columns}
          rows={rows}
          selectedCell={selectedCell}
          setSelectedCell={handleSelectCell}
          formulaInput={formulaInput}
          setFormulaInput={setFormulaInput}
        />
      </div>
      <FooterExcel
        sheets={sheets}
        activeSheet={activeSheetId}
        setActiveSheet={selectSheet}
        addSheet={addSheet}
      />
    </div>
  );
}

export default CanvaExcel;
