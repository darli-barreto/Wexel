import AdvancedButton from "../AdvancedButton";
import Image from "next/image";
import React from "react";

function PaintBrush() {
  return (
    <AdvancedButton tool="paint" label="Copiar o aplicar formato" className="cursor-pointer">
      <Image
        src="/icons/paintbrush.svg"
        alt="paint brush button"
        width={16}
        height={14.5}
        title="PaintBrush"
      />
    </AdvancedButton>
  );
}

export default PaintBrush;
