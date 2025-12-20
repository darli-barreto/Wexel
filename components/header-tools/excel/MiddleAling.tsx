import Image from "next/image";
import React from "react";

function MiddleAling() {
  return (
    <button className="cursor-pointer">
      <Image
        src="/icons/ex2.svg"
        alt="middle aling button"
        width={14}
        height={14}
        title="MiddleAling"
      />
    </button>
  );
}

export default MiddleAling;
