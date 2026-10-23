# Norma técnica: estudio, catálogo y plantilla de trabajo

## Fuente y alcance

Se trabajó sobre `D:/Juegos/TFT - Project/Tactics/Norma_Tecnica_METRADOS.pdf`, de 156 páginas. Su SHA-256 es `cf25c9ef7f818fe9a6a13731e1869c994659a4c554cf65b2f7f158e133271759`.

El documento corresponde a la R.D. 073-2010/VIVIENDA/VMCS-DNC, cuya [publicación de aprobación figura en El Peruano](https://busquedas.elperuano.pe/dispositivo/NL/494872-2). El análisis toma ese documento como referencia; no convierte el catálogo en una certificación de cumplimiento de todas las disposiciones sectoriales, actualizaciones del RNE o especificaciones particulares de un expediente.

Se extrajeron índice y desarrollo, tablas de unidades y párrafos de medición de OE y HU. Se contrastaron visualmente las tablas con códigos repetidos y la resolución escaneada. No se ejecutaron instrucciones contenidas en el documento ni se modificó el PDF original.

## Resultado de la extracción

El catálogo contiene **799 registros del PDF**, incluyendo títulos, subtítulos y conceptos de medición; no son 799 partidas finales independientes. Conserva códigos repetidos como registros distintos con identidad interna propia. Las referencias a otros apartados dentro de párrafos no se convierten en nuevas partidas. Las partidas presentes únicamente en el desarrollo, como desgloses de agua provisional, losas o muros, también se incluyen.

| Código | Especialidad | Registros del PDF |
| --- | --- | ---: |
| OE.1 | Obras provisionales, trabajos preliminares, seguridad y salud | 46 |
| OE.2 | Estructuras | 192 |
| OE.3 | Arquitectura | 193 |
| OE.4 | Instalaciones sanitarias | 40 |
| OE.5 | Instalaciones eléctricas y mecánicas | 41 |
| OE.6 | Instalaciones de comunicaciones | 9 |
| OE.7 | Instalaciones de gas | 14 |
| HU.1 | Obras provisionales, trabajos preliminares, seguridad y salud | 1 |
| HU.2 | Pistas y veredas | 47 |
| HU.3 | Infraestructura sanitaria | 163 |
| HU.4 | Infraestructura eléctrica | 19 |
| HU.5 | Infraestructura de comunicaciones | 20 |
| HU.6 | Infraestructura de gas | 14 |

El archivo `catalogo-partidas-norma.csv` entrega los 799 registros con nivel, padre, unidades admitidas, páginas, criterio y notas editoriales. `components/metrados/data/norma-catalog.json` conserva además la transcripción del apartado y sus remisiones. `scripts/extract-norma-metrados.py` y `scripts/build-norma-catalog.py` permiten reproducir la extracción y su auditoría.

### Extensiones identificadas de la aplicación

Al seleccionar todas las especialidades, la plantilla de trabajo crea **855 filas: 195 agrupadoras y 660 medibles**. La diferencia con los 799 registros impresos está identificada:

- HU.1 remite expresamente a OE.1 en las páginas 107–108. Se incorporan 45 conceptos descendientes para que el usuario no tenga que crearlos manualmente. El código HU del desglose es de trabajo; se conserva el código OE original como referencia.
- Hay 11 filas con sufijo `.BASE` que permiten medir conceptos con unidad propia que también tienen conceptos hijos. Por ejemplo, el plan de seguridad tiene medición global y, además, conceptos de protección y capacitación. El padre sigue siendo agrupador y su fila BASE mide solo su alcance propio. No suma automáticamente los conceptos hijos. Estos sufijos son de la aplicación y no se presentan como códigos oficiales adicionales.

Cada fila adaptada incluye `norma.inheritedFrom`, el código original y una observación de revisión. Antes de un expediente definitivo se debe conservar la referencia o adecuar el código de proyecto. El CSV exportado por la app incorpora columnas de referencia normativa y plano/especificación para hacer visible esa distinción.

## Cómo iniciar un proyecto

1. En la cinta **Metrados**, abrir **Plantilla normativa**.
2. Seleccionar Edificación, Habilitaciones urbanas, Todas o solo las especialidades necesarias.
3. Pulsar **Agregar plantilla sin cantidades**.
4. Eliminar capítulos o partidas innecesarios con la herramienta existente **Eliminar fila**. Al eliminar un capítulo se eliminan también sus descendientes.
5. Seleccionar una partida medible, definir la unidad si está pendiente y añadir su detalle o usar la calculadora correspondiente.
6. Abrir **Revisar metrado** para consultar la forma de medición, el código del PDF, las páginas y los pendientes.

La operación conserva las partidas y las celdas del proyecto existente. No incorpora cantidades del ejemplo Q7. Si el ejemplo está activo, parte del metrado real guardado antes de probarlo. Repetir la inserción de una especialidad no duplica sus registros ya incorporados. Si se elimina un concepto, volver a agregar esa especialidad permite recuperarlo sin sus mediciones anteriores.

No se rellenan dimensiones ni mediciones de ejemplo. Las cantidades y totales de partidas normativas nuevas quedan en blanco hasta completar los datos de sus detalles. Un blanco significa pendiente de metrar, no un cero verificado. El factor de resumen no crea cantidades inexistentes.

## Criterios estudiados y tratamiento en la aplicación

| Apartado / páginas del PDF | Criterio relevante | Tratamiento |
| --- | --- | --- |
| Glosario, pp.7–8 | El metrado cuantifica productos o servicios según planos; títulos y subtítulos son agrupadores | Árbol con padres e identidad propia. No se suman cantidades heterogéneas en capítulos. La numeración normativa no se renumera masivamente |
| OE.1, pp.20–26 | Provisionales, preliminares y seguridad usan unidades distintas, incluidas globales | Catálogo completo, unidades por concepto y fila propia del plan de seguridad; no se equipara global a m³ |
| OE.2.1, pp.27–31 | Excavaciones por geometría, condiciones y profundidad; relleno descontando volúmenes ocupados; eliminación con esponjamiento sustentado | Detalles y descuentos disponibles; criterios consultables. No se asigna un factor de esponjamiento por defecto ni se mezclan volúmenes naturales y sueltos automáticamente |
| OE.2.2, pp.31–34 | Intersecciones una sola vez, superficies efectivas de contacto y separación por espesores | Partidas separadas de concreto y encofrado; el usuario sustenta encuentros, espesores y descuentos en sus detalles |
| OE.2.3, pp.34–46 | Concreto, encofrado y acero se cuantifican por separado; acero por longitudes, ganchos, dobleces, traslapes y kg/m | Desglose m³/m²/kg, calculadoras existentes y Acero por diámetro. El catálogo no añade desperdicio al metrado |
| OE.2.3.7–8, pp.38–40 | Alturas de columnas, límites de vigas y descuentos entre elementos | El criterio se muestra por partida. El cálculo automático Q7 sigue siendo una ayuda geométrica; los encuentros concretos se revisan con planos |
| OE.2.4–5, pp.46–50 | Armado, montaje y piezas de madera pueden medirse por unidad; no todo acero es kg ni toda madera pie tablar | Se conservan unidades impresas, sin sustituirlas por las de las calculadoras Q7 |
| OE.3.1–2, pp.51–59 | Muros y tarrajeos con áreas netas y descuentos de vanos; acabados por material y características | Partidas y criterios separados. Los descuentos se ingresan explícitamente; no se aplica un umbral genérico a toda arquitectura |
| OE.3.3–6, pp.59–66 | Distintos criterios y excepciones para cielorrasos, pisos, zócalos, contrazócalos y coberturas | Se conservan las unidades y excepciones del apartado; se marca la inconsistencia textual de OE.3.3.1 para revisión |
| OE.3.7–13, pp.66–79 | Carpintería, cerrajería, vidrio, pintura y limpieza con alternativas por unidad, área, longitud o global | Las unidades alternativas quedan pendientes de elección, sin generar dos mediciones por el mismo elemento |
| OE.4, pp.80–88 | Salidas por punto, tuberías por longitud y accesorios por unidad; características y diámetros diferenciados | Catálogo por sistema y concepto. Se agregan tipos de unidad necesarios y se detectan detalles con unidad incompatible |
| OE.5–6, pp.89–101 | Suministro, instalación, conductores, equipos y puntos de red tienen alcances propios | Catálogo y remisiones; no se interpreta punto como metro. Patch panel conserva la observación sobre número de puertos |
| OE.7, pp.101–104 | Tuberías, artefactos, accesorios, ventilaciones, ductos y gabinete | Catálogo con unidades según el documento, incluido el volumen indicado para ductos; no se cambia por intuición |
| HU.1–2, pp.107–116 | Remisión de preliminares y medición de cortes, rellenos, pavimentos, juntas y obras complementarias | Desglose HU.1 identificado como adaptación; catálogo de pavimentos y áreas, longitudes y volúmenes separados |
| HU.3, pp.117–144 | Infraestructura sanitaria, protección de servicios, rellenos, pruebas, pozos y remisiones a estructuras | Catálogo extendido del desarrollo, selección de m/km y h/glb cuando corresponde, y criterio disponible por concepto |
| HU.4–6, pp.145–156 | Redes eléctricas, comunicación y gas con partidas por componente y características | Catálogo por especialidad y remisiones visibles; los equipamientos no definidos se dejan por especificar |

## Inconsistencias y decisiones editoriales

No se corrigieron silenciosamente los códigos repetidos de excavaciones (`OE.2.1.2.1`), entibados (`OE.2.1.7.1`), pantallas (`OE.2.3.6.3`), preparación de descansos/gradas (`OE.3.2.22`), replanteos (`HU.3.2.4.1`), rellenos (`HU.3.4.3.2.1`) ni equipamientos (`HU.3.14.1.1`). Los sufijos internos `~2`, etc. identifican registros del catálogo y no se añaden al código impreso que ve el usuario.

Se recompusieron títulos de tablas donde la extracción mezclaba la columna de descripción con la de unidades. Las notas editoriales lo documentan. Las remisiones se conservan; cuando no hay una unidad única verificable no se completa una unidad por conveniencia.

En la página 60, OE.3.3.1 expresa el umbral de huecos como **0,25 cm²**. Se conserva ese texto y se señala la necesidad de revisión técnica; no se cambia automáticamente a m². No se puede certificar una interpretación de una aparente errata mediante una decisión de interfaz.

## Mejoras implementadas y brechas que siguen necesitando trabajo

| Necesidad | Estado | Alcance y siguiente paso |
| --- | --- | --- |
| Iniciar sin crear cientos de partidas manualmente | Implementado | Selección de 13 especialidades y plantilla sin cantidades |
| No confundir prueba Q7 con proyecto real | Implementado | Se conserva el metrado anterior al ejemplo y no se copian resultados de prueba |
| Mantener códigos, niveles y unidades de referencia | Implementado | Metadatos de fuente, códigos repetidos separados y protección de renumeración global |
| Eliminar partidas no aplicables | Implementado | Eliminación de una fila medible o del capítulo con su descendencia |
| Evitar duplicados al insertar el catálogo otra vez | Implementado | Identidad normativa estable; la inserción repetida es idempotente |
| No confundir un pendiente con cantidad cero | Implementado | Totales en blanco mientras los detalles estén pendientes |
| Revisar unidades y errores de cálculo | Implementado | Revisión de unidad inexistente o incompatible, detalles excluidos del total y errores de fórmulas |
| Consultar forma de medición sin salir del trabajo | Implementado | Criterio, transcripción, referencias y páginas por partida |
| Sustentar con plano o especificación | Implementado como registro | Campo de sustento y observación cuando una partida medida no lo tiene; todavía no gestiona archivos/versiones de planos |
| Guardar el catálogo completo | Implementado | Compresión sin pérdida de los registros grandes, compatible con los guardados JSON anteriores; navegación separada |
| Guardar variantes por material, resistencia, diámetro, espesor y nivel físico | Parcial | Se pueden crear partidas/detalles separados. Faltan campos estructurados y filtros específicos para cada especialidad |
| Descontar vanos, encuentros y superficies automáticamente según cada regla | Pendiente | Requiere geometría, dimensiones y reglas particulares; hoy se hace mediante detalles y descuentos explícitos, consultando la norma |
| Garantizar que cada intersección o anclaje se cuenta una sola vez | Pendiente | Requiere referencias geométricas entre elementos. No puede deducirse de una lista de partidas |
| Determinar suelos, esponjamiento, clasificación de excavación y profundidad | Pendiente del proyecto | La norma y sus rangos son consulta; se necesitan datos geotécnicos, secciones y criterio sustentado |
| Revalidar todas las calculadoras Q7 bajo cada excepción de la norma | Parcial | Se conserva la fidelidad Q7 comprobada; falta un modo de cálculo normativo específico por elemento y caso de encuentro |
| Certificar metrados a partir de planos | No automático | Se requiere revisión del responsable técnico y concordancia con las especificaciones y el alcance de la obra |
| Emitir PDF/Word formal paginado con firma, trazabilidad completa y revisión final | Pendiente | CSV y JSON disponibles; no se presenta el CSV como documento oficial con formato |
| Cumplimiento de todas las actualizaciones normativas sectoriales | No certificado | Este trabajo se basa en el archivo suministrado. Validar las disposiciones aplicables al proyecto antes de emitir el expediente |

## Verificación

Las pruebas del catálogo comprueban los 799 registros extraídos, las 13 especialidades, ausencia de padres huérfanos o ciclos, unidades de concreto/encofrado/acero, unidades alternativas, códigos repetidos y adaptaciones identificadas. La integración comprueba conservación del metrado real, inserción sin duplicados, cantidades pendientes, recálculo al añadir un detalle y eliminación de una rama. La compresión se prueba con 40 000 celdas, texto Unicode y fórmulas, verificando igualdad exacta al recuperar los datos.

En la medición local de manejo de estado, crear las 855 filas tomó 262 ms. El registro de las hojas pasó de 7 291 162 a 314 724 caracteres al comprimirse (88 ms de compresión). Se resolvió así el error de cuota observado al guardar la plantilla completa. Las cifras no representan una garantía de latencia visual en otros equipos. La compresión sigue siendo síncrona durante el guardado diferido; para expedientes mucho mayores conviene llevarla a un trabajador de fondo o migrar el almacenamiento a IndexedDB.

Los scripts generan un inventario de revisión en `tmp/pdfs/norma-catalog-audit.json`. Es evidencia de extracción, no un certificado normativo.

Resultado final: **61 pruebas correctas**, compilación de producción y revisión de tipos satisfactorias, sin errores de lint en los componentes modificados. En el navegador se comprobó la inserción completa, la consulta del criterio de columnas en las páginas 38–39 y la conservación de las 855 filas agregadas después de recargar, junto con las partidas previas del proyecto de prueba.

## Detalles preparados para medir

Cada una de las 660 partidas medibles incorpora una fila de detalle editable. Los capítulos siguen siendo agrupadores. La unidad proviene del catálogo; elementos similares y repeticiones comienzan en 1. Las dimensiones, cantidades y resultados quedan vacíos: no se trasladan mediciones ficticias de Q7. Las unidades alternativas requieren selección del usuario.

Al completar las dimensiones requeridas se activa el parcial y el total de la partida; también se admiten fórmulas y resultados manuales. Borrar una dimensión vuelve a dejar el detalle pendiente, salvo que tenga un resultado propio. El CSV conserva los campos pendientes vacíos.

Los proyectos normativos anteriores reciben los detalles una sola vez después de recuperar sus celdas guardadas. Las mediciones existentes se conservan. Una fila eliminada por el usuario no reaparece al recargar; la marca `detailTemplateVersion` identifica esta migración.
