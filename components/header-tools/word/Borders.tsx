import AdvancedButton from "../AdvancedButton";
import Image from "next/image";
import React from "react";

function Borders() {
  return (
    <div className="flex space-x-2">
      <AdvancedButton tool="borders" label="Bordes" className="cursor-pointer">
        <Image
          src="/icons/c14.svg"
          alt="borders button"
          width={15}
          height={15}
          title="Borders"
        />
      </AdvancedButton>
      <AdvancedButton tool="borders" label="Bordes" className="cursor-pointer">
        <Image
          src="/icons/dropdown.svg"
          alt="borders dropdown"
          width={6.5}
          height={4.5}
        />
      </AdvancedButton>
    </div>
  );
}

export default Borders;
