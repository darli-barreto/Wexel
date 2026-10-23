# Análisis de migración: Plantilla de Metrados Q7

## Resumen de componentes encontrados

La carpeta de recursos contiene el libro `Plantilla_Metrados_Limpia.xlsm`, 23 módulos `.bas`, 20 formularios `.frm` (con sus recursos gráficos/controles `.frx`) y 6 clases `.cls`. El libro de muestra tiene cinco hojas: `Param`, `Metrado`, `Acero`, `RESUMEN` y `Menu`. Al iniciar la migración, `components/header-tools/NavMetrado.tsx` era un placeholder; la primera integración funcional ahora presenta las vistas Metrado, Resumen y Acero en esa pestaña y mantiene el lienzo Excel original montado.

Los módulos centrales son:

| Área | Fuentes | Comportamiento encontrado |
|---|---|---|
| Estructura y automatización | `Módulo1.bas`, `Módulo2.bas`, `Resumen.bas`, `ActTitulo.bas`, `Nivel.bas` | Numeración jerárquica de partidas con hasta siete niveles, creación/actualización de títulos y resumen, formatos por nivel y detección de filas. |
| Acero | `Acero.bas`, `AceroModo.bas`, `HojaAcero.bas`, parte de `Módulo2.bas`, `FormAcero.frm`, `FormCol.frm`, `FormEstribo.frm` | Peso por diámetro, ganchos, empalmes, acero longitudinal/transversal, estribos y generación de renglones. |
| Geometría / metrados | `Maciso.bas`, `FormMaciso.frm`, `FormMadera.frm` | Volumen, encofrado, cuantía de acero en losas macizas y volumen de madera con conversiones de unidades. |
| Resumen y totales | `GTotal.bas`, `Resumen.bas`, `ActTitulo.bas`, `FormTotal.frm`, `FormGenItemRes.frm` | Agrupación por unidad, subtotales, partidas jerárquicas, ajuste y ordenamiento del resumen. |
| Encabezado e intercambio | `Encabezado.bas`, `Export.bas`, `FormImportEnc.frm`, `UserForm1.frm`, `UserForm4.frm` | Metadatos del proyecto, importación/exportación de encabezado, exportación de libro y configuración de impresión A4. |
| Configuración y presentación | `EstiloCelda.bas`, `Limpiar.bas`, `VerOcult.bas`, `menu.bas`, `Madera.bas` | Formatos de hoja, limpieza, visibilidad, menú VBA y catálogos/parámetros de unidades. |

En `Metrado`, la tabla visible se organiza alrededor de columnas A (nivel), C (código), D (descripción), E (unidad), F (elementos similares), G–I (dimensiones), J (número de veces), K–O (resultados por longitud/área/volumen/peso/unidad) y P (total de partida). En `RESUMEN`, la jerarquía usa A (nivel), C (código), D (descripción), E (unidad), F (elementos similares), G–I (dimensiones), J (veces), K–O (subtotales por unidad de medida) y P (total). Las filas de muestra confirman, por ejemplo, el cálculo de áreas en L, volúmenes en M y sumas de partida en P.

## Propuesta de arquitectura relacional

Propongo PostgreSQL como fuente de verdad, guardando las entradas numéricas y la expresión/metodología aplicada; los resultados son reproducibles y se pueden materializar/cachar. No modelaría cada fila de Excel como una fila de base de datos sin semántica ni conservaría `Param!B23`/`O23` como punteros de fila: esos punteros solo existen para navegación en la hoja heredada.

```text
projects 1 ── n estimate_versions 1 ── n estimate_items
                                           │
                                           ├── n measurement_lines
                                           ├── n steel_takeoffs ── n steel_bars
                                           └── n item_totals (derivado/materializado)
projects 1 ── n project_headers
estimate_items n ── 1 units
measurement_lines n ── 1 calculation_methods
```

| Tabla | Campos/claves propuestos | Tipo relacional orientativo | Equivalente/correspondencia en el libro |
|---|---|---|---|
| `projects` | `id` PK, `name`, `owner`, `specialty`, `module_name`, `prepared_by`, `reviewed_by`, `project_date`, `created_at`, `updated_at` | UUID, text, date, timestamptz | `RESUMEN!D6`, `D8:D11`, `M8:M9`, `C3`; campos de `Encabezado.bas`. |
| `estimate_versions` | `id` PK, `project_id` FK, `version_no`, `status`, `source_file`, `created_by`, `created_at` | UUID, UUID, integer, enum/text | Versionado web del contenido `Metrado`/`RESUMEN`; no hay control de versiones fiable en VBA. |
| `units` | `id` PK, `code` UNIQUE, `dimension` | UUID, varchar, enum/text | Catálogo `Param!AC:AG` y aliases/localización de unidades; p. ej. `m`, `m2`, `m3`, `kg`, `und`, `GLB`. |
| `estimate_items` | `id` PK, `version_id` FK, `parent_id` FK nullable, `item_code`, `level`, `description`, `unit_id` FK nullable, `sort_order`, `item_kind` | UUID, UUID, UUID, varchar, smallint, text, UUID, integer, enum | A/C/D/E en `Metrado` y `RESUMEN`. `parent_id` reemplaza sangrías/nivel como única fuente de jerarquía; `item_code` conserva códigos como `02.01.01`. `item_kind`: capítulo, partida, subtotal/encabezado. |
| `measurement_lines` | `id` PK, `item_id` FK, `description`, `similar_elements`, `length`, `width`, `height`, `times`, `sign`, `unit_id` FK, `method_id` FK, `input_json`, `quantity`, `created_at`, `updated_at` | UUID, UUID, text, numeric, numeric(18,6), numeric(18,6), numeric(18,6), numeric(18,6), numeric(18,6), smallint, UUID, UUID, jsonb, numeric(18,6) | D/F/G/H/I/J y resultados K:O. Mantener `sign`/coeficiente con signo porque en el libro hay descuentos negativos; `input_json` admite fórmulas no rectangulares sin alterar el esquema cada vez. |
| `calculation_methods` | `id` PK, `code` UNIQUE, `name`, `output_dimension`, `formula_version` | UUID, varchar, text, enum, varchar | Familias: longitud, área, volumen, encofrado, madera, acero longitudinal, losa maciza, estribos. |
| `steel_catalog` | `id` PK, `label` UNIQUE, `diameter_mm`, `kg_per_m`, `splice_length_m`, `hook_length_m`, `is_active` | UUID, varchar, numeric(10,3), numeric(10,5), numeric(10,4), numeric(10,4), boolean | `Param!R:U` (diámetros, kg/m, empalme y gancho). Valores de muestra: Ø1/4″ 0.25 kg/m; Ø3/8″ 0.56; Ø1/2″ 0.99; Ø5/8″ 1.55; Ø3/4″ 2.24; Ø1″ 3.98; Ø1 3/8″ 7.52; Ø6/8/12 mm 0.22/0.39/0.89. Deben importarse como catálogo configurable, no hardcodearse en componentes. |
| `steel_takeoffs` | `id` PK, `measurement_line_id` FK, `mode`, `bar_catalog_id` FK, `quantity`, `similar_elements`, `bar_length_m`, `hook_start_m`, `hook_end_m`, `splice_length_m`, `computed_splices`, `weight_kg` | UUID, UUID, enum, UUID, numeric, numeric, numeric, numeric, numeric, numeric, numeric, numeric | Entradas y resultados de `FormAcero` y modos de cálculo de `FormMaciso`/`FormCol`. |
| `project_headers` | `id` PK, `project_id` FK, `field_key`, `value`, `sort_order` | UUID, UUID, varchar, text, integer | Alternativa extensible para encabezado/importación; si se prefiere esquema rígido, usar columnas tipadas en `projects`. El legacy conserva 8 valores en texto en orden fijo. |
| `item_totals` (vista/materializada) | `item_id` PK/FK, `length_total`, `area_total`, `volume_total`, `weight_total`, `unit_total`, `amount_total`, `computed_at` | UUID, numeric(18,6) | K:P y agregaciones de `GTotal.bas`; derivar de líneas hijas y recalcular al cambiar entradas. No almacenar ambos subtotales manuales y sumas sin una política de consistencia. |
| `project_attachments` | `id` PK, `project_id` FK, `measurement_line_id` FK nullable, `storage_key`, `media_type`, `caption` | UUID, UUID, UUID, text, text, text | Las fotos referenciales deben ir a almacenamiento de objetos, la BD solo mantiene metadatos/URL segura. |

### Reglas de datos y precisión

- Usar `numeric`/decimal para dimensiones y pesos, no `float` de JavaScript ni `REAL` de BD para persistencia. Redondear solo en los puntos que el archivo redondea (por ejemplo el peso de acero de `Acero.bas` y algunas líneas de `Maciso.bas`, ambos a 2 decimales), conservar más precisión para agregaciones.
- Validar cantidades/dimensiones finitas; las dimensiones geométricas y espaciamientos no pueden ser negativos. Los coeficientes de descuento sí admiten signo negativo.
- Conservar explícitamente unidad de entrada y unidad resultante. Las conversiones de madera dependen de `Param!X2:Z2` y de las etiquetas de unidad (`X3:Z3`), no inferirlas del texto de la descripción.
- Código de ítem y numeración son datos, no índice de fila. La jerarquía admite hasta siete niveles en la macro heredada, pero el modelo web puede permitir profundidad configurable.
- Importar el encabezado y filas de una plantilla con vista previa, errores por fila y reporte de conversión; una migración de valores debe distinguir celdas vacías, ceros, descuentos y fórmulas.

## Traducción de lógica principal a TypeScript

El siguiente código es una traducción estructurada del comportamiento observado, no un reemplazo literal de todas las macros. Debe versionarse y probarse con casos patrón del `.xlsm` antes de declararlo equivalente. En particular, VBA `Round` usa redondeo bancario; `Math.round` de JavaScript no es equivalente en todos los casos y los cocientes deben usar decimal exacto en producción.

```ts
type SteelBar = {
  kgPerMeter: number;
  spliceLengthM: number;
  hookLengthM: number;
};

function roundVba(value: number, digits: number): number {
  // Banker's rounding (ties to even), matching VBA Round for ordinary finite inputs.
  if (!Number.isFinite(value) || !Number.isInteger(digits) || digits < 0 || digits > 12) {
    throw new RangeError("Se requiere un número finito y entre 0 y 12 decimales.");
  }
  const scale = 10 ** digits;
  const scaled = Math.abs(value) * scale;
  const lower = Math.floor(scaled);
  const fraction = scaled - lower;
  const tolerance = Number.EPSILON * Math.max(1, scaled) * 4;
  const rounded = Math.abs(fraction - 0.5) <= tolerance
    ? (lower % 2 === 0 ? lower : lower + 1)
    : (fraction < 0.5 ? lower : lower + 1);
  return Math.sign(value) * rounded / scale;
}

type LongitudinalSteelInput = {
  quantity: number;
  similarElements: number;
  clearLengthM: number;
  startHookM: number;
  endHookM: number;
  spliceLengthM: number;
  bar: SteelBar;
};

function spliceCount(totalLengthM: number, spliceLengthM: number): number {
  // Equivalente a la regla de Acero.bas: no empalmar hasta 9 m,
  // luego cubrir el excedente en tramos de (9 - empalme).
  if (totalLengthM <= 9) return 0;
  const availableLapSpan = 9 - spliceLengthM;
  if (availableLapSpan <= 0) {
    throw new RangeError("El empalme debe ser menor que 9 m.");
  }
  return Math.floor((totalLengthM - 9) / availableLapSpan) + 1;
}

function longitudinalSteelWeight(input: LongitudinalSteelInput) {
  const hooks = input.startHookM + input.endHookM;
  const splices = spliceCount(hooks + input.clearLengthM, input.spliceLengthM);
  const addedSpliceLength = splices * input.spliceLengthM;
  const weightKg = input.bar.kgPerMeter
    * input.similarElements
    * input.quantity
    * (addedSpliceLength + hooks + input.clearLengthM);
  return { spliceCount: splices, addedSpliceLength, weightKg: roundVba(weightKg, 2) };
}

type SlabInput = {
  length: number; width: number; thickness: number; quantity: number;
  cover: number; spacingX: number; spacingY: number;
  kgPerM_X: number; kgPerM_Y: number;
  spliceX: number; spliceY: number;
};

function slabMetrado(i: SlabInput) {
  const concretePerUnit = i.length * i.width * i.thickness;
  const barsX = i.spacingY === 0 ? 0 : roundVba((i.length - 2 * i.cover) / i.spacingY, 0) + 1;
  const barsY = i.spacingX === 0 ? 0 : roundVba((i.width - 2 * i.cover) / i.spacingX, 0) + 1;
  const spliceCountX = spliceCount(i.width - 2 * i.cover, i.spliceX);
  const spliceCountY = spliceCount(i.length - 2 * i.cover, i.spliceY);
  const steelX = roundVba((i.width - 2 * i.cover + spliceCountX * i.spliceX) * barsX * i.kgPerM_X, 2);
  const steelY = roundVba((i.length - 2 * i.cover + spliceCountY * i.spliceY) * barsY * i.kgPerM_Y, 2);
  return {
    concretePerUnit,
    concreteTotal: concretePerUnit * i.quantity,
    steelKgPerUnit: steelX + steelY,
    steelKgTotal: (steelX + steelY) * i.quantity,
  };
}

type WoodInput = {
  pieces: number; length: number; width: number; thickness: number;
  lengthFactor: number; widthFactor: number; thicknessFactor: number;
};

function woodVolumeCubicFeet(i: WoodInput): number {
  // FormMadera: factores a pulgadas, producto dividido entre 12.
  return roundVba(
    i.lengthFactor * i.widthFactor * i.thicknessFactor * i.pieces
      * i.length * i.width * i.thickness / 12,
    2,
  );
}

function area(length: number, width: number, count: number, sign = 1): number {
  return length * width * count * sign;
}

function volume(length: number, width: number, height: number, count: number, sign = 1): number {
  return length * width * height * count * sign;
}
```

`roundVba` debe implementarse con decimal/banker's rounding o con una librería decimal ya elegida por el proyecto. No he recomendado una dependencia adicional sin revisar `package.json`. Reglas adicionales comprobadas:

1. **Acero longitudinal (`Acero.bas`)**: longitud total = largo neto + ganchos inicial/final + empalmes; peso = kg/m × elementos similares × cantidad × longitud total; el resultado de peso se redondea a 2 decimales.
2. **Losa maciza (`Maciso.bas`)**: volumen `L*A*h`; acero por dirección usa recubrimiento `R`, espaciamientos `Sx/Sy`, peso por metro de cada diámetro y empalmes; existe modo de una capa y dos capas. En el modo de una capa, encofrado base = `L*A` y perímetro = `2*(L+A)*h` (según opción, el código cambia ambas expresiones). El formulario añade subtítulos opcionales para concreto, encofrado en base/perímetro y acero.
3. **Madera (`Madera.bas`, `FormMadera.frm`)**: convierte el largo elegido a pies (m/cm/mm/ft/in) y ancho/espesor a pulgadas; calcula piezas × elementos similares × largo(ft) × ancho(in) × espesor(in) / 12. El resultado corresponde a pies tablares (`p`), como se refleja en la hoja de salida; las conversiones son configurables mediante `Param!X2:Z2`.
4. **Estribos (`FormEstribo.frm`)**: recorre hasta cuatro zonas de espaciamiento `E1..E4`, usa límites/cantidades máximas `N1..N4`, cuenta barras completas por truncamiento (`Int`) y calcula una cantidad final; la opción de simetría duplica el conteo y resta una barra si el remanente cabe en el último espaciamiento. La macro actual puede dividir entre cero si un espaciamiento llega vacío o cero; la web debe validarlo antes de calcular.
5. **Totales (`GTotal.bas`)**: agrupa/categoriza por unidad (longitud, área, volumen, peso, unidad) y compone una suma por grupo. La implementación web debería agregar valores decimales por `unit_id` y validar que partidas sumadas tengan la misma unidad, en vez de insertar fórmulas R1C1 con posiciones relativas.
6. **Numeración (`Resumen.bas`)**: incrementa el nivel actual y pone a cero los descendientes; genera segmentos numéricos separados por punto, conserva prefijo/sufijo y aplica formato según el nivel. Modelo recomendado: secuencia numérica por hermano + código compuesto renderizado.

### Precaución de fidelidad

Algunos cálculos del VBA merecen validación con el autor antes de migrarlos como norma técnica: la fórmula de empalmes mezcla `9` con longitudes ingresadas; el redondeo de espaciamiento usa `Round` (no siempre `ceil`); `Maciso.bas` cambia el orden de expresiones de encofrado según opción, y `FormEstribo` usa reglas distintas en modo simétrico. Hay que preservar el resultado heredado solo cuando sea intencional y documentar/confirmar cualquier corrección de ingeniería.

## Formularios y diseño web UI/UX

Los `.frm` exponen eventos de controles, pero la colocación, listas internas, imágenes, captions secundarios y varias propiedades del formulario viven en archivos binarios `.frx`. Por eso, los campos listados abajo se basan en nombres de controles, manejadores de eventos y usos del código; el `.frx` debe conservarse/revisarse en Excel/VBA para reproducir visualmente el formulario con exactitud.

| Formulario heredado | Campos visibles deducibles / controles | Acciones | Validaciones y feedback web recomendados |
|---|---|---|---|
| `FormAcero` | Descripción; cantidad; elementos similares; diámetro; largo; gancho inicial/final con checkboxes; longitud de empalme; peso lineal tomado del catálogo. Dos pestañas/modos: longitudinal y estribo. | Añadir título, aceptar/insertar cálculo, cambiar modo, cancelar. Vista previa dibujada de barra y peso calculado. | Valores numéricos positivos, diámetro del catálogo, ganchos opcionales (si desactivados no se suman), empalme `0 ≤ e < 9 m`, mostrar peso en vivo y explicar el desglose. |
| `FormCol` | Descripción, pisos/elementos; geometría de columna (`Hc`, `Hv`, `B`, `T`); barras longitudinales (`N1..N4`, `E1..E4`, diámetros); acero/estribos por distribución, nudos y adicional. | Añadir geometría, generar/insertar metrado, modificar/nuevo, modos de visualización. | Dimensiones > 0; catálogo y diámetros requeridos; espaciamientos > 0; zonas no negativas; validar que conteos y elementos estén completos y mostrar peso desglosado. La lógica contiene múltiples fórmulas R1C1 y necesita batería de comparación. |
| `FormMaciso` | Descripción, cantidad, L/A/H, recubrimiento R; opción geométrica; una o dos capas; separaciones Sx/Sy y por capa; diámetros X/Y; lista de detalles. Checkboxes para generar concreto/encofrado. | Añadir detalle, borrar/modificar (el código indica que borrar no está habilitado), generar metrado, agregar título, cancelar. | L/A/H > 0; `0 ≤ 2R < min(L,A)`; espaciamientos no nulos antes de calcular; diámetros seleccionados; bloquear divisiones por cero; preview concreto, encofrado y acero por capa/dirección. |
| `FormEstribo` | Largo; cuatro límites `N1..N4`; cuatro espaciamientos `E1..E4`; opción simple/simétrica. | Calcular, enviar al metrado, cancelar. | Largo > 0; todo espaciamiento requerido > 0; conteos enteros >=0; validar zonas; resultado con conteo por zona y residuo final, no solo una alerta modal. |
| `FormMadera` | Descripción, piezas/elementos similares, cantidad, largo/ancho/espesor, unidad de cada dimensión editable, resultado y factor de conversión. | Aceptar/insertar, agregar título, editar unidades, cancelar. | Valores > 0, unidades compatibles y conversiones explícitas; advertir al cambiar unidades; actualizar etiquetas y resultado en vivo. |
| `FormGenItemRes`, `UserForm2` | Hasta siete segmentos numéricos de código, prefijo y sufijo; previsualización. | Aceptar, añadir prefijo/sufijo, limpiar/cancelar. | Segmentos enteros positivos o vacíos; no permitir duplicado dentro de la versión; sugerir siguiente código del mismo padre. Hay dos formularios con responsabilidades solapadas a consolidar. |
| `UserForm3`, `FormNivel` | Listado de niveles/partidas y checkboxes de selección; prefijo/sufijo/nivel. | Seleccionar/deseleccionar, aceptar, extraer niveles. | Selección válida; preservar jerarquía; advertir acciones que reescriben varios códigos. |
| `FormTotal`, `FormTotal_Add` | Partidas, unidades, categorías de unidad y posición de inserción; alta de unidad. | Generar/editar totales; agregar unidad o tipo; ordenar/reiniciar. | Unidad obligatoria, sin mezclar dimensiones; no aceptar total cero para una partida que requiere metrado (el VBA muestra alerta); mostrar qué líneas componen el subtotal. |
| `UserForm1`, `FormImportEnc`, `FormTitulo` | Datos de encabezado: título, proyecto, propietario, fecha, especialidad, módulo, preparado/revisado; checkboxes de importación selectiva. | Guardar/editar, importar/exportar texto, formato, fecha, limpiar, actualizar título. | Fecha válida; texto con límites razonables; confirmar importación selectiva y ofrecer vista previa. El TXT antiguo son exactamente 8 líneas en orden fijo, sin versión ni escaping. |
| `UserForm4` | Panel de comandos de hoja. | Generar items/niveles/resumen/totales; actualizar título; encabezado; formato; exportar; limpiar. | Confirmación para limpieza y actualización destructiva; undo/audit log en la web; ejecución que preserve cambios y presente resultado/errores inline. |
| `UserForm5`, `FormEstiloH`, `FormHojaAcero`, `Inicio` | Confirmaciones/opciones de estilo e inicio/licencia. | Limpiar/cancelar, estilos, iniciar/salir. | Sustituir modal genérico por confirmaciones web accesibles; la autorización local no debe migrarse como control de acceso. |

No se deben replicar los nombres genéricos `UserForm1…6` en el frontend. Propongo paneles/modales con nombre funcional (`Editar encabezado`, `Generar resumen`, `Calcular losa`, `Acero`, etc.), formularios tipados y cálculo/validación reactivos. Las acciones de insertar/editar/eliminar deben operar sobre entidades por ID; nunca sobre `ActiveCell` o fila seleccionada como único contexto.

## Dependencias ocultas de Excel/VBA y riesgos

1. **Modelo de objetos de Excel**: `ActiveCell`, `Selection`, `Offset`, `EntireRow.Insert`, `Rows`, `Range`, `Sheets.Select`, `ListIndex`, `SetFocus`, `Application.ScreenUpdating` y `StatusBar`. Son dependencias de UI y coordenadas; deben traducirse a comandos explícitos del modelo de dominio.
2. **Motor de fórmulas**: fórmulas `PRODUCT`, `SUM` y `FormulaR1C1` se insertan al escribir datos. En web conviene calcular explícitamente con TypeScript y tener una única fuente del cálculo. Si se necesita importar/exportar fórmulas arbitrarias de Excel, evaluar un motor compatible como HyperFormula; no es necesario para las fórmulas fijas de metrados y añadirlo sin necesidad complica precisión/licencia.
3. **Semántica numérica**: `Val`, `Int`, `Round` (VBA banker's rounding), `Str` y `Asc/Chr` no coinciden exactamente con conversiones/rounding JS. `Val` acepta prefijos numéricos y puede tratar decimal con reglas distintas; validar y parsear separador decimal deliberadamente. `Int` redondea hacia menos infinito, distinto de truncamiento para negativos.
4. **Formato/localización**: unidades se normalizan a minúsculas salvo excepciones `GLB` y `L`; encabezados y Excel dependen del locale; `FormulaR1C1` evita A1 pero sigue siendo formato Excel. Guardar identificadores de unidad canónicos y presentar etiquetas localizadas.
5. **Impresión/exportación**: `PageSetup`, `xlPaperA4`, `InchesToPoints`, `PrintTitleRows`, `Zoom`, `ExportAsFixedFormat`, `GetSaveAsFilename`, `SaveAs` y `FileDialog`. La exportación web debe reemplazar esto con generación PDF/XLSX y una vista previa de impresión. La configuración heredada fija A4 vertical, repite filas 2:16, zoom 85%, pie “Página P” y márgenes explícitos.
6. **Archivos y sistema local**: `Open/Print`, `Dir`, `Kill` y ruta `C:\MetradosKey`. TXT no incluye escaping; el reemplazo `Kill` borra el archivo existente. No trasladar rutas locales ni borrado directo: usar cargas/descargas, permisos del servidor y confirmación.
7. **Control de licencia**: `ThisWorkbook.Workbook_Open` comprueba existencia de `C:\MetradosKey`, agrega menú y oculta/muestra botones. Es una dependencia de PC y no es autenticación segura; sustituir por autorización en backend si aplica.
8. **Recursos binarios**: `.frx` contiene definición visual de controles/imágenes no legible en el `.frm`; fotos referenciales y recursos requieren inventario, asociación y migración aparte.
9. **Macros con efectos destructivos/estados abruptos**: hay procedimientos con `End`, `Kill`, limpieza de hoja y actualización de títulos que advierte que no tiene retroceso. En web deben ser transacciones acotadas, con previsualización, permisos, historial y recuperación.

## Secuencia recomendada para la migración

1. Definir un conjunto de casos de referencia (entradas/salidas del libro) para acero, columna, losa, madera, estribos, descuentos, jerarquía y totales. Confirmar con el usuario técnico las reglas dudosas de empalmes, encofrado y redondeo.
2. Implementar entidades/validación/calculadores sin UI; comparar automáticamente sus resultados con los casos patrón Excel con tolerancias/unidades aprobadas.
3. Crear persistencia por proyecto y versión, importador de encabezado/hojas con vista previa y trazabilidad de celdas no migradas.
4. Construir la sección Metrados en `NavMetrado.tsx` y formularios con cálculo inmediato; dejar el diseño actual de Wexel como guía visual y evitar que Excel sea el motor de dominio.
5. Implementar resumen, totales y exportación PDF/XLSX. Verificar fórmulas, unidad, estructura jerárquica y paginación contra la plantilla.

## Primera integración funcional en Wexel

La pestaña Metrados ya tiene un área de trabajo persistente con vistas de Metrado, Resumen y Acero; encabezado editable; jerarquía contraíble; campos editables de código, descripción, unidad y dimensiones; líneas de metrado con signos de descuento; formularios de acero longitudinal, estribos, losa maciza (una/dos capas), madera y columna; guardado automático en `localStorage`; respaldo/importación JSON y exportación tabular CSV. Los cálculos especializados generan subpartidas y el desagregado de acero se refleja en su vista.

Esta integración es una primera versión de trabajo, no equivalencia certificada con todas las macros del libro. La columna no reproduce aún todos los casos de nudos, pisos y distribución de acero de `FormCol`; el estribado y las conversiones de madera requieren comparar cada combinación con casos patrón; no están implementados el export XLSX/PDF, la plantilla imprimible A4 ni el importador del `.xlsm`. El lienzo de Excel general permanece montado y conserva su persistencia al entrar/salir de Metrados.

### Fuentes examinadas

`Modulos/Acero.bas`, `Maciso.bas`, `Madera.bas`, `GTotal.bas`, `Resumen.bas`, `ActTitulo.bas`, `Nivel.bas`, `HojaAcero.bas`, `Encabezado.bas`, `Export.bas`, `Módulo1.bas`, `Módulo2.bas`; formularios `FormAcero.frm`, `FormCol.frm`, `FormEstribo.frm`, `FormMaciso.frm`, `FormMadera.frm`, `FormTotal.frm`, `FormTotal_Add.frm`, `FormGenItemRes.frm`, `UserForm1.frm`–`UserForm6.frm`, `FormImportEnc.frm`, `FormNivel.frm`, `FormTitulo.frm`, `UserForm4.frm`; objetos de libro/hoja; hojas y rangos del `.xlsm` limpio.
