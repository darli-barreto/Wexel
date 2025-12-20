import Image from "next/image";
import React from "react";

function Share() {
  return (
    <button className="cursor-pointer px-2 space-x-1.25 border-[0.5px] border-tools-navigation bg-white rounded-md flex items-center gap-1">
      <Image src="/icons/share.svg" alt="Share" width={14} height={14} />
      <p>Share</p>
      <Image src="/icons/vector2.svg" alt="Editing" width={7} height={4} />
    </button>
  );
}

export default Share;
