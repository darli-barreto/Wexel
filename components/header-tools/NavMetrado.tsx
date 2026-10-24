"use client";

import { calculateMeasurement, calculateItemTotal, useMetradoStore } from "@/store/useMetradoStore";
import { addMetradoDetail, addMetradoSeparator } from "@/components/metrados/syncWorkbook";
import { toast } from 'sonner';
import { useDeleteMetradoRows } from '@/components/metrados/useDeleteMetradoRows';
import { useWexelStore } from "@/store/useWexelStore";
import { toggleQuispeExample } from "@/components/metrados/exampleTemplate";
import MetradoIcon, { type MetradoIconName } from "@/components/metrados/MetradoIcon";
import type { ButtonHTMLAttributes, ReactNode } from "react";
import { itemHasQuantity } from "@/components/metrados/normaCatalog";
import { Separator } from "docx";
import SeparatorOne from "../ui/SeparatorOne";
import { useMetradoPreviewStore, openMetradoPreview, closeMetradoPreview } from '@/store/useMetradoPreviewStore';

type MetradoToolProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  icon: MetradoIconName;
  label: string;
  primary?: boolean;
};

function MetradoTool({ icon, label, primary = false, title, className = "", ...props }: MetradoToolProps) {
  return (
    <button
      {...props}
      type="button"
      aria-label={label}
      title={title ? label + ": " + title : label}
      className={
        "group flex shrink-0 items-center justify-center text-[#555] hover:bg-[#d9d9d9] focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-[#217346] " +
        (primary ? "h-14 min-w-[40px] flex-col gap-1 px-1 text-[10px] " : "h-7 w-6 ") + className
      }
    >
      <MetradoIcon name={icon} size={primary ? "large" : "small"} />
      {primary && <span className="whitespace-nowrap">{label}</span>}
    </button>
  );
}

function CompactTools({ label, children }: { label: string; children: ReactNode }) {
  return <div role="group" aria-label={label} className="grid shrink-0 grid-flow-col grid-rows-2 gap-x-1">{children}</div>;
}

function ToolSeparator() {
  return <span aria-hidden="true" className="mx-2 h-10 shrink-0 border-l border-[#c8c8c8]" />;
}

function NavMetrado() {
  const { deleting, removeRows } = useDeleteMetradoRows();
  const preview = useMetradoPreviewStore(state => state.active);
  const setDialog = useMetradoStore((state) => state.setDialog);
  const collapsedItemIds = useMetradoStore((state) => state.collapsedItemIds);
  const toggleAllItems = useMetradoStore((state) => state.toggleAllItems);
  const demoActive = useMetradoStore((state) => Boolean(state.demoBackup));
  const metradoSheet = useWexelStore(state => state.activeSheetId === 'metrados-metrado');

  const openCalculator = (dialog: "slab" | "column" | "wood" | "steel" | "stirrup" | "measurement") => setDialog(dialog, useMetradoStore.getState().selectedItemId);
  const exportCsv = () => {
    const { header, items } = useMetradoStore.getState();
    const quote = (value: string | number) => `"${String(value).replaceAll('"', '""')}"`;
    const rows: Array<Array<string | number>> = [
      [header.title], ["Proyecto", header.project], ["Propietario", header.owner], ["Fecha", header.date], ["Especialidad", header.specialty], ["Módulo", header.module], [],
      ["Nivel", "Ítem", "Descripción", "Und", "Elem. simil.", "Largo / distancia", "Ancho", "Alto", "Nº veces", "Long.", "Área", "Vol.", "Kg.", "Und.", "Total", "Referencia normativa", "Plano / especificación", "Factor de esponjamiento", "Sustento del factor", "Método de volumen", "Área inicial (m²)", "Área final (m²)", "Área media (m²)", "Sustento de secciones", "Área ocupada de concreto (m²)", "Altura enterrada (m)", "Volumen base de excedentes (m³)"],
    ];
    for (const item of items) {
      rows.push([item.norma?.level ?? item.code.split(".").length, item.code, item.description, item.unit, "", "", "", "", "", "", "", "", "", "", item.kind === 'chapter' || item.norma && !itemHasQuantity(item) ? "" : calculateItemTotal(item), item.norma?.code ?? "", item.support ?? "", "", ""]);
      for (const line of item.measurements) {
        if (line.presentation === 'separator') { rows.push(['', '', line.description]); continue; }
        const output = ["", "", line.description, line.unit, line.similarElements, line.kind === "weight" || line.kind === "units" ? "" : line.length, line.kind === "area" || line.kind === "volume" ? line.width : "", line.kind === "volume" ? line.height : "", line.repetitions * line.sign, line.kind === "length" ? calculateMeasurement(line) : "", line.kind === "area" ? calculateMeasurement(line) : "", line.kind === "volume" ? calculateMeasurement(line) : "", line.kind === "weight" ? calculateMeasurement(line) : "", line.kind === "units" ? calculateMeasurement(line) : "", ""];
        rows.push(output);
        output.push(item.norma?.code ?? '', '', line.kind === 'volume' ? line.swelling?.factor ?? '' : '', line.kind === 'volume' ? line.swelling?.support ?? '' : '');
        const column = line.columnSection;
        const section = column ? undefined : line.crossSections;
        if (line.surplus || column) { output[5] = ''; output[6] = ''; output[7] = ''; }
        if (section) { output[6] = ''; output[7] = ''; }
        output.push(line.surplus ? 'surplus-' + line.surplus.source : column ? column.element === 'stripFooting' ? 'stripFootingArea' : 'columnArea' : section?.method ?? '', section?.method === 'endAreas' && section.expressions.initialArea !== '' ? section.initialArea : '', section?.method === 'endAreas' && section.expressions.finalArea !== '' ? section.finalArea : '', section?.method === 'meanArea' && section.expressions.meanArea !== '' ? section.meanArea : '', column?.support ?? section?.support ?? '', column?.areaExpression ? column.area : '', column?.heightExpression ? column.buriedHeight : '', line.surplus && !line.pending ? line.length : '');
        // Empty scaffold inputs remain empty in the exported document too.
        if (line.pending !== undefined) {
          for (const [index, field] of [[4,"similarElements"],[5,line.kind === "units" || line.kind === "weight" ? "manualQuantity" : "length"],[6,"width"],[7,"height"],[8,"repetitions"]] as const) {
            if (line.expressions?.[field] === "") output[index] = "";
          }
          if (line.pending) for (let index = 9; index <= 13; index++) output[index] = "";
        }
      }
      for (const steel of item.steelLines) rows.push(["", "", `${steel.description} · ${steel.bar}`, "kg", steel.similarElements, steel.length, "", "", steel.quantity, "", "", "", steel.weightKg, "", ""]);
    }
    const content = "\uFEFF" + rows.map((row) => row.map((value) => quote(value)).join(";")).join("\r\n");
    const url = URL.createObjectURL(new Blob([content], { type: "text/csv;charset=utf-8" }));
    const link = document.createElement("a"); link.href = url; link.download = "metrado-wexel.csv"; link.click(); URL.revokeObjectURL(url);
  };

  return (
    <div role="group" aria-label="Herramientas de Metrados" className="flex h-14.5 min-w-max items-center gap-1 px-1 text-[#666]">
            <MetradoTool primary icon="header" label="Encabezado" onClick={() => setDialog("header")} title="Editar los datos del encabezado del proyecto" />

      <MetradoTool primary icon="template" label="Normativa" onClick={() => setDialog("normaTemplate")} title="Iniciar con las partidas de la norma técnica, sin cantidades" />
      <CompactTools label="Plantillas y revisión">
        <MetradoTool icon="review" label="Revisar metrado" onClick={() => setDialog("normaReview")} title="Consultar criterios de medición, unidades y pendientes" />
        <MetradoTool icon={demoActive ? "restore" : "preview"} label={demoActive ? "Volver a mi metrado" : "Probar plantilla Q7"} className="text-[#217346]" onClick={toggleQuispeExample} title={demoActive ? "Restaurar mi metrado con sus datos y formatos" : "Probar los datos de Quispe conservando una copia de mi metrado"} />
      </CompactTools>
      <SeparatorOne/>
      <MetradoTool primary icon="new-item" label="Agregar" onClick={() => setDialog("item")} title="Crear título o partida" />
      <CompactTools label="Partidas y niveles">
        <MetradoTool icon="detail" label="Detalle" onClick={addMetradoDetail} title="Añadir una línea a la partida seleccionada" />
        <MetradoTool icon="blank-row" label="Línea en blanco" disabled={!metradoSheet || preview} onClick={() => { try { addMetradoSeparator(); } catch (error) { toast.error(error instanceof Error ? error.message : 'No se pudo insertar la línea.'); } }} title="Insertar debajo del detalle seleccionado una fila vacía o un rótulo, sin cálculos ni sombreado" />
        <MetradoTool icon="delete-row" label="Eliminar fila" onClick={removeRows} disabled={deleting} className="cursor-pointer" title="Eliminar la fila seleccionada del metrado" />
        <MetradoTool icon="items" label="Generar ítems" onClick={() => setDialog("numbering")} title="Generar y actualizar numeración jerárquica" />
        <MetradoTool icon="levels" label="Generar nivel" onClick={() => setDialog("levels")} title="Extraer niveles a partir de los códigos" />
        <MetradoTool icon="units" label="Unidad / totales" onClick={() => setDialog("units")} title="Corregir unidades y totales" />
        <MetradoTool icon={collapsedItemIds.length ? "expand" : "collapse"} label={collapsedItemIds.length ? "Expandir" : "Contraer"} onClick={toggleAllItems} title="Contraer o expandir niveles" />
      </CompactTools>
      <SeparatorOne/>
      <MetradoTool primary icon="summary" label="Resumen" onClick={() => setDialog("summary")} title="Generar resumen consolidado" />
      <div role="group" aria-label="Hojas de trabajo" className="flex shrink-0 items-center gap-1">
        <MetradoTool primary icon="worksheet" label="Metrado" onClick={() => { if (useMetradoPreviewStore.getState().active) closeMetradoPreview(); useMetradoStore.getState().setView("metrado"); useWexelStore.getState().setActiveSheet("metrados-metrado"); }} title="Volver a la hoja de metrado" />
        <MetradoTool primary icon="steel-sheet" label="Acero" onClick={() => setDialog("steelSheet")} title="Abrir desagregado de acero" />
      </div>
      <SeparatorOne/>
      <MetradoTool primary icon="calculation" label="Cálcular" onClick={() => openCalculator("measurement")} title="Agregar línea de cálculo a la partida seleccionada" />
      <MetradoTool primary icon="steel" label="M.Acero" onClick={() => openCalculator("steel")} title="Calcular y agregar acero" />
      <MetradoTool primary icon="stirrup" label="Estribos" onClick={() => openCalculator("stirrup")} title="Calcular estribos" />
      <div role="group" aria-label="Cálculos de materiales" className="flex shrink-0 items-center gap-1">
        <MetradoTool primary icon="slab" label="L.Maciza" onClick={() => openCalculator("slab")} title="Calcular losa maciza" />
        <MetradoTool primary icon="column" label="Columna" onClick={() => openCalculator("column")} title="Calcular metrado de columna" />
        <MetradoTool primary icon="wood" label="Madera" onClick={() => openCalculator("wood")} title="Calcular metrado de madera" />
          
      </div>
      <SeparatorOne/>
      <div role="group" aria-label="Archivos" className="flex shrink-0 items-center gap-1">
        <MetradoTool primary icon={preview ? 'restore' : 'review'} label={preview ? 'Volver al metrado' : 'Vista previa'} onClick={preview ? closeMetradoPreview : openMetradoPreview} title={preview ? 'Volver a editar las hojas de cálculo' : 'Ver Metrado, Acero y Resumen con encabezados, listos para imprimir'} />
        <MetradoTool primary icon="import" label="Importar" onClick={() => document.getElementById("metrado-import")?.click()} title="Importar un archivo Wexel Metrados" />
        <MetradoTool primary icon="export" label="Exportar" onClick={() => { const state = useMetradoStore.getState(); const blob = new Blob([JSON.stringify({ schemaVersion: 1, header: state.header, items: state.items, steelSheetItems: state.steelSheetItems }, null, 2)], { type: "application/json" }); const url = URL.createObjectURL(blob); const anchor = document.createElement("a"); anchor.href = url; anchor.download = "metrado-wexel.json"; anchor.click(); URL.revokeObjectURL(url); }} title="Exportar respaldo del metrado y acero" />
        <MetradoTool primary icon="csv" label="CSV" onClick={exportCsv} title="Descargar la hoja tabular compatible con Excel" />
      </div>
      <SeparatorOne/>
      <CompactTools label="Formato y limpieza">
        <MetradoTool icon="style" label="Estilos hoja" onClick={() => setDialog("style")} title="Aplicar estilo de hoja" />
        <MetradoTool icon="clear" label="Limpiar" className="text-[#9b3030]" onClick={() => setDialog("clear")} title="Limpiar el metrado" />
      </CompactTools>
    </div>
  );
}

export default NavMetrado;
