import Image from "next/image";
import React from "react";

function BottomAling() {
  return (
    <button className="cursor-pointer">
      <Image
        src="/icons/ex3.svg"
        alt="bottom aling button"
        width={14}
        height={14}
        title="BottomAling"
      />
    </button>
  );
}

export default BottomAling;
