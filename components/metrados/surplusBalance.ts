import { canonicalUnit, type EstimateItem, type MeasurementLine } from '../../store/useMetradoStore';

export function surplusSources(items: EstimateItem[], line: MeasurementLine): EstimateItem[] {
  if (!line.surplus) return [];
  const parents = new Map(items.map(item => [item.id,item.parentId]));
  const isInScope = (item: EstimateItem) => {
    const visited = new Set<string>();
    let parent = item.parentId;
    while (parent && !visited.has(parent)) {
      if (parent === line.surplus!.parentId) return true;
      visited.add(parent); parent = parents.get(parent) ?? null;
    }
    return line.surplus!.parentId === null;
  };
  return items.filter(item => item.kind === 'item' && canonicalUnit(item.unit) === 'm3'
    && (line.surplus!.source === 'excavation' ? /^OE\.2\.1\.2(?:\.|$)/.test(item.norma?.code ?? '') : item.norma?.code === 'OE.2.1.4.1') && isInScope(item));
}

export function addSurplusBalance(item: EstimateItem, replace = false): EstimateItem {
  if (canonicalUnit(item.unit) !== 'm3' || item.kind !== 'item') throw new Error('El balance de excedentes requiere una partida en m³.');
  if (item.measurements.some(line => line.surplus)) return item;
  const lines = (['excavation', 'ownFill'] as const).map((source): MeasurementLine => ({
    id: item.id + ':surplus:' + source,
    description: source === 'excavation' ? 'Volumen de excavaciones' : 'Descuento · Volumen de relleno con material propio',
    surplus: { source, parentId: item.parentId }, unit: 'm3', kind: 'volume', pending: true,
    similarElements: 1, length: 0, width: 0, height: 0, manualQuantity: 0, repetitions: 1, sign: source === 'excavation' ? 1 : -1,
    expressions: { similarElements: '1', length: '', width: '', height: '', manualQuantity: '', repetitions: source === 'excavation' ? '1' : '-1' },
    swelling: { factor: 1.25, basis: 'inSitu', support: 'Factor 1,25 asignado por el usuario para el ejemplo de eliminación de excedentes; ajustar según el material y expediente.' },
  }));
  return { ...item, surplusTemplateVersion: 1, measurements: replace ? lines : [...item.measurements, ...lines] };
}

/** Upgrade only the two untouched empty scaffold rows, never measurements or deleted examples. */
export function withSurplusBalance(items: EstimateItem[]): EstimateItem[] {
  let changed = false;
  const result = items.map(item => {
    if (item.norma?.code !== 'OE.2.1.6' || item.surplusTemplateVersion || item.measurements.length !== 2 || item.steelLines.length) return item;
    const untouched = item.measurements.every(line => line.id.startsWith('detail:' + item.id) && line.pending && /^Retiro de material excedente · sector N-[12]$/.test(line.description)
      && !line.resultRaw && line.quantityOverride === undefined && !line.swelling && !line.columnSection && !line.crossSections
      && !line.length && !line.width && !line.height && line.similarElements === 1 && line.repetitions === 1 && line.sign === 1
      && ['length','width','height','manualQuantity'].every(field => !line.expressions?.[field as 'length' | 'width' | 'height' | 'manualQuantity']?.trim()));
    if (!untouched) return item;
    changed = true; return addSurplusBalance(item, true);
  });
  return changed ? result : items;
}

export function surplusNote(line: MeasurementLine): string {
  return line.surplus ? `Balance de excedentes: ${line.surplus.source === 'excavation' ? 'volumen de excavaciones' : 'relleno con material propio, con signo negativo'}. ${line.surplus.manual ? 'Volumen base manual.' : 'Vinculado a las partidas del mismo grupo de movimiento de tierras.'} Factor: ${line.swelling?.factor ?? 1}. No se resta relleno de préstamo. El balance requiere bases volumétricas compatibles y el factor se aplica una sola vez.` : '';
}
