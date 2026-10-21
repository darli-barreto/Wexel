import RibbonButton from "../RibbonButton";
import Image from "next/image";
import React from "react";

function StylePercent() {
  return (
    <RibbonButton action="percent" className="cursor-pointer">
      <Image
        src="/icons/eb2.svg"
        alt="style percent button"
        width={15}
        height={15}
        title="StylePercent"
      />
    </RibbonButton>
  );
}

export default StylePercent;
