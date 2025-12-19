import Image from "next/image";
import React from "react";

function Save() {
  return (
    <button
      className="cursor-pointer hover:bg-quaternary px-1.5 py-2.5 transition-colors"
      title="Guardar"
    >
      <Image src="/icons/save.svg" alt="Guardar" width={16} height={15} />
    </button>
  );
}

export default Save;
