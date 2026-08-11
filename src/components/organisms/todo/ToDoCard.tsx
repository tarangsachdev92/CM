import React, { useEffect, useState } from 'react';
import styles from './ToDos.module.scss';
import { AppReportCard, CheckBox, Dialog, FilterChip } from 'konnect-react-components';
import { IToDoDetails } from '../../../types/response';
import { updateToDoStatus } from '../../../services/todo';
import { fetchToDos, AppDispatch } from '../../../store';
import { useDispatch } from 'react-redux';
import { logError, logWarning } from '../../../utils/helpers';

interface Props {
    task: IToDoDetails;
    onSelect: (task: IToDoDetails) => void;
    selected: boolean;
    onFilterChange: (value: 'Open' | 'Overdue' | 'Completed') => void;
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

const ToDoCard: React.FC<Props> = ({ task, onSelect, selected, onFilterChange }) => {
    const [isCompleted, setIsCompleted] = useState(task.completedOn !== null);
    const [showDialog, setShowDialog] = useState(false);
    const [pendingStatus, setPendingStatus] = useState<boolean | null>(null);
    const dispatch = useDispatch<AppDispatch>();

    const handleStatusUpdate = async (newStatus: boolean) => {
        try {
            const response = await updateToDoStatus({
                id: task.id,
                isCompleted: newStatus,
            });
            if (response?.statusCode == 200) {
                setIsCompleted(newStatus);
                await dispatch(
                    fetchToDos({
                        toolName: null,
                        priorityName: null,
                        dueDate: null,
                        startDueDate: null,
                        endDueDate: null,
                    }),
                );
            } else {
                logWarning(
                    'Update succeeded but returned unexpected status:',
                    response?.statusCode,
                );
            }
        } catch (error) {
            logError('Failed to update task status:', error);
        }
    };

    const handleConfirm = () => {
        if (pendingStatus !== null) {
            handleStatusUpdate(pendingStatus);
            if (pendingStatus === true) {
                onFilterChange('Completed');
            }
        }
        setShowDialog(false);
        setPendingStatus(null);
    };

    const handleCancel = () => {
        setShowDialog(false);
        setPendingStatus(null);
    };

    const checkboxChecked = showDialog && pendingStatus !== null ? pendingStatus : isCompleted;
    const footerChips = buildFilterChips(task);
    useEffect(() => {
        let style = document.querySelector('[data-type="todo-style"]');
        if (!style) {
            style = document.createElement('style');
            style.setAttribute('data-type', 'todo-style');
            style.innerHTML = `
                #todo-card .favorite-selectedIcon.active{
                    pointer-events: none;
                }
                .selected-filter-chip{
                    background: #fff;
                    padding-top: 0.2rem;
                    padding-bottom: 0.2rem;
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
            `;
            document.head.appendChild(style);
        }
        return () => {
            const existing = document.querySelector('[data-type="todo-style"]');
            if (existing) {
                existing.remove();
            }
        };
    });

    return (
        <div id="todo-card">
            <AppReportCard
                defaultIcon="circle"
                showReuseIcon={task.isreccuring ? true : false}
                customIcon={isCompleted ? 'check-square' : undefined}
                description={
                    <div style={{ color: '#575757' }}>
                        {/* {task.source} | {task.moduleName} */}
                        {task.subtitle}
                    </div>
                }
                fillColor
                onCardClick={() => onSelect(task)}
                selectedIcon={task.priority === 'Critical' ? 'flag' : 'flag-02'}
                selectedIconColor={
                    task.priority === 'Critical'
                        ? 'feedback-error-color'
                        : task.priority === 'High'
                          ? 'feedback-error-color'
                          : task.priority === 'Medium'
                            ? 'feedback-warning-color'
                            : task.priority === 'Low'
                              ? 'secondary-blue-300-color'
                              : 'secondary-blue-300-color'
                }
                size="Large"
                title={
  !isCompleted
    ? String(task.title)
    : ''
}
                subTitle={
                    !isCompleted ? (
                        ''
                    ) : (
                        <div>
                            <span style={{ color: '#949494' }}>{String(task.title)}</span>
                        </div>
                    )
                }
                type="App"
                className={`${styles.cardcontent} ${isCompleted ? styles.disabledcard : ''} ${
                    selected ? styles.selectedCard : ''
                }`}
                width="100%"
                showTopLeftLogo={true}
                logoAsHtml={
                    <div>
                        <CheckBox
                            checked={checkboxChecked}
                            onChange={(checked: boolean) => {
                                setPendingStatus(checked);
                                setShowDialog(true);
                            }}
                            aria-label="Open status dialog"
                            className={isCompleted ? styles.cursorblock : ''}
                        />
                    </div>
                }
                footer={
                    <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                        {footerChips.map((chip, idx) => (
                            <FilterChip
                                key={`filter-chip-dyn-${idx}`}
                                charLimit={60}
                                showTooltip={true}
                                showCloseIcon={false}
                                label={chip.label}
                                tooltipText={chip.label}
                                className="chip-width"
                            />
                        ))}
                    </div>
                }
            />
            <Dialog
                title={'Mark Complete'}
                content={`You are marking the to-do as complete. Click on “Mark Complete” to confirm this action.`}
                isOpen={showDialog}
                onClose={handleCancel}
                onPrimaryButtonClick={handleConfirm}
                onSecondaryButtonClick={handleCancel}
                primaryButtonText="Mark Complete"
                secondaryButtonText="To-do Pending"
            />
        </div>
    );
};

export default ToDoCard;
