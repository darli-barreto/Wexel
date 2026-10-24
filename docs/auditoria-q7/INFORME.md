# Compatibilidad con el metrado del ingeniero

Revisión del 24 de octubre de 2026. Archivo: `Prueba-Base-Plantilla_de_Metrados_Q7_ENERO_2022.xlsm`. SHA-256: `d04b8a7960401bcb6cad5405a766ef26155f18cb45a29c46b54466280fa41891`.

## Resultado

Wexel tiene capacidad aritmética para reproducir todos los resultados numéricos calculados con fórmulas guardadas en este archivo. Todavía no ofrece una reproducción integral de este libro mediante importación ni todos sus métodos como entradas guiadas. Reproducir el archivo, validar su criterio constructivo y simplificar su elaboración son tres comprobaciones diferentes.

La comparación se hizo ejecutando las fórmulas originales en el motor real de Wexel contra los resultados guardados por Excel. Además se cambiaron medidas de oficina y cantidades de acero en matrices desechables: los resultados dependientes se actualizaron. El archivo original no se guardó, sus macros no se ejecutaron y no se sustituyó el proyecto del usuario ni el ejemplo Q7 anterior.

| Evidencia | Resultado |
|---|---|
| Hojas | Metrado, Acero, RESUMEN; Param y Menu ocultas |
| Inventario de Metrado | 203 títulos y partidas; 146 filas con unidad declarada |
| Partidas con total registrado | 54; las otras 92 filas con unidad no tienen un total guardado |
| Metrado | 381 de 381 fórmulas coinciden |
| Acero | 102 de 102 fórmulas numéricas coinciden |
| Fórmulas restantes | 15 enlaces de texto de cabeceras con IF, referencias entre hojas y una concatenación; no admitidos literalmente por el motor actual |
| Total de fórmulas inspeccionadas | 498; 483 numéricas reproducidas y 15 enlaces de texto no reproducidos |
| Relación Acero–Metrado | Los totales registrados de las siete partidas de acero coinciden entre ambas hojas |
| Relación Resumen–Metrado | Una diferencia por encima de la tolerancia de presentación de 0,0051; ver hallazgo siguiente |

Estos recuentos describen este archivo, no todos los casos posibles de Excel ni un porcentaje de cumplimiento normativo. Las 92 partidas sin total no deben transformarse en cero ni completarse inventando medidas. Hay filas de detalle que tienen dimensiones pero carecen de fórmula de resultado: por ejemplo, la columna C-03 en la fila 190.

## Hallazgos que afectan la reproducción

1. **Resumen desactualizado:** la partida `O.E.01.01.01.04`, cartel de obra, tiene 22 und en `Metrado!P33` y 1 und en `RESUMEN!G23`. El detalle `Metrado!J34` contiene 22. La app debe conservar la trazabilidad y señalar la discrepancia, no copiar indistintamente ambos totales ni decidir sin sustento si la cantidad correcta es 1 o 22. Su resumen actual ya se genera desde el metrado.
2. **Códigos personalizados:** el archivo utiliza códigos `O.E.01...`. No se deben convertir mecánicamente en identificadores de la norma: por ejemplo, su excavación está numerada `O.E.02.01.01`. Una importación debe conservar el código de proyecto y vincular por separado la referencia normativa comprobada.
3. **Campos reutilizados:** un mismo lugar de la cuadrícula significa ancho, área acumulada, perímetro, longitud inclinada, coeficiente de concreto o cantidad de piezas por m² según la fila. El motor calcula el producto, pero el usuario necesita rótulos y unidades por método. No conviene seguir resolviéndolo con alturas ficticias de 1.
4. **PRODUCT ignora blancos:** es la razón por la que el ingeniero puede multiplicar un área en G por una altura en I dejando H vacía. El motor Wexel reproduce esa operación nativa. La entrada guiada debe pedir los datos del método elegido, sin asumir que todo blanco representa 1 ni que toda fila incompleta está terminada.
5. **Comentarios históricos:** J96 y J103 dicen “factor de esponjamiento”, pero en esas filas de relleno valen 1 y sus descripciones son descuentos de concreto. El texto del comentario no prueba que se esté aplicando esponjamiento. J118/J123 conservan comentarios sobre caras de encofrado aunque sus filas descuentan sobrecimiento. Los comentarios deben revisarse junto con fórmula, valor, unidad y contexto.
6. **Elementos heredados:** los nombres `ACU` y `MANOOBRA` contienen `#REF!`; `SUSTMET` depende de un presupuesto externo. No aparecen errores en los valores guardados de las celdas inspeccionadas, pero esto no verifica las macros ni los vínculos externos. No se necesita portar las macros para reproducir las 483 fórmulas numéricas observadas.
7. **Ejemplo anterior diferente:** el ejemplo que ya se prueba en la app usa otro archivo y otra huella. El extractor antiguo reconoce códigos numéricos y unidades en los detalles; este libro usa prefijos `O.E.` y omite la unidad en las filas de cálculo. Reutilizarlo sin adaptación perdería contenido.

## Métodos observados y cobertura de la app

«Posible con fórmula» significa que existe una vía manual en el lienzo, no que ya exista un asistente especializado ni que esté verificada toda la partida.

| Trabajo / fuente original | Qué hace el ingeniero | Cobertura actual | Mejora necesaria para simplificar |
|---|---|---|---|
| Oficinas, almacenes y caseta; filas 20–24 | Cantidad × largo × ancho | Área y detalles disponibles | Reutilizar dimensiones por ambiente, sin volver a digitarlas en acabados |
| Globales, EPP y PSST; filas 26, 57–74 | Cantidad global con descripción de alcance | Unidad glb y opciones disponibles | Mantener alcance verificable; no confundir global con cada recurso |
| Cercos; filas 29–31 | Cantidad × longitud | Disponible | Conservar tipo y altura como descripción/especificación |
| Limpieza; filas 37–41 | Área de intervención y volumen a eliminar con factor | Referencias de área y esponjamiento sustentado disponibles | Comparar el alcance contractual de limpieza para no duplicar eliminación |
| Replanteo; filas 49–55 | Sectores / áreas de replanteo | Disponible | No sumar superficie general con su propio desglose |
| Excavación; filas 77–91 | Prismas y áreas de geometría irregular | Prisma, secciones y fórmulas disponibles | Método general «área en planta × profundidad» con rótulos propios |
| Relleno; filas 92–124 | Excavación menos solado, zapata, columnas y cimientos; grupos por eje | Grupos y descuentos; columna y cimiento por área × altura disponibles | Relaciones por elemento reutilizables y control de encuentros; el grupo actual vincula cantidades, no toda la geometría entre partidas |
| Excedente; filas 125–127 | `(excavación − relleno propio) × 1,25` | Fórmulas con referencias y factor sustentado disponibles | Elegir partidas origen por nombre y vínculo estable, sin escribir referencias de celda |
| Concreto simple; filas 130–151 | Volumen o superficie según unidad | Posible con métodos actuales | Métodos con rótulos de área, espesor y unidad efectiva |
| Columnas L/T; filas 188, 189, 193 | Área real de sección × altura × cantidad | Posible en lienzo; descuento por sección disponible | El calculador general de columnas sigue usando ancho × espesor: falta área y perímetro independientes para secciones irregulares |
| Encofrado de columnas; fila 200 | Perímetro efectivo × altura libre × cantidad | Posible con fórmula / área | Método propio «perímetro × altura», superficies de contacto y caras realmente encofradas |
| Vigas; filas 230–304 | Área de concreto, perímetro de contacto, descuentos y acero | Operaciones manuales disponibles | Asistente de viga, área/perímetro independientes y encuentros |
| Losa aligerada; filas 308–346 | Área de paño × 0,0875 m³/m²; piezas por m² 8,33; longitudes inclinadas | Posible mediante fórmulas; el calculador existente es de losa maciza | Método explícito de coeficiente volumétrico y densidad de casetones; no tratarlos como altura o repeticiones genéricas |
| Escalera; filas 351–368 | Grupos de pasos, contrapasos, descansos y superficies de encofrado | Posible con detalles, rótulos y fórmulas | Asistente por tramo con geometría y superficies diferenciadas |
| Acero; Metrado y Acero | Cantidades, longitudes, ganchos, empalmes, kg/m y subtotales por diámetro | Motor numérico, calculadores y hoja de acero disponibles | Importar todas las líneas de este archivo y comprobar correspondencia entre las dos representaciones; no confundirlo con el ejemplo anterior |
| Tarrajeos, derrames y otros acabados; desde fila 410 | Áreas/perímetros por ambiente, vanos y caras | Posible con fórmulas y detalles | Reutilización de ambientes y vanos, descuentos de aberturas y método de caras expuestas |
| Sanitaria y eléctrica; desde filas 791 y 894 | Catálogo y detalles principalmente sin resultados terminados | Unidades m, und y pto y catálogo disponibles | No hay evidencia completa en este libro para validar cantidades finales; se necesitan planos/casos medidos |
| Presentación | Hojas de impresión con cabeceras repetidas | Vista de documento y exportación Word disponibles | Comparación visual de este caso importado y control de saltos; esta auditoría numérica no sustituye esa comprobación |
| Apertura del archivo | Libro XLSM con VBA | La importación de proyectos de la app es JSON | Importador XLSX/XLSM que lea fórmulas y datos sin ejecutar VBA, con revisión previa y respaldo |

## Orden propuesto de implementación

### Ampliación implementada después de la auditoría

El catálogo de rellenos ahora ofrece los descuentos observados de solado y zapata juntos, cimiento por tramo/área acumulada, columnas, VC y sobrecimiento, además de VC con tecnopor y tecnopor individual de la captura posterior del usuario. Los grupos nuevos de vigas incluyen excavación, VC y tecnopor, cimiento corrido y sobrecimiento enterrado. La prueba de hoja verifica los cuatro volúmenes, sus distintos métodos y cabeceras y el relleno neto de 1,230 m³. Las mediciones guardadas no se alteran automáticamente. Esto implementa la ampliación de descuentos, no el importador ni todos los asistentes pendientes descritos a continuación.

1. **Referencia completa y reproducible:** adaptar un importador al esquema real, identificar todas las partidas y conservar datos originales, rótulos, fórmulas, vínculos y procedencia. Antes de sustituir un proyecto, mostrar diferencias y conservar respaldo. Mantener este archivo como caso de prueba separado del ejemplo antiguo.
2. **Catálogo central de métodos:** cantidad directa; longitud; largo × ancho; largo × ancho × alto; área × altura; perímetro × altura; áreas de secciones × distancia; área × coeficiente volumétrico; área × piezas/m². Cada método define entradas, unidades, cabecera compacta, fórmula, validación, sombreado y explicación. Esto evita parches específicos por nombre de partida.
3. **Elementos compartidos:** registrar una zapata, columna, viga, paño o ambiente una sola vez y reutilizar su geometría en excavación, concreto, encofrado, acero y relleno. Una edición debe actualizar los vínculos y mantener independientes los ajustes deliberados del usuario. No deducir superposiciones automáticamente sin geometría o un dato explícito del proyectista.
4. **Asistentes faltantes:** viga, losa aligerada, escalera, acabados/vanos y sección irregular con área/perímetro. Emplear las mismas operaciones del catálogo; no otro lienzo o una calculadora paralela.
5. **Conciliación y entrega:** comparar por partida y unidad Metrado–Acero–Resumen; probar cambios reales, filas incompletas, negativos, precisiones y reordenamientos; revisar el documento final. Los controles actuales verifican aritmética y valores guardados, no la geometría de AutoCAD ni la correspondencia con planos que no se han suministrado.

## Clases

Se identificaron las 21 clases de la [lista pública compartida](https://www.youtube.com/playlist?list=PLgLQ5Nt1OkUrxsvXCQl214qPuKR9queZ3), con duración conjunta de 40 h 21 min. Los reproductores públicos anuncian subtítulos automáticos en español, pero las peticiones de texto devolvieron contenido vacío. No se han transcrito ni estudiado las 21 clases y no se atribuyen al docente criterios obtenidos solo del Excel. La clase 21 se titula sobre el uso de la plantilla financiera Q7; su contenido no se infiere de ese título.

Con subtítulos o transcripciones accesibles se podrá añadir, por clase, temas, marcas de tiempo, criterio de medición, relación con filas del archivo y mejoras concretas. No hace falta reproducir íntegramente el discurso para extraer los procedimientos y comprobarlos con el archivo.

## Evidencia y pruebas

- [Inventario completo de 203 títulos y partidas](PARTIDAS.md).
- [Lista de las 21 clases y estado del texto](CLASES.md).
- `libro-ingeniero.json`: valores guardados, fórmulas, comentarios, referencias de origen y estructura.
- `conciliacion-formulas.json`: resultado por fórmula, valor esperado y valor calculado por Wexel.
- `controles-cruzados.json`: comparación entre Metrado, Acero y Resumen.
- `tests/engineerReference.test.cjs`: comparación numérica y cambios reales de dimensiones/cantidades, sin modificar el archivo.

La auditoría está completada para el contenido disponible del libro y la disponibilidad pública del curso. La importación integral, los asistentes nuevos y el análisis hablado de las clases permanecen pendientes; este documento no los presenta como funciones ya implementadas.
