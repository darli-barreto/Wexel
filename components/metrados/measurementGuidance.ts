import type { EstimateItem, MeasurementLine } from '../../store/useMetradoStore';
import { isCompactedFill } from './crossSections';

export function measurementInputFields(kind: MeasurementLine['kind']): string[] {
  return ['similarElements', 'repetitions', ...(kind === 'units' || kind === 'weight' ? ['manualQuantity'] : kind === 'length' ? ['length'] : kind === 'area' ? ['length', 'width'] : ['length', 'width', 'height'])];
}

export function measurementGuidance(item: EstimateItem) {
  const code = item.norma?.code ?? item.detailVariant?.reference?.code ?? '';
  const title = item.description.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toUpperCase();
  const cleanup = code.startsWith('OE.1.1.3.1') || /LIMPIEZA.*TERRENO|ELIMINACION.*BASURA/.test(title);
  const apu = ['HU.3.4.4.2', 'HU.3.4.4.3'].includes(code);
  const normativeVolume = ['OE.2.1.6', 'HU.2.1.4', 'OE.1.1.6.1'].includes(code);
  const policy = isCompactedFill(item) ? 'compacted' : code === 'OE.2.1.3' ? 'natural' : apu ? 'apu' : normativeVolume ? 'metrado' : 'project';
  return { code, cleanup, policy,
    scope: item.cleanupAreaTemplateVersion
      ? 'Las áreas de intervención bajo este título son referencias geométricas en m². La columna Total suma únicamente esos sectores medidos: registra sectores sin superposición para no duplicar superficies. Se muestran antes de las eliminaciones y aparecen en el resumen identificadas como referencia, sin generar otra partida cobrable ni aplicarles el factor general. La maleza se mide por su superficie y la basura por su volumen en sus respectivas partidas.'
      : item.kind === 'chapter'
      ? 'Este título agrupa partidas. No tiene una cantidad propia: los datos se ingresan en los detalles de sus partidas medibles.'
      : code === 'OE.1.1.9.1'
        ? 'El trazo preliminar se mide en m² de terreno ocupado por el trazo de los elementos de la primera planta. Puedes identificar sectores, zapatas, vigas de cimentación y cimientos corridos en los detalles, pero sus huellas no equivalen necesariamente al área total de trazo. Delimita el área según planos y especificaciones, evita duplicar encuentros y no sumes el área general junto con el desglose de esa misma superficie.'
        : code === 'OE.2.1.3'
          ? 'El corte se mide en volumen natural en m³, sin esponjamiento. Por secciones: V=(Ai+Af)/2×L, con Ai y Af en m² y distancia L en metros. Si ya conoces el área media sustentada, V=Am×L. No confundas área de sección con ancho: un prisma usa largo×ancho×alto, que es otro método geométrico.'
          : policy === 'compacted'
            ? 'Se mide el volumen de relleno compactado. Para rellenos masivos o terraplenes usa V=(Ai+Af)/2×L, con áreas de relleno en m² y distancia en m; también puedes registrar el área media sustentada. En zanjas y cimentaciones mide el vacío geométrico neto: si partes del volumen excavado, descuenta concreto, tuberías y estructuras ocupantes. No repitas descuentos si las dimensiones o secciones ya son netas. No multipliques por el número de capas si la altura ya comprende todo el relleno.'
            : `Esta partida se cuantifica en ${item.unit || 'la unidad que debes definir'}. El total suma sus detalles compatibles; no se suman m² con m³.`,
    factor: policy === 'compacted'
      ? 'El metrado es el volumen compactado, sin factor de esponjamiento. La cantidad de material suelto de suministro, sus pérdidas o conversiones deben sustentarse por separado en el APU o en la partida de suministro correspondiente.'
      : policy === 'natural'
      ? 'En cortes se mide el volumen natural, sin esponjamiento. No apliques aquí un factor de material suelto; revisa por separado el criterio de eliminación o transporte.'
      : apu
      ? 'En este apartado el esponjamiento se considera en el análisis de costos (APU), no multiplicando el metrado de la hoja.'
      : normativeVolume
        ? 'Este apartado contempla esponjamiento en el volumen de eliminación. Sustenta el factor y verifica que el volumen base no lo incluya ya.'
        : 'No se asigna un esponjamiento genérico. Solo aplica una corrección de volumen si el expediente define su procedencia, material y sustento; si el volumen ya está suelto, no vuelvas a multiplicarlo.',
  };
}

export function appliedSwelling(line: Pick<MeasurementLine, 'kind' | 'swelling'>): number {
  return line.kind === 'volume' ? line.swelling?.factor ?? 1 : 1;
}

export function setSwelling(item: EstimateItem, line: MeasurementLine, factor: number, support: string, basis: string): MeasurementLine {
  if (factor === 1) return { ...line, swelling: undefined };
  if (line.columnSection || line.kind !== 'volume' || !['m3', 'm³'].includes(line.unit.trim().toLowerCase()) || ['apu','natural','compacted'].includes(measurementGuidance(item).policy)) throw new Error('Esta partida no admite aplicar esponjamiento al metrado de este detalle.');
  if (!Number.isFinite(factor) || factor < 1) throw new Error('Escribe un factor válido, igual o mayor que 1. Ejemplo: 1,50 equivale a un incremento del 50 %.');
  if (basis !== 'inSitu') throw new Error('Para aplicar esponjamiento confirma que el volumen base está antes de esponjar. Un volumen ya suelto no debe incrementarse otra vez.');
  if (!support.trim()) throw new Error('Registra el material y la referencia al expediente, estudio o medición que sustenta el factor.');
  if (line.resultRaw || line.quantityOverride !== undefined) throw new Error('Este detalle tiene un resultado manual. Revisa su fórmula antes de aplicar otro factor; podría incluirlo ya.');
  return { ...line, swelling: { factor, support: support.trim(), basis: 'inSitu' } };
}

export function swellingNote(line: MeasurementLine): string {
  return line.swelling && appliedSwelling(line) !== 1 ? `Factor de esponjamiento: ${line.swelling.factor.toLocaleString('es-PE', { maximumFractionDigits: 4 })}. Base antes de esponjar. Sustento: ${line.swelling.support}` : '';
}
