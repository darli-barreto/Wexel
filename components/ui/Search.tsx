import Image from "next/image";
import React from "react";

function Search() {
  return (
    <div className="relative">
      <Image
        src="/icons/search.svg"
        alt="Search"
        className="absolute left-2 top-1/2 -translate-y-1/2"
        width={12}
        height={12}
      />
      <input
        placeholder="Search (Cmd + Ctrl + U)"
        type="text"
        className="w-70 h-6 pl-8 pr-2 text-[13px] placeholder-tertiary placeholder:text-[13px] border border-tertiary rounded-md focus:outline-none focus:ring-0"
      />
    </div>
  );
}

export default Search;
