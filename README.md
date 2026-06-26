# Mermaid Live Editor

> Aplicación Electron desktop con Monaco Editor y renderizado Mermaid.js en vivo. El archivo `.mmd` es la fuente única de verdad compartida entre humano y LLM.

## Arquitectura

```mermaid
graph TD
    subgraph "Main Process (Node.js)"
        MAIN[main.js]
        IPC_H[ipc-handlers.js]
        FW[file-watcher.js]
        MAIN -->|registra| IPC_H
        MAIN -->|inicia| FW
    end

    subgraph "Sistema de Archivos"
        MMD[archivo.mmd]
        FW -->|fs.watch| MMD
        IPC_H -->|fs.writeFile| MMD
        IPC_H -->|fs.readFile| MMD
    end

    subgraph "Renderer Process (Chromium)"
        APP[app.js]
        EDITOR[editor.js<br/>Monaco Editor]
        RENDER[renderer.js<br/>Mermaid.js]
        ANNOT[annotations.js<br/>Sticky Notes]
        EXPORT[export.js<br/>SVG / PNG]
        APP --> EDITOR
        APP --> RENDER
        APP --> ANNOT
        APP --> EXPORT
    end

    APP <-->|ipcRenderer.invoke<br/>ipcRenderer.on| IPC_H
    FW -->|webContents.send<br/>file:external-change| APP
```

## Flujo de eventos

### Usuario escribe en Monaco → Render + Save

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
    ME->>APP: onDidChangeModelContent
    APP->>MR: renderDiagram(mermaidCode, theme)
    MR-->>APP: SVG rendered
    APP->>MR: renderAnnotations(annotations)
    Note over APP: Debounce 500ms timer (reset on each keystroke)
    Note over APP: Timer expires after 500ms idle
    APP->>IPC: invoke('file:save', content)
    IPC->>MP: IPC message
    MP->>MP: selfSaving = true (500ms cooldown)
    MP->>FS: fs.writeFileSync(content)
```

### LLM edita el archivo → UI se actualiza

```mermaid
sequenceDiagram
    participant LLM as LLM (opencode)
    participant FS as archivo.mmd
    participant FW as file-watcher.js
    participant MP as Main Process
    participant APP as app.js (Renderer)
    participant ME as Monaco Editor
    participant MR as Mermaid.js

    LLM->>FS: edit tool modifica archivo
    FS-->>FW: fs.watch 'change' event
    FW->>FW: selfSaving = true? → skip (cooldown activo)
    alt selfSaving = false
        FW->>FS: readFileSync
        FW->>MP: webContents.send('file:external-change', content)
        MP->>APP: ipcRenderer.on('file:external-change')
        APP->>ME: setEditorContent(content)
        Note over ME: isExternalUpdate = true<br/>Cursor position restored
        APP->>MR: renderDiagram(mermaidCode, theme)
        APP->>MR: renderAnnotations(annotations)
    end
```

### Mecanismo anti-loop: selfSaving cooldown

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
    FS-->>FW: change event (2, Windows duplica)
    FW->>FW: selfSaving = true → skip
    Note over MP: 500ms timer expires
    MP->>MP: selfSaving = false
    Note over FW: Ahora captura cambios del LLM
```

### Arrastrar sticky note → Persistencia en archivo

```mermaid
sequenceDiagram
    participant U as Usuario
    participant SN as Sticky Note (DOM)
    participant APP as app.js
    participant ME as Monaco Editor
    participant FS as archivo.mmd

    U->>SN: mousedown
    SN->>APP: dragStart (screen-space)
    U->>SN: mousemove (delta/zoomScale)
    Note over APP: Actualiza CSS left/top en vivo
    U->>SN: mouseup
    APP->>APP: updateAnnotationLineInEditor(idx, x, y)
    Note over APP: 1. Lee líneas del editor<br/>2. Encuentra la N-ésima %%#<br/>3. Limpia todos los @X,Y viejos<br/>4. Escribe %%# @X,Y texto<br/>5. setEditorContent()
    APP->>ME: setValue(nuevo contenido)
    Note over APP: Dispara debounce save (500ms)
    APP->>FS: file:save con nueva coordenada
```

### Zoom y Pan

```mermaid
sequenceDiagram
    participant U as Usuario
    participant PP as Preview Pane
    participant APP as app.js
    participant STG as preview-stage

    Note over PP,STG: Zoom (Ctrl+Wheel)
    U->>PP: Ctrl + Wheel (cursor en X,Y)
    PP->>APP: wheel event (deltaY)
    APP->>APP: newScale = scale × factor<br/>tx = mx - ratio × (mx - tx)
    APP->>STG: transform: translate(tx,ty) scale(s)

    Note over PP,STG: Pan (Click+Drag)
    U->>STG: mousedown
    STG->>APP: isPanning = true
    U->>STG: mousemove
    APP->>STG: tx = panTx + deltaX
    U->>STG: mouseup
    APP->>APP: isPanning = false

    Note over PP,STG: Fit to Screen
    U->>PP: Click botón "Fit" o nuevo render
    APP->>APP: scale = min((cw-pad)/sw, (ch-pad)/sh, 1)<br/>tx = (cw - sw×scale)/2
    APP->>STG: transform: translate(tx,ty) scale(s)
```

## Formato de archivo `.mmd`

```mermaid
graph LR
    subgraph "archivo.mmd"
        A[YAML Frontmatter<br/>---<br/>title, theme<br/>---]
        B[Mermaid Code<br/>graph TD<br/>  A --> B]
        C[Anotaciones %%#<br/>%%# @120,50 Nota<br/>%%# Comentario]
        D[Anotaciones %%@<br/>v2 - placeholder]
    end
    A --> B --> C --> D
```

### Ejemplo

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
%%# @350,180 Handles JWT validation and session management
%%# Architecture v2 - needs review before Q3
```

### Convenciones

| Sintaxis | Significado |
|---|---|
| `---` delimiters | Bloque YAML frontmatter (metadata: title, theme) |
| `%%#` | Anotación general (sticky note flotante) |
| `%%# @X,Y` | Anotación con posición explícita (persiste al arrastrar) |
| `%%@` | Anotación por nodo (placeholder v2) |

## Estructura del proyecto

```
Vizflow/
├── package.json              # Dependencias, scripts, electron-builder config
├── README.md                 # Esta documentación
├── .gitignore
├── test-diagram.mmd          # Archivo de prueba
├── openspec/                 # Specs del proyecto (spec-driven)
│   └── changes/mermaid-live-editor/
│       ├── proposal.md
│       ├── design.md
│       ├── tasks.md
│       └── specs/
│           ├── live-mermaid-editor/
│           ├── file-sync-bridge/
│           ├── diagram-annotations/
│           ├── diagram-export/
│           ├── diagram-zoom-pan/
│           ├── annotation-drag-persist/
│           └── app-cli/
└── src/
    ├── main/                 # Electron Main Process
    │   ├── main.js           # Entry point, CLI args, window creation
    │   ├── ipc-handlers.js   # IPC handlers (read/write/export)
    │   └── file-watcher.js   # fs.watch con filtro selfSaving
    ├── renderer/             # Electron Renderer Process (Chromium)
    │   ├── index.html        # HTML shell + Monaco AMD loader setup
    │   ├── styles.css        # Layout, temas, zoom controls
    │   └── app.js            # Toda la lógica del renderer (IIFE)
    └── shared/               # Código compartido
        ├── parser.js         # parseMmd() - YAML + %%# + %%@
        └── default.mmd       # Template por defecto

Nota: Los archivos editor.js, renderer.js, annotations.js, export.js del plan original
      fueron consolidados en app.js para evitar conflictos de módulos entre
      Node.js require y Monaco AMD loader en el renderer process.
```

## Componentes del Renderer (`app.js`)

| Módulo | Funciones clave | Responsabilidad |
|---|---|---|
| **init** | `init()`, `start()` | Inicialización: leer archivo, crear editor, primer render |
| **Editor** | `initEditor()`, `getEditorContent()`, `setEditorContent()`, `updateEditorTheme()` | Monaco Editor + Mermaid monarch tokens + debounce save |
| **Renderer** | `renderDiagram()`, `handleContentChange()` | Mermaid.js render + zoomToFit automático |
| **Annotations** | `renderAnnotations()`, `updateAnnotationLineInEditor()` | Sticky notes con drag + persistencia `@X,Y` |
| **Export** | `exportSvg()`, `exportPng()`, `getSvgWithAnnotations()` | SVG/PNG via IPC, 2x resolution para PNG |
| **Theme** | `setTheme()`, `checkThemeFromFm()` | CSS custom properties + Monaco + Mermaid themes |
| **Zoom/Pan** | `applyZoom()`, `zoomStep()`, `zoomToFit()`, `setupZoomPan()` | CSS transform + wheel/mouse handlers |

## IPC Protocol

| Canal | Dirección | Payload | Handler |
|---|---|---|---|
| `file:read` | Renderer → Main | — | Lee archivo, retorna string |
| `file:save` | Renderer → Main | `content: string` | Escribe archivo, activa `selfSaving` |
| `get:filepath` | Renderer → Main | — | Retorna ruta absoluta del `.mmd` |
| `export:svg` | Renderer → Main | `{svgContent, defaultName}` | Native save dialog, escribe SVG |
| `export:png` | Renderer → Main | `{dataUrl, defaultName}` | Native save dialog, convierte base64 → Buffer |
| `file:external-change` | Main → Renderer | `content: string` | Detectado por `fs.watch()`, actualiza editor |
| `dialog:usage` | Main → UI | — | Error dialog si no se especifica archivo |

## Setup y Uso

### Requisitos

- Node.js ≥ 18
- npm ≥ 9

### Instalación

```powershell
cd Vizflow
npm install
```

### Desarrollo

```powershell
# Abrir un archivo existente
npm start test-diagram.mmd

# Abrir archivo nuevo (se crea con template)
npm start nuevo_diagram.mmd
```

### Distribución

```powershell
npm run dist
```

Genera:
- Windows: `.exe` (NSIS installer + portable)
- macOS: `.dmg`
- Linux: `.AppImage` + `.deb`

### Features

| Feature | Acción | Implementación |
|---|---|---|
| Editor Monaco | Dividido 50/50 con preview | Monarch tokens para Mermaid |
| Render en vivo | Cada keystroke | `mermaid.render()` < 50ms |
| Guardado | 500ms debounce | `ipcRenderer.invoke('file:save')` |
| LLM sync | El LLM edita el `.mmd` | `fs.watch()` → `webContents.send()` |
| Anti-loop | Evita que save propio re-triggere watcher | `selfSaving` flag con cooldown 500ms |
| Sticky notes | `%%#` líneas → notas flotantes | CSS `position: absolute` sobre SVG |
| Drag notes | Arrastrar para reposicionar | Mouse events + zoom-aware coords |
| Persistencia notas | `%%# @X,Y texto` en archivo | `updateAnnotationLineInEditor()` |
| Export SVG | Botón en toolbar | `getSvgWithAnnotations()` → IPC |
| Export PNG | Botón en toolbar | Canvas 2x → data URL → IPC |
| Dark/Light | Botón en toolbar | CSS vars + Monaco + Mermaid themes |
| Zoom | Ctrl+Wheel / botones +/- | CSS `transform: scale()` en stage |
| Pan | Click+drag en preview | CSS `transform: translate()` en stage |
| Fit to Screen | Botón "Fit" / auto en render | `getBBox()` → scale calculation |
| CLI | `npm start archivo.mmd` | `process.argv` parsing en main.js |

## Decisiones técnicas

### Por qué Electron (+150MB)

Tauri y pywebview requieren dependencias del sistema (WebView2 en Windows, webkit2gtk en Linux). Electron incluye Chromium + Node.js → comportamiento idéntico en cualquier OS sin instalar nada extra. Monaco Editor fue diseñado para Electron (es el editor de VSCode).

### Por qué `nodeIntegration: true` (MVP)

Simplifica el acceso a `require('fs')`, `require('path')` y `ipcRenderer` sin necesidad de un preload script. En v2 se migrará a `contextBridge` + `preload.js` para mayor seguridad.

### Por qué todo en `app.js` (sin módulos separados)

Monaco Editor usa un AMD loader que sobrescribe `window.require`, creando un conflicto con Node.js `require`. La solución fue:
1. Salvar `nodeRequire = require` antes de que Monaco cargue
2. Consolidar todo el código del renderer en un solo archivo (IIFE)
3. Usar `nodeRequire()` para módulos Node, `window.require()` para AMD

Esto evita problemas de resolución de rutas entre scripts cargados vía `<script src>` vs `nodeRequire()`.

### Por qué `selfSaving` con cooldown de 500ms

En Windows, `fs.watch()` dispara múltiples eventos `change` por cada `writeFileSync`. Sin cooldown, el primer evento resetea `selfSaving = false` y el segundo evento traspasa el filtro → re-render innecesario + `zoomToFit()`. Con cooldown, todos los eventos dentro de 500ms son bloqueados.

### Por qué `zoomToFit()` automático

Cada vez que se renderiza un diagrama nuevo, se ajusta al viewport para que el usuario vea el resultado completo. Al arrastrar una sticky note, el diagrama NO se re-renderiza → el zoom/pan se preserva.
