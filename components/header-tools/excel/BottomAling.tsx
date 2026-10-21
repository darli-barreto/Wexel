import RibbonButton from "../RibbonButton";
import Image from "next/image";
import React from "react";

function BottomAling() {
  return (
    <RibbonButton action="bottom" className="cursor-pointer">
      <Image
        src="/icons/ex3.svg"
        alt="bottom aling button"
        width={14}
        height={14}
        title="BottomAling"
      />
    </RibbonButton>
  );
}

export default BottomAling;
