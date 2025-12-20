import Image from "next/image";
import React from "react";

function WrapText() {
  return (
    <button className="cursor-pointer">
      <Image
        src="/icons/ex4.svg"
        alt="wrap text button"
        width={26.5}
        height={14}
        title="WrapText"
      />
    </button>
  );
}

export default WrapText;
