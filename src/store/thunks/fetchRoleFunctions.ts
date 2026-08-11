import { createAsyncThunk } from '@reduxjs/toolkit';
import { getAPI, postAPI } from '../../services/api';
import type { IToolFunctionLocationRoleFiltersPayload } from '../../types/request';

const fetchRoleFunctions = createAsyncThunk('common/fetchRoleFunctions', async () => {
    const response = await getAPI('api/common/functions');
    return response.data.data;
});

const fetchSubRoleFunctions = createAsyncThunk(
    'common/fetchSubRoleFunctions',
    async (payload: { functionId: number }) => {
        const response = await getAPI('api/common/sub-functions', payload);
        return response.data.data;
    },
);

const fetchRoleLocations = createAsyncThunk('common/fetchRoleLocations', async () => {
    const response = await getAPI(`api/common/geographies`);
    return response.data.data;
});

const fetchLocationRoles = createAsyncThunk(
    'common/fetchLocationRoles',
    async (payload: { subFunctionId: number; geographyId: number; geographyTypeId: number }) => {
        const response = await getAPI('api/common/roles-by-subfunction-site', payload);
        return response.data.data;
    },
);

const fetchRoleLevels = createAsyncThunk('common/fetchRoleLevels', async () => {
    const response = await getAPI('api/common/role-dropdown-options');
    return response.data.data.responsibilityLevels;
});

const fetchDepartments = createAsyncThunk('common/fetchDepartments', async () => {
    const response = await getAPI('api/common/departments');
    return response.data.data;
});

const fetchAdGroupForApplication = createAsyncThunk(
    'role/fetchAdGroupForApplication',
    async (payload: { toolId: number }) => {
        const response = await getAPI('api/roles/permissions-adgroups-by-app', payload);
        return response.data.data;
    },
);

const fetchApplications = createAsyncThunk('common/fetchApplications', async () => {
    const response = await getAPI('api/common/applications');
    return response.data.data;
});

const fetchRoles = createAsyncThunk('common/fetchRoles', async () => {
    const response = await getAPI('api/common/roles');
    return response.data.data;
});

// This thunk is to have a seperation of concern of the Permission Management Filter Flyout. This thunk is used for "By Tool" section
const fetchAppRoleAndFunctions = createAsyncThunk(
    'common/fetchAppRoleAndFunctions',
    async (payload: IToolFunctionLocationRoleFiltersPayload) => {
        const response = await postAPI('api/permission/app-function-location-roles', payload);
        return response.data.data;
    },
);

// This thunk is to have a seperation of concern of the Permission Management Filter Flyout. This thunk is used for "By Role" section
const fetchRoleAppsAndFunctions = createAsyncThunk(
    'common/fetchRoleAppAndFunctions',
    async (payload: IToolFunctionLocationRoleFiltersPayload) => {
        const response = await postAPI('api/permission/app-function-location-roles', payload);
        return response.data.data;
    },
);

const fetchLocationsForChip = createAsyncThunk('common/fetchLocationsForChip', async () => {
    const response = await getAPI(`api/common/geography-list`);
    return response.data.data;
});

const fetchTools = createAsyncThunk('common/fetchTools', async () => {
    const response = await getAPI('api/common/tools');
    return response.data.data;
});

const fetchFunctionSubFunctionLocationRole = createAsyncThunk(
    'role/fetchFunctionSubFunctionLocationRole',
    async (
        payload: Partial<{
            functionId: number | null;
            subFunctionId: number | null;
            geographyId: number | null;
            roleId: number | null;
            locationLabel: string | null;
            triggerType: string | null;
        }>,
    ) => {
        const { triggerType, ...apiPayload } = payload;
        const response = await postAPI(
            'api/common/function-subfunction-location-role-flyout',
            apiPayload,
        );
        return {
            data: response.data.data,
            triggerType,
        };
    },
);

const fetchSubDepartmentList = createAsyncThunk(
    'role/fetchSubDepartmentList',
    async (payload: { departmentId: string }) => {
        const response = await getAPI(`api/common/sub-departments-by-department-id`, payload);
        return response.data.data;
    },
);

const fetchDimensions = createAsyncThunk('issue/fetchDimensionData', async () => {
    const response = await getAPI('api/common/dimension');
    return response.data.data;
});

const fetchDepartmentsBySubfunctionId = createAsyncThunk(
    'common/fetchDepartmentsBySubfunctionId',
    async (payload: { subfunctionid: string }) => {
        const response = await getAPI('api/common/departments-by-subfunction-id', payload);
        return response.data.data;
    },
);
const fetchUserAttributes = createAsyncThunk('role/fetchUserAttributes', async () => {
    const response = await getAPI('api/common/user-attributes');
    return response.data.data;
});

export {
    fetchRoleFunctions,
    fetchSubRoleFunctions,
    fetchRoleLocations,
    fetchLocationRoles,
    fetchRoleLevels,
    fetchDepartments,
    fetchAdGroupForApplication,
    fetchApplications,
    fetchRoles,
    fetchAppRoleAndFunctions,
    fetchRoleAppsAndFunctions,
    fetchLocationsForChip,
    fetchTools,
    fetchFunctionSubFunctionLocationRole,
    fetchSubDepartmentList,
    fetchDimensions,
    fetchDepartmentsBySubfunctionId,
    fetchUserAttributes,
};
