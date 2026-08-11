---
name: bugfix
description: Diagnose and fix a defect in Command Center Web — reproduce, root-cause, minimal fix, regression test, verify. Use for Bug tickets, "this is broken", console errors, blank screens, data not loading, stale UI, or a failing test/build.
argument-hint: <KBHH-#### or the broken behaviour>
---

# Bugfix

**Find the cause before changing anything.** The fastest-looking fix here is usually a `?.`
or a `try/catch` that hides the defect and turns a crash into silently wrong data.

## 1. Establish the behaviour

Steps to reproduce (screen, role, filters) · expected vs actual · environment (local/dev/QA/
UAT/prod — env-specific bugs are usually `VITE_*` config, not app code) · evidence (console
error, failed request + status + body, screenshot).

Ticket → `jira-ticket`; check `customfield_10080` (Environment Affected) and attachments.
**If you can't reproduce or reason to the cause, say so and ask.** No speculative fixes.

## 2. Localise

| Symptom | Start here |
|---|---|
| Blank screen | Console error → crashing component; `Router.tsx`, `ProtectedRoute` gating |
| `.map is not a function` | Thunk unwrapped wrong depth — `response.data` vs `.data.data` |
| `undefined` from `useSelector` | `combineReducers` key ≠ selector path, or thunk never re-exported from `store/index.ts` |
| No network call at all | Thunk imported `undefined` (missing `export * from`), or a `useEffect` dep that never changes |
| 401 / redirect loop | MSAL — `services/interceptor.ts`, `src/config/auth.ts` |
| State lost on reload | Expected: only `rolePermissions` is persisted |
| Stale UI after an action | Missing refetch, or a nested mutation Immer didn't track |
| Remote MFE won't mount | `VITE_*_URL` in `.env.<env>`; the remote's own deploy; shared-dep skew in `vite.config.ts` |
| Wrong styles only in prod | `cssCodeSplit: false` + the global `*-overrides.scss` files leaking |
| Dev fine, build fails | Type error — dev server doesn't run `tsc`. `npm run build-dev` |
| `Element type is invalid` in a test | `jest-setup.js` globally mocks `react-router-dom` to `useNavigate` **only** — re-mock in your test |
| `Cannot use import statement outside a module` in a test | `transformIgnorePatterns: ['node_modules']` — mock the ESM dep |

Search on: the error text, the failing API path, the component name from React DevTools.
**Confirm the file you're editing is the one that runs** — see the twins list in
copilot-instructions.

## 3. State the cause before editing

> `fetchToDos` returns `response.data.data`, but `get-todoNew-details` wraps one level
> deeper, so the slice holds the envelope and `ToDos.tsx` calls `.map` on it.

Can't write that sentence? You haven't found it yet.

## 4. Fix minimally

- Fix the cause, not the symptom. A default `[]` at the render site turns a crash into an
  empty table with no error — worse.
- Fewest lines possible. No opportunistic refactor, no reformatting.
- Don't swallow errors: a `catch` is only correct if it does something — `logError` **and**
  set an error state the user sees.
- Large or risky proper fix? Offer both the minimal one and the real one; let the user pick.
- Defect inside a federated remote → this repo can't fix it. Report what you verified on the
  shell side (route, mount, props, env URL, auth handoff) so it can be rerouted.

## 5. Regression test

Must **fail before the fix and pass after** — write it first if you can. Follow `unit-tests`.
Thunk bug → test the thunk against a realistic mock response. Helper bug → test the helper
directly (`src/utils/helpers.test.ts` exists).

## 6. Verify & report

```bash
npm test -- <path> && npm test && npm run lint && npm run build-dev
```

Reproduce the original steps in the browser. Then say what the cause was, what you changed,
and what you did **not** fix — adjacent problems go on a separate ticket.

Ship via `raise-pr`, branch `bugfix/KBHH-####-summary`.
