import Image from "next/image";
import React from "react";

function PaintBrush() {
  return (
    <button className="cursor-pointer">
      <Image
        src="/icons/paintbrush.svg"
        alt="paint brush button"
        width={16}
        height={14.5}
        title="PaintBrush"
      />
    </button>
  );
}

export default PaintBrush;
