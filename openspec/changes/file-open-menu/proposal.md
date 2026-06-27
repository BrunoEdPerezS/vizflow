## Why

Vizflow solo puede abrir archivos pasándolos como argumento por CLI (`vizflow archivo.mmd`). No existe un menú nativo ni forma gráfica de abrir un diagrama distinto sin cerrar y reabrir la app. Además, si se lanza sin argumentos, la app crashea con un diálogo de error. Una app de escritorio debe permitir navegar y abrir archivos desde su interfaz.

## What Changes

- Nuevo menú nativo `Archivo > Abrir...` (Ctrl+O) que muestra un diálogo de selección de archivos filtrado a `*.mmd`
- Al seleccionar un archivo, la app carga su contenido: actualiza el editor, re-renderiza el diagrama, sincroniza el tema, y actualiza el file watcher
- El título de la ventana refleja el archivo actual (`Vizflow - archivo.mmd`)
- La app ya no crashea al lanzarse sin argumentos: crea un `untitled.mmd` temporal
- Nuevo canal IPC `file:open-result` para notificar al renderer del cambio de archivo

## Capabilities

### New Capabilities

- `native-menu`: La app muestra una barra de menú nativa con `Archivo > Abrir...` (Ctrl+O) y `Archivo > Salir`
- `file-open-dialog`: El usuario puede abrir cualquier archivo `.mmd` desde un diálogo nativo del SO, y la app reemplaza el diagrama actual con el nuevo contenido

### Modified Capabilities

- `app-cli`: Lanzar `vizflow` sin argumentos ya no muestra un error ni crashea; en su lugar, crea un archivo temporal `untitled.mmd` con el template por defecto

## Impact

- `src/main/main.js`: Importar `Menu` y `dialog`, construir menú, funciones `openFileDialog()` y `loadFile()`, permitir no-arg launch
- `src/renderer/app.js`: Listener `file:open-result` para recargar contenido al cambiar de archivo
