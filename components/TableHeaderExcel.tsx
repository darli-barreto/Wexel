import React from "react";
import type { StartResize } from "./utils/useExcelResize";
import { COLORS } from "../config/colors";
import type { CellPosition } from '../store/useWexelStore';
export const EXCEL_COLUMN_HEADER_HEIGHT = 29;
const headingStyle={height:EXCEL_COLUMN_HEADER_HEIGHT,borderColor:COLORS.excel.grid,backgroundColor:COLORS.excel.heading,color:COLORS.excel.headingText};

interface TableHeaderProps {
  columns: string[];
  startResize: StartResize;
  selectedCell: CellPosition | null;
  selectionEnd?: CellPosition;
}

const TableHeaderExcel: React.FC<TableHeaderProps> = ({ columns, startResize, selectedCell, selectionEnd }) => (
  <thead>
    <tr
      className="bg-[#fafafa] sticky top-8 z-20"
      style={{ position: 'sticky', top: 32, zIndex: 20 }}
    >
      <th data-selection-axis="all" data-selection-index="0" aria-label="Seleccionar todas las celdas" title="Seleccionar todas las celdas" style={headingStyle} className="cursor-cell border border-[#d6d6d6] text-[#7f7f7d] bg-[#fafafa] sticky top-8 left-0 z-20 after:content-[''] after:absolute after:left-0 after:right-0 after:bottom-0 after:h-px after:bg-[var(--wexel-grid)]">
      </th>
      {columns.map((col, index) => (
        <th
          data-selection-axis="column"
          data-selection-index={index}
          aria-label={`Seleccionar columna ${col}`}
          title={`Seleccionar columna ${col}`}
          style={{ ...headingStyle, cursor: 's-resize', backgroundColor: selectedCell && index >= Math.min(selectedCell.col, (selectionEnd ?? selectedCell).col) && index <= Math.max(selectedCell.col, (selectionEnd ?? selectedCell).col) ? COLORS.excel.range : headingStyle.backgroundColor }}
          key={col}
          className="border border-[#d6d6d6] text-[#7f7f7d] bg-[#fafafa] px-2 py-1 text-center text-sm font-bold w-25 sticky top-8 z-10 after:content-[''] after:absolute after:left-0 after:right-0 after:bottom-0 after:h-px after:bg-[var(--wexel-grid)]"
        >
          {col}
          <div
            data-excel-resize="column"
            aria-label={`Cambiar ancho de columna ${col}`}
            title={`Cambiar ancho de columna ${col}`}
            className="absolute right-0 top-0 bottom-0 w-1.5 cursor-col-resize z-30 select-none"
            onMouseDown={(event) => startResize(event, "column", col)}
          />
        </th>
      ))}
    </tr>
  </thead>
);

export default React.memo(TableHeaderExcel);
