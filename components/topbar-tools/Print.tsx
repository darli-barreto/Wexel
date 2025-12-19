import Image from "next/image";
import React from "react";

function Print() {
  return (
    <button
      className="cursor-pointer hover:bg-quaternary px-1.5 py-2.75 transition-colors"
      title="Imprimir"
    >
      <Image src="/icons/imprimir.svg" alt="Imprimir" width={15} height={13} />
    </button>
  );
}

export default Print;
