import Image from "next/image";
import React from "react";

function AlingJustify() {
  return (
    <button className="cursor-pointer">
      <Image
        src="/icons/c11.svg"
        alt="aling justify button"
        width={14}
        height={12}
        title="AlingJustify"
      />
    </button>
  );
}

export default AlingJustify;
