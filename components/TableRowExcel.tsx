import React from "react";
import type { CellData } from "./TableExcel";

interface TableRowProps {
  row: string;
  rowIdx: number;
  columns: string[];
  cellData: CellData[][];
  selectedCell: { row: number; col: number } | null;
  setSelectedCell: (cell: { row: number; col: number } | null) => void;
  setFormulaInput: (value: string) => void;
  setCellData: React.Dispatch<React.SetStateAction<CellData[][]>>;
  processFormula: (formula: string) => { displayValue: string, dependencies: {row: number, col: number}[] };
  rows: string[];
  recalculateAllFormulas: (data: CellData[][]) => CellData[][];
}

const TableRowExcel: React.FC<TableRowProps> = ({
  row,
  rowIdx,
  columns,
  cellData,
  selectedCell,
  setSelectedCell,
  setFormulaInput,
  setCellData,
  processFormula,
  rows,
  recalculateAllFormulas,
}) => (
  <tr key={row}>
    <td className="border border-[#d6d6d6] bg-[#fafafa] px-1.5 text-center text-[#7f7f7d] text-sm font-bold sticky left-0 z-10">
      {row}
    </td>
    {columns.map((col, colIdx) => {
      const isSelected = selectedCell?.row === rowIdx && selectedCell?.col === colIdx;
      const cell =
        cellData[rowIdx] && cellData[rowIdx][colIdx]
          ? cellData[rowIdx][colIdx]
          : { rawValue: "", displayValue: "", formula: undefined };
      return (
        <td
          key={`${col}${row}`}
          className={`border border-[#d6d6d6] bg-white px-2 text-xs h-4 relative overflow-visible ${isSelected ? 'ring-2 ring-[#217346] ring-inset' : ''}`}
          onClick={() => {
            setSelectedCell({ row: rowIdx, col: colIdx });
            setFormulaInput(cell.rawValue);
          }}
        >
          {isSelected ? (
            <input
              type="text"
              value={cell.rawValue}
              onChange={e => {
                const value = e.target.value;
                setFormulaInput(value);
                setCellData(prev => {
                  const updated = prev.map(rowArr => [...rowArr]);
                  updated[rowIdx][colIdx] = { ...updated[rowIdx][colIdx], rawValue: value };
                  return updated;
                });
              }}
              onBlur={() => {
                setCellData(prev => {
                  const updated = prev.map(rowArr => [...rowArr]);
                  const result = processFormula(cell.rawValue);
                  updated[rowIdx][colIdx] = { ...updated[rowIdx][colIdx], rawValue: cell.rawValue, displayValue: result.displayValue, formula: cell.rawValue.startsWith('=') ? cell.rawValue : undefined, dependencies: result.dependencies };
                  return recalculateAllFormulas(updated);
                });
              }}
              onKeyDown={e => {
                if (e.key === 'Enter') {
                  setCellData(prev => {
                    const updated = prev.map(rowArr => [...rowArr]);
                    const result = processFormula(cell.rawValue);
                    updated[rowIdx][colIdx] = { ...updated[rowIdx][colIdx], rawValue: cell.rawValue, displayValue: result.displayValue, formula: cell.rawValue.startsWith('=') ? cell.rawValue : undefined, dependencies: result.dependencies };
                    return recalculateAllFormulas(updated);
                  });
                  if (rowIdx < rows.length - 1) {
                    setSelectedCell({ row: rowIdx + 1, col: colIdx });
                    setFormulaInput(cellData[rowIdx + 1][colIdx].rawValue);
                  }
                }
              }}
              className="w-full h-full bg-transparent border-none outline-none font-mono whitespace-nowrap overflow-visible"
              autoFocus
            />
          ) : (
            <div className="w-full text-xs h-full flex items-center justify-end font-mono overflow-visible whitespace-nowrap">
              {cell.displayValue}
            </div>
          )}
        </td>
      );
    })}
  </tr>
);

export default TableRowExcel;
