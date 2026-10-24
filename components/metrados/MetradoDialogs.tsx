"use client";
import { useEffect, useRef, useState } from "react";
import { useMetradoStore, type MeasurementKind, type MetradoHeader } from "@/store/useMetradoStore";
import CalculatorDialog from "./CalculatorDialog";
import NormaDialogs from "./NormaDialogs";
import PortableDrainageDialog from "./PortableDrainageDialog";
import MeasurementGuideDialog from "./MeasurementGuideDialog";

import { Button, Check, Field, Group, Num, Select } from "./FormControls";
import s from "./Metrados.module.css";
import { clearMetradoSheets } from './syncWorkbook';

const titles = { measurementGuide: "Cómo medir esta partida", portableDrainage: "Revisar desagüe provisional", normaTemplate: "Plantilla normativa de metrados", normaReview: "Criterios y revisión del metrado", header: "Diseño de Encabezado", item: "Nueva partida o título", measurement: "Detalle de metrado", steel: "Hoja de Metrado de Acero", stirrup: "Cálculo de cantidad de estribos", slab: "Metrado de Losas Macizas", column: "Metrado de Columnas", wood: "Metrado de Madera", style: "Estilo de Hoja", clear: "Limpiar Hoja", numbering: "Ingrese el primer Ítem", levels: "Extraer Nivel", summary: "Generando Resumen", steelSheet: "Hoja de Acero", units: "Unidades y totales de Metrado" };
export default function MetradoDialogs() {
  const dialog = useMetradoStore((state) => state.dialog);
  const panel = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (!dialog) return;
    const before = document.activeElement;
    panel.current?.querySelector<HTMLElement>("input,select,button")?.focus();
    const escape = (event: KeyboardEvent) => {
      if (event.key === "Escape") useMetradoStore.getState().setDialog(null);
      if (event.key === "Tab") {
        const elements = panel.current?.querySelectorAll<HTMLElement>("button:not(:disabled),input,select,textarea");
        if (!elements?.length) return;
        const first = elements[0], last = elements[elements.length - 1];
        if (event.shiftKey && document.activeElement === first) { event.preventDefault(); last.focus(); }
        if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); first.focus(); }
      }
    };
    document.addEventListener("keydown", escape);
    return () => { document.removeEventListener("keydown", escape); if (before instanceof HTMLElement) before.focus(); };
  }, [dialog]);
  if (!dialog) return null;
  const calculator = ["measurement", "steel", "stirrup", "slab", "column", "wood"].includes(dialog);
  return <div className={s.backdrop}><div ref={panel} className={s.dialog} role="dialog" aria-modal="true" aria-labelledby="metrado-dialog-title" style={!calculator ? { width: "min(660px,96vw)" } : undefined}>
    <div className={s.titlebar}><h2 id="metrado-dialog-title">{titles[dialog]}</h2><button aria-label="Cerrar formulario" onClick={() => useMetradoStore.getState().setDialog(null)}>×</button></div>
    {dialog === "measurementGuide" ? <MeasurementGuideDialog /> : dialog === "portableDrainage" ? <PortableDrainageDialog /> : dialog === "normaTemplate" || dialog === "normaReview" ? <NormaDialogs template={dialog === "normaTemplate"} /> : calculator ? <CalculatorDialog key={dialog} kind={dialog as "measurement" | "steel" | "stirrup" | "slab" | "column" | "wood"} /> : <ManagementForm key={dialog} dialog={dialog} />}
  </div></div>;
}
function ManagementForm({ dialog }: { dialog: keyof typeof titles }) {
  const store = useMetradoStore();
  const [header, setHeader] = useState({ ...store.header });
  const [importFields, setImportFields] = useState(Object.keys(header));
  const [description, setDescriptionValue] = useState("");
  const setDescription = (value: string) => setDescriptionValue(value.toUpperCase());
  const [parent, setParent] = useState(store.selectedItemId && store.items.find((v) => v.id === store.selectedItemId)?.kind === "chapter" ? store.selectedItemId : "");
  const [kind, setKind] = useState("item");
  const [unit, setUnit] = useState("m3");
  const [newUnit, setNewUnit] = useState("");
  const [dimension, setDimension] = useState<MeasurementKind>("units");
  const [first, setFirst] = useState(store.numbering.first);
  const [prefix, setPrefix] = useState(store.numbering.prefix);
  const [suffix, setSuffix] = useState(store.numbering.suffix);
  const [trim, setTrim] = useState(true);
  const [style, setStyle] = useState(store.tableStyle);
  const [frame, setFrame] = useState(store.showFrame);
  const [fill, setFill] = useState(store.showFill);
  const [factor, setFactor] = useState(store.summaryFactor);
  const [useFactor, setUseFactor] = useState(store.summaryFactor !== 1);
  const [clearMetrado, setClearMetrado] = useState(true);
  const [clearSummary, setClearSummary] = useState(true);
  const [steelFormat, setSteelFormat] = useState(true);
  const [steelTotals, setSteelTotals] = useState(true);
  const [message, setMessage] = useState("");
  const [confirmed, setConfirmed] = useState(false);
  const [importing, setImporting] = useState(false);
  const labels: Record<keyof MetradoHeader, string> = { title: "Título", project: "Proyecto", owner: "Propietario", date: "Fecha", specialty: "Especialidad", module: "Módulo", preparedBy: "Hecho por", reviewedBy: "Revisado por" };
  const close = () => store.setDialog(null);
  const download = (value: unknown, filename: string) => { const url = URL.createObjectURL(new Blob([JSON.stringify(value, null, 2)], { type: "application/json" })); const a = document.createElement("a"); a.href = url; a.download = filename; a.click(); URL.revokeObjectURL(url); };
  const submit = () => {
    if (dialog === "header") store.updateHeader(header);
    if (dialog === "item") {
      if (!description.trim()) return setMessage("Ingresa la descripción del título o partida.");
      const id = store.addItem(kind as "chapter" | "item", parent || null, description);
      store.updateItem(id, { unit: kind === "chapter" ? "" : unit }); store.selectItem(id);
    }
    if (dialog === "numbering") {
      if (!Number.isInteger(first) || first < 0) return setMessage("El primer segmento debe ser un entero no negativo.");
      store.renumberItems(first, prefix, suffix);
    }
    if (dialog === "levels") {
      if (store.items.some(item => item.norma)) return setMessage("La plantilla normativa ya tiene sus niveles y relaciones. Se conservan incluso cuando el documento repite un código.");
      const clean = (code: string) => {
        let value = code.trim();
        if (prefix && value.startsWith(prefix)) value = value.slice(prefix.length);
        if (suffix && value.endsWith(suffix)) value = value.slice(0, -suffix.length);
        return value;
      };
      const entries = store.items.map((item) => ({ ...item, code: clean(item.code) }));
      if (entries.some((item) => !/^\d+(?:\.\d+){0,6}$/.test(item.code)) || new Set(entries.map((item) => item.code)).size !== entries.length) return setMessage("Revisa los códigos: deben ser únicos y tener de 1 a 7 segmentos numéricos.");
      const items = store.items.map((item, index) => {
        const code = entries[index].code, parentCode = code.includes(".") ? code.slice(0, code.lastIndexOf(".")) : "";
        const parentEntry = entries.find((entry) => entry.code === parentCode);
        if (parentCode && !parentEntry) throw new Error("Falta el nivel padre " + parentCode);
        return { ...item, parentId: parentEntry?.id ?? null, description: trim ? item.description.trimStart() : item.description, kind: entries.some((entry) => entry.code.startsWith(code + ".")) ? "chapter" as const : "item" as const };
      });
      useMetradoStore.setState({ items, collapsedItemIds: [] });
    }
    if (dialog === "summary") {
      if (useFactor && (!Number.isFinite(factor) || factor <= 0)) return setMessage("El factor debe ser mayor que cero.");
      useMetradoStore.setState({ summaryFactor: useFactor ? factor : 1, summaryVisible: true, view: "resumen" });
    }
    if (dialog === "style") useMetradoStore.setState({ tableStyle: style, showFrame: frame, showFill: fill });
    if (dialog === "steelSheet") useMetradoStore.setState({ view: "acero", ...(steelFormat ? { showFill: fill } : {}), showFrame: frame, showSteelTotals: steelTotals });
    if (dialog === "units") {
      const target = store.items.find((item) => item.id === store.selectedItemId);
      if (!target) return setMessage("Selecciona una partida en la hoja.");
      const catalog = store.unitCatalog.find((entry) => entry.code === unit);
      if (!catalog) return setMessage("Selecciona una unidad del catálogo.");
      store.updateItem(target.id, { unit });
      for (const line of target.measurements) store.updateMeasurement(target.id, line.id, { unit, kind: catalog.kind });
    }
    if (dialog === "clear") {
      if (!clearMetrado && !clearSummary) return setMessage("Selecciona al menos una hoja.");
      if (!confirmed) { setConfirmed(true); return; }
      clearMetradoSheets(clearMetrado, clearSummary);
    }
    close();
  };
  return <>
    <div className={s.body}>
      {dialog === "header" && <><Group title="Ingrese datos del encabezado"><div className={s.side}>{(Object.keys(labels) as Array<keyof MetradoHeader>).map((key) => <Field key={key} label={labels[key]} value={header[key]} onChange={(v) => setHeader({ ...header, [key]: v })} />)}</div><div className={s.actions}><Button onClick={() => setHeader({ ...header, date: new Date().toLocaleDateString("es-PE") })}>Fecha hoy</Button><Button onClick={() => setHeader(Object.fromEntries(Object.keys(header).map((key) => [key, ""])) as unknown as MetradoHeader)}>Limpiar</Button><Button onClick={() => download({ header }, "encabezado-metrado.json")}>Exportar</Button><Button onClick={() => setImporting(!importing)}>Importar</Button></div></Group>{importing && <Group title="Qué desea importar">{(Object.keys(labels) as Array<keyof MetradoHeader>).map((key) => <Check key={key} label={labels[key]} checked={importFields.includes(key)} onChange={(checked) => setImportFields(checked ? [...importFields, key] : importFields.filter((v) => v !== key))} />)}<div className={s.actions}><Button onClick={() => setImportFields(Object.keys(header))}>Seleccionar todo</Button><Button onClick={() => setImportFields([])}>Deseleccionar todo</Button><label className={s.field}>Archivo de encabezado<input type="file" accept=".json,.txt" onChange={async (e) => { const file = e.target.files?.[0]; if (!file) return; try { const text = await file.text(); let data: Partial<MetradoHeader>; try { const json = JSON.parse(text); data = json.header ?? json; } catch { data = Object.fromEntries(Object.keys(header).map((key, i) => [key, text.split(/\r?\n/)[i] ?? ""])); } setHeader({ ...header, ...Object.fromEntries(importFields.filter((key) => typeof data[key as keyof MetradoHeader] === "string").map((key) => [key, data[key as keyof MetradoHeader]])) }); setMessage("Encabezado importado. Revisa los campos y acepta para guardar."); } catch { setMessage("No se pudo importar el encabezado."); } e.target.value = ""; }} /></label></div></Group>}</>}
      {dialog === "item" && <Group title="Datos de título o partida"><div className={s.side}><Select label="Tipo" value={kind} onChange={setKind} options={[{ value: "chapter", label: "Título / capítulo" }, { value: "item", label: "Partida de metrado" }]} /><Select label="Dentro del capítulo" value={parent} onChange={setParent} options={[{ value: "", label: "Nivel principal" }, ...store.items.filter((item) => item.kind === "chapter").map((item) => ({ value: item.id, label: item.code + " " + item.description }))]} /><Field label="Descripción" value={description} onChange={setDescription} />{kind === "item" && <Select label="Unidad" value={unit} onChange={setUnit} options={store.unitCatalog.map((v) => ({ value: v.code, label: v.code }))} />}</div></Group>}
      {dialog === "numbering" && <Group title="Datos del primer ítem"><Num label="Primer segmento" value={first} onChange={setFirst} /><div className={s.grid2}><Field label="Añadir prefijo" value={prefix} onChange={setPrefix} /><Field label="Añadir sufijo" value={suffix} onChange={setSuffix} /></div><p className={s.result}>Muestra: {prefix}{String(first).padStart(2, "0")}.01.01{suffix}</p><p className={s.help}>Actualiza los códigos conservando el árbol de títulos y partidas.</p></Group>}
      {dialog === "levels" && <><Group title="Los ítems poseen"><Field label="Prefijo" value={prefix} onChange={setPrefix} /><Field label="Sufijo" value={suffix} onChange={setSuffix} /></Group><Group title="Del título"><Check label="Eliminar espacios iniciales" checked={trim} onChange={setTrim} /></Group></>}
      {dialog === "summary" && <Group title="Generar resumen"><p className={s.help}>El resumen incluye títulos y partidas, respetando unidades y jerarquía. No suma cantidades de unidades distintas entre capítulos. El factor general afecta al resumen; el esponjamiento se configura por detalle en «Cómo medir esta partida».</p><Check label="Añadir factor" checked={useFactor} onChange={setUseFactor} />{useFactor && <Num label="Factor del resumen" value={factor} onChange={setFactor} />}</Group>}
      {dialog === "style" && <Group title="Seleccione un estilo">{([["color", "Solo títulos · colores de nivel Q7"], ["blue", "Títulos y partidas · azul"], ["monochrome", "Títulos y partidas · sin color"]] as const).map(([value, label]) => <label key={value} className={s.check}><input type="radio" name="metradoStyle" checked={style === value} onChange={() => setStyle(value)} />{label}</label>)}<Check label="Añadir cuadro y demarcar" checked={frame} onChange={setFrame} /><Check label="Quitar fondo" checked={!fill} onChange={(checked) => setFill(!checked)} /></Group>}
      {dialog === "steelSheet" && <Group title="Formato"><Check label="Aplicar formato" checked={steelFormat} onChange={setSteelFormat} /><Check label="Generar cuadro" checked={frame} onChange={setFrame} /><Check label="Generar totales" checked={steelTotals} onChange={setSteelTotals} /><p className={s.help}>Las longitudes por diámetro y los totales se recalculan con los datos de cada partida.</p></Group>}
      {dialog === "units" && <><Group title="Corregir unidad de la partida"><p>{store.items.find((v) => v.id === store.selectedItemId)?.description || "Selecciona una partida en la hoja"}</p><Select label="Unidad nueva" value={unit} onChange={setUnit} options={store.unitCatalog.map((v) => ({ value: v.code, label: v.code }))} /><p className={s.help}>La unidad determina si el detalle calcula longitud, área, volumen, peso o unidades.</p></Group><Group title="Añadir nueva unidad"><div className={s.grid2}><Field label="Unidad nueva (minúsculas)" value={newUnit} onChange={setNewUnit} /><Select label="Tipo de unidad" value={dimension} onChange={(v) => setDimension(v as MeasurementKind)} options={[{ value: "length", label: "Longitud" }, { value: "area", label: "Área" }, { value: "volume", label: "Volumen" }, { value: "weight", label: "Peso" }, { value: "units", label: "Unidades" }]} /></div><Button onClick={() => { const code = newUnit.trim().toLowerCase(); if (!code || store.unitCatalog.some((v) => v.code === code)) return setMessage("Escribe una unidad nueva que no exista."); useMetradoStore.setState({ unitCatalog: [...store.unitCatalog, { code, kind: dimension }] }); setUnit(code); setNewUnit(""); }}>Agregar unidad</Button></Group></>}
      {dialog === "clear" && <Group title="Limpiar"><Check label="Limpiar hoja de Metrados" checked={clearMetrado} onChange={setClearMetrado} /><Check label="Limpiar Resumen" checked={clearSummary} onChange={setClearSummary} />{confirmed && <p className={s.error}>Se borrará el contenido seleccionado. Pulsa “Confirmar limpieza” para continuar. Exporta un respaldo si deseas conservarlo.</p>}</Group>}
      {message && <p className={s.error} role="status">{message}</p>}
    </div>
    <div className={s.footer}><Button onClick={close}>Cancelar</Button><Button primary onClick={() => { try { submit(); } catch (e) { setMessage(e instanceof Error ? e.message : "Revisa los datos."); } }}>{dialog === "clear" && confirmed ? "Confirmar limpieza" : dialog === "units" ? "Corregir unidad" : "Aceptar"}</Button></div>
  </>;
}
