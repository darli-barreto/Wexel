"use client";

import { useState } from "react";
import Header from "@/components/Header";
import TopBar from "@/components/TopBar";
import Canvaword from "@/components/Canvaword";
import Footer from "@/components/Footer";
import CanvaExcel from "@/components/CanvaExcel";

export default function Home() {
  const [viewMode, setViewMode] = useState<'split' | 'word' | 'excel'>('excel');
  const [isFullscreen, setIsFullscreen] = useState(false);

  const handleWordFullscreen = () => {
    setViewMode('word');
    setIsFullscreen(true);
  };

  const handleExcelFullscreen = () => {
    setViewMode('excel');
    setIsFullscreen(true);
  };

  const handleSplitView = () => {
    setViewMode('split');
    setIsFullscreen(false);
  };

  return (
    <div className={`flex flex-col bg-[#f0f0f0] h-screen ${isFullscreen ? 'fixed inset-0 z-50' : ''}`}>
      <TopBar />
      <Header />
      
      <div className="flex  overflow-hidden">
        {/* Vista dividida (default) */}
        {viewMode === 'split' && (
          <div className="flex w-full">
            <div className="w-1/2"><Canvaword /></div>
            <div className="w-1/2"><CanvaExcel isSplit={true} /></div>
          </div>
        )}
        
        {/* Solo Word */}
        {viewMode === 'word' && (
            <Canvaword />
        )}
        
        {/* Solo Excel */}
        {viewMode === 'excel' && (
            <CanvaExcel isSplit={false} />
        )}
      </div>
      
      <Footer 
        onWordFullscreen={handleWordFullscreen}
        onExcelFullscreen={handleExcelFullscreen}
        onSplitView={handleSplitView}
        currentView={viewMode}
      />
    </div>
  );
}