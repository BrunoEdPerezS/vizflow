# Grapher — Agente Mermaid para Vizflow

Subagente de opencode que genera diagramas Mermaid en formato `.mmd` a partir de descripciones en lenguaje natural. Se invoca desde cualquier agente primario con `@Grapher`.

## Instalacion

Copiar el archivo `grapher.md` a la carpeta de agentes de opencode:

**Windows (PowerShell):**
```powershell
Copy-Item agent\grapher.md "$env:USERPROFILE\.config\opencode\agents\grapher.md"
```

**Linux / macOS:**
```bash
cp agent/grapher.md ~/.config/opencode/agents/grapher.md
```

## Verificacion

Reiniciá opencode. `@Grapher` debe aparecer en el autocompletado.

## Uso

```
@Grapher crea un diagrama de arquitectura de microservicios con API gateway, auth service y base de datos

@Grapher un diagrama de secuencia del flujo de login OAuth2

@Grapher en diagrams/login.mmd, agregá un paso de validacion de email
```

### Flujo tipico

1. Describís el diagrama que querés con `@Grapher`
2. Grapher te pregunta en qué carpeta guardarlo (solo la primera vez)
3. Genera el `.mmd` con sintaxis Mermaid y frontmatter YAML
4. Abrís el resultado con: `vizflow <archivo>`

### Iteraciones

Dentro de la misma conversacion, Grapher reusa el archivo automaticamente:
```
@Grapher crea diagrama de login
(te pregunta carpeta, crea diagrams/login.mmd)

@Grapher agregale un paso de MFA con SMS
(lee diagrams/login.mmd, modifica, escribe — sin preguntar carpeta)
```

Entre sesiones, pasá la ruta explícitamente:
```
@Grapher en diagrams/login.mmd, cambiá el color del nodo principal
```
