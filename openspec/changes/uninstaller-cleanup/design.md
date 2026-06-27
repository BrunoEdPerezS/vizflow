## Context

El instalador NSIS de electron-builder para Windows ya incluye un `customInstall` que agrega `$INSTDIR` al PATH del usuario. Sin embargo, **no existe `customUninstall`** — al desinstalar, el directorio se borra pero la referencia en PATH queda huérfana. En Linux, `dpkg -r` tampoco limpia los directorios de datos de usuario (`~/.config/vizflow/`, `~/.cache/vizflow/`).

El `customInstall` actual tampoco verifica si el directorio ya existe en PATH antes de agregarlo, lo que causa duplicados al reinstalar.

## Goals / Non-Goals

**Goals:**
- Windows: remover `$INSTDIR` del PATH al desinstalar
- Windows: evitar entradas duplicadas en PATH al reinstalar
- Linux (.deb): limpiar `~/.config/vizflow/` y `~/.cache/vizflow/` al ejecutar `apt purge` o `dpkg --purge`

**Non-Goals:**
- No se borran archivos `.mmd` del usuario (son datos de usuario, no de la app)
- No se modifica el instalador de macOS (`.dmg` no tiene desinstalador)
- No se modifica el AppImage (es portable, no se instala)
- No se agrega `DELETE_APP_DATA_ON_UNINSTALL` para Windows (los datos de Electron en `%APPDATA%` son mínimos)

## Decisions

### 1. `customUninstall` con `StrReplace` en NSIS

**Decisión:** Usar `${StrReplace}` para remover `$INSTDIR` del PATH. Buscar y eliminar las tres variantes: `;$INSTDIR`, `$INSTDIR;`, y `$INSTDIR` solo.

**Alternativa:** Usar `${StrStr}` para buscar y manipulación manual de strings. Más verboso y propenso a errores.

**Racional:** `${StrReplace}` es una macro estándar de NSIS (`StrFunc.nsh`) incluida en electron-builder. Maneja los tres casos de posición (al principio, en medio, al final) con tres reemplazos secuenciales.

### 2. Deduplicación en `customInstall` con `${StrContains}`

**Decisión:** Antes de agregar `$INSTDIR` al PATH, verificar si ya existe con `${StrContains}`. Solo agregar si no está presente.

**Alternativa:** Hacer append ciego + limpiar duplicados después. Más complejo y podría dejar entries fantasmas.

**Racional:** Una verificación antes de escribir es más simple y evita el problema de raíz.

### 3. Linux: `postrm` script en el paquete `.deb`

**Decisión:** Usar la opción `deb.afterRemove` de electron-builder en `package.json` para apuntar a un script que verifica `$1 = purge` y ejecuta `rm -rf` sobre los directorios de configuración.

**Alternativa:** Incluir un script `postrm` manual en la estructura del paquete. Más complejo, requiere entender el empaquetado interno de electron-builder.

**Racional:** electron-builder soporta `afterRemove` nativamente. El script se ejecuta con argumentos de dpkg: `$1 = remove` o `$1 = purge`. Solo limpiamos en `purge` para respetar la semántica de Debian (remove mantiene configs, purge las borra).

## Risks / Trade-offs

- **[Riesgo] `${StrReplace}` podría romper otras entries del PATH que contengan el mismo string**: Si un usuario tiene `C:\apps\vizflow-dev\` y `C:\apps\vizflow\`, el reemplazo podría afectar la entry incorrecta. → **Mitigación**: NSIS compara `$INSTDIR` completo con delimitadores `;`, no como substring. El riesgo de colisión es mínimo porque `$INSTDIR` es una ruta completa como `C:\Users\...\AppData\Local\Programs\vizflow`.
- **[Riesgo] El script `postrm` se ejecuta como root en Linux**: `~/.config/vizflow` pertenece al usuario que instaló. → **Mitigación**: El script debe detectar el usuario real (`$SUDO_USER`) y borrar desde su home, no desde `/root`.
