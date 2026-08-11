import { createSlice } from '@reduxjs/toolkit';
import { fetchToggleFavourite } from '../thunks/fetchToggleFavourite';
import { IFavouriteItem } from '../../types/request';

interface FavouritesState {
  data: IFavouriteItem[];
  loading: boolean;
  error: string | null;
}

const initialState: FavouritesState = {
  data: [],
  loading: false,
  error: null,
};

const favouritesSlice = createSlice({
  name: 'favourites',
  initialState,
  reducers: {},
  extraReducers: builder => {
    builder
      .addCase(fetchToggleFavourite.pending, state => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchToggleFavourite.fulfilled, (state, action) => {
        state.loading = false;
        state.data = action.payload;
      })
      .addCase(fetchToggleFavourite.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      });
  },
});

export default favouritesSlice.reducer;
