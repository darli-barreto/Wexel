import RibbonButton from "../RibbonButton";
import Image from "next/image";
import React from "react";

function FontChoiceBig() {
  return (
    <RibbonButton action="grow" className="cursor-pointer">
      <Image
        src="/icons/b1.svg"
        alt="font choice big button"
        width={16.11}
        height={13}
        title="FontChoiceBig"
      />
    </RibbonButton>
  );
}

export default FontChoiceBig;
