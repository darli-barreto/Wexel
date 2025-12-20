import Image from "next/image";
import React from "react";

function Sum() {
  return (
    <div className="flex space-x-2">
      <button className="cursor-pointer">
        <Image src="/icons/ec1.svg" alt="sum button" width={15} height={15} title="Sum" />
      </button>
      <button className="cursor-pointer">
        <Image
          src="/icons/dropdown.svg"
          alt="sum dropdown"
          width={6.5}
          height={4.5}
          title="Sum Options"
        />
      </button>
    </div>
  );
}

export default Sum;
