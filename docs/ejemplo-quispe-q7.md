# Ejemplo Quispe Q7 y formato del lienzo

Actualización: Acero ahora reproduce directamente sus partidas originales con desglose por diámetro. La hoja adicional de referencia dejó de ser necesaria. Las descripciones se alinean a la izquierda, las filas son compactas y los bordes son grises. Las reglas actuales están en [la guía del lienzo](guia-colores-y-lienzo.md) y [la auditoría de Acero](auditoria-acero-y-rendimiento.md). Los detalles siguientes documentan la primera versión del ejemplo.

En la cinta **Metrados**, el botón **Probar plantilla Q7** abre el ejemplo del archivo proporcionado. Cambia a **Volver a mi metrado** mientras se usa el ejemplo. Se guarda una copia del modelo y de todas las celdas, fórmulas, hojas, selecciones y dimensiones del metrado anterior. Esa copia persiste al recargar; el regreso restaura el contenido anterior completo. Los cambios de prueba pertenecen al ejemplo y se descartan al regresar. El lienzo Home y los demás espacios permanecen independientes.

## Fuente y cantidades

- Archivo: `C:/Users/Usuario/Desktop/Plantilla_Metrados_Limpia.xlsm`.
- SHA-256: `3ddb033172855f233a6741971e9bc446f7222d68977571917f030ddec7023f03`.
- Se extrajeron 47 títulos/partidas (32 partidas), 158 detalles y 55 líneas de acero de Metrado. Se conservan proyecto, propietario, fecha y especialidad originales.
- Cada total de partida se contrasta con su celda P original. Los 32 coinciden con tolerancia de 0.00000001, sin redondear los cálculos internos.
- El archivo original contiene otro ejemplo independiente en Acero. Se conserva en **Acero referencia Q7**, con sus propias fórmulas y total de 300.716 kg. **Acero** consolida el acero real del Metrado cargado. No se mezclan esos ejemplos ni se reasignan sus códigos contradictorios.
- RESUMEN se genera a partir del Metrado con precisión completa y presentación de dos decimales, como la hoja fuente.

`scripts/extract-q7-example.py` lee el XML del libro, no ejecuta macros y no modifica el XLSM. Genera `components/metrados/data/quispe-example.json`, que incluye procedencia, totales de control y notas de adaptación.

## Adaptaciones explícitas

Las dimensiones de áreas colocadas en Alto en el original se usan como segunda dimensión del cálculo de área. Los espacios de PRODUCT se interpretan como factores omitidos, manteniendo ceros reales. Los volados que usan áreas previas se representan con esas áreas como segunda dimensión.

El acarreo conserva la fórmula original de factor por parcial: en M54 el original no aplica el signo de J54. Se reproduce ese comportamiento sin corregir silenciosamente el resultado. El cubicado de madera tiene fórmulas en pies tablares y se separa del número de tijerales; la unidad auxiliar se muestra como **pie tablar** para no sumarla a und. Se conservan como valores explícitos los resultados manuales M56 y L331 del archivo original.

## Formato

Se aplica formato a las celdas nativas de Metrado, Acero y RESUMEN: centrado horizontal y vertical, Arial 9, ajuste de descripciones, filas dimensionadas para textos, bordes, encabezados grises y colores jerárquicos de Q7. Cantidades y resultados tienen dos decimales de presentación, sin cambiar su precisión. El ancho de descripción inicial es 380 px y sigue siendo editable.

El formato se aplica una vez a hojas existentes y por defecto a filas nuevas. No cambia la interfaz del componente CanvaExcel. Se conservan las dimensiones ajustadas por el usuario y las fórmulas. El formulario **Estilos hoja** aplica colores, marco y fondo a las celdas nativas. Home conserva su presentación original.

## Verificación

Pruebas de integración: coincidencia de los 32 totales con la fuente, recálculo al editar dimensiones, ausencia de errores de fórmula, total independiente de referencia, restauración exacta del trabajo anterior y cambio de estilo sin perder fórmulas ni tamaños.

Se verifica también en navegador la carga del ejemplo, las hojas Metrado/Acero/RESUMEN, la persistencia tras recargar y la acción de volver al metrado previo.

Resultado: 39 pruebas aprobadas y compilación de producción correcta. No se observaron errores de consola. Capturas: [Metrado](capturas/ejemplo-q7-metrado.png), [Resumen](capturas/ejemplo-q7-resumen.png) y [Acero](capturas/ejemplo-q7-acero.png).
