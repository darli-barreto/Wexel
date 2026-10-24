# Vista previa de documentos

En Metrados, el botón principal **Vista previa** abre el lienzo de Word existente con las tres secciones: Metrado, Acero y Resumen. **Volver al metrado** regresa a las celdas. La vista usa A4 horizontal y el encabezado configurado en **Encabezado**, repetido en cada página junto con la cabecera de la tabla y la numeración.

El botón superior **Imprimir** abre la impresión del navegador, donde se puede elegir una impresora o guardar como PDF. La impresión oculta la interfaz. **Download .docx** descarga las mismas tablas en Word, con sus resultados y datos del proyecto.

La vista es de lectura: las cantidades y las celdas manuales se editan en Excel. Los cambios de encabezado y contenido actualizan la vista previa. Se muestran todos los niveles aunque estén contraídos y se prepara el resumen aunque esté oculto en el lienzo. Las celdas libres se incluyen hasta la última fila y columna con contenido; no se incluyen las filas vacías finales del lienzo. Los campos del proyecto no rellenados se muestran con una raya, sin inventar datos.

La vista previa no sobrescribe el documento Word del usuario ni las hojas originales. Su estado es temporal y no se guarda como una segunda copia del proyecto. Al cambiar de sección o volver a Excel se cierra.

## Mantenimiento

- `components/metrados/documentPreview.ts`: instantánea de celdas calculadas, combinaciones, estilos y paginación.
- `store/useMetradoPreviewStore.ts`: apertura, regeneración y regreso al lienzo.
- `components/metrados/MetradoDocumentPages.tsx`: páginas dentro de `Canvaword`.
- `components/metrados/MetradoDocument.module.css` y reglas de impresión en `app/globals.css`: presentación en pantalla e impresión.
- `components/metrados/documentDocx.ts`: exportación de la misma instantánea a Word.

Las fórmulas se resuelven con el motor de las hojas antes de construir las páginas; el informe utiliza los valores mostrados y sus decimales. El informe no ejecuta fórmulas mediante otro motor.
