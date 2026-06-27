## Why

El usuario necesita visualizar diagramas, ideas y planes discutidos con un LLM de forma gráfica e instantánea. Las herramientas existentes (Mermaid Live en browser, extensiones de VSCode) no permiten que un LLM edite el mismo archivo y vea el resultado reflejado en vivo en una ventana nativa. Se requiere una herramienta cross-platform, nativa, donde el archivo `.mmd` sea la fuente única de verdad compartida entre humano y LLM, con renderizado instantáneo, sin depender de paquetes del sistema operativo.

## What Changes

- Nueva app nativa de escritorio (`vizflow`) usando Electron + Chromium
- Editor Monaco (el mismo de VSCode) con syntax highlighting para Mermaid
- Mermaid.js bundleado offline (dependencia npm, sin CDN)
- File watching nativo (`fs.watch`) que permite al LLM editar el archivo y ver cambios reflejados instantáneamente
- Bridge IPC Electron (main ↔ renderer) para I/O de archivos y comunicación bidireccional
- Soporte de anotaciones en el diagrama mediante sintaxis `%%#` (notas generales) y `%%@` (anotaciones por nodo, v2)
- Export a SVG y PNG del diagrama renderizado
- Tema dark/light toggle
- Interfaz CLI: `vizflow archivo.mmd`
- Distribución cross-platform: `.exe` (Windows), `.dmg` (macOS), `.AppImage`/`.deb` (Linux)

## Capabilities

### New Capabilities
- `live-mermaid-editor`: Editor Monaco con preview Mermaid.js renderizado en vivo en ventana nativa Electron, con syntax highlighting, temas dark/light
- `file-sync-bridge`: Sincronización bidireccional entre renderer y sistema de archivos mediante IPC de Electron + `fs.watch()` nativo; el LLM edita el archivo y los cambios se reflejan en la UI sin recarga manual
- `diagram-annotations`: Sistema de anotaciones sobre el diagrama usando sintaxis `%%#` (sticky notes generales) y `%%@` (anotaciones ligadas a nodos específicos, v2)
- `diagram-export`: Exportación del diagrama renderizado a formatos SVG y PNG mediante diálogos nativos de Electron
- `app-cli`: Interfaz de línea de comandos para abrir archivos `.mmd` directamente desde la terminal

### Modified Capabilities
<!-- No existing capabilities to modify -->

## Impact

- **Dependencias nuevas (npm)**: `mermaid`, `monaco-editor`, `js-yaml`
- **Dependencias de desarrollo (npm)**: `electron`, `electron-builder`
- **Nuevo módulo**: `vizflow/` en la raíz del proyecto (Electron app)
- **Sin impacto en código existente**: proyecto greenfield dentro de Vizflow
- **Build artifacts**: generados por `electron-builder` para Windows, macOS, Linux
