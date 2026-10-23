# Auditoría de Acero y rendimiento

## Actualización: hojas compactas y navegación

Se retiró el bloque de información de Acero y Resumen. La cabecera de Acero se trasladó de las filas 14–15 a 1–2, y sus datos subieron 13 filas. Los 74 controles numéricos originales siguen pasando, comparando ahora cada dirección de origen con su dirección trasladada. También se verificó la migración de una hoja guardada con fórmulas personalizadas, notas y dimensiones manuales.

La caché de geometría evita repetir el cálculo de alturas al volver a una hoja sin cambios. La navegación se persiste en registros pequeños, sin serializar los datos de las tres hojas. La medición local de `scripts/benchmark-grid.cjs` registró **30 alternancias en 1,13 ms** de manejo de estado y geometría, **30 reutilizaciones**, **0 cambios de celdas** y **1 526 bytes** de navegación guardados. No mide el renderizado ni la latencia visual del navegador.

Se verificaron **51 pruebas**, incluida la escritura en mayúsculas en códigos y títulos, alineación izquierda, migración sin cabeceras de proyecto, persistencia de navegación y reutilización de geometría. La edición de detalles continúa libre.

## Evidencia de rendimiento

Se reprodujeron 20 selecciones consecutivas sobre el ejemplo completo con `node scripts/benchmark-grid.cjs`.

| Medida del estado, sin renderizado del navegador | Antes | Después |
| --- | ---: | ---: |
| Tiempo de las 20 selecciones | 881.06 ms | 1.57 ms |
| Cambios del objeto de celdas | 21 | 0 |
| Escrituras solicitadas al almacenamiento | 48 | 0 |
| Texto serializado durante la selección | 162.64 MB | 0 MB |

Son medidas locales del manejo de estado, no tiempos de respuesta visual garantizados en otros equipos. La mejora elimina trabajo que ocurría aunque no se modificara ningún valor. Además, el navegador mantiene una ventana de filas visibles en lugar de crear todas las celdas de la hoja. Una prueba de 10 000 filas verifica que una ventana de 600 px monta menos de 50 filas, conserva índices originales, filas ocultas y alturas manuales.

Se corrigieron el recálculo al confirmar una celda sin cambios, la comparación de todo el modelo durante la selección, los guardados por enfoque y la copia duplicada del libro activo en el archivo persistido. Los cambios reales se guardan agrupados y se vacían al ocultar/cerrar la página.

## Contraste con el original

Fuente: `C:/Users/Usuario/Desktop/Plantilla_Metrados_Limpia.xlsm`, SHA-256 `3ddb033172855f233a6741971e9bc446f7222d68977571917f030ddec7023f03`.

Se contrastaron los datos y fórmulas del XML de **Acero** con el código VBA exportado de `FormAcero.frm`, `Acero.bas` y `HojaAcero.bas` de la plantilla suministrada.

La implementación anterior tenía una tabla simplificada y desglosaba el acero de Metrado. El ejemplo de Acero del archivo contiene **tres partidas independientes y veinte líneas**, con otros códigos y cantidades. Esa diferencia de datos impedía reproducir el resultado de referencia. Ahora el ejemplo carga esas partidas directamente en Acero, sin sumarlas ni sustituir las de Metrado. Cuando no hay un listado independiente, Acero sigue desglosando las líneas del proyecto actual.

| Columnas de Q7 | Contenido conservado |
| --- | --- |
| C:E | Código, descripción y unidad |
| F | Elementos similares |
| G:I | Largo, suma de ganchos y empalme total |
| J | Cantidad |
| K:T | Longitud por cada uno de los diez diámetros del catálogo |
| U | Factor kg/m |
| V | Peso parcial |
| W | Total de la partida |

La longitud se calcula como `F × (G + H + I) × J`. El peso parcial multiplica la longitud del diámetro por su kg/m. Las partidas suman sus parciales y la fila final totaliza las longitudes por diámetro y el peso. No se redondean los cálculos internos; se presentan con dos decimales.

## Controles del archivo fuente

Se extrajeron **74 controles numéricos** de K17:W45: longitudes por diámetro, factores, parciales, subtotales y total. Todos coinciden con tolerancia de 0.00000001. Los encabezados agrupados y el catálogo por diámetro también proceden del archivo.

| Celda original | Resultado interno | Presentación |
| --- | ---: | ---: |
| W17 | 162.96 | 162.96 |
| W29 | 120.564 | 120.56 |
| W42 | 17.192 | 17.19 |
| K45 | 237.2 m | 237.20 |
| L45 | 431.1 m | 431.10 |
| V45 | 300.716 kg | 300.72 |

El título de la primera partida y sus códigos se conservan tal como aparecen en el archivo, aunque no correspondan a los códigos de Metrado. La app no los corrige ni vincula silenciosamente.

## Pruebas de comportamiento

Además de comparar los 74 controles, se modifica G19 de 4.4 a 5. La longitud L19 pasa a 43.2 m, el parcial V19 a 24.192 kg, el subtotal W17 a 165.648 kg y el total V45 a 303.404 kg. Metrado permanece intacto. También se comprueban fórmulas editables, envío de una línea desde la calculadora, restauración del trabajo anterior y recarga de los libros persistidos.

La fidelidad comprobada corresponde a los datos, columnas y resultados de este archivo y a los casos de edición descritos; no implica haber validado todos los proyectos y combinaciones posibles de entradas.

## Validación final

45 pruebas aprobadas, comprobación de tipos y revisión de estilo sin errores; compilación de producción correcta. En navegador se verificaron 31 filas montadas en la vista inicial del ejemplo, descripción alineada a la izquierda, cuadrícula RGB(214, 214, 214), altura estándar de 21 px, cambio de ancho de D de 380 a 420 px y regreso a 380, recálculo de 284.13 a 297 al modificar una dimensión y navegación a D200. Seleccionar una fórmula mantiene su resultado en la celda; F2 o escribir inicia la edición. La barra de fórmulas permanece visible al desplazarse horizontalmente.

Capturas: [Metrado compacto](capturas/metrado-compacto-optimizado.png) y [total de Acero](capturas/acero-q7-total-verificado.png).
