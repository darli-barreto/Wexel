"use client";
import { useMemo, useState } from "react";
import { useMetradoStore } from "../../store/useMetradoStore";
import { Button, Check, Group, Select, Field } from "./FormControls";
import { NORMA_BY_ID, NORMA_ENTRIES, NORMA_SECTIONS, NORMA_SOURCE, reviewNormaItems } from "./normaCatalog";
import { applyNormaTemplate } from "./normaTemplate";
import s from "./Metrados.module.css";

export default function NormaDialogs({ template }: { template: boolean }) {
  const store = useMetradoStore();
  const [scopes, setScopes] = useState<string[]>(NORMA_SECTIONS.filter(s => s.code.startsWith("OE.")).map(s => s.code));
  const [message, setMessage] = useState("");
  const [filter, setFilter] = useState("");
  const [issueFilter, setIssueFilter] = useState("all");
  const [selected, setSelected] = useState(store.selectedItemId ?? "");
  const base = store.demoBackup?.model ?? store;
  const count = NORMA_ENTRIES.filter(e => scopes.includes(e.scope)).length;
  const issues = useMemo(() => reviewNormaItems(store.items), [store.items]);
  const current = store.items.find(i => i.id === selected);
  const entry = current?.norma ? NORMA_BY_ID.get(current.norma.id) : undefined;
  const filtered = issues.filter(i => (issueFilter === "all" || i.kind === issueFilter) && (i.code + " " + i.title + " " + i.message).toLowerCase().includes(filter.toLowerCase()));
  return <>
    <div className={s.body}>
      {template ? <>
        <p>Inicia con las partidas y niveles de la norma. No se cargan dimensiones, cantidades ni resultados del ejemplo.</p>
        {store.demoBackup && <p className={s.help}>Se añadirá la plantilla a tu metrado guardado. Los datos del ejemplo Q7 no se trasladan al proyecto.</p>}
        <Group title="Selecciona las especialidades">
          <div className={s.actions}>
            <Button onClick={() => setScopes(NORMA_SECTIONS.filter(s => s.code.startsWith("OE.")).map(s => s.code))}>Edificación</Button>
            <Button onClick={() => setScopes(NORMA_SECTIONS.filter(s => s.code.startsWith("HU.")).map(s => s.code))}>Habilitaciones urbanas</Button>
            <Button onClick={() => setScopes(NORMA_SECTIONS.map(s => s.code))}>Todas</Button>
            <Button onClick={() => setScopes([])}>Ninguna</Button>
          </div>
          {NORMA_SECTIONS.map(section => <Check key={section.code} label={`${section.code} · ${section.title} (${section.count})`} checked={scopes.includes(section.code)} onChange={checked => setScopes(checked ? [...scopes, section.code] : scopes.filter(code => code !== section.code))} />)}
        </Group>
        <p className={s.result}>{count} títulos y partidas seleccionados. Las partidas ya incorporadas desde este catálogo no se duplican.</p>
        {base.items.length > 0 && <p className={s.help}>Se conservan las {base.items.length} filas de títulos y partidas de tu proyecto y sus datos. Después puedes eliminar las partidas o capítulos que no necesites.</p>}
        <p className={s.help}>Los códigos repetidos del PDF y las unidades alternativas se señalan en «Revisar metrado». HU.1 incorpora el desglose de OE.1 por remisión expresa; esos subcódigos son una adaptación de la aplicación.</p>
      </> : <>
        <Group title="Criterio de medición de la partida">
          <Select label="Partida" value={selected} onChange={setSelected} options={[{value:"",label:"Selecciona una partida"},...store.items.map(i=>({value:i.id,label:i.code+" · "+i.description}))]} />
          {current && <>
            {entry ? <>
              <p className={s.help}>Referencia: {current.norma!.code} · PDF, páginas {[...new Set([...current.norma!.pages, ...entry.bodyPages, ...(entry.measurementPages ?? [])])].sort((a,b)=>a-b).join(", ")} · {NORMA_SOURCE.resolution}</p>
              {entry.ambiguousCode && <p className={s.error}>El documento repite este código para distintos conceptos. Revisa la descripción antes de emitirlo.</p>}
              {entry.inheritedFrom && <p className={s.help}>Desglose de trabajo de la aplicación. Referencia original: {entry.inheritedFrom}. {entry.derivedKind === "own" ? "La fila BASE permite medir el concepto padre sin sumar ni duplicar los conceptos hijos." : "HU.1 remite a OE.1; estos subcódigos no se presentan como códigos impresos en el PDF."}</p>}
              <Select label="Unidad de la partida" value={current.unit} onChange={unit => store.updateItem(current.id,{unit})} options={[{value:"",label:"Por definir"},...[...new Set([...entry.options, ...store.unitCatalog.map(u=>u.code)])].map(value=>({value,label:value+(entry.options.includes(value)?" · prevista en la referencia":"")}))]} />
              <p style={{whiteSpace:"pre-wrap",lineHeight:1.5}}>{entry.measurement || "Consulta el alcance y las remisiones de este apartado; no se asigna un criterio genérico sin sustento."}</p>
              <label className={s.field}>Plano, detalle o especificación de sustento<textarea key={current.id} defaultValue={current.support ?? ""} placeholder="Ej.: plano E-02, detalle C1, ejes A–B, nivel 1" onBlur={event=>{if(event.target.value !== (current.support ?? "")) store.updateItem(current.id,{support:event.target.value});}} /></label>
              {entry.measurementFrom && <p className={s.help}>Criterio compartido con {entry.measurementFrom}.</p>}
              {entry.editorialNote && <p className={s.help}>{entry.editorialNote}</p>}
              <details><summary>Ver transcripción del apartado</summary><p style={{whiteSpace:"pre-wrap"}}>{entry.excerpt || "Ver el apartado padre y la página indicada."}</p></details>
            </> : <p className={s.help}>Esta partida es personalizada. Vincúlala a las especificaciones y planos de tu expediente; no tiene una referencia automática en este catálogo.</p>}
          </>}
        </Group>
        <Group title="Revisión del proyecto">
          <p>{issues.filter(i=>i.kind==="error").length} errores · {issues.filter(i=>i.kind==="pending").length} pendientes · {issues.filter(i=>i.kind==="review").length} observaciones para revisar</p>
          <div className={s.grid2}><Field label="Buscar" value={filter} onChange={setFilter}/><Select label="Mostrar" value={issueFilter} onChange={setIssueFilter} options={[{value:"all",label:"Todo"},{value:"error",label:"Errores"},{value:"pending",label:"Pendientes"},{value:"review",label:"Revisión técnica"}]} /></div>
          <div style={{maxHeight:230,overflowY:"auto"}}>{filtered.slice(0,100).map((issue,index)=><button key={issue.itemId+index} type="button" onClick={()=>{setSelected(issue.itemId);store.selectItem(issue.itemId);}} style={{display:"block",textAlign:"left",width:"100%",padding:"7px 4px",borderBottom:"1px solid #ddd"}}><strong>{issue.code}</strong> · {issue.title}<br/>{issue.message}</button>)}</div>
          {filtered.length>100 && <p className={s.help}>Mostrando 100 de {filtered.length}; filtra por código o descripción.</p>}
          {!issues.length && <p>No se detectaron observaciones automáticas. Revisa los planos, especificaciones, vacíos, encuentros y sustentos antes de emitir el expediente.</p>}
        </Group>
      </>}
      <p className={s.help}>Fuente: documento adjunto de {NORMA_SOURCE.pages} páginas. Esta revisión ayuda a preparar el metrado; no sustituye la revisión técnica de los planos y especificaciones del proyecto.</p>
      {message && <p className={s.error} role="status">{message}</p>}
    </div>
    <div className={s.footer}><Button onClick={()=>store.setDialog(null)}>{template?"Cancelar":"Cerrar"}</Button>{template && <Button primary disabled={!scopes.length} onClick={()=>{try{applyNormaTemplate(scopes);}catch(e){setMessage(e instanceof Error?e.message:"No se pudo crear la plantilla.");}}}>Agregar plantilla sin cantidades</Button>}</div>
  </>;
}
