import Image from "next/image";
import React from "react";

function IncreaseDecimal() {
  return (
    <button>
      <Image
        src="/icons/eb4.svg"
        alt="increase decimal"
        width={15}
        height={15}
      />
    </button>
  );
}

export default IncreaseDecimal;
