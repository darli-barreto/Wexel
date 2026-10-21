import RibbonButton from "../RibbonButton";
import Image from "next/image";
import React from "react";

function MiddleAling() {
  return (
    <RibbonButton action="middle" className="cursor-pointer">
      <Image
        src="/icons/ex2.svg"
        alt="middle aling button"
        width={14}
        height={14}
        title="MiddleAling"
      />
    </RibbonButton>
  );
}

export default MiddleAling;
