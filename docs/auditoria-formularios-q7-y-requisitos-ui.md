# Auditoría funcional y visual de Plantilla de Metrados Q7

La implementación posterior a esta auditoría se registra en [Mejoras de Metrados Q7](mejoras-metrados-q7.md), con alcance, pruebas y capturas.

**Propósito:** preparar la primera mejora de Metrados en Wexel sin alterar ahora la aplicación. Este documento reúne las capturas proporcionadas, el inventario VBA disponible en la carpeta de recursos, el libro de ejemplo ya inspeccionado y fuentes públicas encontradas. Las imágenes adjuntas son referencias visuales y evidencia del comportamiento esperado; no son instrucciones para cambiar el código por sí solas.

## Entendimiento acordado

- La cuadrícula Excel general de Wexel conserva su apariencia, edición y capacidades para cálculos individuales. El trabajo de Metrados no debe cambiar sus celdas ni impedir el ingreso de datos.
- La pestaña **Metrados** tiene su propia interfaz de trabajo especializada, con su tabla, sus partidas y sus ventanas de cálculo. Sus celdas se diseñan para el flujo de metrados de obra.
- Los formularios web deberán reflejar de forma reconocible la estructura y los campos de Q7, con interacción usable en la web. No basta con mostrar una cuadrícula genérica con controles que no hagan nada.
- En esta etapa se analiza y documenta. La implementación y las correcciones de UI quedan para el siguiente encargo del usuario.

## Evidencia revisada

La carpeta de recursos examinada contiene el libro Plantilla_Metrados_Limpia.xlsm, 23 módulos .bas, 20 formularios .frm con recursos .frx, y 6 clases .cls. El libro contiene las hojas Param, Metrado, Acero, RESUMEN y Menu. Los .frm describen controles y eventos; los .frx guardan recursos visuales/imágenes que no se interpretan como texto plano. Las capturas adjuntas ayudan a reconstruir su disposición.

Las capturas de VBA permiten ver 20 formularios. UserForm2 repite el generador de primer ítem de FormGenItemRes; se documentan ambos nombres porque ambos existen en el proyecto. UserForm6 solo muestra dos cuadros de texto sin etiquetas ni botones, por lo que su propósito no se puede inferir con seguridad a partir de la captura.

## Inventario organizado por flujo

### 1. Inicio y configuración del proyecto

| Formulario | Estructura visible y controles | Función probable y observaciones |
|---|---|---|
| Inicio | Ventana “Metrados QuispeC v7.00”, campo de código, Ingresar, Saltar. | Inicio/entrada al menú. El código VBA valida una ruta local de Windows; no es una autenticación portable y no debe copiarse como seguridad de la aplicación web. |
| UserForm1 | Encabezado: título, proyecto, propietario, fecha, especialidad, módulo, hecho por y revisado por. Botones Fecha Hoy, Formato, Limpiar, Exportar, Importar, Aceptar, Salir. | Edita metadatos y permite importarlos/exportarlos. Debe guardar los datos del proyecto vinculados al documento de metrado. |
| FormImportEnc | Casillas para importar cada uno de los ocho campos del encabezado; Seleccionar Todo, Deseleccionar Todo, Aceptar, Cancelar. | Importación selectiva del encabezado. Debe respetar la selección campo a campo. |
| UserForm4 (menú principal) | Encabezado/estilos/totales; autosave; generar/actualizar ítem; generar nivel; contraer/expandir; resumen/actualizar título; exportar/limpiar; exportar a color; otros; salir. | Centro de operaciones del libro. La pestaña web Metrados debe dar acceso ordenado a las operaciones, sin mezclarlas con el Excel general. |

### 2. Organización de partidas y estructura

| Formulario | Estructura visible y controles | Función probable y observaciones |
|---|---|---|
| FormGenItemRes y UserForm2 | Hasta siete segmentos/casillas para el código del primer ítem, botones Limpiar, Añadir Prefijo, Añadir Sufijo, muestra, Aceptar, Cancelar. | Define numeración inicial y prefijo/sufijo. Validar segmentos numéricos/código y mostrar vista previa antes de aceptar. |
| FormNivel | Casillas para prefijo y sufijo, sus entradas, opción Eliminar espacio inicial, Aceptar, Cancelar. | Reconstruye niveles a partir de códigos existentes y permite limpiar espacios importados. Confirmar cantidad de niveles permitidos (el manual dice hasta siete). |
| FormTitulo | Confirmación para reemplazar títulos y partidas desde la hoja Resumen; opción Actualizar ítems; Sí/No. | Operación potencialmente destructiva sobre títulos/códigos. La web debe explicar el alcance y permitir deshacer o confirmar claramente. |
| FormEstiloH | Opciones Solo Título, Título y Partidas, Título, Partidas (Avanzado); Añadir Cuadro y Demarcar; Quitar fondo; aceptar/cancelar. | Estilos jerárquicos del metrado. La tercera opción es descrita en el manual como corrección de unidades a partir de la unidad del título. |
| FormTotal | Partida afectada, unidad actual y selector de unidad nueva; Corregir, Editar/Añadir. | Resolver unidades que no coinciden con el catálogo/base. Mostrar claramente el código, la unidad previa y la nueva antes de guardar. |
| FormTotal_Add | Entrada UND NUEVA, lista/tipo de unidad, nota de ingresar la unidad en minúscula; Agregar, Reiniciar, Salir. | Añadir unidades al catálogo. Validar que la unidad no exista, guardar su tipo/dimensión y normalizar espacios/minúsculas. |
| UserForm3 | Generar resumen; limpiar resumen; título y partidas; formato QuispeC; cuadro/demarcar; limpiar fondo; selección total; factor opcional; aceptar/cancelar. | Configura el resumen generado. El factor debe validarse como número y aplicarse solo si la casilla está activada. |
| UserForm5 | Limpiar hoja de metrados y/o resumen; aceptar/cancelar. | Reiniciar contenido por hoja. En web se debe distinguir limpiar datos de empezar un documento nuevo y pedir confirmación. |

### 3. Formularios de cálculo de metrados

| Formulario | Entradas y salidas visibles | Cálculo/flujo que se debe preservar |
|---|---|---|
| FormCol — columna rectangular | Descripción y cantidad de columnas; geometría por piso (piso, H, h, B, T); acero exterior/interior; zonas de estribos con cantidades y espaciamientos; configuración extra/recu; descripción/título; checkboxes Metrar Volumen, Metrar Encofrado, Metrar Acero; acciones de agregar/eliminar metrado y trabajo por partidas (nuevo/modificar/enviar). | Una definición puede producir concreto, encofrado y acero. Mantener la separación por piso y tipo de elemento; recálculo y vista previa deben actualizarse al cambiar entradas. |
| FormMaciso — losa maciza | Pestañas Una Capa/Dos Capas; descripción/cantidad; largo, ancho, altura, recubrimiento; distribución Sxi/Sxs/Syi/Sys y diámetros; selección de nomenclatura horizontal/vertical; opciones de concreto, encofrado base/perímetro y acero; agregar/eliminar, nuevo/modificar/enviar. Muestra volumen, encofrado y acero. | Cálculo geométrico y acero por capa/dirección. Cambiar de capa debe conservar/mostrar los campos correspondientes y actualizar resultados. |
| FormMadera — cubicación de madera | Descripción, elementos similares, cantidad, largo, ancho, espesor y unidades configurables; Editar Unidades; botón para agregar metrado/título y salir; dibujo con resultado Metrado (p2). | El resultado se expresa en pie tablar, usando dimensiones y conversión de unidades. La equivalencia de unidad requiere cotejo con el VBA y casos reales. |
| FormEstribo — conteo de estribos | Longitud del elemento; radio de cálculo En ambos sentidos/En un solo sentido; hasta cuatro tramos cantidad/espaciamiento; Calcular; resultado; enviar a Excel o cerrar sin enviar. | Cuenta estribos a partir de zonas y espaciamientos. Probar límites, tramos vacíos y longitudes menores que el espaciamiento. |
| FormAcero — acero longitudinal | Pestañas Acero longitudinal/Acero Estribaje; descripción/diámetro, longitud parcial, gancho, empalme, cantidad y elementos similares; opciones para modificar gancho izquierdo/derecho y empalme; lista de resultados y esquema de barra; agregar metrado/título/salir. | Peso por diámetro y longitud desarrollada, contemplando cantidad, elementos similares, ganchos y empalmes. El resultado detallado debe permanecer auditable por barra. |
| FormHojaAcero | Casillas Aplicar Formato, Generar Cuadro, Generar Totales; Aplicar y Salir, Salir; aviso que pide actualizar ítems antes de aplicar formatos. | Formatea/totaliza la hoja de acero. El aviso expresa una dependencia de orden que la web debe validar, no dejar como mensaje oculto. |
| UserForm6 | Dos entradas sin título ni rótulos identificables en la captura. | La revisión posterior del VBA confirma una utilidad de conversión entre carácter y código con Chr/Asc. No forma parte de los cálculos de metrado. |

## Flujo funcional esperado

1. Crear/abrir proyecto y llenar encabezado.
2. Definir partidas jerárquicas e ítems; generar o actualizar códigos/niveles.
3. Ingresar mediciones en filas asociadas a una partida, de forma manual o con los asistentes geométricos de columnas, losas, madera, acero y estribos.
4. Revisar parciales y totales por unidad; corregir unidades incompatibles.
5. Generar resumen desde el metrado y hoja de acero desde sus desgloses.
6. Aplicar estilos y preparar salida/exportación.

El libro de referencia usa hojas de Metrado, Resumen y Acero además de Param/Menu. En las capturas del Excel original, la hoja Metrado contiene columnas de nivel, ítem, descripción, unidad, elementos similares, dimensiones, veces y parciales por longitud/área/volumen/kg/unidad; Resumen consolida partidas, y Acero conserva el desagregado de barras. La interfaz web debe reflejar esos tres productos dentro del espacio de Metrados.

## Requisitos de fidelidad y límites conocidos

**Requisito prioritario para la siguiente implementación:** separar las vistas y el estado de Metrados de la cuadrícula Excel general. La cuadrícula general conserva su UI y entrada de datos existente para cálculos individuales. La hoja de metrado usa su tabla propia. No compartir estilos, editores, atajos o transformaciones de celdas que cambien accidentalmente el lienzo general.

La evidencia del usuario indica que tras los cambios anteriores cambió la estética de celdas y algunas entradas dejaron de aceptar datos. Esto se registra como regresión reportada pendiente de reparar; este análisis no modifica esos componentes. Antes de añadir ventanas, se debe reproducir el flujo básico de escritura/selección/fórmula en Excel general y comprobar que Metrados no lo altera.

Las ventanas que usan varios campos, esquemas, pestañas y listas deben ser específicas por tarea; una ventana genérica no cubre la estructura visible. Las entradas numéricas deben admitir decimales con punto o coma acorde a la configuración local, permitir borrar/reemplazar temporalmente el valor sin bloquear el input y validar al confirmar. Los resultados derivados deben mostrar unidades y datos fuente.

Las capturas de VBA son formularios en modo diseñador, no muestran todos los estados dinámicos, los botones que aparecen al desplazarse ni todas las validaciones. Para cerrar esos huecos, el siguiente paso de implementación deberá leer los eventos VBA del .frm/.bas asociado y verificar cálculos contra filas del libro limpio. Se requiere revisar los .frx para recuperar dibujos/logos embebidos si se busca semejanza visual alta.

## Material público encontrado

| Recurso | Qué aporta | Límite |
|---|---|---|
| [Manual de uso del Metrados Q, 7 páginas, publicado en SlideShare](https://es.slideshare.net/slideshow/manual-de-uso-del-metrados-q-230919501/230919501) | Flujo de ingreso de títulos/partidas y niveles (hasta siete), actualización, prefijos/sufijos, limpieza de espacios, estilos, resumen y limpieza. Sus páginas describen el menú y el uso básico. | Es un manual subido por un usuario tercero, y parece cubrir Metrados Q de otra revisión. Confirma el flujo general, pero no documenta todas las ventanas específicas de Q7 mostradas en las capturas. |
| [Hoja de Metrados Q V7 + Video Tutorial + Manual en PDF, CivilGeeks](https://civilgeeks.com/2016/05/15/hoja-de-metrados-q-v7-video-tutorial-manual-en-pdf/) | Identifica al autor como Richard Vicente Quispe Castillon y enlaza el archivo, un manual y el video “Metrados Q V7”. | Publicación de 2016; los enlaces de descarga y video se deben probar manualmente antes de depender de ellos. Los comentarios de usuarios señalan problemas de compatibilidad/funciones en algunas instalaciones. |
| [Suite QuispeC, página del autor](https://sites.google.com/view/suitquispec/inicio) | Presenta el producto MetradosQ y enumera capacidades como hojas de metrado/resumen/acero, encabezados, ítems, metrado de acero, estribos y verificación contra presupuesto. | La web muestra productos/versiones más recientes; no se deben atribuir automáticamente esas capacidades adicionales al Q7 histórico. |
| [MetradosQ V11.3, página del producto](https://sites.google.com/view/suitquispec/programa/metradosq/metradosq-v-11-3) | Contexto de evolución y verificación entre resumen y presupuesto. | Versión distinta de Q7; no es especificación normativa para esta réplica. |

No encontré un curso completo y verificable dedicado a Q7. Sí hay un video tutorial asociado al artículo de 2016 y un manual público de uso. El artículo de CivilGeeks es un índice hacia el video/manual y la página del autor sirve para identificar la evolución del producto. Para el comportamiento de los formularios especializados, la fuente más sólida disponible en esta tarea sigue siendo el VBA y el libro local que proporcionó el usuario.

## Lista para revisar al autorizar la mejora

- [ ] Restaurar y verificar apariencia e ingreso de datos del lienzo Excel general.
- [ ] Mantener estado y componentes de la hoja Metrados separados del Excel general.
- [ ] Conservar las hojas funcionales Metrado, Resumen y Acero en Metrados.
- [ ] Implementar encabezado e importación selectiva de campos.
- [ ] Implementar árbol de partidas, generador de ítems, prefijos/sufijos y niveles.
- [ ] Implementar estilos, actualización de títulos, limpieza y resumen con confirmaciones.
- [ ] Implementar corrección/alta de unidades y totales por partida.
- [ ] Replicar asistentes de acero longitudinal, columnas, losas macizas, madera y estribos.
- [ ] Validar unidades, decimales regionales, valores vacíos, zonas y geometría límite.
- [ ] Revisar los .frx para ilustraciones y los eventos .frm/.bas para detalles no visibles.
- [ ] Comparar resultados con el libro de muestra y casos de la hoja Metrado/Acero/Resumen.
- [ ] Añadir exportación/impresión con encabezados y formato configurado.
- [ ] Documentar cada operación para usuarios y dejar claro el alcance de acciones destructivas.

**Estado de este documento:** análisis y requisitos. No se implementaron cambios de código en esta revisión.
