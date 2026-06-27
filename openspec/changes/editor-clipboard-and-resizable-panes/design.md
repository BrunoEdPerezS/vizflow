## Context

Vizflow usa Electron con `nodeIntegration: true, contextIsolation: false`. Monaco Editor 0.55 se crea con opciones estándar, sin configuración explícita de clipboard. El menú nativo solo tiene "Archivo" (Abrir, Cerrar pestaña, Salir). El layout actual usa `flex: 1` para ambos paneles sin divisor redimensionable.

### Clipboard
Electron expone roles de menú nativos: `copy`, `cut`, `paste`, `selectAll`. Cuando un menú tiene un item con `role: 'copy'`, Electron intercepta el acelerador asociado (Ctrl+C), crea un evento sintético de clipboard, y lo envía a la ventana enfocada. Monaco procesa este evento como si viniera del navegador nativo. Sin este rol, Monaco recibe el keydown de Ctrl+C pero `document.execCommand('copy')` falla porque Electron no tiene un handler de clipboard activo para esa ventana.

### Resizable Panes
Los paneles usan CSS `flex: 1 1 0%` (crecimiento igual). No hay un elemento divisor ni evento de drag. La solución clásica: insertar un `div` con `cursor: col-resize`, capturar `mousedown`/`mousemove`/`mouseup`, calcular el nuevo ancho en píxeles, convertirlo a porcentaje del contenedor padre, y setear `flex: 0 0 X%` en ambos paneles.

## Goals / Non-Goals

**Goals:**
- Ctrl+C copia texto seleccionado en Monaco
- Ctrl+V pega texto del clipboard en Monaco
- Ctrl+X corta texto
- Ctrl+A selecciona todo
- Divisor arrastrable entre editor y preview
- Monaco se reajusta (`editor.layout()`) durante el resize
- Sin regresiones: los aceleradores de "Archivo" (Ctrl+O, Ctrl+W) siguen funcionando

**Non-Goals:**
- No se modifica el menú contextual (click derecho)
- No se agrega "Undo/Redo" al menú (Monaco ya los maneja con Ctrl+Z/Y)
- No se persiste la proporción de paneles entre sesiones

## Decisions

### 1. Clipboard: menú "Editar" con roles nativos

**Decisión:** Agregar un segundo menú "Editar" en `buildMenu()` con `role: 'cut'`, `role: 'copy'`, `role: 'paste'`, `role: 'selectAll'`.

**Alternativas:**
- *Monaco clipboard provider con `electron.clipboard`*: Requiere manipular la API interna de Monaco (`ICodeEditor`), interceptar keydown, y manejar selecciones manualmente. Más código, más frágil.
- *Habilitar `sandbox: false` o permisos de clipboard en webPreferences*: Electron ya tiene `sandbox` deshabilitado por defecto con `nodeIntegration: true`. No resuelve el problema.

**Racional:** Los roles de Electron son la forma canónica de habilitar clipboard en apps Electron con Monaco. Una sola línea por acción. Sin overhead de runtime.

### 2. Resize: divisor HTML con drag listeners

**Decisión:** Insertar `<div id="pane-divider">` entre los paneles con ancho fijo de 4px. La lógica de resize usa `mousedown`/`mousemove`/`mouseup` en el divider. En cada `mousemove`, se calcula el nuevo ancho del panel editor como porcentaje del contenedor, clampado entre 200px y `totalWidth - 204px` (mínimo 200px para preview + 4px divider).

**Alternativas:**
- *CSS `resize: horizontal`*: Solo funciona en elementos con `overflow: auto` y no permite arrastre libre entre dos paneles flex.
- *Librería externa (split.js, golden-layout)*: Agrega dependencia y complejidad innecesaria para un caso simple de dos paneles.

**Racional:** Implementación vanilla con ~30 líneas de JS. Sin dependencias. Control total sobre el clamping y el relayout de Monaco.

### 3. Conversión px → % para mantener consistencia con flex

**Decisión:** El ancho se almacena como porcentaje del contenedor padre, no como píxeles absolutos. En cada frame de drag: `percent = (newWidth / totalWidth) * 100`. Se aplica `flex: 0 0 X%` al editor-pane y `flex: 0 0 (100-X-divider%)` al preview-pane.

**Racional:** Si la ventana se redimensiona, los porcentajes mantienen la proporción relativa. Si se usaran píxeles fijos (`width: 500px`), al agrandar la ventana el preview no aprovecharía el espacio extra.

## Risks / Trade-offs

- **[Riesgo] El divider interfiere con el pan del preview**: El divider está fuera del `#preview-stage`, por lo que los eventos de pan no deberían capturarse en el divider. `#pane-divider` previene el default en mousedown para evitar selección de texto.
- **[Riesgo] Conflictos de aceleradores entre menús**: "Archivo" usa Ctrl+O/W y "Editar" usa Ctrl+C/V/X/A. No hay solapamiento. Electron resuelve conflictos por orden de menú (el primero gana). Ctrl+W está en Archivo; "Editar" no tiene conflicto.
