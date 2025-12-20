import Image from "next/image";
import React from "react";

function FormatTable() {
  return (
    <div className="flex space-x-2">
      <button className="cursor-pointer">
        <Image
          src="/icons/eb7.svg"
          alt="format table button"
          width={17.2}
          height={17.2}
          title="FormatTable"
        />
      </button>
      <button className="cursor-pointer">
        <Image
          src="/icons/dropdown.svg"
          alt="format table dropdown"
          width={6.5}
          height={4.5}
          title="FormatTable Options"
        />
      </button>
    </div>
  );
}

export default FormatTable;
