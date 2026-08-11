import React, { useState, useEffect, useRef } from 'react';
import {
    Status,
    Button,
    Dialog,
    FilterChip,
    InputField,
    Icon,
    IconButton,
    AnimatedLoaders,
} from 'konnect-react-components';
import { Typography } from '@mui/material';
import styles from './TaskDetails.module.scss';
import { Flex, Tooltip } from 'antd';
import {
    CriticalPriorityIcon,
    HighPriorityIcon,
    MediumPriorityIcon,
    LowPriorityIcon,
} from '../../../assets/images/images';
import { useSelector } from 'react-redux';
import GoToTaskButton from '../../atoms/go-to-task-button/GoToTaskButton';
import { IToDoDetails } from '../../../types/response';
import { To_DO_SOURCE } from '../../../utils/constants';
import { setSelectedAFToDo } from '../../../store/slice/selectedAFToDoSlice';
import { useDispatch } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import { updateToDoStatus } from '../../../services/todo';
import { fetchToDos, AppDispatch, getToDoComments, RootState } from '../../../store';
import ToDoKababMenu from '../../atoms/todo-kabab-menu/ToDoKababMenu';
import { updateToDoComments } from '../../../services/todo';
import { formatDateAndTimeParts, logError } from '../../../utils/helpers';

interface Props {
    task: IToDoDetails;
    helpDisplay?: string;
    onGoToTaskClick?: () => void;
    clearSelection: () => void;
}

type ToDoComments = {
    toDoId: number;
    commentText: string;
    fullName: string;
    updatedOn: string;
};
export function HelpIcon({
    displayName = 'block',
    task,
    onGoToTaskClick,
    onHandleMarkCompleteClick,
    clearSelection,
}: Readonly<{
    displayName?: string;
    task: IToDoDetails;
    onGoToTaskClick: () => void;
    onHandleMarkCompleteClick: () => void;
    clearSelection: () => void;
}>) {
    return (
        <Flex style={{ marginLeft: 'auto', display: displayName }} gap="1rem">
            <Tooltip title="Help & Documentation" placement="bottom">
                <span>
                    {/* <IconButton icon="help-circle" onClick={() => {}} size="Large" /> */}
                    <button
                        className={styles['question-mark-button']}
                        onClick={() => {}}
                        title={''}
                        disabled={true}
                    >
                        ?
                    </button>
                </span>
            </Tooltip>
            {/* <Button onClick={() => {}} text="Go To Task" /> */}

            <GoToTaskButton size="medium" onClick={onGoToTaskClick} />
            {task.status === 'Completed' ? (
                <Button
                    disabled={true}
                    variant="Secondary"
                    className={styles['completed-button']}
                    icon="check"
                    text="Completed"
                    onClick={() => {}}
                />
            ) : (
                <a className={styles[`custom-button-medium`]} onClick={onHandleMarkCompleteClick}>
                    <svg
                        width="16"
                        height="16"
                        viewBox="0 0 16 16"
                        className={styles['button-icon']}
                        fill="none"
                        xmlns="http://www.w3.org/2000/svg"
                    >
                        <path
                            fill-rule="evenodd"
                            clip-rule="evenodd"
                            d="M13.8047 3.52925C14.0651 3.7896 14.0651 4.21171 13.8047 4.47206L6.4714 11.8054C6.21106 12.0657 5.78894 12.0657 5.5286 11.8054L2.19526 8.47206C1.93491 8.21171 1.93491 7.7896 2.19526 7.52925C2.45561 7.2689 2.87772 7.2689 3.13807 7.52925L6 10.3912L12.8619 3.52925C13.1223 3.2689 13.5444 3.2689 13.8047 3.52925Z"
                            fill="#0D0D0D"
                        />
                    </svg>
                    Mark Complete
                </a>
            )}
            {task.status === 'Completed' ? (
                <Button
                    icon="dots-vertical"
                    disabled={true}
                    variant="Secondary"
                    isIconOnly={true}
                    onClick={() => {}}
                />
            ) : (
                <ToDoKababMenu
                    key={task.id}
                    task={task}
                    onActionComplete={actionType => {
                        if (actionType === 'Snooze') {
                            clearSelection();
                        } else {
                            window.dispatchEvent(new CustomEvent('todo:close-details'));
                        }
                    }}
                />
            )}
        </Flex>
    );
}
const buildFilterChips = (task: IToDoDetails) => {
    const chips: { label: string }[] = [];
    const attrs = Array.isArray(task.attributes) ? (task.attributes as any[]) : [];

    const countryAttr = attrs.find(a => typeof a === 'object' && a && 'countryCode' in a);
    const countryCode: string | undefined = countryAttr?.countryCode;

    if (countryCode === 'CL') {
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
        // add with other hooks
        // formatted date (DD MMM YYYY)

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

    if (countryCode === 'BR') {
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
const TaskDetails: React.FC<Props> = ({ task, helpDisplay = 'flex', clearSelection }) => {
    const [statusSuffix, setStatusSuffix] = useState<string>('');
    const [statusType, setStatusType] = useState<
        'Success' | 'Warning' | 'Alert' | 'Neutral1' | 'Neutral2' | 'Neutral3'
    >('Neutral1');
    const dispatch = useDispatch<AppDispatch>();
    const navigate = useNavigate();
    const [showDialog, setShowDialog] = useState(false);
    const [pendingStatus, setPendingStatus] = useState<boolean | null>(null);
    const [comment, setComment] = useState<string>('');
    const [isSending, setIsSending] = useState<boolean>(false);
    const [existingComment, setExistingComment] = useState<string | null>(null);

    const [isEditing, setIsEditing] = useState(false);
    const [editValue, setEditValue] = useState<string>('');
    const [isExpanded, setIsExpanded] = useState(false);
    const [isOverflowing, setIsOverflowing] = useState(false);
    const commentTextRef = useRef<HTMLDivElement | null>(null);
    const [lastEditedBy, setLastEditedBy] = useState<string | null>(null);
    const [lastEditedOn, setLastEditedOn] = useState<string | null>(null);
    // Keep this inside TaskDetails.tsx
    const pickLatestComment = (arr: ToDoComments[] | undefined | null): ToDoComments | null => {
        if (!arr || arr.length === 0) return null;
        const sorted = [...arr].sort(
            (a, b) => new Date(b.updatedOn).getTime() - new Date(a.updatedOn).getTime(),
        );
        return sorted[0] ?? null; // <-- ensure never undefined
    };
    const isCommentsLoading = useSelector((state: RootState) => state.todocomment.loading);

    const handleGoToTaskClick = () => {
        if (task.source === To_DO_SOURCE.AdvancedForecasting) {
            dispatch(
                setSelectedAFToDo({
                    title: task.title ?? '',
                    subtitle: task.subtitle ?? '',
                    selectedToDoId: 'todo',
                    taskAFId: String(task.id ?? ''),
                }),
            );
            navigate('/advanced-forecasting');
        } else {
            if (task.moduleName == 'Issues') {
                navigate(
                    `/issues?issueId=${task.sourceSystemUniqueIdentifier}&section=${task.exceptionSectionName}`,
                );
            } else {
                navigate(
                    `/ro?exceptionId=${task.sourceSystemUniqueIdentifier}&section=${task.exceptionSectionName}`,
                );
            }
        }
    };
    const handleSendComment = async () => {
        const text = comment.trim();
        if (!text || isSending) return;

        try {
            setIsSending(true);
            await updateToDoComments({
                toDoId: task.id,
                commentText: text,
            });

            setComment(''); // Clear input on success

            // Refresh: fetch latest comments and set existing comment
            const res = await dispatch(getToDoComments(task.id));
            if (getToDoComments.fulfilled.match(res)) {
                const comments = res.payload as
                    | { toDoId: number; commentText: string }[]
                    | undefined;
                if (comments && comments.length > 0 && comments[0]?.commentText) {
                    setExistingComment(comments[0].commentText);
                }
            }
        } catch (err) {
            logError('Failed to add comment:', err);
        } finally {
            setIsSending(false);
        }
    };
    const handleMarkCompleteClick = () => {
        setPendingStatus(true);
        setShowDialog(true);
    };

    const handleConfirm = async () => {
        if (pendingStatus !== null) {
            try {
                await updateToDoStatus({
                    id: task.id,
                    isCompleted: pendingStatus,
                });

                dispatch(
                    fetchToDos({
                        toolName: null,
                        priorityName: null,
                        dueDate: null,
                        startDueDate: null,
                        endDueDate: null,
                    }),
                );
            } catch (error) {
                logError('Failed to update task status: ', error);
            }
        }
        setShowDialog(false);
        setPendingStatus(null);
    };

    const handleCancel = () => {
        setShowDialog(false);
        setPendingStatus(null);
    };
    const footerChips = buildFilterChips(task);
    useEffect(() => {
        if (!task?.id) return;

        dispatch(getToDoComments(task.id)).then(response => {
            if (getToDoComments.fulfilled.match(response)) {
                const comments = response.payload as ToDoComments[] | undefined;

                const latest = pickLatestComment(comments);
                if (latest?.commentText) {
                    setExistingComment(latest.commentText);
                    setLastEditedBy(latest.fullName ?? null);

                    const parts = latest.updatedOn
                        ? formatDateAndTimeParts(latest.updatedOn)
                        : null;
                    setLastEditedOn(parts?.datePart ?? null); // <-- "DD MMM YYYY"
                } else {
                    setExistingComment(null);
                    setLastEditedBy(null);
                    setLastEditedOn(null);
                }
            } else {
                setExistingComment(null);
                setLastEditedBy(null);
                setLastEditedOn(null);
            }

            // Reset editing/expansion after fetch
            setIsEditing(false);
            setIsExpanded(false);
            setEditValue('');
        });
    }, [dispatch, task?.id]);

    const onEditClick = () => {
        setEditValue(existingComment ?? '');
        setIsEditing(true);
        setIsExpanded(false);
    };
    const handleSaveComment = async () => {
        const text = editValue.trim();
        if (!text || isSending) return;

        try {
            setIsSending(true);
            await updateToDoComments({
                toDoId: task.id,
                commentText: text,
            });

            // Refresh comments so the label updates from the source of truth
            const res = await dispatch(getToDoComments(task.id));
            if (getToDoComments.fulfilled.match(res)) {
                const comments = res.payload as
                    | { toDoId: number; commentText: string }[]
                    | undefined;
                const latest =
                    comments && comments.length > 0 ? (comments[0]?.commentText ?? null) : null;
                setExistingComment(latest);
            }

            setIsEditing(false);
            setIsExpanded(false);
        } catch (err) {
            logError('Failed to save comment:', err);
        } finally {
            setIsSending(false);
        }
    };
    useEffect(() => {
        if (isCommentsLoading || !existingComment) return;

        const measure = () => {
            const el = commentTextRef.current;
            if (!el) return;
            const overflows = el.scrollHeight > el.clientHeight || el.scrollWidth > el.clientWidth;
            setIsOverflowing(overflows);
        };

        const raf = requestAnimationFrame(measure);
        return () => cancelAnimationFrame(raf);
    }, [existingComment, isExpanded, isCommentsLoading]);
    useEffect(() => {
        const handleResize = () => {
            if (isCommentsLoading || !existingComment) return;
            const el = commentTextRef.current;
            if (!el) return;
            const overflows = el.scrollHeight > el.clientHeight || el.scrollWidth > el.clientWidth;
            setIsOverflowing(overflows);
        };
        window.addEventListener('resize', handleResize);
        return () => window.removeEventListener('resize', handleResize);
    }, [isCommentsLoading, existingComment]);
    useEffect(() => {
        const calculateStatus = () => {
            const currentDate = new Date();
            const taskDueDate = new Date(task.dueDate);
            const diffTime = currentDate.getTime() - taskDueDate.getTime();
            const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));

            if (task.completedOn !== null) {
                setStatusSuffix('Completed');
                setStatusType('Success');
            } else if (diffDays === 0) {
                setStatusSuffix('Due Today');
                setStatusType('Alert');
            } else if (diffDays > 0) {
                setStatusSuffix(`${diffDays} Days overdue`);
                setStatusType('Warning');
            } else {
                setStatusSuffix(`Due in ${Math.abs(diffDays)} Days`);
                setStatusType('Neutral1');
            }
        };

        calculateStatus();
    }, [task]);

    const renderPriorityIcon = () => {
        switch (task.priority) {
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

    return (
        <div className={styles['main-container']}>
            <div>
                <Flex align="center" justify="space-between">
                    <Typography className={styles['title-class']} variant="h6">
                        {task?.title ?? ''}
                    </Typography>
                    {/* <HelpIcon displayName='block' /> */}
                    <HelpIcon
                        displayName={helpDisplay}
                        task={task}
                        onGoToTaskClick={handleGoToTaskClick}
                        onHandleMarkCompleteClick={handleMarkCompleteClick}
                        clearSelection={clearSelection}
                    />
                </Flex>
                <Typography variant="body2" color="textSecondary" style={{ marginTop: 8 }}>
                    {task.source} | {task.moduleName}
                </Typography>
                <div className={styles['space-v-16']} />
                {/* Assignee */}
                <Flex className={styles['field-value-container']} align="center" gap="8px">
                    <Typography variant="body2" className={styles['field']}>
                        Assignee:
                    </Typography>
                    <Typography variant="body2" className={styles['value']}>
                        {task.assignee}
                    </Typography>
                </Flex>
                {footerChips.length > 0 && (
                    <Flex className={styles['field-value-container']} align="center" gap="8px">
                        <Typography variant="body2" className={styles['field']}>
                            Attributes:
                        </Typography>
                        <Typography variant="body2" className={styles['value']}>
                            {footerChips.map((chip, idx) => (
                                <FilterChip
                                    key={`filter-chip-dyn-${idx}`}
                                    charLimit={60}
                                    showTooltip={true}
                                    showCloseIcon={false}
                                    size="large"
                                    label={chip.label}
                                    tooltipText={chip.label}
                                    className="chip-width"
                                />
                            ))}
                        </Typography>
                    </Flex>
                )}
                {/* Priority */}
                <Flex className={styles['field-value-container']} align="center" gap="8px">
                    <Typography variant="body2" className={styles['field']}>
                        Priority:
                    </Typography>
                    <Flex align="center" gap="4px">
                        {renderPriorityIcon()}
                        <Typography variant="body2" className={styles['value']}>
                            {task.priority}
                        </Typography>
                    </Flex>
                </Flex>
                {/* Due Date */}
                <Flex className={styles['field-value-container']} align="center" gap="8px">
                    <Typography variant="body2" className={styles['field']}>
                        Due Date:
                    </Typography>
                    <Typography variant="body2" className={styles['value']}>
                        <Typography variant="body2" className={styles['value']}>
  {new Date(task.dueDate).toLocaleDateString('en-GB', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  })}
</Typography>
                    </Typography>
                </Flex>
                {/* Status */}
                <Flex className={styles['field-value-container']} align="center" gap="8px">
                    <Typography variant="body2" className={styles['field']}>
                        Status:
                    </Typography>
                    {statusSuffix === 'Completed' ? (
                        <Tooltip title={`Completed on ${task.completedOn}`} placement="bottom">
                            <span>
                                <Status size="L" text={statusSuffix} type={statusType} />
                            </span>
                        </Tooltip>
                    ) : (
                        <Status size="L" text={statusSuffix} type={statusType} />
                    )}
                </Flex>
                <div className={styles['space-v-16']}></div>
                {/* Description */}
                <Typography variant="body1" color="textSecondary" style={{ fontWeight: 'bold' }}>
                    Task Description:
                </Typography>
                <Typography className={styles['description']} color="textSecondary">
                    <div style={{ marginTop: '16px' }}>{task.description}</div>
                </Typography>
                {task.readmorelink && (
                    <div
                        style={{ marginTop: '16px', overflow: 'auto' }}
                        dangerouslySetInnerHTML={{ __html: task.readmorelink }}
                    />
                )}
            </div>
            <div>
                {isCommentsLoading ? (
                    <div className={styles['comment-loader-container']}>
                        <AnimatedLoaders id="page-loader" text="Loading" type="page" />
                    </div>
                ) : isEditing ? (
                    // Edit mode (input field)
                    <InputField
                        value={editValue}
                        onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                            setEditValue(e.target.value)
                        }
                        leftIcon="message-text-square-01"
                        rightIcon={editValue.trim() && !isSending ? 'send-01' : undefined}
                        placeholder="Leave your comment"
                        rightIconOnClick={handleSaveComment}
                        isDisabled={isSending}
                    />
                ) : existingComment ? (
                    // Label mode (read-only, styled like InputField, icon on right)
                    <div className={styles['comment-label-container']}>
                        <div className={styles['comment-label-row']}>
                            <div className={styles['comment-inputlike']}>
                                <div
                                    ref={commentTextRef}
                                    className={`${styles['comment-text-box']} ${!isExpanded ? styles['clamped-one-line'] : ''}`}
                                    title={existingComment}
                                >
                                    <div className={styles['right-icon']}>
                                        <Icon
                                            color="neutrals-B80"
                                            name="message-text-square-01"
                                            size="xm"
                                        />{' '}
                                        {'  '}
                                    </div>
                                    <span className={styles['comment-text']}>
                                        {existingComment}
                                    </span>

                                    {isOverflowing && (
                                        <button
                                            type="button"
                                            className={styles['view-toggle']}
                                            onClick={() => setIsExpanded(v => !v)}
                                        >
                                            {isExpanded ? 'View less' : 'View more'}
                                        </button>
                                    )}
                                </div>

                                {/* Right-side icon (to mimic InputField rightIcon) */}
                                <IconButton icon="edit-01" size="Small" onClick={onEditClick} />
                            </div>
                        </div>
                    </div>
                ) : (
                    // No comment yet → add mode
                    <InputField
                        value={comment}
                        onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                            setComment(e.target.value)
                        }
                        leftIcon="message-text-square-01"
                        rightIcon={comment.trim() ? 'send-01' : undefined}
                        placeholder="Leave a comment"
                        rightIconOnClick={handleSendComment}
                        isDisabled={isSending}
                    />
                )}{' '}
                {(lastEditedBy || lastEditedOn) && (
                    <div style={{ marginTop: 8, marginBottom: 8 }}>
                        <Typography variant="body2" color="textSecondary">
                            Last edited by: {lastEditedBy ?? '—'} on {lastEditedOn ?? ''}
                        </Typography>
                    </div>
                )}
            </div>
            <Dialog
                title={'Mark Complete'}
                content={`You are marking the to-do as complete. Click on “Mark Complete” to confirm this action.`}
                isOpen={showDialog}
                onClose={handleCancel}
                onPrimaryButtonClick={handleConfirm}
                primaryButtonText="Mark Complete"
            />
        </div>
    );
};

export default TaskDetails;
