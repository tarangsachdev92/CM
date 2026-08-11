import { createAsyncThunk } from '@reduxjs/toolkit';
import { postAPI } from '../../services/api';
import { IRecentlyOpenedItem, IAddRecentlyOpenedItem } from '../../types/request';

interface FetchRecentlyOpenedPayload {
  objectType: string | null;
  objectName: string | null;
}

export const fetchRecentlyOpenedAppsAndReports = createAsyncThunk<
  IRecentlyOpenedItem[],
  FetchRecentlyOpenedPayload,
  { rejectValue: string }
>('recentlyOpened/fetchRecentlyOpenedAppsAndReports', async (payload, { rejectWithValue }) => {
  try {
    const response = await postAPI('api/appReport/get-recently-opened', payload);
    return response.data.data;
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Failed to fetch recently opened items';
    return rejectWithValue(message);
  }
});

export const addRecentlyOpenedAppsAndReports = createAsyncThunk<
  IAddRecentlyOpenedItem[],
  IAddRecentlyOpenedItem,
  { rejectValue: string }
>('recentlyOpened/addRecentlyOpenedAppsAndReports', async (payload, { rejectWithValue }) => {
  try {
    const response = await postAPI('api/appReport/add-recently-opened', payload);
    return response.data.data;
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Failed to add recently opened item';
    return rejectWithValue(message);
  }
});
