# Templates

## `src/services/forums.ts`

```ts
import { getAPI, postAPI } from './api';
import { logError } from '../utils/helpers';
import { IForumPersonaMapping } from '../types/response';

export const getForumPersonaMappings = async (params: {
    forumId: number;
}): Promise<IForumPersonaMapping[]> => {
    const response = await getAPI('api/forum/get-persona-mappings', params);
    return response.data.data;
};

export const saveForumPersonaMapping = async (payload: {
    forumId: number;
    personaIds: number[];
}): Promise<{ data: unknown; statusCode: number; message: string }> => {
    try {
        const response = await postAPI('api/forum/save-persona-mapping', payload);
        return response.data;
    } catch (error) {
        logError('Error saving forum persona mapping:', error);
        throw error;
    }
};
```

`getAPI(url, params)` → query string. `postAPI(url, data, service?)` — third arg
`AppService.CHATBOT` hits `VITE_CHATBOT_BASE_URL`. `deleteAPI(url, data)` takes a **body**.
Normalise dates to ISO at this boundary (see `services/todo.ts`).

## `src/store/thunks/fetchForumPersonaMappings.ts`

```ts
import { createAsyncThunk } from '@reduxjs/toolkit';
import { getForumPersonaMappings } from '../../services/forums';
import { IForumPersonaMapping } from '../../types/response';

export const fetchForumPersonaMappings = createAsyncThunk<
    IForumPersonaMapping[],
    { forumId: number },
    { rejectValue: string }
>('forumPersonaMappings/fetchForumPersonaMappings', async (payload, { rejectWithValue }) => {
    try {
        return await getForumPersonaMappings(payload);
    } catch (error: any) {
        return rejectWithValue(
            error?.response?.data?.message ?? 'Unable to load forum persona mappings',
        );
    }
});
```

Most existing thunks use the shorter form (`async payload => (await getAPI(...)).data.data`)
with no error handling. Use the form above for anything user-facing.

## `src/store/slice/forumPersonaMappingsSlice.ts`

```ts
import { createSlice } from '@reduxjs/toolkit';
import { fetchForumPersonaMappings } from '../thunks/fetchForumPersonaMappings';
import { IForumPersonaMapping } from '../../types/response';

interface IState {
    data: IForumPersonaMapping[];
    loading: boolean;
    error: string | null;
}

const initialState: IState = { data: [], loading: false, error: null };

const forumPersonaMappingsSlice = createSlice({
    name: 'forumPersonaMappings',
    initialState,
    reducers: {
        clear: state => {
            state.data = [];
            state.error = null;
        },
    },
    extraReducers: builder => {
        builder
            .addCase(fetchForumPersonaMappings.pending, state => {
                state.loading = true;
                state.error = null;
            })
            .addCase(fetchForumPersonaMappings.fulfilled, (state, action) => {
                state.loading = false;
                state.data = action.payload;
            })
            .addCase(fetchForumPersonaMappings.rejected, (state, action) => {
                state.loading = false;
                state.error = action.payload ?? action.error.message ?? 'Something went wrong';
            });
    },
});

export const { clear } = forumPersonaMappingsSlice.actions;
export default forumPersonaMappingsSlice.reducer;
```

Immer is on — mutate directly, never mutate *and* return. `action.payload` on `rejected`
only exists if the thunk used `rejectWithValue`; the `??` chain covers both styles. No
derived data in state — compute it in a `useMemo`.

## `src/store/index.ts` — both edits

```ts
import forumPersonaMappingsSlice from './slice/forumPersonaMappingsSlice';
//   inside combineReducers({ … })
     forumPersonaMappings: forumPersonaMappingsSlice,
//   with the other thunk re-exports
export * from './thunks/fetchForumPersonaMappings';
```
