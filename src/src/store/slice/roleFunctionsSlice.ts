import { createSlice } from '@reduxjs/toolkit';
import {
    fetchRoleFunctions,
    fetchSubRoleFunctions,
    fetchRoleLocations,
    fetchLocationRoles,
    fetchRoleLevels,
    fetchDepartments,
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
} from '../thunks/fetchRoleFunctions';
import type {
    IRoleFunctionsData,
    IRoleSubFunctionsData,
    ILocationsData,
    ILocationRolesData,
    IRoleLevelsData,
    IApplicationData,
    IRolesData,
    IPermissionManagementFiltersResponse,
    IGeographyData,
    IToolsData,
    IFunctionSubFunctionLocationRole,
    IDepartment,
    IDimensionData,
    IUserAttributes,
} from '../../types/response';
import { fetchRoleDropdownData } from '../thunks/fetchRoleDropdownData';

interface IRoleFunctionsState {
    data: IRoleFunctionsData[] | [];
    subFunctionData: IRoleSubFunctionsData[] | [];
    locationData: ILocationsData[] | [];
    locationRolesData: ILocationRolesData[] | [];
    roleLevelsData: IRoleLevelsData[] | [];
    applicationFilterData: IApplicationData[] | [];
    rolesData: IRolesData[] | [];
    appDetailsData: IPermissionManagementFiltersResponse;
    roleDetailsData: IPermissionManagementFiltersResponse;
    geographyChipDetails: IGeographyData[] | [];
    toolsData: IToolsData[] | [];
    functionSubFunctionLocationRoleData: IFunctionSubFunctionLocationRole;
    departments: IDepartment[];
    geographyLevel: IGeographyData[];
    subDepartments: IDepartment[];
    dimensions: IDimensionData[];
    userAttributes: IUserAttributes[];
    departmentsBySubfunction: IDepartment[];
    isLoading: boolean;
    error: {} | null;
}

const initialState: IRoleFunctionsState = {
    data: [],
    subFunctionData: [],
    locationData: [],
    locationRolesData: [],
    roleLevelsData: [],
    applicationFilterData: [],
    rolesData: [],
    appDetailsData: {} as IPermissionManagementFiltersResponse,
    roleDetailsData: {} as IPermissionManagementFiltersResponse,
    geographyChipDetails: [],
    toolsData: [],
    functionSubFunctionLocationRoleData: {
        functions: [],
        subFunctions: [],
        locations: [],
        roles: [],
    },
    departments: [],
    geographyLevel: [],
    subDepartments: [],
    dimensions: [],
    userAttributes: [],
    departmentsBySubfunction: [],
    isLoading: false,
    error: null,
};

const RoleFunctionsSlice = createSlice({
    name: 'fetchRoleFunctions',
    initialState,
    reducers: {
        resetSubFunctions(state) {
            state.subFunctionData = initialState.subFunctionData;
        },
    },
    extraReducers(builder) {
        builder.addCase(fetchRoleFunctions.pending, state => {
            state.isLoading = true;
        });
        builder.addCase(fetchRoleFunctions.fulfilled, (state, action) => {
            state.isLoading = false;
            state.data = action.payload;
        });
        builder.addCase(fetchRoleFunctions.rejected, (state, action) => {
            state.isLoading = false;
            state.error = action.error;
        });

        builder.addCase(fetchSubRoleFunctions.pending, state => {
            state.isLoading = true;
        });
        builder.addCase(fetchSubRoleFunctions.fulfilled, (state, action) => {
            state.isLoading = false;
            state.subFunctionData = action.payload;
        });
        builder.addCase(fetchSubRoleFunctions.rejected, (state, action) => {
            state.isLoading = false;
            state.error = action.error;
        });

        builder.addCase(fetchRoleLocations.pending, state => {
            state.isLoading = true;
        });
        builder.addCase(fetchRoleLocations.fulfilled, (state, action) => {
            state.isLoading = false;
            state.locationData = action.payload;
        });
        builder.addCase(fetchRoleLocations.rejected, (state, action) => {
            state.isLoading = false;
            state.error = action.error;
        });

        builder.addCase(fetchLocationRoles.pending, state => {
            state.isLoading = true;
        });
        builder.addCase(fetchLocationRoles.fulfilled, (state, action) => {
            state.isLoading = false;
            state.locationRolesData = action.payload;
        });
        builder.addCase(fetchLocationRoles.rejected, (state, action) => {
            state.isLoading = false;
            state.error = action.error;
        });

        builder.addCase(fetchRoleLevels.pending, state => {
            state.isLoading = true;
        });
        builder.addCase(fetchRoleLevels.fulfilled, (state, action) => {
            state.isLoading = false;
            state.roleLevelsData = action.payload;
        });
        builder.addCase(fetchRoleLevels.rejected, (state, action) => {
            state.isLoading = false;
            state.error = action.error;
        });

        builder.addCase(fetchDepartments.pending, state => {
            state.isLoading = true;
        });
        builder.addCase(fetchDepartments.fulfilled, (state, action) => {
            state.isLoading = false;
            state.departments = action.payload;
        });
        builder.addCase(fetchDepartments.rejected, (state, action) => {
            state.isLoading = false;
            state.error = action.error;
        });

        builder.addCase(fetchApplications.pending, state => {
            state.isLoading = true;
        });
        builder.addCase(fetchApplications.fulfilled, (state, action) => {
            state.isLoading = false;
            state.applicationFilterData = action.payload;
        });
        builder.addCase(fetchApplications.rejected, (state, action) => {
            state.isLoading = false;
            state.error = action.error;
        });

        builder.addCase(fetchRoles.pending, state => {
            state.isLoading = true;
        });
        builder.addCase(fetchRoles.fulfilled, (state, action) => {
            state.isLoading = false;
            state.rolesData = action.payload;
        });
        builder.addCase(fetchRoles.rejected, (state, action) => {
            state.isLoading = false;
            state.error = action.error;
        });

        // This thunk is to have a seperation of concern of the Permission Management Filter Flyout. This thunk is used for "By Tool" section
        builder.addCase(fetchAppRoleAndFunctions.pending, state => {
            state.isLoading = true;
        });
        builder.addCase(fetchAppRoleAndFunctions.fulfilled, (state, action) => {
            state.isLoading = false;
            state.appDetailsData = action.payload;
        });
        builder.addCase(fetchAppRoleAndFunctions.rejected, (state, action) => {
            state.isLoading = false;
            state.error = action.error;
        });

        // This thunk is to have a seperation of concern of the Permission Management Filter Flyout. This thunk is used for "By Role" section
        builder.addCase(fetchRoleAppsAndFunctions.pending, state => {
            state.isLoading = true;
        });
        builder.addCase(fetchRoleAppsAndFunctions.fulfilled, (state, action) => {
            state.isLoading = false;
            state.roleDetailsData = action.payload;
        });
        builder.addCase(fetchRoleAppsAndFunctions.rejected, (state, action) => {
            state.isLoading = false;
            state.error = action.error;
        });

        builder.addCase(fetchLocationsForChip.pending, state => {
            state.isLoading = true;
        });
        builder.addCase(fetchLocationsForChip.fulfilled, (state, action) => {
            state.isLoading = false;
            state.geographyChipDetails = action.payload;
        });
        builder.addCase(fetchLocationsForChip.rejected, (state, action) => {
            state.isLoading = false;
            state.error = action.error;
        });

        builder.addCase(fetchTools.pending, state => {
            state.isLoading = true;
        });
        builder.addCase(fetchTools.fulfilled, (state, action) => {
            state.isLoading = false;
            state.toolsData = action.payload;
        });
        builder.addCase(fetchTools.rejected, (state, action) => {
            state.isLoading = false;
            state.error = action.error;
        });

        builder.addCase(fetchFunctionSubFunctionLocationRole.pending, state => {
            state.isLoading = true;
        });
        builder.addCase(fetchFunctionSubFunctionLocationRole.fulfilled, (state, action) => {
            state.isLoading = false;
            const { data, triggerType } = action.payload;
            if (triggerType !== 'Function')
                state.functionSubFunctionLocationRoleData.functions = data.functions;
            if (triggerType !== 'SubFunction')
                state.functionSubFunctionLocationRoleData.subFunctions = data.subFunctions;
            if (triggerType !== 'Location')
                state.functionSubFunctionLocationRoleData.locations = data.locations;
            if (triggerType !== 'Role')
                state.functionSubFunctionLocationRoleData.roles = data.roles;
        });
        builder.addCase(fetchFunctionSubFunctionLocationRole.rejected, (state, action) => {
            state.isLoading = false;
            state.error = action.error;
        });

        // dimensions
        builder
            .addCase(fetchDimensions.pending, state => {
                state.isLoading = true;
                state.error = null;
            })
            .addCase(fetchDimensions.fulfilled, (state, action) => {
                state.dimensions = action.payload;
                state.isLoading = false;
            })
            .addCase(fetchDimensions.rejected, (state, action) => {
                state.isLoading = false;
                state.error = action.error.message ?? 'Failed to fetch dimension data';
            });

        builder.addCase(fetchSubDepartmentList.pending, state => {
            state.isLoading = true;
        });
        builder.addCase(fetchSubDepartmentList.fulfilled, (state, action) => {
            state.isLoading = false;
            state.subDepartments = action.payload;
        });
        builder.addCase(fetchSubDepartmentList.rejected, (state, action) => {
            state.isLoading = false;
            state.error = action.error;
        });
        // user attributes
        builder
            .addCase(fetchUserAttributes.pending, state => {
                state.isLoading = true;
                state.error = null;
            })
            .addCase(fetchUserAttributes.fulfilled, (state, action) => {
                state.userAttributes = action.payload;
                state.isLoading = false;
            })
            .addCase(fetchUserAttributes.rejected, (state, action) => {
                state.isLoading = false;
                state.error = action.error.message ?? 'Failed to fetch user attributes data';
            });

        builder.addCase(fetchRoleDropdownData.pending, state => {
            state.isLoading = true;
        });

        builder.addCase(fetchRoleDropdownData.fulfilled, (state, action) => {
            state.isLoading = false;
            state.roleLevelsData = action.payload.responsibilityLevels;
            state.geographyLevel = action.payload.geographyLevels;
            state.data = action.payload.functions;
        });

        builder.addCase(fetchRoleDropdownData.rejected, (state, action) => {
            state.isLoading = false;
            state.error = action.error;
        });

        //Departments by subfunction id
        builder.addCase(fetchDepartmentsBySubfunctionId.pending, state => {
            state.isLoading = true;
        });
        builder.addCase(fetchDepartmentsBySubfunctionId.fulfilled, (state, action) => {
            state.isLoading = false;
            state.departmentsBySubfunction = action.payload;
        });
        builder.addCase(fetchDepartmentsBySubfunctionId.rejected, (state, action) => {
            state.isLoading = false;
            state.error = action.error;
        });
    },
});

export const { resetSubFunctions } = RoleFunctionsSlice.actions;
export default RoleFunctionsSlice.reducer;
