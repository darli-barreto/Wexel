import Image from "next/image";
import React from "react";

function CommaStyle() {
  return (
    <button className="cursor-pointer">
      <Image
        src="/icons/eb3.svg"
        alt="comma style button"
        width={7}
        height={15}
        title="CommaStyle"
      />
    </button>
  );
}

export default CommaStyle;
