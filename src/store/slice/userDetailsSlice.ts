import { createSlice } from '@reduxjs/toolkit';
import { fetchAllUserData, fetchUserData } from '../thunks/fetchUserDetails';
import { IUserData, IUserFiltersData } from '../../types/response';

interface UserState {
  users: IUserData[];
  loading: boolean;
  error: string | null;
  columnFilters: IUserFiltersData;
  pagination: {
    totalRows: number;
    totalPages: number;
  };
}

const normalizeUserDistinctFilters = (apiFilters: any): IUserFiltersData => ({
  function: [],
  name: apiFilters?.['UserName'] ?? [],
  email: apiFilters?.['UserEmail'] ?? [],
  primaryRoleId: [],
  primaryRole: apiFilters?.['PrimaryRoleName'] ?? [],
  rolelevel: [],
  region: apiFilters?.['Geography'] ?? [],
  market: [],
  site: [],
  isactive: apiFilters?.['Status'] ?? [],
  usercount: [],
  geography: apiFilters?.['Geography'] ?? [],
  attribute: [],
  UserName: apiFilters?.['UserName'] ?? [],
});

const initialState: UserState = {
  users: [],
  loading: false,
  error: null,
  pagination: {
    totalRows: 0,
    totalPages: 0,
  },
  columnFilters: {
    function: [],
    name: [],
    email: [],
    primaryRoleId: [],
    primaryRole: [],
    rolelevel: [],
    region: [],
    market: [],
    site: [],
    isactive: [],
    usercount: [],
    geography: [],
    attribute: [],
    UserName: [],
  },
};

const mapApiUsers = (apiUsers: any): IUserData[] =>
  (Array.isArray(apiUsers) ? apiUsers : []).map((user: any) => {
    const {
      userID,
      userName,
      userEmail,
      primaryRoleName,
      geographyLevel,
      isActive,
      attributes,
      totalRows,
      totalPages,
    } = user;

    return {
      userId: userID,
      name: userName,
      email: userEmail,
      primaryRole: primaryRoleName,
      geography: geographyLevel,
      region: geographyLevel,
      isActive,
      attributes: attributes ?? [],
      totalRows,
      totalPages,
    };
  });

const userDetailsSlice = createSlice({
  name: 'users',
  initialState,
  reducers: {},
  extraReducers: builder => {
    builder
      .addCase(fetchUserData.pending, state => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchUserData.fulfilled, (state, action) => {
        state.loading = false;
        const apiData = action.payload;
        state.users = mapApiUsers(apiData.user);
        state.pagination = apiData.pagination ?? {
          totalRows: 0,
          totalPages: 0,
        };
        state.columnFilters = normalizeUserDistinctFilters(
          apiData.distinctFilters,
        );
      })    
      .addCase(fetchUserData.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      })

      .addCase(fetchAllUserData.pending, state => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchAllUserData.fulfilled, (state, action) => {
        state.loading = false;
        const apiData = action.payload;
        state.users = mapApiUsers(apiData.user);

        state.pagination = apiData.pagination ?? {
          totalRows: 0,
          totalPages: 0,
        };
        state.columnFilters = normalizeUserDistinctFilters(
          apiData.distinctFilters,
        );
      })
      .addCase(fetchAllUserData.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      });
  },
});

export default userDetailsSlice.reducer;
