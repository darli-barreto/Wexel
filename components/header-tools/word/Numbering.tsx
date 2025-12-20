import Image from "next/image";
import React from "react";

function Numbering() {
  return (
    <div className="flex space-x-2">
      <button>
        <Image src="/icons/c2.svg" alt="numbering" width={15} height={15} />
      </button>
      <button>
        <Image
          src="/icons/dropdown.svg"
          alt="dropdown numbering"
          width={6.5}
          height={4.5}
        />
      </button>
    </div>
  );
}

export default Numbering;
