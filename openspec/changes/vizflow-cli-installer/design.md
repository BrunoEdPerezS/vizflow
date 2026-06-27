## Context

Vizflow es una app Electron existente (~1300 lineas de codigo) que ya funciona como editor de diagramas Mermaid con bridge de sincronizacion para LLMs. Actualmente solo se ejecuta desde la carpeta del proyecto con `npm start <archivo.mmd>`. El `productName` es `"Mermaid Live"` y el nombre npm es `"mermaid-live"`, pero la herramienta se llama `Vizflow`.

La app ya tiene configuracion de `electron-builder` para Windows (NSIS + portable), Linux (AppImage + deb) y macOS (dmg), pero nunca se ha ejecutado un build. El `bin` en `package.json` apunta a `src/main/main.js`, lo cual no funciona porque requiere el runtime de Electron.

**Restricciones:**
- Sin nuevas dependencias npm
- Cambios minimos en el codigo de la app (solo rename strings)
- El instalador debe funcionar cross-platform sin pasos manuales complejos

## Goals / Non-Goals

**Goals:**
- Comando `vizflow <archivo.mmd>` funcional desde cualquier carpeta en Windows, Linux, macOS
- Instalador Windows (NSIS) que agrega automaticamente al PATH del usuario
- Linux `.deb` ya agrega a `/usr/bin/` nativamente (sin cambios)
- macOS `.dmg` documentado con instrucciones de symlink
- Nombre `vizflow` consistente en todo el proyecto (codigo, UI, binarios, docs)
- CLI wrapper Node.js para desarrollo con `npm link`

**Non-Goals:**
- Publicacion en npm registry (solo `npm link` local)
- CI/CD pipeline para build multi-OS
- Code signing / notarizacion para macOS
- Auto-updater
- Soporte para `winget`, `brew`, `snap`, `flatpak`

## Decisions

### 1. Windows PATH: NSIS custom script vs post-install PowerShell

**Decision:** Script NSIS custom (`build/installer.nsh`) incluido via `nsis.include` de electron-builder.

**Alternativas consideradas:**
- **Post-install PowerShell script**: Requiere que el usuario ejecute un segundo script; rompe la experiencia de "instalar y listo".
- **Modificar PATH via `setx` en un script aparte**: Fragil, puede fallar si el usuario no tiene permisos o ejecuta desde PowerShell no elevado.
- **Usar `EnVar` plugin de NSIS**: Requiere bundling del plugin, mas complejo. No necesario.

**Racional:** electron-builder permite inyectar macros NSIS via `nsis.include`. Usamos las macros `customInstall` y `customUninstall` para modificar `HKCU\Environment\Path` directamente via registry, sin plugins externos. Es el enfoque mas simple y confiable. La modificacion es a nivel usuario (HKCU), no requiere permisos de administrador.

```nsh
!macro customInstall
  ReadRegStr $0 HKCU "Environment" "Path"
  WriteRegExpandStr HKCU "Environment" "Path" "$0;$INSTDIR"
  SendMessage ${HWND_BROADCAST} ${WM_WININICHANGE} 0 "STR:Environment" /TIMEOUT=500
!macroend

!macro customUninstall
  ; Remove install dir from PATH
  ReadRegStr $0 HKCU "Environment" "Path"
  ${StrReplace} $1 "$0" ";$INSTDIR" ""
  ${StrReplace} $1 "$1" "$INSTDIR;" ""
  ${StrReplace} $1 "$1" "$INSTDIR" ""
  WriteRegExpandStr HKCU "Environment" "Path" "$1"
  SendMessage ${HWND_BROADCAST} ${WM_WININICHANGE} 0 "STR:Environment" /TIMEOUT=500
!macroend
```

### 2. Nombre del ejecutable: sin espacios

**Decision:** `productName: "Vizflow"` produce `Vizflow.exe`. Suficientemente amigable para terminal.

**Alternativas consideradas:**
- `productName: "vizflow"` (minusculas): No sigue convencion de nombres de apps en Windows.
- Agregar un `.cmd` wrapper separado: Innecesario si el `.exe` ya tiene un nombre sin espacios.

**Racional:** Electron en Windows pasa los argumentos de linea de comandos a `process.argv` correctamente. `Vizflow.exe archivo.mmd` funciona igual que `vizflow archivo.mmd` (Windows es case-insensitive para comandos).

### 3. Linux: .deb ya cubre PATH, AppImage no

**Decision:** Sin cambios en la config de Linux. El `.deb` instala en `/usr/bin/` automaticamente (en PATH). El `.AppImage` es portable y queda documentado como opcion manual.

**Racional:** electron-builder para `.deb` usa el campo `name` de `package.json` (`vizflow`) como nombre de comando, y lo instala en `/usr/bin/vizflow`. Esto ya esta en el PATH. El `.AppImage` es un binario auto-contenido que el usuario mueve a donde quiera; documentamos `sudo mv Vizflow.AppImage /usr/local/bin/vizflow`.

### 4. macOS: .dmg con documentacion de symlink

**Decision:** El `.dmg` sigue el patron estandar: arrastrar a `/Applications/`. Documentamos `sudo ln -s /Applications/Vizflow.app/Contents/MacOS/Vizflow /usr/local/bin/vizflow`.

**Alternativas consideradas:**
- **Script post-install en el .dmg**: Los .dmg no tienen mecanismo de post-install sin crear un `.pkg` aparte. Agrega complejidad innecesaria para MVP.
- **Usar `brew` formula**: Requiere mantenimiento de un tap/formula separado; no es MVP.

**Racional:** El patron de symlink manual es estandar en macOS para herramientas CLI (ej. `code` de VSCode). Documentamos en el README.

### 5. CLI wrapper para desarrollo: bin/cli.js

**Decision:** Script Node.js que spawnea Electron con el path de la app y los argumentos.

**Racional:** Permite `npm link` para desarrollo local. El script localiza `electron` en `node_modules`, resuelve el path del archivo `.mmd`, y spawnea el proceso. Es la misma estrategia que usan herramientas como `electron-forge`.

### 6. Rename scope: minimo viable

**Decision:** Solo archivos de codigo y configuracion esenciales. Los `openspec/` historicos se actualizan solo si contienen referencias funcionales (no narrativas). `package-lock.json` se regenera naturalmente con `npm install`.

**Archivos a modificar (6):**
| Archivo | Cambio |
|---------|--------|
| `package.json` | `name`, `bin`, `appId`, `productName` |
| `src/main/main.js` | `title`, mensaje de error |
| `src/renderer/index.html` | `<title>` |
| `README.md` | Titulo, menciones |

**Archivos a crear (2):**
| Archivo | Proposito |
|---------|-----------|
| `build/installer.nsh` | NSIS PATH script |
| `bin/cli.js` | CLI wrapper para npm link |

## Risks / Trade-offs

- **[Riesgo] PATH modification via registry puede no aplicarse hasta reiniciar session** → El broadcast `WM_WININICHANGE` notifica a las apps del cambio. PowerShell requiere nueva ventana. Documentado en README.
- **[Riesgo] `StrReplace` en NSIS puede fallar si el PATH contiene el install dir como substring de otro path** → Mitigacion: usamos `;$INSTDIR` con delimitadores. Baja probabilidad en la practica.
- **[Trade-off] `oneClick: false` hace el instalador menos fluido pero permite personalizacion** → Aceptable. El usuario solo hace Next → Next → Finish.
- **[Trade-off] macOS requiere paso manual de symlink** → Aceptable para MVP. Se automatizara en v2 con `.pkg` o `brew`.
- **[Trade-off] `nodeIntegration: true` se mantiene en el MVP** → Sin cambios en esta fase. La migracion a contextBridge es scope de otro change.
