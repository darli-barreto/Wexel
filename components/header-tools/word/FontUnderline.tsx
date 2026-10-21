import RibbonButton from "../RibbonButton";
import Image from "next/image";
import React from "react";

function FontUnderline() {
  return (
    <div className="flex space-x-2.5">
      <RibbonButton action="underline" className="cursor-pointer">
        <Image src="/icons/b7.svg" alt="font underline button" width={8} height={11} title="FontUnderline" />
      </RibbonButton>
      <RibbonButton action="underline" className="cursor-pointer">
        <Image
          src="/icons/dropdown.svg"
          alt="font underline dropdown button"
          width={6.5}
          height={4.5}
          title="FontUnderlineDropdown"
        />
      </RibbonButton>
    </div>
  );
}

export default FontUnderline;
