# Cortes y volúmenes por secciones

## Criterio

La Norma Técnica de Metrados, OE.2.1.3 Cortes, indica volumen natural sin esponjamiento y el promedio de áreas extremas por la distancia entre secciones. Ai y Af son superficies de **sección transversal**, en m², no el área en planta ni un ancho en metros. El volumen de cada tramo es:

`V = (Ai + Af) / 2 × L`

Si el área media Am ya fue obtenida y sustentada con las secciones, se puede registrar `V = Am × L`. Se acumulan los tramos, evitando superposiciones. Las secciones y la separación deben representar la geometría del terreno; el método no garantiza exactitud para cualquier variación entre perfiles. No se resta área de relleno al área de corte dentro del mismo dato. Para otras geometrías o métodos, se conserva la opción largo × ancho × alto y las fórmulas manuales revisadas.

## Uso

En la Descripción del detalle, abre el desplegable y elige **Corte · tramo entre progresivas (áreas extremas)** o **Corte · tramo entre progresivas (área media conocida)**. También puedes abrir **Cómo medir esta partida / factor de esponjamiento**, seleccionar el detalle y aplicar el método. Escribe progresivas o identificadores en la descripción, por ejemplo `0+000 – 0+005`.

La cabecera adicional del detalle identifica los campos:

| Columna | Áreas extremas | Área media conocida |
|---|---|---|
| G | Distancia entre secciones, m | Distancia entre secciones, m |
| H | Área inicial Ai, m² | Área media Am, m² |
| I | Área final Af, m² | No interviene; queda vacía y sin sombreado |
| M | Volumen calculado, m³ | Volumen calculado, m³ |

F y J conservan sus funciones de multiplicidad y repetición/descuento. Para un tramo individual, normalmente son 1; el usuario sustenta cualquier multiplicidad diferente. El volumen y su total se actualizan en Metrado y Resumen. La cabecera, el método, las áreas y su sustento se conservan en el respaldo y en la presentación para imprimir. El CSV exporta las áreas en columnas expresamente rotuladas, sin presentarlas como ancho/alto.

Los nuevos detalles normativos de Cortes comienzan con áreas extremas vacías. Los detalles previos mantienen su método y datos: no se interpreta automáticamente un ancho guardado como un área. Al cambiar de método, se conservan anchos y alturas originales para poder volver al método geométrico. Los resultados manuales requieren revisión antes de cambiar de método. Un área cero se admite; áreas negativas o distancia no positiva producen un error de validación al completar los datos.

## Lectura de las imágenes aportadas

La primera fila no calculaba porque el método anterior exigía largo, ancho y altura. No se resuelve asignando arbitrariamente una altura 1 si el segundo dato representa un área.

Con distancia **5 m** y área media **10,99 m²**, el resultado es **54,95 m³**. El **54,93 m³** de la otra captura podría deberse a decimales ocultos o a otra fórmula: por ejemplo, un área media de **10,986 m²** mostraría 10,99 a dos decimales, pero produciría 54,93 m³. Es una explicación posible, no una verificación de ese archivo. No se redondean las áreas antes de calcular el volumen.

## Rellenos y terraplenes

### Catálogo de descuentos de volumen

El desplegable de rellenos incluye solado, zapata, solado y zapata juntos, columna/pedestal, cimiento corrido (por área acumulada o por prisma), viga de cimentación, VC y tecnopor juntos, tecnopor individual, sobrecimiento enterrado y otro elemento ocupado. Las opciones explícitas de descuento establecen signo negativo sin inventar medidas. Sus definiciones están centralizadas en `components/metrados/fillDeductions.ts`, compartidas por menús y grupos nuevos.

El grupo **Relleno de viga de cimentación** incorpora excavación, VC y tecnopor, cimiento corrido y sobrecimiento enterrado. El cimiento usa área acumulada × altura; los demás descuentos rectangulares muestran largo × ancho × alto en una cabecera compacta propia. Si no hay tecnopor, se puede cambiar el descuento conjunto por VC individual; si sus medidas difieren, se pueden usar filas individuales sin conservar además el descuento conjunto. Las cantidades de los grupos se vinculan a las excavaciones iguales, no al número de elementos ya incluido en un área acumulada.

Ejemplo de la captura: excavación `1,20×1,05×1,45=1,827 m³`, VC y tecnopor `−1,20×0,25×0,50=−0,150 m³`, cimiento `−(1,20×0,60)×0,60=−0,432 m³`, sobrecimiento `−1,20×0,25×0,05=−0,015 m³`. Relleno neto: **1,230 m³**. Se conserva la precisión interna aunque el parcial se muestre redondeado.

Solo se descuentan volúmenes que ocupan el vacío considerado. No sumar los descuentos individuales junto al conjunto de los mismos elementos, no repetir encuentros y no descontar sobrecimientos por encima del nivel final del relleno. El tecnopor de este grupo es EPS que ocupa el vacío de la excavación; no representa casetones de una losa. Las filas opcionales que no correspondan se pueden eliminar.

Los grupos ya guardados no se modifican ni se completan automáticamente para respetar las mediciones y eliminaciones del usuario. Para ampliarlos, agrega un detalle y elige el descuento del menú; los grupos que se crean desde ahora utilizan el catálogo ampliado.

### Descuento de columnas con sección irregular

Los grupos nuevos de zapatas también incluyen «Descuento · Cimiento corrido», por área acumulada en planta × altura dentro del relleno, con signo negativo y cantidad vinculada a la excavación. Para grupos ya creados, agrega un detalle y elige «Descuento · Cimiento corrido» en su menú; esta opción fija el signo negativo y activa G = altura (m), H = área acumulada (m²). Conserva las dimensiones previas sin convertirlas automáticamente. Si AutoCAD ya incluye dos cimientos en esa área, no se multiplica otra vez por dos: F cuenta excavaciones iguales, no cimientos incluidos en el área. No sumar intersecciones por duplicado; con alturas distintas, separar detalles. Mide solo el tramo dentro del vacío del relleno, sin repetir el encuentro ya descontado como zapata. Si no corresponde, elimina esa fila.

Los nuevos grupos de zapatas usan **área real de sección × altura enterrada** en su descuento de columna o pedestal. En detalles existentes puede elegirse «Descuento de columna o pedestal · área de sección × altura enterrada» en el desplegable del detalle, o cambiar el método desde la guía de medición.

- G: altura de columna dentro del volumen de relleno, en metros.
- H: área real de concreto de la sección, en m². Admite fórmulas; I queda vacía y sin sombreado de entrada.
- F: cantidad de elementos, vinculada a la excavación del grupo mientras no se modifique manualmente.
- J: signo/repeticiones; el descuento del grupo conserva −1.
- Volumen: `F × G × H × J`. No lleva esponjamiento.

Para una columna en L formada por dos rectángulos sin superposición, `=0.60*0.20+0.20*0.40` da 0,20 m². Con 0,80 m enterrados y una columna, el descuento es −0,16 m³. No usar el rectángulo envolvente ni descontar la altura sobre el nivel final de relleno. Si la sección cambia, dividir en tramos; no duplicar el concreto ya descontado como zapata o pedestal.

Al cambiar de prisma a área de columna no se reinterpretan dimensiones anteriores: las entradas nuevas empiezan vacías y se conservan las dimensiones originales para volver al método geométrico. La cabecera compacta, el resumen, la vista de presentación y CSV reconocen el nuevo método. La vista de presentación incluye el área, altura y fórmula del área cuando se ingresó una.

OE.2.1.4.1 y OE.2.1.4.2 miden el relleno compactado. En rellenos masivos se emplea el promedio de áreas extremas por distancia. HU.2.1.3 Terraplenes también contempla este método. Las opciones del detalle permiten áreas extremas, área media sustentada y volumen geométrico neto. Los nuevos terraplenes normativos comienzan por secciones; los rellenos con material propio o de préstamo conservan por defecto el método geométrico, porque también comprenden zanjas y cimentaciones. No se convierte ningún dato existente automáticamente.

Ejemplo de relleno masivo: Ai=6 m², Af=10 m² y L=10 m → V=80 m³ compactados. Se conserva la cabecera compacta de una línea para cada detalle.

Para un vacío de dimensiones regulares se usa largo × ancho × altura. Si el volumen inicial es bruto, se descuenta el volumen ocupado por concreto, tuberías o estructuras: por ejemplo, 10 m³ − 1,5 m³ = 8,5 m³. El ejemplo «Relleno · descuento por volumen ocupado por estructura» exige introducir el signo negativo en N.º de veces; elegir el texto no inventa ni cambia una cantidad. No se repite el descuento si las dimensiones o secciones ya son netas. Tampoco se multiplica por las capas cuando la altura ya representa todo el relleno.

El metrado compactado no se incrementa con esponjamiento. Las conversiones a material suelto de suministro requieren sustento separado en el análisis de costo o en su partida de suministro, sin alterar automáticamente la geometría compactada. Un factor anterior guardado se señala para revisión y puede quitarse expresamente desde la ayuda.

### Relleno alrededor de estructuras: grupos rápidos

En el desplegable de Descripción puedes elegir **Relleno de zapata · agregar grupo**, **Relleno de viga de cimentación · agregar grupo** o **Relleno de cimiento corrido · agregar grupo**. La aplicación inserta un rótulo editable sin sombreado, una fila positiva de excavación y filas negativas de descuento, todas sin dimensiones inventadas. Solado y zapata se distinguen porque no necesariamente tienen la misma planta ni espesor. La columna N.º de veces ya contiene -1 en los descuentos, mientras Elem. simil. conserva cantidades positivas.

Identifica el elemento y eje en el rótulo, introduce su cantidad en la excavación y completa largo, ancho y altura en cada volumen. Las deducciones toman automáticamente la cantidad de elementos de esa excavación. Si escribes una cantidad propia en F de un descuento, se desvincula solo esa fila. Las demás siguen vinculadas. Cambiar unidades o dimensiones no copia automáticamente datos de otra partida.

Un detalle vacío de la plantilla se reemplaza por el grupo. Si la fila ya contiene medidas, fórmulas, cantidades modificadas o una descripción personalizada, se conserva y el grupo nuevo se inserta debajo. Elige la cantidad real de elementos, no el número de capas de compactación. Elimina descuentos no aplicables con Eliminar fila; puedes agregar más filas de descuento o separadores desde la cinta.

Revisar metrado advierte cuando una excavación del grupo ya tiene volumen pero quedan descuentos pendientes: el total es parcial hasta completarlos o eliminar los que no existen. Si se elimina la excavación de referencia sin sus deducciones, se avisa de la referencia perdida; no se sustituye silenciosamente por una cantidad de 1.

Se descuenta solo la porción de solado, zapata, columna, viga, cimiento o tubería que ocupa el vacío considerado. No restar el volumen completo de una columna si parte queda sobre el nivel final de relleno. No repetir en zapatas y vigas el mismo encuentro, ni descontar otra vez lo que ya se excluyó mediante dimensiones netas. La captura proporcionada ilustra el criterio correcto, pero su total de 9,29 m³ no puede verificarse porque el desglose continúa fuera de la imagen.

## Referencias

- Norma adjunta, apartado OE.2.1.3, texto extraído en el catálogo local. [Copia oficial en SPIJ](https://spij.minjus.gob.pe/Graficos/Peru/2011/Mayo/18/RD-073-2010-VIVIENDA-VMCS-DNC.pdf).
- Misma norma, OE.2.1.4.1, OE.2.1.4.2 y HU.2.1.3: rellenos compactados, vacíos netos y terraplenes. Se contrastó el extracto oficial indexado con el catálogo de la norma adjunta.
- [Guía técnica alojada en MINAM](https://redrrss.minam.gob.pe/material/20090128200240.pdf), apartado de volumen a partir de áreas extremas, p. 108. Se consultó el extracto oficial indexado; sus ejemplos no sustituyen las secciones topográficas del proyecto.
