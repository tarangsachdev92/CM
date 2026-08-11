import { configureStore, combineReducers } from '@reduxjs/toolkit';
import storage from 'redux-persist/lib/storage';
import { persistReducer, persistStore } from 'redux-persist';
import lastRefreshDateReducer from './slice/lastRefreshDateSlice';
import fetchRoleFunctionsReducer from './slice/roleFunctionsSlice';
import fetchProfilePicture from './slice/profilePictureSlice';
import fetchGeographicalInformationReducer from './slice/geographicalInformationSlice';
import primaryRoleDateSlice from './slice/primaryRoleDataSlice';
import primaryRoleDateSliceNew from './slice/primaryRoleDataSliceNew';
import profileRoleCardDetailsSlice from './slice/profileRoleCardDetailsSlice';
import userRoleReducer from './slice/userRoleSlice';
import roleDataSlice from './slice/roleDataSlice';
import applicationDataSlice from './slice/applicationDataSlice';
import issueDataSlice from './slice/issueDataSlice';
import delegationPermissionsReducer from './slice/delegationPermissionsSlice';
import delegationPermissionsReducerNew from './slice/delegationPermissionsSliceNew';
import roleManagementSlice from './slice/deleteRoleFromRoleManagementSlice';
import rolePermissionsReducer from './slice/rolePermissionsSlice';
import teamAndOwnerNameSlice from './slice/teamAndOwnerNameSlice';
import onboardingAppPermissionSlice from './slice/OnboardingAppPermission';
import applicationManagementReducer from './slice/applicationManagementSlice';
import fetchFunctionSubfunctionInformationReducer from './slice/functionSubFunctionInformationSlice';
import issueReducer from './slice/IssueSlice';
import delegationReducer from './slice/delegationSlice';
import delegationReducerNew from './slice/delegationSliceNew';
import userGroupsReducer from './slice/userGroupsSlice';
import basicKpiCardSlice from './slice/basicKpiCardSlice';
import impactAnalysisTableDataSlice from './slice/impactAnalysisTableData';
import columnKpiCardSlice from './slice/columnKpiCardSlice';
import notificationsAndAlertsSlice from './slice/notificationsAndAlertsSlice';
import searchAppAndReportsSlice from './slice/searchAppReportsSlice';
import myFavouritesAppsAndReportsSlice from './slice/myFavouritesAppsAndReportsSlice';
import recentlyOpenedAppsAndReportsSlice from './slice/recentlyOpenedAppsAndReportsSlice';
import appAndReportSlice from './slice/appAndReportSlice';
import filterGroupDetailsSlice from './slice/filterGroupDetailsSlice';
import forumDataSlice from './slice/forumDataSlice';
import deleteForum from './slice/deleteForumSlice';
import deleteForums from './slice/deleteForumsSlice';
import forumLevelSlice from './slice/forumLevelSlice';
import forumPeriodSlice from './slice/forumPeriodSlice';
import getGeographyByLevelSlice from './slice/getGeographyByLevelSlice';
import addForumOwnerSlice from './slice/addForumOwnerSlice';
import addNewForum from './slice/addNewForumSlice';
import getForumDetails from './slice/getForumDetailsSlice';
import getTagDetails from './slice/getTagDetailsSlice';
import userAppliedGroupDetails from './slice/userAppliedGroupSlice';
import globalFilterApplyFilterGroup from './slice/globalFilterApplyFilterGroupSlice';
import setSelectedCalendar from './slice/selectedCalendarSlice';
import exceptionFlyoutIssuesDetails from './slice/getExceptionFlyoutIssuesDetailsSlice';
import exceptionFlyoutRiskDetails from './slice/getExceptionFlyoutRiskDetailsSlice';
import todoSlice from './slice/todoSlice';
import userToolPermissionsReducer from './slice/userToolPermissionsSlice';
import { useDispatch } from 'react-redux';
import userDetailsSlice from './slice/userDetailsSlice';
import usersGlobalFiltersReducer from './slice/usersGlobalFiltersSlice';
import selectedForumReducer from './slice/selectedForumSlice';
import LocalFilterReducer from './slice/localFilterSlice';
import afUserRoleFilterDetailsReducer from './slice/afUserRoleFilterDetailsSlice';
import selectedAFToDoReducer from './slice/selectedAFToDoSlice';
import downtimeDataSlice from './slice/downtimeDataSlice';
import todoWidgetSlice from './slice/todoWidgetSlice';
import todoFilterSlice from './slice/todoFilterSlice';
import todosFiltersSlice from './slice/todosFiltersSlice';
import ignoredTodosSlice from './slice/ignoredTodosSlice';
import todoFlyoutSlice from './slice/todoFlyoutSlice';
import UserLanguageSlice from './slice/userLanguageSlice';
import dynamicTabsReducer from './slice/dynamicTabsSlice';
import todoFilterSelectionSlice from './slice/toDoFilterSelectionSlice';
import performanceManagementWidgetsReducer from './slice/performanceManagementWidgetsSlice';
import performanceOverviewFilterReducer from './slice/performanceOverviewFilters';
import exceptionFlyoutOpportunityDetails from './slice/exceptionsFlyoutOpportunitySlice';
import kpiDetailsReducer from './slice/kpiDetailsSlice';
import knowledgeHubReducer from './slice/knowledgeHubSlice';
import performanceWidgetsByTabSliceReducer from './slice/performanceWidgetsByTabSlice';
import todocommentSlice from './slice/todoCommentsSlice';
import snoozedTodosSlice from './slice/snoozedTodosSlice';
import UserTimezoneOffsetSlice from './slice/userTimezoneOffsetSlice';
import toolNameSlice from './slice/toolNameSlice';
import forumMasterSlice from './slice/forumMasterSlice';
import addNewForumsSlice from './slice/addNewForumSlice';
import forumPersonaMappingsSlice from './slice/forumPersonaMappingsSlice';
import rolePermissionSlice from './slice/rolePermissionSlice';
import userRolesWithDetails from './slice/userRolesWithDetailsSlice';
import sideNavigationReducer from './slice/sideNavigationSlice';
 
const rootReducer = combineReducers({
    lastRefreshDate: lastRefreshDateReducer,
    roleFunctions: fetchRoleFunctionsReducer,
    profilePicture: fetchProfilePicture,
    fetchGeographicalInformation: fetchGeographicalInformationReducer,
    fetchFunctionSubfunctionInformation: fetchFunctionSubfunctionInformationReducer,
    primaryRole: primaryRoleDateSlice,
    userRole: userRoleReducer,
    roleData: roleDataSlice,
    userData: userDetailsSlice,
    userRoleNew: primaryRoleDateSliceNew,
    userRoleDetails: profileRoleCardDetailsSlice,
    applicationData: applicationDataSlice,
    issueData: issueDataSlice,
    deleteRole: roleManagementSlice,
    roleManagement: roleManagementSlice,
    rolePermissions: rolePermissionsReducer,
    teamAndOwnerName: teamAndOwnerNameSlice,
    onboardingAppPermission: onboardingAppPermissionSlice,
    applicationManagement: applicationManagementReducer,
    issue: issueReducer,
    delegation: delegationReducer,
    delegationNew: delegationReducerNew,
    userGroups: userGroupsReducer,
    basickpiCard: basicKpiCardSlice,
    impactAnalysisTableData: impactAnalysisTableDataSlice,
    columnKpiCardData: columnKpiCardSlice,
    notificationsAndAlerts: notificationsAndAlertsSlice,
    appReports: searchAppAndReportsSlice,
    myFavourites: myFavouritesAppsAndReportsSlice,
    recentlyOpenedAppsAndReports: recentlyOpenedAppsAndReportsSlice,
    appReportsCardsData: appAndReportSlice,
    filterGroupDetails: filterGroupDetailsSlice,
    forumData: forumDataSlice,
    deleteForum: deleteForum,
    deleteForums: deleteForums,
    inactivateForum: deleteForums,
    forumLevel: forumLevelSlice,
    forumPeriod: forumPeriodSlice,
    geographyByLevel: getGeographyByLevelSlice,
    forumOwner: addForumOwnerSlice,
    addNewForum: addNewForum,
    forumDetails: getForumDetails,
    tagDetails: getTagDetails,
    delegationPermissions: delegationPermissionsReducer,
    delegationPermissionsNew: delegationPermissionsReducerNew,
    applyFilterGroup: globalFilterApplyFilterGroup,
    userAppliedGroupDetails: userAppliedGroupDetails,
    setSelectedCalendar: setSelectedCalendar,
    exceptionFlyoutIssuesDetails: exceptionFlyoutIssuesDetails,
    exceptionFlyoutRiskDetails: exceptionFlyoutRiskDetails,
    todoDetails: todoSlice,
    userToolPermissions: userToolPermissionsReducer,
    userGlobalFilters: usersGlobalFiltersReducer,
    selectedForum: selectedForumReducer,
    localFilter: LocalFilterReducer,
    afUserRoleFilterDetails: afUserRoleFilterDetailsReducer,
    selectedAFToDo: selectedAFToDoReducer,
    downtimeDataDetails: downtimeDataSlice,
    todoWidgetDetails: todoWidgetSlice,
    todoFilter: todoFilterSlice,
    todosFilters: todosFiltersSlice,
    ignoredTodos: ignoredTodosSlice,
    todoFlyout: todoFlyoutSlice,
    userLanguage: UserLanguageSlice,
    dynamicTabs: dynamicTabsReducer,
    toDoFilterSelection: todoFilterSelectionSlice,
    performanceManagementWidgets: performanceManagementWidgetsReducer,
    performanceOverviewFilter: performanceOverviewFilterReducer,
    exceptionFlyoutOpportunityDetails: exceptionFlyoutOpportunityDetails,
    kpiDetails: kpiDetailsReducer,
    knowledgeHub: knowledgeHubReducer,
    performanceWidgetsByTabSlice: performanceWidgetsByTabSliceReducer,
    todocomment: todocommentSlice,
    snoozedTodos: snoozedTodosSlice,
    userTimezoneOffset: UserTimezoneOffsetSlice,
    toolName: toolNameSlice,
    forumMaster: forumMasterSlice,
    addNewForums: addNewForumsSlice,
    forumPersonaMappings: forumPersonaMappingsSlice,
    rolePermission: rolePermissionSlice,
    userRolesWithDetails: userRolesWithDetails,
    sideNavigation: sideNavigationReducer,
});
 
// Configure persistence
const persistConfig = {
    key: 'root',
    storage,
    whitelist: ['rolePermissions'],
};
 
const persistedReducer = persistReducer(persistConfig, rootReducer);
 
// Create store
export const store = configureStore({
    reducer: persistedReducer,
});
 
export * from './thunks/fetchLastRefreshDate';
export * from './thunks/fetchRoleFunctions';
export * from './thunks/fetchProfilePicture';
export * from './thunks/fetchGeographicalInformation';
export * from './thunks/fetchPrimaryRole';
export * from './thunks/fetchUserRole';
export * from './thunks/fetchRoleData';
export * from './thunks/fetchUserDetails';
export * from './thunks/fetchApplicationData';
export * from './thunks/fetchIssueData';
export * from './thunks/deleteRoleFromRoleManagement';
export * from './thunks/fetchRolePermissions';
export * from './thunks/fetchTeamAndOwnerName';
export * from './thunks/fetchOnboardingAppPermission';
export * from './thunks/fetchFunctionSubfunctionInformation';
export * from './thunks/fetchIssue';
export * from './thunks/delegationThunks';
export * from './thunks/delegationThunks';
export * from './thunks/fetchBasicKpiCard';
export * from './thunks/fetchImpactAnalysisTableData';
export * from './thunks/fetchColumnKpiCard';
export * from './thunks/fetchNotificationsAndAlerts';
export * from './thunks/fetchAppAndReportsSearchResults';
export * from './thunks/fetchUserGroupDetails';
export * from './thunks/fetchMyFavourites';
export * from './thunks/fetchRecentlyOpenedAppsAndReports';
export * from './thunks/getAppAndReports';
export * from './thunks/fetchFilterGroupDetails';
export * from './thunks/fetchUserAppliedFilterDetails';
export * from './thunks/fetchForumData';
export * from './thunks/deleteForum';
export * from './thunks/deleteForums';
export * from './thunks/forumLevel';
export * from './thunks/forumPeriod';
export * from './thunks/getGeographyByLevel';
export * from './thunks/addForumOwner';
export * from './thunks/addNewForum';
export * from './thunks/getForumDetails';
export * from './thunks/getTagDetails';
export * from './thunks/globalFilterApplyFilterGroup';
export * from './thunks/getExceptionFlyoutIssuesDetails';
export * from './thunks/getExceptionRiskDetails';
export * from './thunks/getExceptionOpportunityDetails';
export * from './thunks/fetchToDos';
export * from './thunks/getUserGlobalFilters';
export * from './thunks/fetchAfUserRoleFilterDetails';
export * from './thunks/fetchDowntimeData';
export * from './thunks/fetchToDoWidgetDetails';
export * from './thunks/fetchToDoFilters';
export * from './thunks/fetchIgnoredTodos';
export * from './thunks/fetchToDosFlyout';
export * from './thunks/fetchUserLanguage';
export { setUserLanguage } from './slice/userLanguageSlice';
export * from './thunks/getToDoComments';
export * from './thunks/fetchSnoozedTodos';
export * from './thunks/fetchUserTimezoneOffset';
export * from './thunks/fetchRoleDropdownData';
export * from './thunks/fetchToolName';
export * from './thunks/forumMasterData';
export * from './thunks/addNewForums';
export * from './thunks/fetchForumPersonaMappings';
export * from './thunks/fetchRolePermissionsFlyout';
export * from './thunks/fetchUserRolesWithDetails';
export * from './thunks/userNavigationPreferences';
export * from './thunks/fetchTestingToDos';
 
export const persistor = persistStore(store);
// Infer the `RootState` and `AppDispatch` types from the store itself
export type RootState = ReturnType<typeof store.getState>;
export type RootStateDelegation = ReturnType<typeof store.getState>;
// Inferred type: {posts: PostsState, comments: CommentsState, users: UsersState}
export type AppDispatch = typeof store.dispatch;
export const useAppDispatch = () => useDispatch<AppDispatch>();
