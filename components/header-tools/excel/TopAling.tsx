import Image from "next/image";
import React from "react";

function TopAling() {
  return (
    <button className="cursor-pointer">
      <Image
        src="/icons/ex1.svg"
        alt="top aling button"
        width={14}
        height={14}
        title="TopAling"
      />
    </button>
  );
}

export default TopAling;
