import type { EstimateItem, MeasurementLine } from '../../store/useMetradoStore';

const codes = new Set(['OE.2.2.6.2', 'OE.2.3.5.2']);
export const isSobrecimientoFormwork = (item: EstimateItem) => codes.has(item.norma?.code ?? '') && ['m2', 'm²'].includes(item.unit);
export function formworkConcrete(items: EstimateItem[], target: EstimateItem) {
  const code = target.norma?.code?.replace(/\.2$/, '.1');
  return items.find(item => item.parentId === target.parentId && item.norma?.code === code && item.kind === 'item' && ['m3', 'm³'].includes(item.unit));
}
const emptyScaffold = (line: MeasurementLine, item: EstimateItem) => line.id.startsWith('detail:' + item.id) && /^Tramo de sobrecimiento SC-[12] · Encofrado y desencofrado$/.test(line.description) && line.pending && !line.presentation && !line.resultRaw && line.quantityOverride === undefined && !line.formworkSource && !line.columnSection && !line.crossSections && !line.swelling && !line.length && !line.width && !line.height && line.similarElements === 1 && line.repetitions === 1 && line.sign === 1 && Object.values(line.expressions ?? {}).every(value => !value?.trim() || value === '1');

/** Only untouched scaffold rows are upgraded automatically; edits and deletions survive reload. */
export function withSobrecimientoFormwork(items: EstimateItem[]): EstimateItem[] {
  let changed = false;
  const result = items.map(item => {
    if (!isSobrecimientoFormwork(item) || item.formworkTemplateVersion || item.measurements.length !== 2 || !item.measurements.every(line => emptyScaffold(line, item))) return item;
    const linked = linkSobrecimientoFormwork(items, item);
    if (linked === item) return item;
    changed = true; return linked;
  });
  return changed ? result : items;
}

export function linkSobrecimientoFormwork(items: EstimateItem[], target: EstimateItem): EstimateItem {
  if (!isSobrecimientoFormwork(target)) return target;
  const source = formworkConcrete(items, target);
  if (!source) return target;
  const measurements = target.measurements.filter(line => !emptyScaffold(line, target));
  for (const [index, detail] of source.measurements.entries()) {
    if (detail.presentation || detail.referenceOnly || detail.kind !== 'volume' || detail.columnSection || detail.crossSections || detail.surplus) continue;
    for (const face of ['sides', 'ends'] as const) {
      if (measurements.some(line => line.formworkSource?.itemId === source.id && line.formworkSource.lineId === detail.id && line.formworkSource.face === face)) continue;
      measurements.push({ id: `${target.id}:formwork:${detail.id}:${face}`, description: `${detail.description.replace(/\s*[·–-]\s*Concreto\s*$/i, '') || `Sobrecimiento SC-${index + 1}`} · ${face === 'sides' ? 'Encofrado de caras laterales' : 'Tapas de extremos (cantidad por elemento)'}`,
        formworkSource: { itemId: source.id, lineId: detail.id, face }, unit: 'm2', kind: 'area', pending: true,
        similarElements: 1, length: 0, width: 0, height: 0, manualQuantity: 0, repetitions: face === 'sides' ? 2 : 0, sign: 1,
        expressions: { length: '', width: '', height: '', manualQuantity: '', repetitions: face === 'ends' ? '0' : '2' },
      });
    }
  }
  return { ...target, formworkTemplateVersion: 1, measurements };
}

export function formworkLinkedFields(line: MeasurementLine, sourceRow?: number): Record<string, string> {
  if (!line.formworkSource) return {};
  const ref = (column: string) => sourceRow ? `${column}${sourceRow}` : '#REF!';
  const fields: Record<string, string> = line.formworkSource.face === 'sides'
    ? { similarElements: '=' + ref('F'), length: '=' + ref('G'), width: '=' + ref('I'), repetitions: '=' + ref('J') + '*2' }
    : { similarElements: '=' + ref('F') + '*' + ref('J'), length: '=' + ref('H'), width: '=' + ref('I') };
  return Object.fromEntries(Object.entries(fields).filter(([field]) => !line.formworkSource!.manualFields?.includes(field)));
}
