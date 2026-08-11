import { BrowserAuthError, InteractionStatus } from '@azure/msal-browser';
import { useIsAuthenticated, useMsal } from '@azure/msal-react';
import { jwtDecode } from 'jwt-decode';
import { useEffect, useMemo, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useLocation } from 'react-router-dom';
import styles from './App.module.scss';
import './assets/css/ant-select-overrides.scss';
import './assets/css/quill-overrides.scss';
import './assets/css/common.scss';
import { SideNavigation, TopHeader } from './components';
import {
    startSignalRConnection,
    stopSignalRConnection,
} from './services/notificationBackgroundService';
import { Toast, Footer, FixedToast } from 'konnect-react-components';
import { FloatingBanner, FloatingBannerSticky, Navbar } from './components/molecules';
import AppRouter from './Router';
import customAxios from './services/interceptor';
import {
    AppDispatch,
    fetchProfilePicture,
    fetchUserPrimaryRole,
    fetchUserSecondaryRole,
    fetchUserDelegatedRole,
    fetchPrimaryRole,
    fetchLastRefreshDate,
    getUserGlobalFilters,
    fetchDowntimeData,
    RootState,
    fetchUserLanguage,
    fetchUserTimezoneOffset,
    fetchNotificationTotalCount,
} from './store';
import { IJwt } from './types/response';
import {
    ACCCESS_TOKEN,
    ACCCESS_TOKEN_GRAPH,
    ACCCESS_TOKEN_POWERBI,
    CURRENT_USER_EMAIL,
    CURRENT_USER_FULL_NAME,
    CURRENT_USER_NAME,
    NAVBAR_ITEMS,
    ROLE_TYPE,
} from './utils/constants';
import SessionInactivePopup from './components/organisms/session-inactive/SessionInactivePopup';
import { useLanguageSync } from './i18n/useLanguageSync';
import { useUpdateUserTimeZoneOffset } from './utils/customHooks';
import ChatbotPanel from './components/organisms/kai-chatbot/ChatbotPanel';
import KaiAssistant from './components/molecules/kai-chatbot/KaiAssistant';


function App() {
    const { instance, inProgress, accounts } = useMsal();
    const isAuthenticated = useIsAuthenticated();
    const { pathname } = useLocation();
    const isGridLayoutRoute = pathname === '/edit-layout';
    const graphData = null;
    const [accessToken, setAccessToken] = useState<string>('');
    const isAuthorized = isAuthenticated && accessToken;
    const dispatch = useDispatch<AppDispatch>();
    const [toastConfig, setToastConfig] = useState<{
        visible: boolean;
        message: string;
        type: 'Default';
    }>({ visible: false, message: '', type: 'Default' });
    const [isSticky, setIsSticky] = useState(false);
    const [fixedToastConfig, setFixedToastConfig] = useState<{
        visible: boolean;
        message: string;
        type: 'Default';
    }>({ visible: true, message: '', type: 'Default' });
    const { DowntimeData, loading } = useSelector((state: RootState) => state.downtimeDataDetails);
    const [showSticky, setShowSticky] = useState(false);
    const [isMainBannerOpen, setMainBannerOpen] = useState(false);
    const [openChatPanel, setOpenChatPanel] = useState(false);
    const env = process.env.VITE_ENV_INDICATOR_BANNER;

    useEffect(() => {
        dispatch(fetchPrimaryRole());
    }, [dispatch]);

    /** this effect added to catch the scroll. Once Y scroll cross 110 it will set isSticky to true*/
    useEffect(() => {
        if (!DowntimeData) return;
        const handleScroll = () => {
            setIsSticky(window.scrollY > 110);
        };
        window.addEventListener('scroll', handleScroll);
        return () => window.removeEventListener('scroll', handleScroll);
    }, [isSticky]);

    useEffect(() => {
        if (!graphData && inProgress === InteractionStatus.None && !accessToken) {
            const apiAccessTokenRequest = {
                scopes: [process.env.VITE_AUTH_API_SCOPE ?? ''],
                account: accounts[0],
            };
            instance
                .acquireTokenSilent(apiAccessTokenRequest)
                .then(apiAccessTokenResponse => {
                    const user: IJwt = jwtDecode(apiAccessTokenResponse.accessToken);
                    sessionStorage.setItem(
                        CURRENT_USER_FULL_NAME,
                        user.given_name + ' ' + user.family_name,
                    );
                    const userName: string = user?.unique_name.split('@')[0] ?? '';
                    sessionStorage.setItem(CURRENT_USER_NAME, userName);
                    sessionStorage.setItem(ACCCESS_TOKEN, apiAccessTokenResponse.accessToken);
                    setAccessToken(apiAccessTokenResponse.accessToken ?? '');
                    customAxios.defaults.headers.Authorization = `Bearer ${apiAccessTokenResponse.accessToken}`;
                    getGraphAccessToken();
                    getPowerBIAccessToken();
                    dispatch(fetchUserPrimaryRole({ roleType: ROLE_TYPE.PRIMARY }));
                    dispatch(fetchUserSecondaryRole({ roleType: ROLE_TYPE.SECONDARY }));
                    dispatch(fetchUserDelegatedRole({ roleType: ROLE_TYPE.DELEGATED }));
                    startReceivingNotifications();
                    dispatch(fetchLastRefreshDate({ toolId: undefined, isRefreshed: true }));
                    dispatch(getUserGlobalFilters());
                    dispatch(fetchDowntimeData());
                    dispatch(fetchUserLanguage());
                    dispatch(fetchUserTimezoneOffset());
                    dispatch(fetchNotificationTotalCount());
                })
                .catch(error => {
                    if (error instanceof BrowserAuthError) {
                        if (!isAuthenticated) {
                            instance.loginRedirect();
                        }
                    }
                });
        }
    }, [instance, inProgress]);

    useEffect(() => {
        const handleScroll = () => {
            const scrollTop =
                window.pageYOffset || document.documentElement.scrollTop;
            setShowSticky(scrollTop > 0);
        };

        window.addEventListener("scroll", handleScroll);
        return () => {
            window.removeEventListener("scroll", handleScroll);
        };
    }, []);

    useEffect(() => {
        if (isGridLayoutRoute && openChatPanel) {
            setOpenChatPanel(false);
        }
    }, [isGridLayoutRoute, openChatPanel]);

    function getGraphAccessToken() {
        const apiAccessTokenRequest = {
            scopes: [process.env.VITE_AUTH_GRAPH_SCOPE ?? ''],
            account: accounts[0],
        };
        instance.acquireTokenSilent(apiAccessTokenRequest).then(apiAccessTokenResponse => {
            const user: IJwt = jwtDecode(apiAccessTokenResponse.accessToken);
            const userEmailId: string = user?.unique_name;
            sessionStorage.setItem(CURRENT_USER_EMAIL, userEmailId);
            sessionStorage.setItem(ACCCESS_TOKEN_GRAPH, apiAccessTokenResponse.accessToken);
            // Dispatch the fetchProfilePicture thunk
            dispatch(
                fetchProfilePicture({
                    graphAccessToken: apiAccessTokenResponse.accessToken,
                    userEmail: userEmailId,
                }),
            );
        });
    }

    function getPowerBIAccessToken() {
        const apiAccessTokenRequest = {
            scopes: [process.env.VITE_AUTH_POWERBI_SCOPE ?? ''],
            account: accounts[0],
        };
        instance.acquireTokenSilent(apiAccessTokenRequest).then(apiAccessTokenResponse => {
            sessionStorage.setItem(ACCCESS_TOKEN_POWERBI, apiAccessTokenResponse.accessToken);
        });
    }

    const navLinks = useMemo(() => NAVBAR_ITEMS.map(item => item.link), [NAVBAR_ITEMS]);

    const startReceivingNotifications = () => {
        const handleNotification = () => {
            dispatch(fetchNotificationTotalCount());
        };

        startSignalRConnection(handleNotification);

        return () => {
            stopSignalRConnection();
        };
    };

    useLanguageSync();
    useUpdateUserTimeZoneOffset();

    const showEnvIndicator = () => {
        if (!env) return null;

        return (
            <>
                {env ? (
                    <>
                        {showSticky && isMainBannerOpen ? (
                            <FloatingBannerSticky
                                isOpen={isMainBannerOpen}
                                updateEnvBannerState={setMainBannerOpen}
                                env={env}
                            />
                        ) : (
                            <FloatingBanner
                                isOpen={isMainBannerOpen}
                                updateEnvBannerState={setMainBannerOpen}
                                env={env}
                            />
                        )}
                    </>
                ) : null}
            </>
        );
    };

    return (
        isAuthorized && (
            <>
                <div className={styles.root}>
                    <SideNavigation />
                    <div className={styles.body}>
                        <TopHeader />
                        {!loading && DowntimeData
                            ? fixedToastConfig.visible && (
                                <div className={`${styles.fixedToastMargin}`}>
                                    <FixedToast
                                        message={DowntimeData?.description}
                                        onCloseToast={() =>
                                            setFixedToastConfig({
                                                ...fixedToastConfig,
                                                visible: false,
                                            })
                                        }
                                        title={DowntimeData?.header}
                                        type="Error"
                                        className={isSticky ? 'fixed-toast-configuration' : ''}
                                    />
                                </div>
                            )
                            : null}
                        <div className={styles.content}>
                            {showEnvIndicator()}
                            {navLinks.includes(pathname) ? <Navbar /> : null}
                            <AppRouter />
                        </div>
                    </div>
                    {toastConfig.visible && (
                        <Toast
                            distance="x5l"
                            message={toastConfig.message}
                            mode="Top Right"
                            onCloseToast={() => setToastConfig({ ...toastConfig, visible: false })}
                            toggle
                            type={toastConfig.type}
                            timer={5000}
                            title={'Notification'}
                        />
                    )}
                    <div className={styles['footer']} style={{ marginTop: '-8px' }}>
                        <Footer variant="grey"></Footer>
                    </div>

                    {/* This style is to apply margin-top globally to all the flyout so that top header is always visible*/}
                    <style>
                        {`div.flyout-header{
                        margin-top: 55px !important;
                }
                        
                        #risk-and-opportunity-fly-out .flyout-header {
                            margin-top: 0 !important;
                        }
                            
                #notifications-bell-icon-flyout div .flyout-header{
                 margin-top: 10px !important;
                 }
                 div#todo-fly-out .flyout-header{
                        margin-top: 55px !important;
                }
                 
                 #risk-and-opportunity-New-fly-out .flyout-header{
                 margin-top: 0px !important;
                 }

                 `}
                    </style>
                    
                {!isGridLayoutRoute && <ChatbotPanel setOpenChatPanel={(open) => setOpenChatPanel(open)} openChatPanel={openChatPanel}/>}
                    
                </div>
                <div>
                    <SessionInactivePopup />
                </div>

                {/* commented to unblock QA team */}
                {process.env.VITE_APP_ENV?.toLowerCase() === 'development' && !isGridLayoutRoute && <KaiAssistant openPanel={openChatPanel} setOpenChatPanel={(open) => setOpenChatPanel(open)}/>}
            </>
        )
    );
}

export default App;