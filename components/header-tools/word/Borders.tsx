import Image from "next/image";
import React from "react";

function Borders() {
  return (
    <div className="flex space-x-2">
      <button>
        <Image src="/icons/c14.svg" alt="borders" width={15} height={15} />
      </button>
      <button>
        <Image
          src="/icons/dropdown.svg"
          alt="borders dropdown"
          width={6.5}
          height={4.5}
        />
      </button>
    </div>
  );
}

export default Borders;
