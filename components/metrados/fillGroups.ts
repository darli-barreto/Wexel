import { canonicalUnit, type EstimateItem, type MeasurementLine } from '../../store/useMetradoStore';
import { normaItemDetailLabel } from './normaCatalog';
import { FILL_DEDUCTIONS, type FillDeductionId } from './fillDeductions';

export type FillGroupType = 'footing' | 'gradeBeam' | 'stripFooting';
const groups: Record<FillGroupType, { title: string; deductions: FillDeductionId[] }> = {
  footing: { title: 'Zapata · código / eje', deductions: ['solado', 'footing', 'column', 'stripFooting'] },
  gradeBeam: { title: 'Viga de cimentación · eje / tramo', deductions: ['gradeBeamEps', 'stripFooting', 'plinth'] },
  stripFooting: { title: 'Cimiento corrido · eje / tramo', deductions: ['stripFooting', 'plinth'] },
};
/** Insert empty work rows, never copy example dimensions or replace an existing measured volume. */
export function insertFillGroup(item: EstimateItem, lineId: string, type: FillGroupType) {
  const index = item.measurements.findIndex(line => line.id === lineId), selected = item.measurements[index];
  if (!selected || item.kind !== 'item' || canonicalUnit(item.unit) !== 'm3' || canonicalUnit(selected.unit) !== 'm3' || selected.presentation) throw new Error('Selecciona un detalle de relleno en m³.');
  const definition = groups[type];
  if (!definition) throw new Error('El grupo de relleno no está disponible.');
  let ordinal = 1;
  while (item.measurements.some(line => line.id.startsWith(`${item.id}:fill:${ordinal}:`))) ordinal++;
  const id = `${item.id}:fill:${ordinal}`;
  const scaffoldId = 'detail:' + item.id;
  const scaffoldOrdinal = selected.id === scaffoldId ? 1 : selected.id.startsWith(scaffoldId + ':') ? Number(selected.id.slice(scaffoldId.length + 1)) : 0;
  const defaultLabel = !selected.description.trim() || scaffoldOrdinal > 0 && selected.description === normaItemDetailLabel(item, scaffoldOrdinal);
  const blank = selected.pending === true && !selected.resultRaw && selected.quantityOverride === undefined && !selected.swelling && !selected.fillGroup && selected.similarElements === 1 && selected.repetitions === 1 && selected.sign === 1
    && defaultLabel && (!selected.expressions?.similarElements || selected.expressions.similarElements === '1') && (!selected.expressions?.repetitions || selected.expressions.repetitions === '1')
    && ['length','width','height','manualQuantity'].every(field => {
      const expression = selected.expressions?.[field as keyof NonNullable<MeasurementLine['expressions']>];
      return (expression === undefined || expression.trim() === '') && !(selected[field as 'length'|'width'|'height'|'manualQuantity'] ?? 0);
    }) && (!selected.crossSections || !selected.crossSections.support.trim() && Object.values(selected.crossSections.expressions).every(raw => raw.trim() === ''))
    && (!selected.columnSection || !selected.columnSection.area && !selected.columnSection.buriedHeight && !selected.columnSection.support?.trim() && !selected.columnSection.areaExpression.trim() && !selected.columnSection.heightExpression.trim());
  const excavationId = blank ? selected.id : id + ':excavation';
  const empty = (lineId: string, description: string, deduction = false): MeasurementLine => ({
    id: lineId, description, unit: item.unit, kind: 'volume', pending: true, similarElements: 1, length: 0, width: 0, height: 0,
    repetitions: 1, sign: deduction ? -1 : 1,
    expressions: { similarElements: '1', repetitions: deduction ? '-1' : '1', length: '', width: '', height: '', manualQuantity: '' },
    fillGroup: { id, type, role: deduction ? 'deduction' : 'excavation' }, ...(deduction ? { quantitySourceId: excavationId } : {}),
  });
  const separator: MeasurementLine = { id: id + ':label', description: definition.title, presentation: 'separator', fillGroup: { id, type, role: 'label' }, unit: '', kind: 'units', pending: true, similarElements: 0, repetitions: 0, sign: 1, length: 0, width: 0, height: 0 };
  const block = [separator, empty(excavationId, 'Excavación'), ...definition.deductions.map((deduction, i) => {
    const entry = FILL_DEDUCTIONS[deduction];
    return { ...empty(id + ':deduction:' + i, 'Descuento · ' + entry.label, true), ...('areaElement' in entry ? { columnSection: { element: entry.areaElement, area: 0, buriedHeight: 0, areaExpression: '', heightExpression: '' } } : {}) };
  })];
  const measurements = [...item.measurements];
  measurements.splice(blank ? index : index + 1, blank ? 1 : 0, ...block);
  return { item: { ...item, measurements }, lineId: excavationId, preservedSelected: !blank };
}
