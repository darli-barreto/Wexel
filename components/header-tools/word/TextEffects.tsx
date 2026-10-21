import AdvancedButton from "../AdvancedButton";
import Image from "next/image";
import React from "react";

function TextEffects() {
  return (
    <div className="flex space-x-2">
      <AdvancedButton tool="effects" label="Efectos de texto" className="cursor-pointer">
        <Image src="/icons/b11.svg" alt="text effects button" width={18} height={15} title="TextEffects" />
      </AdvancedButton>
      <AdvancedButton tool="effects" label="Efectos de texto" className="cursor-pointer">
        <Image
          src="/icons/dropdown.svg"
          alt="text effects dropdown"
          width={6.5}
          height={4.5}
          title="TextEffectsDropdown"
        />
      </AdvancedButton>
    </div>
  );
}

export default TextEffects;
