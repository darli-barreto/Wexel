import Image from "next/image";
import React from "react";

function TextEffects() {
  return (
    <div className="flex space-x-2">
      <button>
        <Image src="/icons/b11.svg" alt="text effects" width={18} height={15} />
      </button>
      <button>
        <Image
          src="/icons/dropdown.svg"
          alt="text effects dropdown"
          width={6.5}
          height={4.5}
        />
      </button>
    </div>
  );
}

export default TextEffects;
