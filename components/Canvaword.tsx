import React, { useState } from "react";

interface CanvawordProps {
  isSplit?: boolean;
  onContentChange: (content: string) => void;
}

function Canvaword({ isSplit = false, onContentChange }: CanvawordProps) {
  const [content, setContent] = useState("");

  const handleInput = (e: React.FormEvent<HTMLDivElement>) => {
    const newContent = e.currentTarget.innerHTML;
    setContent(newContent);
    onContentChange(newContent);
  };

  return (
    <div className={`flex-1 border-y h-full border-tertiary px-10 py-10 overflow-auto hide-scrollbar ${!isSplit ? 'flex justify-center' : ''}`}>
      <div
        className={`h-280.75 border bg-white shadow-lg border-tertiary p-20 ${isSplit ? 'w-full' : 'w-225'}`}
        contentEditable
        onInput={handleInput}
        style={{ outline: 'none', fontFamily: 'Arial, sans-serif', fontSize: '14px' }}
      />
    </div>
  );
}

export default Canvaword;
