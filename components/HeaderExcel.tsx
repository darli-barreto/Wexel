import FormulaInput from "./FormulaInput";
import { useExcelEditingStore } from "@/store/useExcelEditingStore";
import { beginEdit, changeDraft, commitEdit, cancelEdit, blurEdit } from "./utils/excelEditing";
import React from "react";
import Image from "next/image";
type HeaderExcelProps = {
    currentCell: string;
    setCurrentCell: (cell: string) => void;
    incrementRow: () => void;
    decrementRow: () => void;
    selectedCell: {
        row: number;
        col: number;
    } | null;
    setSelectedCell: (cell: {
        row: number;
        col: number;
    } | null) => void;
    formulaInput: string;
    setFormulaInput: (value: string) => void;
};
const HeaderExcel: React.FC<HeaderExcelProps> = ({ currentCell, setCurrentCell, incrementRow, decrementRow, formulaInput, selectedCell, setSelectedCell }) => {
    const draft = useExcelEditingStore(s => s.draft);
    const address = currentCell.match(/^[A-Z][1-9][0-9]?$/) ? currentCell : "A1";
    const focusCell = () => requestAnimationFrame(() => document.querySelector<HTMLInputElement>('[aria-label="Celda ' + address + '" ]')?.focus());
    return (<div className="flex items-center border-b border-x border-tertiary space-x-4 bg-white sticky top-0 z-30 h-8">
    {/* Cell Selector */}
    <div className="flex border-r border-tertiary px-2 py-1 items-center space-x-2">
      <input type="text" aria-label="Dirección de celda" value={currentCell} onChange={(e) => setCurrentCell(e.target.value)} className="text-[13px] w-15 text-center"/>
      <div className="flex flex-col space-y-1.5 items-center">
        <button className="cursor-pointer" onClick={decrementRow}>
          <Image src="/icons/eza1.svg" width={6} height={4.29} alt="up icon"/>
        </button>
        <button className="cursor-pointer" onClick={incrementRow}>
          <Image src="/icons/eza2.svg" width={6} height={4.29} alt="down icon"/>
        </button>
      </div>
    </div>
    {/* Function Cell */}
    <div className="flex items-center space-x-2 flex-1">
      <div className="flex space-x-3 items-center">
        <button type="button" aria-label="Cancelar edición" className="cursor-pointer" onMouseDown={e => e.preventDefault()} onClick={() => { cancelEdit(); focusCell(); }}>
          <Image src="/icons/eza3.svg" width={9.43} height={9.43} alt="function icon"/>
        </button>
        <button aria-label="Confirmar edición" className="cursor-pointer" onMouseDown={e => e.preventDefault()} onClick={() => { commitEdit(); focusCell(); }}>
          <Image src="/icons/eza4.svg" width={12.83} height={9.58} alt="format icon"/>
        </button>
        <button aria-label="Insertar fórmula" className="cursor-pointer" onMouseDown={e => e.preventDefault()} onClick={() => { beginEdit(address, true); if (!useExcelEditingStore.getState().draft?.value)
        changeDraft("="); document.querySelector<HTMLInputElement>('[aria-label="Barra de fórmulas"]')?.focus(); }}>
          <Image src="/icons/eza5.svg" width={15} height={16} alt="chart icon"/>
        </button>
        <hr className="text-tertiary w-px bg-tertiary h-4"/>
      </div>
      <FormulaInput type="text" highlight={Boolean(draft)} aria-label="Barra de fórmulas" data-excel-input="true" value={draft?.address === address ? draft.value : formulaInput} onFocus={() => { if (!selectedCell)
        setSelectedCell({ row: 0, col: 0 }); beginEdit(address, true); }} onChange={e => { beginEdit(address, true); changeDraft(e.target.value); }} onBlur={blurEdit} onKeyDown={e => {
            if (e.nativeEvent.isComposing)
                return;
            if (e.key === 'Escape') {
                e.preventDefault();
                cancelEdit();
                focusCell();
            }
            if (e.key === 'Enter' || e.key === 'Tab') {
                e.preventDefault();
                commitEdit();
                const p = selectedCell ?? { row: 0, col: 0 };
                const offset = e.shiftKey ? -1 : 1;
                const next = e.key === 'Enter' ? { row: Math.max(0, Math.min(98, p.row + offset)), col: p.col } : { row: Math.floor(Math.max(0, Math.min(2573, p.row * 26 + p.col + offset)) / 26), col: Math.max(0, Math.min(2573, p.row * 26 + p.col + offset)) % 26 };
                setSelectedCell(next);
                requestAnimationFrame(() => document.querySelector<HTMLInputElement>('[aria-label="Celda ' + String.fromCharCode(65 + next.col) + (next.row + 1) + '"]')?.focus());
            }
        }} placeholder="Enter formula or value" className="w-full px-2 py-1 border-none focus:outline-none focus:ring-0 text-sm"/>
    </div>
  </div>);
};
export default HeaderExcel;
