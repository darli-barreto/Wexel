import Image from "next/image";
import React from "react";

function ConditionalFormating() {
  return (
    <div className="flex space-x-2">
      <button className="cursor-pointer">
        <Image
          src="/icons/eb6.svg"
          alt="conditional formatting button"
          width={16}
          height={16}
          title="ConditionalFormating"
        />
      </button>
      <button className="cursor-pointer">
        <Image
          src="/icons/dropdown.svg"
          alt="conditional formatting dropdown"
          width={6.5}
          height={4.5}
          title="ConditionalFormating Options"
        />
      </button>
    </div>
  );
}

export default ConditionalFormating;
