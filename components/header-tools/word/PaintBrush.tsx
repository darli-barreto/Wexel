import Image from "next/image";
import React from "react";

function PaintBrush() {
  return (
    <button>
      <Image
        src="/icons/paintbrush.svg"
        alt="Comments"
        width={16}
        height={14.5}
      />
    </button>
  );
}

export default PaintBrush;
