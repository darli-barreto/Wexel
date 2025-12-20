import Image from "next/image";
import React from "react";

function FontChoiceLitle() {
  return (
    <button className="cursor-pointer">
      <Image
        src="/icons/b2.svg"
        alt="font choice little button"
        width={14.19}
        height={13}
        title="FontChoiceLitle"
      />
    </button>
  );
}

export default FontChoiceLitle;
