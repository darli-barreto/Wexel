"use client";

import { calculateMeasurement, calculateItemTotal, useMetradoStore } from "@/store/useMetradoStore";
import { addMetradoDetail, deleteMetradoRow } from "@/components/metrados/syncWorkbook";
import { useWexelStore } from "@/store/useWexelStore";
import { toggleQuispeExample } from "@/components/metrados/exampleTemplate";
import { itemHasQuantity } from "@/components/metrados/normaCatalog";

const toolClass = "flex h-14 min-w-[58px] flex-col items-center justify-center gap-1 rounded px-2 text-[10px] text-[#555] hover:bg-white/70 focus:outline-none focus:ring-1 focus:ring-[#217346]";

function NavMetrado() {
  const setDialog = useMetradoStore((state) => state.setDialog);
  const collapsedItemIds = useMetradoStore((state) => state.collapsedItemIds);
  const toggleAllItems = useMetradoStore((state) => state.toggleAllItems);
  const demoActive = useMetradoStore((state) => Boolean(state.demoBackup));

  const openCalculator = (dialog: "slab" | "column" | "wood" | "steel" | "stirrup" | "measurement") => setDialog(dialog, useMetradoStore.getState().selectedItemId);
  const exportCsv = () => {
    const { header, items } = useMetradoStore.getState();
    const quote = (value: string | number) => `"${String(value).replaceAll('"', '""')}"`;
    const rows: Array<Array<string | number>> = [
      [header.title], ["Proyecto", header.project], ["Propietario", header.owner], ["Fecha", header.date], ["Especialidad", header.specialty], ["Módulo", header.module], [],
      ["Nivel", "Ítem", "Descripción", "Und", "Elem. simil.", "Largo", "Ancho", "Alto", "Nº veces", "Long.", "Área", "Vol.", "Kg.", "Und.", "Total", "Referencia normativa", "Plano / especificación"],
    ];
    for (const item of items) {
      rows.push([item.norma?.level ?? item.code.split(".").length, item.code, item.description, item.unit, "", "", "", "", "", "", "", "", "", "", item.norma && !itemHasQuantity(item) ? "" : calculateItemTotal(item), item.norma?.code ?? "", item.support ?? ""]);
      for (const line of item.measurements) {
        const output = ["", "", line.description, line.unit, line.similarElements, line.kind === "weight" || line.kind === "units" ? "" : line.length, line.kind === "area" || line.kind === "volume" ? line.width : "", line.kind === "volume" ? line.height : "", line.repetitions, line.kind === "length" ? calculateMeasurement(line) : "", line.kind === "area" ? calculateMeasurement(line) : "", line.kind === "volume" ? calculateMeasurement(line) : "", line.kind === "weight" ? calculateMeasurement(line) : "", line.kind === "units" ? calculateMeasurement(line) : "", ""];
        rows.push(output);
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
    <div className="flex h-14.5 min-w-max items-center gap-1 overflow-x-auto px-1 text-[#666]">
      <button className={toolClass} onClick={() => setDialog("normaTemplate")} title="Iniciar con las partidas de la norma técnica, sin cantidades"><span className="text-lg">▧</span><span>Plantilla normativa</span></button>
      <button className={toolClass} onClick={() => setDialog("normaReview")} title="Consultar criterios de medición, unidades y pendientes"><span className="text-lg">✓</span><span>Revisar metrado</span></button>
      <button className={`${toolClass} text-[#217346]`} onClick={toggleQuispeExample} title={demoActive ? "Restaurar mi metrado con sus datos y formatos" : "Probar los datos de Quispe conservando una copia de mi metrado"}><span className="text-lg">{demoActive ? "↶" : "▷"}</span><span>{demoActive ? "Volver a mi metrado" : "Probar plantilla Q7"}</span></button>
      <span className="h-10 border-l border-[#c8c8c8]" />
      <button className={toolClass} onClick={() => setDialog("header")} title="Editar encabezado"><span className="text-lg">▤</span><span>Encabezado</span></button>
      <span className="h-10 border-l border-[#c8c8c8]" />
      <button className={toolClass} onClick={() => setDialog("item")} title="Crear título o partida"><span className="text-lg font-light">＋</span><span>Nueva partida</span></button>
      <button className={toolClass} onClick={addMetradoDetail} title="Añadir una línea a la partida seleccionada"><span className="text-lg">＋</span><span>Detalle</span></button>
      <button className={toolClass} onClick={() => setDialog("units")} title="Corregir unidades y totales"><span className="text-lg">∑</span><span>Unidad / totales</span></button>
      <button className={toolClass} onClick={deleteMetradoRow} title="Eliminar la fila seleccionada del metrado"><span className="text-lg">⌫</span><span>Eliminar fila</span></button>
      <button className={toolClass} onClick={() => setDialog("numbering")} title="Generar y actualizar numeración jerárquica"><span className="text-lg">☷</span><span>Generar ítems</span></button>
      <button className={toolClass} onClick={() => setDialog("levels")} title="Extraer niveles a partir de los códigos"><span className="text-lg">≡</span><span>Generar nivel</span></button>
      <button className={toolClass} onClick={toggleAllItems} title="Contraer o expandir niveles"><span className="text-lg">⇳</span><span>{collapsedItemIds.length ? "Expandir" : "Contraer"}</span></button>
      <button className={toolClass} onClick={() => setDialog("summary")} title="Generar resumen consolidado"><span className="text-lg">▦</span><span>Resumen</span></button>
      <button className={toolClass} onClick={() => setDialog("steelSheet")} title="Abrir desagregado de acero"><span className="text-lg">⌁</span><span>Hoja de acero</span></button>
      <span className="h-10 border-l border-[#c8c8c8]" />
      <button className={toolClass} onClick={() => openCalculator("steel")} title="Calcular y agregar acero"><span className="text-lg">∿</span><span>Metrado acero</span></button>
      <button className={toolClass} onClick={() => openCalculator("stirrup")} title="Calcular estribos"><span className="text-lg">⊏</span><span>Estribos</span></button>
      <button className={toolClass} onClick={() => openCalculator("slab")} title="Calcular losa maciza"><span className="text-lg">▱</span><span>Losa maciza</span></button>
      <button className={toolClass} onClick={() => openCalculator("column")} title="Calcular metrado de columna"><span className="text-lg">▥</span><span>Columna</span></button>
      <button className={toolClass} onClick={() => openCalculator("wood")} title="Calcular metrado de madera"><span className="text-lg">▰</span><span>Madera</span></button>
      <button className={toolClass} onClick={() => openCalculator("measurement")} title="Agregar línea de cálculo a la partida seleccionada"><span className="text-lg">⌗</span><span>Nuevo cálculo</span></button>
      <span className="h-10 border-l border-[#c8c8c8]" />
      <button className={toolClass} onClick={() => setDialog("style")} title="Aplicar estilo de hoja"><span className="text-lg">◈</span><span>Estilos hoja</span></button>
      <button className={toolClass} onClick={() => setDialog("header")} title="Configurar los datos impresos del proyecto"><span className="text-lg">▣</span><span>Diseño hoja</span></button>
      <button className={toolClass} onClick={() => { useMetradoStore.getState().setView("metrado"); useWexelStore.getState().setActiveSheet("metrados-metrado"); }} title="Volver a la hoja de metrado"><span className="text-lg">▤</span><span>Hoja metrado</span></button>
      <button className={toolClass} onClick={() => document.getElementById("metrado-import")?.click()} title="Importar un archivo Wexel Metrados"><span className="text-lg">↥</span><span>Importar</span></button>
      <button className={toolClass} onClick={() => { const state = useMetradoStore.getState(); const blob = new Blob([JSON.stringify({ schemaVersion: 1, header: state.header, items: state.items, steelSheetItems: state.steelSheetItems }, null, 2)], { type: "application/json" }); const url = URL.createObjectURL(blob); const anchor = document.createElement("a"); anchor.href = url; anchor.download = "metrado-wexel.json"; anchor.click(); URL.revokeObjectURL(url); }} title="Exportar respaldo del metrado y acero"><span className="text-lg">↧</span><span>Exportar</span></button>
      <button className={toolClass} onClick={exportCsv} title="Descargar la hoja tabular compatible con Excel"><span className="text-lg">▤</span><span>Exportar CSV</span></button>
      <button className={`${toolClass} text-[#9b3030]`} onClick={() => setDialog("clear")} title="Limpiar el metrado"><span className="text-lg">⌫</span><span>Limpiar</span></button>
    </div>
  );
}

export default NavMetrado;
