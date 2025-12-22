import type { CellData } from "../TableExcel";

export function parseCellRef(ref: string, rowsLength: number, columnsLength: number): { row: number; col: number } | null {
  const match = ref.match(/^([A-Z]+)(\d+)$/i);
  if (!match) return null;

  const colLetters = match[1].toUpperCase();
  const rowNum = parseInt(match[2]);

  let colIndex = 0;
  for (let i = 0; i < colLetters.length; i++) {
    colIndex = colIndex * 26 + (colLetters.charCodeAt(i) - 'A'.charCodeAt(0) + 1);
  }
  colIndex -= 1;

  const rowIndex = rowNum - 1;

  if (rowIndex >= 0 && rowIndex < rowsLength && colIndex >= 0 && colIndex < columnsLength) {
    return { row: rowIndex, col: colIndex };
  }
  return null;
}

export function evaluateExpression(expression: string, cellData: CellData[][], rowsLength: number, columnsLength: number): number {
  try {
    const cellRefRegex = /[A-Z]+\d+/gi;
    let evaluatedExpr = expression;
    let match;
    while ((match = cellRefRegex.exec(expression)) !== null) {
      const cellRef = match[0];
      const cellPos = parseCellRef(cellRef, rowsLength, columnsLength);
      if (cellPos) {
        const cell = cellData[cellPos.row][cellPos.col];
        const value = parseFloat(cell.displayValue) || 0;
        evaluatedExpr = evaluatedExpr.replace(cellRef, value.toString());
      }
    }
    const result = Function(`"use strict"; return (${evaluatedExpr})`)();
    return parseFloat(result) || 0;
  } catch (error) {
    console.error("Error evaluating expression:", error);
    return 0;
  }
}

export function processFormula(
  formula: string,
  cellData: CellData[][],
  rows: string[],
  columns: string[]
): { displayValue: string, dependencies: {row: number, col: number}[] } {
  if (!formula.startsWith('=')) return { displayValue: formula, dependencies: [] };
  const formulaBody = formula.substring(1).trim();
  const dependencies: {row: number, col: number}[] = [];

  // Extraer todas las referencias de celdas
  const cellRefRegex = /[A-Z]+\d+/gi;
  let match;
  while ((match = cellRefRegex.exec(formulaBody)) !== null) {
    const cellRef = match[0];
    const cellPos = parseCellRef(cellRef, rows.length, columns.length);
    if (cellPos && !dependencies.some(d => d.row === cellPos.row && d.col === cellPos.col)) {
      dependencies.push(cellPos);
    }
  }

  try {
    if (formulaBody.toUpperCase().startsWith('SUM(')) {
      const rangeMatch = formulaBody.match(/SUM\(([^)]+)\)/i);
      if (rangeMatch) {
        const range = rangeMatch[1];
        if (range.includes(':')) {
          const [start, end] = range.split(':');
          const startPos = parseCellRef(start, rows.length, columns.length);
          const endPos = parseCellRef(end, rows.length, columns.length);
          if (startPos && endPos) {
            // Agregar dependencias del rango
            for (let r = Math.min(startPos.row, endPos.row); r <= Math.max(startPos.row, endPos.row); r++) {
              for (let c = Math.min(startPos.col, endPos.col); c <= Math.max(startPos.col, endPos.col); c++) {
                if (!dependencies.some(d => d.row === r && d.col === c)) {
                  dependencies.push({row: r, col: c});
                }
              }
            }
            let sum = 0;
            for (let r = Math.min(startPos.row, endPos.row); r <= Math.max(startPos.row, endPos.row); r++) {
              for (let c = Math.min(startPos.col, endPos.col); c <= Math.max(startPos.col, endPos.col); c++) {
                sum += parseFloat(cellData[r][c].displayValue) || 0;
              }
            }
            return { displayValue: sum.toString(), dependencies };
          }
        }
      }
    } else if (formulaBody.toUpperCase().startsWith('AVERAGE(')) {
      const rangeMatch = formulaBody.match(/AVERAGE\(([^)]+)\)/i);
      if (rangeMatch) {
        const range = rangeMatch[1];
        if (range.includes(':')) {
          const [start, end] = range.split(':');
          const startPos = parseCellRef(start, rows.length, columns.length);
          const endPos = parseCellRef(end, rows.length, columns.length);
          if (startPos && endPos) {
            // Agregar dependencias del rango
            for (let r = Math.min(startPos.row, endPos.row); r <= Math.max(startPos.row, endPos.row); r++) {
              for (let c = Math.min(startPos.col, endPos.col); c <= Math.max(startPos.col, endPos.col); c++) {
                if (!dependencies.some(d => d.row === r && d.col === c)) {
                  dependencies.push({row: r, col: c});
                }
              }
            }
            let sum = 0;
            let count = 0;
            for (let r = Math.min(startPos.row, endPos.row); r <= Math.max(startPos.row, endPos.row); r++) {
              for (let c = Math.min(startPos.col, endPos.col); c <= Math.max(startPos.col, endPos.col); c++) {
                const value = parseFloat(cellData[r][c].displayValue);
                if (!isNaN(value)) {
                  sum += value;
                  count++;
                }
              }
            }
            return { displayValue: count > 0 ? (sum / count).toString() : "0", dependencies };
          }
        }
      }
    } else {
      return { displayValue: evaluateExpression(formulaBody, cellData, rows.length, columns.length).toString(), dependencies };
    }
  } catch (error) {
    console.error("Error processing formula:", error);
    return { displayValue: "#ERROR", dependencies: [] };
  }
  return { displayValue: "#ERROR", dependencies: [] };
}
