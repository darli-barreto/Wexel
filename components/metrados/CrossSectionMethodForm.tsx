"use client";
import { useState } from 'react';
import { toast } from 'sonner';
import { useMetradoStore, type EstimateItem } from '../../store/useMetradoStore';
import { commitEdit } from '../utils/excelEditing';
import { setCrossSectionMethod, setColumnSection } from './crossSections';
import { Button, Field, Group, Select } from './FormControls';
import s from './Metrados.module.css';

export default function CrossSectionMethodForm({ item, lineId }: { item: EstimateItem; lineId: string }) {
  const line = item.measurements.find(line => line.id === lineId)!;
  const [method, setMethod] = useState(line.columnSection ? line.columnSection.element === 'stripFooting' ? 'stripFootingArea' : 'columnArea' : line.crossSections?.method ?? 'geometry');
  const [support, setSupport] = useState(line.columnSection?.support ?? line.crossSections?.support ?? '');
  const [error, setError] = useState('');
  if (line.kind !== 'volume' || line.presentation) return null;
  const save = () => {
    try {
      commitEdit();
      const store = useMetradoStore.getState(), current = store.items.find(entry => entry.id === item.id)?.measurements.find(entry => entry.id === lineId);
      if (!current) throw new Error('El detalle ya no está disponible.');
      const changed = method === 'columnArea' || method === 'stripFootingArea' ? setColumnSection(current, method === 'stripFootingArea' ? 'stripFooting' : 'column') : setCrossSectionMethod(current, method as 'geometry' | 'endAreas' | 'meanArea');
      store.updateMeasurement(item.id, lineId, { columnSection: changed.columnSection ? { ...changed.columnSection, support } : undefined, crossSections: changed.crossSections ? { ...changed.crossSections, support } : undefined, pending: changed.pending });
      store.setDialog(null); toast.success('Método de medición actualizado.', { description: 'Completa los valores indicados en la cabecera del detalle.' });
    } catch (error) { setError(error instanceof Error ? error.message : 'Revisa el método.'); }
  };
  return <Group title="Método de volumen del detalle">
    <Select label="Método de medición" value={method} onChange={setMethod} options={[{ value:'geometry', label:'Prisma: largo × ancho × alto' }, { value:'endAreas', label:'Secciones: promedio de áreas extremas × distancia' }, { value:'meanArea', label:'Secciones: área media conocida × distancia' }, { value:'columnArea', label:'Columna: área de sección × altura enterrada' }, { value:'stripFootingArea', label:'Cimiento corrido: área acumulada × altura' }]} />
    {method === 'columnArea' && <p>G = altura enterrada (m); H = área real de sección (m²). Para L, T o círculo usa el área del plano, no el rectángulo que envuelve la columna. Puedes escribir en H una fórmula que sume partes sin repetir su encuentro. Si la sección cambia con la altura, usa un detalle por tramo.</p>}
    {method === 'stripFootingArea' && <p>G = altura de cimiento dentro del relleno (m); H = área acumulada en planta de los cimientos dentro de la excavación (m²), obtenida en AutoCAD. No dupliques encuentros ni concreto ya descontado. Si el área incluye varios cimientos, no vuelvas a multiplicar por su cantidad; usa 1. Para alturas distintas, registra detalles separados.</p>}
    {method !== 'columnArea' && method !== 'stripFootingArea' && <><p className={s.help}>Por secciones: G = distancia (m); H = área inicial o media (m²); I = área final (m²), si corresponde. El lienzo mostrará estos rótulos sobre el detalle. No se necesita una altura ficticia de 1.</p>
    <p className={s.help}>Al activar secciones, las áreas comienzan vacías. Los anchos y alturas del método geométrico se conservan, pero no se convierten automáticamente en áreas. Se admite un área extrema cero. Divide el terreno en tramos sustentados y no mezcles corte con relleno en una misma área.</p></>}
    <Field label={method === 'stripFootingArea' ? 'Referencia al plano / área de AutoCAD' : method === 'columnArea' ? 'Referencia al plano de sección de columna' : 'Referencia al plano o secciones topográficas'} value={support} onChange={setSupport} />
    {error && <p role="alert" className={s.error}>{error}</p>}
    <div className={s.actions}><Button primary onClick={save}>Aplicar método al detalle</Button></div>
  </Group>;
}
