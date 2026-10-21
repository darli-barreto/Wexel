"use client";

import { useEffect, useState } from "react";
import Header from "@/components/Header";
import TopBar from "@/components/TopBar";
import Canvaword from "@/components/Canvaword";
import Footer from "@/components/Footer";
import CanvaExcel from "@/components/CanvaExcel";
import { pageBandsDocx } from "@/components/utils/pageBandsDocx";
import { Document, Packer, Paragraph, TextRun } from "docx";
import { saveAs } from "file-saver";

import { useWexelStore } from "@/store/useWexelStore";

export default function Home() {
  const viewMode = useWexelStore((state) => state.viewMode);
  const setViewMode = useWexelStore((state) => state.setViewMode);
  const setActiveFocus = useWexelStore((state) => state.setActiveFocus);
  useEffect(() => { void useWexelStore.persist.rehydrate(); }, []);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const wordContent = useWexelStore((state) => state.word.content);

  const handleWordFullscreen = () => {
    setViewMode("word");
    setIsFullscreen(true);
  };

  const handleExcelFullscreen = () => {
    setViewMode("excel");
    setIsFullscreen(true);
  };

  const handleSplitView = () => {
    setViewMode("split");
    setIsFullscreen(false);
  };

  const handleDownloadWord = async () => {
    const plainText = wordContent.replace(/<[^>]*>/g, ''); // Quitar etiquetas HTML
    const word = useWexelStore.getState().word;
    const bands = await pageBandsDocx(word.header, word.footer);
    const doc = new Document({
      sections: [{
        ...bands,
        children: [
          new Paragraph({
            children: [new TextRun(plainText)],
          }),
        ],
      }],
    });

    const blob = await Packer.toBlob(doc);
    saveAs(blob, 'document.docx');
  };

  return (
    <div
      className={`flex flex-col bg-[#f0f0f0] h-screen ${
        isFullscreen ? "fixed inset-0 z-50" : ""
      }`}
    >
      <TopBar />
      <Header />

      <div className="flex flex-1 min-h-0 overflow-hidden">
        <div
          className={viewMode === "excel" ? "hidden" : viewMode === "split" ? "flex w-1/2 min-w-0" : "flex w-full min-w-0"}
          onFocusCapture={() => setActiveFocus("word")}
          onMouseDownCapture={() => setActiveFocus("word")}
        >
          <Canvaword isSplit={viewMode === "split"} />
        </div>
        <div
          className={viewMode === "word" ? "hidden" : viewMode === "split" ? "flex w-1/2 min-w-0" : "flex w-full min-w-0"}
          onFocusCapture={() => setActiveFocus("excel")}
          onMouseDownCapture={() => setActiveFocus("excel")}
        >
          <CanvaExcel />
        </div>
      </div>

      <Footer
        onWordFullscreen={handleWordFullscreen}
        onExcelFullscreen={handleExcelFullscreen}
        onSplitView={handleSplitView}
        currentView={viewMode}
        onDownloadWord={handleDownloadWord}
        showDownloadButton={viewMode === "word" || viewMode === "split"}
      />
    </div>
  );
}
