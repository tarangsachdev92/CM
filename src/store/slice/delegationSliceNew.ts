import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import { DelegationState } from '../../components/organisms/delegation-Table/delegation-type';
import { fetchDelegationsNew } from '../thunks/delegationThunks';

const initialState = {
    data: [],
    loading: false,
    totalRows: 0,
    pageNumber: 1,
    pageSize: 10,
    totalPages: 1,
};

const delegationSliceNew = createSlice({
    name: 'delegation-new',
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
            .addCase(fetchDelegationsNew.pending, state => {
                state.loading = true;
            })
            .addCase(fetchDelegationsNew.fulfilled, (state, action) => {
                state.loading = false;
                state.data = action.payload.items;
                state.totalRows = action.payload?.totalRows ?? 0;
                state.totalPages = action.payload?.totalPages ?? 1;
            })
            .addCase(fetchDelegationsNew.rejected, state => {
                state.loading = false;
            });
    },
});
export const { setPaging } = delegationSliceNew.actions;
export default delegationSliceNew.reducer;
