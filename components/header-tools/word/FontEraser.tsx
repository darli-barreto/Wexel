import Image from "next/image";
import React from "react";

function FontEraser() {
  return (
    <button className="cursor-pointer">
      <Image
        src="/icons/b4.svg"
        alt="font eraser button"
        width={15}
        height={14.85}
        title="FontEraser"
      />
    </button>
  );
}

export default FontEraser;
