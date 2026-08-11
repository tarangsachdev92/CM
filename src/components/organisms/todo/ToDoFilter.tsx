import { DropDown, IconButton, SideMenu, Icon } from 'konnect-react-components';
import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { FilterIcon } from '../../../assets/icons/icons';
import { AppDispatch, RootState } from '../../../store';
import { fetchToDoFilters } from '../../../store/thunks/fetchToDoFilters';
import styles from './ToDoFilter.module.scss';
import ToDoSettingsDialog from './ToDoSettingsDialog';
import { useNavigate, useSearchParams } from 'react-router-dom';
import {
    setSelectedTools,
    setSelectedPriorities,
    setSelectedDueDates,
    setCalendarRange,
    setEnableDateToggle,
} from '../../../store/slice/toDoFilterSelectionSlice';

export interface Option {
    category: string;
    label: string;
    value: string;
}

export interface Option {
    category: string; // 'Tool' | 'Priority' | 'DueDate' | etc.
    label: string;
    value: string;
}

interface Props {
    filter: string;
    onFilterChange: (value: 'Open' | 'Overdue' | 'Completed') => void;
    toggleSortOrder: () => void;
}

const ToDoFilters: React.FC<Props> = ({ filter, onFilterChange, toggleSortOrder }) => {
    const dispatch = useDispatch<AppDispatch>();

    const todofilter = useSelector((state: RootState) => state.toDoFilterSelection);
    const {
        selectedTools,
        selectedPriorities,
        selectedDueDates,
        calendarRange,
        enableDateToggle,
        rangeStartDate, // string | null (YYYY-MM-DD)
        rangeEndDate, // string | null (YYYY-MM-DD)
    } = todofilter;

    const rangeStartDateObj = rangeStartDate ? new Date(rangeStartDate) : null;
    const rangeEndDateObj = rangeEndDate ? new Date(rangeEndDate) : null;
    const [searchParams, setSearchParams] = useSearchParams();
    const navigate = useNavigate();
    const clearSelectedIdFromUrl = useCallback(() => {
        if (searchParams.has('selectedId')) {
            navigate('/todo', { replace: true });
        }
    }, [searchParams, setSearchParams]);

    useEffect(() => {
        dispatch(fetchToDoFilters());
    }, [dispatch]);

    const { toolNames, priorityNames, dueDates, loading } = useSelector(
        (state: RootState) => state.todoFilter,
    );

    // ✅ Helper to format dates
    const formatDate = (date: string | null) => {
        if (!date) return '';
        const d = new Date(date);
        return d.toLocaleDateString('en-GB', {
            day: '2-digit',
            month: 'short',
            year: 'numeric',
        });
    };

    // ✅ Memoized options
    const toolOptions = useMemo<Option[]>(
        () =>
            toolNames.flatMap((t: { toolName: string }) => {
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

    // ✅ Memoized options
    const priorityOptions = useMemo<Option[]>(() => {
        const sortedPriorities = ['Critical', 'High', 'Medium', 'Low'];
        return sortedPriorities
            .map(priority => {
                const found = priorityNames.find(p => p.priorityName === priority);
                // Ensure we only return an object that matches the Option type
                return found
                    ? {
                          category: 'Priority',
                          label: found.priorityName,
                          value: found.priorityName,
                      }
                    : undefined; // Return undefined instead of null
            })
            .filter((option): option is Option => option !== undefined); // Type guard to filter out undefined
    }, [priorityNames]);

    const dueDateOptions = useMemo<Option[]>(() => {
        let filteredDueDates;
        if (filter === 'Completed') {
            // Show only status Completed
            filteredDueDates = dueDates.filter(d => d.status === 'Completed');
        } else if (filter === 'Overdue') {
            // Show only status Overdue
            filteredDueDates = dueDates.filter(d => d.status === 'Overdue');
        } else if (filter === 'Open') {
            // Show status Overdue and Due
            filteredDueDates = dueDates.filter(d => d.status === 'Overdue' || d.status === 'Due');
        } else {
            // Default: show all
            filteredDueDates = dueDates.filter(d => d.status === 'Overdue' || d.status === 'Due');
        }
        return filteredDueDates
            .filter(d => d.dueDate && d.dueDate.trim() !== '')
            .map(d => ({
                category: 'DueDate',
                label: formatDate(d.dueDate),
                value: d.dueDate,
            }));
    }, [dueDates, filter]);

    const taskOptions: Option[] = [
        { category: 'OT', label: 'Open Tasks', value: 'Open' },
        { category: 'ODT', label: 'Overdue Tasks', value: 'Overdue' },
        { category: 'RC', label: 'Recently completed', value: 'Completed' },
    ];
    const selectedOption = taskOptions.find(opt => opt.value === filter) || null;

    // ✅ Dropdown refs
    const dueDateRef = useRef<HTMLDivElement>(null);
    const priorityRef = useRef<HTMLDivElement>(null);
    const toolRef = useRef<HTMLDivElement>(null);
    const [menuRefs, setMenuRefs] = useState<HTMLDivElement | null>(null);
    const [openDropdown, setOpenDropdown] = useState<string | null>(null);
    const [dropdownEl, setDropdownEl] = useState<HTMLDivElement | null>(null);
    const [dropdownEl2, setDropdownEl2] = useState<HTMLDivElement | null>(null);
    const [dropdownElTool, setDropdownElTool] = useState<HTMLDivElement | null>(null);
    const [menuOpen, setMenuOpen] = useState(false);
    const [flyoutOpen, setFlyoutOpen] = useState(false);

    const handleClickOutside = useCallback(
        (event: MouseEvent) => {
            const target = event.target as Node;
            if (
                dropdownEl &&
                !dropdownEl.contains(target) &&
                dropdownEl2 &&
                !dropdownEl2.contains(target) &&
                dropdownElTool &&
                !dropdownElTool.contains(target) &&
                menuRefs &&
                !menuRefs.contains(target)
            ) {
                setOpenDropdown(null);
                setMenuOpen(false);
            }
        },
        [dropdownEl, dropdownEl2, dropdownElTool, menuRefs],
    );

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

    useEffect(() => {
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, [handleClickOutside]);

    return (
        <div className={styles.filterContainer}>
            {/* ✅ Task Filter */}
            <DropDown
                dropdown={{
                    isDisabled: false,
                    isLabelInline: false,
                    label: '',
                    onChange: obj => {
                        // strip selectedId on any task filter change
                        clearSelectedIdFromUrl();
                        if (obj?.value) {
                            onFilterChange(obj.value as 'Open' | 'Overdue' | 'Completed');
                        }
                    },
                    options: taskOptions,
                    placeholder: 'Select',
                    selectedOptions: selectedOption ? [selectedOption] : [],
                    showRadio: false,
                    dropdownVisibilityHidden: true,
                    size: 'M',
                    type: 'radio',
                }}
                searchInput={{
                    searchPlaceholder: 'Search',
                    searchSize: 'L',
                    searchWholeString: true,
                }}
            />

            {/* ✅ Sort Button */}
            <IconButton
                icon="chevron-selector-vertical"
                onClick={() => {
                    // strip selectedId on any sort toggle
                    clearSelectedIdFromUrl();
                    toggleSortOrder();
                }}
                size="Medium"
                aria-label="Toggle sort order"
            />

            {/* ✅ SideMenu */}
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
                    { label: 'Due Date', value: 'dueDate', elRef: dueDateRef },
                    { label: 'Priority', value: 'priority', elRef: priorityRef },
                    { label: 'Tool', value: 'tool', elRef: toolRef },
                ]}
                onOptionSelect={value => setOpenDropdown(value.value)}
                diableClickOutside={true}
                autoClose={false}
                enableNewPositioning={true}
                style={{ width: '2rem' }}
                getMenuRef={setMenuRefs}
                filter-funnel-02-filled={false}
                open={menuOpen}
                onOpenChange={val => {
                    setMenuOpen(val);
                    setOpenDropdown(null);
                }}
                menuTitle="Filter by"
                enhancedMenu={true}
                selectedOption={openDropdown}
            />

            {/* ✅ Settings Flyout */}
            <IconButton
                icon="settings-01"
                size="Medium"
                aria-label="Open settings"
                onClick={() => setFlyoutOpen(true)}
            />
            <ToDoSettingsDialog isOpen={flyoutOpen} onClose={() => setFlyoutOpen(false)} />

            {/* ✅ Due Date Dropdown */}
            <DropDown
                confirmSelection={{
                    apply: {
                        onClick: (options: any) => {
                            clearSelectedIdFromUrl();
                            if (options && !Array.isArray(options)) {
                                // ✅ Calendar range selected
                                const start: string | null = options.startDate ?? null;
                                const end: string | null = options.endDate ?? null;

                                // Clear discrete dates when a range is chosen
                                dispatch(setSelectedDueDates([]));

                                // Set the range and toggle UI accordingly
                                dispatch(setCalendarRange({ startDate: start, endDate: end }));
                                dispatch(setEnableDateToggle(Boolean(start || end)));
                            } else {
                                // ✅ Multi-select discrete dates
                                const picked: Option[] = Array.isArray(options) ? options : [];

                                const formattedOptions: Option[] = picked.map((opt: Option) => ({
                                    ...opt,
                                    // Keep raw value canonical, format label for display
                                    label: formatDate(opt.value),
                                }));

                                // Update discrete due date selections
                                dispatch(setSelectedDueDates(formattedOptions));

                                // Clear range when discrete dates are chosen
                                dispatch(setCalendarRange({ startDate: null, endDate: null }));
                                dispatch(setEnableDateToggle(false));
                            }

                            setOpenDropdown(null);
                        },
                    },
                    cancel: { onClick: () => setOpenDropdown(null) },
                }}
                dropdown={{
                    isDisabled: loading,
                    isMultiSelect: true,
                    showSelectedOptionsCountLabel: true,
                    label: 'Due Date',
                    onChange: () => {},
                    options: dueDateOptions,
                    placeholder: loading ? 'Loading...' : 'Select',
                    selectedOptions: selectedDueDates,
                    showSelectAll: true,
                    size: 'S',
                    type: 'checkbox',
                    isOpen: openDropdown === 'dueDate',
                    dropdownVisibilityHidden: true,
                    handleClickOutsideEvent: () => setOpenDropdown(null),
                    portal: true,
                }}
                enableDateToggle={enableDateToggle}
                showCalendarToggleSwitch
                width="22.5rem"
                menuRef={dueDateRef}
                getDropdownRef={setDropdownEl}
                searchInput={{
                    searchPlaceholder: 'Search',
                    searchSize: 'L',
                    searchWholeString: true,
                }}
                calendarProps={{
                    currentDate: rangeStartDateObj,
                    dateRangeStart: rangeStartDateObj, // fallback only for display
                    dateRangeEnd: rangeEndDateObj,
                }}
            />

            {/* ✅ Priority Dropdown */}
            <DropDown
                confirmSelection={{
                    apply: {
                        onClick: (options: Option[] | null) => {
                            clearSelectedIdFromUrl();
                            const picked = Array.isArray(options) ? options : [];
                            dispatch(setSelectedPriorities(picked));
                            setOpenDropdown(null);
                        },
                    },
                    cancel: { onClick: () => setOpenDropdown(null) },
                }}
                dropdown={{
                    isDisabled: loading,
                    isMultiSelect: true,
                    showSelectedOptionsCountLabel: true,
                    label: 'Priority',
                    onChange: () => {},
                    options: priorityOptions,
                    placeholder: loading ? 'Loading...' : 'Select',
                    selectedOptions: selectedPriorities,
                    showSelectAll: true,
                    size: 'S',
                    type: 'checkbox',
                    dropdownVisibilityHidden: true,
                    isOpen: openDropdown === 'priority',
                    handleClickOutsideEvent: () => setOpenDropdown(null),
                    portal: true,
                }}
                searchInput={{ searchPlaceholder: 'Search', searchSize: 'L' }}
                width="22.5rem"
                menuRef={priorityRef}
                getDropdownRef={setDropdownEl2}
            />

            {/* ✅ Tool Dropdown */}
            <DropDown
                confirmSelection={{
                    apply: {
                        onClick: (options: Option[]) => {
                            const picked = Array.isArray(options) ? options : [];
                            dispatch(setSelectedTools(picked));
                            clearSelectedIdFromUrl();
                            setSelectedTools(options);

                            setOpenDropdown(null);
                        },
                    },
                    cancel: { onClick: () => setOpenDropdown(null) },
                }}
                dropdown={{
                    isDisabled: loading,
                    isMultiSelect: true,
                    showSelectedOptionsCountLabel: true,
                    label: 'Tool',
                    onChange: () => {},
                    options: toolOptions,
                    placeholder: loading ? 'Loading...' : 'Select',
                    selectedOptions: selectedTools,
                    showSelectAll: true,
                    size: 'S',
                    type: 'checkbox',
                    dropdownVisibilityHidden: true,
                    isOpen: openDropdown === 'tool',
                    handleClickOutsideEvent: () => setOpenDropdown(null),
                    portal: true,
                }}
                searchInput={{ searchPlaceholder: 'Search', searchSize: 'L' }}
                width="22.5rem"
                menuRef={toolRef}
                getDropdownRef={setDropdownElTool}
            />
        </div>
    );
};

export default ToDoFilters;
