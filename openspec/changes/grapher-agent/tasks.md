## 1. Create agent directory and files

- [x] 1.1 Create `agent/` directory at project root
- [x] 1.2 Create `agent/grapher.md` with YAML frontmatter and system prompt
- [x] 1.3 Create `agent/README.md` with installation instructions

## 2. YAML frontmatter

- [x] 2.1 Set `mode: subagent`
- [x] 2.2 Set `description` field
- [x] 2.3 Configure permissions: `edit: allow`, `question: allow`, `read: allow`, `glob: allow`, `bash: deny`, `webfetch: deny`

## 3. System prompt sections

- [x] 3.1 Identity: name, role, and when to invoke
- [x] 3.2 New diagram workflow: analyze prompt → choose type → ask directory → generate .mmd → report path
- [x] 3.3 Edit existing workflow: read file → modify → write
- [x] 3.4 Iteration memory: reuse file path within same invocation
- [x] 3.5 Cross-invocation guidance: primary agent must pass file path
- [x] 3.6 Mermaid syntax quick reference (flowchart, sequence, class, ER, state, Gantt, pie, git)
- [x] 3.7 Vizflow .mmd format reference (YAML frontmatter, %%# annotations)
- [x] 3.8 Best practices: descriptive IDs, subgraphs, avoid cryptic names

## 4. README

- [x] 4.1 Description of what Grapher is
- [x] 4.2 Windows install command
- [x] 4.3 Linux/macOS install command
- [x] 4.4 Usage examples (`@Grapher ...`)
- [x] 4.5 Verification steps

## 5. Verification

- [x] 5.1 Copy `grapher.md` to `~/.config/opencode/agents/`
- [ ] 5.2 Verify `@Grapher` appears in opencode autocompletion
- [ ] 5.3 Test: `@Grapher crea un diagrama flowchart de un login con email y password`
- [ ] 5.4 Verify generated .mmd opens correctly in Vizflow
