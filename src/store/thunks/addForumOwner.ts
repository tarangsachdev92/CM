import { createAsyncThunk } from '@reduxjs/toolkit';
import { getAPI } from '../../services/api';

const addForumOwner = createAsyncThunk('forum/addForumOwner', async () => {
    const response = await getAPI('api/forum/forum-owners');
    return response.data.data;
});

export { addForumOwner };
