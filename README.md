# Wexel

Wexel es una aplicación web que simula las funcionalidades de Microsoft Excel y Word, proporcionando una interfaz intuitiva para editar documentos y hojas de cálculo directamente en el navegador.

## Características

- **Interfaz de Excel**: Crea y edita hojas de cálculo con herramientas avanzadas como formato condicional, estilos de celda, inserción/eliminación de celdas, y más.
- **Interfaz de Word**: Edita documentos de texto con opciones de formato, alineación, listas, y herramientas de revisión.
- **Herramientas de Navegación**: Incluye barras de herramientas para navegación, edición, y compartir.
- **Componentes Reutilizables**: Construido con componentes modulares para una experiencia fluida.
- **Optimizado para Web**: Utiliza Next.js para un rendimiento rápido y responsive.

## Tecnologías Utilizadas

- **Next.js**: Framework de React para aplicaciones web.
- **TypeScript**: Para un desarrollo más robusto y tipado.
- **Tailwind CSS**: Para estilos y diseño responsivo.
- **ESLint**: Para mantener la calidad del código.

## Instalación

1. Clona el repositorio:
   ```bash
   git clone https://github.com/tu-usuario/wexel.git
   cd wexel
   ```

2. Instala las dependencias:
   ```bash
   npm install
   # o
   yarn install
   # o
   pnpm install
   ```

3. Ejecuta el servidor de desarrollo:
   ```bash
   npm run dev
   # o
   yarn dev
   # o
   pnpm dev
   ```

4. Abre [http://localhost:3000](http://localhost:3000) en tu navegador para ver la aplicación.

## Uso

- Navega entre las vistas de Excel y Word usando la barra de navegación.
- Utiliza las herramientas en las barras superiores para formatear celdas, texto, y documentos.
- Guarda y comparte tus documentos directamente desde la interfaz.

## Estructura del Proyecto

- `app/`: Páginas y layouts de Next.js.
- `components/`: Componentes reutilizables, incluyendo CanvaExcel, CanvaWord, y herramientas específicas.
- `ui/`: Componentes de interfaz de usuario como navegación y búsqueda.
- `utils/`: Utilidades auxiliares, como funciones para Excel.
- `public/`: Archivos estáticos, incluyendo iconos.

## Contribuir

¡Las contribuciones son bienvenidas! Por favor, abre un issue o envía un pull request.

## Licencia

Este proyecto está bajo la Licencia MIT.
