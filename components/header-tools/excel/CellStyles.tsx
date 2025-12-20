import Image from "next/image";
import React from "react";

function CellStyles() {
  return (
    <div className="flex space-x-2">
      <button className="cursor-pointer">
        <Image
          src="/icons/eb8.svg"
          alt="format formal button"
          width={17}
          height={17}
          title="CellStyles"
        />
      </button>
      <button className="cursor-pointer">
        <Image
          src="/icons/dropdown.svg"
          alt="format formal dropdown"
          width={6.5}
          height={4.5}
          title="CellStyles Options"
        />
      </button>
    </div>
  );
}

export default CellStyles;
