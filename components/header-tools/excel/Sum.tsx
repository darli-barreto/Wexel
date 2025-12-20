import Image from "next/image";
import React from "react";

function Sum() {
  return (
    <div className="flex space-x-2">
      <button>
        <Image src="/icons/ec1.svg" alt="sum" width={15} height={15} />
      </button>
      <button>
        <Image
          src="/icons/dropdown.svg"
          alt="sum dropdown"
          width={6.5}
          height={4.5}
        />
      </button>
    </div>
  );
}

export default Sum;
