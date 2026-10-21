import RibbonButton from "../RibbonButton";
import Image from "next/image";
import React from "react";

function FontBold() {
  return (
    <RibbonButton action="bold" className="cursor-pointer">
      <Image
        src="/icons/b5.svg"
        alt="font bold button"
        width={7}
        height={10}
        title="FontBold"
      />
    </RibbonButton>
  );
}

export default FontBold;
