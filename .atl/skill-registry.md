# Skill Registry

**Orchestrator use only.** Read this registry once per session to resolve skill paths, then pass pre-resolved paths directly to each sub-agent's launch prompt. Sub-agents receive the path and load the skill directly — they do NOT read this registry.

## User Skills

| Trigger                                                                                       | Skill          | Path                                                               |
| --------------------------------------------------------------------------------------------- | -------------- | ------------------------------------------------------------------ |
| working with FastAPI APIs                                                                     | fastapi        | /Users/javi/dev/SMARTESI-WEB/.agent/skills/fastapi/SKILL.md        |
| react, frontend, tailwind, vite, typescript react, component, useState, tanstack, react query | frontend-react | /Users/javi/dev/SMARTESI-WEB/.agent/skills/frontend-react/SKILL.md |

## Project Conventions

| File      | Path                                   | Notes |
| --------- | -------------------------------------- | ----- |
| GEMINI.md | /Users/javi/dev/SMARTESI-WEB/GEMINI.md |       |

Read the convention files listed above for project-specific patterns and rules. All referenced paths have been extracted — no need to read index files to discover more.
