## Why

Vizflow actualmente solo puede abrir un diagrama a la vez. Si el usuario necesita trabajar con múltiples diagramas (ej: un flowchart de arquitectura y un sequence diagram de auth), debe cerrar y reabrir la app cada vez. Una app de escritorio de edición debe permitir gestionar múltiples archivos abiertos simultáneamente en pestañas, como VS Code.

## What Changes

- **Barra de pestañas**: Nueva UI entre el toolbar y el área principal que muestra las pestañas abiertas con el nombre de cada archivo
- **Múltiples archivos abiertos**: `Archivo > Abrir` ahora abre en una nueva pestaña en lugar de reemplazar el diagrama actual
- **CLI con múltiples archivos**: `vizflow file1.mmd file2.mmd` abre todos en pestañas separadas
- **Switching con Alt+1..9**: Cambio rápido entre pestañas con atajos de teclado
- **Modelos Monaco independientes**: Cada pestaña tiene su propio `ITextModel`, preservando historial de undo, cursor y scroll por separado
- **Estado zoom/pan por pestaña**: Cada diagrama mantiene su posición de zoom y pan al cambiar de pestaña
- **Watchers por archivo**: El main process mantiene un file watcher por cada archivo abierto

## Capabilities

### New Capabilities

- `tab-bar`: Barra de pestañas en la UI que muestra los archivos abiertos, permite click para cambiar, botón X para cerrar, y atajos Alt+1..9
- `multi-file`: La app mantiene múltiples archivos abiertos simultáneamente, cada uno con su propio estado de editor, diagrama, zoom/pan y file watcher
- `tab-switching`: El renderer swapea modelos Monaco y re-renderiza el preview al cambiar de pestaña, preservando el estado de cada una

### Modified Capabilities

- `file-open-dialog`: `Archivo > Abrir` ahora abre en nueva pestaña en vez de reemplazar la actual
- `file-open-menu`: El menú `Archivo` ahora incluye `Cerrar pestaña` (Ctrl+W)
- `app-cli`: `vizflow` acepta múltiples archivos `.mmd` como argumentos y los abre todos en pestañas
- `file-sync-bridge`: El file watcher soporta múltiples archivos simultáneamente; los eventos `file:external-change` incluyen `filePath` para ruteo
- `native-menu`: Se agregan atajos Alt+1..9 para cambio de pestaña

## Impact

- `src/main/main.js`: Multi-filePath, multi-watcher, CLI multi-arg, selfSaving Map
- `src/main/file-watcher.js`: addWatcher/removeWatcher, payload con filePath
- `src/main/ipc-handlers.js`: file:read, file:save, get:filepath parametrizados por filePath
- `src/renderer/app.js`: Tab class, TabManager, Monaco model swapping, zoom/pan per-tab, ruteo de external-change
- `src/renderer/index.html`: Nuevo #tab-bar entre toolbar y main-content
- `src/renderer/styles.css`: Estilos de tab bar
