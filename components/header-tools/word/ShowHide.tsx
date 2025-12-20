import Image from "next/image";
import React from "react";

function ShowHide() {
  return (
    <button className="cursor-pointer">
      <Image
        src="/icons/c7.svg"
        alt="show hide button"
        width={9}
        height={11.5}
        title="ShowHide"
      />
    </button>
  );
}

export default ShowHide;
