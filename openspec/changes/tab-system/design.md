## Context

Vizflow es una app single-file. Todo el estado — `filePath`, `zoomScale`, `fitScale`, `currentFileBasename`, modelos Monaco, watchers — asume un único archivo. Para implementar pestañas, el estado debe migrar de variables globales a una estructura `Tab` + `TabManager`.

Monaco Editor 0.55 soporta múltiples `ITextModel` independientes con `monaco.editor.createModel()` y swapeo con `editor.setModel()`. Cada modelo preserva su propio undo stack y view state. Esto permite un solo editor con múltiples buffers.

## Goals / Non-Goals

**Goals:**
- Pestañas visuales con nombre de archivo, click para cambiar, botón cerrar
- Atajos Alt+1..9 para cambiar, Ctrl+W para cerrar
- Estado independiente por pestaña: editor (modelo, cursor, scroll), diagrama, zoom/pan, anotaciones
- Múltiples file watchers simultáneos
- CLI acepta múltiples archivos

**Non-Goals:**
- Sin persistencia de sesión (MVP)
- Sin "Save As", "Close All", menú contextual en pestañas
- Sin drag & drop para reordenar
- Sin indicador visual de archivo modificado
- Sin archivos "untitled" sin guardar (cada pestaña tiene un filePath real)

## Decisions

### 1. Monaco: un editor, múltiples modelos

**Decisión:** Un solo `IStandaloneCodeEditor`, una colección de `ITextModel` (uno por pestaña). Swapeo con `editor.setModel()`.

**Alternativa:** Múltiples editores (uno por pestaña, show/hide). Más memoria, más complejo de gestionar (cada editor necesita su propio `layout()`, event listeners).

**Racional:** Monaco fue diseñado para multi-model. `setModel()` es instantáneo. `saveViewState()`/`restoreViewState()` preservan cursor y scroll. El content-change listener del editor funciona con el modelo activo.

### 2. Tab: clase que agrupa todo el estado de un archivo

```js
class Tab {
  id        // string único
  filePath  // ruta absoluta
  model     // monaco.editor.ITextModel
  viewState // monaco.editor.ICodeEditorViewState | null
  zoomState // { scale, fitScale, tx, ty }
  parsed    // { frontmatter, mermaidCode, annotations }
  saveTimeout    // number | null
  isExternalUpdate // boolean
}
```

### 3. TabManager: orquesta el ciclo de vida de pestañas

```js
class TabManager {
  tabs: Map<string, Tab>
  activeTabId: string
  
  openTab(filePath, content)  → crea model, parsed, zoomState default
  closeTab(id)               → dispose model, remove from map
  switchTab(id)              → guarda estado actual, swapea modelo, renderiza preview
  getActiveTab()             → devuelve Tab activa
}
```

### 4. IPC parametrizado por filePath

Todos los canales que operan sobre un archivo incluyen `filePath`:

| Canal | Payload |
|-------|---------|
| `file:read` | `{ filePath }` → response `{ content }` |
| `file:save` | `{ filePath, content }` |
| `file:external-change` | `{ filePath, content }` (ruteado por renderer) |
| `get:filepaths` | `() → { filePaths: string[], activeFilePath: string }` |

### 5. Múltiples file watchers

`file-watcher.js` pasa de un watcher único a un Map:

```
watchers: Map<string, FSWatcher>

addWatcher(filePath, mainWindow, getSelfSaving, setSelfSaving)
removeWatcher(filePath)
stopAllWatchers()
```

`selfSaving` también se convierte en un Map por filePath.

### 6. CLI acepta múltiples archivos

`process.argv` se escanea buscando TODOS los `.mmd`:
```js
const mmdFiles = args.filter(a => a.endsWith('.mmd'));
```

Si hay al menos uno, se abren todos en pestañas (el primero activo). Si no hay ninguno, se crea `untitled.mmd` temporal como antes.

### 7. DOM: tab bar entre toolbar y main-content

```html
<div id="toolbar">...</div>
<div id="tab-bar">
  <div class="tab active" data-tab-id="1">
    <span class="tab-label">login-flow.mmd</span>
    <button class="tab-close">&times;</button>
  </div>
</div>
<div id="main-content">...</div>
```

Altura de `#main-content` se ajusta: `calc(100vh - 40px - 32px)`.

### 8. Keyboard shortcuts

Se registran en `window.addEventListener('keydown', ...)` en el renderer:

| Combinación | Acción |
|-------------|--------|
| Alt+1..9 | `TabManager.switchTab(tabs[N-1].id)` |
| Ctrl+W | `TabManager.closeTab(activeTabId)` |

Estos NO interfieren con los aceleradores del menú nativo (que son manejados por Electron en el main process).

## Risks / Trade-offs

- **[Riesgo] Memoria con muchas pestañas**: Cada modelo Monaco + SVG renderizado ocupa memoria. 10+ pestañas con diagramas grandes podrían degradar rendimiento. → **Mitigación**: Los modelos Monaco son livianos (~texto). Los SVGs se destruyen al cambiar de pestaña (solo el activo está en el DOM).
- **[Riesgo] Pérdida de cambios no guardados**: Si el usuario cierra una pestaña sin guardar, los cambios se pierden. → **Mitigación**: El auto-save de 500ms minimiza este riesgo. En MVP no hay confirmación "¿Guardar cambios?".
- **[Trade-off] Sin archivos "untitled"**: Cada pestaña requiere un filePath real. `Archivo > Nuevo` no está implementado. → **Aceptable para MVP**: el usuario siempre abre archivos existentes o creados por CLI.
