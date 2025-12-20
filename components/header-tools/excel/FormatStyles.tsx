import Image from "next/image";
import React from "react";

function FormatStyles() {
  return (
    <div className="flex space-x-2">
      <button className="cursor-pointer">
        <Image src="/icons/eb11.svg" alt="format styles button" width={16} height={16} title="FormatStyles" />
      </button>
      <div className="flex space-x-1 items-center">
        <p className="text-[11px] text-[#7f7f7d]">Formal</p>
        <button className="cursor-pointer">
          <Image
            src="/icons/dropdown.svg"
            alt="dropdown format styles"
            width={6.5}
            height={4.5}
            title="Format Styles Options"
          />
        </button>
      </div>
    </div>
  );
}

export default FormatStyles;
