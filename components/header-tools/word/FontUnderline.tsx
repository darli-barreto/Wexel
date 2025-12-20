import Image from "next/image";
import React from "react";

function FontUnderline() {
  return (
    <div className="flex space-x-2.5">
      <button>
        <Image src="/icons/b7.svg" alt="fontunderline" width={8} height={11} />
      </button>
      <button>
        <Image
          src="/icons/dropdown.svg"
          alt="fontunderline"
          width={6.5}
          height={4.5}
        />
      </button>
    </div>
  );
}

export default FontUnderline;
