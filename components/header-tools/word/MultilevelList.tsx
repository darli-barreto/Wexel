import Image from "next/image";
import React from "react";

function MultilevelList() {
  return (
    <div className="flex space-x-2">
      <button className="cursor-pointer">
        <Image src="/icons/c3.svg" alt="multi level list button" width={15} height={16} title="MultilevelList" />
      </button>
      <button className="cursor-pointer">
        <Image
          src="/icons/dropdown.svg"
          alt="multi level list dropdown"
          width={6.5}
          height={4.5}
          title="MultilevelList Options"
        />
      </button>
    </div>
  );
}

export default MultilevelList;
