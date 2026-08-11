// IgnoredContentPane.tsx
import React, { useEffect, useMemo, useState } from 'react';
import {
    Dialog,
    Icon,
    AnimatedLoaders,
    Toast,
    ToolTip,
    FilterChip,
} from 'konnect-react-components';
import { Flex } from 'antd';
import { useDispatch, useSelector } from 'react-redux';
import { CountryCode } from '../../../utils/constants';
import ignoredStyles from './IgnoredContentPane.module.scss';

import { AppDispatch, fetchToDoFilters, fetchToDos, RootState } from '../../../store';
import { fetchIgnoredTodos } from '../../../store/thunks/fetchIgnoredTodos';
import { manageToDoDetails } from '../../../services/todo';

import {
    CriticalPriorityIcon,
    HighPriorityIcon,
    MediumPriorityIcon,
    LowPriorityIcon,
    Reccuringicon,
} from '../../../assets/images/images';
import { IgnoredTodo } from '../../../store/slice/ignoredTodosSlice';
import { logError } from '../../../utils/helpers';

interface Todo {
    id: number;
    title: string | null;
    subtitle: string | null;
    source: string | null;
    issueSectionName: string | null;
    dueDate: string | null;
    priority: string | null;
    ignoreTill: string | null;
    ignorenumber: string | null;
    isreccuring?: boolean;
    attributes?: any[];
    moduleName: string | null;    
}

/** Utilities (copied from your flyout version) */
const getSubtitleStatus = (subtitle: string | null | undefined): 'PAST' | 'FUTURE' | undefined => {
    if (!subtitle) return undefined;
    const hasPast = /\bPAST\b/i.test(subtitle);
    const hasFuture = /\bFUTURE\b/i.test(subtitle);
    if (hasPast) return 'PAST';
    if (hasFuture) return 'FUTURE';
    return undefined;
};
const buildFilterChips = (task: { attributes?: any[] }) => {
    const chips: { label: string }[] = [];
    const attrs = Array.isArray(task?.attributes) ? (task.attributes as any[]) : [];

    const countryAttr = attrs.find(a => typeof a === 'object' && a && 'countryCode' in a);
    const countryCode: string | undefined = countryAttr?.countryCode;

    if (countryCode === CountryCode.CL) {
        const carrier =
            attrs.find(
                a =>
                    typeof a === 'object' &&
                    a &&
                    ('rootId' in a ||
                        'rootIdDescription' in a ||
                        'customerId' in a ||
                        'customerIdDescription' in a),
            ) || countryAttr;

        const rootId = carrier?.rootId as string | undefined;
        const rootIdDescription = carrier?.rootIdDescription as string | undefined;
        const customerId = carrier?.customerId as string | undefined;
        const customerIdDescription = carrier?.customerIdDescription as string | undefined;

        if (rootId && rootIdDescription) {
            const combo = `${rootId} - ${rootIdDescription}`;
            chips.push({ label: combo });
        }
        if (customerId && customerIdDescription) {
            chips.push({ label: `${customerId} - ${customerIdDescription}` });
        }
        if (countryCode) {
            chips.push({ label: `${countryCode}` });
        }

        if (chips.length === 0) {
            attrs.forEach(a => {
                if (a?.displayName) chips.push({ label: a.displayName });
            });
        }
        return chips;
    }

    if (countryCode === CountryCode.BR) {
        const carrier =
            attrs.find(a => typeof a === 'object' && a && ('gmcGrouping' in a || 'channel' in a)) ||
            countryAttr;

        const gmcGrouping = carrier?.gmcGrouping as string | undefined;
        const channel = carrier?.channel as string | undefined;

        if (gmcGrouping) chips.push({ label: gmcGrouping });
        if (channel) chips.push({ label: channel });

        if (countryCode) {
            chips.push({ label: `${countryCode}` });
        }
        if (chips.length === 0) {
            attrs.forEach(a => {
                if (a?.displayName) chips.push({ label: a.displayName });
            });
        }
        return chips;
    }

    attrs.forEach(a => {
        if (a?.displayName) chips.push({ label: a.displayName });
    });

    return chips;
};

const formatDate = (dateString: string | null): string => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleDateString('en-GB', {
        day: '2-digit',
        month: 'short',
        year: 'numeric',
    });
};

const renderPriorityIcon = (priority: string | null) => {
    switch (priority) {
        case 'Critical':
            return (
                <span className={ignoredStyles.priorityIcon}>
                    <CriticalPriorityIcon />
                </span>
            );
        case 'High':
            return (
                <span className={ignoredStyles.priorityIcon}>
                    <HighPriorityIcon />
                </span>
            );
        case 'Medium':
            return (
                <span className={ignoredStyles.priorityIcon}>
                    <MediumPriorityIcon />
                </span>
            );
        case 'Low':
            return (
                <span className={ignoredStyles.priorityIcon}>
                    <LowPriorityIcon />
                </span>
            );
        default:
            return null;
    }
};

const getFilterChipsForTodo = (task: Todo | null) => {
    if (!task || !Array.isArray(task.attributes)) return [];
    if (task.attributes.length === 0) return [];

    // Use your existing logic for building chips
    return buildFilterChips(task);
};
/** Inline Ignore dialog with same look & behavior */
const IgnoreDialog: React.FC<{
    showIgnoreDialog: boolean;
    onClose: () => void;
    onIgnore: (ignorePeriod: string) => void;
    task: Todo | null;
}> = ({ showIgnoreDialog, onClose, onIgnore, task }) => {
    const [ignorePeriod, setIgnorePeriod] = useState<string>('Select');

    if (!task) return null;

    const nextTodoDate = (() => {
        if (ignorePeriod === 'Select') return null;
        const monthsToAdd = parseInt(ignorePeriod.split(' ')[0] || '1', 10);
        const currentDate = new Date();
        currentDate.setMonth(currentDate.getMonth() + monthsToAdd);
        return currentDate.toLocaleDateString('en-GB', {
            day: '2-digit',
            month: 'short',
            year: 'numeric',
        });
    })();

    /** Truncate helper */
    const truncate = (text: string, max: number) => {
        if (text.length <= max) return text;
        return text.slice(0, max - 1) + '…';
    };

    /**
     * Conditionally render text with ToolTip
     * - If text length > max, show ToolTip with full text and truncated display
     * - Otherwise just show plain text
     * You can pass a custom wrapper (span by default) for styling.
     */
    const renderWithTooltip = (
        text: string | null | undefined,
        max: number,
        className?: string,
    ) => {
        const safe = (text ?? '').trim();
        if (!safe) return <span className={className} />;

        if (safe.length > max) {
            // Use a span wrapper to preserve your existing styling/DOM
            const wrapper = (
                <span className={className} title={safe}>
                    {truncate(safe, max)}
                </span>
            );

            return (
                <ToolTip
                    direction="Top-Center"
                    text={safe} // full content in tooltip
                    type="Text Only"
                    wrapperComponent={wrapper}
                />
            );
        }

        // No tooltip needed
        return <span className={className}>{safe}</span>;
    };

    const dialogContent = (
        <div className={ignoredStyles.dialogContent}>
            <div className={ignoredStyles.detailsWrapper}>
                <h3 className={ignoredStyles.title}>Ignore To-Do</h3>
                <p className={ignoredStyles.description}>
                    Select the period until which you want to ignore this to-do. The to-do will not
                    appear again until the selected cycle.
                </p>

                <div className={ignoredStyles.currentDueDate}>
                    <div className={ignoredStyles.dueDateHeader}>
                        <span>Due: {formatDate(task.dueDate)}</span>
                        <span className={ignoredStyles.repeatText}>Repeats every month on C+2</span>
                    </div>

                    <div className={ignoredStyles.taskDetails}>
                        <div className={ignoredStyles.titleRow}>
                            <div className={ignoredStyles.titleRow}>
                                <div
                                    className={ignoredStyles.taskTitle}
                                    title={task.title ?? 'No Title'}
                                >
                                    {task.title ?? 'No Title'}
                                </div>
                                <div className={ignoredStyles.priorityIcon}>
                                    {renderPriorityIcon(task.priority)}
                                </div>
                            </div>
                        </div>

                        <div className={ignoredStyles.todoSubtitle}>
             {task.source && <span>{task.source}</span>}
                            {task.source && task.issueSectionName && <span> | </span>}

                            {task.issueSectionName &&
                                renderWithTooltip(
                                    task.issueSectionName,
                                    10 /* max */,
                                    undefined /* keep existing styles if any */,
                                )}
                            {(() => {
                                const status = getSubtitleStatus(task.subtitle);
                                return status ? (
                                    <>
                                     {(task.source || task.issueSectionName) && <span> | </span>}
                                        <span>{status}</span>
                                     <span>{status}</span>
                                    </>
                                ) : null;
                            })()}
                        </div>
                    </div>
                </div>
                <div className={ignoredStyles.ignoreUntil}>
                    <label className={ignoredStyles.label}>Ignore Until</label>
                    <select
                        className={ignoredStyles.dropdown}
                        value={ignorePeriod}
                        onChange={e => setIgnorePeriod(e.target.value)}
                    >
                        <option value="Select">Select</option>
                        {Array.from({ length: 12 }, (_, i) => (
                            <option key={i} value={`${i + 1} Month(s)`}>
                                {i + 1} Month(s)
                            </option>
                        ))}
                    </select>
                </div>
                {nextTodoDate && (
                    <div className={ignoredStyles.nextTodo}>
                        <Icon name="info-circle" size="m" /> Next to-do will be generated on:{' '}
                        {nextTodoDate}
                    </div>
                )}
            </div>
        </div>
    );

    return (
        <Dialog
            className={ignoredStyles.ignoreDialog}
            title=""
            content={dialogContent}
            isOpen={showIgnoreDialog}
            onClose={() => {
                setIgnorePeriod('Select');
                onClose();
            }}
            hideHeader
            showCloseIcon={false}
            primaryButtonText="Ignore"
            secondaryButtonText="Cancel"
            isPrimaryDisabled={ignorePeriod === 'Select'}
            onPrimaryButtonClick={() => {
                onIgnore(ignorePeriod);
                setIgnorePeriod('Select');
            }}
            onSecondaryButtonClick={() => {
                setIgnorePeriod('Select');
                onClose();
            }}
        />
    );
};

export const IgnoreDialogDelete: React.FC<{
    isOpen: boolean;
    onClose: () => void;
    onConfirm: () => void;
}> = ({ isOpen, onClose, onConfirm }) => {
    return (
        <Dialog
            title="Remove from Ignore"
            isOpen={isOpen}
            onClose={onClose}
            primaryButtonText="Remove"
            // secondaryButtonText="Cancel"
            onPrimaryButtonClick={onConfirm}
            // onSecondaryButtonClick={onClose}
            content={
                <div>
                    Are you sure you want to remove the to-do from ignored list? you will start
                    receiving this to-do again as per the next recurrence date.
                </div>
            }
        />
    );
};

const IgnoredContentPane: React.FC<{
    onOpenFlyout?: (todoId: number, tasks: IgnoredTodo[]) => void;
}> = ({ onOpenFlyout }) => {
    const dispatch = useDispatch<AppDispatch>();
    const { todos, loading } = useSelector((state: RootState) => state.ignoredTodos);

    const [showIgnoreDialog, setShowIgnoreDialog] = useState(false);
    const [selectedTask, setSelectedTask] = useState<Todo | null>(null);
    const [showToast, setShowToast] = useState(false);

    const [showDeleteDialog, setShowDeleteDialog] = useState(false);
    const [taskToDelete, setTaskToDelete] = useState<Todo | null>(null);

    useEffect(() => {
        // fetch on mount
        dispatch(
            fetchIgnoredTodos({
                toolName: null,
                priorityName: null,
                dueDate: null,
                startDueDate: null,
                endDueDate: null,
            }),
        );
    }, [dispatch]);

    const sortedTodos = useMemo(() => {
        return [...(todos || [])].sort((a, b) => {
            const dateA = a.ignoreTill ? new Date(a.ignoreTill).getTime() : 0;
            const dateB = b.ignoreTill ? new Date(b.ignoreTill).getTime() : 0;
            return dateA - dateB;
        });
    }, [todos]);

    const handleIgnore = async (ignorePeriod: string) => {
        if (!selectedTask || ignorePeriod === 'Select') return;

        const monthsToAdd = parseInt(ignorePeriod.split(' ')[0] || '1', 10);
        const currentDate = new Date();
        currentDate.setMonth(currentDate.getMonth() + monthsToAdd);

        const payload = {
            TODOId: selectedTask.id,
            ActionType: 'Ignore' as const,
            IgnoreTill: currentDate,
            NewDueDate: null,
            ignorenumber: null,
        };

        try {
            await manageToDoDetails(payload);
            setShowIgnoreDialog(false);
            setShowToast(true);

            // refresh list
            dispatch(
                fetchIgnoredTodos({
                    toolName: null,
                    priorityName: null,
                    dueDate: null,
                    startDueDate: null,
                    endDueDate: null,
                }),
            );
        } catch (error) {
            logError('Error ignoring todo:', error);
        }
    };

    const handleRemoveIgnore = async (todo: Todo | null) => {
        if (!todo?.id) return;

        const payload = {
            TODOId: todo.id, // @TODOId = @ToDoId
            ActionType: 'RemoveIgnore' as const, // @ActionType = 'RemoveIgnore'
            IgnoreTill: null,
            NewDueDate: null,
            ignorenumber: null,
        };

        try {
            await manageToDoDetails(payload);

            // Close dialog & clear selection
            setShowDeleteDialog(false);
            setTaskToDelete(null);

            // Refresh ignored list
            dispatch(
                fetchIgnoredTodos({
                    toolName: null,
                    priorityName: null,
                    dueDate: null,
                    startDueDate: null,
                    endDueDate: null,
                }),
            );
            dispatch(
                fetchIgnoredTodos({
                    toolName: null,
                    priorityName: null,
                    dueDate: null,
                    startDueDate: null,
                    endDueDate: null,
                }),
            );
            window.dispatchEvent(new CustomEvent('todo:refresh'));
            dispatch(fetchToDoFilters());
            dispatch(
                fetchToDos({
                    toolName: null,
                    priorityName: null,
                    dueDate: null,
                    startDueDate: null,
                    endDueDate: null,
                }),
            );
            // Optional: success toast
            setShowToast(true);
        } catch (err) {
            logError('Error removing ignore:', err);
        }
    };

    return (
        <>
            <div className={ignoredStyles.flyoutContent}>
                {loading && (
                    <Flex
                        align="center"
                        justify="center"
                        style={{ height: '584px', width: '100%' }}
                    >
                        <AnimatedLoaders id="page-loader" text="" type="page" />
                    </Flex>
                )}

                {!loading && sortedTodos && sortedTodos.length > 0 ? (
                    <div className={ignoredStyles.listScroll}>
                        {sortedTodos.map((todo: Todo) => (
                            <div
                                key={todo.id}
                                className={ignoredStyles.todoCard}
                                onClick={e => {
                                    e.stopPropagation();
                                    onOpenFlyout?.(todo.id, sortedTodos);
                                }}
                            >
                                <div className={ignoredStyles.todoBody}>
                                    <div className={ignoredStyles.todoText}>
                                        <div className={ignoredStyles.titleRow}>
                                            <span className={ignoredStyles.taskTitle}>
                                                {todo.title || ''}
                                            </span>

                                            {todo.isreccuring && (
                                                <span className={ignoredStyles.priorityIcon}>
                                                    <Reccuringicon />
                                                </span>
                                            )}

                                            {renderPriorityIcon(todo.priority)}
                                        </div>

                                        <div className={ignoredStyles.todoSubtitle}>
                                           {todo.source && (
    <span>
        {todo.source}
        {todo.source === 'Command Center' && todo.moduleName && (
            <> | {todo.moduleName}</>
        )}
    </span>
)}
 {todo.source && todo.issueSectionName && (
                                                <span> | </span>
                                            )}
                                            {todo.issueSectionName && (
                                                <span>{todo.issueSectionName}</span>
                                            )}
                                            {(() => {
                                                const status = getSubtitleStatus(todo.subtitle);
                                                return status ? (
                                                    <>
                                                       
                                                        <span> | {status}</span>
                                                    </>
                                                ) : null;
                                            })()}

                                            {(() => {
                                                const chips = getFilterChipsForTodo(todo);

                                                return chips.length > 0 ? (
                                                    <div className={ignoredStyles.todofilterchip}>
                                                        {chips.map(
                                                            (
                                                                chip: { label: string },
                                                                idx: number,
                                                            ) => (
                                                                <FilterChip
                                                                    key={`filter-chip-ignored-dialog-${idx}`}
                                                                    charLimit={60}
                                                                    showTooltip={true}
                                                                    showCloseIcon={false}
                                                                    label={chip.label}
                                                                    tooltipText={chip.label}
                                                                    className="chip-width"
                                                                />
                                                            ),
                                                        )}
                                                    </div>
                                                ) : null;
                                            })()}
                                        </div>
                                    </div>
                                </div>

                                <div className={ignoredStyles.todoHeader}>
                                    <button
                                        className={ignoredStyles.todoButton}
                                        onClick={e => {
                                            e.stopPropagation(); // ← THIS prevents IgnoreDialog from opening
                                            setSelectedTask(todo); // set the selected task for ignore dialog
                                            setShowIgnoreDialog(true);
                                        }}
                                    >
                                        <Icon color="black-color" name="clock" size="xm" />
                                        Ignored until {formatDate(todo.ignoreTill)}
                                    </button>

                                    <button
                                        className={ignoredStyles.removeButton}
                                        onClick={e => {
                                            e.stopPropagation(); // prevent triggering parent onClick

                                            setTaskToDelete(todo); // store selected task
                                            setShowDeleteDialog(true); // open delete dialog
                                            // openIgnoreDialog(todo);
                                        }}
                                    >
                                        <Icon color="black-color" name="x-close" size="xm" />
                                        <label>Remove</label>
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>
                ) : (
                    !loading && <div className={ignoredStyles.noTodos}>No ignored todos found.</div>
                )}

                {/* Ignore dialog */}
                <IgnoreDialog
                    showIgnoreDialog={showIgnoreDialog}
                    onClose={() => setShowIgnoreDialog(false)}
                    onIgnore={handleIgnore}
                    task={selectedTask}
                />

                {/* Toast */}
                {showToast && (
                    <Toast
                        distance="l"
                        message="To-Do ignored successfully."
                        mode="Top Right"
                        onCloseToast={() => setShowToast(false)}
                        toggle
                        type="Success"
                    />
                )}
                {showDeleteDialog && (
                    <>
                        {/* <DeleteDialog
                        isOpen={showDeleteDialog}
                        title="Remove from ignore"
                        message="Are you sure you want to remove the to-do from ignored list? you will start receiving this to-do again as per the next recurrence date"
                        onClose={() => setShowDeleteDialog(false)}
                        primaryButtonText="Remove"
                        onDelete={() => handleRemoveIgnore(taskToDelete)}
                    /> */}
                        <IgnoreDialogDelete
                            isOpen={showDeleteDialog}
                            onClose={() => setShowDeleteDialog(false)}
                            onConfirm={() => {
                                void handleRemoveIgnore(taskToDelete);
                            }}
                        />
                    </>
                )}
            </div>
        </>
    );
};

export default IgnoredContentPane;
