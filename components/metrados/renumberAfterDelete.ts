import type { EstimateItem } from '../../store/useMetradoStore';

/** Close numbering gaps only among siblings affected by deletion; normative references stay immutable. */
export function renumberAfterDelete(before: EstimateItem[], after: EstimateItem[], deleted: Set<string>, decoration = { prefix: '', suffix: '' }): EstimateItem[] {
  if (!deleted.size) return after;
  const oldById = new Map(before.map(item => [item.id, item]));
  const byId = new Map(after.map(item => [item.id, item]));
  const clean = (code: string) => {
    if (decoration.prefix && code.startsWith(decoration.prefix)) code = code.slice(decoration.prefix.length);
    if (decoration.suffix && code.endsWith(decoration.suffix)) code = code.slice(0, -decoration.suffix.length);
    return code;
  };
  const wrap = (code: string) => decoration.prefix + code + decoration.suffix;
  const overrides = new Map<string, string>();
  const parents = new Set(before.filter(item => deleted.has(item.id)).map(item => item.parentId));
  for (const parentId of parents) {
    if (parentId && !byId.has(parentId)) continue;
    const groups = new Map<string, Array<{ item: EstimateItem; segment: string }>>();
    for (const item of before.filter(item => item.parentId === parentId).sort((a,b) => a.order - b.order)) {
      // BASE rows and project alternatives such as -A1 do not consume numeric sibling slots.
      const match = clean(item.code).match(/^(.*?)(\d+)$/);
      if (!match || item.detailVariant || /-A\d+$/i.test(clean(item.code))) continue;
      const parent = parentId ? oldById.get(parentId) : undefined;
      if (parent && match[1] !== clean(parent.code) + '.') continue;
      if (!parent && match[1] && !/^[A-Z]+\.$/.test(match[1])) continue;
      const group = groups.get(match[1]) ?? [];
      group.push({ item, segment: match[2] }); groups.set(match[1], group);
    }
    for (const [base, siblings] of groups) {
      if (!siblings.some(({ item }) => deleted.has(item.id))) continue;
      let next = Number(siblings[0].segment);
      for (const { item, segment } of siblings) if (byId.has(item.id)) overrides.set(item.id, base + String(next++).padStart(segment.length, '0'));
    }
  }
  const codes = new Map<string, string>(), visiting = new Set<string>();
  const resolve = (item: EstimateItem): string => {
    if (codes.has(item.id)) return codes.get(item.id)!;
    if (visiting.has(item.id)) return clean(item.code);
    visiting.add(item.id);
    let code = overrides.get(item.id) ?? clean(item.code);
    const parent = item.parentId ? byId.get(item.parentId) : undefined;
    const oldParent = parent ? oldById.get(parent.id) : undefined;
    if (parent && oldParent) {
      const oldBase = clean(oldParent.code), newBase = resolve(parent);
      if (code.startsWith(oldBase + '.')) code = newBase + code.slice(oldBase.length);
    }
    const origin = item.detailVariant ? byId.get(item.detailVariant.sourceItemId) : undefined;
    const oldOrigin = origin ? oldById.get(origin.id) : undefined;
    if (origin && oldOrigin && code.startsWith(clean(oldOrigin.code) + '-A')) code = resolve(origin) + code.slice(clean(oldOrigin.code).length);
    codes.set(item.id, code); visiting.delete(item.id); return code;
  };
  return after.map(item => {
    const original = clean(item.code), updated = resolve(item);
    return original === updated ? item : { ...item, code: wrap(updated) };
  });
}
