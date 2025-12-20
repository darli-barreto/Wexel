import Image from "next/image";
import React from "react";

function FontSize() {
  return (
    <button className="cursor-pointer px-2 space-x-1.25 border-[0.5px] border-[#c6cdd2] bg-white rounded h-6 flex items-center gap-1">
      <p className="text-[13px] font-semibold">12</p>
      <Image src="/icons/vector2.svg" alt="font size button" width={7} height={4} title="FontSize" />
    </button>
  );
}

export default FontSize;
