import type { CellData, SheetData } from "../../store/useWexelStore";
import type { MetradoSnapshot } from "../../store/useMetradoStore";
import { COLORS, PALETTE_SIGNATURE } from "../../config/colors";
import { measurementInputFields, swellingNote } from './measurementGuidance';
import { crossSectionNote } from './crossSections';
import { surplusNote } from './surplusBalance';

export type MetradoAppearance = Pick<MetradoSnapshot, "items" | "tableStyle" | "showFill" | "showFrame">;
const INPUT_HINTS: Record<string, string> = { description: 'Descripción editable del detalle.', unit: 'Unidad del detalle; debe ser compatible con la partida.', similarElements: 'Número de elementos iguales.', repetitions: 'Número de repeticiones; usa negativo para un descuento. No es el factor de esponjamiento.', length: 'Largo o longitud en metros.', width: 'Ancho en metros.', height: 'Altura o espesor en metros; debe tener sustento.', manualQuantity: 'Cantidad directa en la unidad de la partida.' };
export const METRADO_FORMAT_VERSION = 16;
/** Format native cells only. Keep all existing Excel interactions and formulas. */
export function formatMetradoSheet(sheet: SheetData, state: MetradoAppearance, force = false): SheetData {
  if (!sheet.template || (!force && sheet.template.formatVersion === METRADO_FORMAT_VERSION && sheet.template.paletteSignature === PALETTE_SIGNATURE)) return sheet;
  const steel = sheet.id.endsWith("acero");
  const cells = { ...sheet.cells }, widths: Record<string, number> = steel ? { A: 32, B: 20, C: 100, D: 340, E: 42, F: 48, G: 54, H: 54, I: 54, J: 48, K: 52, L: 52, M: 52, N: 52, O: 52, P: 52, Q: 52, R: 52, S: 52, T: 52, U: 54, V: 70, W: 74 } : { A: 56, B: 30, C: 110, D: 380, E: 54, F: 70, G: 72, H: 72, I: 72, J: 72, K: 78, L: 78, M: 78, N: 78, O: 64, P: 86 };
  if(steel){widths.F=55;widths.H=64;widths.J=60;}
  const rowHeights = { ...sheet.rowHeights };
  if (sheet.template.formatVersion === 1) {
    const generatedRows = new Set(Object.keys(sheet.template.generated).map((a) => a.match(/\d+$/)?.[0]));
    for (const row of Object.keys(rowHeights)) {
      const r=Number(row), heading=sheet.id.endsWith("metrado")?1:10;
      const oldDefault = r===heading ? 40 : r>heading ? Math.max(26,Math.max(1,Math.ceil((sheet.cells['D'+row]?.rawValue.length??0)/48))*17+10) : undefined;
      const metadataDefaults=[28,42,59,76,93,110];
      if (generatedRows.has(row) && !sheet.manualRowHeights?.includes(row) && (rowHeights[row]===oldDefault || (r<heading && metadataDefaults.includes(rowHeights[row])))) delete rowHeights[row];
    }
  }
  const levels = COLORS.metrado.levels;
  const rowInfo = new Map(Object.entries(sheet.template.rows).map(([id, row]) => [row, JSON.parse(id) as string[]]));
  const headingRow = 1;
  const lastCol = sheet.id.endsWith("resumen") ? "H" : steel ? "W" : "P";
  const lastIndex = lastCol.charCodeAt(0) - 65;
  const generated = { ...sheet.template.generated };
  const lastRow = Math.max(headingRow, ...Object.values(sheet.template.rows), ...Object.keys(cells).map((a) => Number(a.match(/\d+$/)?.[0]) || 0));
  for (let row = headingRow; row <= lastRow; row++) {
    const info = rowInfo.get(row), item = state.items.find((entry) => entry.id === info?.[1]);
    const isHeading = row === headingRow || (steel && row === 2) || info?.[0] === 'sectionHeader';
    const isItem = info?.[0] === "item", chapter = isItem && item?.kind === "chapter";
    const level = item?.norma?.level ?? item?.code.split(".").length ?? 1;
    const color = isItem && state.tableStyle === "color" ? levels[Math.min(levels.length - 1, Math.max(0, level - 1))] : state.tableStyle === "blue" && isItem ? COLORS.metrado.blue : COLORS.excel.text;
    const levelIndex = Math.min(levels.length - 1, Math.max(0, level - 1));
    const backgroundColor = !state.showFill ? COLORS.excel.cell : isHeading ? COLORS.metrado.heading : isItem ? COLORS.metrado.levelBackgrounds[levelIndex] ?? (chapter ? COLORS.metrado.chapter : COLORS.metrado.item) : COLORS.excel.cell;
    const line = info?.[0] === 'measurement' ? item?.measurements.find(line => line.id === info[2]) : undefined;
    const fields = line && line.presentation !== 'separator' ? line.surplus ? ['similarElements', 'repetitions', 'length', 'swellingFactor'] : line.columnSection ? ['similarElements', 'repetitions', 'columnArea', 'buriedHeight'] : line.crossSections ? ['similarElements', 'repetitions', 'length', ...(line.crossSections.method === 'endAreas' ? ['initialArea', 'finalArea'] : ['meanArea'])] : measurementInputFields(line.kind) : [];
    for (let col = 0; col <= lastIndex; col++) {
      const address = String.fromCharCode(65 + col) + row;
      const cell = cells[address] ?? { rawValue: "", displayValue: "", dependencies: [] };
      const binding = sheet.template.generated[address];
      const [bindingKind, , , field] = binding ? JSON.parse(binding.key) as string[] : [];
      const input = !isHeading && !(bindingKind === 'measurement' && field === 'similarElements' && line?.quantitySourceId) && !(line?.surplus && !line.surplus.manual && field === 'length') && (bindingKind === 'measurement' ? fields.includes(field) : bindingKind === 'steel' && ['similarElements', 'length', 'hooks', 'hookStart', 'hookEnd', 'spliceTotal', 'quantity', 'kgPerMeter', 'bar'].includes(field));
      const missingPrismFields = line?.pending && line.kind === 'volume' && !line.surplus && !line.columnSection && !line.crossSections ? ['length', 'width', 'height'].filter(name => line.expressions?.[name as 'length' | 'width' | 'height'] === '').map(name => ({ length: 'largo (G)', width: 'ancho (H)', height: 'altura o espesor (I)' })[name]) : [];
      const sectionHint = line?.formworkSource ? ({ similarElements: 'Cantidad vinculada al concreto; editar aquí desvincula este dato.', length: line.formworkSource.face === 'sides' ? 'Largo del concreto vinculado; editar aquí desvincula este dato.' : 'Ancho del concreto para cada tapa; editar aquí desvincula este dato.', width: 'Altura del concreto vinculada; editar aquí desvincula este dato.', repetitions: line.formworkSource.face === 'sides' ? 'Dos caras × repeticiones del concreto. Editable para ajustar las caras con contacto efectivo.' : 'Tapas por elemento: 0, 1 o 2 según los extremos realmente encofrados. Inicialmente 0.', result: 'Área efectiva de encofrado en m², vinculada al concreto. No se duplica por el desencofrado.' } as Record<string,string>)[field] : line?.quantitySourceId && field === 'similarElements' ? 'Cantidad vinculada a la excavación del grupo. Cámbiala allí; si escribes aquí una cantidad propia, se desvincula este descuento.' : line?.surplus ? ({ length: line.surplus.manual ? 'Volumen base manual en m³; ya no está vinculado a las partidas.' : 'Volumen base en m³ vinculado a las partidas del mismo grupo. No se digita otra vez. Si escribes un valor propio aquí, se desvincula.', swellingFactor: 'Factor de esponjamiento editable; 1,25 corresponde a un incremento del 25 %. Se aplica una sola vez al volumen base.', result: surplusNote(line) } as Record<string,string>)[field] : line?.columnSection ? ({ columnArea: line.columnSection.element === 'stripFooting' ? 'Área acumulada en planta de los cimientos dentro de la excavación, en m² (AutoCAD). Sin superponer encuentros ni repetir concreto ya descontado. Cantidad 1 si el área ya comprende todos los cimientos.' : 'Área real de concreto de la sección, en m². Para L o T, suma partes sin duplicar encuentros; puedes escribir una fórmula.', buriedHeight: 'Solo la altura del concreto dentro del vacío a rellenar, en metros. Para alturas distintas, divide por tramos.', result: crossSectionNote(line) } as Record<string, string>)[field] : line?.crossSections ? ({ initialArea: 'Área de la sección inicial, en m². El cero es válido.', finalArea: 'Área de la sección final, en m². El cero es válido.', meanArea: 'Área media sustentada en las secciones, en m².', length: 'Distancia entre secciones, en metros; debe ser positiva.', result: crossSectionNote(line) } as Record<string, string>)[field] : undefined;
      const hint = bindingKind === 'sectionHeader' ? ({ G: cell.rawValue.startsWith('Vol. base') ? 'Volumen base vinculado a las partidas, en m³.' : cell.rawValue.startsWith('Largo') ? INPUT_HINTS.length : cell.rawValue.startsWith('h ent.') ? 'Altura del concreto dentro del vacío de relleno, en metros.' : 'L: distancia entre secciones, en metros.', H: cell.rawValue === 'Factor' ? 'Factor editable del ejemplo: 1,25; no aplicarlo de nuevo a un volumen ya esponjado.' : cell.rawValue.startsWith('Ancho') ? INPUT_HINTS.width : cell.rawValue.startsWith('A cim.') ? 'Área acumulada de cimientos dentro de la excavación, en m², sin duplicar encuentros.' : cell.rawValue.startsWith('A col.') ? 'Área real de concreto de la sección de columna, en m².' : cell.rawValue.startsWith('Am') ? 'Am: área media de las secciones, en m².' : 'Ai: área de la sección inicial, en m².', I: cell.rawValue.startsWith('Alto') ? INPUT_HINTS.height : 'Af: área de la sección final, en m².' } as Record<string, string>)[field] : field === 'result' && missingPrismFields.length ? 'Pendiente: completa ' + missingPrismFields.join(', ') + '. El volumen requiere largo × ancho × alto; no se asume una altura de 1 m.' : sectionHint ?? (field === 'referenceAreaTotal' || field === 'referenceAreaQuantity' ? 'Área total de intervención de referencia, en m². Suma solo los sectores medidos; no incluye eliminaciones ni genera otra partida cobrable. El factor general del resumen no modifica esta área.' : bindingKind === 'measurement' && line?.referenceOnly && (field === 'description' || field === 'result') ? 'Área de intervención de referencia. Aparece identificada en el resumen sin constituir otra partida cobrable.' : input ? INPUT_HINTS[field] ?? 'Dato de entrada del cálculo.' : bindingKind === 'measurement' && field === 'result' && line ? swellingNote(line) || 'Resultado calculado a partir de las entradas del detalle.' : undefined);
      const numeric = col >= 5 && Boolean(cell.rawValue) && (cell.rawValue.startsWith("=") || Number.isFinite(Number(cell.rawValue)));
      const countColumn = !sheet.id.endsWith("resumen") && (col === 5 || col === 9);
      const format: Partial<CellData> = { input: Boolean(input), hint, align: (col === 2 || col === 3) && !isHeading ? "left" : "center", verticalAlign: "middle", fontFamily: "Helvetica, sans-serif", fontSize: 9, wrapText: info?.[0] === 'sectionHeader' ? false : col === 3 || isHeading, bold: isItem || isHeading, color, backgroundColor: input ? COLORS.metrado.input : backgroundColor, borderStyle: "none", ...(numeric ? { decimals: countColumn ? undefined : 2 } : {}) };
      cells[address] = { ...cell, ...format, ...(line?.fillGroup?.role === 'label' && col === 3 ? { underline: true } : {}), ...(steel&&row===2?{fontSize:8}: {}) };
      if (isItem && !isHeading) {
        if (col === 3) cells[address].indent = 0;
      }
      if (!generated[address]) generated[address] = { key: JSON.stringify(["format", info?.join(":" ) ?? String(row), "", String(col)]), rawValue: "" };
    }
  }
  return { ...sheet, cells, colWidths: { ...widths, ...sheet.colWidths }, rowHeights, template: { ...sheet.template, generated, formatVersion: METRADO_FORMAT_VERSION, paletteSignature: PALETTE_SIGNATURE } };
}
