---
name: redux-data-layer
description: Wire server-backed state into Command Center Web — service, createAsyncThunk, RTK slice, and both registrations in src/store/index.ts. Use when data must be fetched into Redux, when adding an endpoint, or when a selector returns undefined.
argument-hint: <domain name>
---

# service → thunk → slice → store

Four files and **two edits to `src/store/index.ts`**. Missing the second is the most common
bug here: the thunk exists, the component dispatches, the selector returns `undefined` forever.

## First

1. **Does it already exist?** ~90 slices, ~65 thunks, several near-duplicate twins. Grep
   `store/slice/` and `store/thunks/` for the domain noun. Extending beats adding the 91st.
2. **Do you need Redux?** State used by one subtree is `useState`. Reserve the store for data
   shared across screens or surviving navigation. Plenty of existing slices got this wrong —
   don't cite them as precedent.
3. **Confirm the endpoint and payload shape.** Never invent a URL.

Templates for all four files: [templates.md](./templates.md).

## Step 1 — `src/services/<domain>.ts`

Import the verb helper from `./api`, never axios. URL is the path after the base
(`api/todo/get-todo-details`). Only wrap in `try/catch` if the catch does something —
`logError` then rethrow. Remember `deleteAPI`/`patchAPI` throw `error.response`.

## Step 2 — `src/store/thunks/<verbDomain>.ts`

One `createAsyncThunk` per file. Type string `'<domain>/<thunkName>'`.

**Check the envelope depth against a real response.** `postAPI` returns `{ status, data }`
where `data` is the axios body, and most endpoints wrap again — so the payload is usually
`response.data.data`. Wrong depth stores the wrapper; symptom is `.map is not a function`.

Use `rejectWithValue` when the user needs the server's message — otherwise the slice can only
show `action.error.message`, which is "Request failed with status code 500".

## Step 3 — `src/store/slice/<domain>Slice.ts`

House shape `{ data, loading, error }` — keep it; components and tests expect it. Type the
state interface. Clear `error` to `null` in `pending` or a stale banner outlives the retry.
`export default <name>Slice.reducer`.

## Step 4 — `src/store/index.ts`, BOTH edits

```ts
import xSlice from './slice/xSlice';        // 1. import
// inside combineReducers({ … })
    x: xSlice,                               // 2a. key = the selector path
// with the other re-exports at the bottom
export * from './thunks/fetchX';             // 2b. components import thunks from '../../../store'
```

Skip 2b and the import resolves to `undefined` — `dispatch(undefined)` throws at runtime,
not compile time.

## Step 5 — consume

```tsx
const dispatch = useDispatch<AppDispatch>();   // plain useDispatch won't accept a thunk
const { data, loading, error } = useSelector((s: RootState) => s.x);
useEffect(() => { dispatch(fetchX({ id })); }, [dispatch, id]);
```

Render **all three** states — loader, error, empty. Your slice will not survive a reload
(whitelist is `rolePermissions` only); refetch on mount rather than widening the whitelist.

## Done

- [ ] Service uses an `api.ts` helper
- [ ] Envelope depth verified against a real response
- [ ] Slice handles pending/fulfilled/rejected, clears error on pending
- [ ] `combineReducers` key added **and** thunk re-exported
- [ ] Loading / error / empty rendered
- [ ] `npm run lint && npm run build-dev` clean
