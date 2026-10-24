import type { EstimateItem } from '../../store/useMetradoStore';

/** Match references and the actual tree, never mutable project codes or similar descriptions. */
export function relatedProvisionalDrainage(items: EstimateItem[], sourceId: string): EstimateItem | undefined {
  const byId = new Map(items.map(item => [item.id, item]));
  const root = (id: string) => {
    let item = byId.get(id);
    const seen = new Set<string>();
    while (item) {
      if (seen.has(item.id)) return undefined;
      if (item.norma?.code === 'OE.1.1' || !item.parentId) return item.id;
      seen.add(item.id); item = byId.get(item.parentId);
    }
    return undefined;
  };
  const scope = root(sourceId);
  if (!scope) return undefined;
  return items.find(item => item.norma?.code === 'OE.1.1.2.2' && item.provisionalDrainageDecision !== 'keep' && root(item.id) === scope);
}

export function drainageHasEnteredData(item: EstimateItem): boolean {
  return Boolean(item.support?.trim() || item.steelLines.length || item.measurements.some(line => !line.pending ||
    line.length || line.width || line.height || line.manualQuantity ||
    ['length', 'width', 'height', 'manualQuantity'].some(key => line.expressions?.[key as keyof NonNullable<typeof line.expressions>]?.trim())));
}
