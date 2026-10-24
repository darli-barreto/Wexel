"use client";
import { useState } from 'react';
import { toast } from 'sonner';
import { useMetradoStore, type EstimateItem } from '../../store/useMetradoStore';
import { useWexelStore } from '../../store/useWexelStore';
import { commitEdit } from '../utils/excelEditing';
import { measurementGuidance, setSwelling, swellingNote } from './measurementGuidance';
import { Button, Check, Field, Group, Num, Select } from './FormControls';
import { COLORS } from '../../config/colors';
import s from './Metrados.module.css';
import CrossSectionMethodForm from './CrossSectionMethodForm';
import { supportsCrossSections } from './crossSections';

export default function MeasurementGuideDialog() {
  const store = useMetradoStore(), item = store.items.find(item => item.id === store.targetItemId);
  const excel = useWexelStore.getState(), sheet = excel.sheets.find(sheet => sheet.id === excel.activeSheetId);
  const binding = sheet?.template?.generated[sheet.currentCell];
  const [type, itemId, lineId] = binding ? JSON.parse(binding.key) as string[] : [];
  const [selected, setSelected] = useState(type === 'measurement' && itemId === item?.id ? lineId : '');
  const guidance = item ? measurementGuidance(item) : undefined;
  return <>
    <div className={s.body} style={{ fontFamily: 'Helvetica, Arial, sans-serif' }}>
      {item && guidance ? <>
        <p><strong>{item.code} · {item.description}</strong></p>
        {item.norma && <p className={s.help}>Referencia original: {item.norma.code} · páginas PDF {item.norma.pages.join(', ')}.</p>}
        <Group title="Qué se mide"><p>{guidance.scope}</p>
          {guidance.cleanup && <>
            <p><strong>Limpieza del terreno</strong> es el título que agrupa:</p>
            <ul style={{ paddingLeft: 18, listStyle: 'disc' }}><li>OE.1.1.3.1.1 · Basura y elementos sueltos y livianos: <strong>m³</strong>.</li><li>OE.1.1.3.1.2 · Maleza y arbustos de fácil extracción: <strong>m²</strong>.</li></ul>
            <p className={s.help}>El alcance de la primera incluye el transporte de desperdicios fuera de obra; la segunda incluye la eliminación de la vegetación superficial. Antes de separar limpieza y eliminación, compara las especificaciones y los APU para evitar cobrar dos veces el mismo trabajo. No se puede concluir una duplicidad solo por los nombres.</p>
            <p className={s.help}>«Con maquinaria» describe un método de ejecución; por sí solo no define otro alcance ni justifica un espesor o factor. Si se retira una capa de suelo, precisa si corresponde a movimiento de tierras y sustenta el volumen.</p>
          </>}
        </Group>
        <Group title="Dónde ingresar los valores">
          <p><span style={{ background: COLORS.metrado.input, padding: '2px 6px' }}>Celdas de entrada</span>: valores utilizados por el cálculo. Los resultados se calculan automáticamente.</p>
          <p className={s.help}>m: largo. m²: largo × ancho. m³: largo × ancho × altura o espesor. Elem. simil. multiplica elementos iguales; N.º de veces indica repeticiones o descuentos. Las dimensiones se expresan en metros.</p>
          <p><strong>El esponjamiento se registra aquí, en su campo propio, no en N.º de veces ni en el factor general del resumen.</strong></p>
        </Group>
        <Group title="Esponjamiento y alcance del factor"><p>{guidance.factor}</p><p className={s.help}>1,50 equivale a +50 %, no a 1,50 %. El factor no es universal ni se deduce solo del área del terreno. Un volumen ya medido suelto no debe esponjarse de nuevo.</p></Group>
        {item.kind === 'item' && item.measurements.length > 0 && <>
          <Select label="Detalle para revisar o configurar" value={selected} onChange={setSelected} options={[{ value: '', label: 'Selecciona un detalle' }, ...item.measurements.filter(line => !line.presentation).map(line => ({ value: line.id, label: line.description || 'Detalle sin descripción' }))]} />
          {selected && !item.measurements.find(line => line.id === selected)?.presentation && <>
            {supportsCrossSections(item) && <CrossSectionMethodForm key={'method:' + selected} item={item} lineId={selected} />}
            <FactorForm key={selected} item={item} lineId={selected} />
          </>}
        </>}
        <p className={s.help}>Referencias: Norma Técnica de Metrados, OE.1.1.3.1 (PDF pp. 22–23), OE.2.1.3 (Cortes), OE.2.1.6 (pp. 30–31) y HU.3.4.4.3 (p. 128). Consulta el alcance específico de tu partida y el expediente aprobado.</p>
      </> : <p>Selecciona una partida o detalle en la hoja.</p>}
    </div>
    <div className={s.footer}><Button onClick={() => store.setDialog(null)}>Cerrar</Button></div>
  </>;
}

function FactorForm({ item, lineId }: { item: EstimateItem; lineId: string }) {
  const line = item.measurements.find(line => line.id === lineId)!;
  const [enabled, setEnabled] = useState(Boolean(line.swelling));
  const [factor, setFactor] = useState(line.swelling?.factor ?? 1);
  const [support, setSupport] = useState(line.swelling?.support ?? '');
  const [basis, setBasis] = useState<string>(line.swelling?.basis ?? '');
  const [error, setError] = useState('');
  const allowed = line.kind === 'volume' && !['apu', 'natural', 'compacted'].includes(measurementGuidance(item).policy);
  const save = (clear = false) => {
    try {
      commitEdit();
      const state = useMetradoStore.getState(), current = state.items.find(entry => entry.id === item.id);
      const detail = current?.measurements.find(entry => entry.id === lineId);
      if (!current || !detail) throw new Error('El detalle ya no está disponible.');
      const updated = setSwelling(current, detail, enabled && !clear ? factor : 1, support, basis);
      state.updateMeasurement(current.id, detail.id, { swelling: updated.swelling });
      state.setDialog(null);
      toast.success(updated.swelling ? 'Factor de esponjamiento guardado.' : 'Detalle sin factor adicional.', { description: 'La hoja y el resumen usan el cálculo actualizado.' });
    } catch (error) { setError(error instanceof Error ? error.message : 'Revisa los datos del factor.'); }
  };
  return <Group title="Factor de este detalle">
    {!allowed ? <><p>Este detalle se mide en {line.unit}. {measurementGuidance(item).policy === 'compacted' ? 'Se mide el relleno compactado, sin esponjamiento. El material suelto de suministro se sustenta por separado.' : measurementGuidance(item).policy === 'natural' ? 'El corte se mide en volumen natural, sin esponjamiento.' : measurementGuidance(item).policy === 'apu' ? 'El esponjamiento corresponde al APU; no se multiplica aquí.' : 'El esponjamiento solo se configura sobre un volumen en m³.'}</p>
      {line.swelling && <><p className={s.error}>Este detalle conservaba un factor anterior de {line.swelling.factor}. Revísalo antes de presentar el metrado.</p><Button onClick={() => save(true)}>Quitar factor del detalle</Button></>}
      {error && <p role="alert" className={s.error}>{error}</p>}
    </> : <>
      <Check label="Aplicar factor de esponjamiento al volumen del detalle" checked={enabled} onChange={setEnabled} />
      {enabled && <div className={s.factorInputs}>
        <Select label="Estado del volumen base" value={basis} onChange={setBasis} options={[{ value: '', label: 'Selecciona el estado del volumen' }, { value: 'inSitu', label: 'Antes de esponjar (en banco / in situ)' }, { value: 'loose', label: 'Ya está suelto o ya incluye esponjamiento' }]} />
        <Num label="Factor de esponjamiento (1 = sin incremento)" value={factor} onChange={setFactor} />
        <Field multiline label="Material y sustento del factor (expediente, estudio o medición)" value={support} onChange={setSupport} />
        <p className={s.help}>Volumen final = volumen base × factor. Mantén el número de repeticiones real y revisa que su fórmula o APU no aplique el mismo incremento otra vez.</p>
        {!Number.isInteger(line.repetitions) && <p className={s.error}>N.º de veces contiene un decimal. Verifica que no se haya usado para esponjamiento antes de añadir otro factor.</p>}
      </div>}
      {swellingNote(line) && <p className={s.help}>{swellingNote(line)}</p>}
      {error && <p className={s.error} role="alert">{error}</p>}
      <div className={s.actions}><Button primary onClick={() => save()}>Guardar factor del detalle</Button></div>
    </>}
  </Group>;
}
