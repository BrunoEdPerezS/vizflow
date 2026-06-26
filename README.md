# Mermaid Live Editor

## 1. Introducción

Aplicación de escritorio Electron para escribir y visualizar diagramas Mermaid en vivo. Monaco Editor a la izquierda, preview renderizado a la derecha. El archivo `.mmd` es la fuente única de verdad compartida entre el usuario y el LLM: ambos pueden editarlo y los cambios se reflejan instantáneamente en la UI.

### 1.1 Motivación

Las herramientas existentes (Mermaid Live en browser, extensiones de VSCode) no permiten que un LLM edite el mismo archivo y vea el resultado reflejado en una ventana nativa. Se requiere un bridge bidireccional donde el `.mmd` funcione como pizarra compartida.

### 1.2 Capacidades

| Feature | Cómo se usa |
|---|---|
| Editor Monaco | Panel izquierdo, syntax highlighting Mermaid, minimap, undo/redo |
| Render en vivo | Cada keystroke dispara `mermaid.render()` — feedback < 50ms |
| Guardado al archivo | Debounce de 500ms tras la última tecla |
| Sincronización con LLM | `fs.watch()` detecta ediciones externas → actualiza editor + preview |
| Sticky notes | Líneas `%%#` → notas flotantes sobre el diagrama |
| Drag & persistencia | Arrastrar nota → escribe `%%# @X,Y texto` en el archivo |
| Export SVG / PNG | Botones en toolbar, diálogo nativo de guardado |
| Tema dark / light | Toggle en toolbar, afecta Monaco + Mermaid + CSS |
| Zoom y pan | Ctrl+Wheel (zoom centrado en cursor), Click+Drag (pan), Fit to Screen |
| Zoom/Pan durante drag de notas | El zoom/pan se preserva al arrastrar notas (no se re-renderiza el diagrama) |
| CLI | `npm start archivo.mmd` — si no existe, se crea con template |
| Distribución cross-platform | `.exe` (Windows), `.dmg` (macOS), `.AppImage`/`.deb` (Linux) |

### 1.3 Stack

| Capa | Tecnología |
|---|---|
| Runtime | Electron 42 (Chromium + Node.js 22) |
| Editor | Monaco Editor 0.55 (AMD loader desde `node_modules`) |
| Diagramas | Mermaid.js 11 (renderizado en renderer process) |
| Parsing | js-yaml 5 (frontmatter), parser custom (`%%#`, `%%@`) |
| IPC | `ipcMain` / `ipcRenderer` nativos de Electron |
| File watching | `fs.watch()` nativo de Node.js |
| Build | electron-builder (NSIS, DMG, AppImage, deb) |

### 1.4 Formato de archivo `.mmd`

```mmd
---
title: System Architecture
theme: dark
---

graph TD
    A[Frontend] --> B[API Gateway]
    B --> C[Auth Service]
    B --> D[Data Service]
    C --> E[(DB)]

%%# @200,50 Entry point for all client requests
%%# @350,180 Handles JWT validation
%%# Architecture v2 — review before Q3
```

| Sintaxis | Significado |
|---|---|
| `---` delimiters | YAML frontmatter (`title`, `theme`) |
| `%%#` | Anotación general (sticky note flotante) |
| `%%# @X,Y` | Anotación con posición explícita (persiste al arrastrar con el mouse) |
| `%%@` | Anotación por nodo (placeholder v2) |

---

## 2. Desarrollo

### 2.1 Arquitectura general

```mermaid
graph TD
    subgraph "Main Process (Node.js)"
        MAIN[main.js]
        IPC_H[ipc-handlers.js]
        FW[file-watcher.js]
        MAIN -->|registra handlers| IPC_H
        MAIN -->|inicia watcher| FW
    end

    subgraph "Sistema de Archivos"
        MMD[archivo.mmd]
        FW -->|fs.watch| MMD
        IPC_H -->|fs.writeFile| MMD
        IPC_H -->|fs.readFile| MMD
    end

    subgraph "Renderer Process (Chromium)"
        APP[app.js<br/>IIFE consolidado]
        ME[Monaco Editor<br/>AMD loader]
        MR[Mermaid.js<br/>renderizado SVG]
        SN[Sticky Notes<br/>overlay + drag]
        EX[Export<br/>SVG / PNG]
        APP --> ME
        APP --> MR
        APP --> SN
        APP --> EX
    end

    APP <-->|ipcRenderer.invoke| IPC_H
    FW -->|webContents.send| APP
```

El Main Process maneja I/O de archivos y file watching. El Renderer Process contiene Monaco Editor, Mermaid.js, el overlay de anotaciones y la lógica de export. La comunicación es vía IPC de Electron: `invoke` para request/response (renderer → main), `send` para notificaciones (main → renderer).

Todo el código del renderer está en `app.js` como un IIFE. Esto evita conflictos entre `require` de Node.js y el AMD loader de Monaco, que sobrescriben la misma variable global.

### 2.2 Flujo: usuario escribe → render + save

```mermaid
sequenceDiagram
    participant U as Usuario
    participant ME as Monaco Editor
    participant APP as app.js
    participant MR as Mermaid.js
    participant IPC as ipcRenderer
    participant MP as Main Process
    participant FS as archivo.mmd

    U->>ME: Keystroke
    ME->>APP: onDidChangeModelContent()
    APP->>MR: renderDiagram(mermaidCode, theme)
    MR-->>APP: SVG
    APP->>APP: renderAnnotations(annotations)
    Note over APP: Debounce timer 500ms<br/>(reset en cada keystroke)
    Note over APP: Timer expira
    APP->>IPC: invoke('file:save', content)
    IPC->>MP: IPC message
    MP->>MP: selfSaving = true<br/>cooldown 500ms
    MP->>FS: writeFileSync(content)
```

El renderizado es instantáneo en cada keystroke (stripping de líneas `%%` antes de pasar a Mermaid). El guardado al archivo usa debounce de 500ms para no saturar el sistema de archivos. Cada save activa el flag `selfSaving` para que el file watcher no interprete la escritura como un cambio externo.

### 2.3 Flujo: LLM edita el archivo → UI se actualiza

```mermaid
sequenceDiagram
    participant LLM as LLM (opencode)
    participant FS as archivo.mmd
    participant FW as file-watcher.js
    participant MP as Main Process
    participant APP as app.js
    participant ME as Monaco Editor
    participant MR as Mermaid.js

    LLM->>FS: edit tool modifica archivo
    FS-->>FW: fs.watch 'change'
    FW->>FW: selfSaving activo? → skip
    FW->>FS: readFileSync(content)
    FW->>MP: webContents.send('file:external-change', content)
    MP->>APP: ipcRenderer.on()
    APP->>ME: setEditorContent(content)
    Note over ME: Flag isExternalUpdate<br/>Cursor restaurado
    APP->>MR: renderDiagram()
    APP->>APP: renderAnnotations()
    Note over APP: zoomToFit() automático
```

El LLM usa la herramienta `edit` de opencode sobre el archivo `.mmd`. `fs.watch()` en el main process detecta el cambio, y si `selfSaving` está inactivo (no fue un save propio), lee el nuevo contenido y lo envía al renderer vía `webContents.send`. El renderer actualiza Monaco preservando la posición del cursor y re-renderiza el diagrama con `zoomToFit()` para que el nuevo contenido sea visible.

### 2.4 Mecanismo anti-loop: selfSaving con cooldown

```mermaid
sequenceDiagram
    participant R as Renderer
    participant MP as Main Process
    participant FS as Sistema de Archivos
    participant FW as File Watcher

    R->>MP: invoke('file:save', content)
    MP->>MP: selfSaving = true<br/>start 500ms timer
    MP->>FS: writeFileSync(content)
    FS-->>FW: change event (1)
    FW->>FW: selfSaving = true → skip
    Note over FS,FW: Windows dispara<br/>múltiples eventos
    FS-->>FW: change event (2)
    FW->>FW: selfSaving = true → skip
    FS-->>FW: change event (3)
    FW->>FW: selfSaving = true → skip
    Note over MP: 500ms timer expira
    MP->>MP: selfSaving = false
    Note over FW: Listo para detectar<br/>cambios del LLM
```

**Problema**: `fs.watch()` en Windows dispara múltiples eventos `change` por cada `writeFileSync()`. Si `selfSaving` se resetea en el primer evento, el segundo evento atraviesa el filtro y re-dispara `renderDiagram()` con `zoomToFit()`.

**Solución**: `selfSaving` usa un cooldown de 500ms. Al activarse (`setSelfSaving(true)`), inicia un timer. Todos los eventos de `fs.watch` dentro de esos 500ms son ignorados. Al expirar el timer, `selfSaving` vuelve a `false` automáticamente.

### 2.5 Flujo: arrastrar sticky note → persistencia en archivo

```mermaid
sequenceDiagram
    participant U as Usuario
    participant SN as Sticky Note (DOM)
    participant APP as app.js
    participant ME as Monaco Editor
    participant FS as archivo.mmd

    U->>SN: mousedown
    SN->>APP: dragStart en screen-space
    U->>SN: mousemove
    Note over APP: dx = deltaMouse / zoomScale<br/>dy = deltaMouse / zoomScale<br/>CSS left/top actualizado en vivo
    U->>SN: mouseup
    APP->>APP: updateAnnotationLineInEditor(idx, x, y)
    Note over APP: 1. Lee líneas del editor<br/>2. Encuentra la N-ésima %%#<br/>3. stripAll @-?d+,-?d+ viejos<br/>4. Reconstruye: %%# @X,Y texto<br/>5. setEditorContent()
    APP->>ME: setValue()
    APP->>APP: renderAnnotations()
    Note over APP: El diagrama NO se re-renderiza<br/>Zoom y pan se preservan
    APP->>FS: Debounce save 500ms
```

Al arrastrar una sticky note, la posición se convierte de screen-space a stage-space dividiendo por `zoomScale`. Al soltar, se modifica la línea `%%#` correspondiente en el editor: se eliminan todos los `@X,Y` previos (incluyendo coordenadas negativas acumuladas por bugs anteriores) y se escribe uno solo limpio.

Solo se re-renderizan las anotaciones — el diagrama Mermaid no se toca, preservando el estado de zoom y pan.

### 2.6 Zoom y Pan

```mermaid
sequenceDiagram
    participant U as Usuario
    participant PP as Preview Pane
    participant APP as app.js
    participant STG as #preview-stage

    Note over PP,STG: Zoom centrado en cursor (Ctrl+Wheel)
    U->>PP: Ctrl + Wheel
    PP->>APP: wheel event
    APP->>APP: factor = deltaY < 0 ? 1.15 : 1/1.15<br/>newScale = clamp(scale × factor, 0.1, 5)<br/>tx = mx - ratio × (mx - tx)<br/>ty = my - ratio × (my - ty)
    APP->>STG: transform: translate(tx,ty) scale(s)

    Note over PP,STG: Zoom por botones (+/-)
    U->>PP: Click + / -
    PP->>APP: zoomStep(±1)
    APP->>APP: Igual lógica, centro del preview como foco
    APP->>STG: transform: translate(tx,ty) scale(s)

    Note over PP,STG: Pan (Click+Drag)
    U->>STG: mousedown
    STG->>APP: isPanning = true
    U->>STG: mousemove
    APP->>STG: tx = panTx + deltaX
    U->>STG: mouseup
    APP->>APP: isPanning = false

    Note over PP,STG: Fit to Screen
    U->>PP: Click "Fit" o doble-click
    APP->>APP: bbox = svg.getBBox()<br/>scale = min( (cw-pad)/sw , (ch-pad)/sh , 1 )<br/>tx = (cw - sw×scale)/2
    APP->>STG: transform + update label (%)
```

El zoom y pan se aplican vía CSS `transform` sobre `#preview-stage`, un wrapper que contiene tanto el SVG de Mermaid como el overlay de sticky notes. Esto garantiza que ambos se muevan y escalen juntos.

- **Rango**: 10% – 500%
- **Doble-click en preview**: resetea a 100%
- **Nuevo diagrama renderizado**: auto `zoomToFit()`
- **Arrastrar nota**: no dispara `zoomToFit()`

### 2.7 Estructura del proyecto

```
Vizflow/
├── package.json              # Dependencias, scripts, electron-builder
├── README.md                 # Este documento
├── .gitignore
├── openspec/                 # Specs spec-driven
│   └── changes/mermaid-live-editor/
│       ├── proposal.md
│       ├── design.md
│       ├── tasks.md
│       └── specs/
│           ├── live-mermaid-editor/spec.md
│           ├── file-sync-bridge/spec.md
│           ├── diagram-annotations/spec.md
│           ├── diagram-export/spec.md
│           ├── diagram-zoom-pan/spec.md
│           ├── annotation-drag-persist/spec.md
│           └── app-cli/spec.md
└── src/
    ├── main/                 # Electron Main Process
    │   ├── main.js           # Entry point, CLI args, window 1400×900
    │   ├── ipc-handlers.js   # file:read, file:save, export:svg, export:png
    │   └── file-watcher.js   # fs.watch + filtro selfSaving
    ├── renderer/             # Electron Renderer Process
    │   ├── index.html        # Shell + Monaco AMD loader + CSS vars
    │   ├── styles.css        # Layout, toolbar, sticky notes, zoom controls
    │   └── app.js            # IIFE: editor, renderer, annotations, export, zoom
    └── shared/               # Main y Renderer comparten
        ├── parser.js         # parseMmd() — YAML frontmatter + %%# + %%@
        └── default.mmd       # Template para archivos nuevos
```

### 2.8 IPC Protocol

| Canal | Dirección | Payload | Propósito |
|---|---|---|---|
| `file:read` | Renderer → Main | — | Leer `.mmd` al iniciar |
| `file:save` | Renderer → Main | `content: string` | Guardar + activar selfSaving |
| `get:filepath` | Renderer → Main | — | Obtener ruta absoluta del archivo |
| `export:svg` | Renderer → Main | `{svgContent, defaultName}` | Diálogo nativo + write SVG |
| `export:png` | Renderer → Main | `{dataUrl, defaultName}` | Diálogo nativo + base64 → Buffer |
| `file:external-change` | Main → Renderer | `content: string` | Notificar cambio externo detectado por watcher |

### 2.9 Decisiones técnicas

**Electron sobre Tauri/pywebview.** Tauri y pywebview requieren dependencias del sistema operativo (WebView2 en Windows, webkit2gtk en Linux). Electron incluye Chromium + Node.js → comportamiento idéntico en cualquier OS sin instalar nada. Monaco Editor fue diseñado para Electron.

**`nodeIntegration: true` (MVP).** Simplifica el acceso a `require()` sin preload script. En v2 se migrará a `contextBridge + preload.js` por seguridad.

**Todo el renderer en `app.js` (IIFE).** Monaco Editor usa un AMD loader que sobrescribe `window.require`, creando conflicto con Node.js `require`. Solución: salvar `nodeRequire = require` antes de que Monaco cargue, consolidar todo el código del renderer en un solo archivo, usar `nodeRequire()` para módulos Node y `window.require()` para AMD.

**`selfSaving` con cooldown de 500ms.** `fs.watch()` en Windows dispara múltiples eventos `change` por escritura. El cooldown bloquea todos los eventos durante 500ms, evitando re-renders y `zoomToFit()` espurios.

**Zoom/Pan con CSS `transform`.** En lugar de manipular el SVG o usar librerías externas, se aplica `transform: translate(tx,ty) scale(s)` sobre `#preview-stage`. Esto mueve y escala tanto el diagrama como las sticky notes simultáneamente.

---

## 3. Conclusión

### 3.1 Setup

```powershell
# Requisitos: Node.js ≥ 18, npm ≥ 9
cd Vizflow
npm install
```

### 3.2 Uso

```powershell
# Abrir archivo existente
npm start test-diagram.mmd

# Crear archivo nuevo (template automático)
npm start nuevo_diagram.mmd
```

### 3.3 Controles

| Acción | Atajo / UI |
|---|---|
| Escribir Mermaid | Monaco Editor (izquierda) |
| Ver diagrama | Preview (derecha) |
| Guardar | Automático (debounce 500ms) |
| Zoom in/out | Ctrl+Wheel o botones `+` `-` |
| Pan | Click + arrastrar en preview |
| Fit to Screen | Botón `Fit` o doble-click en preview |
| Mover sticky note | Click + arrastrar sobre la nota |
| Toggle theme | Botón ☀ en toolbar |
| Export SVG/PNG | Botones `SVG` `PNG` en toolbar |

### 3.4 Distribución

```powershell
npm run dist
```

Genera:
- **Windows**: `.exe` (NSIS installer + portable)
- **macOS**: `.dmg`
- **Linux**: `.AppImage` + `.deb`

### 3.5 Roadmap (v2)

- `%%@` anotaciones por nodo (tooltips ligados a elementos del diagrama)
- `contextBridge` + `preload.js` (aislar renderer del main process)
- TypeScript estricto
- Tests automatizados
- Soporte para `fs.watchFile()` (polling fallback en Linux)
