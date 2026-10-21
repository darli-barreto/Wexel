import RibbonButton from "../RibbonButton";
import Image from "next/image";
import React from "react";

function FontItalic() {
  return (
    <RibbonButton action="italic" className="cursor-pointer">
      <Image
        src="/icons/b6.svg"
        alt="font italic button"
        width={8}
        height={10}
        title="FontItalic"
      />
    </RibbonButton>
  );
}

export default FontItalic;
