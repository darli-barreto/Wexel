"use client";

import React, { useState, useEffect, useRef } from "react";
import HeaderExcel from "./HeaderExcel";
import TableExcel from "./TableExcel";
import FooterExcel from "./FooterExcel";

interface CanvaExcelProps {
  isSplit?: boolean;
}

function CanvaExcel({ isSplit = false }: CanvaExcelProps) {
  const columns = isSplit
    ? Array.from({ length: 10 }, (_, i) => String.fromCharCode(65 + i)) // A-J
    : Array.from({ length: 26 }, (_, i) => String.fromCharCode(65 + i)); // A-Z
  const [rows, setRows] = useState<string[]>(Array.from({ length: 50 }, (_, i) => String(i + 1)));
  const scrollRef = useRef<HTMLDivElement>(null);
  const [currentCell, setCurrentCell] = useState("A1");
  // Estados para la celda seleccionada y la fórmula
  const [selectedCell, setSelectedCell] = useState<{ row: number; col: number } | null>(null);
  const [formulaInput, setFormulaInput] = useState("");
  const [sheets, setSheets] = useState(["Sheet 1"]);
  const [activeSheet, setActiveSheet] = useState(0);

  const addSheet = () => {
    setSheets((prev) => [...prev, `Hoja ${prev.length + 1}`]);
    setActiveSheet(sheets.length); 
  };

  const incrementRow = () => {
    const match = currentCell.match(/^([A-Z]+)(\d+)$/);
    if (match) {
      const col = match[1];
      if (isSplit && (col.charCodeAt(0) < 65 || col.charCodeAt(0) > 74)) {
        // Solo permitir A-J (65-74) en modo split
        return;
      }
      const row = parseInt(match[2]) + 1;
      setCurrentCell(`${col}${row}`);
    }
  };

  const decrementRow = () => {
    const match = currentCell.match(/^([A-Z]+)(\d+)$/);
    if (match) {
      const col = match[1];
      const row = Math.max(1, parseInt(match[2]) - 1);
      setCurrentCell(`${col}${row}`);
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
    setSelectedCell(cell);
    if (cell) {
      setCurrentCell(`${columns[cell.col]}${rows[cell.row]}`);
    }
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
    <div className="flex flex-col h-full">
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
        activeSheet={activeSheet}
        setActiveSheet={setActiveSheet}
        addSheet={addSheet}
      />
    </div>
  );
}

export default CanvaExcel;