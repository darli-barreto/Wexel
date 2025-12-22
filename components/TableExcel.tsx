import React from "react";

interface TableExcelProps {
  columns: string[];
  rows: (string | number)[];
}

const TableExcel: React.FC<TableExcelProps> = ({ columns, rows }) => (
  <div className="border-x border-gray-300">
    <table className="w-full">
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
      <tbody>
        {rows.map((row) => (
          <tr key={row}>
            <td className="border border-[#d6d6d6] bg-[#fafafa] px-1.5 text-center text-[#7f7f7d] text-sm font-bold sticky left-0 z-10">
              {row}
            </td>
            {/* Celdas de datos */}
            {columns.map((col) => (
              <td
                key={`${col}${row}`}
                className="border border-[#d6d6d6] bg-white px-2 text-sm h-4"
              >
              </td>
            ))}
          </tr>
        ))}
      </tbody>
    </table>
  </div>
);

export default TableExcel;
