"use client";
import { useEffect, useLayoutEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { useMetradoStore } from '../../store/useMetradoStore';
import { useWexelStore } from '../../store/useWexelStore';
import { useExcelEditingStore } from '../../store/useExcelEditingStore';
import { detailChoices, detailQuantityHint } from './detailChoices';
import { applyDetailChoice, restoreDetailChoice } from './detailChoiceActions';
import s from './DetailPicker.module.css';
import { toast } from 'sonner';

/** Only mounted for the active description cell; the grid has no per-cell catalogue subscriptions. */
export default function DetailPicker({ address }: { address: string }) {
  const visible = useWexelStore(state => state.viewMode !== 'word' && state.activeWorkbookId === 'Metrados');
  const items = useMetradoStore(state => state.items);
  const sheet = useWexelStore.getState().sheets.find(sheet => sheet.id === 'metrados-metrado');
  const binding = sheet?.template?.generated[address];
  const [type, itemId, lineId] = binding ? JSON.parse(binding.key) as string[] : [];
  const item = items.find(item => item.id === itemId);
  const options = item && type === 'measurement' && item.measurements.find(line => line.id === lineId)?.presentation !== 'separator' ? detailChoices(item) : [];
  const [open, setOpen] = useState(false), [filter, setFilter] = useState(''), [message, setMessage] = useState('');
  const [position, setPosition] = useState<{ left: number; top: number; width: number; maxHeight: number } | null>(null);
  const button = useRef<HTMLButtonElement>(null), panel = useRef<HTMLDivElement>(null);
  const listId = `detail-options-${address}`;
  const available = Boolean(visible && item && (type === 'item' || type === 'measurement' && options.length));
  useEffect(() => {
    if (!available) return;
    const clicked = (event: MouseEvent) => {
      if (type !== 'measurement') return;
      const target = event.target as HTMLElement;
      if (target.closest('[data-detail-picker]') || target.closest('[data-cell-address]')?.getAttribute('data-cell-address') !== address || useExcelEditingStore.getState().draft?.caretMode) return;
      const current = useWexelStore.getState().sheets.find(sheet => sheet.id === 'metrados-metrado');
      const first = current?.selectedCell, last = current?.selectionEnd;
      if (first && (!last || (last.row === first.row && last.col === first.col))) setOpen(true);
    };
    const keyboard = (event: KeyboardEvent) => { if (event.altKey && event.key === 'ArrowDown') { event.preventDefault(); event.stopPropagation(); setOpen(true); } };
    document.addEventListener('mouseup', clicked); document.addEventListener('keydown', keyboard, true);
    return () => { document.removeEventListener('mouseup', clicked); document.removeEventListener('keydown', keyboard, true); };
  }, [available, address, type]);
  useLayoutEffect(() => {
    if (!available || !open) return;
    let frame = 0;
    const measure = () => {
      frame = 0;
      const rect = button.current?.closest('td')?.getBoundingClientRect();
      if (!rect) return;
      const width = Math.min(440, window.innerWidth - 16), roomBelow = window.innerHeight - rect.bottom - 12;
      const maxHeight = Math.min(340, Math.max(160, roomBelow >= 220 ? roomBelow : rect.top - 12));
      const next = { left: Math.max(8, Math.min(rect.left, window.innerWidth - width - 8)), top: roomBelow >= 220 ? rect.bottom + 2 : Math.max(8, rect.top - maxHeight - 2), width, maxHeight };
      setPosition(previous => previous && Object.keys(next).every(key => next[key as keyof typeof next] === previous[key as keyof typeof next]) ? previous : next);
    };
    const reposition = (event: Event) => {
      if (event.target instanceof Node && panel.current?.contains(event.target)) return;
      if (!frame) frame = requestAnimationFrame(measure);
    };
    measure(); window.addEventListener('scroll', reposition, true); window.addEventListener('resize', reposition);
    return () => { cancelAnimationFrame(frame); window.removeEventListener('scroll', reposition, true); window.removeEventListener('resize', reposition); };
  }, [available, open, address]);
  useEffect(() => {
    if (!available || !open) return;
    const outside = (event: MouseEvent) => { const target = event.target as Node; if (!panel.current?.contains(target) && !button.current?.contains(target)) setOpen(false); };
    const escape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') { setOpen(false); event.stopPropagation(); }
      else if (event.key.length === 1 && !event.ctrlKey && !event.metaKey && !event.altKey && event.target instanceof HTMLElement && event.target.dataset.excelInput === 'true') setOpen(false);
    };
    document.addEventListener('mousedown', outside); document.addEventListener('keydown', escape, true);
    return () => { document.removeEventListener('mousedown', outside); document.removeEventListener('keydown', escape, true); };
  }, [available, open]);
  if (!available) return null;
  if (type === 'item') return <button type="button" data-detail-picker className={s.trigger} aria-label={`Ver criterio de medición ${address}`} title="Cómo medir esta partida" onClick={event => { event.stopPropagation(); useMetradoStore.getState().setDialog('measurementGuide', itemId); }}>?</button>;
  const query = filter.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase();
  const filtered = options.filter(option => `${option.label} ${option.help}`.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase().includes(query));
  return <>
    <button ref={button} type="button" data-detail-picker aria-label={`Elegir tipo de detalle ${address}`} aria-expanded={open} aria-controls={listId} className={s.trigger} title="Elegir tipo de detalle; también puedes escribir libremente" onClick={event => { event.stopPropagation(); setOpen(value => !value); }}>⌄</button>
    {open && position && createPortal(<div ref={panel} data-detail-picker className={s.panel} style={position} onMouseDown={event => event.stopPropagation()} onDoubleClick={event => event.stopPropagation()} onKeyDown={event => {
      if (!['ArrowDown', 'ArrowUp'].includes(event.key)) return;
      event.preventDefault();
      const buttons = Array.from(panel.current?.querySelectorAll<HTMLButtonElement>('[role="option"]') ?? []);
      const index = buttons.indexOf(document.activeElement as HTMLButtonElement), direction = event.key === 'ArrowDown' ? 1 : -1;
      buttons[(index + direction + buttons.length) % buttons.length]?.focus();
    }}>
      <div className={s.heading}><span>Tipos de detalle</span><button type="button" aria-label="Cerrar opciones de detalle" onClick={() => setOpen(false)}>×</button></div>
      <button type="button" className={s.guide} onClick={() => { setOpen(false); useMetradoStore.getState().setDialog('measurementGuide', itemId); }}>Cómo medir esta partida / factor de esponjamiento</button>
      {item && detailQuantityHint(item) && <p className={s.note}>{detailQuantityHint(item)}</p>}
      <input className={s.search} aria-label="Buscar tipo de detalle" placeholder="Buscar una opción…" value={filter} onChange={event => setFilter(event.target.value)} />
      <div id={listId} role="listbox" aria-label="Opciones de detalle" className={s.options}>
        {filtered.map(option => <button type="button" role="option" aria-selected={item?.measurements.find(line => line.id === lineId)?.description === option.label} key={option.id} onMouseDown={event => event.preventDefault()} onClick={() => {
          try {
            const result = applyDetailChoice(itemId, lineId, option);
            setOpen(false);
            if (result?.insertedFillGroup) toast.success('Grupo de relleno agregado.', { description: 'Completa las medidas y elimina descuentos que no correspondan. La cantidad de elementos se toma de la excavación.' });
            if (result?.insertedSurplus) toast.success('Balance de excedentes agregado.', { description: 'Volúmenes vinculados a excavación y relleno propio. Factor editable 1,25.' });
            if (result?.suggestDrainageReview) useMetradoStore.getState().setDialog('portableDrainage', result.itemId);
          } catch (error) { setMessage(error instanceof Error ? error.message : 'No se pudo elegir el detalle.'); }
        }}><span>{option.label}{option.unit && <small> · {option.unit}</small>}</span><small>{option.help}</small></button>)}
        {!filtered.length && <p className={s.note}>Sin coincidencias. Puedes escribir tu propio detalle en la celda.</p>}
      </div>
      {item?.measurements.find(line => line.id === lineId)?.variantOrigin && <button type="button" className={s.restore} onClick={() => { try { restoreDetailChoice(itemId, lineId); setOpen(false); } catch (error) { setMessage(error instanceof Error ? error.message : 'No se pudo restaurar el detalle.'); } }}>Restaurar detalle previo y sus medidas</button>}
      <div className={s.note}>Sugerencias editables. Las cantidades y especificaciones las define tu proyecto. Una unidad diferente crea una partida independiente y deja su cantidad pendiente.</div>
      {message && <p role="alert" className={s.error}>{message}</p>}
    </div>, document.body)}
  </>;
}
