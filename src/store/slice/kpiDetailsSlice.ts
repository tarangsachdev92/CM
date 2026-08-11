import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import { fetchKpiDetailsCard } from '../thunks/kpiDetails';
import { KPICardData } from '../../components/organisms/performance-management-customizations/kpiDetailsToCardData';


interface KpiDetailsState {
    cardData: KPICardData | null;
    isFetching: boolean;
    isSaving: boolean;
    error: string | null;
}

const initialState: KpiDetailsState = {
    cardData: null,
    isFetching: false,
    isSaving: false,
    error: null,
};

const kpiDetailsSlice = createSlice({
    name: 'kpiDetails',
    initialState,
    reducers: {},
    extraReducers(builder) {
        // GET
        builder.addCase(fetchKpiDetailsCard.pending, (state) => {
            state.isFetching = true;
            state.error = null;
        });
        builder.addCase(
            fetchKpiDetailsCard.fulfilled,
            (state, action: PayloadAction<KPICardData>) => {
                state.isFetching = false;
                state.cardData = action.payload;
                state.error = null;
            },
        );
        builder.addCase(fetchKpiDetailsCard.rejected, (state, action) => {
            state.isFetching = false;
            state.error = action.payload as string;
        });
    },
});

export default kpiDetailsSlice.reducer;
