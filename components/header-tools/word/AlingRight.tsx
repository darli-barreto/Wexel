import RibbonButton from "../RibbonButton";
import Image from "next/image";
import React from "react";

function AlingRight() {
  return (
    <RibbonButton action="right" className="cursor-pointer">
      <Image
        src="/icons/c10.svg"
        alt="aling right button"
        width={14}
        height={12}
        title="AlingRight"
      />
    </RibbonButton>
  );
}

export default AlingRight;
