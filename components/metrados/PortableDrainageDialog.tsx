"use client";

import { useState } from 'react';
import { useMetradoStore } from '../../store/useMetradoStore';
import { Button } from './FormControls';
import { relatedProvisionalDrainage, drainageHasEnteredData } from './provisionalServices';
import { prepareMetradoItemDeletion } from './syncWorkbook';
import { useDeleteMetradoRows } from './useDeleteMetradoRows';
import s from './Metrados.module.css';

export default function PortableDrainageDialog() {
  const store = useMetradoStore();
  const drainage = relatedProvisionalDrainage(store.items, store.targetItemId ?? '');
  const [error, setError] = useState('');
  const { removeRows, deleting } = useDeleteMetradoRows();
  const keep = () => {
    if (drainage) useMetradoStore.setState(state => ({ items: state.items.map(item => item.id === drainage.id ? { ...item, provisionalDrainageDecision: 'keep' as const } : item) }));
    store.setDialog(null);
  };
  const remove = () => {
    try {
      const current = useMetradoStore.getState(), candidate = relatedProvisionalDrainage(current.items, current.targetItemId ?? '');
      if (!candidate || candidate.id !== drainage?.id) throw new Error('La partida cambió. Revisa el metrado antes de continuar.');
      prepareMetradoItemDeletion(candidate.id);
      store.setDialog(null);
      removeRows();
    } catch (error) { setError(error instanceof Error ? error.message : 'No se pudo quitar la partida.'); }
  };
  return <>
    <div className={s.body} style={{ fontFamily: 'Helvetica, Arial, sans-serif' }}>
      <p>Has elegido un baño portátil.</p>
      <p><strong>¿El proveedor gestiona los residuos y no necesitas desagüe provisional para otros ambientes?</strong></p>
      <p className={s.help}>Si el contrato incluye el retiro y disposición de residuos, y no usarás desagüe para duchas, lavaderos u otros servicios, puedes quitar esta partida:</p>
      {drainage ? <>
        <p className={s.result}>{drainage.code} · {drainage.description} · {drainage.unit}</p>
        {drainageHasEnteredData(drainage) && <p className={s.error}>Esta partida ya contiene medidas, cantidades o un sustento. También se eliminarán si confirmas.</p>}
        <p className={s.help}>Se quitarán la partida y sus detalles. Se actualizarán la numeración, los totales y el resumen.</p>
      </> : <p>La partida de desagüe provisional ya no está pendiente de revisión.</p>}
      {error && <p className={s.error} role="alert">{error}</p>}
    </div>
    <div className={s.footer} style={{ fontFamily: 'Helvetica, Arial, sans-serif' }}>
      <Button onClick={keep}>Mantenerla</Button>
      <Button primary disabled={!drainage || deleting} onClick={remove}>Quitar desagüe provisional</Button>
    </div>
  </>;
}
