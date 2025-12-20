import Image from "next/image";
import React from "react";

function StyleMoney() {
  return (
    <button className="cursor-pointer">
      <Image
        src="/icons/eb1.svg"
        alt="style money button"
        width={15}
        height={15}
        title="StyleMoney"
      />
    </button>
  );
}

export default StyleMoney;
