"use client";
import Image from "next/image";
import { useRibbon } from "../../utils/useRibbon";
const sizes = [6, 8, 9, 10, 10.5, 11, 12, 14, 16, 18, 20, 24, 28, 32, 36, 48, 72, 96];
export default function FontSize() {
  const ribbon = useRibbon();
  const current = ribbon.format.fontSize;
  const options = sizes.includes(current) ? sizes : [...sizes, current].sort((a,b) => a-b);
  return <div className="relative cursor-pointer px-2 space-x-1.25 border-[0.5px] border-[#c6cdd2] bg-white rounded h-6 flex items-center gap-1">
    <p className="text-[13px] font-semibold">{current}</p>
    <Image src="/icons/vector2.svg" alt="" width={7} height={4} />
    <select aria-label="Tamaño de fuente" value={current} onChange={(event) => ribbon.setValue("fontSize", event.target.value)} className="absolute inset-0 w-full h-full opacity-0 cursor-pointer">
      {options.map((size) => <option key={size} value={size}>{size}</option>)}
    </select>
  </div>;
}
