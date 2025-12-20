import Image from "next/image";
import React from "react";

function FontBold() {
  return (
    <button className="cursor-pointer">
      <Image
        src="/icons/b5.svg"
        alt="font bold button"
        width={7}
        height={10}
        title="FontBold"
      />
    </button>
  );
}

export default FontBold;
