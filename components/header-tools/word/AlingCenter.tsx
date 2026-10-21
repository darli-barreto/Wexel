import RibbonButton from "../RibbonButton";
import Image from "next/image";
import React from "react";

function AlingCenter() {
  return (
    <RibbonButton action="center" className="cursor-pointer">
      <Image
        src="/icons/c9.svg"
        alt="aling center button"
        width={14}
        height={12}
        title="AlingCenter"
      />
    </RibbonButton>
  );
}

export default AlingCenter;
