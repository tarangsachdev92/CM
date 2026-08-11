import { createSlice, type PayloadAction } from "@reduxjs/toolkit";
import { fetchUserLanguage } from "../thunks/fetchUserLanguage";
import { Language } from "../../types/common";

type UserLanguage = {
    languageCode: string;
    languageName: string;
};

interface IUserLanguageDataState {
    data: Language;
    isLoading: boolean;
    error: {} | null;
}

const initialState: IUserLanguageDataState = {
    data: {
        languageCode: 'EN',
        languageName: 'English',
    },

    isLoading: false,
    error: null,
};

const UserLanguageSlice = createSlice({
    name: 'fetchUserLanguage',
    initialState,
    reducers: {
        setUserLanguage: (state, action: PayloadAction<UserLanguage>) => {
            state.data = action.payload;
            state.isLoading = false;
            state.error = null;
        },
    },
    extraReducers(builder) {
        builder.addCase(fetchUserLanguage.pending, state => {
            state.isLoading = true;
        });
        builder.addCase(fetchUserLanguage.fulfilled, (state, action) => {
            state.isLoading = false;
            state.data = action.payload;
        });
        builder.addCase(fetchUserLanguage.rejected, (state, action) => {
            state.isLoading = false;
            state.error = action.error;
        });
    },
});

export const { setUserLanguage } = UserLanguageSlice.actions;
export default UserLanguageSlice.reducer;
