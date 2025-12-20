import Image from "next/image";
import React from "react";

function IncreaseIndent() {
  return (
    <button className="cursor-pointer">
      <Image
        src="/icons/c5.svg"
        alt="increase indent button"
        width={14}
        height={12}
        title="IncreaseIndent"
      />
    </button>
  );
}

export default IncreaseIndent;
