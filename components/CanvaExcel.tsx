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
  const [rows, setRows] = useState(Array.from({ length: 50 }, (_, i) => i + 1));
  const scrollRef = useRef<HTMLDivElement>(null);
  const [currentCell, setCurrentCell] = useState("A1");
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
            return Array.from({ length: newLength }, (_, i) => i + 1);
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

  return (
    <div className="flex flex-col h-full">
      <div
        ref={scrollRef}
        className="flex-1 border-y border-tertiary overflow-auto hide-scrollbar" // Cambia scrollbar-hide por hide-scrollbar
      >
        <HeaderExcel
          currentCell={currentCell}
          setCurrentCell={setCurrentCell}
          incrementRow={incrementRow}
          decrementRow={decrementRow}
        />
        <TableExcel columns={columns} rows={rows} />
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