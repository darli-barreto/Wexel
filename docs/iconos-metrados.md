# Iconos de la cinta Metrados

Familia de 28 iconos de 16 × 16 px, con trazo de 1 px, grafito `#444444` y acento celeste `#6DB3DE`, siguiendo los iconos originales de ARM Structural. Incluye los estados alternativos de expandir/contraer y probar/restaurar.

En reposo se utiliza la variante inactiva: solo cambia `#444444` por `#7F7F7D`, incluido el interior de los SVG originales embebidos. El celeste y los demás colores permanecen intactos. En hover, foco de teclado o pulsación se muestra la variante activa. Ambos estados están precargados y ocupan el mismo espacio para evitar saltos o cargas al mover el mouse. El hover es `#d9d9d9`, sin redondeado, con 4 px de padding lateral en los botones principales y sin padding en los secundarios.

La muestra editable está en [ARM Structural · Metrados](https://www.figma.com/design/xkPLnbMCDYbMRa60ljVLiT/ARM-Structural?node-id=101-160). Los componentes principales están en el contenedor `101:18`; los iconos originales permanecen en `Icons` (`1:2`). La muestra usa instancias, y los componentes tienen colores vinculados a variables de la colección `Wexel · Iconos`.

## Archivos y mantenimiento

La distribución se define en `components/header-tools/NavMetrado.tsx`, siguiendo el patrón de NavHome: Normativa, Agregar, Resumen, Calcular, Hoja metrado, Hoja de acero, Metrado acero, Estribos, Losa maciza, Columna, Madera, Encabezado, Importar, Exportar y Exportar CSV son acciones principales con etiqueta visible. Limpiar metrado comparte una columna secundaria con Estilos hoja. Diseño hoja se eliminó por abrir el mismo formulario que Encabezado. Las acciones secundarias se agrupan por función en columnas de dos filas, sin texto visible. Todos los botones tienen un nombre accesible y una descripción nativa al posar el mouse (`aria-label` y `title`). El atributo `primary` de `MetradoTool` controla cuáles muestran su etiqueta y usan el tamaño de 32 px; los secundarios usan 20 px.

- `design/metrados-icons.json`: nombres, etiquetas, geometrías nuevas y colores de la familia.
- `design/figma-metrados-state.json`: correspondencia entre cada icono y su componente de Figma.
- `public/icons/metrados/`: recursos locales que utiliza la aplicación.
- `public/icons/metrados/source/`: vectores originales descargados desde el contexto de Figma, sin modificar sus dimensiones.
- `components/metrados/MetradoIcon.tsx`: presentación común, decorativa, con iconos principales de 32 px en un espacio de 32 px; los secundarios usan 20 px en un espacio de 24 px. No se suscribe a la selección de celdas.

`node scripts/build-metrado-icons.cjs` regenera los archivos locales desde los diseños guardados. Los cambios posteriores hechos directamente en Figma requieren actualizar primero sus exportaciones o las definiciones de origen; no hay sincronización automática.

Se reutilizaron las geometrías originales de losa (`1:175`), columna (`1:244`), jerarquía (`68:5`), hoja de acero (`64:216`) y hoja de metrado (`64:177`). Los tres primeros conservan sus SVG originales, con las posiciones y tamaños del contexto de diseño. Las hojas técnicas combinan sus cuatro SVG originales en sus posiciones nativas con las letras ACE/MET convertidas a contornos desde Haettenschweiler Regular, la misma fuente del diseño. No se distribuye la fuente ni se necesita instalarla para utilizar la aplicación.

Solo para regenerar los contornos tipográficos se utiliza `scripts/outline-metrado-labels.py`, con fontTools y acceso a la fuente original. El resultado vectorial queda guardado en `design/metrado-label-outlines.json`; esta herramienta no se ejecuta en la aplicación ni en su compilación.

Todos los recursos se sirven localmente, sin llamadas a Figma, enlaces temporales, fuentes de iconos, bibliotecas adicionales de interfaz ni animaciones.

## Alcance de verificación

Se comprobó la muestra de los 28 componentes en Figma. Después, el plan Starter agotó su cuota de llamadas MCP y bloqueó la exportación de la familia completa y una consulta adicional de contexto. La integración utiliza los diseños SVG nuevos que se importaron al archivo y los recursos originales ya devueltos por el contexto de Figma. Las letras ACE/MET se resolvieron localmente como contornos; no pudo hacerse una comparación vectorial posterior con la exportación completa de esos dos componentes por el mismo límite.

La verificación de la aplicación revisa la carga de recursos, tamaño efectivo, alineación, nombres accesibles de los botones y los estados alternativos de la cinta. Las funciones de metrado y sus datos no se modifican.
