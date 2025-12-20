import Image from "next/image";
import React from "react";

function Paste() {
  return (
    <div className="items-center">
      <div className="flex text-center space-x-1 mb-1">
        <button className="mt-[3.75px]">
          <Image
            src="/icons/clipboard.svg"
            alt="Comments"
            width={28}
            height={32}
          />
        </button>
        <button className="">
          <Image
            src="/icons/dropdown.svg"
            alt="Comments"
            width={6.5}
            height={4.5}
          />
        </button>
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
