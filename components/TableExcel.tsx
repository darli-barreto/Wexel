import React, { useState, useEffect, useCallback } from "react";
import {
  processFormula,
} from "./utils/excel";
import TableHeaderExcel from "./TableHeaderExcel";
import TableRowExcel from "./TableRowExcel";

interface TableExcelProps {
  columns: string[];
  rows: string[];
  selectedCell: { row: number; col: number } | null;
  setSelectedCell: (cell: { row: number; col: number } | null) => void;
  formulaInput: string;
  setFormulaInput: (value: string) => void;
}

export interface CellData {
  rawValue: string;
  displayValue: string;
  formula?: string;
  dependencies: {row: number, col: number}[];
}

const TableExcel: React.FC<TableExcelProps> = ({
  columns,
  rows,
  selectedCell,
  setSelectedCell,
  setFormulaInput,
}) => {
  // Inicializar datos de celdas con fórmula y valor
  // (Eliminado: declaración duplicada de cellData)
  const [cellData, setCellData] = useState<CellData[][]>([]);

  // Sincronizar cellData con cambios en rows/columns
  useEffect(() => {
    const newCellData = rows.map(() =>
      columns.map(() => ({
        rawValue: "",
        displayValue: "",
        formula: undefined,
        dependencies: [],
      }))
    );
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setCellData(newCellData);
  }, [rows, columns]);

  // Usar funciones utilitarias importadas
  const processFormulaMemo = useCallback(
    (formula: string) => processFormula(formula, cellData, rows, columns),
    [cellData, rows, columns]
  );

  const recalculateAllFormulas = useCallback((data: CellData[][]) => {
    return data.map(row => row.map(cell => {
      if (cell.formula) {
        const result = processFormula(cell.formula, data, rows, columns);
        return { ...cell, displayValue: result.displayValue, dependencies: result.dependencies };
      }
      return cell;
    }));
  }, [rows, columns]);

  return (
    <div className="border-x border-gray-300">
      <table className="w-full">
        <TableHeaderExcel columns={columns} />
        <tbody>
          {rows.map((row, rowIdx) => (
            <TableRowExcel
              key={row}
              row={row}
              rowIdx={rowIdx}
              columns={columns}
              cellData={cellData}
              selectedCell={selectedCell}
              setSelectedCell={setSelectedCell}
              setFormulaInput={setFormulaInput}
              setCellData={setCellData}
              processFormula={processFormulaMemo}
              rows={rows}
              recalculateAllFormulas={recalculateAllFormulas}
            />
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default TableExcel;
