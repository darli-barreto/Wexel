import Image from "next/image";
import React from "react";

function AlingLeft() {
  return (
    <button className="cursor-pointer">
      <Image
        src="/icons/c8.svg"
        alt="aling left button"
        width={14}
        height={12}
        title="AlingLeft"
      />
    </button>
  );
}

export default AlingLeft;
