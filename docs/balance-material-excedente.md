# Balance de material excedente

En la plantilla OE.2, «Eliminación de material excedente» incluye:

1. **Volumen de excavaciones**, positivo, vinculado a las partidas medibles del capítulo normativo de excavaciones del mismo grupo de movimiento de tierras.
2. **Descuento · Volumen de relleno con material propio**, negativo, vinculado al relleno propio del mismo grupo. No resta relleno con material de préstamo.

Ambas líneas comienzan con factor **1,25**, asignado expresamente por el usuario para este ejemplo. No es un valor universal de la norma. Se puede editar en **H**, según el material y expediente. **G** muestra el volumen base vinculado en m³; **J** contiene el signo/repeticiones. No hay dimensiones ficticias: el parcial es `F × G × H × J` y el factor se aplica una sola vez.

El balance resulta `(excavación − relleno propio) × 1,25` cuando las dos líneas usan ese mismo factor y cantidad 1. Las bases volumétricas deben ser compatibles; no aplicar el factor de nuevo a un volumen ya esponjado. La relación no demuestra por sí sola la procedencia de todos los materiales de una obra ni incorpora cortes fuera de las partidas de excavaciones seleccionadas por esta plantilla.

Los vínculos se resuelven por referencia normativa original y grupo, no por código de presentación ni por posición fija de celda. Renumerar o eliminar una partida actualiza las fórmulas. Las partidas de préstamo y las de otros grupos quedan fuera. Los orígenes vacíos permanecen pendientes; no se inventa un cero. La revisión de metrado avisa si el balance tiene líneas pendientes y su total es parcial.

Para proyectos antiguos con las dos filas de ejemplo completamente intactas se sustituye el ejemplo vacío por estas líneas, conservando las demás mediciones. Los textos personalizados, cantidades y eliminaciones del usuario no se sobrescriben. Si el ejemplo no se añadió automáticamente, el desplegable de un detalle de eliminación ofrece **«Excedentes · excavación menos relleno propio × 1,25»**. Agrega el balance sin borrar los detalles existentes y no lo duplica si ya existe; evita sumar además mediciones manuales del mismo alcance.

Si se escribe un volumen propio en G, esa línea pasa a volumen base manual, conserva su factor y deja de seguir las partidas. Los factores de ambas líneas son independientes: para usar un único coeficiente, mantener el mismo en las dos. Los vínculos, factores y signos se guardan; el resultado actualiza el Resumen, CSV y la vista de presentación.

Ejemplo numérico sin decimales ocultos: excavación 197,83 m³, relleno propio 6,54 m³. Diferencia 191,29 m³. Por 1,25: **239,1125 m³**, mostrado como **239,11 m³**. El 239,12 m³ de la captura puede proceder de valores internos más precisos; no se altera la fórmula para forzar esa centésima ni se redondean los parciales antes de sumar.
