import React from "react";

interface TableHeaderProps {
  columns: string[];
}

const TableHeaderExcel: React.FC<TableHeaderProps> = ({ columns }) => (
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
        </th>
      ))}
    </tr>
  </thead>
);

export default TableHeaderExcel;
