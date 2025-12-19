import Image from "next/image";
import React from "react";

function Redo() {
  return (
    <button
      className="cursor-pointer hover:bg-quaternary px-1.5 py-2.5 transition-colors"
      title="Rehacer"
    >
      <Image src="/icons/retroceder.svg" alt="recargar" width={11.79} height={15.65} />
    </button>
  );
}

export default Redo;
