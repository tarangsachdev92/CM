import { createAsyncThunk } from '@reduxjs/toolkit';
import { getAPI } from '../../services/api';

const fetchOnboardingAppPermission = createAsyncThunk('common/fetchOnboardingAppPermission', async () => {
    const response = await getAPI('api/application/onboarding-application-permission');
    return response.data.data;
});


export { fetchOnboardingAppPermission };
