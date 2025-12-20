import Image from "next/image";
import React from "react";

function Bullets() {
  return (
    <div className="flex space-x-2">
      <button className="cursor-pointer">
        <Image src="/icons/c1.svg" alt="bullets button" width={15} height={15} title="Bullets" />
      </button>
      <button className="cursor-pointer">
        <Image
          src="/icons/dropdown.svg"
          alt="dropdown"
          width={6.5}
          height={4.5}
          title="BulletsDropdown"
        />
      </button>
    </div>
  );
}

export default Bullets;
