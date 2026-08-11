# Command Center Web

React 18 + TS 5.6 + Vite 6 host shell (`SC-DAWA/command_center_web`, Jira key **KBHH**).
Renders its own screens and mounts 8 Module Federation remotes.

## Layout

`src/` → `components/{atoms,molecules,organisms}` · `screens/<feature>` · `services/*.ts`
(one per API domain) · `store/{slice,thunks}` + `store/index.ts` (single rootReducer) ·
`utils/helpers.ts` · `i18n` (strings in `public/locales/{en,es,pt,zh}/`) · `ui-kit` (vendored).

## Hard rules

1. **Never call axios directly.** Use `getAPI`/`postAPI`/`putAPI`/`patchAPI`/`deleteAPI`
   from `src/services/api.ts` — they attach diagnostics headers and route through
   `interceptor.ts`, which owns MSAL auth.
2. **No new dependencies.**
3. UI priority: `konnect-react-components` (117 components) → `antd` → hand-rolled.
4. **No `console.*`** — `logError`/`logWarning` from `src/utils/helpers` (dev-only no-ops).
5. Env vars are `process.env.VITE_FOO` (not `import.meta.env`). New ones go in **all four**
   `.env.development|qa|uat|production`.
6. **redux-persist whitelist is `['rolePermissions']` only.** Nothing else survives reload.
7. Styles in a sibling `X.module.scss`; tokens from `src/assets/css/colors.scss`, `sizes.scss`.
8. New user-facing strings → `useTranslation()` + key added to **all four** locales.

## Gotchas that cost hours

- `src/store/index.ts` needs **two** edits per new slice: the `combineReducers` key **and**
  `export * from './thunks/…'`. Missing the second = `undefined` at runtime, not compile time.
- API responses are usually double-wrapped: the payload is at `response.data.data`.
- `deleteAPI`/`patchAPI` throw `error.response`; the others throw the raw error.
- **Mid-migration twins — check which one `store/index.ts` and `Router.tsx` actually use:**
  `delegationSlice`/`…New`, `primaryRoleDataSlice`/`…New`, `addNewForumSlice`/`addNewForumsSlice`
  (the first is imported **twice under two names**), `organisms/todo`/`todoTesting`.
- **Remotes owned by other repos** (this repo controls only routing/mounting/props/env URLs):
  Issue Management, DPM, Advanced Forecasting, Digital Worker, Risk & Opportunity,
  Knowledge Hub, Truck Inspection, Gemba Walk.

## Lint & format

Prettier (`.prettierrc.json`): **4-space, single quotes, trailing commas, `arrowParens: avoid`,
width 100**. Prettier is **not** wired into ESLint — `npm run lint` won't catch formatting.

ESLint 9 runs **`eslint.config.js`** (flat). **`.eslintrc.json` is dead config, ignore it.**
So: `no-explicit-any` is **off**, there's no `eslint-plugin-react` (no `prop-types` rule) and
no `jsx-a11y`. Only `no-unused-vars` (error, `_` prefix exempt) and the react-hooks rules bite.

Don't reformat lines you aren't otherwise changing — several files are 2-space against a
4-space config, and sweeping them hides your real diff.

## Commands

`npm run dev` (:3000) · `npm run lint` · `npm test` (jest --coverage → Sonar) ·
`npm run build-dev|qa|uat|production`

`npm run dev` does **not** type-check. `npm run build-*` runs `tsc -b` first — always run it
before a PR; the PR template makes you attest to a clean local build.

## Branches

Cut from `development`: `bugfix/KBHH-1234-short-summary`, `feature/KBHH-1234-…`.
Commit subjects prefixed `KBHH-1234: …`. `.github/CODEOWNERS` is one catch-all rule — every
PR needs one of the six owners.

> `.gitignore` ignores `.vscode/*` except `extensions.json`. Add `!.vscode/mcp.json` if the
> team should share the Jira MCP config.
