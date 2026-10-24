"use client";
import Image from "next/image";
import React from "react";
import { useMetradoPreviewStore } from '@/store/useMetradoPreviewStore';

function Print() {
  const preparing = useMetradoPreviewStore(state => state.active && !state.report);
  return (
    <button
      className="cursor-pointer hover:bg-quaternary px-1.5 py-2.75 transition-colors"
      title="Imprimir"
      aria-label="Imprimir"
      disabled={preparing}
      onClick={() => window.print()}
    >
      <Image src="/icons/imprimir.svg" alt="Imprimir" width={15} height={13} />
    </button>
  );
}

export default Print;
