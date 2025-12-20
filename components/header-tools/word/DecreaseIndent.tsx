import Image from "next/image";
import React from "react";

function DecreaseIndent() {
  return (
    <button className="cursor-pointer">
      <Image
        src="/icons/c4.svg"
        alt="decrease indent button"
        width={14.11}
        height={12}
        title="DecreaseIndent"
      />
    </button>
  );
}

export default DecreaseIndent;
