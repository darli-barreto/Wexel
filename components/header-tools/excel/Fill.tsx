import Image from "next/image";
import React from "react";

function Fill() {
  return (
    <div className="flex items-center space-x-3.5 mt-1">
      <div className="flex space-x-2">
        <button className="cursor-pointer">
          <Image src="/icons/ec2.svg" alt="fill button" width={15} height={15} title="Fill" />
        </button>

        <button className="cursor-pointer">
          <Image
            src="/icons/dropdown.svg"
            alt="fill dropdown"
            width={6.5}
            height={4.5}
            title="Fill Options"
          />
        </button>
      </div>
    </div>
  );
}

export default Fill;
