# Colores y presentación del lienzo

La paleta del lienzo, los niveles de Metrados y los estados de selección está en **`config/colors.ts`**. Cambia los valores hexadecimales y guarda el archivo. Durante el desarrollo, la actualización automática también refresca las hojas ya guardadas; al abrir la aplicación se comprueba la paleta otra vez. Se conservan los datos, las fórmulas y las dimensiones manuales. En producción hay que volver a compilar y publicar los cambios del archivo.

## Fondos de las filas y colores del texto

Dentro de `COLORS.metrado`, modifica estas propiedades para cambiar los fondos:

```ts
levelBackgrounds: ["#dfe3e6", "#e9ecef", "#f0f2f4", "#f5f6f7", "#f8f9fa", "#fbfbfc", "#ffffff"],
heading: "#d5dade", // Fondo del encabezado de la tabla.
```

`levelBackgrounds` controla el fondo de cada nivel (1 a 7) de capítulos y partidas. `chapter` e `item` son fondos de respaldo. `levels` controla el **texto** según el nivel, y `blue` el texto del estilo alternativo «Azul». Las filas de detalle usan `excel.cell`. Para ver los fondos, activa la opción de relleno en «Estilos hoja».

| Configuración | Uso |
| --- | --- |
| `app.primary`, `app.secondary` | Texto y herramientas de la interfaz compartida |
| `app.border`, `app.ribbon`, `app.word` | Separadores, cinta y color de Word |
| `excel.grid` | Cuadrícula y bordes de celdas, incluso al aplicar bordes desde Home |
| `excel.heading`, `excel.headingText` | Encabezados de columnas y números de fila |
| `excel.selection`, `excel.range` | Celda activa y rango seleccionado |
| `excel.cell`, `excel.text` | Fondo y texto de las celdas generadas |
| `metrado.levels` | Colores del texto de capítulos y partidas de los siete niveles |
| `metrado.blue` | Alternativa azul del formulario Estilos hoja |
| `metrado.heading`, `metrado.chapter`, `metrado.item` | Fondos de encabezados, capítulos y partidas |
| `metrado.demoBackground`, `demoText`, `demoBorder` | Aviso de ejemplo Q7 activo |
| `references` | Colores de las referencias al editar fórmulas |

Por ejemplo, para cambiar el color de los capítulos de segundo nivel, modifica el segundo valor de `metrado.levels`. Para cambiar la selección, modifica `excel.selection`.

La paleta técnica usa una sola familia de grafitos y fondos grises. La jerarquía se distingue mediante los tonos de fondo y texto, conservando la negrita, el tamaño original y la alineación sin sangría:

| Nivel | Color de texto | Tono |
| --- | --- | --- |
| 1 | `#18212b` | Grafito profundo |
| 2 | `#202b36` | Grafito |
| 3 | `#293541` | Pizarra oscura |
| 4 | `#303b46` | Pizarra |
| 5 | `#37424d` | Gris técnico |
| 6 | `#3e4852` | Gris acero |
| 7 | `#454e57` | Gris neutro |

Los detalles usan `excel.text` (`#374151`). Todos los niveles usan 9 puntos, sin sangría en las descripciones. Los niveles posteriores al séptimo conservan el último estilo. «Color» aplica los grafitos por nivel; «Azul» utiliza un único azul oscuro. El CSV exporta datos sin formato, por lo que no conserva estos estilos.

`app/layout.tsx` expone la paleta compartida como variables CSS. `app/globals.css` utiliza esas variables para los colores de Tailwind. Los controles especializados que aún tienen estilos propios se encuentran en `components/metrados/Metrados.module.css` y en los componentes de cada herramienta; esos estilos de formularios no forman parte de la paleta automática de las celdas.

## Filas, textos y bordes

- La fuente principal es **Helvetica**, con `sans-serif` como respaldo. Los capítulos y partidas usan negrita con la paleta de siete niveles. Las filas de detalle mantienen el texto regular. Los encabezados de tabla mantienen la negrita.
- Las filas estándar miden **21 px**. Solo los textos con ajuste de línea aumentan su altura; al ensanchar la columna pueden volver a compactarse.
- Los códigos de ítem y las descripciones se alinean a la izquierda. Los títulos y partidas convierten códigos y descripciones a mayúsculas al escribir y confirmar, también desde los formularios. Los detalles mantienen su escritura libre. Los encabezados y cantidades mantienen sus alineaciones de tabla.
- El redimensionado manual de filas y columnas tiene prioridad. La altura mínima manual es 18 px.
- Las celdas conservan la cuadrícula gris `#d6d6d6`. Metrados ya no superpone bordes negros.
- Las reglas de texto y colores de la plantilla están en `components/metrados/formatWorkbook.ts`. El tamaño dinámico y la ventana de filas visibles están en `components/utils/virtualRows.ts`.
- Acero usa las columnas K:T para diámetros, U para kg/m, V para parciales y W para el total de cada partida. Los encabezados agrupados conservan las combinaciones de celdas de Q7.
- Metrado y Resumen comienzan con su cabecera tabular en la fila 1. Acero conserva la cabecera agrupada en las filas 1 y 2 y sus datos desde la fila 4. Ninguna hoja muestra el bloque de datos del proyecto; esos datos siguen disponibles en «Encabezado». Los controles originales de Acero se trasladan 13 filas hacia arriba sin cambiar sus resultados.

## Fluidez y guardado

Cambiar de selección no modifica las celdas ni recalcula fórmulas. Cada fila se actualiza solo si cambian sus datos, su selección o su edición. Se montan únicamente las filas visibles y un pequeño margen para desplazar la hoja con suavidad.

Al alternar hojas se reutiliza su geometría calculada mientras no cambien las celdas, dimensiones, combinaciones o filas ocultas. La pestaña activa se guarda en un registro pequeño (`:navigation`); alternar ya no vuelve a serializar el proyecto completo. Los cambios de contenido siguen usando el guardado agrupado normal. La restauración incorpora la última pestaña activa.

«Volver a mi metrado» restaura la copia anterior al ejemplo. Si una copia antigua contiene solo la hoja vacía inicial o carece de cabeceras tabulares, se reconstruyen Metrado, Acero y Resumen y se selecciona la hoja correspondiente. Se conservan fórmulas, notas, dimensiones y hojas adicionales. Las copias completas se restauran tal como estaban.

La cinta Metrados incorpora **Plantilla normativa** y **Revisar metrado**. La plantilla agrega partidas y niveles sin cantidades y conserva el proyecto real, incluso si se inicia desde el ejemplo Q7. Los guardados grandes usan compresión sin pérdida para que el catálogo completo no exceda la cuota del almacenamiento local; los guardados JSON anteriores siguen siendo compatibles. El alcance y las brechas de cumplimiento están en `docs/estudio-norma-y-plantilla-metrados.md`.

Los cambios reales se guardan agrupados, 250 ms después del último cambio. Al ocultar o cerrar la página se vacía el guardado pendiente. Los borradores sin confirmar siguen siendo borradores: Enter confirma y Escape cancela. La selección no genera copias serializadas de los libros.

## Navegación y diagnóstico de rendimiento

Las celdas usan memoización individual: al mover la selección solo se renderizan las celdas afectadas. Los controles de la cinta observan únicamente el formato, no el valor o la dirección de cada celda. El foco ya activo no emite actualizaciones repetidas; los editores se enfocan sin desplazar la página y el resaltado de fórmulas solo consulta estilos cuando es necesario. El índice de partida por fila y las alturas de textos ajustados se reutilizan. La reconciliación conserva los objetos de las celdas que no cambiaron.

En desarrollo se puede abrir `/?grid-profile=1`. El contenedor del lienzo expone `data-grid-profile` con el número de muestras, último render, mediana y percentil 95, en milisegundos. No agrega controles visibles ni envía datos; la instrumentación de React no se incluye en producción. Es una medida del renderizado de la cuadrícula, no una medición completa de INP o latencia de entrada.

Comprobación local: 30 cambios de selección mediante ratón, además de navegación con flechas, en el catálogo completo. Las 82 muestras recogidas durante la sesión dieron mediana 3,3 ms y P95 12,4 ms en desarrollo. Los resultados dependen del equipo y de la carga; no constituyen una garantía en otros dispositivos. La comprobación de estado confirma que seleccionar y cambiar hojas no recalcula celdas ni serializa el contenido completo.
