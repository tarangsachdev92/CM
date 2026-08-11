import { createSlice } from '@reduxjs/toolkit';
import { deleteForums , inactivateForum } from '../thunks/deleteForums';

interface IActionState {
  isLoading: boolean;
  isSuccess: boolean;
  error: string | null;
}

interface IForumState {
  delete: IActionState;
  inactivate: IActionState;
}

const initialActionState: IActionState = {
  isLoading: false,
  isSuccess: false,
  error: null,
};

const initialState: IForumState = {
  delete: initialActionState,
  inactivate: initialActionState,
};

const forumActionSlice = createSlice({
  name: 'forumAction',
  initialState,

  reducers: {
    resetDeleteState: state => {
      state.delete = initialActionState;
    },
    resetInactivateState: state => {
      state.inactivate = initialActionState;
    },
  },

  extraReducers: builder => {
    // ✅ DELETE
    builder
      .addCase(deleteForums.pending, state => {
        state.delete.isLoading = true;
        state.delete.isSuccess = false;
        state.delete.error = null;
      })
      .addCase(deleteForums.fulfilled, state => {
        state.delete.isLoading = false;
        state.delete.isSuccess = true;
      })
      .addCase(deleteForums.rejected, (state, action) => {
        state.delete.isLoading = false;
        state.delete.isSuccess = false;
        state.delete.error = action.payload as string;
      });

    // ✅ INACTIVATE
    builder
      .addCase(inactivateForum.pending, state => {
        state.inactivate.isLoading = true;
        state.inactivate.isSuccess = false;
        state.inactivate.error = null;
      })
      .addCase(inactivateForum.fulfilled, state => {
        state.inactivate.isLoading = false;
        state.inactivate.isSuccess = true;
      })
      .addCase(inactivateForum.rejected, (state, action) => {
        state.inactivate.isLoading = false;
        state.inactivate.isSuccess = false;
        state.inactivate.error = action.payload as string;
      });
  },
});

export const { resetDeleteState, resetInactivateState } = forumActionSlice.actions;

export default forumActionSlice.reducer;