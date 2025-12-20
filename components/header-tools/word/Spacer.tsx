import Image from "next/image";
import React from "react";

function Spacer() {
  return (
    <button className="cursor-pointer">
      <Image
        src="/icons/spacer.svg"
        alt="spacer button"
        width={16}
        height={17}
        title="Spacer"
      />
    </button>
  );
}

export default Spacer;
