import Image from "next/image";
import React from "react";

function CellStyles() {
  return (
    <div className="flex space-x-2">
      <button>
        <Image
          src="/icons/eb8.svg"
          alt="format formal"
          width={17}
          height={17}
        />
      </button>
      <button>
        <Image
          src="/icons/dropdown.svg"
          alt="format formal dropdown"
          width={6.5}
          height={4.5}
        />
      </button>
    </div>
  );
}

export default CellStyles;
