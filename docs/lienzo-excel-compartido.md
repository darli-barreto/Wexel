# Un único lienzo Excel, con libros independientes

## Corrección solicitada

La primera integración había creado otra cuadrícula para Metrados. Esa cuadrícula se retiró. La aplicación ahora renderiza una sola instancia de CanvaExcel, el componente original de Wexel, con sus mismos HeaderExcel, TableExcel, TableRowExcel y FooterExcel.

Se conservan la apariencia del lienzo, sus clases visuales, la barra de fórmulas, las letras/números, los controles originales de ancho y altura, la selección, las referencias coloreadas y el motor de fórmulas. No se aplican automáticamente anchos de columnas, fuentes, colores ni otro diseño de plantilla.

Todos los comandos de Metrados están en su cinta: nueva partida, detalle, cálculo parcial, unidades/totales y eliminación de filas, además de los asistentes y configuraciones existentes. Se eliminó la fila de botones y mensajes añadida sobre el lienzo.

## Separación de los datos

El almacén general conserva un libro por espacio de trabajo:

- Home utiliza el libro del lienzo en blanco que ya existía.
- Metrados utiliza sus hojas Metrado, Acero y RESUMEN.
- Las otras pestañas de herramientas utilizan libros independientes.

Cada libro conserva sus celdas, fórmulas, selección, hoja activa, anchos y altos. Las hojas nuevas que añade el usuario pertenecen al libro activo. Cambiar de pestaña cambia los datos del lienzo; el componente visual y sus controles son los mismos.

La persistencia general pasó de versión 1 a versión 2. La migración conserva las hojas originales en el libro del lienzo en blanco. Los datos de la primera versión de Metrados se proyectan desde su almacén existente a las hojas del lienzo original.

## Datos de la plantilla sobre el lienzo original

La hoja Metrado empieza con los nombres de columnas y las filas de partidas/detalles. No incluye el título general del proyecto, propietario, fecha, especialidad, módulo ni responsables. Esos datos siguen disponibles en el formulario de encabezado y en las hojas de Resumen y Acero.

Los asistentes escriben valores y fórmulas normales en las celdas originales. Las longitudes, áreas, volúmenes, pesos y totales se calculan con el mismo motor que el lienzo en blanco. Las celdas libres siguen admitiendo operaciones y referencias.

La conexión es bidireccional para los datos identificados por la plantilla: al editar un detalle en la hoja se actualizan su modelo, sus totales y el resumen; al enviar otro cálculo se agregan sus filas. La conexión conserva las fórmulas personalizadas, los formatos y tamaños del usuario y las celdas libres. Si se añaden filas de plantilla, las referencias y las alturas de las filas existentes se trasladan con ellas.

Los textos/cálculos libres se conservan como celdas libres; no se convierten automáticamente en partidas del modelo. Para crear partidas y detalles vinculados al resumen se utilizan los comandos de la cinta o los asistentes. Los datos originales del Excel general no se mezclan con los de Metrados.

También se permite mostrar y recalcular filas generadas después de la 99, manteniendo las 99 filas iniciales del lienzo en blanco.

## Verificación

Además de las 28 pruebas anteriores de fórmulas, edición, bordes y cálculos Q7, se añadieron ocho pruebas de integración:

1. Independencia de celdas y dimensiones entre el lienzo en blanco, Metrados y otras pestañas.
2. Ausencia del encabezado de proyecto en Metrado.
3. Edición de una fórmula con referencias y actualización de totales/resumen.
4. Conservación de celdas libres, fórmulas, anchos y altos al enviar otro cálculo.
5. Traslado de referencias y selección cuando se desplazan filas de plantilla.
6. Confirmación de una edición pendiente en su libro original después de cambiar de pestaña.
7. Cálculos de plantillas con más de 99 filas.
8. Fórmulas personalizadas en los resultados y edición desde la hoja Acero.

En el navegador se comprobó el redimensionado con los controles originales: D pasó de 100 a 282 píxeles y la fila 3 aumentó a 56 píxeles. El lienzo en blanco conservó su columna D de 100 píxeles. Al volver a Metrados se conservaron ambos cambios.

También se comprobó =H3+1, SUM(F3:I3), el resaltado de las cuatro referencias y el envío de un detalle adicional a una partida existente. El total pasó a 8.6 sin perder la fórmula libre ni el ancho cambiado.

## Archivos

Validación final: 36 pruebas aprobadas, revisión de estilo sin errores y compilación de producción correcta. Tras recargar el navegador se conservaron los datos y dimensiones; no se registraron errores de consola.

Capturas de comprobación: [Metrados](capturas/lienzo-original-metrados.png) y [lienzo en blanco independiente](capturas/lienzo-original-blanco.png).

- components/CanvaExcel.tsx y sus componentes originales: único lienzo.
- store/useWexelStore.ts: libros por espacio, migración y persistencia.
- components/metrados/workbook.ts: datos y fórmulas de la plantilla sobre SheetData.
- components/metrados/syncWorkbook.ts: sincronización y selección de partidas.
- components/metrados/MetradoWorkspace.tsx: formularios e importación; no contiene una cuadrícula.
- components/header-tools/NavMetrado.tsx: comandos de la cinta.
- tests/excelWorkbooks.test.cjs: pruebas de integración.
