import { createSlice } from '@reduxjs/toolkit';
import { fetchUserRoleCardDetails } from '../thunks/fetchPrimaryRole';
import { IPrimaryRoleDataNew } from '../../types/response';

interface IPrimaryRoleDataState {
    data: IPrimaryRoleDataNew;
    isLoading: boolean;
    error: {} | null;
}

const initialState: IPrimaryRoleDataState = {
    data: {
        userEmail: "",
        roleId: 0,
        role: "",
        roleLevel: "",
        roleType: "",
        geographyName: "",
        department: "",
        subDepartment: "",
        attributesJson: {},
        roleStartDate: "",
        roleEndDate: "",
        geographyId: 0,
        geographyTypeName: "",
        function: '',
        functionId: 0,
        subFunction: '',
        subFunctionId: 0,
    },

    isLoading: false,
    error: null,
};

const ProfileRoleCardDetailsSlice = createSlice({
    name: 'fetchUserRoleCardDetails',
    initialState,
    reducers: {},
    extraReducers(builder) {
        builder.addCase(fetchUserRoleCardDetails.pending, state => {
            state.isLoading = true;
        });
        builder.addCase(fetchUserRoleCardDetails.fulfilled, (state, action) => {
            state.isLoading = false;
            state.data = action.payload;
        });
        builder.addCase(fetchUserRoleCardDetails.rejected, (state, action) => {
            state.isLoading = false;
            state.error = action.error;
        });
    },
});

export default ProfileRoleCardDetailsSlice.reducer;
