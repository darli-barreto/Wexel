# Limpieza, eliminación y esponjamiento: criterio de revisión

Revisión del ejemplo adjunto y de la Norma Técnica de Metrados aprobada por R.D. 073-2010/VIVIENDA/VMCS-DNC. Fecha: 24 de octubre de 2026.

## Conclusión sobre las imágenes

La observación sobre la jerarquía es correcta: **OE.1.1.3.1 Limpieza del terreno** es el apartado que agrupa dos conceptos medibles, con unidades diferentes. No se le asigna una unidad única en la tabla de la norma.

| Referencia original | Concepto | Unidad |
|---|---|---|
| OE.1.1.3.1 | Limpieza del terreno: título del grupo | Sin cuantía propia del título |
| OE.1.1.3.1.1 | Eliminación de basura y elementos sueltos y livianos | m³ |
| OE.1.1.3.1.2 | Eliminación de maleza y arbustos de fácil extracción | m² |

El criterio de OE.1.1.3.1.1 incluye el transporte de desperdicios fuera de la obra. OE.1.1.3.1.2 incluye la eliminación de la vegetación superficial. La mecanización describe cómo se ejecuta el trabajo; no demuestra por sí misma que exista un alcance adicional e independiente.

**No puede concluirse un doble cómputo únicamente a partir de la imagen.** Una partida de proyecto denominada «Limpieza del terreno con maquinaria» podría tener un alcance particular documentado. Para aceptarla separadamente se debe identificar qué trabajo mide, la especificación correspondiente y sus APU, y contrastarlos con la eliminación. Si ambas partidas incluyen el mismo retiro o transporte, existe una posible duplicidad que debe aclararse. Si se retira suelo superficial en una capa de espesor determinado, también debe precisarse si el trabajo corresponde a movimiento de tierras, en lugar de denominarlo genéricamente limpieza de basura.

## Qué verifica y qué no verifica la cuenta

Con los valores de la imagen:

- Área: 32,75 × 19,30 = 632,075 m² → **632,08 m²**.
- Volumen base supuesto: 632,075 × 0,20 = **126,415 m³**.
- Volumen con factor 1,50: 126,415 × 1,50 = 189,6225 m³ → **189,62 m³**.

La aritmética coincide. Esto no valida el espesor, la homogeneidad de la capa, la naturaleza del material, el estado del volumen ni la procedencia del factor. Un espesor promedio de 0,20 m para residuos debe tener medición o justificación; no se deduce del área del lote. Un factor 1,50 significa incremento de **50 %**, no de 1,50 %. La tabla de factores de suelos de otro apartado no justifica automáticamente el mismo valor para basura o vegetación.

## El factor depende de la partida

- **OE.2.1.6, Eliminación de material excedente:** el texto establece la diferencia de volúmenes de excavación y relleno con material propio y contempla su afectación por esponjamiento. Los valores de la tabla son referenciales y los cambios requieren sustento técnico.
- **HU.3.4.4.3, Eliminación de material excedente de excavaciones para estructuras:** el texto sitúa el factor de esponjamiento en el **análisis del costo de la partida**. No corresponde trasladar indiscriminadamente la regla anterior al metrado de esta partida.
- **HU.3.4.4.2, eliminación de material excedente de zanjas:** se mide por longitud de zanja; el volumen del análisis de costo incluye el esponjamiento.
- **OE.1.1.3.1.1, basura y elementos sueltos:** no prescribe un factor universal de 1,50. Si el expediente adopta una corrección de volumen, debe sustentar material, volumen base y método. Un volumen ya medido suelto no se multiplica nuevamente por el mismo efecto.

## Observación constructiva propuesta

«Se solicita precisar el alcance y la correspondencia normativa de la partida “Limpieza del terreno con maquinaria” en m², considerando que OE.1.1.3.1 agrupa la eliminación de basura en m³ y la eliminación de maleza en m². Asimismo, sustentar el espesor promedio de 0,20 m y el factor 1,50 empleados en el volumen de eliminación, y contrastar las especificaciones y análisis de precios unitarios de ambas partidas para descartar duplicidad de retiro o transporte. La observación se refiere al alcance y sustento del metrado, no a un error aritmético demostrado.»

## Uso en Wexel

La hoja muestra primero dos detalles editables de **Área de intervención (referencia)** bajo el título Limpieza del terreno, antes de las partidas de eliminación. Calculan largo × ancho en m²; la columna Total del título suma únicamente las áreas de referencia ya medidas (los sectores no deben superponerse). Por ejemplo, 32,75 × 19,30 muestra 632,08 m². El título conserva su unidad normativa vacía y el total se identifica en la ayuda y en la impresión como referencial: aparece también en el resumen, identificada como área de intervención de referencia en m². El resumen muestra la misma cantidad, sin aplicar su factor general ni crear otra partida cobrable. No implica que toda esa superficie contenga maleza o basura. Las superficies efectivamente desbrozadas se registran como **Superficie con maleza** en su partida, y los residuos por su volumen en la partida de basura. No se infieren ni transfieren cantidades automáticamente entre estos alcances.

Selecciona la descripción de un título o partida y pulsa **?**; en un detalle abre el desplegable y elige **Cómo medir esta partida / factor de esponjamiento**. También está disponible desde **Revisar metrado**.

Los valores de entrada necesarios se distinguen en **#e8e8e8**, configurable en `config/colors.ts`, propiedad `COLORS.metrado.input`. Se marcan según la dimensión: largo para m, largo y ancho para m², largo/ancho/altura para m³, o cantidad directa para unidades y peso, además de las multiplicidades. Las descripciones y las unidades conservan su fondo normal. Las columnas de resultados y los campos dimensionales que no intervienen no se presentan como entradas necesarias.

El **factor de esponjamiento** tiene un campo propio por detalle, accesible en la ayuda. No se usa N.º de veces ni el factor general del resumen para introducirlo. Su aplicación exige un detalle volumétrico, confirmar que la base está antes de esponjar y registrar el material y sustento. El valor inicial es 1; no se propone un porcentaje universal. En las partidas auditadas que lo reservan al APU, la aplicación al metrado queda impedida.

El cálculo nativo incorpora el factor una sola vez. La vista de documento y el CSV identifican el factor y su sustento. La impresión mantiene los datos de entrada sobre fondo blanco para su presentación técnica; el gris de guía corresponde al lienzo de edición. Las fórmulas manuales previas no se sobrescriben: deben revisarse antes de añadir otro factor.

Se corrigió además un error de extracción del catálogo: la guía de la partida de basura mostraba una frase del apartado de remociones. Ahora remite al criterio correspondiente de limpieza, en las páginas PDF 22–23.

## Fuentes y límites

- Norma adjunta por el usuario, páginas PDF **22–23**, **30–31** y **128**.
- [Texto de la norma alojado en SPIJ, Ministerio de Justicia](https://spij.minjus.gob.pe/Graficos/Peru/2011/Mayo/18/RD-073-2010-VIVIENDA-VMCS-DNC.pdf). El servidor no permitió descargarlo mediante la consulta web; se contrastaron los extractos oficiales indexados con el documento adjunto ya extraído.
- [Resolución de aprobación, Diario Oficial El Peruano](https://busquedas.elperuano.pe/dispositivo/NL/494872-2).

La revisión se limita al texto de referencia aportado y a las dos imágenes. No se revisaron los APU, especificaciones, planos, mediciones de campo ni el contrato de la obra del ejemplo; por eso no se declara un cobro duplicado ni un incumplimiento contractual probado.
