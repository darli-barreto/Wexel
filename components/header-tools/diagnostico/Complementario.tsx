import Image from "next/image";
import React from "react";

function Complementario() {
  return (
    <div className="flex h-full flex-col items-center justify-center text-center">
      <button
        className="flex h-10 cursor-pointer items-end justify-center outline-none focus:outline-none"
        title="Estudio Complementario"
      >
        <Image
          src="/icons/complementario-inactivo.svg"
          alt="Complementario"
          width={16}
          height={16}
          className="h-8 w-auto"
          title="Estudio Complementario"
        />
      </button>
      <p className="text-[11px] mt-1 font-medium text-[#7f7f7d]">ECM</p>
    </div>
  );
}

export default Complementario;