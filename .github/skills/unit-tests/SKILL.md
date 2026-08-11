---
name: unit-tests
description: Write or fix Jest tests for Command Center Web using React Testing Library and the repo's mocking recipes for konnect-react-components, redux-mock-store, thunks and services. Use when adding tests, raising Sonar coverage, writing a regression test, or when a test fails.
argument-hint: <path to component under test>
---

# Unit tests

`npm test` → `jest --coverage` → `coverage/lcov.info` → Sonar.

## RTL, not Enzyme

Both exist and the split isn't random: **Enzyme (40 files)** covers every atom and molecule
plus older organisms (`shallow` + snapshots, community React-18 adapter). **RTL (25 files)**
is organisms only, and specifically the newer areas — tags, tool-management, performance-
management, global-filters, appsAndReports, add-new-forum, notifications.

**Write new tests in RTL.** Touch an Enzyme file only to keep it passing; don't rewrite a
working suite, and don't mix RTL into a file using `shallow`. **No new snapshot tests** —
they lock in markup, break on every design-system bump, and get `-u`'d blindly.

## What `jest-setup.js` already gives you

`global.React` (**no `import React` needed**) · Enzyme adapter · `jest-canvas-mock` ·
`ResizeObserver` · `TextEncoder`. `.scss` → `identity-obj-proxy`, images →
`__mocks__/fileMock.js`. Coverage is always on.

### ⚠️ The trap

`jest-setup.js` contains a **global mock of `react-router-dom` exposing only `useNavigate`**.
So `Link`, `Navigate`, `useLocation`, `useParams`, `BrowserRouter` are `undefined` in every
test unless that test re-mocks the module. Symptom is `Element type is invalid`, pointing
nowhere useful.

```tsx
jest.mock('react-router-dom', () => ({
    useNavigate: () => jest.fn(),
    Link: ({ to, children }: any) => <a href={to}>{children}</a>,
}));
```

Do **not** "fix" the global mock — dozens of suites depend on it.

Also `transformIgnorePatterns: ['node_modules']` — nothing there is transformed, so an
ESM-only dep throws `Cannot use import statement outside a module`. Mock it.

## Mocking recipes

Full template: [template.md](./template.md).

**`konnect-react-components` — always mock**, and only the components the file imports. An
incomplete factory throws `X is not a function`; an over-broad one hides real import errors.
Stubs forward the props you assert on:

```tsx
jest.mock('konnect-react-components', () => ({
    Table: ({ data }: any) => <div data-testid="table">{data?.map(/* … */)}</div>,
    SearchInput: ({ onChange }: any) => (
        <input data-testid="search-input" onChange={e => onChange(e.target.value)} />
    ),
    AnimatedLoaders: () => <div data-testid="loader" />,
}));
```

Note `SearchInput`'s real contract passes a **raw value**, not an event — match the real
component or your test passes against a stub that lies.

**State** — `redux-mock-store` + `Provider`. It does not run reducers: assert on
`store.getActions()`, never on next state. Test reducers by calling the slice reducer
directly. One value only? `jest.mock('react-redux', () => ({ useSelector: jest.fn() }))`.

**Thunks/services** — mock the thunk module to return a plain action
(`() => ({ type: 'MOCK_X' })`) so nothing hits the network. `axios-mock-adapter` is installed
for real service-level tests.

**Usual suspects** — `../../atoms` barrel · `utils/customHooks` (`useDebounce: v => v`, or
search tests need timer advancing and go flaky) · `react-i18next` (`t: k => k`, so you assert
on keys).

## Assert

Required props render · each branch (loading → loader, error/empty → empty state, data →
rows) · interactions via `fireEvent` then the visible result · async wrapped in `waitFor`.

Query priority `getByRole` / `getByText` / `getByPlaceholderText`, `getByTestId` only for your
own stubs. Never assert on CSS-module class names — they're hashed.

`afterEach(() => jest.clearAllMocks())` or call counts leak between tests.

## Run them

`npm test -- <path>`, `npm test -- -t "name"`. If it errors on a missing config or on
`.module.scss`, tracked files are missing from your working tree (`jest.config.js`,
`jest-setup.js`, `babel.config.js`, `__mocks__/fileMock.js`) — `git status` and restore.
Never write a replacement config.
