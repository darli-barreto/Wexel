"use client";
import MetradoDialogs from "./MetradoDialogs";
import { useMetradoStore } from "@/store/useMetradoStore";
export default function MetradoWorkspace() {
  return <><MetradoDialogs /><input id="metrado-import" type="file" accept=".json" hidden onChange={async (event) => {
    const store = useMetradoStore.getState();
    const file = event.target.files?.[0]; if (!file) return;
    try { const data = JSON.parse(await file.text());
      if (data.schemaVersion !== 1 || !data.header || !Array.isArray(data.items) || data.items.some((item: {id?: string; measurements?: unknown[]; steelLines?: unknown[]}) => !item.id || !Array.isArray(item.measurements) || !Array.isArray(item.steelLines))) throw new Error("Archivo de Metrados no válido.");
      if (store.items.length && !window.confirm("¿Reemplazar el proyecto de Metrados por el archivo importado?")) return;
      if (data.steelSheetItems !== undefined && (!Array.isArray(data.steelSheetItems) || data.steelSheetItems.some((item: {id?:string;steelLines?:unknown[];measurements?:unknown[]})=>!item.id || !Array.isArray(item.steelLines) || !Array.isArray(item.measurements)))) throw new Error("Datos de Acero no válidos.");
      store.importEstimate(data.items, data.header, data.steelSheetItems);
    } catch (error) { window.alert(error instanceof Error ? error.message : "No se pudo importar el proyecto."); }
    event.target.value = "";
  }} /></>;
}
