import Image from "next/image";
import React from "react";

function Paper() {
  return (
    <button className="flex space-x-2 items-center">
      <Image src="/icons/paper.svg" alt="Comments" width={16} height={17} />
      <Image
        src="/icons/dropdown.svg"
        alt="Comments"
        width={6.5}
        height={4.5}
      />
    </button>
  );
}

export default Paper;
