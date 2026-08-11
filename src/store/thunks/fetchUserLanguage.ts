import { createAsyncThunk } from "@reduxjs/toolkit";
import { getAPI } from "../../services/api";

const fetchUserLanguage = createAsyncThunk('common/fetchUserLanguage', async () => {
    const response = await getAPI('api/common/userprofile-language');
    return response.data.data[0];
});

export { fetchUserLanguage };