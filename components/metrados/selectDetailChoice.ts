import { canonicalUnit, type EstimateItem, type MeasurementKind } from '../../store/useMetradoStore';
import type { DetailChoice } from './detailChoices';
import { setCrossSectionMethod, setColumnSection } from './crossSections';
import { insertFillGroup } from './fillGroups';
import { addSurplusBalance } from './surplusBalance';
import { linkSobrecimientoFormwork } from './sobrecimientoFormwork';

/** Move a detail to an independent unit total; never convert geometry into rental quantities. */
export function chooseDetail(items: EstimateItem[], itemId: string, lineId: string, option: DetailChoice, kind: MeasurementKind) {
  const source = items.find(item => item.id === itemId);
  const line = source?.measurements.find(line => line.id === lineId);
  if (!source || !line) throw new Error('El detalle ya no está disponible.');
  if (option.formwork) {
    const changed = linkSobrecimientoFormwork(items, source);
    const linked = changed.measurements.find(detail => detail.formworkSource);
    if (!linked) throw new Error('No se encontraron tramos rectangulares de concreto en el mismo sobrecimiento.');
    return { items: items.map(item => item.id === itemId ? changed : item), itemId, lineId: linked.id };
  }
  if (option.surplusBalance) {
    const changed = addSurplusBalance(source);
    return { items: items.map(item => item.id === itemId ? changed : item), itemId, lineId: changed.measurements.find(l=>l.surplus)!.id, insertedSurplus: true };
  }
  if (option.fillGroup) {
    const group = insertFillGroup(source, line.id, option.fillGroup);
    return { items: items.map(item => item.id === source.id ? group.item : item), itemId, lineId: group.lineId, insertedFillGroup: true, preservedSelected: group.preservedSelected };
  }
  const unit = canonicalUnit(option.unit ?? (line.referenceOnly ? line.unit : source.unit));
  const uniqueLabel = (target: EstimateItem) => {
    const used = new Set(target.measurements.filter(other => other.id !== lineId).map(other => other.description));
    if (!used.has(option.label)) return option.label;
    let n = 2; while (used.has(`${option.label} N-${n}`)) n++;
    return `${option.label} N-${n}`;
  };
  if ((unit === canonicalUnit(source.unit) || line.referenceOnly) && unit === canonicalUnit(line.unit)) return {
    items: items.map(item => item.id === itemId ? { ...item, measurements: item.measurements.map(detail => detail.id === lineId ? { ...(option.columnArea ? setColumnSection(detail, option.sectionElement) : option.crossSectionMethod ? setCrossSectionMethod(detail, option.crossSectionMethod) : detail), ...(option.deduction ? { sign: -1 as const, expressions: { ...detail.expressions, repetitions: String(-Math.abs(detail.repetitions || 1)) } } : {}), description: uniqueLabel(item) } : detail) } : item), itemId, lineId,
  };
  if (!option.unit || !option.separateTitle) throw new Error('El detalle usa una unidad distinta de su partida. Corrige la unidad del detalle antes de elegir un tipo.');
  const origin = source.detailVariant?.sourceItemId ?? source.id;
  let target = items.find(item => item.detailVariant?.sourceItemId === origin && canonicalUnit(item.unit) === unit && item.description === option.separateTitle);
  if (!target) {
    const id = `variant:${origin}:${option.id}:${lineId}`;
    let ordinal = 1;
    const original = items.find(item => item.id === origin) ?? source;
    while (items.some(item => item.code === `${original.code}-A${ordinal}`)) ordinal++;
    target = { id, parentId: original.parentId, kind: 'item', code: `${original.code}-A${ordinal}`, description: option.separateTitle.toUpperCase(), unit,
      order: original.order + ordinal / 1000, measurements: [], steelLines: [], detailTemplateVersion: 2,
      detailVariant: { sourceItemId: origin, choiceId: option.id, originalUnit: original.unit, family: option.id.split(':')[0], reference: original.norma ?? source.detailVariant?.reference },
    };
  }
  const { variantOrigin, ...priorMeasurement } = line;
  const moved = { ...line, description: uniqueLabel(target), unit, kind, pending: true, surplus: undefined, columnSection: undefined, crossSections: undefined, swelling: undefined,
    variantOrigin: variantOrigin ?? { itemId: source.id, index: source.measurements.findIndex(detail => detail.id === lineId), measurement: structuredClone(priorMeasurement) },
    similarElements: 1, repetitions: 1, sign: 1 as const, length: 0, width: 0, height: 0, manualQuantity: 0,
    resultRaw: undefined, quantityOverride: undefined, calculationError: undefined,
    expressions: { similarElements: '1', repetitions: '1', length: '', width: '', height: '', manualQuantity: '' },
  };
  const result = items.map(item => item.id === source.id ? { ...item, measurements: item.measurements.filter(detail => detail.id !== lineId) } : item);
  const existing = result.findIndex(item => item.id === target.id);
  const updated = { ...target, measurements: [...target.measurements, moved] };
  if (existing < 0) result.push(updated); else result[existing] = updated;
  return { items: result, itemId: target.id, lineId };
}

export function restoreDetailVariant(items: EstimateItem[], itemId: string, lineId: string) {
  const variant = items.find(item => item.id === itemId), detail = variant?.measurements.find(line => line.id === lineId);
  const original = detail?.variantOrigin;
  const source = items.find(item => item.id === original?.itemId);
  if (!original || !source) throw new Error('La partida de origen ya no está disponible para restaurar este detalle.');
  if (canonicalUnit(source.unit) !== canonicalUnit(original.measurement.unit)) throw new Error('La unidad de la partida de origen cambió. Revisa esa unidad antes de restaurar el detalle.');
  if (source.measurements.some(line => line.id === original.measurement.id)) throw new Error('El detalle original ya existe en la partida de origen.');
  const restored = [...source.measurements];
  restored.splice(Math.max(0, Math.min(original.index, restored.length)), 0, structuredClone(original.measurement));
  const updated = items.map(item => item.id === itemId ? { ...item, measurements: item.measurements.filter(line => line.id !== lineId) } : item.id === source.id ? { ...item, measurements: restored } : item);
  const remaining = updated.find(item => item.id === itemId)!;
  const removeEmpty = !remaining.measurements.length && !remaining.steelLines.length && !remaining.annotations?.length && !items.some(item => item.parentId === itemId);
  return { items: removeEmpty ? updated.filter(item => item.id !== itemId) : updated, itemId: source.id, lineId: original.measurement.id };
}
