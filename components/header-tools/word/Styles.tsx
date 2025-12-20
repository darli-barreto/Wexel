import Image from "next/image";
import React from "react";

function Styles() {
  return (
    <div className="flex space-x-2 bg-white rounded border border-tertiary py-1.5 pl-5 pr-1">
      <div className="w-17.5 h-11.5 rounded-xs border-[0.25px] border-tertiary">
        <div className="flex items-center text-center justify-center h-8">
          <p className="text-[11px] text-secondary text-center tracking-wider">
            AaBbCcDd
          </p>
        </div>
        <div className="h-3.5 border-t border-styles border-b-0 border-r-0 border-l-0 border-[0.25px]">
          <p className="text-[8.5px] text-primary text-center">Normal</p>
        </div>
      </div>
      <div className="w-17.5 h-11.5 rounded-xs border-[0.25px] border-tertiary">
        <div className="flex items-center text-center justify-center h-8">
          <p className="text-[11px] text-secondary text-center">AaBbCcDd</p>
        </div>
        <div className="h-3.5 border-t border-styles border-b-0 border-r-0 border-l-0 border-[0.25px]">
          <p className="text-[8.5px] text-primary text-center">No Spacing</p>
        </div>
      </div>
      <div className="w-17.5 h-11.5 rounded-xs border-[0.25px] border-tertiary">
        <div className="flex items-center text-center justify-center h-8">
          <p className="text-[14px] font-semibold text-secondary text-center">
            AaBbCcD
          </p>
        </div>
        <div className="h-3.5 border-t border-styles border-b-0 border-r-0 border-l-0 border-[0.25px]">
          <p className="text-[8.5px] text-primary text-center">Title</p>
        </div>
      </div>
      <div className="w-17.5 h-11.5 rounded-xs border-[0.25px] border-tertiary">
        <div className="flex items-center text-center justify-center h-8">
          <p className="text-[14px] font-semibold text-[#5f9dce] text-center">
            AaBbCcD
          </p>
        </div>
        <div className="h-3.5 border-t border-styles border-b-0 border-r-0 border-l-0 border-[0.25px]">
          <p className="text-[8.5px] text-primary text-center">Heading 1</p>
        </div>
      </div>
      <div className="w-17.5 h-11.5 rounded-xs border-[0.25px] border-tertiary">
        <div className="flex items-center text-center justify-center h-8">
          <p className="text-[14px] font-light text-primary text-center">
            AaBbCcDd
          </p>
        </div>
        <div className="h-3.5 border-t border-styles border-b-0 border-r-0 border-l-0 border-[0.25px]">
          <p className="text-[8.5px] text-primary text-center">Heading 2</p>
        </div>
      </div>

      <button className="w-3.5 flex items-center text-center justify-center">
        <Image src="/icons/d1.svg" alt="Comments" width={6.5} height={4.5} />
      </button>
    </div>
  );
}

export default Styles;
