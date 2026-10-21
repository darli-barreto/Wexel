import AdvancedButton from "../AdvancedButton";
import Image from "next/image";
import React from "react";

function Sort() {
  return (
    <AdvancedButton tool="sort" label="Ordenar texto" className="cursor-pointer">
      <Image
        src="/icons/c6.svg"
        alt="sort button"
        width={15}
        height={16.28}
        title="Sort"
      />
    </AdvancedButton>
  );
}

export default Sort;
