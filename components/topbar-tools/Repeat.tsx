import Image from "next/image";
import React from "react";

function Repaet() {
  return (
    <button
      className="cursor-pointer hover:bg-quaternary px-1.5 py-2.75 transition-colors"
      title="Guardar"
    >
      <Image src="/icons/recargar.svg" alt="Guardar" width={14} height={14} />
    </button>
  );
}

export default Repaet;
