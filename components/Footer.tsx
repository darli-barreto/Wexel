import React from "react";
import { useWexelStore } from "@/store/useWexelStore";
import Zoom from "./Zoom";
import Image from "next/image";

interface FooterProps {
  onWordFullscreen: () => void;
  onExcelFullscreen: () => void;
  onSplitView: () => void;
  currentView: "split" | "word" | "excel";
  onDownloadWord: () => void;
  showDownloadButton: boolean;
}

function Footer({
  onWordFullscreen,
  onExcelFullscreen,
  onSplitView,
  currentView,
  onDownloadWord,
  showDownloadButton,
}: FooterProps) {
  const word = useWexelStore((state) => state.word);
  return (
    <div className="flex justify-between h-10 bg-[#dddddd] px-6 items-center">
      {/* Información a la izquierda */}
      <div className="flex text-xs text-secondary items-center space-x-4">
        <span className="font-bold">
        <span className="text-blue-600">W</span>
        <span className="text-[#217346]">exel</span>
      </span>
        <p>Page 1 of {word.totalPages}</p>
        <p>{word.wordCount} words</p>
        <p>English (United States)</p>
        <p>Accesibility: Good to go</p>
      </div>

      {/* Botones de control de vista en el centro */}
      <div className="flex space-x-4 items-center">
        <div className="flex ">
          {showDownloadButton && (
            <button
              onClick={onDownloadWord}
              className="flex items-center space-x-2 justify-center cursor-pointer px-1 bg-blue-500 text-white hover:bg-blue-600"
              title="Descargar"
            >
              <p className="text-xs ">Download .docx</p>
            </button>
          )}
          <button
            onClick={onSplitView}
            className={`flex items-center justify-center cursor-pointer p-1 ${
              currentView === "split" ? "bg-gray-300 text-white" : " "
            }`}
            title="Pantalla dividida"
          >
            <Image
              src="/icons/divide.svg"
              alt="style money button"
              width={16}
              height={16}
              title="StyleMoney"
            />
          </button>
          <button
            onClick={onWordFullscreen}
            className={`flex items-center justify-center cursor-pointer p-1 ${
              currentView === "word"
                ? "bg-gray-300 text-white"
                : "bg-quaternary "
            }`}
            title="Word en pantalla completa"
          >
            <Image
              src="/icons/docx.svg"
              alt="style money button"
              width={16}
              height={16}
              title="StyleMoney"
            />
          </button>
          <button
            onClick={onExcelFullscreen}
            className={`flex items-center justify-center cursor-pointer p-1  ${
              currentView === "excel" ? "bg-gray-300 text-white" : " "
            }`}
            title="Excel en pantalla completa"
          >
            <Image
              src="/icons/xlsx.svg"
              alt="style money button"
              width={16}
              height={16}
              title="StyleMoney"
            />
          </button>
          
        </div>

        <Zoom />
      </div>

      {/* Zoom a la derecha */}
    </div>
  );
}

export default Footer;
