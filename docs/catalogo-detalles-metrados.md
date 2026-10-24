# Opciones de detalle dentro del lienzo

## Uso

### Home sobre el lienzo actual

La pestaña **Home** muestra las herramientas comunes sobre la hoja o documento que estás usando. Conserva el libro, hoja, selección y vista Excel/Word/dividida; volver a Metrados conserva ese contexto. El botón de la casita superior **Abrir lienzo en blanco** permite abrir el libro independiente en blanco sin borrar el metrado. Las demás secciones mantienen sus propios libros.

Selecciona una celda, abre Home y aplica subrayado, centrado, color u otro formato disponible. Los cambios se guardan en las celdas nativas y se conservan al recalcular. El subrayado, la cursiva, el tachado, el color y la alineación también pasan a la vista de impresión y al archivo Word. En el editor Word habitual, Home actúa sobre la selección de texto. La vista previa generada de metrados es de consulta: sus herramientas de edición están deshabilitadas para evitar cambiar el documento Word que está detrás; el formato se aplica en las celdas originales.

### Filas separadoras

En la cinta **Metrados**, el icono secundario **Línea en blanco** inserta una fila debajo del detalle seleccionado. Si seleccionas el título de una partida, se inserta antes de sus detalles. Puedes dejarla vacía para separar grupos o escribir «Zapatas», «Vigas de cimentación» u otro rótulo en Descripción y aplicar el formato de texto habitual desde Home. No contiene unidad, cantidades, fórmulas ni celdas de entrada sombreadas y no interviene en los totales, factores, numeración ni resumen. Se conserva en los respaldos y la vista para imprimir; se elimina con **Eliminar fila**. Está disponible en la hoja de edición **Metrado**.

Selecciona la celda de **Descripción de un detalle**. Aparecen opciones relacionadas con su partida, una explicación breve y un buscador. La flecha del extremo derecho permite volver a abrirlas. Puedes cerrar con Escape o escribir directamente en la celda para usar texto libre. El menú no aparece en los títulos, los totales, las dimensiones ni las hojas en blanco.

Las opciones sustituyen el formulario anterior «Adaptar partida». Las adaptaciones previamente guardadas se conservan como datos históricos; no se eliminan ni se modifican al actualizar la aplicación.

## Criterio del catálogo

Revisión del catálogo local completo de 13 especialidades, actualizada el **24 de octubre de 2026**: **660 partidas medibles**, **84 familias** y **4.244 opciones contextualizadas** después de eliminar etiquetas repetidas dentro de cada menú. La cifra cuenta la oferta por partida: una misma familia se reutiliza en varias partidas; no son 4.244 tipos normativos distintos ni una lista exhaustiva de soluciones constructivas. Solo tres apartados deliberadamente abiertos mantienen identificadores generales: **OE.4.7 Varios**, **HU.3.1 Obras provisionales** y **HU.4.1 Obras preliminares**. Sus soluciones y unidades deben definirse con el expediente. Siempre hay texto libre.

### Ampliación de ejemplos de obra

| Área | Ejemplos disponibles |
|---|---|
| Seguridad y salud | PSST integral, elaboración, implementación, IPERC, procedimientos, permisos, inspecciones, registros; EPP por tipo; protección colectiva, señalización, capacitación y respuesta a emergencias. |
| Obras provisionales y terreno | Oficinas, almacenes de materiales y EPP, guardianía, comedor, servicios, movilización por equipo, excavaciones por elemento, rellenos y retiros por tramo. |
| Estructuras | Identificadores de zapatas, columnas, vigas y losas; componentes de losas, armado metálico, madera, prefabricados, cimentaciones especiales y juntas. |
| Arquitectura | Carpinterías, herrajes, muebles, divisiones, barandas, pasamanos, vidrios, acabados, cubiertas, pisos y áreas verdes. |
| Instalaciones | Aparatos y puntos sanitarios, accesorios y redes; circuitos y tableros, luminarias, puesta a tierra; comunicaciones, gas, sistemas especiales y equipos. |
| Obras urbanas | Cruces, acometidas, cámaras, conjuntos hidráulicos, pozos, soportes, accesos provisionales, pavimentos y servicios temporales. |

Las opciones nuevas son etiquetas y ayudas: no crean filas, no agregan insumos al APU y no rellenan dimensiones, cantidades, capacidades o dosis. Al elegir una opción de la misma unidad solo cambia la descripción. La búsqueda incluye la etiqueta y su explicación y funciona sin exigir tildes. El catálogo se consulta para la descripción activa, sin añadir trabajo a cada celda del lienzo.

### Seguridad: equipos y paquetes globales

La referencia **OE.1.2.1.1** expresa los EPI/EPP en **und**; el PSST, la protección colectiva, la señalización, la capacitación y los recursos de emergencia tienen alcances globales en sus apartados. La imagen de ejemplo que muestra EPP en glb no sustituye este criterio del catálogo. Una adaptación del proyecto debe estar sustentada; la ampliación del menú no cambia ninguna unidad guardada.

El menú de EPP ofrece casco, gafas, escudo facial, guantes, calzado, protección auditiva y respiratoria, arnés, ropa, chaleco, EPP eléctrico y reposiciones. El tipo, compatibilidad y dotación se determinan mediante la evaluación de riesgos y el PSST. No se fija una protección universal para todas las tareas. El arnés personal no se clasifica como protección colectiva.

Para **glb**, el menú muestra una ayuda permanente: los ejemplos pueden describir el paquete o recursos incluidos, pero no convierten cada casco, cartel o sesión en un global adicional. Un paquete y sus componentes no deben contarse dos veces. El usuario debe definir el alcance y sustentar el costo con su APU; elegir un texto no determina el número de globales.

Los tipos funcionales de oficinas solicitados por el usuario —residencia/dirección, supervisión/inspección, administración/control y reuniones/coordinación— se complementan con oficina técnica. El catálogo también contempla almacenes, guardianía, comedores, vestuarios, sanitarios, cercos, señalización, servicios provisionales, seguridad, movimiento de tierras, estructuras, acabados, redes sanitarias, electricidad, comunicaciones, gas, equipos y trabajos urbanos. Las dimensiones, diámetros, resistencias, potencias, marcas, dotaciones y cantidades deben venir del diseño del proyecto. Elegir una sugerencia no constituye una aprobación normativa.

Los identificadores y alternativas son una **síntesis de uso de la aplicación** a partir de las fuentes y del contexto de la partida, no una transcripción ni una lista universal o exhaustiva de todos los sistemas constructivos posibles. Las condiciones contractuales y especificaciones particulares siguen determinando la unidad y el alcance.

## Fuentes y alcance de la revisión

1. **Norma Técnica de Metrados adjunta**, transcrita previamente en `components/metrados/data/norma-catalog.json`: códigos, jerarquía, unidades y contexto de cada partida. [Resolución de aprobación, El Peruano](https://busquedas.elperuano.pe/dispositivo/NL/494872-2).
2. **G.050, Seguridad durante la Construcción**, numeral de servicios de bienestar: instalaciones sanitarias, posibilidades móviles y portátiles, comedores y vestuarios. No se derivan cantidades automáticas de trabajadores. [Documento oficial MVCS](https://cdn.www.gob.pe/uploads/document/file/2365155/05%20G.050%20SEGURIDAD%20DURANTE%20LA%20CONSTRUCCI%C3%93N%20DS%20N%C2%B0%20010-2009.pdf?v=1636045000). La consulta del PDF completo devolvió una restricción del servidor; se contrastaron los extractos indexados oficiales.
3. **Expediente Parque 7 de Junio, Municipalidad de Miraflores**: evidencia de instalaciones provisionales mediante módulos alquilados. Se utiliza como ejemplo de solución, sin adoptar sus dimensiones como valores por defecto. [Especificaciones del expediente](https://www.miraflores.gob.pe/wp-content/uploads/convocatorias/adjudicacion-020-2019/Parque%207%20de%20junio%20-%20expediente/Folios-001-a-072.pdf).
4. **FONDEPES, expediente valorizado**: evidencia de alquiler de baños químicos medido en mes, con instalación y operación. La aplicación distingue el paquete global del baño-mes como criterio explícito de proyecto. [Documento FONDEPES](https://intranet2.fondepes.gob.pe/DOCUMENTO/OSIS/Arc/Transparencia/1882_2158_1639588691.pdf). El archivo supera el límite de lectura web; se usó el cuadro indexado, no se auditó todo el expediente.
5. **MINEDU, especificaciones sanitarias**: familias de agua, desagüe, ventilación y drenaje. Sirve de contraste para identificar tramos, derivaciones, accesorios y puntos. [Documento oficial](https://www.minedu.gob.pe/DeInteres/pdf/procedimiento-de-homologacion-de-bienes-servicios.pdf). Consulta por extractos indexados debido al tamaño del archivo.
6. **MINEDU, Bases Pumamarca**: alcance de planos eléctricos de alimentadores, circuitos, alumbrado, tomacorrientes y equipos. [Bases oficiales](https://www.minedu.gob.pe/DeInteres/pdf/2022/bases-pumamarca.pdf).
7. **PRONIED, términos de referencia**: contraste de tipos de puntos eléctricos, tableros y sistemas. [TDR oficiales](https://cdn.www.gob.pe/uploads/document/file/4836309/44.TDR%20REQ.%20ME%20730956%20.pdf?v=1689260676).
8. **MTC, EG-2013**: clasificación y organización de trabajos viales, medición y especificaciones particulares. Se toman familias y referencias por tramo/progresiva; no se reemplazan métodos contractuales de medición. [Manual oficial](https://portal.mtc.gob.pe/transportes/caminos/normas_carreteras/MTC%20NORMAS/ARCH_PDF/MAN_10%20EG%202013.pdf).
9. **MINEDU, guía de mantenimiento de infraestructura**: componentes de infraestructura de comunicaciones para identificar nodos, armarios y puntos. [Guía oficial](https://www.minedu.gob.pe/p/pdf/2026/JUNIO/2-anexo-1-gui%CC%81a-general-para%CC%81metros-de-mantenimiento.pdf).
10. **MINEDU, parámetros de mantenimiento**, y **Osinergmin**: componentes de instalaciones de gas —tuberías, conexión, regulación, corte, artefactos, ventilación y evacuación—. Las sugerencias identifican componentes, sin dimensionar instalaciones ni recomendar modificaciones. [Guía MINEDU](https://cdn.www.gob.pe/uploads/document/file/6751183/5854397-anexo-oficio-multiple-n-170-2024.pdf?v=1723137222), [definiciones de Osinergmin](https://www.osinergmin.gob.pe/seccion/centro_documental/PlantillaMarcoLegalBusqueda/Resoluci%C3%B3n%20de%20Consejo%20Directivo%20Osinergmin%20099-2016-OS-CD.pdf).

Consulta: 23 de octubre de 2026. Las fuentes sirven para fundamentar las familias de sugerencias; no se declara que esta investigación cubra todas las modificaciones normativas o valide un expediente.

Ampliación consultada el 24 de octubre de 2026: texto de la [Norma Técnica de Metrados en SPIJ](https://spij.minjus.gob.pe/Graficos/Peru/2011/Mayo/18/RD-073-2010-VIVIENDA-VMCS-DNC.pdf), apartados OE.1.2.1 y siguientes; [G.050 en ONP](https://www.onpsctr.gob.pe/DocumentosComunes/G.050%20Seg.%20durante%20la%20Construcci%C3%B3n.pdf), numerales de EPI y protección colectiva; [especificaciones de estructuras de PRONIED](https://www.pronied.gob.pe/wp-content/uploads/03_ET_ESTRUCTURAS.pdf); [catálogo oficial de especificaciones de Sedapal](https://www.gob.pe/37508-servicio-de-agua-potable-y-alcantarillado-de-lima-especificaciones-tecnicas-y-reglamentos-tecnicos); [resolución del MTC que aprueba EG-2013](https://www.gob.pe/institucion/mtc/normas-legales/4438760-22-2013-mtc-14). Se contrastaron extractos oficiales indexados y los títulos, jerarquías y unidades del catálogo extraído de la norma adjunta. No se certifica una revisión íntegra de cada especificación ni de todas sus modificaciones.

## Unidades y cantidades

Elegir un tipo con la misma unidad solo modifica la descripción. Conserva medidas, expresiones, descuentos y fórmulas.

Si la opción especifica una unidad distinta, el detalle se mueve a una **partida alternativa independiente**, junto a la original, con código de proyecto como `OE.1.1.1.6-A1`. Ese código no se presenta como código impreso en la norma. La referencia original se conserva en `detailVariant` y se muestra en Revisar metrado. Una alternativa existente con el mismo origen, título y unidad se reutiliza; no se mezclan m² y glb.

Las cantidades dimensionales anteriores no se convierten en alquileres: los nuevos operandos quedan pendientes. El detalle guarda su medición previa y ofrece **Restaurar detalle previo y sus medidas** dentro del propio desplegable; la restauración requiere que la partida de origen siga existiendo con la misma unidad. Para **glb**, describe el paquete completo en una sola línea y escribe su cantidad global en la columna G. Para **baño-mes**, escribe baños en F y meses en G. La columna G mantiene el rótulo general del lienzo; la ayuda del menú explica el uso por cantidad. Los totales se calculan con el mismo motor de fórmulas y pasan al resumen, CSV y vista de impresión. No se inventa un total al elegir una opción.

## Mantenimiento y rendimiento

### Baños portátiles y desagüe provisional

Al elegir un baño químico portátil, integral o mensual, se ofrece revisar **Desagüe para la construcción** del mismo capítulo de obras provisionales. La búsqueda usa la referencia normativa y las relaciones padre/hijo; no depende de códigos de proyecto renumerados ni de descripciones editadas.

El aviso pregunta si el proveedor gestiona los residuos y si se puede prescindir del desagüe para otros ambientes. **Quitar desagüe provisional** requiere una decisión explícita: elimina esa partida y sus detalles con el flujo habitual de toast, renumeración y actualización del resumen. Si ya contiene medidas, cantidades o sustento, el aviso lo indica. Elegir el baño por sí solo no elimina datos.

**Mantenerla** conserva la partida y guarda esa decisión para evitar nuevas preguntas por otros baños del mismo capítulo. Cerrar el aviso o pulsar Escape conserva los datos sin registrar una decisión definitiva. La partida siempre puede eliminarse manualmente más adelante.

### Archivos

- `detailChoices.ts`: catálogo por familias, etiquetas y explicaciones. Se pueden ampliar reglas específicas antes de la identificación general.
- `constructionDetailCatalogue.ts`: ampliación centralizada de ejemplos por familia y contexto; añade etiquetas sin tocar unidades ni cantidades. Las reglas específicas del catálogo complementan los identificadores generales.
- `selectDetailChoice.ts`: transformación pura de detalles y separación por unidades.
- `detailChoiceActions.ts`: confirmación de edición pendiente, aplicación y selección de la fila resultante.
- `DetailPicker.tsx`: menú con búsqueda, teclado, Escape y texto libre. Se monta únicamente para la descripción activa; no añade un menú ni suscripciones por cada celda. La selección de una celda no recalcula el libro.
- Pruebas: cobertura de las 660 partidas, opciones principales, conservación de datos con la misma unidad, separación de alternativas y resultados en resumen e impresión.
