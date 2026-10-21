import RibbonButton from "../RibbonButton";
import Image from "next/image";
import React from "react";

function DecreaseIndent() {
  return (
    <RibbonButton action="outdent" className="cursor-pointer">
      <Image
        src="/icons/c4.svg"
        alt="decrease indent button"
        width={14.11}
        height={12}
        title="DecreaseIndent"
      />
    </RibbonButton>
  );
}

export default DecreaseIndent;
