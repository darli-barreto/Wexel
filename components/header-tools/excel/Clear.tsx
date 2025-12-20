import Image from "next/image";
import React from "react";

function Clear() {
  return (
    <div className="flex items-center space-x-3.5 mt-1">
      <div className="flex items-center space-x-2">
        <button className="cursor-pointer">
          <Image src="/icons/ec3.svg" alt="clear button" width={15} height={15} title="Clear" />
        </button>

        <button className="cursor-pointer">
          <Image
            src="/icons/dropdown.svg"
            alt="clear dropdown"
            width={6.5}
            height={4.5}
            title="Clear Options"
          />
        </button>
      </div>
    </div>
  );
}

export default Clear;
