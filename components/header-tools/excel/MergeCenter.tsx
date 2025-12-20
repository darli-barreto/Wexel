import Image from "next/image";
import React from "react";

function MergeCenter() {
  return (
    <div className="flex space-x-2">
      <button className="cursor-pointer">
        <Image
          src="/icons/ex5.svg"
          alt="merge center button"
          width={15}
          height={15}
          title="MergeCenter"
        />
      </button>
      <button className="cursor-pointer">
        <Image
          src="/icons/dropdown.svg"
          alt="merge center dropdown"
          width={6.5}
          height={4.5}
          title="MergeCenter Options"
        />
      </button>
    </div>
  );
}

export default MergeCenter;
