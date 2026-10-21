"use client";

import Image from "next/image";
import { useRibbon } from "../utils/useRibbon";

function colorHex(value: string): string {
  if (/^#[0-9a-f]{6}$/i.test(value)) return value;
  if (/^#[0-9a-f]{3}$/i.test(value)) return `#${value.slice(1).split("").map((part) => part + part).join("")}`;
  const rgb = value.match(/^rgba?\(\s*(\d+)[,\s]+(\d+)[,\s]+(\d+)/i);
  return rgb ? `#${rgb.slice(1, 4).map((part) => Number(part).toString(16).padStart(2, "0")).join("")}` : "#171717";
}

export default function RibbonColor({ type, icon, height = 15, label }:
  { type: "color" | "highlight"; icon: string; height?: number; label: string }) {
  const ribbon = useRibbon();
  return <div className="flex space-x-2 relative" title={label}>
    <button type="button" aria-label={`Aplicar ${label.toLowerCase()}`} className="cursor-pointer"
      onMouseDown={(event) => event.preventDefault()} onClick={() => ribbon.setValue(type, ribbon.format[type])}>
      <Image src={icon} alt={label} width={16.5} height={height} />
    </button>
    <span className="relative cursor-pointer flex items-center">
      <Image src="/icons/dropdown.svg" alt="" width={6.5} height={4.5} />
      <input type="color" aria-label={label} value={colorHex(ribbon.format[type])}
        className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
        onInput={(event) => ribbon.setValue(type, event.currentTarget.value)}
        onChange={(event) => ribbon.setValue(type, event.target.value)} />
    </span>
  </div>;
}
