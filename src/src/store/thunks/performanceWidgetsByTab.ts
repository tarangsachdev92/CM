import { createAsyncThunk } from '@reduxjs/toolkit';
import type { TabWidgetsState } from '../slice/performanceWidgetsByTabSlice';
import {
    getTabWidgetsState,
    saveTabWidgetsStateApi,
} from '../../services/performanceManagementWidgets';

/** ===== Request DTOs ===== */
export interface FetchTabWidgetsStateRequest {
    tabId: number | string;
}

export interface SaveTabWidgetsStateRequest {
    tabId: number | string;
    data: TabWidgetsState;
}

/** ===== Minimal error shapes ===== */
interface ApiErrorBody {
    message?: string;
}
interface HttpErrorLike {
    response?: { data?: ApiErrorBody };
    message?: string;
}

/** ===== Helpers ===== */
function extractErrorMessage(err: unknown): string {
    const e = err as HttpErrorLike;
    return (
        e?.response?.data?.message ??
        e?.message ??
        (err instanceof Error ? err.message : 'Unknown error')
    );
}

/** Fetch */
export const fetchTabWidgetsState = createAsyncThunk<
    { tabId: number | string; data: TabWidgetsState },
    FetchTabWidgetsStateRequest,
    { rejectValue: string }
>('widgetsByTab/fetchTabWidgetsState', async ({ tabId }, { rejectWithValue }) => {
    try {
        const response = await getTabWidgetsState({ tabId });
        const payload: TabWidgetsState = response?.data?.data ?? {};
        return { tabId, data: payload };
    } catch (err: unknown) {
        return rejectWithValue(extractErrorMessage(err) || 'Failed to fetch tab widgets state');
    }
});

/** Save */
export const saveTabWidgetsState = createAsyncThunk<
    { tabId: number | string; data: TabWidgetsState },
    SaveTabWidgetsStateRequest,
    { rejectValue: string }
>('widgetsByTab/saveTabWidgetsState', async ({ tabId, data }, { rejectWithValue }) => {
    try {
        const response = await saveTabWidgetsStateApi({ tabId, data });
        const payload: TabWidgetsState = response?.data?.data ?? data ?? {};
        return { tabId, data: payload };
    } catch (err: unknown) {
        return rejectWithValue(extractErrorMessage(err) || 'Failed to save tab widgets state');
    }
});
