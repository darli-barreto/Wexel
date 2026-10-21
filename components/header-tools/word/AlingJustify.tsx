import RibbonButton from "../RibbonButton";
import Image from "next/image";
import React from "react";

function AlingJustify() {
  return (
    <RibbonButton action="justify" className="cursor-pointer">
      <Image
        src="/icons/c11.svg"
        alt="aling justify button"
        width={14}
        height={12}
        title="AlingJustify"
      />
    </RibbonButton>
  );
}

export default AlingJustify;
