import React from "react";
import Image from "next/image";

type HeaderExcelProps = {
  currentCell: string;
  setCurrentCell: (cell: string) => void;
  incrementRow: () => void;
  decrementRow: () => void;
  selectedCell: { row: number; col: number } | null;
  setSelectedCell: (cell: { row: number; col: number } | null) => void;
  formulaInput: string;
  setFormulaInput: (value: string) => void;
};

const HeaderExcel: React.FC<HeaderExcelProps> = ({ currentCell, setCurrentCell, incrementRow, decrementRow, formulaInput, setFormulaInput }) => (
  <div className="flex items-center border-b border-x border-tertiary space-x-4 bg-white sticky top-0 z-30 h-8">
    {/* Cell Selector */}
    <div className="flex border-r border-tertiary px-2 py-1 items-center space-x-2">
      <input
        type="text"
        value={currentCell}
        onChange={(e) => setCurrentCell(e.target.value)}
        className="text-[13px] w-15 text-center"
      />
      <div className="flex flex-col space-y-1.5 items-center">
        <button className="cursor-pointer" onClick={decrementRow}>
          <Image src="/icons/eza1.svg" width={6} height={4.29} alt="up icon" />
        </button>
        <button className="cursor-pointer" onClick={incrementRow}>
          <Image src="/icons/eza2.svg" width={6} height={4.29} alt="down icon" />
        </button>
      </div>
    </div>
    {/* Function Cell */}
    <div className="flex items-center space-x-2 flex-1">
      <div className="flex space-x-3 items-center">
        <button className="cursor-pointer">
          <Image src="/icons/eza3.svg" width={9.43} height={9.43} alt="function icon" />
        </button>
        <button className="cursor-pointer">
          <Image src="/icons/eza4.svg" width={12.83} height={9.58} alt="format icon" />
        </button>
        <button className="cursor-pointer">
          <Image src="/icons/eza5.svg" width={15} height={16} alt="chart icon" />
        </button>
        <hr className="text-tertiary w-px bg-tertiary h-4" />
      </div>
      <input
        type="text"
        value={formulaInput}
        onChange={e => setFormulaInput(e.target.value)}
        placeholder="Enter formula or value"
        className="flex-1 px-2 py-1 border-none focus:outline-none focus:ring-0 text-sm"
      />
    </div>
  </div>
);

export default HeaderExcel;
