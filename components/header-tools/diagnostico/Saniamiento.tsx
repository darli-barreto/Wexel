import Image from "next/image";
import React from "react";

function Saniamiento() {
  return (
    <div className="flex h-full flex-col items-center justify-center text-center">
      <button
        className="flex h-10 cursor-pointer items-end justify-center outline-none focus:outline-none"
        title="Add Level"
      >
        <Image
          src="/icons/saneamiento-inactivo.svg"
          alt="saniamiento button"
          width={16}
          height={22}
          className="h-8 w-auto"
          title="Saniamiento"
        />
      </button>
      <p className="text-[11px] mt-1 font-medium text-[#7f7f7d]">Saniamiento</p>
    </div>
  );
}

export default Saniamiento;