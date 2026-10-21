import RibbonButton from "../RibbonButton";
import Image from "next/image";
import React from "react";

function FontEraser() {
  return (
    <RibbonButton action="clear" className="cursor-pointer">
      <Image
        src="/icons/b4.svg"
        alt="font eraser button"
        width={15}
        height={14.85}
        title="FontEraser"
      />
    </RibbonButton>
  );
}

export default FontEraser;
