import { STEEL_CATALOG, calculateMeasurement, calculateStirrupCount, roundVba, type CalculationGroup, type MeasurementLine, type SteelLine } from "../../store/useMetradoStore";

export const formatQuantity = (value: number) => new Intl.NumberFormat("es-PE", { maximumFractionDigits: 2, minimumFractionDigits: 2 }).format(value);
function positive(values: number[], label: string) {
  if (values.some((value) => !Number.isFinite(value) || value <= 0)) throw new Error(label + ": usa valores mayores que cero.");
}
const group = (description: string, unit: string, measurements: CalculationGroup["measurements"] = [], steelLines: CalculationGroup["steelLines"] = []): CalculationGroup => ({ description, unit, measurements, steelLines });
export const measurement = (description: string, kind: MeasurementLine["kind"], quantity: number, length: number, width = 1, height = 1): Omit<MeasurementLine, "id"> => ({
  description, unit: kind === "volume" ? "m3" : kind === "area" ? "m2" : kind === "length" ? "m" : kind === "weight" ? "kg" : "und",
  kind, similarElements: quantity, length, width, height, repetitions: 1, sign: 1,
});
export interface SteelInput { description: string; bar: number; elements: number; quantity: number; length: number; hookStart: number; hookEnd: number; splice: number; }
export function calculateSteel(input: SteelInput): Omit<SteelLine, "id"> {
  positive([input.elements, input.quantity, input.length], "Acero");
  if ([input.hookStart, input.hookEnd, input.splice].some((value) => !Number.isFinite(value) || value < 0) || input.splice >= 9) throw new Error("Ganchos no negativos y empalme menor que 9 m.");
  const catalog = STEEL_CATALOG[input.bar];
  if (!catalog) throw new Error("Selecciona un diámetro.");
  const developed = input.length + input.hookStart + input.hookEnd;
  const splices = developed <= 9 ? 0 : Math.floor((developed - 9) / (9 - input.splice)) + 1;
  return { description: input.description, bar: catalog.bar, diameterMm: catalog.diameterMm, kgPerMeter: catalog.kgPerMeter, similarElements: input.elements, quantity: input.quantity, length: input.length, hookStart: input.hookStart, hookEnd: input.hookEnd, spliceLength: input.splice, splices, weightKg: roundVba((developed + splices * input.splice) * input.elements * input.quantity * catalog.kgPerMeter, 2) };
}
export interface SlabInput {
  description: string; quantity: number; length: number; width: number; height: number; cover: number;
  twoLayers: boolean; vertical: boolean; concrete: boolean; base: boolean; perimeter: boolean; steel: boolean;
  layers: Array<{ sx: number; sy: number; dx: number; dy: number }>;
}
export function calculateSlab(input: SlabInput): CalculationGroup[] {
  positive([input.quantity, input.length, input.width, input.height], "Geometría de losa");
  if (!Number.isFinite(input.cover) || input.cover < 0 || 2 * input.cover >= Math.min(input.length, input.width)) throw new Error("El recubrimiento debe ser menor que la mitad de las dimensiones.");
  const result: CalculationGroup[] = [], title = input.description.toUpperCase(), q = input.quantity;
  if (input.concrete) result.push(group("CONCRETO EN " + title, "m3", [measurement(input.description, "volume", q, input.length, input.width, input.height)]));
  if (input.base) result.push(group("ENCOFRADO DE BASE EN " + title, "m2", [measurement(input.description, "area", q, input.length, input.vertical ? input.height : input.width)]));
  if (input.perimeter) result.push(group("ENCOFRADO DE PERÍMETRO EN " + title, "m2", [measurement(input.description, "area", q, input.vertical ? 2 * input.length * input.width : 2 * (input.length + input.width), input.vertical ? 1 : input.height)]));
  if (input.steel) {
    const lines: Omit<SteelLine, "id">[] = [];
    input.layers.slice(0, input.twoLayers ? 2 : 1).forEach((layer, index) => {
      positive([layer.sx, layer.sy], "Espaciamientos");
      const prefix = input.twoLayers ? (index ? "Superior · " : "Inferior · ") : "";
      // Q7 associates the row labelled Sx/Øx with bars running in Y (Maciso.Actualizar).
      for (const direction of [
        { label: "X", length: input.width - 2 * input.cover, count: roundVba((input.length - 2 * input.cover) / layer.sy) + 1, bar: layer.dy },
        { label: "Y", length: input.length - 2 * input.cover, count: roundVba((input.width - 2 * input.cover) / layer.sx) + 1, bar: layer.dx },
      ]) {
        const line = calculateSteel({ description: prefix + "Acero " + direction.label, bar: direction.bar, elements: 1, quantity: direction.count, length: direction.length, hookStart: 0, hookEnd: 0, splice: STEEL_CATALOG[direction.bar].spliceLength });
        // The original rounds the weight of one element before multiplying its repetitions.
        line.similarElements = q;
        line.weightKg *= q;
        lines.push(line);
      }
    });
    result.push(group("ACERO EN " + title, "kg", [], lines));
  }
  if (!result.length) throw new Error("Selecciona al menos un trabajo de metrado.");
  return result;
}
export interface ColumnInput {
  description: string; quantity: number; cover: number; nodeSpacing: number;
  floors: Array<{ name: string; height: number; beam: number; width: number; thickness: number; includeBeam: boolean }>;
  exterior: number; exteriorBar: number; interior: number; interiorBar: number;
  tieBar: number; ties: number; crossX: number; crossY: number; crossXBar?: number; crossYBar?: number;
  zones: Array<{ maxBars: number; spacing: number }>;
  concrete: boolean; formwork: boolean; steel: boolean;
}
export function calculateColumn(input: ColumnInput): CalculationGroup[] {
  positive([input.quantity], "Cantidad de columnas");
  if (!input.floors.length) throw new Error("Agrega al menos un piso.");
  const concrete: Omit<MeasurementLine, "id">[] = [], formwork: Omit<MeasurementLine, "id">[] = [], bars: Omit<SteelLine, "id">[] = [];
  let longitudinalLength = -2 * input.cover;
  for (const floor of input.floors) {
    positive([floor.height, floor.width, floor.thickness], "Dimensiones del piso");
    if (!Number.isFinite(floor.beam) || floor.beam < 0 || input.cover < 0 || 2 * input.cover >= Math.min(floor.width, floor.thickness)) throw new Error("Revisa viga y recubrimiento.");
    longitudinalLength += floor.height + floor.beam;
    concrete.push(measurement(input.description + " · " + floor.name, "volume", input.quantity, floor.height + (floor.includeBeam ? floor.beam : 0), floor.width, floor.thickness));
    formwork.push(measurement(input.description + " · " + floor.name, "area", input.quantity, floor.height, 2 * (floor.width + floor.thickness)));
    if (input.steel) {
      const count = calculateStirrupCount({ length: floor.height, symmetric: true, zones: input.zones }).count;
      positive([input.nodeSpacing], "Espaciamiento de nudo");
      const nodeCount = Math.floor(floor.beam / input.nodeSpacing);
      // The exported Q7 form uses section B/T directly for ties, with no added hooks.
      const b = floor.width, t = floor.thickness;
      for (const shape of [{ label: "Estribo cerrado", pieces: input.ties, length: 2 * (b + t), bar: input.tieBar }, { label: "Estribo adicional X", pieces: input.crossX, length: b + t, bar: input.crossXBar ?? input.tieBar }, { label: "Estribo adicional Y", pieces: input.crossY, length: b + t, bar: input.crossYBar ?? input.tieBar }]) {
        if (shape.pieces > 0 && count > 0) bars.push(calculateSteel({ description: shape.label + " · " + floor.name, bar: shape.bar, elements: input.quantity, quantity: count * shape.pieces, length: shape.length, hookStart: 0, hookEnd: 0, splice: 0 }));
      }
      if (input.ties > 0 && nodeCount > 0) bars.push(calculateSteel({ description: "Estribo en nudo / cimiento · " + floor.name, bar: input.tieBar, elements: input.quantity, quantity: nodeCount * input.ties, length: 2 * (b + t), hookStart: 0, hookEnd: 0, splice: 0 }));
    }
  }
  if (input.steel) for (const row of [{ count: input.exterior, bar: input.exteriorBar, label: "Exterior" }, { count: input.interior, bar: input.interiorBar, label: "Interior" }]) {
    if (row.count > 0) bars.unshift(calculateSteel({ description: "Acero longitudinal " + row.label, bar: row.bar, elements: input.quantity, quantity: row.count, length: longitudinalLength, hookStart: STEEL_CATALOG[row.bar].hookLength, hookEnd: STEEL_CATALOG[row.bar].hookLength, splice: STEEL_CATALOG[row.bar].spliceLength }));
  }
  const output = [];
  if (input.concrete) output.push(group("CONCRETO EN " + input.description.toUpperCase(), "m3", concrete));
  if (input.formwork) output.push(group("ENCOFRADO EN " + input.description.toUpperCase(), "m2", formwork));
  if (input.steel) output.push(group("ACERO EN " + input.description.toUpperCase(), "kg", [], bars));
  if (!output.length) throw new Error("Selecciona volumen, encofrado o acero.");
  return output;
}
export const WOOD_UNITS: Record<string, number> = { m: 1, cm: 0.01, mm: 0.001, in: 0.0254, ft: 0.3048 };
export function calculateWood(input: { description: string; elements: number; quantity: number; length: number; width: number; thickness: number; lengthUnit: string; widthUnit: string; thicknessUnit: string }): CalculationGroup[] {
  positive([input.elements, input.quantity, input.length, input.width, input.thickness], "Madera");
  const volume = input.length * WOOD_UNITS[input.lengthUnit] * input.width * WOOD_UNITS[input.widthUnit] * input.thickness * WOOD_UNITS[input.thicknessUnit];
  if (!Number.isFinite(volume)) throw new Error("Selecciona las unidades de madera.");
  // 1 pie tablar = 1 ft × 1 ft × 1 in.
  return [group(input.description.toUpperCase(), "p2", [{ ...measurement(input.description, "units", input.elements, 0), unit: "p2", repetitions: input.quantity, manualQuantity: volume / (0.3048 ** 2 * 0.0254) }])];
}
export function groupTotal(group: CalculationGroup) {
  return group.measurements.reduce((sum, line) => sum + calculateMeasurement(line), 0) + group.steelLines.reduce((sum, line) => sum + line.weightKg, 0);
}
