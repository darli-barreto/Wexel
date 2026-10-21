"use client";

import React, { useState, useEffect, useRef, useMemo } from "react";
import { useWexelStore, type SheetData } from "@/store/useWexelStore";
import HeaderExcel from "./HeaderExcel";
import TableExcel from "./TableExcel";
import FooterExcel from "./FooterExcel";

function CanvaExcel() {
  // Keep the same columns mounted in every view, including the split view.
  const columns = useMemo(() => Array.from({ length: 26 }, (_, i) => String.fromCharCode(65 + i)), []);
  const [rows, setRows] = useState<string[]>(Array.from({ length: 99 }, (_, i) => String(i + 1)));
  const scrollRef = useRef<HTMLDivElement>(null);
  const sheets = useWexelStore((state) => state.sheets);
  const activeSheetId = useWexelStore((state) => state.activeSheetId);
  const updateSheet = useWexelStore((state) => state.updateSheet);
  const addSheet = useWexelStore((state) => state.addSheet);
  const selectSheet = useWexelStore((state) => state.setActiveSheet);
  const activeSheet = sheets.findIndex((sheet) => sheet.id === activeSheetId);
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

  useEffect(() => {
    const handleScroll = () => {
      if (scrollRef.current) {
        const { scrollTop, scrollHeight, clientHeight } = scrollRef.current;
        if (scrollTop + clientHeight >= scrollHeight - 10) {
          setRows((prev) => {
            const newLength = Math.min(prev.length + 20, 99);
            return Array.from({ length: newLength }, (_, i) => String(i + 1));
          });
        }
      }
    };

    const ref = scrollRef.current;
    if (ref) {
      ref.addEventListener("scroll", handleScroll);
      return () => ref.removeEventListener("scroll", handleScroll);
    }
  }, []);


  // Elimina el setState en cascada. Actualiza currentCell solo cuando el usuario selecciona una celda.
  const handleSelectCell = (cell: { row: number; col: number } | null) => {
    if (!cell) { patchSheet({ selectedCell: null }); return; }
    const address = columns[cell.col] + rows[cell.row];
    patchSheet({ selectedCell: cell, selectionEnd: undefined, currentCell: address, formulaInput: sheets[activeSheet].cells[address]?.rawValue ?? "" });
  };

  // Elimina el setState en cascada. Actualiza la celda seleccionada solo en el evento de cambio de currentCell.
  const handleCurrentCellChange = (cellStr: string) => {
    setCurrentCell(cellStr);
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
        colIdx >= 0 && colIdx < columns.length &&
        (!selectedCell || selectedCell.row !== rowIdx || selectedCell.col !== colIdx)
      ) {
        handleSelectCell({ row: rowIdx, col: colIdx });
      }
    }
  };

  return (
    <div className="flex flex-col h-full w-full">
      <div
        ref={scrollRef}
        className="flex-1 border-y border-tertiary overflow-auto hide-scrollbar"
      >
        <HeaderExcel
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
