import Image from "next/image";
import React from "react";
import { SeparatorTwo } from "./header-tools";

interface FooterExcelProps {
  sheets: string[];
  activeSheet: number;
  setActiveSheet: (idx: number) => void;
  addSheet: () => void;
}

const FooterExcel: React.FC<FooterExcelProps> = ({ sheets, activeSheet, setActiveSheet, addSheet }) => (
  <div className="flex items-center border-x border-b border-tertiary bg-[#f0f0f0] h-7 px-4 select-none">
    <div className="flex space-x-1 items-center">
        <button
        className="transition flex items-center justify-center mr-4"
        onClick={addSheet}
        title="Agregar hoja"
      >
        <Image src="/icons/eza8.svg" width={29.24} height={10.65} alt="add sheet icon" />

      </button>
      {sheets.map((sheet, idx) => (
        <button
          key={sheet}
          className={`px-4 flex items-center font-bold text-sm transition focus:outline-none ${activeSheet === idx ? 'bg-white text-[13px]  rounded h-6 border border-[#d0d0d0]  text-[#288452]' : 'text-[#b5b5b5] font-medium text-xs'}`}
          onClick={() => setActiveSheet(idx)}
        >
          {sheet}
        </button>
      ))}
      <button
        className="transition flex items-center justify-center mr-4 ml-3"
        onClick={addSheet}
        title="Agregar hoja"
      >
        <Image src="/icons/eza7.svg" width={9.43} height={9.43} alt="add sheet icon" />

      </button>
      <SeparatorTwo />
    </div>
    
  </div>
);

export default FooterExcel;
