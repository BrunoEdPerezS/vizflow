## Context

Vizflow arranca exclusivamente desde CLI (`vizflow archivo.mmd`). El main process (`src/main/main.js`) no tiene menú nativo, no permite abrir archivos desde la UI, y crashea si se lanza sin argumentos. Para ser una app de escritorio usable, necesita un menú `Archivo > Abrir` con diálogo nativo de selección de archivos.

Actualmente `filePath` se asigna en `app.whenReady()` y nunca cambia. El file watcher se inicia una vez sobre ese path. El renderer (`app.js`) carga el contenido en `init()` y escucha `file:external-change` para cambios externos, pero no tiene mecanismo para recibir un cambio completo de archivo.

**Restricciones:**
- `nodeIntegration: true, contextIsolation: false` — el renderer tiene acceso directo a `require`
- Monaco Editor usa AMD loader que sobrescribe `window.require`
- El IPC usa `ipcMain.handle`/`ipcRenderer.invoke` (request/response) y `webContents.send`/`ipcRenderer.on` (push)

## Goals / Non-Goals

**Goals:**
- Menú nativo `Archivo > Abrir...` con atajo `Ctrl+O`
- Diálogo de selección de archivos filtrado a `*.mmd`
- Carga completa del archivo seleccionado (editor, diagrama, tema, watcher)
- Título de ventana: `Vizflow - nombrearchivo.mmd`
- Lanzamiento sin argumentos: crear `untitled.mmd` temporal (no crashea)

**Non-Goals:**
- No se implementa `Archivo > Nuevo`, `Guardar como`, ni `Cerrar`
- No se agrega menú `Editar`, `Ver`, ni `Ayuda`
- No se cambia el comportamiento de doble-click en `.mmd` (file association existente)

## Decisions

### 1. Menú en main process, no en renderer

**Decisión:** Construir el menú con `Menu.buildFromTemplate()` en `main.js` y setearlo con `Menu.setApplicationMenu()`.

**Alternativa:** Crear un menú HTML/CSS custom en el renderer. Requeriría `-webkit-app-region: no-drag` y manejo de focus complejo. No se vería nativo.

**Racional:** Electron expone `Menu` nativo del SO. En Windows se ve como menú de ventana estándar. Funciona con aceleradores (`accelerator`) y roles (`role: 'quit'`).

### 2. Diálogo `showOpenDialog` en main process

**Decisión:** El `click` handler del menú llama a `dialog.showOpenDialog(mainWindow, ...)` directamente en el main process.

**Alternativa:** IPC `file:open` donde el renderer pide al main que abra el diálogo. Agrega un round-trip innecesario.

**Racional:** El menú se ejecuta en el main process. No hay razón para pasar por IPC para abrir un diálogo nativo.

### 3. `webContents.send('file:open-result')` para notificar al renderer

**Decisión:** Después de leer el archivo nuevo, el main process envía `{ filePath, content }` al renderer vía `webContents.send`. El renderer tiene un listener `ipcRenderer.on('file:open-result', ...)`.

**Alternativa:** El renderer podría hacer polling o usar `ipcRenderer.invoke('get:filepath')`. Más complejo y no garantiza sincronización.

**Racional:** Push unidireccional. El renderer no necesita responder. El patrón es idéntico al `file:external-change` existente.

### 4. Función `loadFile(newPath)` que orquesta el cambio

**Decisión:** Una función en `main.js` que: (1) `stopWatcher()`, (2) actualiza `filePath`, (3) `updateWindowTitle()`, (4) `startWatcher(...)`, (5) lee el archivo, (6) envía `file:open-result`.

**Racional:** Centraliza la lógica de cambio de archivo. Reusable si en el futuro se agrega `Archivo > Nuevo` o arrastrar archivos a la ventana.

### 5. Lanzamiento sin args: archivo temporal en `app.getPath('temp')`

**Decisión:** Si `process.argv` no contiene un `.mmd`, crear `untitled.mmd` en el directorio temporal del SO con el template por defecto.

**Alternativa:** Mostrar una pantalla de "bienvenida" sin archivo. Más trabajo de UI y el editor Monaco espera contenido.

**Racional:** La app necesita un archivo para funcionar (Monaco, Mermaid, file watcher). Un temporal cumple ese rol sin dejar basura permanente.

## Risks / Trade-offs

- **[Riesgo] Listener duplicado de `file:external-change`**: Actualmente `init()` registra el listener. Si se llama `loadFile` y se vuelve a registrar, habría múltiples listeners. → **Mitigación**: Usar `ipcRenderer.removeAllListeners('file:external-change')` antes de registrar, o mover el listener fuera de `init()` para que se registre una sola vez.
- **[Riesgo] El archivo temporal `untitled.mmd` persiste**: Si el usuario cierra sin guardar, el archivo temporal queda en `%TEMP%`. → **Mitigación**: El SO limpia `%TEMP%` periódicamente. El archivo es mínimo (~200 bytes). Alternativa futura: limpiar en `before-quit`.
