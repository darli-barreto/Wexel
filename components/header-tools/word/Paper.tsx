import Image from "next/image";
import React from "react";

function Paper() {
  return (
    <button className="flex space-x-2 items-center cursor-pointer">
      <Image src="/icons/paper.svg" alt="paper button" width={16} height={17} title="Paper" />
      <Image
        src="/icons/dropdown.svg"
        alt="dropdown button"
        width={6.5}
        height={4.5}
      />
    </button>
  );
}

export default Paper;
