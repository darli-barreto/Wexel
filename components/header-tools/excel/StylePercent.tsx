import Image from "next/image";
import React from "react";

function StylePercent() {
  return (
    <button className="cursor-pointer">
      <Image
        src="/icons/eb2.svg"
        alt="style percent button"
        width={15}
        height={15}
        title="StylePercent"
      />
    </button>
  );
}

export default StylePercent;
