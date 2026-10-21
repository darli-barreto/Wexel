import AdvancedButton from "../AdvancedButton";
import Image from "next/image";
import React from "react";

function Paste() {
  return (
    <div className="items-center">
      <div className="flex  text-center space-x-1 mb-1">
        <AdvancedButton tool="paste" label="Pegar" className="mt-[3.75px] cursor-pointer">
          <Image
            src="/icons/clipboard.svg"
            alt="paste button"
            width={28}
            height={32}
            title="Paste"
          />
        </AdvancedButton>
        <AdvancedButton tool="paste" label="Pegar" className="">
          <Image
            src="/icons/dropdown.svg"
            alt="paste dropdown"
            width={6.5}
            height={4.5}
            title="Paste Options"
          />
        </AdvancedButton>
      </div>
      <div>
        <p className="text-[11px] font-medium text-[#7f7f7d] text-center">
          Paste
        </p>
      </div>
    </div>
  );
}

export default Paste;
