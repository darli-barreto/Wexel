import RibbonButton from "../RibbonButton";
import Image from "next/image";
import React from "react";

function IncreaseDecimal() {
  return (
    <RibbonButton action="increaseDecimal" className="cursor-pointer">
      <Image
        src="/icons/eb4.svg"
        alt="increase decimal button"
        width={15}
        height={15}
        title="IncreaseDecimal"
      />
    </RibbonButton>
  );
}

export default IncreaseDecimal;
