import React, { useEffect, useState, useMemo } from 'react';
import { Flyout, Dialog, Icon, AnimatedLoaders, Toast } from 'konnect-react-components';
import { useDispatch, useSelector } from 'react-redux';
import { AppDispatch, RootState } from '../../../store';
import { fetchIgnoredTodos } from '../../../store/thunks/fetchIgnoredTodos';
import { manageToDoDetails } from '../../../services/todo';
import { Flex } from 'antd';
import {
    CriticalPriorityIcon,
    HighPriorityIcon,
    MediumPriorityIcon,
    LowPriorityIcon,
} from '../../../assets/images/images';
import styles from './TodoSettingsFlyout.module.scss';
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
}

interface TodoSettingsFlyoutProps {
    isOpen: boolean;
    onClose: () => void;
    onApply: () => void;
    onReset: () => void;
    heading?: string;
    subHeading?: string;
    content?: React.ReactNode;
    showFooter?: boolean;
}

const getSubtitleStatus = (subtitle: string | null | undefined): 'PAST' | 'FUTURE' | undefined => {
    if (!subtitle) return undefined;

    // Case-insensitive, word-boundary match
    const hasPast = /\bPAST\b/i.test(subtitle);
    const hasFuture = /\bFUTURE\b/i.test(subtitle);

    if (hasPast) return 'PAST';
    if (hasFuture) return 'FUTURE';
    return undefined;
};

//  Helper for date formatting
const formatDate = (dateString: string | null): string => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleDateString('en-GB', {
        day: '2-digit',
        month: 'short',
        year: 'numeric',
    });
};

//  Priority Icon Renderer
const renderPriorityIcon = (priority: string | null) => {
    switch (priority) {
        case 'Critical':
            return (
                <span className={styles.priorityIcon}>
                    <CriticalPriorityIcon />
                </span>
            );
        case 'High':
            return (
                <span className={styles.priorityIcon}>
                    <HighPriorityIcon />
                </span>
            );
        case 'Medium':
            return (
                <span className={styles.priorityIcon}>
                    <MediumPriorityIcon />
                </span>
            );
        case 'Low':
            return (
                <span className={styles.priorityIcon}>
                    <LowPriorityIcon />
                </span>
            );
        default:
            return null;
    }
};

//  Ignore Dialog Component
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

    const dialogContent = (
        <div className={styles.dialogContent}>
            <div className={styles.detailsWrapper}>
                <h3 className={styles.title}>Ignore To-Do</h3>
                <p className={styles.description}>
                    Select the period until which you want to ignore this to-do. The to-do will not
                    appear again until the selected cycle.
                </p>
                <div className={styles.currentDueDate}>
                    <div className={styles.dueDateHeader}>
                        <span>Due: {formatDate(task.dueDate)}</span>
                        <span className={styles.repeatText}>Repeats every month on C+2</span>
                    </div>
                    <div className={styles.taskDetails}>
                        <div className={styles.titleRow}>
                            <div className={styles.taskTitle}>{task.title || 'No Title'}</div>
                            {renderPriorityIcon(task.priority)}
                        </div>

                        <div className={styles.todoSubtitle}>
                            {task.source && <span>{task.source}</span>}
                            {task.source && task.issueSectionName && <span> | </span>}
                            {task.issueSectionName && <span>{task.issueSectionName}</span>}

                            {(() => {
                                const status = getSubtitleStatus(task.subtitle);
                                return status ? (
                                    <>
                                        {(task.source || task.issueSectionName) && <span> | </span>}
                                        <span>{status}</span>
                                    </>
                                ) : null;
                            })()}
                        </div>
                    </div>
                </div>
                <div className={styles.ignoreUntil}>
                    <label className={styles.label}>Ignore Until</label>
                    <select
                        className={styles.dropdown}
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
                    <div className={styles.nextTodo}>
                        <Icon name="info-circle" size="m" /> Next to-do will be generated on:{' '}
                        {nextTodoDate}
                    </div>
                )}
            </div>
        </div>
    );

    return (
        <Dialog
            className={styles.ignoreDialog}
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

//  Main Flyout Component
const TodoSettingsFlyout: React.FC<TodoSettingsFlyoutProps> = ({
    isOpen,
    onClose,
    onApply,
    onReset,
    heading = 'To-Do Settings',
    subHeading = "View the list of ignored to-do's & change settings",
    content,
    showFooter = true,
}) => {
    const dispatch = useDispatch<AppDispatch>();
    const { todos, loading } = useSelector((state: RootState) => state.ignoredTodos);

    const [showIgnoreDialog, setShowIgnoreDialog] = useState(false);
    const [selectedTask, setSelectedTask] = useState<Todo | null>(null);
    const [showToast, setShowToast] = useState(false);

    const onClickOutsideFlyoutContainer = () => {
        if (!showIgnoreDialog) {
            onClose();
        }
    };

    useEffect(() => {
        const flyoutWrapper = document.getElementById('fly-out');
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
        if (isOpen) {
            dispatch(
                fetchIgnoredTodos({
                    toolName: null,
                    priorityName: null,
                    dueDate: null,
                    startDueDate: null,
                    endDueDate: null,
                }),
            );
        }
    }, [dispatch, isOpen]);

    const sortedTodos = useMemo(() => {
        return [...todos].sort((a, b) => {
            const dateA = a.ignoreTill ? new Date(a.ignoreTill).getTime() : 0;
            const dateB = b.ignoreTill ? new Date(b.ignoreTill).getTime() : 0;
            return dateA - dateB;
        });
    }, [todos]);

    if (!isOpen) return null; // after hooks

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

    return (
        <>
            <Flyout
                cancelIconClick={onClose}
                dataTestId="fly-out"
                direction="right"
                flyoutOpen={isOpen}
                heading={heading}
                style={{ zIndex: 999 }}
                iconForCancel={{ icon: 'x-close', onClick: onClose }}
                id="fly-out"
                primaryBtnProps={
                    showFooter
                        ? {
                              disabled: false,
                              onClick: onApply,
                              text: 'Apply Filter',
                              variant: 'Primary',
                          }
                        : undefined
                }
                secondaryBtnProps={
                    showFooter
                        ? {
                              disabled: false,
                              onClick: onReset,
                              text: 'Reset Filter',
                              variant: 'Secondary',
                          }
                        : undefined
                }
                subHeading={subHeading}
                content={
                    content || (
                        <div className={styles.flyoutContent}>
                            {loading && (
                                <Flex
                                    align="center"
                                    justify="center"
                                    style={{ height: '584px', width: '400px' }}
                                >
                                    <AnimatedLoaders id="page-loader" text="" type="page" />
                                </Flex>
                            )}
                            {!loading && sortedTodos && sortedTodos.length > 0
                                ? sortedTodos.map((todo: Todo) => (
                                      <div
                                          key={todo.id}
                                          className={styles.todoCard}
                                          onClick={() => {
                                              setSelectedTask(todo);
                                              setShowIgnoreDialog(true);
                                          }}
                                      >
                                          <div className={styles.todoHeader}>
                                              Ignored for{' '}
                                              {todo.ignorenumber
                                                  ? todo.ignorenumber.replace(/Month/i, '').trim()
                                                  : ''}{' '}
                                              months until {formatDate(todo.ignoreTill)}
                                          </div>
                                          <hr className={styles.divider} />
                                          <div className={styles.todoBody}>
                                              <div className={styles.todoText}>
                                                  <div className={styles.titleRow}>
                                                      <span className={styles.taskTitle}>
                                                          {todo.title || ''}
                                                      </span>
                                                      {renderPriorityIcon(todo.priority)}
                                                  </div>
                                                  <div className={styles.todoSubtitle}>
                                                      {todo.source && <span>{todo.source}</span>}
                                                      {todo.source && todo.issueSectionName && (
                                                          <span> | </span>
                                                      )}
                                                      {todo.issueSectionName && (
                                                          <span>{todo.issueSectionName}</span>
                                                      )}

                                                      {(() => {
                                                          const status = getSubtitleStatus(
                                                              todo.subtitle,
                                                          );
                                                          return status ? (
                                                              <>
                                                                  {(todo.source ||
                                                                      todo.issueSectionName) && (
                                                                      <span> | </span>
                                                                  )}
                                                                  <span>{status}</span>
                                                              </>
                                                          ) : null;
                                                      })()}
                                                  </div>
                                              </div>
                                          </div>
                                      </div>
                                  ))
                                : !loading && (
                                      <div className={styles.noTodos}>No ignored todos found.</div>
                                  )}
                        </div>
                    )
                }
            />
            <IgnoreDialog
                showIgnoreDialog={showIgnoreDialog}
                onClose={() => setShowIgnoreDialog(false)}
                onIgnore={handleIgnore}
                task={selectedTask}
            />

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
        </>
    );
};

export default TodoSettingsFlyout;
