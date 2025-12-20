import Image from "next/image";
import React from "react";

function Numbering() {
  return (
    <div className="flex space-x-2">
      <button className="cursor-pointer">
        <Image src="/icons/c2.svg" alt="numbering button" width={15} height={15} title="Numbering" />
      </button>
      <button className="cursor-pointer">
        <Image
          src="/icons/dropdown.svg"
          alt="dropdown numbering"
          width={6.5}
          height={4.5}
          title="NumberingDropdown"
        />
      </button>
    </div>
  );
}

export default Numbering;
