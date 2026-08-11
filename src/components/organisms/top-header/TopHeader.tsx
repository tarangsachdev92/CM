import { useNavigate } from 'react-router-dom';
import dayjs from 'dayjs';
import { useEffect, useMemo, useRef, useState, useCallback } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useLocation } from 'react-router-dom';
import {
    AppDispatch,
    RootState,
    fetchLastRefreshDate,
    fetchNotificationTotalCount,
    fetchUserNotifications,
} from '../../../store';
import { setSelectedCalendar } from '../../../store/slice/selectedCalendarSlice';
import type { FilterGroupRequest, IFilterGroupItem } from '../../../types/request';
import { FORMAT_DUE_DATE, ROLE_TYPE } from '../../../utils/constants';
import { useIsGuestUser } from '../../../utils/customHooks';
import { generateBreadcrumbArray } from '../../../utils/helpers';
import { Label } from '../../atoms';
import GlobalFilterFlyout from '../global-filters/GlobalFilterFlyout';
import NotificationsBellIconFlyout from '../notifications-bell-icon-flyout/NotificationsBellIconFlyout';
import styles from './TopHeader.module.scss';
import { FiscalCalendar, Icon } from 'konnect-react-components';
import weekOfYear from 'dayjs/plugin/weekOfYear';
import { clearAllExpandedNotificationIds } from '../../../store/slice/notificationsAndAlertsSlice';
import LocalFilterFlyout from '../local-filters/LocalFilterFlyout';
import { navConfig, type NavItem } from '../../../utils/navigationConfig';

dayjs.extend(weekOfYear);
type CalendarViewType = 'day' | 'week' | 'month' | 'quarter' | 'year' | 'shift';
const formatSelectedDate = (dateObj: any) => {
    const { year, month, day, shift, week, quarter, fiscalInfo } = dateObj;

    const cleanFiscal = fiscalInfo && fiscalInfo !== '❌ No fiscal data' ? fiscalInfo : null;
    const fiscalPart = cleanFiscal ? ` [${cleanFiscal}]` : '';

    if (shift?.value) {
        return `${shift.value}, ${day.split(' ')[0]} ${month} '${year.toString().slice(-2)}`;
    }

    if (day) {
        return `${day.split(' ')[0]} ${month} '${year.toString().slice(-2)}${fiscalPart}`;
    }

    if (week) {
        // return `${week.value}, ${month} '${year.toString().slice(-2)}`;
        return `W${week.label.match(/\d+/)?.[0]}, ${month} '${year.toString().slice(-2)}`;
    }

    if (quarter && !month) {
        return `${quarter.value} '${year.toString().slice(-2)}`;
    }

    if (month) {
        return `${month} '${year.toString().slice(-2)}`;
    }

    if (year) {
        return `${year}`;
    }

    return 'Select a date';
};
const getDateFromSelectedDate = (selected: any) => {
    const { year, quarter, month, week, day } = selected;

    if (day) {
        return dayjs(`${year}-${month}-${day}`).toDate();
    }

    if (week) {
        return dayjs(`${year}-${month}-01`).toDate();
    }

    if (quarter) {
        return dayjs(`${year}-${month}-01`).toDate();
    }

    if (month) {
        const monthNumber = parseInt(month.value?.slice(1)) || parseInt(month); // Handles "M07" or "7"
        return dayjs(`${year}-${monthNumber}-01`).toDate();
    }

    if (year) {
        return dayjs(`${year}`).toDate();
    }

    return dayjs().toDate();
};

const getInitialCalendarData = () => {
    const now = dayjs();
    return {
        year: now.year(),
        fiscalInfo: '',
        quarter: {
            label: `Quarter ${Math.ceil((now.month() + 1) / 3)} (${now.format('MMM')} - ${now.add(2, 'months').format('MMM')})`,
            value: `Q${Math.ceil((now.month() + 1) / 3)}`,
        },
        month: now.format('MMM'),
        week: {
            label: `Week ${now.week()}`,
            value: `W${now.week()}`,
        },
        day: now.format(FORMAT_DUE_DATE),
        shift: { label: '', value: '' },
    };
};

function TopHeader() {
    const dispatch = useDispatch<AppDispatch>();
    const datePickerRef = useRef<HTMLDivElement | null>(null);
    const calendarRef = useRef<HTMLDivElement | null>(null);
    const [calendarOpen, setCalendarOpen] = useState(false);
    const [, setDisplayDate] = useState(new Date());
    const [selectedShift, setSelectedShift] = useState({
        label: '',
        value: '',
    });
    const [selectedDate, setSelectedDate] = useState(getInitialCalendarData());
    const [isGlobalFilterFlyoutOpen, setIsGlobalFilterFlyoutOpen] = useState(false);
    const [isFilterEnabled, setIsFilterEnabled] = useState(false);
    const [isFilterGroupSelected, setIsFilterGroupSelected] = useState(false);
    const [selectedFilterGroups, setSelectedFilterGroups] = useState<FilterGroupRequest>({
        filterGroupJson: [],
        roleBasedJSON: [],
    });
    const [enableToggle, setEnableToggle] = useState<boolean>(false);
    const [selectedView, setSelectedView] = useState<CalendarViewType>('day');
    const isGuestUser = useIsGuestUser();
    const location = useLocation();

    const selectedAFToDo = useSelector((state: RootState) => state.selectedAFToDo);

    const breadcrumbs = generateBreadcrumbArray(
        location.pathname,
        selectedAFToDo?.selectedToDoId,
        selectedAFToDo?.taskAFId,
    );
    const [isFlyoutOpen, setIsFlyoutOpen] = useState(false);
    const notificationScrollRef = useRef<HTMLDivElement | null>(null);
    const [isLocalFilterFlyoutOpen, setisLocalFilterFlyoutOpen] = useState<boolean>(false);
    const isPerformanceManagementRoute =
        location.pathname.toLowerCase() === '/performance-management';
    useMemo(() => {
        dispatch(fetchLastRefreshDate({}));
    }, [dispatch]);

    const roleType = useSelector((state: RootState) => state.primaryRole.data?.roleType);
    const totalUnreadNotifications = useSelector(
        (state: RootState) => state.notificationsAndAlerts.notificationTotalCount
    );
    const handleCheckboxChange = (checked: boolean, filterGroup?: IFilterGroupItem) => {
        setIsFilterEnabled(checked);
        if (filterGroup) {
            setSelectedFilterGroups(prev => {
                const updated = checked
                    ? [...prev.filterGroupJson, filterGroup]
                    : prev.filterGroupJson.filter(item => item.filterId !== filterGroup.filterId);

                const deduplicated = Array.from(
                    new Map(updated.map(item => [item.filterId, item])).values(),
                );

                return {
                    filterGroupJson: deduplicated,
                    roleBasedJSON: prev.roleBasedJSON, // ✅ Preserve existing roleBasedJSON
                };
            });
        }
    };

    const handleFilterGroupCheckboxChange = (checked: boolean, filterGroup: IFilterGroupItem) => {
        setIsFilterGroupSelected(checked);
        setSelectedFilterGroups(prev => {
            const updated = checked
                ? [...prev.filterGroupJson, filterGroup]
                : prev.filterGroupJson.filter(item => item.filterId !== filterGroup.filterId);

            const deduplicated = Array.from(
                new Map(updated.map(item => [item.filterId, item])).values(),
            );

            return {
                filterGroupJson: deduplicated,
                roleBasedJSON: prev.roleBasedJSON, // ✅ Preserve existing roleBasedJSON
            };
        });
    };

    const scrollToTop = () => {
        if (notificationScrollRef.current) {
            notificationScrollRef.current.scrollTop = 0;
        }
    };

    const onClickHandlerForNotificationBellIcon = () => {
    if (!isFlyoutOpen) {
        dispatch(fetchUserNotifications(false));
    }
        setIsFlyoutOpen(!isFlyoutOpen);
        dispatch(clearAllExpandedNotificationIds());
        scrollToTop();
    };

    const onClickHandlerForFlyoutCancelIcon = () => {
        dispatch(clearAllExpandedNotificationIds());
        setIsFlyoutOpen(false);
        scrollToTop();
    };

    const getViewTypeFromDateObj = (dateObj: any): CalendarViewType => {
        const { year, quarter, month, week, day, shift } = dateObj;

        const hasShiftValue = shift && shift.label && shift.value;

        if (year && !quarter && !month && !week && !day && !hasShiftValue) {
            return 'year';
        }
        if (year && quarter && !month && !week && !day && !hasShiftValue) {
            return 'quarter';
        }
        if (year && quarter && month && !week && !day && !hasShiftValue) {
            return 'month';
        }
        if (year && quarter && month && week && !day && !hasShiftValue) {
            return 'week';
        }
        if (year && quarter && month && week && day && !hasShiftValue) {
            return 'day';
        }
        if (hasShiftValue) {
            return 'shift';
        }
        return 'day';
    };

    const handleDateChange = (dateObj: any) => {
        setDisplayDate(dateObj);
        setSelectedShift(dateObj.shift);
        setSelectedDate(prev => ({
            ...prev,
            ...dateObj,
        }));

        const determinedViewType = getViewTypeFromDateObj(dateObj);
        setSelectedView(determinedViewType);
        dispatch(setSelectedCalendar(dateObj));
        setCalendarOpen(false);
    };

    const handleFiscalToggle = useCallback((toggleEnabled: boolean) => {
        setEnableToggle(toggleEnabled);
    }, []);

    useEffect(() => {
        const defaultCalendarData = getInitialCalendarData();
        dispatch(setSelectedCalendar(defaultCalendarData));
    }, [dispatch]);

    useEffect(() => {
        dispatch(fetchNotificationTotalCount());
    }, [dispatch]);

    const isAdmin = useSelector(
        (state: RootState) => state.rolePermissions.isAdmin
    );

    const userPrimaryRole = useSelector(
        (state: RootState) => state.userRole.primary
    );

    const isPrimaryRoleAdded = userPrimaryRole?.isAnyADGroupRequested;
    const navigate = useNavigate();

    const [openMenu, setOpenMenu] = useState<string | null>(null);
    const breadcrumbRef = useRef<HTMLDivElement | null>(null);
    useEffect(() => {
    const handleOutsideClick = (event: MouseEvent) => {
        if (
            breadcrumbRef.current &&
            !breadcrumbRef.current.contains(event.target as Node)
        ) {
            setOpenMenu(null);
        }
    };

    document.addEventListener('mousedown', handleOutsideClick);

    return () => {
        document.removeEventListener('mousedown', handleOutsideClick);
    };
}, []);

    return (
        <>
            <div className={styles['top-header-container']}>
                <div className={styles['header-container']}>
                    <nav className={styles['cc-breadcrumb']}>
                        <div ref={breadcrumbRef}>
                            {breadcrumbs.map((b) => {
                                const menuItems: NavItem[] =
                                    navConfig[b.label as keyof typeof navConfig] ?? [];

                                const filteredMenuItems = menuItems.filter(item => {
                                    return (
                                        (!item.adminOnly || isAdmin) &&
                                        (!item.requiresRole || isPrimaryRoleAdded)
                                    );
                                });
                                return (
                                    <div
                                        key={b.label}
                                        className={styles['breadcrumb-wrapper']}
                                    >
                                        <span
                                            className={styles['breadcrumb-item']}
                                            
                                            onClick={() => {
                                                if (filteredMenuItems.length === 0) return;

                                                setOpenMenu(
                                                    openMenu === b.label ? null : b.label
                                                );
                                            }}

                                        >
                                            {b.label}

                                            {filteredMenuItems.length >0 && (
                                                <Icon
                                                    name="chevron-down"
                                                    color="neutrals-B800"
                                                    size="l"
                                                />
                                            )}
                                        </span>

                                        {openMenu === b.label && filteredMenuItems.length > 0 && (
                                            <div className={styles['breadcrumb-menu']}>
                                                {filteredMenuItems.map(item =>
                                                    <div
                                                        key={item.link}
                                                        className={styles['menu-item']}
                                                        onClick={() => {
                                                            navigate(item.link);
                                                            setOpenMenu(null);
                                                        }}

                                                    >
                                                        {item.label}
                                                    </div>
                                                )}
                                            </div>
                                        )}
                                    </div>
                                );
                            })}
                        </div>
                    </nav>
                    <div className={styles['flex-row']}>
                        {isPerformanceManagementRoute && (
                            <>
                                <button
                                    disabled={roleType === ROLE_TYPE.GUEST}
                                    id="top-header-filter-button"
                                    className={`${styles['flex-row']} ${styles['button-container']}`}
                                    onClick={() => setisLocalFilterFlyoutOpen(true)}
                                >
                                    <Icon name="filter-lines" color="neutrals-B800" size="l" />
                                    <div className={styles['space-h-8']} />
                                    <Label type="body1-n">Local Filter</Label>
                                </button>
                                <div className={styles['space-h-16']} />
                                <div className={styles['v-divider']} />
                                <div className={styles['space-h-16']} />
                            </>
                        )}
                        <button
                            disabled={roleType === ROLE_TYPE.GUEST} //disable global filter for july release
                            id="top-header-filter-button"
                            className={`${styles['flex-row']} ${styles['button-container']}`}
                            onClick={() => setIsGlobalFilterFlyoutOpen(true)}
                        >
                            <Icon name="filter-funnel-01" color="neutrals-B800" size="l" />
                            <div className={styles['space-h-8']} />
                            <Label type="body1-n">Global Filter</Label>
                        </button>

                        <div className={styles['space-h-16']} />
                        <div className={styles['v-divider']} />
                        <div className={styles['space-h-16']} />

                        <div ref={datePickerRef} className={`${styles['button-container']}`}>
                            <button
                                onClick={() => setCalendarOpen(true)}
                                id="top-header-datepicker-button"
                                className={`${styles['date-picker-text']}`}
                            >
                                <div className={styles['flex-row']}>
                                    <Icon name="calendar" color="neutrals-B800" size="l" />
                                    <div className={styles['space-h-16']} />
                                    <Label type="body1-n">{formatSelectedDate(selectedDate)}</Label>
                                </div>
                            </button>
                        </div>
                        <div className={styles['space-h-16']} />
                        <div className={styles['v-divider']} />
                        <div className={styles['space-h-16']} />

                        <button
                            id="top-header-notification-button"
                            onClick={onClickHandlerForNotificationBellIcon}
                            className={styles['button-container-notification']}
                        >
                            <Icon name="bell-02" color="neutrals-B800" size="l" />
                            {!isGuestUser && totalUnreadNotifications > 0 && (
                                <div className={styles['notification-counter-container']}>
                                    <Label type="body4">
                                        <span className={styles['notification-text']}>
                                            {totalUnreadNotifications > 9
                                                ? '9+'
                                                : totalUnreadNotifications}
                                        </span>
                                    </Label>
                                </div>
                            )}
                        </button>
                    </div>
                </div>
                <div className={styles['sub-header-container']}>
                </div>
            </div>
            <NotificationsBellIconFlyout
                isFlyoutOpen={isFlyoutOpen}
                onClickHandlerForFlyoutCancelIcon={onClickHandlerForFlyoutCancelIcon}
                scrollRefCallback={ref => (notificationScrollRef.current = ref)}
            />
            {isGlobalFilterFlyoutOpen && (
                <GlobalFilterFlyout
                    isOpen={isGlobalFilterFlyoutOpen}
                    setIsOpen={setIsGlobalFilterFlyoutOpen}
                    onCancelClick={() => setIsGlobalFilterFlyoutOpen(false)}
                    isFilterEnabled={isFilterEnabled}
                    handleCheckboxChange={handleCheckboxChange}
                    isFilterGroupSelected={isFilterGroupSelected}
                    handleFilterGroupCheckboxChange={handleFilterGroupCheckboxChange}
                    selectedFilterGroups={selectedFilterGroups}
                />
            )}
            {isLocalFilterFlyoutOpen && (
                <LocalFilterFlyout
                    isOpen={isLocalFilterFlyoutOpen}
                    setIsOpen={setisLocalFilterFlyoutOpen}
                    onCancelClick={() => setisLocalFilterFlyoutOpen(false)}
                />
            )}
            {calendarOpen && (
                <div ref={calendarRef}>
                    <div className={styles['calendar-wrapper']}>
                        <FiscalCalendar
                            showPicker={calendarOpen}
                            setShowPicker={setCalendarOpen}
                            style={{
                                position: 'fixed',
                                marginTop: '3%',
                                marginLeft: '75%',
                                marginRight: '10%',
                                transform: 'translateX(-40%)',
                                zIndex: 9999,
                            }}
                            // className={styles['calendar-container']}
                            disableExtendedCalendarDefaults={true}
                            parentRef={datePickerRef}
                            calendarType="extended-picker"
                            currentDate={getDateFromSelectedDate(selectedDate)}
                            showDay={true}
                            showMonth={true}
                            showQuarter={true}
                            showYear={true}
                            showWeek={true}
                            showShifts={true}
                            extendedViewDefaultValueSelection={selectedDate}
                            defaultView={selectedView}
                            enableDefautSelection={true}
                            enableFiscalToggle={enableToggle}
                            onFiscalToggle={handleFiscalToggle}
                            disableButton={true}
                            onDateSelect={() => {}}
                            shifts={{
                                data: [
                                    { label: 'Shift 1', value: 'S1' },
                                    { label: 'Shift 2', value: 'S2' },
                                    { label: 'Shift 3', value: 'S3' },
                                ],
                                selectedOption: selectedShift,
                                setSelectedOption: (shift: { label: string; value: string }) => {
                                    setSelectedShift(shift);
                                },
                            }}
                            confirmSelection={{
                                apply: {
                                    variant: 'Primary',
                                    disabled: false,
                                    size: 'M',
                                    text: 'Apply',
                                    onClick: (date: any) => {
                                        handleDateChange(date);
                                    },
                                },
                                cancel: {
                                    variant: 'Primary',
                                    disabled: false,
                                    size: 'M',
                                    text: 'Cancel',
                                    onClick: () => {
                                        setCalendarOpen(false);
                                    },
                                },
                            }}
                        />
                    </div>
                </div>
            )}
        </>
    );
}

export default TopHeader;
