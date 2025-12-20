import Image from "next/image";
import React from "react";

function Sort() {
  return (
    <button className="cursor-pointer">
      <Image
        src="/icons/c6.svg"
        alt="sort button"
        width={15}
        height={16.28}
        title="Sort"
      />
    </button>
  );
}

export default Sort;
