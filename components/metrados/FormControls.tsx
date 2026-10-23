"use client";
import { useState, type ReactNode } from "react";
import { STEEL_CATALOG } from "@/store/useMetradoStore";
import s from "./Metrados.module.css";

export function Field({ label, value, onChange, multiline = false }: { label: string; value: string; onChange: (value: string) => void; multiline?: boolean }) {
  return <label className={s.field}><span>{label}</span>{multiline ? <textarea value={value} onChange={(e) => onChange(e.target.value)} /> : <input value={value} onChange={(e) => onChange(e.target.value)} />}</label>;
}
export function Num({ label, value, onChange }: { label: string; value: number; onChange: (value: number) => void }) {
  const [draft, setDraft] = useState<string | null>(null);
  return <label className={s.field}><span>{label}</span><input inputMode="decimal" value={draft ?? String(value)} onFocus={() => setDraft(String(value))} onChange={(e) => {
    const raw = e.target.value; setDraft(raw);
    if (/^[+-]?(?:\d+(?:[.,]\d*)?|[.,]\d+)$/.test(raw.trim())) onChange(Number(raw.replace(",", ".")));
  }} onBlur={() => { if (draft === "") onChange(0); setDraft(null); }} /></label>;
}
export function Select({ label, value, onChange, options }: { label: string; value: string | number; onChange: (value: string) => void; options: Array<{ value: string | number; label: string }> }) {
  return <label className={s.field}><span>{label}</span><select value={value} onChange={(e) => onChange(e.target.value)}>{options.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}</select></label>;
}
export function Bar({ label, value, onChange }: { label: string; value: number; onChange: (value: number) => void }) {
  return <Select label={label} value={value} onChange={(v) => onChange(Number(v))} options={STEEL_CATALOG.map((bar, i) => ({ value: i, label: bar.bar }))} />;
}
export function Check({ label, checked, onChange }: { label: string; checked: boolean; onChange: (value: boolean) => void }) {
  return <label className={s.check}><input type="checkbox" checked={checked} onChange={(e) => onChange(e.target.checked)} />{label}</label>;
}
export function Group({ title, children }: { title: string; children: ReactNode }) { return <fieldset><legend>{title}</legend>{children}</fieldset>; }
export function Button({ children, onClick, primary = false, disabled = false }: { children: ReactNode; onClick: () => void; primary?: boolean; disabled?: boolean }) {
  return <button type="button" className={s.button + (primary ? " " + s.primary : "")} disabled={disabled} onClick={onClick}>{children}</button>;
}
export function Diagram({ kind, label }: { kind: "steel" | "stirrup" | "slab" | "column" | "wood"; label: string }) {
  return <div className={s.diagram}><svg viewBox="0 0 380 225" role="img" aria-label={label}><defs><marker id={"arrow-" + kind} markerWidth="5" markerHeight="5" refX="2.5" refY="2.5" orient="auto-start-reverse"><path d="M0,0 L5,2.5 L0,5" fill="#1756a9" /></marker></defs>
    {kind === "steel" ? <><path d="M30 145 V112 H202 L210 118 H345 V145 M35 148 V124 H180 L188 118 H338 V148" fill="none" stroke="#333" strokeWidth="4" /><path d="M30 90 V50 M345 90 V50 M30 60 H345" stroke="#1756a9" fill="none" /><text x="165" y="48" fill="#c33">Longitud L</text><text x="16" y="175" fill="#c33">GI</text><text x="339" y="175" fill="#c33">GD</text><text x="165" y="151" fill="#c33">Empalme</text><text x="125" y="205" fill="#1756a9">Diámetro · elementos similares</text></> :
    kind === "stirrup" ? <><rect x="30" y="75" width="320" height="70" fill="#fafafa" stroke="#333" />{Array.from({ length: 25 }, (_, i) => <line key={i} x1={40 + i * (i < 8 ? 7 : 12)} x2={40 + i * (i < 8 ? 7 : 12)} y1="80" y2="140" stroke="#555" />)}<path d="M30 55 H350 M30 48 V62 M350 48 V62" stroke="#1756a9" /><text x="144" y="40" fill="#c33">Longitud del elemento</text><text x="70" y="180" fill="#1756a9">Zonas de confinamiento y espaciamiento</text></> :
    kind === "column" ? <><rect x="130" y="25" width="90" height="165" fill="#eee" stroke="#333" /><path d="M140 185 V35 H210 V185 M115 65 H240 M115 75 H240" fill="none" stroke="#444" strokeWidth="3" />{Array.from({ length: 16 }, (_, i) => <line key={i} x1="135" x2="215" y1={40 + i * 9} y2={40 + i * 9} stroke="#888" />)}<path d="M100 25 V190 M90 25 H110 M90 190 H110 M130 210 H220" stroke="#1756a9" /><text x="65" y="110" fill="#1756a9">H</text><text x="245" y="74" fill="#c33">h viga / nudo</text><text x="155" y="222" fill="#1756a9">B × T</text></> :
    <><path d="M65 150 L155 55 L330 85 L240 185 Z M65 150 V173 L240 207 V185 M240 207 L330 107 V85" fill={kind === "wood" ? "#f7e3c5" : "#eee"} stroke="#555" strokeWidth="2" />{Array.from({ length: 8 }, (_, i) => <path key={i} d={kind === "wood" ? "M" + (75 + i * 20) + " " + (146 + i * 4) + " l86 -92" : "M" + (78 + i * 20) + " " + (136 + i * 4) + " l82 -80"} stroke={kind === "wood" ? "#a97744" : "#7992a3"} fill="none" />)}<text x="85" y="195" fill="#1756a9">Ancho A</text><text x="270" y="169" fill="#1756a9">Largo L</text><text x="30" y="170" fill="#c33">{kind === "wood" ? "E" : "h"}</text><text x="145" y="37" fill="#1756a9">{kind === "wood" ? "Cubicación de madera" : "Distribución X / Y"}</text></>}
  </svg></div>;
}
