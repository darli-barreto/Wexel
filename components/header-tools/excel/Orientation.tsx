import Image from "next/image";
import React from "react";

function Orientation() {
  return (
    <button className="cursor-pointer">
      <Image
        src="/icons/ex6.svg"
        alt="orientation button"
        width={30.84}
        height={16}
        title="Orientation"
      />
    </button>
  );
}

export default Orientation;
