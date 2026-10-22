import Image from "next/image";
import React from "react";

function Factibilidad() {
  return (
    <div className="flex h-full flex-col items-center justify-center text-center">
      <button
        className="flex h-10 cursor-pointer items-end justify-center outline-none focus:outline-none"
        title="Factibilidad"
      >
        <Image
          src="/icons/factibilidad-inactivo.svg"
          alt="Factibilidad"
          width={16}
          height={17}
          className="h-8 w-auto"
          title="Factibilidad"
        />
      </button>
      <p className="text-[11px] mt-1 font-medium text-[#7f7f7d]">Factibilidad</p>
    </div>
  );
}

export default Factibilidad;