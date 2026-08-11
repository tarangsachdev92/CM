import { createSlice } from '@reduxjs/toolkit';
import {
    fetchFunctions,
    fetchSubfunctionsOnMultipleFunctionIds,
} from '../thunks/fetchFunctionSubfunctionInformation';
import { IRoleSubFunctionsData, IRoleFunctionsData } from '../../types/response';

interface IFunctionalInformation {
    data: {
        functions: IRoleFunctionsData[] | [];
        subfunctions: IRoleSubFunctionsData[] | [];
    };
    isLoading: boolean;
    error: {} | null;
}

const initialState: IFunctionalInformation = {
    data: {
        functions: [],
        subfunctions: [],
    },

    isLoading: false,
    error: null,
};

const FunctionSubFunctionInformationSlice = createSlice({
    name: 'fetchFunctionSubfunctionInformation',
    initialState,
    reducers: {},
    extraReducers(builder) {
        builder.addCase(fetchFunctions.pending, state => {
            state.isLoading = true;
        });
        builder.addCase(fetchFunctions.fulfilled, (state, action) => {
            state.isLoading = false;
            state.data.functions = action.payload;
        });
        builder.addCase(fetchFunctions.rejected, (state, action) => {
            state.isLoading = false;
            state.error = action.error;
        });

        builder.addCase(fetchSubfunctionsOnMultipleFunctionIds.pending, state => {
            state.isLoading = true;
        });
        builder.addCase(fetchSubfunctionsOnMultipleFunctionIds.fulfilled, (state, action) => {
            state.isLoading = false;
            state.data.subfunctions = action.payload;
        });
        builder.addCase(fetchSubfunctionsOnMultipleFunctionIds.rejected, (state, action) => {
            state.isLoading = false;
            state.error = action.error;
        });
    },
});

export default FunctionSubFunctionInformationSlice.reducer;
