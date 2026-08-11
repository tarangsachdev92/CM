import { Navigate, Route, Routes } from 'react-router-dom';
import AppsAndReports from './components/organisms/appsAndReports/AppsAndReportsLandingPage';
import Forums from './components/organisms/forums/ForumsTitle';
import ForumManagement from './components/organisms/forumManagement/ForumManagementTitle';
import AppsAndReportsKpiCard from './components/organisms/kpi-cards/AppsAndReportsKpiCard';
import ProtectedRoute from './components/organisms/protected-route/ProtectedRoute';
import ProtectedRouteForGuestUser from './components/organisms/protected-route/ProtectedRouteForGuestUser';
import PerformanceManagementCustomisations from './components/organisms/performance-management-customizations/PerformanceManagementCustomizations';
import './Router.scss';
import {
    AddNewRoleScreen,
    AdminConsoleScreen,
    HomeScreen,
    MyDashboardScreen,
    PerformanceManagementScreen,
    RoleManagementScreen,
    ToDoScreen,
    UserProfileSettingsScreen,
} from './screens';
import IssueScreen from './screens/issue-management/IssueManagementScreen';
import PermissionManagementScreen from './screens/permission-management/PermissionManagementScreen';
import EditRoleScreen from './screens/role-management/edit-role/EditRoleScreen';
import TagScreen from './screens/tags/TagScreen';
import AddNewToolScreen from './screens/tool-management/add-new-tool/AddNewToolScreen';
import AddNewForumScreen from './screens/forum-management/add-new-forum/AddNewForumScreen';
import EditToolScreen from './screens/tool-management/edit-tool/EditToolScreen';
import ToolManagementScreen from './screens/tool-management/ToolManagementScreen';
import ExtApplicationsMfeScreen from './screens/performance-management/ExtApplicationsMfeScreen';
import RiskScreen from './screens/risk-opportunities/RiskOpportunitiesScreen';
import AdvancedForecasting from './screens/advance-forecasting/advancedForecasting';
import DpmScreen from './screens/dpm/DpmScreen';
import DigitalWorkerScreen from './screens/digital-worker/DigitalWorkerScreen';
import GembaWalkScreen from './screens/gemba-walk/GembaWalkScreen';
import TruckInspectionScreen from './screens/truck-inspection/TruckInspectionScreen';
import KnowledgeHubScreen from './screens/knowledge-hub/KnowledgeHubScreen';
import { UserLayout } from './screens/layout/UserLayout';
import DelegationTable from './components/organisms/delegation-Table/DelegationTable';
import CasualAnalysis from './components/organisms/casual-analysis/CasualAnalysis';
import EditNewForumScreen from './screens/forum-management/edit-new-forum/EditNewForumScreen';
import DelegationTableNew from './components/organisms/delegation-Table/DelegationTableNew';

const AppRouter = () => {
    return (
        <Routes>
            <Route path="/" element={<Navigate to="/home" />} />
            <Route path="/home" index element={<HomeScreen />} />
            <Route path="/my-dashboard" element={<MyDashboardScreen />} />
            <Route path="/todo" element={<ToDoScreen />} />
            <Route path="/issues" element={<IssueScreen issueSourceType={0} />} />
            <Route path="/edit-layout" element={<UserLayout />} />
            <Route path="/Performance-Management" element={<DpmScreen />} />
            <Route path="/advanced-forecasting/*" element={<AdvancedForecasting />} />
            <Route path="/delegations" element={<DelegationTable />} />
            <Route path="/delegations-new" element={<DelegationTableNew />} />
            <Route path="/ro" element={<RiskScreen />} />
            <Route path="/user-profile-settings" element={<UserProfileSettingsScreen />} />
            <Route
                path="/digital-worker/troubleshooting-assistant/*"
                element={<DigitalWorkerScreen />}
            />
            <Route
                path="/digital-worker/gemba-walk/*"
                element={<GembaWalkScreen />}
            />
            <Route
                path="/digital-worker/truck-inspection/*"
                element={<TruckInspectionScreen />}
            />
            <Route path="/knowledge-hub/*" element={<KnowledgeHubScreen />} />
            <Route
                path="/admin-hub"
                element={
                    <ProtectedRoute>
                        <AdminConsoleScreen />
                    </ProtectedRoute>
                }
            />
            <Route
                path="/admin-hub/role-management"
                element={
                    <ProtectedRoute>
                        <RoleManagementScreen />
                    </ProtectedRoute>
                }
            />
            <Route
                path="/admin-hub/role-management/add-new-role"
                element={
                    <ProtectedRoute>
                        <AddNewRoleScreen />
                    </ProtectedRoute>
                }
            />
            <Route
                path="/admin-hub/role-management/:roleId/:roleName"
                element={
                    <ProtectedRoute>
                        <EditRoleScreen />
                    </ProtectedRoute>
                }
            />
            <Route
                path="/admin-hub/permission-management"
                element={
                    <ProtectedRoute>
                        <PermissionManagementScreen />
                    </ProtectedRoute>
                }
            />
            <Route
                path="/admin-hub/tool-management"
                element={
                    <ProtectedRoute>
                        <ToolManagementScreen />
                    </ProtectedRoute>
                }
            />
            <Route
                path="/admin-hub/tags"
                element={
                    <ProtectedRoute>
                        <TagScreen />
                    </ProtectedRoute>
                }
            />
            <Route
                path="/admin-hub/tool-management/:appId/:appName"
                element={
                    <ProtectedRoute>
                        <EditToolScreen />
                    </ProtectedRoute>
                }
            />
            <Route
                path="/admin-hub/tool-management/add-new-tool"
                element={
                    <ProtectedRoute>
                        <AddNewToolScreen />
                    </ProtectedRoute>
                }
            />
            <Route
                path="/admin-hub/forum-management/add-new-forum"
                element={
                    <ProtectedRoute>
                        <AddNewForumScreen />
                    </ProtectedRoute>
                }
            />
            <Route
                path="/digital-tools-library"
                element={
                    <ProtectedRouteForGuestUser>
                        <AppsAndReports />
                    </ProtectedRouteForGuestUser>
                }
            />
            <Route
                path="/digital-tools-library/:toolType/:toolId/:toolName/:tabName?"
                element={
                    <ProtectedRouteForGuestUser>
                        <PerformanceManagementScreen />
                    </ProtectedRouteForGuestUser>
                }
            />
            <Route
                path="/apps-reports/performance-management/kpi-card"
                element={<AppsAndReportsKpiCard />}
            />
            <Route
                path="/apps-reports/performance-management/custom-reports"
                element={<PerformanceManagementCustomisations />}
            />
            <Route
                path="/apps-reports/ext-applications-mfe/:toolId/:toolName"
                element={<ExtApplicationsMfeScreen />}
            />
            <Route
                path="/admin-hub/Forum"
                element={
                    <ProtectedRoute>
                        <Forums />
                    </ProtectedRoute>
                }
            />
            <Route
                path="/admin-hub/Forum-Management"
                element={
                    <ProtectedRoute>
                        <ForumManagement />
                    </ProtectedRoute>
                }
            />
            <Route path="/causal-analysis/kpi-tree" element={<CasualAnalysis />} />
            <Route
                path="/admin-hub/Forum-Management/:forumId/:forumName"
                element={
                    <ProtectedRoute>
                        <EditNewForumScreen />
                    </ProtectedRoute>
                }
            />
        </Routes>
    );
};

export default AppRouter;
