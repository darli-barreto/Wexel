import AdvancedButton from "../AdvancedButton";
import Image from "next/image";
import React from "react";

function Styles() {
  return (
    <div className="flex space-x-2 bg-white rounded border border-tertiary py-1.5 pl-5 pr-1">
      <AdvancedButton tool="styles" value="normal" label="Normal" className="w-17.5 h-11.5 rounded-xs border-[0.25px] border-tertiary cursor-pointer">
        <div className="flex items-center text-center justify-center h-8">
          <p className="text-[11px] text-secondary text-center tracking-wider">
            AaBbCcDd
          </p>
        </div>
        <div className="h-3.5 border-t border-styles border-b-0 border-r-0 border-l-0 border-[0.25px]">
          <p className="text-[8.5px] text-primary text-center">Normal</p>
        </div>
      </AdvancedButton>
      <AdvancedButton tool="styles" value="compact" label="Sin espaciado" className="w-17.5 h-11.5 rounded-xs border-[0.25px] border-tertiary cursor-pointer">
        <div className="flex items-center text-center justify-center h-8">
          <p className="text-[11px] text-secondary text-center">AaBbCcDd</p>
        </div>
        <div className="h-3.5 border-t border-styles border-b-0 border-r-0 border-l-0 border-[0.25px]">
          <p className="text-[8.5px] text-primary text-center">No Spacing</p>
        </div>
      </AdvancedButton>
      <AdvancedButton tool="styles" value="title" label="Título" className="w-17.5 h-11.5 rounded-xs border-[0.25px] border-tertiary cursor-pointer">
        <div className="flex items-center text-center justify-center h-8">
          <p className="text-[14px] font-semibold text-secondary text-center">
            AaBbCcD
          </p>
        </div>
        <div className="h-3.5 border-t border-styles border-b-0 border-r-0 border-l-0 border-[0.25px]">
          <p className="text-[8.5px] text-primary text-center">Title</p>
        </div>
      </AdvancedButton>
      <AdvancedButton tool="styles" value="heading1" label="Encabezado 1" className="w-17.5 h-11.5 rounded-xs border-[0.25px] border-tertiary cursor-pointer">
        <div className="flex items-center text-center justify-center h-8">
          <p className="text-[14px] font-semibold text-[#5f9dce] text-center">
            AaBbCcD
          </p>
        </div>
        <div className="h-3.5 border-t border-styles border-b-0 border-r-0 border-l-0 border-[0.25px]">
          <p className="text-[8.5px] text-primary text-center">Heading 1</p>
        </div>
      </AdvancedButton>
      <AdvancedButton tool="styles" value="heading2" label="Encabezado 2" className="w-17.5 h-11.5 rounded-xs border-[0.25px] border-tertiary cursor-pointer">
        <div className="flex items-center text-center justify-center h-8">
          <p className="text-[14px] font-light text-primary text-center">
            AaBbCcDd
          </p>
        </div>
        <div className="h-3.5 border-t border-styles border-b-0 border-r-0 border-l-0 border-[0.25px]">
          <p className="text-[8.5px] text-primary text-center">Heading 2</p>
        </div>
      </AdvancedButton>

      <AdvancedButton tool="styles" label="Más estilos" className="w-3.5 flex items-center text-center justify-center">
        <Image src="/icons/d1.svg" alt="Comments" width={6.5} height={4.5} />
      </AdvancedButton>
    </div>
  );
}

export default Styles;
