import Image from "next/image";
import React from "react";

function Spacer() {
  return (
    <button>
      <Image src="/icons/spacer.svg" alt="Comments" width={16} height={17} />
    </button>
  );
}

export default Spacer;
