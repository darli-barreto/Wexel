"use client";

import { useEffect, useState } from "react";
import Header from "@/components/Header";
import TopBar from "@/components/TopBar";
import Canvaword from "@/components/Canvaword";
import Footer from "@/components/Footer";
import CanvaExcel from "@/components/CanvaExcel";
import MetradoWorkspace from "@/components/metrados/MetradoWorkspace";
import { refreshMetradoAppearance, startMetradoWorkbookSync } from "@/components/metrados/syncWorkbook";
import { PALETTE_SIGNATURE } from "@/config/colors";
import { upgradeQuispeExample } from "@/components/metrados/exampleTemplate";
import { pageBandsDocx } from "@/components/utils/pageBandsDocx";
import { Document, Packer, Paragraph, TextRun } from "docx";
import { saveAs } from "file-saver";

import { useWexelStore } from "@/store/useWexelStore";
import { useMetradoStore } from "@/store/useMetradoStore";
import { useMetradoPreviewStore } from '@/store/useMetradoPreviewStore';

export default function Home() {
  const paletteSignature = PALETTE_SIGNATURE;
  const viewMode = useWexelStore((state) => state.viewMode);
  const activeWorkbookId = useWexelStore((state) => state.activeWorkbookId);
  const setViewMode = useWexelStore((state) => state.setViewMode);
  const setActiveFocus = useWexelStore((state) => state.setActiveFocus);
  useEffect(() => {
    if (activeWorkbookId !== 'Metrados' || viewMode === 'excel') useMetradoPreviewStore.setState({ active: false, report: null, error: '' });
  }, [activeWorkbookId, viewMode]);
  const [documentReady, setDocumentReady] = useState(false);
  useEffect(() => {
    let cancelled = false;
    let stop: (() => void) | undefined;
    void Promise.all([useWexelStore.persist.rehydrate(), useMetradoStore.persist.rehydrate()]).then(() => {
      if (cancelled) return;
      upgradeQuispeExample();
      stop = startMetradoWorkbookSync();
      setDocumentReady(true);
    });
    return () => { cancelled = true; stop?.(); };
  }, []);
  useEffect(() => {
    if (documentReady) refreshMetradoAppearance();
  }, [documentReady, paletteSignature]);
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
    const report = useMetradoPreviewStore.getState().report;
    if (useMetradoPreviewStore.getState().active && !report) return;
    if (useMetradoPreviewStore.getState().active && report) {
      const { metradoReportDocx } = await import('@/components/metrados/documentDocx');
      saveAs(await Packer.toBlob(metradoReportDocx(report)), 'metrados-acero-resumen.docx');
      return;
    }
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
    <div data-app-root
      className={`flex flex-col bg-[#f0f0f0] h-screen ${
        isFullscreen ? "fixed inset-0 z-50" : ""
      }`}
    >
      {!documentReady && <div role="status" className="fixed inset-0 z-[200] flex items-center justify-center bg-white text-sm text-[#555]">Cargando documento…</div>}
      <div data-app-chrome><TopBar /><Header /></div>

      <div data-app-main className="flex flex-1 min-h-0 overflow-hidden">
        <div data-word-pane
          className={viewMode === "excel" ? "hidden" : viewMode === "split" ? "flex w-1/2 min-w-0" : "flex w-full min-w-0"}
          onFocusCapture={() => setActiveFocus("word")}
          onMouseDownCapture={() => setActiveFocus("word")}
        >
          <Canvaword isSplit={viewMode === "split"} />
        </div>
        <div data-excel-pane
          className={viewMode === "word" ? "hidden" : viewMode === "split" ? "flex w-1/2 min-w-0" : "flex w-full min-w-0"}
          onFocusCapture={() => setActiveFocus("excel")}
          onMouseDownCapture={() => setActiveFocus("excel")}
        >
          <CanvaExcel />
        </div>
      </div>

      {activeWorkbookId === "Metrados" && <MetradoWorkspace />}
      <div data-app-chrome><Footer
        onWordFullscreen={handleWordFullscreen}
        onExcelFullscreen={handleExcelFullscreen}
        onSplitView={handleSplitView}
        currentView={viewMode}
        onDownloadWord={handleDownloadWord}
        showDownloadButton={viewMode === "word" || viewMode === "split"}
      /></div>
    </div>
  );
}
