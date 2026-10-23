# Mejoras implementadas en Metrados

**Corrección posterior:** la cuadrícula independiente descrita en esta primera integración fue retirada. Ahora se reutiliza el componente Excel original de Wexel, con libros independientes por pestaña. La arquitectura y las comprobaciones actuales están en [Lienzo Excel compartido](lienzo-excel-compartido.md).

Esta revisión reemplaza la primera tabla de Metrados por una hoja especializada con la apariencia compacta del lienzo Excel de Wexel: letras de columna, números de fila, cuadrícula, selección verde, barra de edición y pestañas Metrado / Acero / RESUMEN.

## Uso

1. Abre la pestaña Metrados. Al venir de Word, se abre la hoja de cálculo.
2. Usa **Nueva partida** para crear títulos/capítulos y partidas con su unidad. **Generar ítems** actualiza numeración y admite prefijo/sufijo.
3. Selecciona una partida y usa **＋ Detalle** para escribir una medición directamente en sus celdas, o **Nuevo cálculo** para usar un asistente. También puedes comenzar escribiendo la descripción en una fila vacía.
4. En los asistentes de acero, estribos, columnas, losas y madera puedes elegir el destino, revisar resultados, preparar varios metrados, modificar/eliminar los preparados y enviarlos juntos.
5. Usa las pestañas inferiores para consultar el resumen y desagregado de acero. El resumen se mantiene vinculado a las partidas y admite factor.

Las dimensiones admiten punto o coma decimal. En la hoja, las entradas numéricas de un detalle admiten operaciones como =2*3.5. Enter confirma y Escape cancela. Las celdas de resultados geométricos son calculadas; se editan los datos de entrada para recalcularlas. El campo de peso/unidades admite una cantidad manual.

## Formularios y comportamiento

- **Encabezado:** ocho campos, fecha de hoy, limpieza e importación/exportación. La importación permite seleccionar campos individualmente y admite JSON o texto con los ocho valores en orden.
- **Partidas:** creación de capítulos/partidas, selección de padre y unidad. Los asistentes usan la partida seleccionada y ya no el último elemento creado.
- **Numeración y niveles:** numeración jerárquica, prefijo/sufijo, extracción de niveles desde códigos únicos de hasta siete segmentos y limpieza de espacios iniciales.
- **Acero:** acero longitudinal y estribaje en pestañas, diámetro, elementos similares, longitud, cantidad, ambos ganchos y empalme. Vista previa de peso y desagregado.
- **Estribos:** una o dos direcciones, cuatro zonas de cantidad/espaciamiento, longitud desarrollada, diámetro y cantidad de elementos.
- **Losa:** una/dos capas, dimensiones y recubrimiento, distribución y diámetros X/Y por capa, orientación horizontal/vertical y selección independiente de concreto, base, perímetro y acero.
- **Columnas:** lista de pisos con altura libre, altura de viga, sección B/T e inclusión de la viga en volumen; acero exterior/interior, estribos cerrados y adicionales X/Y con diámetros independientes, recubrimiento, espaciamiento de nudo y cuatro zonas de distribución.
- **Madera:** dimensiones con unidades independientes, cantidad/elementos similares y pie tablar.
- **Estilos:** color por nivel, azul o monocromo, cuadro y fondo.
- **Hoja de acero:** formato, cuadro y total general configurable; longitudes consolidadas por diámetro.
- **Unidades:** corregir la unidad de una partida y registrar unidades nuevas con su dimensión.
- **Limpieza:** selección de Metrados/Resumen y confirmación adicional. Limpiar solo resumen no borra el detalle de metrado.

Los formularios tienen un esquema referencial, resultados y acciones de envío siempre visibles. En pantallas pequeñas se desplaza el cuerpo del formulario.

## Reglas del VBA conservadas y correcciones

Las reglas se contrastaron con FormAcero, FormEstribo, FormCol, FormMaciso, Maciso.bas y Madera.bas de los recursos locales:

- Las barras mantienen separadas la longitud base, los ganchos y el empalme. El empalme se incorpora una sola vez al peso y a las longitudes consolidadas.
- En losas se conserva la asociación de etiquetas Sx/Sy y diámetros del módulo Maciso, el redondeo bancario de VBA y el redondeo del peso de un elemento antes de aplicar su cantidad.
- En columnas, el volumen incluye la viga cuando corresponde y el encofrado usa la altura libre. El acero longitudinal usa la altura acumulada por pisos, el recubrimiento, los ganchos y los empalmes.
- Los estribos cerrados usan 2 × (B + T) y los adicionales B + T, según el código original exportado. Los estribos del nudo/cimiento se guardan separados de los distribuidos en altura.
- El conteo de estribos conserva el fin de distribución al alcanzar una zona automática y la conversión a Integer que hace el formulario VBA en su primera zona. La prueba anterior de 3 m a 0.10 m se corrigió de 29 a 30 para coincidir con ese código.
- Los totales de una partida agregan solo detalles de su unidad; no suman áreas, volúmenes y pesos entre sí. Las incompatibilidades se señalan en la hoja.
- Se evita crear partidas hijas de una partida final al enviar los resultados de un asistente. Los resultados de otras unidades se crean junto a ella dentro de su capítulo.

El Excel general conserva sus componentes originales y sus datos separados de Metrados. Los estilos de Metrados están aislados en un módulo CSS. La carga inicial espera a recuperar los documentos guardados antes de habilitar la interfaz.

## Validación

- TypeScript: sin errores.
- ESLint en los componentes y almacenes modificados: sin errores.
- 28 pruebas automáticas: fórmulas, referencias de colores, edición y bordes del Excel general; cálculo de áreas/volúmenes; acero, estribos, losas, columnas, madera, jerarquías y compatibilidad de unidades.
- Compilación de producción Next.js: correcta. La primera ejecución sin acceso de red no pudo obtener las fuentes existentes de Google; la ejecución con acceso a esas fuentes terminó correctamente.
- Navegador: losa de dos capas con coma decimal; preparación y modificación de un metrado; envío de cuatro partidas; edición directa y Escape; entrada =2*3.5; resumen con factor 1.1; valores conservados al recargar; apertura de Metrados desde Word; columna con dos pisos.
- Consola durante la revisión: sin errores nuevos de Metrados. Persisten avisos anteriores sobre dimensiones de iconos compartidos de la cinta.

## Alcance de esta versión

Los dibujos son esquemas referenciales en SVG. Las imágenes binarias originales y sus logos aún no se han convertido desde los .frx. La organización visual de los formularios se aproxima a Q7; no se declara una reproducción idéntica píxel por píxel.

La hoja especializada admite operaciones aritméticas en sus entradas, pero no incorpora referencias entre celdas ni todas las funciones de Excel. La hoja Excel general mantiene su motor de referencias y fórmulas existente. Las cantidades de Metrados se guardan como datos de dominio y resultados reproducibles.

El resumen comparte títulos/unidades con Metrado: los cambios se sincronizan directamente. No se replica la operación destructiva de copiar títulos desde otra hoja. El acceso local por archivo de clave del formulario Inicio tampoco se traslada a la web. UserForm6 es un conversor de carácter/código (Chr/Asc), una utilidad auxiliar ajena al flujo de metrado.

El respaldo y la importación del proyecto siguen usando JSON; la salida tabular usa CSV. Esta versión no ejecuta macros VBA ni importa/exporta directamente libros XLSM. El guardado actual es local en el navegador, sin una base de datos de servidor.

## Evidencia visual

- [Hoja de Metrados](capturas/metrados-hoja.png)
- [Formulario de losa](capturas/metrados-losa.png)
- [Formulario de columnas por pisos](capturas/metrados-columnas.png)

## Archivos principales

- components/metrados/MetradoSheet.tsx: primera cuadrícula, retirada en la corrección posterior.
- components/metrados/CalculatorDialog.tsx: asistentes y lista de metrados preparados.
- components/metrados/MetradoDialogs.tsx: encabezado, partidas y configuración.
- components/metrados/calculations.ts: reglas de cálculo.
- components/metrados/FormControls.tsx y Metrados.module.css: controles y presentación.
- store/useMetradoStore.ts: estado independiente, agrupación y persistencia.
- tests/metradoQ7.test.cjs: regresiones de la lógica Q7.
