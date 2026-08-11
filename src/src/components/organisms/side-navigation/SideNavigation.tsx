import { Avatar, Popover, Tooltip } from 'antd';
import { Icon } from 'konnect-react-components';
import type { ReactNode } from 'react';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useLocation, useNavigate } from 'react-router-dom';
import {fetchIsAdmin,fetchUserNavigationPreferences,type AppDispatch,type RootState,
} from '../../../store';
import { resetSelectedAFToDo } from '../../../store/slice/selectedAFToDoSlice';
import { getUserNameInitials } from '../../../utils/helpers';
import { SIDE_NAV_ITEMS, SideNavItem } from '../../../utils/sideNavItems';
import UserSettingPopup from '../../molecules/usersetting-popup/UserSettingPopup';
import AnalyticsFlyout from '../analytics/AnalyticsFlyout';
import DigitalWorkerFlyout from '../DigitalWorker/DigitalWorker';
import PerformanceManagementFlyout from '../performance-management/PerformanceManagementFlyout';
import PerformanceManagementFlyout2 from '../performance-management/PerformanceManagementFlyout2';
import ToDoFlyout from '../todo/ToDoFlyoutCard/ToDoFlyout';
import AppsAndReportsFlyout from './AppsAndReportsFlyout';
import ExceptionsFlyout from './ExceptionFlyout/ExceptionsFlyout';
import styles from './SideNavigation.module.scss';
import KnowledgeHubFlyout from '../knowledge-hub/KnowledgeHubFlyout';
import TestingFlyout from '../todoTesting/ToDoFlyoutCard/TestingFlyout';
 
const MENU_SLOT_HEIGHT = 60;
const PROFILE_ONLY_MAX_HEIGHT = 300; // px — below this, only the Profile icon is shown
export function useSideNavSelection(filteredMenuItems: { iconName: string; link: string }[]) {
    const location = useLocation();
    const [selected, setSelected] = useState<string>();
    const [manualSelected, setManualSelected] = useState<string | null>(null);
    const hasInitialized = useRef(false);

    const getActiveMenu = useCallback(() => {
        if (manualSelected) return manualSelected;

        const activeItem = filteredMenuItems.find(item => {
            if (!item.link) return false;
            return location.pathname === item.link || location.pathname.startsWith(item.link + '/');
        });

        return activeItem?.iconName || '';
    }, [filteredMenuItems, location.pathname, manualSelected]);

    useEffect(() => {
        const active = getActiveMenu();

        // Run only once on initial mount
        if (!hasInitialized.current) {
            setSelected(active);
            hasInitialized.current = true;
            return;
        }

        // Update selected if active menu has changed
        if (active !== selected) {
            setSelected(active);
        }
    }, [location.pathname, getActiveMenu, selected]);

    return {
        selected,
        setSelected,
        manualSelected,
        setManualSelected,
    };
}

function SideNavigation() {
    const navigate = useNavigate();
    const dispatch = useDispatch<AppDispatch>();
    const primaryMenuItemsRef = useRef<HTMLDivElement | null>(null);
 
    const profilePicture = useSelector((state: RootState) => state.profilePicture.imageUrl);
    const userPrimaryRole = useSelector((state: RootState) => state.userRole.primary);
    const pinnedItemIds = useSelector((state: RootState) => state.sideNavigation.pinnedItemIds);
    const hasLoadedSideNavigation = useSelector(
        (state: RootState) => state.sideNavigation.hasLoaded,
    );
    const isSideNavigationLoading = useSelector(
        (state: RootState) => state.sideNavigation.isLoading,
    );
    const isPrimaryRoleAdded = userPrimaryRole?.isAnyADGroupRequested;
    const isAdmin = true;

    const [isProfileOnlyMode, setIsProfileOnlyMode] = useState(
        () => window.innerHeight <= PROFILE_ONLY_MAX_HEIGHT,
    );

    useEffect(() => {
        const handleResize = () => {
            setIsProfileOnlyMode(window.innerHeight <= PROFILE_ONLY_MAX_HEIGHT);
        };

        handleResize();
        window.addEventListener('resize', handleResize);
        return () => window.removeEventListener('resize', handleResize);
    }, []);
 
    useEffect(() => {
        dispatch(fetchIsAdmin());
    }, [dispatch]);
 
    useEffect(() => {
        if (!hasLoadedSideNavigation && !isSideNavigationLoading) {
            dispatch(fetchUserNavigationPreferences());
        }
    }, [dispatch, hasLoadedSideNavigation, isSideNavigationLoading]);
 
    const menuItems = useMemo(() => {
        return SIDE_NAV_ITEMS.map(item => ({
            ...item,
            isDisabled:
                item.id === 'digital-tools-library'
                    ? !isPrimaryRoleAdded
                    : Boolean(item.isDisabled),
        })).filter(item => !item.adminOnly || isAdmin);
    }, [isPrimaryRoleAdded, isAdmin]);
 
    const fixedMenuItems = useMemo(() => menuItems.filter(item => item.isFixed), [menuItems]);
    const pinnedMenuItems = useMemo(() => {
        const pinnedItemOrder = new Map(
            pinnedItemIds.map((itemId, index) => [itemId, index]),
        );
 
        return menuItems
            .filter(item => !item.isFixed && pinnedItemIds.includes(item.id))
            .sort(
                (left, right) =>
                    (pinnedItemOrder.get(left.id) ?? Number.MAX_SAFE_INTEGER) -
                    (pinnedItemOrder.get(right.id) ?? Number.MAX_SAFE_INTEGER),
            );
    }, [menuItems, pinnedItemIds]);
    const [visiblePinnedCapacity, setVisiblePinnedCapacity] = useState(0);
                const [dynamicSelectedItem, setDynamicSelectedItem] = useState<SideNavItem | null>(null);
 
    useEffect(() => {
        const menuContainer = primaryMenuItemsRef.current;
        if (!menuContainer) return;
 
        const updateCapacity = () => {
            const railContainer = primaryMenuItemsRef.current;

            if (!railContainer) return;

            const availableHeight = railContainer.clientHeight;
            const totalVisibleSlots = Math.max(0, Math.floor(availableHeight / MENU_SLOT_HEIGHT));
            const dynamicSlotCount = dynamicSelectedItem ? 1 : 0;

            setVisiblePinnedCapacity(
                Math.max(0, totalVisibleSlots - fixedMenuItems.length - dynamicSlotCount),
            );
        };
 
        updateCapacity();
 
        const resizeObserver = new ResizeObserver(updateCapacity);
        resizeObserver.observe(menuContainer);
        window.addEventListener('resize', updateCapacity);
 
        return () => {
            resizeObserver.disconnect();
            window.removeEventListener('resize', updateCapacity);
        };
    }, [dynamicSelectedItem, fixedMenuItems.length]);
 
    const visiblePinnedMenuItems = useMemo(
        () => pinnedMenuItems.slice(0, visiblePinnedCapacity),
        [pinnedMenuItems, visiblePinnedCapacity],
    );
    const overflowPinnedMenuItems = useMemo(
        () => pinnedMenuItems.slice(visiblePinnedCapacity),
        [pinnedMenuItems, visiblePinnedCapacity],
    );
    const hiddenMenuItems = useMemo(
        () => menuItems.filter(item => !item.isFixed && !pinnedItemIds.includes(item.id)),
        [menuItems, pinnedItemIds],
    );
    const visiblePinnedMenuItemsWithoutDynamic = useMemo(
        () =>
            dynamicSelectedItem
                ? visiblePinnedMenuItems.filter(item => item.id !== dynamicSelectedItem.id)
                : visiblePinnedMenuItems,
        [dynamicSelectedItem, visiblePinnedMenuItems],
    );
    const visibleRailMenuItems = useMemo(
        () => [
            ...fixedMenuItems,
            ...visiblePinnedMenuItemsWithoutDynamic,
            ...(dynamicSelectedItem ? [dynamicSelectedItem] : []),
        ],
        [dynamicSelectedItem, fixedMenuItems, visiblePinnedMenuItemsWithoutDynamic],
    );
 
    const { selected, setSelected, setManualSelected } = useSideNavSelection(visibleRailMenuItems);
 
    const [isOpenUserSettings, setIsOpenUserSettings] = useState(false);
    const [isOpenAppsReports, setIsOpenAppsReports] = useState(false);
    const [isOpenExceptionsFlyout, setIsOpenExceptionsFlyout] = useState(false);
    const [isOpenToDoReports, setIsOpenToDoReports] = useState(false);
    const [isOpenTesting, setIsOpenTesting] = useState(false);
    const [isOpenAnalytics, setIsOpenAnalytics] = useState(false);
    const [isOpenDigitalWorker, setIsOpenDigitalWorker] = useState(false);
    const [isOpenPerformanceFlyout, setIsOpenPerformanceFlyout] = useState(false);
    const [isOpenPerformanceFlyout2, setIsOpenPerformanceFlyout2] = useState(false);
    const [isOpenKnowledgeHub, setIsOpenKnowledgeHub] = useState(false);
    const [isMoreOpen, setIsMoreOpen] = useState(false);
 
    useEffect(() => {
        if (!dynamicSelectedItem) return;
        const stillInMoreMenu = [...overflowPinnedMenuItems, ...hiddenMenuItems].some(
            item => item.id === dynamicSelectedItem.id,
        );
        if (!stillInMoreMenu) {
            setDynamicSelectedItem(null);
        }
    }, [dynamicSelectedItem, hiddenMenuItems, overflowPinnedMenuItems]);
 
    const togglePopup = () => {
        setIsOpenUserSettings(true);
        setIsOpenAppsReports(false);
        setIsOpenExceptionsFlyout(false);
        setIsOpenToDoReports(false);
        setIsOpenAnalytics(false);
        setIsOpenDigitalWorker(false);
        setIsOpenPerformanceFlyout(false);
        setIsOpenPerformanceFlyout2(false);
        setIsOpenKnowledgeHub(false);
        setIsMoreOpen(false);
        setDynamicSelectedItem(null);
        setSelected('');
        setManualSelected(null);
    };
 
    const closePopup = () => setIsOpenUserSettings(false);
 
    const navigateToPage = (iconName: string, link: string, selectedFromMore?: SideNavItem) => {
        if (link) {
            navigate(link);
            setManualSelected(iconName);
            setTimeout(() => setManualSelected(null), 100);
        } else {
            setManualSelected(iconName);
        }
        setSelected(iconName);
        setIsOpenUserSettings(false);
        setIsOpenAppsReports(iconName === 'waterfalls-v');
        setIsOpenExceptionsFlyout(iconName === 'alert-hexagon');
        setIsOpenToDoReports(iconName === 'full-selection');
        setIsOpenPerformanceFlyout(iconName === 'file-07');
        setIsOpenPerformanceFlyout2(iconName === 'file-06');
        setIsOpenAnalytics(iconName === 'dataflow-01');
        setIsOpenDigitalWorker(iconName === 'data-flow-03');
        setIsOpenKnowledgeHub(iconName === 'book-open-01');
        setIsMoreOpen(false);
        setDynamicSelectedItem(selectedFromMore ?? null);
        setIsOpenTesting(iconName === 'file-check-02');

 
        // Dispatch only if iconName is NOT 'full-selection'
        if (iconName !== 'full-selection') {
            dispatch(resetSelectedAFToDo());
        }
    };
 
    const getSelectedIcon = (iconName: string, isDisabled: boolean) => (
        <Icon
            name={iconName as any}
            size="xl"
            color={
                selected === iconName && !isOpenUserSettings
                    ? 'primary-green-400-color'
                    : isDisabled
                      ? 'neutrals-B500'
                      : 'neutrals-B100'
            }
        />
    );
 
    const renderMenuButton = (menu: SideNavItem, selectedFromMore?: SideNavItem) => (
        <Tooltip title={menu.label} placement="right" trigger={['hover']}>
            <button
                type="button"
                className={
                    selected === menu.iconName && !isOpenUserSettings
                        ? styles['menu-active']
                        : menu.isDisabled
                          ? styles['menu-disabled']
                          : styles['menu-inactive']
                }
                onClick={() => {
                    if (!menu.isDisabled) {
                        navigateToPage(menu.iconName, menu.link, selectedFromMore);
                    }
                }}
            >
                <span className={styles['menu-button-content']}>
                    {getSelectedIcon(menu.iconName, Boolean(menu.isDisabled))}
                    <span
                        className={
                            selected === menu.iconName && !isOpenUserSettings
                                ? styles['menu-label-active']
                                : styles['menu-label']
                        }
                    >
                        {menu.railLabel ?? menu.label}
                    </span>
                </span>
            </button>
        </Tooltip>
    );
 
    const renderMoreGridSection = (
        title: string,
        items: SideNavItem[],
        headerAction?: ReactNode,
    ) => (
        <div className={styles['more-menu-section']}>
            <div className={styles['more-menu-section-title-row']}>
                <div className={styles['more-menu-section-title']}>{title}</div>
                {headerAction}
            </div>
            <div className={styles['more-menu-grid']}>
                {items.map(item => {
                    const isItemSelected = selected === item.iconName;
                    return (
                        <button
                            key={item.id}
                            type="button"
                            className={
                                isItemSelected
                                    ? styles['more-menu-grid-item-active']
                                    : styles['more-menu-grid-item']
                            }
                            onClick={() => {
                                if (!item.isDisabled) {
                                    navigateToPage(item.iconName, item.link, item);
                                }
                            }}
                        >
                            <Icon
                                name={item.iconName as any}
                                size="m"
                                color={
                                    item.isDisabled
                                        ? 'neutrals-B500'
                                        : isItemSelected
                                          ? 'primary-green-400-color'
                                          : 'neutrals-B70'
                                }
                            />
                            <span
                                className={
                                    isItemSelected
                                        ? styles['more-menu-grid-label-active']
                                        : styles['more-menu-grid-label']
                                }
                            >
                                {item.railLabel ?? item.label}
                            </span>
                        </button>
                    );
                })}
            </div>
        </div>
    );
 
    const moreMenuSettingsButton = (
        <Tooltip title="Side Navigation Settings" placement="top" trigger={['hover']}>
            <button
                type="button"
                className={styles['more-menu-settings-button']}
                onClick={() => {
                    setIsMoreOpen(false);
                    navigate('/user-profile-settings?tab=Side%20Nav');
                }}
            >
                <Icon name="settings-01" size="m" color="neutrals-B70" />
            </button>
        </Tooltip>
    );
 
    const moreMenuContent = (
        <div className={styles['more-menu-panel']}>
            {overflowPinnedMenuItems.length > 0 &&
                renderMoreGridSection(
                    'More Pinned Items',
                    overflowPinnedMenuItems,
                    moreMenuSettingsButton,
                )}
            {hiddenMenuItems.length > 0 &&
                renderMoreGridSection(
                    'Hidden Items',
                    hiddenMenuItems,
                    overflowPinnedMenuItems.length ? undefined : moreMenuSettingsButton,
                )}
        </div>
    );
 
    useEffect(() => {
        if (!isOpenToDoReports) return;
        let style = document.querySelector('[data-type="todo-flyout-style"]');
        if (!style) {
            style = document.createElement('style');
            style.setAttribute('data-type', 'todo-flyout-style');
            style.innerHTML = `
                #todo-fly-out .flyout-body {
                    padding: 0rem !important;
                }
            `;
            document.head.appendChild(style);
        }
 
        return () => {
            const existing = document.querySelector('[data-type="todo-flyout-style"]');
            if (existing) {
                existing.remove();
            }
        };
    }, [isOpenToDoReports]);

    const selectedAFToDo = useSelector((state: RootState) => state.selectedAFToDo);
    const SelectedId: string = selectedAFToDo?.taskAFId ? String(selectedAFToDo.taskAFId) : '';
    return (
        <>
            <div className={styles['container']}>
                <div className={styles['logo-container']} />
                <div className={styles['menu-items-container']}>
                    <div ref={primaryMenuItemsRef} className={styles['primary-menu-items']}>
                        {!isProfileOnlyMode &&
                            visibleRailMenuItems.map((menu, index) => {
                                return (
                                    <div key={menu.id || index} className={styles['menu-container']}>
                                        {renderMenuButton(
                                            menu,
                                            dynamicSelectedItem?.id === menu.id ? dynamicSelectedItem : undefined,
                                        )}
                                    </div>
                                );
                            })}
                    </div>
 
                    {!isProfileOnlyMode && (
                        <div className={styles['more-section']}>
                            {(hiddenMenuItems.length > 0 || overflowPinnedMenuItems.length > 0) && (
                                <div className={styles['more-trigger-container']}>
                                    <Popover
                                        content={moreMenuContent}
                                        trigger="click"
                                        placement="right"
                                        rootClassName={styles['more-popover']}
                                        arrow={false}
                                        open={isMoreOpen}
                                        onOpenChange={setIsMoreOpen}
                                    >
                                        <Tooltip title="More" placement="right" trigger={['hover']}>
                                            <button
                                                type="button"
                                                className={
                                                    isMoreOpen
                                                        ? styles['menu-active']
                                                        : styles['menu-inactive']
                                                }
                                            >
                                                <span
                                                    className={
                                                        isMoreOpen
                                                            ? styles['more-dots-active']
                                                            : styles['more-dots']
                                                    }
                                                    aria-hidden="true"
                                                />
                                            </button>
                                        </Tooltip>
                                    </Popover>
                                </div>
                            )}
                        </div>
                    )}
 
                    {!isProfileOnlyMode && (
                        <div className={styles['menu-container-knowledgehub']}>
                            <Tooltip title="Knowledge Hub" placement="right" trigger={['hover']}>
                                <button
                                    type="button"
                                    className={
                                        selected === 'book-open-01'
                                            ? styles['menu-knowledgehub-active']
                                            : styles['menu-knowledgehub-inactive']
                                    }
                                    onClick={() => navigateToPage('book-open-01', '')}
                                >
                                    <div className={styles['menu-button-content']}>
                                        <div className={styles['knowledgehub-icon']}>
                                            <Icon
                                                name="book-open-01"
                                                size="xl"
                                                color={
                                                    selected === 'book-open-01'
                                                        ? 'primary-green-400-color'
                                                        : 'neutrals-B100'
                                                }
                                            />
                                        </div>
                                        <span
                                            className={
                                                selected === 'book-open-01'
                                                    ? styles['menu-label-active']
                                                    : styles['menu-label']
                                            }
                                        >
                                            Knowledge
                                        </span>
                                    </div>
                                </button>
                            </Tooltip>
                        </div>
                    )}
 
                    <div className={styles['menu-container-profile']}>
                        <Tooltip title="User settings" placement="right" trigger={['hover']}>
                            <div
                                className={
                                    isOpenUserSettings
                                        ? styles['menu-profile-active']
                                        : styles['menu-profile-inactive']
                                }
                            >
                                {profilePicture ? (
                                    <Avatar size={40} src={profilePicture} onClick={togglePopup} />
                                ) : (
                                    <div
                                        className={styles['skeleton-avatar']}
                                        onClick={togglePopup}
                                    >
                                        {getUserNameInitials()}
                                    </div>
                                )}
                            </div>
                        </Tooltip>
                    </div>
                </div>
            </div>

            {isOpenUserSettings && (
                <div className={styles['overlay']}>
                    <div className={styles['popup-container']}>
                        <UserSettingPopup closePopup={closePopup} isOpen={isOpenUserSettings} />
                    </div>
                </div>
            )}

            {isOpenAppsReports && (
                <AppsAndReportsFlyout
                    key="apps-and-reports"
                    isOpen={isOpenAppsReports}
                    onClose={() => setIsOpenAppsReports(false)}
                    setIsOpen={setIsOpenAppsReports}
                />
            )}

            {isOpenExceptionsFlyout && (
                <ExceptionsFlyout
                    key="exceptions-flyout"
                    isOpen={isOpenExceptionsFlyout}
                    onClose={() => setIsOpenExceptionsFlyout(false)}
                    setIsOpen={setIsOpenExceptionsFlyout}
                />
            )}
            {isOpenToDoReports && (
                <ToDoFlyout
                    key="ToDo's"
                    isOpen={isOpenToDoReports}
                    onClose={() => setIsOpenToDoReports(false)}
                    setIsOpen={setIsOpenToDoReports}
                    onFilterChange={() => {}}
                    externalSelectedId={SelectedId}
                />
            )}
            {isOpenTesting && (
                <TestingFlyout
                    isOpen={isOpenTesting}
                    onClose={() => setIsOpenTesting(false)}
                    setIsOpen={setIsOpenTesting}
                    onFilterChange={() => { }}
                    externalSelectedId=""
                />
            )}


            {isOpenAnalytics && (
                <AnalyticsFlyout
                    key="Advanced Forecasting"
                    isOpen={isOpenAnalytics}
                    onClose={() => setIsOpenAnalytics(false)}
                    setIsOpen={setIsOpenAnalytics}
                />
            )}
            {isOpenDigitalWorker && (
                <DigitalWorkerFlyout
                    key="Digital Worker"
                    isOpen={isOpenDigitalWorker}
                    onClose={() => setIsOpenDigitalWorker(false)}
                    setIsOpen={setIsOpenDigitalWorker}
                />
            )}
            {isOpenPerformanceFlyout && (
                <PerformanceManagementFlyout
                    key="performance-management-flyout"
                    isOpen={isOpenPerformanceFlyout}
                    onClose={() => setIsOpenPerformanceFlyout(false)}
                    setIsOpen={setIsOpenPerformanceFlyout}
                />
            )}
            {isOpenPerformanceFlyout2 && (
                <PerformanceManagementFlyout2
                    key="performance-management-flyout2"
                    isOpen={isOpenPerformanceFlyout2}
                    onClose={() => setIsOpenPerformanceFlyout2(false)}
                    setIsOpen={setIsOpenPerformanceFlyout2}
                />
            )}
            {isOpenKnowledgeHub && (
                <KnowledgeHubFlyout
                    key="knowledge-hub"
                    isOpen={isOpenKnowledgeHub}
                    onClose={() => setIsOpenKnowledgeHub(false)}
                    setIsOpen={setIsOpenKnowledgeHub}
                />
            )}
        </>
    );
}

export default SideNavigation;
