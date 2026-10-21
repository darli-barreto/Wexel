import RibbonButton from "../RibbonButton";
import Image from "next/image";
import React from "react";

function FontCrossedOut() {
  return (
    <RibbonButton action="strike" className="cursor-pointer">
      <Image
        src="/icons/b8.svg"
        alt="font crossed out button"
        width={16.61}
        height={10.18}
        title="FontCrossedOut"
      />
    </RibbonButton>
  );
}

export default FontCrossedOut;
