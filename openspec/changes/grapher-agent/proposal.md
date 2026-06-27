## Why

Crear diagramas Mermaid requiere escribir sintaxis a mano, conocer los tipos de diagrama disponibles y recordar la estructura del formato `.mmd` de Vizflow (YAML frontmatter, anotaciones `%%#`). Esto frena a los usuarios que quieren visualizar ideas rápido desde lenguaje natural. Un subagente de opencode especializado elimina esta fricción: el usuario describe la idea y el agente genera el `.mmd` listo para abrir con Vizflow.

## What Changes

- Nuevo subagente opencode `Grapher` definido en `agent/grapher.md` (YAML frontmatter + system prompt)
- El agente genera archivos `.mmd` con sintaxis Mermaid válida, YAML frontmatter (`title`, `theme`) y anotaciones `%%#`
- Pregunta la carpeta de salida con `question` en el primer uso; reusa la ruta en iteraciones de la misma invocacion
- El agente es invocado via `@Grapher` desde cualquier agente primario con permisos de escritura (ej. Build)
- Archivo `agent/README.md` con instrucciones de instalacion: copiar a `~/.config/opencode/agents/`
- Sin dependencias nuevas ni cambios en el codigo de Vizflow

## Capabilities

### New Capabilities

- `grapher-agent`: Subagente opencode que genera y edita diagramas Mermaid en formato `.mmd` a partir de descripciones en lenguaje natural, con soporte para iteraciones y persistencia en archivo

### Modified Capabilities

<!-- No existing capabilities to modify -->

## Impact

- **Archivos nuevos**: `agent/grapher.md`, `agent/README.md`
- **Sin impacto en codigo existente**: Vizflow no se modifica
- **Sin dependencias nuevas**
- **Instalacion manual**: copiar `agent/grapher.md` a `~/.config/opencode/agents/`
