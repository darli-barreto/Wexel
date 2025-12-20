import Image from "next/image";
import React from "react";

function SortFilter() {
  return (
    <div className="items-center">
      <div className="flex text-center space-x-1 mb-1">
        <button className="mt-[3.75px]">
          <Image
            src="/icons/ec4.svg"
            alt="sort filter"
            width={28}
            height={28}
          />
        </button>
        <button className="">
          <Image
            src="/icons/dropdown.svg"
            alt="sort filter"
            width={6.5}
            height={4.5}
          />
        </button>
      </div>
      <div>
        <p className="text-[11px] leading-snug w-10 font-medium text-[#7f7f7d] text-center">
          Sort & Filter
        </p>
      </div>
    </div>
  );
}

export default SortFilter;
