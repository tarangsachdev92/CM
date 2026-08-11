# Copilot Agent Skills

Task instructions Copilot loads on demand in VS Code agent mode, Copilot CLI and the cloud
agent. [Agent Skills](https://code.visualstudio.com/docs/agent-customization/agent-skills)
format — portable to Claude Code and other Agent-Skills-aware tools.

| Skill | For |
|---|---|
| `jira-ticket` | KBHH ticket → work brief mapped to real files |
| `feature-development` | Story/Task: plan → data layer → components → i18n → tests → build |
| `bugfix` | Reproduce → root-cause → minimal fix → regression test |
| `redux-data-layer` | service → thunk → slice → **both** edits to `store/index.ts` |
| `react-component` | Layer choice, SCSS modules, design system, required states |
| `unit-tests` | RTL patterns + this repo's mocking recipes |
| `raise-pr` | Self-review, gates, PR body, Jira write-back |

`jira-ticket` feeds `feature-development` and `bugfix`; those call `redux-data-layer`,
`react-component`, `unit-tests`, then `raise-pr`. Always-on conventions live in
[`../copilot-instructions.md`](../copilot-instructions.md).

## Using them

Copilot auto-loads on a `description` match, or invoke explicitly:

```
/jira-ticket KBHH-4267
/bugfix KBHH-6114
/redux-data-layer forumPersonaMappings
/unit-tests src/components/organisms/tags/TagTable.tsx
```

VS Code 1.108+. `.github/skills/` is discovered by default. `github.copilot.chat.skillTool.enabled`
runs a skill in a forked subagent context.

## Token budget

Progressive disclosure — three tiers:

1. **Always in context:** `copilot-instructions.md` (~60 lines) + the 7 `description` lines.
2. **On match:** one SKILL.md body, 45–75 lines.
3. **On demand only:** the linked reference files (`templates.md`, `design-system.md`,
   `template.md`, `example-brief.md`) — Copilot reads them when the task actually needs them.

Keep it that way. Detail belongs in a reference file, not in a SKILL.md body, and never in
`copilot-instructions.md`.

## Jira via MCP

`.vscode/mcp.json` → Atlassian's remote MCP server (`mcp.atlassian.com/v1/mcp/authv2`).
Start it from the MCP view and complete OAuth once. `.gitignore` excludes `.vscode/*` — add
`!.vscode/mcp.json` to share it. Without MCP, `jira-ticket` asks you to paste the ticket
rather than inventing content.

## Maintaining

Frontmatter `name` **must** match the folder name; `description` is what Copilot matches on,
so keep it concrete about *when*. Update a skill in the same PR that changes the convention —
a stale skill is worse than none, because the agent follows it confidently.
