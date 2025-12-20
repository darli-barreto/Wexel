import Image from "next/image";
import React from "react";

function FontMayus() {
  return (
    <div className="flex space-x-2">
      <button>
        <Image src="/icons/b3.svg" alt="Comments" width={16} height={10} />
      </button>
      <button>
        <Image
          src="/icons/dropdown.svg"
          alt="Comments"
          width={6.5}
          height={4.5}
        />
      </button>
    </div>
  );
}

export default FontMayus;
