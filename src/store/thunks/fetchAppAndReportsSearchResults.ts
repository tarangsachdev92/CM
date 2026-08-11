import { createAsyncThunk } from '@reduxjs/toolkit';
import { getAPI } from '../../services/api';

const fetchAppAndReportsSearchResults = createAsyncThunk(
    'common/fetchAppAndReportsSearchResults',
    async (queryParams: { searchKeyword: string; searchType: string }) => {
        const { searchKeyword, searchType } = queryParams;
        const url = `api/appReport/apps-reports-by-keyword?searchKeyword=${encodeURIComponent(searchKeyword)}&searchType=${encodeURIComponent(searchType)}`;
        const response = await getAPI(url);
        return response.data.data;
    },
);

export { fetchAppAndReportsSearchResults };
