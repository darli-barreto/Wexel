import Image from "next/image";
import React from "react";

function FindSelect() {
  return (
    <div className="items-center">
      <div className="flex text-center space-x-1 mb-1">
        <button className="mt-[3.75px]">
          <Image
            src="/icons/ec5.svg"
            alt="find select"
            width={28}
            height={27}
          />
        </button>
        <button className="">
          <Image
            src="/icons/dropdown.svg"
            alt="find select dropdown"
            width={6.5}
            height={4.5}
          />
        </button>
      </div>
      <div>
        <p className="text-[11px] leading-snug w-10 font-medium text-[#7f7f7d] text-center">
          Find & Select
        </p>
      </div>
    </div>
  );
}

export default FindSelect;
