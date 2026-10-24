import type { DetailChoice } from './detailChoices';

/** Shared definitions for dropdown choices and new fill groups; no example quantities. */
export const FILL_DEDUCTIONS = {
  solado: { label: 'Solado', help: 'Solo el espesor de solado dentro del vacío considerado; no incluirlo otra vez si ya descontaste solado y zapata juntos.' },
  footing: { label: 'Zapata', help: 'Volumen de zapata dentro de la excavación; evita repetir el solado y los encuentros ya descontados.' },
  soladoFooting: { label: 'Solado y zapata', help: 'Úsalos juntos únicamente si las medidas representan su volumen conjunto. Si tienen huellas distintas, usa detalles separados; no sumes también los descuentos individuales.' },
  column: { label: 'Columna o pedestal', help: 'Área real de sección × altura dentro del relleno. Para L o T usa el área del plano sin duplicar encuentros.', areaElement: 'column' },
  stripFooting: { label: 'Cimiento corrido', help: 'Área acumulada en planta × altura dentro del relleno. G: altura (m); H: área de AutoCAD (m²), sin repetir intersecciones. Si el área ya incluye varios cimientos, no multipliques otra vez por su número. Para alturas distintas, separa los detalles.', areaElement: 'stripFooting' },
  stripFootingPrism: { label: 'Cimiento corrido · largo × ancho × alto', help: 'Alternativa para un tramo rectangular conocido. Introduce largo, ancho y altura dentro del relleno. No sumes además el mismo tramo medido por área acumulada.' },
  gradeBeam: { label: 'Viga de cimentación', help: 'VC: volumen de concreto de la viga dentro de la excavación. Úsalo si no utilizas el descuento conjunto de VC y tecnopor.' },
  gradeBeamEps: { label: 'Viga de cimentación y tecnopor', help: 'VC + tecnopor (tecnoport / EPS): volumen conjunto que ocupa el vacío y no se rellena con suelo. Usa largo × ancho × alto si el conjunto tiene esa envolvente sin huecos; si sus formas o medidas difieren, descuéntalos por separado. No sumar también VC y tecnopor individuales.' },
  eps: { label: 'Tecnopor', help: 'Solo el volumen de EPS que permanece dentro de la excavación y excluye suelo de relleno. No incluirlo si ya está en VC y tecnopor; no corresponde a los casetones de una losa.' },
  plinth: { label: 'Sobrecimiento enterrado', help: 'Solo la parte del sobrecimiento dentro del relleno, hasta su nivel final. No descontar la parte sobre ese nivel ni repetir el cimiento corrido.' },
  other: { label: 'Otro elemento ocupado', help: 'Volumen de otro elemento permanente dentro del vacío de relleno, sin repetir descuentos anteriores. Identifica el elemento y sustenta sus medidas.' },
} satisfies Record<string, { label: string; help: string; areaElement?: 'column' | 'stripFooting' }>;

export type FillDeductionId = keyof typeof FILL_DEDUCTIONS;
export function fillDeductionChoices(): DetailChoice[] {
  return Object.entries(FILL_DEDUCTIONS).filter(([id]) => id !== 'column').map(([id, entry]) => ({
    id: 'fill-deduction:' + id, label: 'Descuento · ' + entry.label,
    help: entry.help + ' Establece el signo negativo y conserva las medidas anteriores sin reinterpretarlas.',
    deduction: true,
    ...('areaElement' in entry ? { columnArea: true, sectionElement: entry.areaElement } : { crossSectionMethod: 'geometry' as const }),
  }));
}
