import RibbonButton from "../RibbonButton";
import Image from "next/image";
import React from "react";

function AlingLeft() {
  return (
    <RibbonButton action="left" className="cursor-pointer">
      <Image
        src="/icons/c8.svg"
        alt="aling left button"
        width={14}
        height={12}
        title="AlingLeft"
      />
    </RibbonButton>
  );
}

export default AlingLeft;
