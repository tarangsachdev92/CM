import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import { fetchDelegations } from '../thunks/delegationThunks';
import { DelegationState } from '../../components/organisms/delegation-Table/delegation-type';

const initialState = {
    data: [],
    loading: false,
    totalRows: 0,
    pageNumber: 1,
    pageSize: 10,
    totalPages: 1,
};

const delegationSlice = createSlice({
    name: 'delegation',
    initialState,
    reducers: {
        setPaging: (
            state,
            action: PayloadAction<Partial<Pick<DelegationState, 'pageNumber' | 'pageSize'>>>,
        ) => {
            if (action.payload.pageNumber !== undefined) {
                state.pageNumber = action.payload.pageNumber;
            }
            if (action.payload.pageSize !== undefined) {
                state.pageSize = action.payload.pageSize;
            }
        },
    },
    extraReducers: builder => {
        builder
            .addCase(fetchDelegations.pending, state => {
                state.loading = true;
            })
            .addCase(fetchDelegations.fulfilled, (state, action) => {
                state.loading = false;
                state.data = action.payload.items;
                state.totalRows = action.payload?.totalRows ?? 0;
                state.totalPages = action.payload?.totalPages ?? 1;
            })
            .addCase(fetchDelegations.rejected, state => {
                state.loading = false;
            });
    },
});
export const { setPaging } = delegationSlice.actions;
export default delegationSlice.reducer;
