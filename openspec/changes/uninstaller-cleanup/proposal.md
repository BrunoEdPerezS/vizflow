## Why

Al desinstalar Vizflow, la entrada en el PATH del usuario (`HKCU\Environment\Path`) que apunta al directorio de instalación ya eliminado queda como basura. Esto pasa porque el `build/installer.nsh` define `customInstall` (agrega al PATH) pero nunca definió `customUninstall` (remover del PATH). En Linux, los directorios `~/.config/vizflow/` y `~/.cache/vizflow/` tampoco se limpian al ejecutar `dpkg -r`.

## What Changes

- Agregar macro `customUninstall` en `build/installer.nsh` para remover `$INSTDIR` del PATH del usuario durante la desinstalación en Windows
- Agregar deduplicación en `customInstall` para evitar entradas repetidas en el PATH al reinstalar
- Agregar script `postrm` para `.deb` que limpie `~/.config/vizflow/` y `~/.cache/vizflow/` al purgar el paquete en Linux

## Capabilities

### New Capabilities

- `uninstall-cleanup`: El desinstalador de Windows remueve la entrada del PATH agregada durante la instalación. El paquete `.deb` de Linux limpia los directorios de configuración y caché del usuario al ejecutar `purge`.

### Modified Capabilities

None. The existing `vizflow-global-cli` spec already requires PATH cleanup on uninstall and deduplication on reinstall — this change implements those requirements.

## Impact

- `build/installer.nsh`: Agregar `customUninstall`, mejorar `customInstall` con deduplicación
- `package.json`: Agregar `deb.afterRemove` (o `scripts/postrm.sh`) para limpieza post-desinstalación en Linux
- `README.md`: Actualizar sección de desinstalación
