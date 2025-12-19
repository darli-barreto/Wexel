import Image from "next/image";
import React from "react";

function Home() {
  return (
    <button
      className="cursor-pointer hover:bg-quaternary px-1.5 py-2.75 transition-colors"
      title="Guardar"
    >
      <Image src="/icons/home.svg" alt="Guardar" width={13.5} height={15} />
    </button>
  );
}

export default Home;
