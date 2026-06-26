## Context

El proyecto Vizflow es un espacio de experimentación (greenfield). La herramienta `mermaid-live-editor` será una aplicación Electron que usa Chromium como runtime, con el stack completo en JavaScript/TypeScript. La innovación está en el bridge bidireccional: el humano edita en Monaco Editor y el LLM edita el archivo `.mmd` directamente; ambos cambios se reflejan instantáneamente en la UI.

**Restricciones:**
- Cross-platform real (Windows, macOS, Linux) sin dependencias externas del sistema
- JavaScript/TypeScript como único lenguaje (Electron main + renderer)
- Mermaid.js y Monaco Editor offline (dependencias npm, sin CDN)
- El archivo `.mmd` es la fuente única de verdad

## Goals / Non-Goals

**Goals:**
- Aplicación nativa Electron (~150MB) distribuible como `.exe`/`.dmg`/`.AppImage`
- Monaco Editor con syntax highlighting Mermaid + renderizado instantáneo al escribir
- Sincronización automática cuando el LLM edita el archivo (`fs.watch()` nativo)
- Notas generales (`%%#`) visibles como sticky notes flotantes sobre el diagrama
- Exportación del diagrama a SVG y PNG con diálogos nativos
- Tema oscuro/claro
- CLI: `npx mermaid-live archivo.mmd`

**Non-Goals:**
- Edición colaborativa en red (el bridge es local, archivo único)
- Anotaciones por nodo (`%%@`) — relegado a v2
- Soporte para otros tipos de diagrama (PlantUML, D2) — solo Mermaid
- Edición de anotaciones directamente en el preview (se editan en Monaco)
- TypeScript estricto en MVP (JS con JSDoc es aceptable para empezar)

## Decisions

### 1. Runtime: Electron sobre Tauri/pywebview

**Decisión:** Electron con Chromium bundleado.

**Alternativas consideradas:**
- **pywebview**: Ligero pero requiere WebView2 (Windows) o webkit2gtk (Linux). No es verdaderamente cross-platform sin pasos extra.
- **Tauri**: Más ligero (~5MB) pero requiere toolchain Rust y también necesita webkit2gtk en Linux — mismo problema que pywebview.
- **Electron**: ~150MB, incluye Chromium + Node.js. Cross-platform real: mismo binario funciona en cualquier OS sin instalar nada.

**Racional:** Electron es la única opción que garantiza comportamiento idéntico en Windows, macOS y Linux sin dependencias del sistema. 150MB es aceptable para una herramienta de desarrollo. Además, Monaco Editor (el editor de VSCode) fue diseñado para Electron.

### 2. Editor: Monaco Editor

**Decisión:** Monaco Editor cargado como dependencia npm.

**Alternativas consideradas:**
- **`<textarea>` plano**: Sin syntax highlighting, experiencia pobre para escribir Mermaid.
- **CodeMirror 6**: Bueno pero Monaco es superior y ya viene probado en Electron (VSCode).

**Racional:** Monaco es el editor de VSCode. Ofrece syntax highlighting para Mermaid, minimap, bracket matching, múltiples cursores y temas dark/light. Al ser una dependencia npm, funciona offline. El peso (~5MB) ya está incluido en los 150MB de Electron.

### 3. Renderizado: Mermaid.js npm (offline)

**Decisión:** Mermaid.js como dependencia npm, renderizado en el renderer process.

**Alternativas consideradas:**
- **Kroki API**: Requiere internet, ~200-500ms de latencia. No viable para renderizado en vivo.
- **Mermaid.js desde CDN**: Funciona pero requiere internet. Con Electron podemos bundlearlo.
- **Mermaid CLI (mmdc)**: Requiere Node.js aparte, añade complejidad innecesaria teniendo Electron.

**Racional:** `import mermaid from 'mermaid'` en el renderer process. Renderiza en < 50ms. Cero dependencia de red. La experiencia de "escribir y ver" es instantánea.

### 4. Comunicación Main ↔ Renderer: IPC de Electron

**Decisión:** Usar `ipcMain` / `ipcRenderer` nativos de Electron para el bridge.

**Alternativas consideradas:**
- **WebSocket**: Añade puerto, servidor extra, sin beneficio.
- **contextBridge + preload**: Más seguro pero añade complejidad de setup para el MVP. Se puede migrar en v2.

**Racional:** Electron incluye IPC built-in. Patrón simple:
- Renderer → Main: `ipcRenderer.invoke('file:save', content)` → Main recibe, escribe a disco.
- Main → Renderer: `mainWindow.webContents.send('file:external-change', content)` → Renderer actualiza Monaco.
- `nodeIntegration: true` en el MVP simplifica el acceso a `require('fs')` desde el renderer para el parser local. En v2 se aísla con preload.

### 5. File watching: fs.watch() nativo de Node.js

**Decisión:** `fs.watch()` en el main process para monitorear cambios externos.

**Racional:** Node.js incluye `fs.watch()` sin dependencias externas. En el main process:
```js
fs.watch(filePath, (eventType) => {
  if (eventType === 'change') {
    const content = fs.readFileSync(filePath, 'utf-8');
    mainWindow.webContents.send('file:external-change', content);
  }
});
```
Watchdog (Python) se elimina. Menos dependencias, mismo comportamiento.

### 6. Formato de archivo: `.mmd` con frontmatter YAML

**Decisión:** Mismo formato que en el diseño anterior.

```mmd
---
title: Título opcional
theme: dark
---

graph TD
    A --> B

%%# Nota general flotante
```

**Racional:** YAML frontmatter parseado con `js-yaml` (npm). Comentarios Mermaid (`%%`) como vehículo para anotaciones. Separación limpia entre metadata, diagrama y anotaciones.

### 7. Debounce: 500ms para guardado, instantáneo para render

**Decisión:** Sin cambios. Renderizado de Mermaid.js en cada keystroke. Guardado al archivo con debounce de 500ms.

**Racional:** 
- Render instantáneo = feedback visual inmediato
- Guardado con debounce = evita escrituras innecesarias y reduce ruido en `fs.watch()`

### 8. Distribución: electron-builder

**Decisión:** `electron-builder` para generar instaladores cross-platform.

**Racional:** Configuración declarativa en `package.json`:
```json
"build": {
  "appId": "ai.vizflow.mermaid-live",
  "productName": "Mermaid Live",
  "win": { "target": "nsis" },
  "mac": { "target": "dmg" },
  "linux": { "target": ["AppImage", "deb"] }
}
```
Un solo comando (`npm run dist`) genera los tres formatos.

## Architecture

```
┌──────────────────────────────────────────────────────┐
│  Electron App                                          │
│                                                        │
│  ┌─ Main Process (Node.js) ─────────────────────────┐ │
│  │                                                    │ │
│  │  BrowserWindow (ventana nativa, 1400x900)         │ │
│  │  ipcMain.handle('file:save', ...)                 │ │
│  │  ipcMain.handle('file:read', ...)                 │ │
│  │  ipcMain.handle('dialog:export', ...)             │ │
│  │  fs.watch(filePath) → external change detection   │ │
│  │  fs.readFileSync / fs.writeFileSync               │ │
│  │  app.on('window-all-closed', ...)                 │ │
│  │                                                    │ │
│  └────────────────────┬───────────────────────────────┘ │
│                       │ IPC (invoke/send)               │
│  ┌─ Renderer Process (Chromium) ────────────────────┐ │
│  │                                                    │ │
│  │  ┌──────────────────┐  ┌────────────────────────┐ │ │
│  │  │  Monaco Editor   │  │  Preview               │ │ │
│  │  │  (mermaid syntax │  │  ┌──────────────────┐  │ │ │
│  │  │   highlighting)  │  │  │  Mermaid.js SVG  │  │ │ │
│  │  │                  │  │  │  + sticky notes  │  │ │ │
│  │  │  Escribe usuario │  │  └──────────────────┘  │ │ │
│  │  │  ← LLM updates   │  │                        │ │ │
│  │  └──────────────────┘  │  [🌙 Theme] [📥 SVG]  │ │ │
│  │                         │  [📥 PNG]             │ │ │
│  │  ipcRenderer.invoke()   └────────────────────────┘ │ │
│  │  ipcRenderer.on()       │                          │ │
│  │  mermaid.render()       │                          │ │
│  │  js-yaml (frontmatter)  │                          │ │
│  │                         │                          │ │
│  └─────────────────────────┴──────────────────────────┘ │
└──────────────────────────────────────────────────────────┘
```

## Data Flow

**Usuario escribe → Render + Save:**
1. Keystroke en Monaco → `onDidChangeModelContent` captura evento
2. Mermaid.js renderiza inmediatamente el contenido (stripping `%%` lines)
3. Debounce 500ms → `ipcRenderer.invoke('file:save', content)`
4. Main process escribe a `archivo.mmd`; marca un flag `selfSaving = true`

**LLM edita → UI update:**
1. LLM usa `edit` tool sobre `archivo.mmd`
2. `fs.watch()` en main process detecta el cambio
3. Si `selfSaving` es true → ignora (fue guardado propio), resetea flag
4. Si no → lee el archivo, envía `mainWindow.webContents.send('file:external-change', content)`
5. Renderer recibe el evento IPC → `ipcRenderer.on('file:external-change', ...)` → actualiza Monaco + re-renderiza Mermaid

**Race condition handling:**
- El flag `selfSaving` en main process previene loops de save → watch → update → save
- Si el usuario está escribiendo cuando llega un update del LLM, Monaco se actualiza con el contenido del archivo (source of truth)
- El usuario controla cuándo pide al LLM que edite, minimizando conflictos reales

## Risks / Trade-offs

- **[Riesgo] 150MB de tamaño base** → Aceptable para herramienta de desarrollo. VSCode pesa ~300MB. Se puede reducir con compresión y tree-shaking.
- **[Riesgo] `nodeIntegration: true` en MVP es menos seguro** → En v2 se migra a `contextBridge` + `preload.js` para aislar el renderer. El MVP solo carga contenido local, riesgo bajo.
- **[Riesgo] Renderizado muy frecuente podría causar lag en diagramas grandes** → Mermaid.js es eficiente (< 50ms para < 100 nodos). Se puede añadir debounce de render si es necesario.
- **[Riesgo] `fs.watch()` tiene comportamiento inconsistente entre OS** → Es estable en Windows/macOS. En Linux puede requerir `fs.watchFile()` (polling) como fallback.
- **[Trade-off] Monaco Editor añade complejidad de setup** → Compensado por DX superior (syntax highlighting, minimap, temas). El setup inicial es una vez.
