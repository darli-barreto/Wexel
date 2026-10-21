"use client";
import Image from "next/image";
import { useRibbon } from "../../utils/useRibbon";
const families = ["Aptos", "Arial", "Calibri", "Times New Roman", "Georgia", "Verdana", "Courier New", "monospace"];
export default function FontFamily() {
  const ribbon = useRibbon();
  const current = ribbon.format.fontFamily;
  const options = families.includes(current) ? families : [current, ...families];
  return <div className="relative cursor-pointer px-2 space-x-1.25 border-[0.5px] border-[#c6cdd2] bg-white rounded h-6 flex items-center gap-1">
    <p className="text-[13px] font-semibold whitespace-nowrap">{current}</p>
    <Image src="/icons/vector2.svg" alt="" width={7} height={4} />
    <select aria-label="Familia de fuente" value={current} onChange={(event) => ribbon.setValue("fontFamily", event.target.value)} className="absolute inset-0 w-full h-full opacity-0 cursor-pointer">
      {options.map((family) => <option key={family} value={family}>{family}</option>)}
    </select>
  </div>;
}
