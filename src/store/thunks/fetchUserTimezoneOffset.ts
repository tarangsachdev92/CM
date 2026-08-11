import { createAsyncThunk } from "@reduxjs/toolkit";
import { getAPI } from "../../services/api";


const fetchUserTimezoneOffset = createAsyncThunk('common/fetchUserTimezoneOffset', async () => {
    const response = await getAPI('api/common/user-timezone-offset');    
    return response.data.data;
});

export { fetchUserTimezoneOffset };