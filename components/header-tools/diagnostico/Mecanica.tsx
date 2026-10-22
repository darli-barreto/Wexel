import Image from "next/image";
import React from "react";

function Mecanica() {
  return (
    <div className="flex h-full flex-col items-center justify-center text-center">
      <button
        className="flex h-10 cursor-pointer items-end justify-center outline-none focus:outline-none"
        title="Mecanica de Suelo"
      >
        <Image
          src="/icons/mecanica-inactivo.svg"
          alt="Mecanica de Suelo button"
          width={16}
          height={16}
          className="h-8 w-auto"
          title="Estudio de Mecanica de Suelo"
        />
      </button>
      <p className="text-[11px] mt-1 font-medium text-[#7f7f7d]">EMS</p>
    </div>
  );
}

export default Mecanica;