import React from "react";

interface FooterExcelProps {
  sheets: string[];
  activeSheet: number;
  setActiveSheet: (idx: number) => void;
  addSheet: () => void;
}

const FooterExcel: React.FC<FooterExcelProps> = ({ sheets, activeSheet, setActiveSheet, addSheet }) => (
  <div className="flex items-center border-x border-b border-tertiary bg-[#f3f3f3] h-9 px-4 select-none">
    <div className="flex items-center space-x-2">
      {sheets.map((sheet, idx) => (
        <button
          key={sheet}
          className={`px-4 py-1 rounded-t border border-gray-300 text-sm font-medium shadow-sm transition focus:outline-none ${activeSheet === idx ? 'bg-white border-b-2 border-b-blue-500 text-blue-600' : 'bg-gray-100 hover:bg-white text-gray-700'}`}
          onClick={() => setActiveSheet(idx)}
        >
          {sheet}
        </button>
      ))}
      <button
        className="ml-2 px-2 py-1 rounded bg-white border border-gray-300 text-lg font-bold shadow-sm hover:bg-gray-50 transition flex items-center justify-center"
        onClick={addSheet}
        title="Agregar hoja"
      >
        +
      </button>
    </div>
  </div>
);

export default FooterExcel;
