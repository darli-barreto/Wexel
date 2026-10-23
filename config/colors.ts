/** Shared palette. Change these values to customize the app and worksheets. */
export const COLORS = {
  app: {
    primary: "#7f7f7d",
    secondary: "#444444",
    border: "#d0d0d0",
    ribbon: "#e8e8e8",
    word: "#2b579a",
  },
  excel: {
    grid: "#d6d6d6",
    heading: "#fafafa",
    headingText: "#7f7f7d",
    selection: "#217346",
    range: "#e2f0e8",
    cell: "#ffffff",
    text: "#374151",
  },
  metrado: {
    // TEXTO por nivel: una sola familia de grafitos para documentos técnicos.
    levels: [
      "#18212b", // 1 · Grafito profundo.
      "#202b36", // 2 · Grafito.
      "#293541", // 3 · Pizarra oscura.
      "#303b46", // 4 · Pizarra.
      "#37424d", // 5 · Gris técnico.
      "#3e4852", // 6 · Gris acero.
      "#454e57", // 7 · Gris neutro; también para niveles posteriores.
    ],
    // FONDOS por nivel, del más marcado al blanco. Legibles también en escala de grises.
    levelBackgrounds: ["#dfe3e6", "#e9ecef", "#f0f2f4", "#f5f6f7", "#f8f9fa", "#fbfbfc", "#ffffff"],
    blue: "#29465b", // Texto del estilo alternativo «Azul».
    heading: "#e8e8e8", // FONDO del encabezado.
    chapter: "#dfe3e6", // Fondo de respaldo para capítulos.
    item: "#ffffff", // Fondo de respaldo para partidas.
    demoBackground: "#edf5ef",
    demoText: "#245d3d",
    demoBorder: "#bfd8c9",
    error: "#b42318",
  },
  references: [
    "#2563eb",
    "#db2777",
    "#d97706",
    "#7c3aed",
    "#0891b2",
    "#16a34a",
  ],
} as const;
export const PALETTE_SIGNATURE = JSON.stringify(COLORS);
export const COLOR_VARIABLES = {
  "--wexel-primary": COLORS.app.primary,
  "--wexel-secondary": COLORS.app.secondary,
  "--wexel-border": COLORS.app.border,
  "--wexel-ribbon": COLORS.app.ribbon,
  "--wexel-grid": COLORS.excel.grid,
  "--wexel-selection": COLORS.excel.selection,
  "--wexel-range": COLORS.excel.range,
  "--wexel-word": COLORS.app.word,
};
