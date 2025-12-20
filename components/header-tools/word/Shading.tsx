import Image from "next/image";
import React from "react";

function Shading() {
  return (
    <div className="flex space-x-2">
      <button>
        <Image src="/icons/c13.svg" alt="shading" width={16.5} height={16} />
      </button>
      <button>
        <Image
          src="/icons/dropdown.svg"
          alt="shading dropdown"
          width={6.5}
          height={4.5}
        />
      </button>
    </div>
  );
}

export default Shading;
