import AdvancedButton from "../AdvancedButton";
import Image from "next/image";
import React from "react";

function AlingParagraphSpacing() {
  return (
    <AdvancedButton tool="spacing" label="Interlineado" className="cursor-pointer">
      <Image
        src="/icons/c12.svg"
        alt="aling paragraph spacing button"
        width={30.5}
        height={12}
        title="AlingParagraphSpacing"
      />
    </AdvancedButton>
  );
}

export default AlingParagraphSpacing;
