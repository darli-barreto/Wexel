import RibbonButton from "../RibbonButton";
import Image from "next/image";
import React from "react";

function DecreaseDecimal() {
  return (
    <RibbonButton action="decreaseDecimal" className="cursor-pointer">
      <Image
        src="/icons/eb5.svg"
        alt="decrease decimal button"
        width={15}
        height={15}
        title="DecreaseDecimal"
      />
    </RibbonButton>
  );
}

export default DecreaseDecimal;
