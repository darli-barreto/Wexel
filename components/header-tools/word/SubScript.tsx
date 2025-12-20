import Image from "next/image";
import React from "react";

function SubScript() {
  return (
    <button className="cursor-pointer">
      <Image
        src="/icons/b9.svg"
        alt="subscript button"
        width={11.5}
        height={11}
        title="SubScript"
      />
    </button>
  );
}

export default SubScript;
