import Image from "next/image";
import React from "react";

function MultilevelList() {
  return (
    <div className="flex space-x-2">
      <button>
        <Image src="/icons/c3.svg" alt="multi level list" width={15} height={16} />
      </button>
      <button>
        <Image
          src="/icons/dropdown.svg"
          alt="multi level list dropdown"
          width={6.5}
          height={4.5}
        />
      </button>
    </div>
  );
}

export default MultilevelList;
