import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import { fetchRoleData } from '../thunks/fetchRoleData';
import { IRoleData, IRoleFiltersData, IRolePaginationData } from '../../types/response';

interface IRoleState {
    data: IRoleData[];
    loading: boolean;
    error: string | null;
    totalRows: number;
    totalPages: number;
    columnFilters: IRoleFiltersData;
    paginationData: IRolePaginationData;

    pageSize: number;
    pageNumber: number;
    sortColumnName: string;
    sortDirection: string;
    searchKeyword: string;
    searchTerm: string;
    searchColumn: string;
    isRestoring: boolean;
}

const initialState: IRoleState = {
    data: [],
    loading: false,
    error: null,
    totalRows: 0,
    totalPages: 0,
    columnFilters: {
        function: [],
        roleLevel: [],
        subfunction: [],
        region: [],
        role: [],
        isactive: [],
        usercount: [],
        department: [],
        subdepartment: [],
    },
    paginationData: {
        totalRows: 0,
        totalPages: 0,
    },

    pageNumber: 1,
    pageSize: 10,
    searchKeyword: '',
    searchTerm: '',
    sortColumnName: '',
    sortDirection: '',
    searchColumn: 'Role',
    isRestoring: false,
};
const normalizeDistinctFilters = (apiFilters: any) => ({
    role: apiFilters?.['Role Name'] ?? [],
    function: apiFilters?.['Function'] ?? [],
    subfunction: apiFilters?.['Sub-Function'] ?? [],
    department: apiFilters?.['Department'] ?? [],
    subdepartment: apiFilters?.['Sub-Department'] ?? [],
    roleLevel: apiFilters?.['Responsibility Level'] ?? [],
    region: apiFilters?.['Geography Level'] ?? [],
    isactive: apiFilters?.['Status'] ?? [],
    usercount: [],
});
const buildLookupMap = (items: any[] = []) => {
    const map: Record<string, string> = {};
    items.forEach(item => {
        if (item?.id != null) {
            map[String(item.id)] = item.columnValue;
        }
    });
    return map;
};

const roleDataSlice = createSlice({
    name: 'roleData',
    initialState,
    reducers: {
        setCurrentPage(state, action: PayloadAction<number>) {
            state.pageNumber = action.payload;
        },
        setCurrentPageSize(state, action: PayloadAction<number>) {
            state.pageSize = action.payload;
        },
        setSearchKeyword(state, action: PayloadAction<string>) {
            state.searchKeyword = action.payload;
        },
        setSortColumnName(state, action: PayloadAction<string>) {
            state.sortColumnName = action.payload;
        },
        setSortDirection(state, action: PayloadAction<string>) {
            state.sortDirection = action.payload;
        },
        setSearchColumn(state, action: PayloadAction<string>) {
            state.searchColumn = action.payload;
        },
        setIsRestoring(state, action: PayloadAction<boolean>) {
            state.isRestoring = action.payload;
        },
    },
    extraReducers: builder => {
        builder
            .addCase(fetchRoleData.pending, state => {
                state.loading = true;
                state.error = null;
            })
            .addCase(fetchRoleData.fulfilled, (state, action) => {
                state.loading = false;
                const apiData = action.payload?.data;
                const functionMap = buildLookupMap(apiData.distinctFilters?.['Function']);
                const subFunctionMap = buildLookupMap(apiData.distinctFilters?.['Sub-Function']);
                const departmentMap = buildLookupMap(apiData.distinctFilters?.['Department']);
                const geographyMap = buildLookupMap(apiData.distinctFilters?.['Geography Level']);
                state.data = apiData.roles.map((item: any) => ({
                    roleId: item.roleId,
                    roleName: item.roleName?.trim() || '',
                    fullRoleName: item.fullRoleName?.trim() || '',
                    responsibilityLevel: item.responsibilityLevel?.trim() || '',
                    function: functionMap[item.functionId] || '',
                    subFunction: subFunctionMap[item.subFunctionId] || '',
                    department: departmentMap[item.departmentId] || '',
                    geographyLevel: geographyMap[item.geographyLevelId] || '',
                    numberOfUsers: item.numberOfUsers ?? 0,
                    isActive: item.status === 'Active',
                    status: item.status,
                }));
                state.columnFilters = normalizeDistinctFilters(apiData.distinctFilters);
                state.paginationData = apiData.pagination;
            })
            .addCase(fetchRoleData.rejected, (state, action) => {
                state.loading = false;
                state.error = action.payload as string;
            });
    },
});

export const {
    setCurrentPage,
    setCurrentPageSize,
    setSearchKeyword,
    setSortColumnName,
    setSortDirection,
    setSearchColumn,
    setIsRestoring,
} = roleDataSlice.actions;
export default roleDataSlice.reducer;