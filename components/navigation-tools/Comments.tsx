import Image from "next/image";
import React from "react";

function Comments() {
  return (
    <button className="cursor-pointer px-2 space-x-1.25 border-[0.5px] border-tools-navigation bg-white rounded-md flex items-center gap-1">
      <Image src="/icons/Vector.svg" alt="Comments" width={14} height={14} />
      <p>Comments</p>
    </button>
  );
}

export default Comments;
