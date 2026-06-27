## Why

La app funciona solo si el usuario ejecuta `npm start <archivo.mmd>` desde dentro de la carpeta del proyecto. Esto rompe la experiencia: un usuario que recién instala el programa no puede abrir un diagrama desde cualquier carpeta simplemente escribiendo `vizflow archivo.mmd`. Además, el nombre interno del proyecto (`mermaid-live`) y el nombre visible (`Mermaid Live`) no coinciden con el nombre real de la herramienta (`Vizflow`), lo que genera inconsistencia en la UI, el CLI, los binarios y la documentación.

## What Changes

- **Rename global**: `mermaid-live` → `vizflow`, `Mermaid Live` → `Vizflow` en todos los archivos del proyecto (package.json, main.js, index.html, README, specs)
- **appId** actualizado: `ai.vizflow.mermaid-live` → `ai.vizflow.vizflow`
- **productName** actualizado: `Mermaid Live` → `Vizflow` (genera `Vizflow.exe` en Windows)
- **bin CLI** actualizado: comando `mermaid-live` → `vizflow`
- **CLI wrapper Node.js** nuevo (`bin/cli.js`): permite usar `npm link` para desarrollo y `npx vizflow archivo.mmd`
- **Instalador Windows con PATH**: script NSIS custom (`build/installer.nsh`) que agrega el directorio de instalacion al PATH del usuario durante la instalacion, y lo remueve en la desinstalacion
- **Config NSIS en package.json**: `oneClick: false`, `perMachine: false`, `include: build/installer.nsh`
- **Linux `.deb`** ya agrega automaticamente a `/usr/bin/` (en PATH), sin cambios necesarios
- **macOS `.dmg`** documentado: el usuario arrastra a `/Applications/`; se documenta como crear symlink manual

## Capabilities

### New Capabilities

- `vizflow-global-cli`: El comando `vizflow <archivo.mmd>` funciona desde cualquier carpeta del sistema en Windows, Linux y macOS, ya sea mediante PATH (NSIS en Windows, .deb en Linux) o symlink documentado (macOS)
- `vizflow-rename`: Nombre consistente `vizflow` en todo el proyecto: package.json, bin CLI, titulo de ventana, appId, productName, HTML, y documentacion

### Modified Capabilities

- `app-cli`: El nombre del comando cambia de `mermaid-live` a `vizflow`; el mensaje de error sin argumentos refleja el nuevo nombre; el titulo de ventana usa `Vizflow` en lugar de `Mermaid Live`

## Impact

- **Archivos modificados**: `package.json`, `src/main/main.js`, `src/renderer/index.html`, `README.md`, `openspec/**/*.md`
- **Archivos nuevos**: `build/installer.nsh`, `bin/cli.js`
- **Archivo regenerado**: `package-lock.json` (tras `npm install`)
- **Build artifacts**: `dist/Vizflow Setup 1.0.0.exe` (Windows), `dist/vizflow_1.0.0_amd64.deb` (Linux), `dist/Vizflow-1.0.0.dmg` (macOS)
- **Sin cambios de API ni dependencias nuevas**
- **BREAKING**: El comando `mermaid-live` deja de existir; usuarios existentes deben usar `vizflow`
