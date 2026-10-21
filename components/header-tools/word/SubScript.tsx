import RibbonButton from "../RibbonButton";
import Image from "next/image";
import React from "react";

function SubScript() {
  return (
    <RibbonButton action="subscript" className="cursor-pointer">
      <Image
        src="/icons/b9.svg"
        alt="subscript button"
        width={11.5}
        height={11}
        title="SubScript"
      />
    </RibbonButton>
  );
}

export default SubScript;
