import React from "react";
import type { StartResize } from "./utils/useExcelResize";

interface TableHeaderProps {
  columns: string[];
  startResize: StartResize;
}

const TableHeaderExcel: React.FC<TableHeaderProps> = ({ columns, startResize }) => (
  <thead>
    <tr
      className="bg-[#fafafa] sticky top-8 z-20"
      style={{ position: 'sticky', top: 32, zIndex: 20 }}
    >
      <th className="border border-[#d6d6d6] text-[#7f7f7d] bg-[#fafafa] sticky top-8 left-0 z-20 after:content-[''] after:absolute after:left-0 after:right-0 after:bottom-0 after:h-px after:bg-[#d6d6d6]">
      </th>
      {columns.map((col) => (
        <th
          key={col}
          className="border border-[#d6d6d6] text-[#7f7f7d] bg-[#fafafa] px-2 py-1 text-center text-sm font-bold w-25 sticky top-8 z-10 after:content-[''] after:absolute after:left-0 after:right-0 after:bottom-0 after:h-px after:bg-[#d6d6d6]"
        >
          {col}
          <div
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

export default TableHeaderExcel;
