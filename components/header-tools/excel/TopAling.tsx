import RibbonButton from "../RibbonButton";
import Image from "next/image";
import React from "react";

function TopAling() {
  return (
    <RibbonButton action="top" className="cursor-pointer">
      <Image
        src="/icons/ex1.svg"
        alt="top aling button"
        width={14}
        height={14}
        title="TopAling"
      />
    </RibbonButton>
  );
}

export default TopAling;
