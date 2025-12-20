import Image from "next/image";
import React from "react";

function IncreaseDecimal() {
  return (
    <button className="cursor-pointer">
      <Image
        src="/icons/eb4.svg"
        alt="increase decimal button"
        width={15}
        height={15}
        title="IncreaseDecimal"
      />
    </button>
  );
}

export default IncreaseDecimal;
