import React, { useEffect, useMemo, useState } from 'react';
import { Dialog, Icon, AnimatedLoaders, FilterChip } from 'konnect-react-components';
import { Flex } from 'antd';
import { useDispatch, useSelector } from 'react-redux';

import styles from './SnoozedContentPane.module.scss';
import { AppDispatch, fetchToDoFilters, fetchToDos, RootState } from '../../../store';
import { fetchSnoozedTodos } from '../../../store/thunks/fetchSnoozedTodos';
import type { SnoozedTodo } from '../../../store/slice/snoozedTodosSlice';
import { manageToDoDetails } from '../../../services/todo';
import {
    CriticalPriorityIcon,
    HighPriorityIcon,
    LowPriorityIcon,
    MediumPriorityIcon,
} from '../../../assets/images/images';
import { logError } from '../../../utils/helpers';

const formatDate = (dateString: string | null): string => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleDateString('en-GB', {
        day: '2-digit',
        month: 'short',
        year: 'numeric',
    });
};

// Snooze response currently has snoozeTill = null in your samples.
// We'll show snoozeTill if present, else show lastSnoozedOn.
const getSnoozeDisplay = (t: SnoozedTodo) => {
    if (t.snoozeTill) return { label: 'Snoozed until', value: formatDate(t.snoozeTill) };
    if (t.lastSnoozedOn) return { label: 'Snoozed on', value: formatDate(t.lastSnoozedOn) };
    return { label: 'Snoozed', value: 'N/A' };
};

export const UnsnoozeDialog: React.FC<{
    isOpen: boolean;
    onClose: () => void;
    onConfirm: () => void;
}> = ({ isOpen, onClose, onConfirm }) => {
    return (
        <Dialog
            title="Unsnooze"
            isOpen={isOpen}
            onClose={onClose}
            primaryButtonText="Unsnooze"
            // secondaryButtonText="Cancel"
            onPrimaryButtonClick={onConfirm}
            // onSecondaryButtonClick={onClose}
            content={
                <div>
                    Are you sure you want to unsnooze this to-do? The to-do due date will be set
                    back to its original date.
                </div>
            }
        />
    );
};

const SnoozedContentPane: React.FC<{
    onOpenFlyout?: (todoId: number, tasks: SnoozedTodo[]) => void;
}> = ({ onOpenFlyout }) => {
    const dispatch = useDispatch<AppDispatch>();
    const { todos, loading } = useSelector((state: RootState) => state.snoozedTodos);

    const [selected, setSelected] = useState<SnoozedTodo | null>(null);
    const [showUnsnoozeDialog, setShowUnsnoozeDialog] = useState(false);

    // NEW: centralize opening the Unsnooze dialog
    const openUnsnoozeDialog = (todo: SnoozedTodo) => {
        setSelected(todo);
        setShowUnsnoozeDialog(true);
    };

    useEffect(() => {
        dispatch(fetchSnoozedTodos());
    }, [dispatch]);

    const sortedTodos = useMemo(() => {
        return [...(todos || [])].sort((a, b) => {
            const aTime = a.snoozeTill
                ? new Date(a.snoozeTill).getTime()
                : a.lastSnoozedOn
                  ? new Date(a.lastSnoozedOn).getTime()
                  : 0;
            const bTime = b.snoozeTill
                ? new Date(b.snoozeTill).getTime()
                : b.lastSnoozedOn
                  ? new Date(b.lastSnoozedOn).getTime()
                  : 0;
            return aTime - bTime;
        });
    }, [todos]);

    const confirmUnsnooze = async () => {
        if (!selected) return;

        try {
            await manageToDoDetails({
                TODOId: selected.id,
                ActionType: 'Unsnooze',
                NewDueDate: null,
                IgnoreTill: null,
                ignorenumber: null,
            });

            dispatch(fetchSnoozedTodos());
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
        } catch (e) {
            logError('Unsnooze failed:', e);
        } finally {
            setShowUnsnoozeDialog(false);
            setSelected(null);
        }
    };

    const getPriorityValue = (todo: any): string | undefined => {
        return todo?.priority ?? todo?.priorityName ?? todo?.priorityLevel;
    };

    const renderPriorityIcon = (todo: any) => {
        const p = getPriorityValue(todo);
        switch (p) {
            case 'Critical':
                return <CriticalPriorityIcon />;
            case 'High':
                return <HighPriorityIcon />;
            case 'Medium':
                return <MediumPriorityIcon />;
            case 'Low':
                return <LowPriorityIcon />;
            default:
                return null;
        }
    };
    const mapAttributesToChips = (attributes: any[]) => {
        const chips: { label: string }[] = [];
        if (!attributes || attributes.length === 0) return chips;

        const attr = attributes[0];

        if (attr.countryCode === 'BR') {
            chips.push({ label: `${attr.countryCode}` });
            chips.push({ label: `${attr.gmcGrouping}` });
            chips.push({ label: `${attr.channel}` });
            return chips;
        }

        if (attr.countryCode === 'CL') {
            chips.push({ label: `${attr.countryCode}` });
            if (attr.rootId && attr.rootIdDescription) {
                chips.push({ label: `${attr.rootId} - ${attr.rootIdDescription}` });
            }
            if (attr.customerId && attr.customerIdDescription) {
                chips.push({ label: `${attr.customerId} - ${attr.customerIdDescription}` });
            }
            return chips;
        }

        attributes.forEach(a => {
            if (a?.displayName) chips.push({ label: a.displayName });
        });

        return chips;
    };

    return (
        <>
            {loading && (
                <div className={styles.flyoutContentloader}>
                    <Flex align="center" justify="center">
                        <AnimatedLoaders id="page-loader" text="" type="page" />
                    </Flex>
                </div>
            )}

            <div className={styles.flyoutContent}>
                <div className={styles.listScroll}>
                    {!loading && sortedTodos && sortedTodos.length > 0 ? (
                        <div className={styles.flexColumn}>
                            {sortedTodos.map(todo => {
                                const snoozeInfo = getSnoozeDisplay(todo);
                                const chips = mapAttributesToChips(
                                    Array.isArray(todo.attributes) ? todo.attributes : [],
                                );
                                return (
                                    <div>
                                        <div
                                            key={todo.id}
                                            className={styles.todoCard}
                                            onClick={() => {
                                                // open flyout on card click (pic 5)
                                                // onOpenFlyout?.(todo.id, 'snoozed');
                                                onOpenFlyout?.(todo.id, sortedTodos);
                                            }}
                                        >
                                            <div className={styles.todoBody}>
                                                <div className={styles.todoText}>
                                                    <div>
                                                        <div className={styles.titleRow}>
                                                            <span className={styles.taskTitle}>
                                                                {todo.title || ''}
                                                            </span>
                                                            <span className={styles.priorityIcon}>
                                                                {renderPriorityIcon(todo)}
                                                            </span>
                                                        </div>
                                                        {/* Application Name | Module Name */}
                                                        <div className={styles.todoSubtitle}>
                                                            <span>
                                                                {todo.source || 'Application Name'}
                                                            </span>
                                                            <span> | </span>
                                                            <span>
                                                                {todo.moduleName || 'Module Name'}
                                                            </span>
                                                        </div>
                                                    </div>
                                                    <div className={styles.chipContainer}>
                                                        {chips.map((chip, idx) => (
                                                            <FilterChip
                                                                key={`filter-chip-dyn-${idx}`}
                                                                charLimit={54}
                                                                showTooltip={true}
                                                                showCloseIcon={false}
                                                                label={chip.label} // <-- now correct
                                                                tooltipText={chip.label} // <-- now correct
                                                                className="chip-width"
                                                            />
                                                        ))}
                                                    </div>
                                                </div>
                                            </div>

                                            <div className={styles.todoHeader}>
                                                <div
                                                    style={{
                                                        display: 'flex',
                                                        alignItems: 'center',
                                                    }}
                                                >
                                                    <Icon
                                                        name="clock"
                                                        size="l"
                                                        color="black-color"
                                                    />
                                                    &nbsp;
                                                    {snoozeInfo.label} {snoozeInfo.value}
                                                </div>
                                                <div>
                                                    <span
                                                        style={{
                                                            marginLeft: 16,
                                                            display: 'inline-flex',
                                                            gap: 6,
                                                            alignItems: 'center',
                                                            cursor: 'pointer',
                                                        }}
                                                        onClick={e => {
                                                            e.stopPropagation();
                                                            openUnsnoozeDialog(todo);
                                                        }}
                                                    >
                                                        <Icon name="x-close" size="m" />
                                                        Unsnooze
                                                    </span>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    ) : (
                        !loading && <div className={styles.noTodos}>No snoozed todos found.</div>
                    )}
                </div>

                <UnsnoozeDialog
                    isOpen={showUnsnoozeDialog}
                    onClose={() => setShowUnsnoozeDialog(false)}
                    onConfirm={confirmUnsnooze}
                />
            </div>
        </>
    );
    <style>
        {`
            .selected-filter-chip{
                background: #fff;
                padding-top: 0.2rem;
                padding-bottom: 0.2rem;
                margin: 2px 2px 2px 0
            }
            .filter-chip-container.selected-filter-chip.filter-chip-container-s.chip-width{
                min-width: fit-content;
                max-width: 600px;
            }
            .filter-chip-text{
                white-space: normal;
                word-wrap: break-word;
                overflow-wrap: break-word;
                text-align: left;
            }
        `}
    </style>;
};

export default SnoozedContentPane;
