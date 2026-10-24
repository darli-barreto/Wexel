import { canonicalUnit, type EstimateItem, type MeasurementLine } from '../../store/useMetradoStore';
export const emptyCrossSections = (method: 'endAreas' | 'meanArea' = 'endAreas'): NonNullable<MeasurementLine['crossSections']> => ({ method, initialArea: 0, finalArea: 0, meanArea: 0, expressions: { initialArea: '', finalArea: '', meanArea: '' }, support: '' });

export function isCompactedFill(item: EstimateItem) {
  const code = item.norma?.code ?? item.detailVariant?.reference?.code;
  return ['OE.2.1.4.1', 'OE.2.1.4.2', 'HU.2.1.3'].includes(code ?? '');
}

export function supportsCrossSections(item: EstimateItem) {
  const code = item.norma?.code ?? item.detailVariant?.reference?.code;
  return isCompactedFill(item) || code === 'OE.2.1.3' || /CORTE|RELLENO|TERRAPLEN|EXCAVACI[ÓO]N/i.test(item.description);
}
export function setCrossSectionMethod(line: MeasurementLine, method: 'geometry' | 'endAreas' | 'meanArea'): MeasurementLine {
  if (line.presentation || line.kind !== 'volume' || canonicalUnit(line.unit) !== 'm3') throw new Error('Selecciona un detalle volumétrico en m³.');
  if (line.resultRaw || line.quantityOverride !== undefined) throw new Error('El detalle tiene un resultado manual. Revisa o retira esa fórmula antes de cambiar el método para no sobrescribirla.');
  if (line.swelling) throw new Error('Revisa y retira el factor de esponjamiento antes de configurar secciones. Las áreas deben representar el estado de medición de la partida: natural en cortes y compactado en rellenos.');
  if (method === 'geometry') return { ...line, surplus: undefined, columnSection: undefined, crossSections: undefined, pending: true };
  const previous = line.crossSections;
  return { ...line, surplus: undefined, columnSection: undefined, pending: true, crossSections: {
    method, initialArea: previous?.initialArea ?? 0, finalArea: previous?.finalArea ?? 0, meanArea: previous?.meanArea ?? 0,
    expressions: previous?.expressions ?? { initialArea: '', finalArea: '', meanArea: '' }, support: previous?.support ?? '',
  } };
}
export function setColumnSection(line: MeasurementLine, element: 'column' | 'stripFooting' = 'column'): MeasurementLine {
  if (line.presentation || line.kind !== 'volume' || canonicalUnit(line.unit) !== 'm3') throw new Error('Selecciona un detalle volumétrico en m³.');
  if (line.resultRaw || line.quantityOverride !== undefined) throw new Error('Revisa el resultado manual antes de cambiar a área por altura.');
  if (line.swelling) throw new Error('El volumen ocupado por el concreto no lleva esponjamiento. Revisa y retira ese factor antes de continuar.');
  return { ...line, surplus: undefined, pending: true, columnSection: { ...(line.columnSection ?? { area: 0, buriedHeight: 0, areaExpression: '', heightExpression: '' }), element } };
}
export function crossSectionNote(line: MeasurementLine) {
  if (line.columnSection) return `${line.columnSection.element === 'stripFooting' ? 'Cimiento corrido: área real acumulada en planta (sin superponer encuentros)' : 'Columna o pedestal: área real de sección'}=${line.columnSection.area} m²; ${line.columnSection.element === 'stripFooting' ? 'altura del tramo medido' : 'altura dentro del relleno'}=${line.columnSection.buriedHeight} m; V=A×h. Usar sección constante o dividir por tramos; para descuentos de relleno, considerar solo la parte dentro del vacío.${line.columnSection.areaExpression.startsWith('=') ? ' Cálculo del área: ' + line.columnSection.areaExpression + '.' : ''}${line.columnSection.support ? ' Sustento: ' + line.columnSection.support : ''}`;
  const c = line.crossSections;
  return c ? `${c.method === 'endAreas' ? `Áreas extremas: Ai=${c.initialArea} m²; Af=${c.finalArea} m²; V=(Ai+Af)/2×L` : `Área media: ${c.meanArea} m²; V=Am×L`}. Distancia: ${line.length} m. ${c.support ? 'Sustento: ' + c.support : 'Vincular a las secciones topográficas del proyecto.'}` : '';
}
