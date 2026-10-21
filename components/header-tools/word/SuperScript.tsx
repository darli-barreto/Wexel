import RibbonButton from "../RibbonButton";
import Image from "next/image";
import React from "react";

function SuperScript() {
  return (
    <RibbonButton action="superscript" className="cursor-pointer">
      <Image
        src="/icons/b10.svg"
        alt="superscript button"
        width={11.5}
        height={12}
        title="SuperScript"
      />
    </RibbonButton>
  );
}

export default SuperScript;
