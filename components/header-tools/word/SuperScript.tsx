import Image from "next/image";
import React from "react";

function SuperScript() {
  return (
    <button className="cursor-pointer">
      <Image
        src="/icons/b10.svg"
        alt="superscript button"
        width={11.5}
        height={12}
        title="SuperScript"
      />
    </button>
  );
}

export default SuperScript;
