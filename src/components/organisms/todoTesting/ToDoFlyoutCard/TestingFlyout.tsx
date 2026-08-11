import { Tooltip } from 'antd';
import Flex from 'antd/es/flex';
import { AnimatedLoaders, DropDown, Flyout, SideMenu, Icon } from 'konnect-react-components';
import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { Link, useNavigate } from 'react-router-dom';
import { ExternalLinkIcon, FilterIcon, LeftArrowIcon } from '../../../../assets/icons/icons';
import { MyToDoEmptyState } from '../../../../assets/images/images';
import { AppDispatch, fetchTestingToDos, RootState } from '../../../../store';
import { fetchToDoFilters } from '../../../../store/thunks/fetchToDoFilters';
import { Label } from '../../../atoms';
import GroupedToDoCards from '../GroupedToDoCards';
import { groupTasksByDueDate } from '../groupUtils';
import ToDoHeader from '../ToDoHeader';
import styles from './ToDoFlyout.module.scss';
import FlyoutTaskDetails from './TestingToDoFlyoutTaskDetails';
import {
    setSelectedTools,
    setSelectedPriorities,
    setSelectedDueDates,
    setCalendarRange,
    setEnableDateToggle,
} from '../../../../store/slice/toDoFilterSelectionSlice';
import { logError } from '../../../../utils/helpers';

interface Props {
    isOpen: boolean;
    onClose: () => void;
    setIsOpen: (open: boolean) => void;
    onFilterChange: (value: 'Open' | 'Overdue' | 'Completed') => void;
    externalSelectedId?: string;
}

const TestingFlyout: React.FC<Props> = ({ isOpen, setIsOpen, onFilterChange, externalSelectedId }) => {
    const userRole = useSelector((state: RootState) => state.primaryRole.data);
    const todofilter = useSelector((state: RootState) => state.toDoFilterSelection);

    const {
        selectedTools,
        selectedPriorities,
        selectedDueDates,
        calendarRange,
        enableDateToggle,
        rangeStartDate,
        rangeEndDate,
    } = todofilter;
    const [isOpenToDoDetails, setIsOpenToDoDetails] = useState(Boolean(externalSelectedId));
    const [isKebabBusy, setIsKebabBusy] = useState(false);
    const dispatch = useDispatch<AppDispatch>();
    const { data: todoFlyout } = useSelector((state: RootState) => state.todoDetails);
    // const { data: todoDetails } = useSelector((state: RootState) => state.todoDetails);
    const [menuRefs, setMenuRefs] = useState<HTMLDivElement | null>(null);
    const [openDropdown, setOpenDropdown] = useState<string | null>(null);

    const [menuOpen, setMenuOpen] = useState(false);

    // Existing refs

    // Add these new refs for dropdowns
    const dueDateRef = useRef<HTMLDivElement>(null);
    const priorityRef = useRef<HTMLDivElement>(null);
    const toolRef = useRef<HTMLDivElement>(null);

    type Option = {
        category: string;
        label: string;
        value: string;
    };

    const [sideMenuAutoClose, setSideMenuAutoClose] = useState(false);

    // Loading during fetch
    const [, setIsLoading] = useState(false);
    const [lockToExternal, setLockToExternal] = useState(Boolean(externalSelectedId));

    const formatToYYYYMMDD = (date: string | null): string | null => {
        if (!date) return null;
        const d = new Date(date);
        if (isNaN(d.getTime())) return null; // invalid date check
        return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
    };

    const buildPayload = useCallback(() => {
        const toolName = selectedTools.length
            ? selectedTools.map(t => t.label.split(' - ')[0]).join(', ')
            : null;

        const priorityName = selectedPriorities.length
            ? selectedPriorities.map(p => p.label).join(', ')
            : null;

        const dueDate = selectedDueDates.length
            ? selectedDueDates.map(d => d.value).join(', ')
            : null;

        // ✅ Convert start and end dates to YYYY-MM-DD
        const startDueDate = formatToYYYYMMDD(calendarRange.startDate);
        const endDueDate = formatToYYYYMMDD(calendarRange.endDate);

        const AFTab = selectedTools.length
            ? selectedTools
                  .filter(t => t.value.includes('Advance Forecasting'))
                  .map(t => (t.value.includes('Past') ? 'Past' : 'Future'))
                  .join(', ') || null
            : null;

        return {
            toolName,
            priorityName,
            dueDate,
            startDueDate,
            endDueDate,
            selectedId: null,
            AFTab,
        };
    }, [selectedTools, selectedPriorities, selectedDueDates, calendarRange]);

    const fetchToDoData = useCallback(async () => {
        try {
            setIsLoading(true);
            const payload = buildPayload();
            await dispatch(fetchTestingToDos(payload));
        } catch (error) {
            logError(error)
        } finally {
            setIsLoading(false);
        }
    }, [dispatch, buildPayload]);

    // initial load
    useEffect(() => {
        fetchToDoData();
    }, [fetchToDoData]);

    const hasSelections = () => {
        const hasRange = Boolean(
            calendarRange?.startDate || calendarRange?.endDate || rangeStartDate || rangeEndDate,
        );

        return (
            selectedTools.length > 0 ||
            selectedPriorities.length > 0 ||
            selectedDueDates.length > 0 ||
            hasRange
        );
    };

    // dropdown apply handlers: ONLY update state then close; let fetchData (or a filters-change effect) do the dispatch
    const handleDueDateApply = (
        options: Option[] | { startDate?: string | null; endDate?: string | null },
    ) => {
        if (Array.isArray(options)) {
            dispatch(setSelectedDueDates(options));
            dispatch(setCalendarRange({ startDate: null, endDate: null }));
            dispatch(setEnableDateToggle(false));

            setSelectedDueDates(options);
            setCalendarRange({ startDate: null, endDate: null });
            setEnableDateToggle(true);
        } else {
            const s = options?.startDate ?? null;
            const e = options?.endDate ?? null;

            setSelectedDueDates([]); // no single-date chips in range mode
            setCalendarRange({ startDate: s, endDate: e }); // if you need string range for payloads
            setEnableDateToggle(Boolean(s || e));

            dispatch(setSelectedDueDates([]));
            dispatch(setCalendarRange({ startDate: s, endDate: e }));
            dispatch(setEnableDateToggle(Boolean(s || e)));

            // // Persist range in calendar (Date objects)
            // setRangeStartDate(s ? new Date(s) : null);
            // setRangeEndDate(e ? new Date(e) : null);
        }
        // Build payload using the new values
        buildPayload();

        setOpenDropdown(null);
        setSideMenuAutoClose(true);
        setMenuOpen(false);
    };

    const handlePriorityApply = (options: Option[]) => {
        const picked = Array.isArray(options) ? options : [];
        dispatch(setSelectedPriorities(picked));

        setSelectedPriorities(Array.isArray(options) ? options : []);
        // Build payload using the new values
        buildPayload();

        setOpenDropdown(null);
        setSideMenuAutoClose(true);
        setMenuOpen(false);
    };

    const handleToolApply = (options: Option[]) => {
        const picked = Array.isArray(options) ? options : [];
        dispatch(setSelectedTools(picked));

        setSelectedTools(Array.isArray(options) ? options : []);
        // Build payload using the new values
        buildPayload();

        setOpenDropdown(null);
        setSideMenuAutoClose(true);
        setMenuOpen(false);
    }; // trigger fetch when filters change
    useEffect(() => {
        fetchToDoData();
    }, [selectedTools, selectedPriorities, selectedDueDates, calendarRange, fetchToDoData]);

    useEffect(() => {
        dispatch(fetchToDoFilters());
    }, [dispatch]);
    const {
        toolNames,
        priorityNames,
        dueDates,
        loading: filterLoading,
    } = useSelector((state: RootState) => state.todoFilter);

    useEffect(() => {
        fetchToDoData();
    }, [fetchToDoData]);
    useEffect(() => {
        if (!isOpenToDoDetails) {
            setSelectedId('');
        }
    }, [isOpenToDoDetails]);

    // ✅ Safely convert string | Date | null -> Date | null
    const toDateOrNull = (v?: string | Date | null): Date | null => {
        if (!v) return null;
        if (v instanceof Date) return isNaN(v.getTime()) ? null : v;
        const d = new Date(v);
        return isNaN(d.getTime()) ? null : d;
    };

    useEffect(() => {
        const onRefresh = () => {
            fetchToDoData();
        };
        window.addEventListener('todo:refresh', onRefresh);
        return () => window.removeEventListener('todo:refresh', onRefresh);
    }, [fetchToDoData]);

    const openAndOverdueTasks = todoFlyout.filter(
        task => task.status === 'Due' || task.status === 'Overdue',
    );

    const groupedTasks = groupTasksByDueDate(openAndOverdueTasks, 'desc');

    const [selectedId, setSelectedId] = useState<string>(externalSelectedId ?? '');

    const navigate = useNavigate();
    const { loading: detailsLoading, error } = useSelector((state: RootState) => state.todoDetails);
    const flyoutRef = useRef<HTMLDivElement>(null);
    const selectedTask = openAndOverdueTasks.find(task => String(task.id) === String(selectedId));
    const myTaskCount = todoFlyout.filter(
        task =>
            task.status.toLocaleLowerCase() === 'due' ||
            task.status.toLocaleLowerCase() === 'overdue',
    ).length;
    const [isManuallyClosed, setIsManuallyClosed] = useState(false);

    useEffect(() => {
        // This useEffect changes are done for handling the x icon close logic when clicked from todo Home widget
        if (!isOpen) return;
        if (!externalSelectedId) return;
        if (isManuallyClosed) return;
        if (!openAndOverdueTasks || openAndOverdueTasks.length === 0) return;
        if (!lockToExternal) return; // <-- only override while locked

        const nextId = String(externalSelectedId);
        const exists = openAndOverdueTasks.some(t => String(t.id) === nextId);
        if (!exists) return;

        setSelectedId(nextId);
        setIsOpenToDoDetails(true);
    }, [isOpen, externalSelectedId, openAndOverdueTasks, isManuallyClosed, lockToExternal]);

    useEffect(() => {
        if (!isOpen) {
            setIsManuallyClosed(false); // Reset when main flyout closes
        }
    }, [isOpen]);

    useEffect(() => {
        setIsManuallyClosed(false);
    }, [externalSelectedId]);

    // Format date helper
    // const formatDate = (dateString: string) => {
    //   const date = new Date(dateString);
    //   return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
    // };

    useEffect(() => {
        setLockToExternal(Boolean(externalSelectedId));
    }, [externalSelectedId]);

    const formatDate = (date: string | null) => {
        if (!date) return '';
        const d = new Date(date);
        return d.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });
    };

    const dueDateOptions = useMemo(() => {
        const uniqueDates = new Set();
        return (dueDates || [])
            .filter(
                d =>
                    d.dueDate &&
                    d.dueDate.trim() !== '' &&
                    (d.status === 'Due' || d.status === 'Overdue'),
            )
            .filter(d => {
                if (uniqueDates.has(d.dueDate)) return false;
                uniqueDates.add(d.dueDate);
                return true;
            })
            .map(d => ({
                category: d.status,
                label: formatDate(d.dueDate),
                value: d.dueDate,
            }));
    }, [dueDates]);

    const priorityOrder = ['Critical', 'High', 'Medium', 'Low'];

    const priorityOptions = useMemo(
        () =>
            [...(priorityNames || [])] // ✅ Clone the array
                .sort(
                    (a, b) =>
                        priorityOrder.indexOf(a.priorityName) -
                        priorityOrder.indexOf(b.priorityName),
                )
                .map(p => ({
                    category: 'Priority',
                    label: p.priorityName,
                    value: p.priorityName,
                })),
        [priorityNames],
    );

    const toolOptions = useMemo(
        () =>
            (toolNames || []).flatMap(t => {
                if (t.toolName === 'Advance Forecasting') {
                    return [
                        {
                            category: 'Tool',
                            label: 'Advance Forecasting - Past',
                            value: 'Advance Forecasting - Past',
                        },
                        {
                            category: 'Tool',
                            label: 'Advance Forecasting - Future',
                            value: 'Advance Forecasting - Future',
                        },
                    ];
                }
                return [{ category: 'Tool', label: t.toolName, value: t.toolName }];
            }),
        [toolNames],
    );

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (flyoutRef.current && !flyoutRef.current.contains(event.target as Node)) {
                setIsOpen(true);
                setSideMenuAutoClose(true);
            }
            if (menuRefs && !menuRefs.contains(event.target as Node)) {
                setSideMenuAutoClose(true); // Prevent auto-closing of the side menu
            }
        };

        if (isOpen) {
            document.addEventListener('mousedown', handleClickOutside);
        }

        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
        };
    }, [isOpen]);

    const onClickOutsideFlyoutContainer = () => {
        if (!isKebabBusy) {
            if (isOpen) {
                setIsOpen(false);
            }
        }
    };

    const startObj = toDateOrNull(rangeStartDate);
    const endObj = toDateOrNull(rangeEndDate);

    useEffect(() => {
        if (!isOpen) return;
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
    }, [isOpen]);

    useEffect(() => {
        const flyoutWrapper = document.getElementById('todo-fly-out');
        if (!flyoutWrapper) return;

        const handleClick = (event: MouseEvent) => {
            const target = event.target as HTMLElement;

            if (target.closest('[class^="flyout-container"]')) return;

            onClickOutsideFlyoutContainer();
        };

        flyoutWrapper.addEventListener('click', handleClick);
        return () => flyoutWrapper.removeEventListener('click', handleClick);
    }, [onClickOutsideFlyoutContainer]);

    useEffect(() => {
        const allTaskIds = openAndOverdueTasks.map(task => String(task.id));

        if (selectedId && !allTaskIds.includes(selectedId)) {
            const prevIndex = allTaskIds.indexOf(selectedId);
            const nextId = allTaskIds[prevIndex + 1] || allTaskIds[prevIndex - 1] || '';
            setSelectedId(nextId);
            setIsOpenToDoDetails(nextId !== '');
        }
    }, [openAndOverdueTasks, selectedId]);

    const getCustomActionsForFlyout = () => (
        <Flex justify="space-between" align="center" className={styles['custom-action-container']}>
            <span className={styles['header']}>To-Do</span>
            <Flex justify="flex-end" gap="16px">
                <Tooltip title="Open in full view" placement="bottom">
                    <div
                        className={styles['button']}
                        onMouseDown={e => {
                            e.stopPropagation();
                            setIsOpen(false);
                            navigate('/todo');
                            setIsOpen(false);
                        }}
                    >
                        {ExternalLinkIcon()}
                    </div>
                </Tooltip>

                <SideMenu
                    action={
                        <div className={styles.filterCircle}>
                            {hasSelections() ? (
                                <Icon name="filter-funnel-02-filled" size="xl" />
                            ) : (
                                <FilterIcon />
                            )}
                        </div>
                    }
                    options={[
                        { label: 'Due Date', value: 'duedate', elRef: dueDateRef },
                        { label: 'Priority', value: 'priority', elRef: priorityRef },
                        { label: 'Tool', value: 'tool', elRef: toolRef },
                    ]}
                    onOptionSelect={value => {
                        setOpenDropdown(value.value);
                        setMenuOpen(true);
                        setSideMenuAutoClose(false); // ✅ keep menu open while interacting
                    }}
                    diableClickOutside={true}
                    autoClose={sideMenuAutoClose}
                    getMenuRef={setMenuRefs}
                    open={menuOpen}
                    onOpenChange={val => {
                        setMenuOpen(val);
                        if (!val) setOpenDropdown(null);
                        if (val) setSideMenuAutoClose(false); // ✅ when menu opens, disable auto-close
                    }}
                    menuTitle="Filter by"
                    enhancedMenu={true}
                    selectedOption={openDropdown}
                />

                <DropDown
                    confirmSelection={{
                        apply: {
                            onClick: handleDueDateApply, // Use the updated handler
                        },
                        cancel: {
                            onClick: () => {
                                setOpenDropdown(null);
                            },
                        },
                    }}
                    dropdown={{
                        isDisabled: filterLoading,
                        isMultiSelect: true,
                        label: 'Due Date',
                        onChange: () => {},
                        options: dueDateOptions,
                        placeholder: 'Select Due Date',
                        selectedOptions: selectedDueDates,
                        showSelectAll: true,
                        dropdownVisibilityHidden: true,
                        size: 'S',
                        type: 'checkbox',
                        isOpen: openDropdown === 'duedate',
                        handleClickOutsideEvent: () => setOpenDropdown(null),
                        portal: true,
                        showSelectedOptionsCountLabel: true,
                    }}
                    width="22.5rem"
                    menuRef={dueDateRef}
                    enableDateToggle={enableDateToggle}
                    showCalendarToggleSwitch // ✅ Enables calendar toggle
                    calendarProps={{
                        currentDate: startObj, // or your persisted currentDate
                        dateRangeStart: startObj, // <-- Date | null
                        dateRangeEnd: endObj, // <-- Date | null
                    }}
                    searchInput={{
                        searchPlaceholder: 'Search',
                        searchSize: 'L',
                    }}
                />

                <DropDown
                    confirmSelection={{
                        apply: {
                            onClick: handlePriorityApply, // Use the updated handler
                        },
                        cancel: {
                            onClick: () => {
                                setOpenDropdown(null);
                            },
                        },
                    }}
                    dropdown={{
                        isDisabled: filterLoading,
                        isMultiSelect: true,
                        label: 'Priority',
                        onChange: () => {},
                        options: priorityOptions,
                        placeholder: 'Select Priority',
                        selectedOptions: selectedPriorities,
                        showSelectAll: true,
                        size: 'S',
                        type: 'checkbox',
                        isOpen: openDropdown === 'priority',
                        dropdownVisibilityHidden: true,
                        handleClickOutsideEvent: () => setOpenDropdown(null),
                        portal: true,
                        showSelectedOptionsCountLabel: true,
                    }}
                    width="22.5rem"
                    menuRef={priorityRef}
                    searchInput={{
                        searchPlaceholder: 'Search',
                        searchSize: 'L',
                    }}
                />

                <DropDown
                    confirmSelection={{
                        apply: {
                            onClick: handleToolApply, // Use the updated handler
                        },
                        cancel: {
                            onClick: () => {
                                setOpenDropdown(null);
                            },
                        },
                    }}
                    dropdown={{
                        isDisabled: filterLoading,
                        isMultiSelect: true,
                        label: 'Tool',
                        dropdownVisibilityHidden: true,
                        onChange: () => {},
                        options: toolOptions,
                        placeholder: 'Select Tool',
                        selectedOptions: selectedTools,
                        showSelectAll: true,
                        size: 'S',
                        type: 'checkbox',
                        isOpen: openDropdown === 'tool',
                        handleClickOutsideEvent: () => setOpenDropdown(null),
                        portal: true,
                        showSelectedOptionsCountLabel: true,
                    }}
                    width="22.5rem"
                    menuRef={toolRef}
                    searchInput={{
                        searchPlaceholder: 'Search',
                        searchSize: 'L',
                    }}
                />
                <Tooltip title="Collapse flyout" placement="bottom">
                    <div className={styles['button']} onClick={() => setIsOpen(false)}>
                        {LeftArrowIcon()}
                    </div>
                </Tooltip>
            </Flex>
        </Flex>
    );

    return (
        <Flyout
            content={
                <div className={styles['content-container']}>
                    {detailsLoading ? (
                        <Flex className={styles['initial-loader-container']} align="center">
                            <AnimatedLoaders id="initial-loader" type="page" />
                        </Flex>
                    ) : error ? (
                        <div className={styles['empty-state-container']}>
                            <span className={styles['empty-text']}>Error</span>
                            <span>{error}</span>
                        </div>
                    ) : userRole.role.toLowerCase() === 'guest user' ? (
                        <Flex className={styles['todo-card-children']} vertical gap={10}>
                            <MyToDoEmptyState />
                            <Label type="body3">
                                <span className={styles['card-children-content-header']}>
                                    {'No Tasks Assigned'}
                                </span>
                            </Label>
                            <Label type="body3">
                                <span className={styles['card-children-content-text']}>
                                    Go to{' '}
                                    <Link
                                        to="/user-profile-settings"
                                        className={styles['card-children-content-text-anchor']}
                                    >
                                        User Role Settings
                                    </Link>
                                    {''}, Add primary & secondary roles, to start viewing your
                                    to-do's-testing page 
                                </span>
                            </Label>
                        </Flex>
                    ) : myTaskCount === 0 ? (
                        <Flex className={styles['todo-card-children']} vertical gap={10}>
                            <MyToDoEmptyState />
                            <Label type="body3">
                                <span className={styles['card-children-content-header']}>
                                    {'No Tasks Assigned'}
                                </span>
                            </Label>
                            <Label type="body3">
                                <span className={styles['card-children-content-text']}>
                                    {`No task found. Looks like you're all caught up!`}
                                </span>
                            </Label>
                        </Flex>
                    ) : (
                        <div>
                            <ToDoHeader count={myTaskCount} />
                            <div
                                style={{
                                    flex: '1 1 0%',
                                    height: '74vh',
                                    overflow: 'scroll',
                                    padding: '1rem',
                                }}
                            >
                                <GroupedToDoCards
                                    groupedTasks={groupedTasks}
                                    selectedId={selectedId}
                                    onSelect={task => {
                                        setLockToExternal(false);
                                        const clickedId = String(task.id);
                                        if (clickedId === selectedId) {
                                            setIsOpenToDoDetails(false);
                                            setSelectedId('');
                                        } else {
                                            setSelectedId(clickedId);
                                            setIsOpenToDoDetails(true);
                                        }
                                    }}
                                    onFilterChange={onFilterChange}
                                    highlightId={externalSelectedId}
                                />
                            </div>
                            {selectedTask && (
                                <FlyoutTaskDetails
                                    tasks={openAndOverdueTasks}
                                    selectedId={selectedId}
                                    key="ToDo's"
                                    isOpen={isOpenToDoDetails}
                                    onClose={() => {
                                        setIsManuallyClosed(true);
                                        setIsOpenToDoDetails(false);
                                    }}
                                    setIsOpen={setIsOpenToDoDetails}
                                    closeParentFlyout={() => {
                                        setIsOpen(false);
                                        setSelectedId('');
                                    }}
                                    setKebabBusyFromParent={setIsKebabBusy}
                                    onRefresh={() => {}}
                                />
                            )}
                        </div>
                    )}
                </div>
            }
            dataTestId="todo-fly-out"
            flyoutOpen={isOpen}
            direction="left"
            cancelIconClick={() => setIsOpen(false)}
            heading=""
            className={styles['flyout-container-main']}
            flyoutBgColor={'#F4F6F7'}
            customActions={getCustomActionsForFlyout()}
            id="todo-fly-out"
            // onBackDropClick={() => {
            //     if (!isKebabBusy) {
            //         setIsOpen(false);
            //     }
            // }}
        />
    );
};

export default TestingFlyout;
