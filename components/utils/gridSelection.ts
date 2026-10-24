import type { CellPosition, SheetData } from '../../store/useWexelStore';

export function axisSelection(sheet: SheetData, axis: 'row' | 'column' | 'all', index: number, rowCount: number, columnCount: number, extend = false): Pick<SheetData, 'selectedCell' | 'selectionEnd' | 'selectionMode' | 'currentCell' | 'formulaInput'> {
  const anchor = extend && sheet.selectionMode === axis ? sheet.selectedCell : null;
  const selectedCell: CellPosition = axis === 'row' ? { row: anchor?.row ?? index, col: 0 } : axis === 'column' ? { row: 0, col: anchor?.col ?? index } : { row: 0, col: 0 };
  const selectionEnd: CellPosition = axis === 'row' ? { row: index, col: columnCount - 1 } : axis === 'column' ? { row: rowCount - 1, col: index } : { row: rowCount - 1, col: columnCount - 1 };
  const currentCell = String.fromCharCode(65 + selectedCell.col) + (selectedCell.row + 1);
  return { selectedCell, selectionEnd, selectionMode: axis, currentCell, formulaInput: sheet.cells[currentCell]?.rawValue ?? '' };
}
