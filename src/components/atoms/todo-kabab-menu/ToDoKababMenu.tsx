import { Flex } from 'antd';
import {
    Dialog,
    Icon,
    SideMenu,
    Button,
    FiscalCalendar,
    FilterChip,
    Toast,
} from 'konnect-react-components';
import { useState, useRef, useEffect } from 'react';
import styles from './ToDoKababMenu.module.scss';
import { IToDoDetails } from '../../../types/response';
import {
    CriticalPriorityIcon,
    HighPriorityIcon,
    MediumPriorityIcon,
    LowPriorityIcon,
} from '../../../assets/images/images';
import { manageToDoDetails } from '../../../services/todo';
import { useDispatch } from 'react-redux';
import {
    fetchToDos,
    AppDispatch,
    fetchToDoFilters,
    fetchSnoozedTodos,
    fetchIgnoredTodos,
} from '../../../store';
import React from 'react';
import { UnsnoozeDialog } from '../../organisms/todo/SnoozedContentPane';
import { IgnoreDialogDelete } from '../../organisms/todo/IgnoredContentPane';
import { logError } from '../../../utils/helpers';

type KebabOrigin = 'default' | 'settingsIgnored' | 'settingsSnoozed';

interface ToDoKababMenuProps {
    origin?: KebabOrigin;
    task: IToDoDetails;
    setIsKebabBusy?: (busy: boolean) => void;
    onActionComplete?: (
        actionType: 'Snooze' | 'Ignore' | 'IncorrectAssignment' | 'Unsnooze' | 'RemoveFromIgnore',
    ) => void;
}

const ToDoKababMenu: React.FC<ToDoKababMenuProps> = ({
    origin = 'default',
    task,
    setIsKebabBusy,
    onActionComplete,
}) => {
    const [showDialog, setShowDialog] = useState(false);
    const [selectedDate, setSelectedDate] = useState<Date | null>(null);
    const [showIgnoreDialog, setShowIgnoreDialog] = useState(false);
    const [ignorePeriod, setIgnorePeriod] = useState('1 Month(s)');
    const parentRef = useRef<HTMLDivElement>(null);
    const busyRef = useRef(false);
    const [isSnoozedLoading, setisSnoozedLoading] = useState(false);

    const [toastConfig, setToastConfig] = useState<{
        visible: boolean;
        message: string;
        type: 'Delete' | 'Error' | 'Success';
    }>({ visible: false, message: '', type: 'Success' });

    const showSuccessToast = (message: string) =>
        setToastConfig({ visible: true, message, type: 'Success' });

    const showErrorToast = (message: string) =>
        setToastConfig({ visible: true, message, type: 'Error' });

    const closeToast = () => setToastConfig(prev => ({ ...prev, visible: false }));

    const dispatch = useDispatch<AppDispatch>();

    const normalizeToNoon = (d: Date) => {
        const nd = new Date(d);
        nd.setHours(12, 0, 0, 0);
        return nd;
    };

    const [showDeleteIgnoreDialog, setShowDeleteIgnoreDialog] = useState(false);
    const [showUnsnoozeDialog, setShowUnsnoozeDialog] = useState(false);
    const recurrenceTextFromApi = task.recurrenceText?.trim() || null;
    const recurrenceText =
        recurrenceTextFromApi ??
        (task.executionfrequency
            ? `Reoccurs every ${task.executionfrequency.toLowerCase()} on C+5`
            : 'Reoccurs every month on C+5');

    const nextRecurrenceDate = React.useMemo(() => {
        if (!task.isreccuring) return null;
        if (!task.nextRecurrenceDate) return null;
        const d = new Date(task.nextRecurrenceDate);
        if (isNaN(d.getTime())) return null;
        return normalizeToNoon(d);
    }, [task.isreccuring, task.nextRecurrenceDate]);

    const isWarningState =
        !!task.isreccuring &&
        !!selectedDate &&
        !!nextRecurrenceDate &&
        normalizeToNoon(selectedDate).getTime() > nextRecurrenceDate.getTime();

    useEffect(() => {
        const onDocPointerDown = (ev: PointerEvent) => {
            if (!busyRef.current) return;
            const t = ev.target as HTMLElement;
            const inTrigger = !!t.closest('[data-kebab-trigger="true"]');
            const inMenu = !!t.closest('[role="menu"],[role="menuitem"]');
            const inSnoozeDialog = !!t.closest(`.${styles.snoozdialog}`);
            const inIgnoreDialog = !!t.closest(`.${styles.ignoreDialog}`);

            if (!inTrigger && !inMenu && !inSnoozeDialog && !inIgnoreDialog) {
                setTimeout(() => {
                    setIsKebabBusy?.(false);
                    busyRef.current = false;
                }, 0);
            }
        };

        document.addEventListener('pointerdown', onDocPointerDown, true);
        return () => document.removeEventListener('pointerdown', onDocPointerDown, true);
    }, [setIsKebabBusy, styles.snoozdialog, styles.ignoreDialog]);

    const handleUnsnooze = () => {
        setShowUnsnoozeDialog(true);
    };

    const handleremoveIgnore = () => {
        setShowDeleteIgnoreDialog(true);
    };

    const confirmUnsnooze = async () => {
        try {
            setIsKebabBusy?.(true);
            busyRef.current = true;

            await manageToDoDetails({
                TODOId: task.id,
                ActionType: 'Unsnooze',
                NewDueDate: null,
                IgnoreTill: null,
                ignorenumber: null,
            });
            showSuccessToast('Unsnoozed successfully');
            window.dispatchEvent(new CustomEvent('todo:refresh'));
            dispatch(fetchToDoFilters());
            dispatch(fetchSnoozedTodos());

            // If you also want to refresh the main list (same pattern you already use)
            dispatch(
                fetchToDos({
                    toolName: null,
                    priorityName: null,
                    dueDate: null,
                    startDueDate: null,
                    endDueDate: null,
                }),
            );
            setShowDeleteIgnoreDialog(false);
            setShowUnsnoozeDialog(false);
            onActionComplete?.('Unsnooze');
        } catch (e) {
            logError(e);
            showErrorToast('Failed to unsnooze. Please try again.');
        } finally {
            setIsKebabBusy?.(false);
            busyRef.current = false;
        }
    };

    const confirmIgnore = async () => {
        try {
            setIsKebabBusy?.(true);
            busyRef.current = true;

            await manageToDoDetails({
                TODOId: task.id,
                ActionType: 'RemoveIgnore',
                NewDueDate: null,
                IgnoreTill: null,
                ignorenumber: null,
            });
            showSuccessToast('Ignored successfully');
            window.dispatchEvent(new CustomEvent('todo:refresh'));
            dispatch(fetchToDoFilters());
            dispatch(
                fetchIgnoredTodos({
                    toolName: null,
                    priorityName: null,
                    dueDate: null,
                    startDueDate: null,
                    endDueDate: null,
                }),
            );

            // If you also want to refresh the main list (same pattern you already use)
            dispatch(
                fetchToDos({
                    toolName: null,
                    priorityName: null,
                    dueDate: null,
                    startDueDate: null,
                    endDueDate: null,
                }),
            );
            setShowDeleteIgnoreDialog(false);
            onActionComplete?.('Ignore');
        } catch (e) {
            logError(e);
            showErrorToast('Failed to Ignore. Please try again.');
        } finally {
            setIsKebabBusy?.(false);
            busyRef.current = false;
        }
    };

    const handleCancel = () => {
        setShowDialog(false);
        setSelectedDate(null);
        setIsKebabBusy?.(false);
        busyRef.current = false;
    };

    const handleSnooze = async () => {
        if (!selectedDate || isWarningState) return;
        try {
            setisSnoozedLoading(true);
            await manageToDoDetails({
                TODOId: task.id,
                ActionType: 'Snooze',
                NewDueDate: selectedDate,
            });

            showSuccessToast(
                `Snoozed to ${selectedDate.toLocaleDateString('en-GB', {
                    day: '2-digit',
                    month: 'short',
                    year: 'numeric',
                })}`,
            );

            setShowDialog(false);
            onActionComplete?.('Snooze');
            window.dispatchEvent(new CustomEvent('todo:refresh'));
            window.dispatchEvent(
                new CustomEvent('todo:snoozed', {
                    detail: { id: task.id, newDueDate: selectedDate },
                }),
            );
            dispatch(
                fetchToDos({
                    toolName: null,
                    priorityName: null,
                    dueDate: null,
                    startDueDate: null,
                    endDueDate: null,
                }),
            );
            dispatch(fetchToDoFilters());
        } catch (error) {
            logError(error);
            showErrorToast('Snooze failed. Please try again.');
        } finally {
            setIsKebabBusy?.(false);
            busyRef.current = false;
            setisSnoozedLoading(false);
        }
    };

    const handleIgnore = async () => {
        if (!task) return;

        const monthsToAdd = parseInt(ignorePeriod.split(' ')[0] || '1', 10);
        const currentDate = new Date();
        currentDate.setMonth(currentDate.getMonth() + monthsToAdd);

        const payload = {
            TODOId: task.id,
            ActionType: 'Ignore' as const,
            IgnoreTill: currentDate,
            NewDueDate: null,
            ignorenumber: null,
        };

        try {
            setIsKebabBusy?.(true);
            await manageToDoDetails(payload);

            const asText = currentDate.toLocaleDateString('en-GB', {
                day: '2-digit',
                month: 'short',
                year: 'numeric',
            });
            showSuccessToast(`Ignored until ${asText}`);

            setShowIgnoreDialog(false);
            setIgnorePeriod('1 Month(s)');
            onActionComplete?.('Ignore');
            window.dispatchEvent(new CustomEvent('todo:refresh'));
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
            logError(error);
            showErrorToast('Failed to ignore. Please try again.');
        } finally {
            setIsKebabBusy?.(false);
            busyRef.current = false;
        }
    };

    const handleSideMenuOptionSelect = async (option: any) => {
        setIsKebabBusy?.(true);
        busyRef.current = true;
        //  SETTINGS MODE LOGIC
        if (origin === 'settingsSnoozed') {
            if (option.value === 'unsnooze') {
                handleUnsnooze();
            }
            return;
        }

        if (origin === 'settingsIgnored') {
            if (option.value === 'removeFromIgnore') {
                handleremoveIgnore();
            }
            return;
        }
        //  DEFAULT MODE (existing behavior)
        if (option.value === 'snooze') {
            setSelectedDate(null);
            setShowDialog(true);
        } else if (option.value === 'incorrectAssignment') {
            try {
                await manageToDoDetails({
                    TODOId: task.id,
                    ActionType: 'IncorrectAssignment',
                });
                window.dispatchEvent(new CustomEvent('todo:refresh'));
                onActionComplete?.('IncorrectAssignment');
            } catch (error) {
                logError(error);
            } finally {
                setIsKebabBusy?.(false);
                busyRef.current = false;
                dispatch(
                    fetchToDos({
                        toolName: null,
                        priorityName: null,
                        dueDate: null,
                        startDueDate: null,
                        endDueDate: null,
                    }),
                );
            }
        } else if (option.value === 'ignore') {
            setShowIgnoreDialog(true);
        }
    };

    const handleSnoozeDateSelect = (date: string) => {
        const parsedDate = new Date(date);
        parsedDate.setHours(12, 0, 0, 0);
        setSelectedDate(parsedDate);
    };

    const buildFilterChips = (task: IToDoDetails) => {
        const chips: { label: string }[] = [];
        const attrs = Array.isArray(task.attributes) ? (task.attributes as any[]) : [];

        const countryAttr = attrs.find(a => typeof a === 'object' && a && 'countryCode' in a);
        const countryCode: string | undefined = (countryAttr as any)?.countryCode;

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

            const rootId = (carrier as any)?.rootId as string | undefined;
            const rootIdDescription = (carrier as any)?.rootIdDescription as string | undefined;
            const customerId = (carrier as any)?.customerId as string | undefined;
            const customerIdDescription = (carrier as any)?.customerIdDescription as
                | string
                | undefined;

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
                attrs.forEach((a: any) => {
                    if (a?.displayName) chips.push({ label: a.displayName });
                });
            }
            return chips;
        }

        if (countryCode === 'BR') {
            const carrier =
                attrs.find(
                    (a: any) =>
                        typeof a === 'object' && a && ('gmcGrouping' in a || 'channel' in a),
                ) || countryAttr;

            const gmcGrouping = (carrier as any)?.gmcGrouping as string | undefined;
            const channel = (carrier as any)?.channel as string | undefined;

            if (gmcGrouping) chips.push({ label: gmcGrouping });
            if (channel) chips.push({ label: channel });

            if (countryCode) {
                chips.push({ label: `${countryCode}` });
            }
            if (chips.length === 0) {
                attrs.forEach((a: any) => {
                    if (a?.displayName) chips.push({ label: a.displayName });
                });
            }
            return chips;
        }

        attrs.forEach((a: any) => {
            if (a?.displayName) chips.push({ label: a.displayName });
        });

        return chips;
    };

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
                return <LowPriorityIcon />;
        }
    };

    const snoozeDialog = () => {
        return (
            <Flex className={styles.dialogContent}>
                <div className={styles.calendarCol}>
                    <div ref={parentRef}></div>
                    <div className="snooze-dialog-scope">
                        <FiscalCalendar
                            disablePastOrFutureDate={{ pastDate: new Date() }}
                            showPicker={true}
                            setShowPicker={() => {}}
                            className={styles.calendarInline}
                            id="snooze-calendar"
                            parentRef={parentRef}
                            showDay
                            currentDate={selectedDate ? new Date(selectedDate) : new Date()}
                            onDateSelect={handleSnoozeDateSelect}
                            paddingToPreventOverflow={0}
                            useReactPortal={false}
                            hideFiscalToggle={true}
                        />
                    </div>
                </div>
                <div className={styles.detailsWrapper}>
                    <h3 className={styles.title}>Snooze</h3>
                    <p className={styles.description}>
                        Snooze tasks to complete them at a later date.
                    </p>

                    <div className={styles.taskCard}>
                        <div className={styles.taskHeaderRow}>
    <div className={styles.titleBlock}>
        <div className={`${styles.taskTitle} ${styles.taskTitleClamp}`}>
           {task.title}
        </div>

        <div className={styles.todoSubtitle}>
            {task.source && <span>{task.source} | {task.moduleName}</span>}
            {task.source && task.issueSectionName && <span> | </span>}
            {task.issueSectionName && <span>{task.issueSectionName}</span>}
        </div>
    </div>

    {/* ✅ Icons MUST stay here */}
    <div className={styles.taskIcons}>
        {task.isreccuring && (
            <Icon name="repeat-03" size="l" color="neutrals-B80" />
        )}
        {renderPriorityIcon()}
    </div>
</div>

                        {(() => {
                            const footerChips = buildFilterChips(task);
                            if (!footerChips.length) return null;
                            return (
                                <div
                                    className={styles.attributesRow}
                                    style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}
                                >
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
                                </div>
                            );
                        })()}
                    </div>

                    {task.isreccuring && (
                        <div className={styles.recurrenceText}>{recurrenceText}</div>
                    )}

                    <div className={styles.dueDateLine}>
                        <span className={styles.dueLabel}>Current Due Date :</span>{' '}
                        <span className={styles.dueValue}>
                            {new Date(task.dueDate).toLocaleDateString('en-GB', {
                                day: '2-digit',
                                month: 'short',
                                year: 'numeric',
                            })}
                        </span>
                    </div>

                    {selectedDate && (
                        <div
                            className={
                                isWarningState ? styles.newDueDateLineError : styles.newDueDateLine
                            }
                        >
                            New Due Date :{' '}
                            <span
                                className={
                                    isWarningState ? styles.newDueValueError : styles.newDueValue
                                }
                            >
                                {selectedDate.toLocaleDateString('en-GB', {
                                    day: '2-digit',
                                    month: 'short',
                                    year: 'numeric',
                                })}
                            </span>
                        </div>
                    )}

                    {isWarningState && (
                        <div className={styles.warningText}>
                            You cannot snooze this to-do beyond its next recurrence date.
                        </div>
                    )}
                    <div className={styles.footer}>
                        <Button text="Cancel" variant="Secondary" onClick={handleCancel} />
                        <Button
                            text="Snooze"
                            loading={isSnoozedLoading}
                            onClick={handleSnooze}
                            disabled={!selectedDate || isWarningState}
                        />
                    </div>
                </div>
            </Flex>
        );
    };

    const ignoreDialog = () => {
        const nextTodoDate = new Date();
        nextTodoDate.setMonth(nextTodoDate.getMonth() + parseInt(ignorePeriod));

        return (
            <Flex className={styles.dialogContent}>
                <div className={styles.detailsWrapper}>
                    <h3 className={styles.title}>Ignore To-Do</h3>
                    <p className={styles.description}>
                        Select the period until which you want to ignore this to-do. The to-do will
                        not appear again until the selected cycle.
                    </p>
                    <div className={styles.taskCard}>
                        <div className={styles.taskHeaderRow}>
                            <div className={styles.titleBlock}>
                                <div className={`${styles.taskTitle} ${styles.taskTitleClamp}`}>
                                    {task.title}
                                </div>

                                <div className={styles.todoSubtitle}>
                                    {task.source && <span>{task.source} | {task.moduleName}</span>}
                                    {task.source && task.issueSectionName && <span> | </span>}
                                    {task.issueSectionName && <span>{task.issueSectionName}</span>}
                                </div>
                            </div>

                            <div className={styles.taskIcons}>
                                {task.isreccuring && (
                                    <Icon name="repeat-03" size="l" color="neutrals-B80" />
                                )}
                                {renderPriorityIcon()}
                            </div>
                        </div>

                        {(() => {
                            const chips = buildFilterChips(task);
                            if (!chips.length) return null;

                            return (
                                <div
                                    className={styles.attributesRow}
                                    style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}
                                >
                                    {chips.map((chip, i) => (
                                        <FilterChip
                                            key={`ignore-chip-${i}`}
                                            label={chip.label}
                                            tooltipText={chip.label}
                                            showTooltip={true}
                                            showCloseIcon={false}
                                            size="large"
                                            charLimit={60}
                                            className="chip-width"
                                        />
                                    ))}
                                </div>
                            );
                        })()}
                    </div>
                    <div className={styles.ignoreUntil}>
                        <label className={styles.label}>Ignore Until</label>
                        <select
                            className={styles.dropdown}
                            value={ignorePeriod}
                            onChange={e => setIgnorePeriod(e.target.value)}
                        >
                            {Array.from({ length: 12 }, (_, i) => (
                                <option key={i} value={`${i + 1} Month(s)`}>
                                    {i + 1} Month(s)
                                </option>
                            ))}
                        </select>
                    </div>
                    <div className={styles.nextTodo}>
                        <Icon name="info-circle" size="m" /> Next to-do will be generated on:{' '}
                        {nextTodoDate.toLocaleDateString('en-GB', {
                            day: '2-digit',
                            month: 'short',
                            year: 'numeric',
                        })}
                    </div>
                </div>
            </Flex>
        );
    };

    const showIncorrectAssignment = false;

const menuOptions =
    origin === 'settingsIgnored'
        ? [{ label: 'Remove from ignore', value: 'removeFromIgnore' }]
        : origin === 'settingsSnoozed'
          ? [{ label: 'Unsnooze', value: 'unsnooze' }]
          : [
                ...(showIncorrectAssignment
                    ? [
                          {
                              label: 'Incorrect Assignment',
                              value: 'incorrectAssignment',
                          },
                      ]
                    : []),
                { label: 'Snooze', value: 'snooze' },
                { label: 'Ignore', value: 'ignore' },
            ];
    return (
        <>
            <div className={styles.actionmenu}>
                <SideMenu
                    action={
                        <div
                            className={styles.kebabCircle}
                            data-kebab-trigger="true"
                            onMouseDown={() => {
                                setIsKebabBusy?.(true);
                                busyRef.current = true;
                            }}
                            onPointerDown={() => {
                                setIsKebabBusy?.(true);
                                busyRef.current = true;
                            }}
                        >
                            <Icon color="neutrals-B800" name="dots-vertical" size="xm" />
                        </div>
                    }
                    onOptionSelect={handleSideMenuOptionSelect}
                    options={menuOptions}
                />
            </div>
            {origin === 'default' && (
                <>
                    <Dialog
                        className={styles.snoozdialog}
                        title=""
                        content={snoozeDialog()}
                        isOpen={showDialog}
                        onClose={() => {
                            setShowDialog(false);
                            setSelectedDate(null);
                            setIsKebabBusy?.(false);
                            busyRef.current = false;
                        }}
                        customWidth={672}
                        hideFooter
                        hideHeader
                        showCloseIcon={false}
                        primaryButtonText=""
                        onPrimaryButtonClick={() => {}}
                    />
                    <Dialog
                        className={styles.ignoreDialog}
                        title=""
                        content={ignoreDialog()}
                        isOpen={showIgnoreDialog}
                        onClose={() => {
                            setShowIgnoreDialog(false);
                            setIsKebabBusy?.(false);
                            busyRef.current = false;
                        }}
                        hideHeader
                        showCloseIcon={false}
                        primaryButtonText="Ignore"
                        secondaryButtonText="Cancel"
                        onPrimaryButtonClick={handleIgnore}
                        onSecondaryButtonClick={() => {
                            setShowIgnoreDialog(false);
                            setIsKebabBusy?.(false);
                            busyRef.current = false;
                        }}
                    />
                </>
            )}
            {toastConfig.visible && (
                <Toast
                    distance="x5l"
                    className="toast-configuration" // you already have this in common.scss
                    message={toastConfig.message}
                    mode="Top Right"
                    onCloseToast={closeToast}
                    toggle
                    type={toastConfig.type}
                    timer={5000}
                />
            )}
            <UnsnoozeDialog
                isOpen={showUnsnoozeDialog}
                onClose={() => setShowUnsnoozeDialog(false)}
                onConfirm={confirmUnsnooze}
            />
            <IgnoreDialogDelete
                isOpen={showDeleteIgnoreDialog}
                onClose={() => setShowDeleteIgnoreDialog(false)}
                onConfirm={confirmIgnore}
            />
        </>
    );
};

export default ToDoKababMenu;
