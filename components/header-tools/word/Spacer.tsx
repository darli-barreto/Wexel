import AdvancedButton from "../AdvancedButton";
import Image from "next/image";
import React from "react";

function Spacer() {
  return (
    <AdvancedButton tool="cut" label="Cortar" className="cursor-pointer">
      <Image
        src="/icons/spacer.svg"
        alt="spacer button"
        width={16}
        height={17}
        title="Spacer"
      />
    </AdvancedButton>
  );
}

export default Spacer;
