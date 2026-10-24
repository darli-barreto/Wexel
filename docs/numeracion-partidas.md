# Numeración al eliminar partidas

Eliminar una partida cierra el salto entre las partidas numéricas del mismo nivel y padre. Si cambia el código de un capítulo, se actualiza el prefijo de todos sus descendientes. Las otras ramas conservan sus códigos. Borrar únicamente detalles o filas libres no renumera las partidas.

Ejemplo: al eliminar el código de proyecto `OE.1.1.1.4` (Comedores), Vestuarios pasa de `OE.1.1.1.5` a `OE.1.1.1.4`, Servicios Higiénicos de `.6` a `.5`, y así sucesivamente. El modelo, el lienzo, el resumen y la impresión usan estos códigos de proyecto.

La referencia normativa (`norma.id`, `norma.code`, páginas y unidades previstas) se conserva. Vestuarios seguirá vinculado al apartado original `OE.1.1.1.5`. La descripción, identificadores internos, medidas y fórmulas de las partidas conservadas no se cambian por renumerarlas.

Los números mantienen su ancho y los prefijos/sufijos configurados. Las filas especiales BASE y las alternativas de proyecto -A no consumen posiciones numéricas; una alternativa vinculada conserva su relación cuando cambia el código de su partida de origen.

Al abrir proyectos anteriores, se corrigen los saltos de las ramas normativas donde falta una partida conocida del catálogo. No se restauran las partidas eliminadas ni se renumeran especialidades raíz que no se incluyeron en el proyecto. Esta reparación es idempotente.

La acción «Eliminar fila» muestra una notificación Sonner de tipo promise: primero indica que se están eliminando filas y reordenando partidas, y después confirma la actualización de la hoja y el resumen o muestra un error. Se permite pintar el aviso antes del cálculo, sin añadir una demora artificial. Durante la operación se desactiva el botón para evitar dobles eliminaciones. Si la selección, la hoja o los datos cambian antes de ejecutar la eliminación, se cancela la acción. Las cabeceras se conservan y muestran un aviso informativo cuando se intenta eliminarlas.

El aviso de eliminación entra sin animación de desplazamiento y se deja legible durante al menos 600 ms antes de mostrar el resultado. Este mínimo afecta solo a la notificación: la eliminación y el desbloqueo del botón ocurren al terminar el cálculo. Sonner registra primero el estado de carga; el trabajo comienza después de permitir su renderizado y pintado. Cada operación utiliza su propio identificador para que una confirmación anterior no sustituya el aviso de una nueva eliminación.
