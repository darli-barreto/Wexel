import Image from "next/image";
import React from "react";
import type { SheetData } from "@/store/useWexelStore";
import { SeparatorTwo } from "./header-tools";

interface FooterExcelProps {
  sheets: SheetData[];
  activeSheet: string;
  setActiveSheet: (id: string) => void;
  addSheet: () => void;
}

const FooterExcel: React.FC<FooterExcelProps> = ({ sheets, activeSheet, setActiveSheet, addSheet }) => (
  <div className="flex items-center border-x border-b border-tertiary bg-[#f0f0f0] h-7 px-4 select-none shrink-0 overflow-x-auto hide-scrollbar">
    <div className="flex space-x-1 items-center">
        <button
        className="transition flex items-center justify-center mr-4"
        onClick={addSheet}
        title="Agregar hoja"
      >
        <Image src="/icons/eza8.svg" width={29.24} height={10.65} alt="add sheet icon" />

      </button>
      {sheets.map((sheet) => (
        <button
          key={sheet.id}
          aria-pressed={activeSheet === sheet.id}
          className={`px-4 flex items-center font-bold text-sm transition focus:outline-none ${activeSheet === sheet.id ? 'bg-white text-[13px]  rounded h-6 border border-[#d0d0d0]  text-[#288452]' : 'text-[#b5b5b5] font-medium text-xs'}`}
          onClick={() => setActiveSheet(sheet.id)}
        >
          {sheet.name}
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
