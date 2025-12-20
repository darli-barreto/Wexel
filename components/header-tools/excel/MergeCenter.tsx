import Image from "next/image";
import React from "react";

function MergeCenter() {
  return (
    <div className="flex space-x-2">
      <button>
        <Image src="/icons/ex5.svg" alt="merge center" width={15} height={15} />
      </button>
      <button>
        <Image
          src="/icons/dropdown.svg"
          alt="merge center dropdown"
          width={6.5}
          height={4.5}
        />
      </button>
    </div>
  );
}

export default MergeCenter;
