import RibbonButton from "../RibbonButton";
import Image from "next/image";
import React from "react";

function StyleMoney() {
  return (
    <RibbonButton action="currency" className="cursor-pointer">
      <Image
        src="/icons/eb1.svg"
        alt="style money button"
        width={15}
        height={15}
        title="StyleMoney"
      />
    </RibbonButton>
  );
}

export default StyleMoney;
