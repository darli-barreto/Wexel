import RibbonButton from "../RibbonButton";
import Image from "next/image";
import React from "react";

function WrapText() {
  return (
    <RibbonButton action="wrap" className="cursor-pointer">
      <Image
        src="/icons/ex4.svg"
        alt="wrap text button"
        width={26.5}
        height={14}
        title="WrapText"
      />
    </RibbonButton>
  );
}

export default WrapText;
