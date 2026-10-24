"use client";
import Image from "next/image";
import React from "react";
import { useWexelStore } from '@/store/useWexelStore';
import { commitEdit } from '../utils/excelEditing';

function Home() {
  return (
    <button
      className="cursor-pointer hover:bg-quaternary px-1.5 py-2.75 transition-colors"
      title="Abrir lienzo en blanco"
      aria-label="Abrir lienzo en blanco"
      onClick={() => { commitEdit(); useWexelStore.getState().openBlankWorkbook(); }}
    >
      <Image src="/icons/home.svg" alt="" width={13.5} height={15} />
    </button>
  );
}

export default Home;
