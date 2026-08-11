import { Link, useSearchParams } from 'react-router-dom';
import { MyToDoEmptyState } from '../../../assets/images/images';
import { Card, Label } from '../../atoms';
import styles from './ToDos.module.scss';
import { useDispatch, useSelector } from 'react-redux';
import { AppDispatch, fetchToDos, RootState } from '../../../store';
import { Flex } from 'antd';
import { useEffect, useState, useCallback } from 'react';
import ToDoList from './ToDoList';
import ToDoFilters from './ToDoFilter';
import { completedType, dueType, overdueType } from '../../../utils/constants';
import { AnimatedLoaders, FilterChip } from 'konnect-react-components';
import { resetSelectedAFToDo } from '../../../store/slice/selectedAFToDoSlice';

import {
    setSelectedTools,
    setSelectedPriorities,
    setSelectedDueDates,
    setCalendarRange,
    setEnableDateToggle,
} from '../../../store/slice/toDoFilterSelectionSlice';
import { logError } from '../../../utils/helpers';

export function ToDoFirstTimeLogin() {
    return (
        <Flex className={styles['todo-card-children']} vertical gap={24}>
            <MyToDoEmptyState />
            <Label type="body3">
                <span className={styles['card-children-content-text']}>
                    Go to{' '}
                    <Link
                        to="/user-profile-settings"
                        className={styles['card-children-content-text-anchor']}
                    >
                        User Role Settings
                    </Link>
                    {''}, Add primary & secondary roles, to start viewing your to-do's
                </span>
            </Label>
        </Flex>
    );
}

export function NoTasksAssigned() {
    return (
        <Flex className={styles['todo-card-children']} vertical gap={24}>
            <MyToDoEmptyState />
            <Label type="body3">
                <span className={styles['card-children-content-text']}>
                    {`You don't have any pending tasks`}
                </span>
            </Label>
        </Flex>
    );
}

function ToDos({ cardHeight = '94vh' }: Readonly<{ cardHeight?: string }>) {
    const userRole = useSelector((state: RootState) => state.primaryRole.data);
    const dispatch = useDispatch<AppDispatch>();

    const { data: todoDetails } = useSelector((state: RootState) => state.todoDetails);

    const todofilter = useSelector((state: RootState) => state.toDoFilterSelection);
    const { selectedTools, selectedPriorities, selectedDueDates, calendarRange } = todofilter;

    const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
    const [isLoading, setIsLoading] = useState<boolean>(false);

    const [, setAFTab] = useState<'Past' | 'Future' | null>(null);

    const toggleSortOrder = () => {
        setSortOrder(prevOrder => (prevOrder === 'asc' ? 'desc' : 'asc'));
    };

    useEffect(() => {
        const hasRange = Boolean(calendarRange.startDate || calendarRange.endDate);
        dispatch(setEnableDateToggle(hasRange));
    });

    useEffect(() => {
        if (selectedDueDates.length > 0) {
            dispatch(setEnableDateToggle(false));
        }
    });

    const formatDate = (date: string | null) => {
        if (!date) return '';
        const d = new Date(date);
        return d.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });
    };

    const hasRangeBound = Boolean(calendarRange?.startDate || calendarRange?.endDate);

    const dueDateChipLabel = hasRangeBound
        ? calendarRange?.startDate && calendarRange?.endDate
            ? `${formatDate(calendarRange.startDate)} - ${formatDate(calendarRange.endDate)}`
            : calendarRange?.startDate
              ? `From ${formatDate(calendarRange.startDate)}`
              : `Until ${formatDate(calendarRange.endDate)}`
        : selectedDueDates.map(d => d.label).join(', ');

    const fetchData = useCallback(async () => {
        try {
            const formatDate = (date: string | null): string | null => {
                if (!date) return null;
                const d = new Date(date);
                if (isNaN(d.getTime())) return null;
                return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
            };

            const payload = {
                toolName:
                    selectedTools.length > 0
                        ? selectedTools.map(t => t.label.split(' - ')[0]).join(', ')
                        : null,
                priorityName:
                    selectedPriorities.length > 0
                        ? selectedPriorities.map(p => p.label).join(', ')
                        : null,
                dueDate:
                    selectedDueDates.length > 0
                        ? selectedDueDates
                              .map(d => {
                                  const formatted = formatDate(d.value);
                                  return formatted && formatted.trim() !== '' ? formatted : null;
                              })
                              .filter(Boolean)
                              .join(', ')
                        : null,
                startDueDate: formatDate(calendarRange.startDate),
                endDueDate: formatDate(calendarRange.endDate),
                selectedId: null,
                AFTab:
                    selectedTools.length > 0
                        ? selectedTools
                              .filter(t => t.value.includes('Advance Forecasting'))
                              .map(t => (t.value.includes('Past') ? 'Past' : 'Future'))
                              .join(', ')
                        : null,
            };

            setIsLoading(true);
            await dispatch(fetchToDos(payload));
        } catch(error) {
            logError(error);
        } finally {
            setIsLoading(false);
        }
    }, [dispatch, selectedTools, selectedPriorities, selectedDueDates, calendarRange]);

    useEffect(() => {
        fetchData();
    }, [fetchData]);

    useEffect(() => {
        // Clearing the AF -todo redux value when the flyout opens
        dispatch(resetSelectedAFToDo());
    }, [dispatch]);

    const [filter, setFilter] = useState<'Open' | 'Overdue' | 'Completed'>('Open');
    let count = 0;
    const filteredTasks = todoDetails.filter(task => {
        if (task.isIncorrectAssignment) return false;
        if (filter === 'Completed') return task.completedOn !== null;
        if (filter === 'Open') {
            count = todoDetails.filter(
                task =>
                    (task.status.toLowerCase() === dueType.toLowerCase() ||
                        task.status.toLowerCase() === overdueType.toLowerCase()) &&
                    task.completedOn == null &&
                    !task.isIncorrectAssignment,
            ).length;
            return (
                (task.status === dueType || task.status === overdueType) && task.completedOn == null
            );
        } else if (filter === overdueType) {
            count = todoDetails.filter(
                task =>
                    task.status.toLowerCase() === overdueType.toLowerCase() &&
                    task.completedOn == null &&
                    !task.isIncorrectAssignment,
            ).length;
            return task.status === overdueType && task.completedOn == null;
        }
        return (task.status === dueType || task.status === overdueType) && task.completedOn == null;
    });

    const showCount = filter !== completedType;

    const getMessage = () => {
        switch (filter) {
            case 'Open':
                return "You don't have any Open tasks";
            case 'Overdue':
                return "You don't have any Overdue tasks";
            case 'Completed':
                return "You don't have any Completed tasks";
            default:
                return "You don't have any pending tasks";
        }
    };

    const [searchParams] = useSearchParams();
    const selectedIdFromUrl = searchParams.get('selectedId') ?? '';
    useEffect(() => {
        //Clearing the AF -todo redux value when the flyout opens
        dispatch(resetSelectedAFToDo());
    }, []);

    return (
        <>
            {isLoading ? (
                <Card title={'TO-DO’s'} style={{ height: cardHeight }}>
                    <Flex className={styles['initial-loader-container']}>
                        <AnimatedLoaders id="initial-loader" type="page" />
                    </Flex>
                </Card>
            ) : userRole.role.toLowerCase() === 'guest user' ? (
                <Card title={'TO-DO’s'} label={'No Task Assigned'} style={{ height: cardHeight }}>
                    <Flex>
                        <MyToDoEmptyState />
                    </Flex>
                </Card>
            ) : (
                <Card
                    title={'To-Do'}
                    label={"View all your to-do's. Click on a to-do to take action on it."}
                    style={{ height: cardHeight, backgroundColor: 'white' }}
                    extra={
                        <div className={styles['card-head-wrapper']}>
                            <ToDoFilters
                                filter={filter}
                                onFilterChange={setFilter}
                                toggleSortOrder={toggleSortOrder}
                            />
                        </div>
                    }
                >
                    {/* ✅ Second Row: Filter Chips */}
                    {/* ✅ Second Row: Filter Chips */}

                    {(selectedTools.length > 0 ||
                        selectedPriorities.length > 0 ||
                        selectedDueDates.length > 0) && (
                        <div
                            className={`${styles['filter-chip-container']} ${styles['has-filters']}`}
                        >
                            {/* Left side: Applied Filters */}
                            <div className={styles['filter-chip-left']}>
                                {(selectedTools.length > 0 ||
                                    selectedPriorities.length > 0 ||
                                    selectedDueDates.length > 0) && (
                                    <span className={styles['filter-label']}> Applied Filter:</span>
                                )}

                                {/* Individual Chips */}

                                {(hasRangeBound || selectedDueDates.length > 0) && (
                                    <FilterChip
                                        key="due-date-chip"
                                        label={dueDateChipLabel}
                                        title="Due Dates:"
                                        tooltipText={dueDateChipLabel}
                                        onClose={() => {
                                            dispatch(setSelectedDueDates([]));
                                            dispatch(
                                                setCalendarRange({
                                                    startDate: null,
                                                    endDate: null,
                                                }),
                                            );
                                            dispatch(setEnableDateToggle(false));
                                        }}
                                    />
                                )}

                                {selectedPriorities.length > 0 && (
                                    <FilterChip
                                        key="priority-chip"
                                        //counter={selectedPriorities.length}
                                        label={selectedPriorities.map(p => p.label).join(', ')}
                                        title="Priorities:"
                                        tooltipText={selectedPriorities
                                            .map(p => p.label)
                                            .join(', ')}
                                        onClose={() => {
                                            dispatch(setSelectedPriorities([]));
                                            fetchData();
                                        }}
                                    />
                                )}
                                {selectedTools.length > 0 && (
                                    <FilterChip
                                        key="tool-chip"
                                        //counter={selectedTools.length}
                                        label={selectedTools.map(t => t.label).join(', ')}
                                        title="Tools:"
                                        tooltipText={selectedTools.map(t => t.label).join(', ')}
                                        onClose={() => {
                                            dispatch(setSelectedTools([]));
                                            setAFTab(null);
                                            fetchData();
                                        }}
                                    />
                                )}
                            </div>

                            {/* ✅ Right side: Clear All Button */}
                            {(selectedTools.length > 0 ||
                                selectedPriorities.length > 0 ||
                                selectedDueDates.length > 0) && (
                                <button
                                    className={styles['clear-all-btn']}
                                    onClick={() => {
                                        dispatch(setSelectedTools([]));
                                        dispatch(setSelectedPriorities([]));
                                        setSelectedDueDates([]);
                                        dispatch(setSelectedDueDates([]));
                                        dispatch(
                                            setCalendarRange({ startDate: null, endDate: null }),
                                        );
                                        fetchData();
                                        dispatch(setEnableDateToggle(false));
                                    }}
                                >
                                    Clear All
                                </button>
                            )}
                        </div>
                    )}
                    {/* ✅ Third Row: Task List */}
                    <div>
                        <ToDoList
                            tasks={filteredTasks}
                            helpDisplay="flex"
                            message={getMessage()}
                            onFilterChange={setFilter}
                            count={showCount ? count : undefined}
                            sortOrder={sortOrder}
                            selectedIdFromUrl={selectedIdFromUrl}
                        />
                    </div>
                </Card>
            )}
        </>
    );
}

export default ToDos;
