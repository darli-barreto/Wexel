import Image from "next/image";
import React from "react";

function AlingRight() {
  return (
    <button className="cursor-pointer">
      <Image
        src="/icons/c10.svg"
        alt="aling right button"
        width={14}
        height={12}
        title="AlingRight"
      />
    </button>
  );
}

export default AlingRight;
