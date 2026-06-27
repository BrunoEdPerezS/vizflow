## Context

Vizflow ya tiene un editor Mermaid funcional (Electron + Monaco + Mermaid.js) y un CLI global (`vizflow archivo.mmd`). Pero crear el contenido `.mmd` requiere escribir sintaxis Mermaid a mano. El usuario quiere poder describir un diagrama en lenguaje natural y que un agente opencode lo genere automáticamente.

OpenCode soporta agentes personalizados definidos como archivos Markdown con YAML frontmatter en `~/.config/opencode/agents/`. El agente se invoca via `@NombreDelAgente` desde cualquier agente primario.

**Restricciones:**
- El agente es un subagente (invocado por Build u otro primario)
- El agente solo genera `.mmd`, no abre Vizflow
- Sin dependencias externas ni cambios en codigo de Vizflow
- El directorio de salida es configurable (preguntado en el primer uso)

## Goals / Non-Goals

**Goals:**
- Subagente `Grapher` que genera archivos `.mmd` desde lenguaje natural
- Pregunta la carpeta de salida la primera vez; reusa en iteraciones de la misma invocacion
- Soporta nuevo diagrama, edicion de existente, e iteracion sobre uno creado/editado
- Instalable copiando un archivo a `~/.config/opencode/agents/`
- Documentado en `agent/README.md`

**Non-Goals:**
- Persistencia entre invocaciones (cada invocacion es contexto fresco)
- Abrir Vizflow automaticamente
- Integracion con Kroki u otros renderers
- Soporte para otros formatos (PlantUML, D2)

## Decisions

### 1. Formato de definicion: Markdown con YAML frontmatter

**Decision:** Archivo `grapher.md` con frontmatter YAML y cuerpo en markdown (el system prompt).

**Alternativas:**
- JSON en `opencode.json`: Menos portable, mezcla configuracion de sistema con prompts.
- Typescript/JS plugin: Overkill para un agente que solo necesita un prompt.

**Racional:** Es el formato nativo de opencode para agentes. Un solo archivo autocontenido. Facil de copiar, versionar, revisar.

### 2. Permisos: edit (allow), question (allow), bash (deny)

**Decision:** El agente tiene `edit: allow` y `question: allow`. El resto denegado.

**Racional:** 
- `edit: allow` para leer y escribir `.mmd` (el agente primario delega la escritura real, pero el agente necesita permisos de edicion para operar sobre archivos)
- `question: allow` para preguntar carpeta de salida
- `bash: deny` porque no necesita ejecutar nada
- `webfetch: deny` porque genera desde conocimiento, no desde web

### 3. Memoria: dentro de la misma invocacion, no entre invocaciones

**Decision:** El system prompt instruye al agente a reusar el path del archivo dentro de la misma invocacion. Entre invocaciones, el agente primario debe pasar la ruta.

**Racional:** Los subagentes de opencode reciben contexto fresco en cada invocacion. No hay estado persistente. El system prompt documenta esta limitacion y el patron para manejarla.

### 4. Directorio de salida: preguntado con question tool

**Decision:** Usar `question` tool de opencode para preguntar la carpeta de salida en el primer uso.

**Alternativas:**
- Directorio fijo (ej. `diagrams/`): Simple pero inflexible.
- Argumento en el prompt: Requiere que el usuario siempre especifique la ruta.

**Racional:** `question` tool permite un solo paso de ida y vuelta. El agente pregunta una vez, recibe la respuesta, y procede. En iteraciones de la misma invocacion, reusa la respuesta ya obtenida.

### 5. System prompt: auto-contenido con referencia de sintaxis

**Decision:** El system prompt incluye una referencia compacta de sintaxis Mermaid (tipos principales, estructuras comunes) mas el formato `.mmd` de Vizflow.

**Racional:** El agente debe poder generar Mermaid valido sin consultar fuentes externas. La referencia incluida cubre los tipos de diagrama mas usados (flowchart, sequence, class, ER, Gantt, pie, state, git) con ejemplos minimos.

## Risks / Trade-offs

- **[Riesgo] Diagramas complejos pueden exceder la capacidad del modelo** → El system prompt sugiere patrones de simplificacion (subgraphs, splitting en multiples diagramas).
- **[Riesgo] El agente podria generar Mermaid invalido** → El system prompt enfatiza sintaxis correcta con ejemplos; Vizflow muestra errores de parseo en el preview.
- **[Trade-off] Sin persistencia entre invocaciones** → Documentado como limitacion conocida; el usuario debe pasar la ruta del archivo entre invocaciones.
- **[Trade-off] Sin opening automatico de Vizflow** → Mantiene el agente enfocado en una sola responsabilidad.
