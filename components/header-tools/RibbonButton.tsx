"use client";

import type { ButtonHTMLAttributes } from "react";
import { useRibbon, type RibbonAction } from "../utils/useRibbon";

const labels: Record<RibbonAction, string> = {
  bold: "Negrita", italic: "Cursiva", underline: "Subrayado", strike: "Tachado",
  subscript: "Subíndice", superscript: "Superíndice", left: "Alinear a la izquierda",
  center: "Centrar", right: "Alinear a la derecha", justify: "Justificar",
  top: "Alinear arriba", middle: "Alinear al medio", bottom: "Alinear abajo",
  grow: "Aumentar fuente", shrink: "Reducir fuente", clear: "Borrar formato",
  bullets: "Viñetas", numbering: "Numeración", indent: "Aumentar sangría", outdent: "Reducir sangría",
  wrap: "Ajustar texto", currency: "Moneda", percent: "Porcentaje",
  increaseDecimal: "Aumentar decimales", decreaseDecimal: "Reducir decimales",
};
const toggles = new Set<RibbonAction>(["bold", "italic", "underline", "strike", "subscript", "superscript",
  "left", "center", "right", "justify", "top", "middle", "bottom", "bullets", "numbering", "wrap", "currency", "percent"]);

export default function RibbonButton({ action, children, className = "", ...props }:
  ButtonHTMLAttributes<HTMLButtonElement> & { action: RibbonAction }) {
  const ribbon = useRibbon();
  const active = ribbon.isActive(action);
  return <button {...props} type="button" aria-label={labels[action]} title={labels[action]}
    data-ribbon-action={action} aria-pressed={toggles.has(action) ? active : undefined}
    className={`${className} ${active ? "bg-[#d9d9d9] outline outline-1 outline-[#b5b5b5] rounded-sm" : ""}`}
    onMouseDown={(event) => event.preventDefault()}
    onClick={() => ribbon.execute(action)}>{children}</button>;
}
