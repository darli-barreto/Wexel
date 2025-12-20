import Image from "next/image";
import React from "react";

function FormatTable() {
  return (
    <div className="flex space-x-2">
      <button>
        <Image
          src="/icons/eb7.svg"
          alt="format table"
          width={17.2}
          height={17.2}
        />
      </button>
      <button>
        <Image
          src="/icons/dropdown.svg"
          alt="format table dropdown"
          width={6.5}
          height={4.5}
        />
      </button>
    </div>
  );
}

export default FormatTable;
