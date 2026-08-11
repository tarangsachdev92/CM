---
name: feature-development
description: End-to-end workflow for a new feature in Command Center Web — plan, data layer, components, i18n, tests, verified build. Use for a Story/Task, a new screen/widget/flyout, or "implement this ticket".
argument-hint: <KBHH-#### or feature description>
---

# Feature development

Orchestrator. Delegates to `jira-ticket`, `redux-data-layer`, `react-component`,
`unit-tests`, `raise-pr`.

## 1. Plan before typing

Ticket → run `jira-ticket` first. No ticket → get the same in one round: what the user sees,
where the data comes from, who's allowed to see it, what happens on failure.

Grep the domain noun across `src/screens/`, `organisms/`, `services/`, `store/slice/` — this
repo has 20+ feature areas and almost any new screen has prior art. **Check for a
half-migrated twin before creating anything** (see copilot-instructions). If the feature
belongs inside a federated remote, say so now — this repo only owns routing/mounting/props/env.

State the plan as a file list first:

```
NEW   src/services/<domain>.ts                (or extend existing)
NEW   src/store/thunks/fetch<Domain>.ts
NEW   src/store/slice/<domain>Slice.ts
EDIT  src/store/index.ts                      ← reducer key AND thunk re-export
NEW   src/components/organisms/<feature>/<Name>.tsx + .module.scss
EDIT  src/Router.tsx                          (new route only)
EDIT  public/locales/{en,es,pt,zh}/<ns>.json
NEW   <Name>.test.tsx
```

## 2. Build bottom-up

1. **Types** → `src/types/request.d.ts` / `response.d.ts`. Don't spread fresh `any`.
2. **Data layer** → `redux-data-layer`. Skip if purely presentational.
3. **Components** → `react-component`, lowest viable layer.
4. **Screen + route** → thin screen composing organisms; `ProtectedRoute` if admin-only.
5. **Strings** → `useTranslation()` + key in all four locales.

## 3. States the ticket won't mention

Implement all of them — their absence is the most common review rejection:

- **Loading** → `AnimatedLoaders` / `KpiCardSkeleton`
- **Error** → message from the rejected thunk, via `EmptyStateOfComponent` or `Toast`
- **Empty** → a real empty state, not a blank div
- **Permission** → gate it if role-gated
- **Overflow** → `EllipsisWithTooltip`

## 4. Tests

`unit-tests`. Minimum: the four render branches, the primary interaction, any non-trivial
helper. RTL, no new snapshots.

## 5. Verify — actually run these

```bash
npm run lint && npm test && npm run build-dev
```

`npm run dev` passing proves nothing about types. Then exercise it in the browser: the new
path, a failing API (block it in devtools), and an empty dataset.

Ship via `raise-pr`.
