import Image from "next/image";
import React from "react";

function FontMayus() {
  return (
    <div className="flex space-x-2">
      <button className="cursor-pointer">
        <Image src="/icons/b3.svg" alt="font mayus button" width={16} height={10} title="FontMayus" />
      </button>
      <button className="cursor-pointer">
        <Image
          src="/icons/dropdown.svg"
          alt="font mayus dropdown button"
          width={6.5}
          height={4.5}
          title="FontMayusDropdown"
        />
      </button>
    </div>
  );
}

export default FontMayus;
