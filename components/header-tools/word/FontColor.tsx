import Image from "next/image";
import React from "react";

function FontColor() {
  return (
    <div className="flex space-x-2">
      <button>
        <Image src="/icons/b13.svg" alt="font color" width={16.5} height={15} />
      </button>
      <button>
        <Image
          src="/icons/dropdown.svg"
          alt="font color dropdown"
          width={6.5}
          height={4.5}
        />
      </button>
    </div>
  );
}

export default FontColor;
