## Why

Dos issues de UX que afectan el uso diario del editor:

1. **Ctrl+C y Ctrl+V no funcionan** en Monaco Editor. La app no tiene menú "Edit" con roles nativos de clipboard (`copy`, `paste`, `cut`). Sin estos roles, Electron no sintetiza los eventos de clipboard hacia el renderer, y Monaco no puede ejecutar `document.execCommand('copy')`. El usuario debe usar el menú contextual del SO o escribir todo a mano.

2. **Los paneles editor/preview no son redimensionables**. Ocupan 50% fijo cada uno. Si el diagrama es ancho o el código es largo, el usuario no puede ajustar la proporción. No existe un divisor arrastrable entre ambos paneles.

## What Changes

- Agregar menú nativo "Editar" con roles `cut`, `copy`, `paste`, `selectAll` (Ctrl+X, Ctrl+C, Ctrl+V, Ctrl+A). Electron traduce estos roles a eventos de clipboard que Monaco procesa correctamente.
- Agregar un divisor arrastrable (`#pane-divider`) entre el editor y el preview, con lógica de redimensionamiento vía mousedown/move/up
- Reemplazar `flex: 1` por porcentajes fijos tras el primer resize
- Llamar a `editor.layout()` en cada movimiento para que Monaco se reajuste al nuevo ancho

## Capabilities

### New Capabilities

- `editor-clipboard`: Ctrl+C, Ctrl+V, Ctrl+X, Ctrl+A funcionan en Monaco Editor mediante el menú nativo "Editar" con roles de Electron
- `resizable-panes`: El usuario puede arrastrar el divisor central para ajustar la proporción entre el panel del editor y el panel del diagrama

### Modified Capabilities

- `native-menu`: El menú ahora incluye "Editar" además de "Archivo"

## Impact

- `src/main/main.js`: Agregar menú "Editar" en `buildMenu()` con roles `cut`, `copy`, `paste`, `selectAll`
- `src/renderer/index.html`: Agregar `<div id="pane-divider">` entre ambos paneles
- `src/renderer/styles.css`: Estilos del divider, quitar `border-left` del preview-pane
- `src/renderer/app.js`: Nueva función `setupPaneResize()` con lógica de drag; llamar a `editor.layout()` en cada movimiento
