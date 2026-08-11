import { createSlice } from '@reduxjs/toolkit';
import { CURRENT_USER_EMAIL } from "../../utils/constants";
import { fetchProfilePicture } from '../thunks/fetchProfilePicture';

interface IProfileImageState {
    imageUrl: string;
    images: Record<string, string>;
    isLoading: boolean;
    error: {} | null;
}

const initialState: IProfileImageState = {
    imageUrl: '',
    images: {},
    isLoading: false,
    error: null,
};

const profileImageSlice  = createSlice({
    name: 'fetchProfilePicture',
    initialState,
    reducers: {
        clearProfileImage: (state) => {
            state.imageUrl = '';
            state.images = {};
            state.isLoading = false;
            state.error = null;
        },
    },
    extraReducers: (builder) => {
        builder
            .addCase(fetchProfilePicture.pending, (state) => {
                state.isLoading = true;
                state.error = null;
            })
            .addCase(fetchProfilePicture.fulfilled, (state, action) => {
                const userEmail = action.meta.arg.userEmail;
                const currentUserEmail = sessionStorage.getItem(CURRENT_USER_EMAIL);
                state.images[userEmail.toLowerCase()] = action.payload;
                
                if (currentUserEmail && userEmail.toLowerCase() === currentUserEmail.toLowerCase()) {
                    state.imageUrl = action.payload;
                }
                state.isLoading = false;
            })
            .addCase(fetchProfilePicture.rejected, (state, action) => {
                state.isLoading = false;
                state.error = action.error.message ?? 'Failed to fetch profile image';
            });
    },
});

export const { clearProfileImage } = profileImageSlice.actions;

export default profileImageSlice.reducer;

