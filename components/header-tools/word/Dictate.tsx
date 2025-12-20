import Image from "next/image";
import React from "react";

function Dictate() {
  return (
    <div className="flex flex-col tex-center justify-center items-center w-10.5 space-y-1.5 h-full">
      <button className="flex items-center text-center justify-center">
        <Image src="/icons/e1.svg" alt="Comments" width={18} height={30} />
      </button>
      <p className="text-[11px] font-medium text-[#7f7f7d]">Dictate</p>
    </div>
  );
}

export default Dictate;
