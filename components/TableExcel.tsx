import React, { useState, useCallback } from "react";
import { processFormula } from "./utils/excel";
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
  dependencies: { row: number; col: number }[];
}

const TableExcel: React.FC<TableExcelProps> = ({
  columns,
  rows,
  selectedCell,
  setSelectedCell,
  setFormulaInput,
}) => {
  // 1. Inicializar la matriz con las dimensiones iniciales
  const [cellData, setCellData] = useState<CellData[][]>(() =>
    rows.map(() =>
      columns.map(() => ({
        rawValue: "",
        displayValue: "",
        formula: undefined,
        dependencies: [],
      }))
    )
  );

  // 2. Guardar las dimensiones previas para detectar si cambiaron (por scroll infinito o split)
  const [prevDimensions, setPrevDimensions] = useState({
    rowsCount: rows.length,
    colsCount: columns.length,
  });

  // 3. Ajustar el estado durante el renderizado si cambian las dimensiones
  // Patrón oficial de React: https://react.dev/learn/you-might-not-need-an-effect#adjusting-some-state-when-a-prop-changes
  if (
    prevDimensions.rowsCount !== rows.length ||
    prevDimensions.colsCount !== columns.length
  ) {
    setPrevDimensions({
      rowsCount: rows.length,
      colsCount: columns.length,
    });
    setCellData((prev) =>
      rows.map((_, rIdx) =>
        columns.map((_, cIdx) =>
          prev[rIdx]?.[cIdx] ?? {
            rawValue: "",
            displayValue: "",
            formula: undefined,
            dependencies: [],
          }
        )
      )
    );
  }

  // Usar funciones utilitarias importadas
  const processFormulaMemo = useCallback(
    (formula: string) => processFormula(formula, cellData, rows, columns),
    [cellData, rows, columns]
  );

  const recalculateAllFormulas = useCallback(
    (data: CellData[][]) => {
      return data.map((row) =>
        row.map((cell) => {
          if (cell.formula) {
            const result = processFormula(cell.formula, data, rows, columns);
            return {
              ...cell,
              displayValue: result.displayValue,
              dependencies: result.dependencies,
            };
          }
          return cell;
        })
      );
    },
    [rows, columns]
  );

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