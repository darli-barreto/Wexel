import RibbonButton from "../RibbonButton";
import Image from "next/image";
import React from "react";

function Bullets() {
  return (
    <div className="flex space-x-2">
      <RibbonButton action="bullets" className="cursor-pointer">
        <Image src="/icons/c1.svg" alt="bullets button" width={15} height={15} title="Bullets" />
      </RibbonButton>
      <RibbonButton action="bullets" className="cursor-pointer">
        <Image
          src="/icons/dropdown.svg"
          alt="dropdown"
          width={6.5}
          height={4.5}
          title="BulletsDropdown"
        />
      </RibbonButton>
    </div>
  );
}

export default Bullets;
