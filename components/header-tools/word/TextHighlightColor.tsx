import Image from "next/image";
import React from "react";

function TextHighlightColor() {
  return (
    <div className="flex space-x-2">
      <button className="cursor-pointer">
        <Image src="/icons/b12.svg" alt="text highlight color button" width={16.5} height={15} title="TextHighlightColor" />
      </button>
      <button className="cursor-pointer">
        <Image
          src="/icons/dropdown.svg"
          alt="text highlight color dropdown"
          width={6.5}
          height={4.5}
        />
      </button>
    </div>
  );
}

export default TextHighlightColor;
