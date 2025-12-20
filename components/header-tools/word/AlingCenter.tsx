import Image from "next/image";
import React from "react";

function AlingCenter() {
  return (
    <button className="cursor-pointer">
      <Image
        src="/icons/c9.svg"
        alt="aling center button"
        width={14}
        height={12}
        title="AlingCenter"
      />
    </button>
  );
}

export default AlingCenter;
