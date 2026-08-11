import React, { useLayoutEffect, useRef, useState } from 'react';
import styles from './ExceptionCard.module.scss';
import { ToolTip2 } from 'konnect-react-components';
import {
    CriticalPriorityIcon,
    HighPriorityIcon,
    MediumPriorityIcon,
    LowPriorityIcon,
    CompletedActionIcon,
    InProgressActionIcon,
    NotStartedActionIcon,
    OverDueActionIcon,
} from '../../../../assets/images/images';
import type { RawExceptionItem, RawActionStatus } from '../../../../../src/types/response';

const truncateText = (text: string, maxLength: number): string =>
    text.length > maxLength ? `${text.slice(0, maxLength)}...` : text;

export const stripHtmlToText = (html: string): string => {
    if (!html) return '';
    const div = document.createElement('div');
    div.innerHTML = html;
    const text = div.textContent || div.innerText || '';
    return text.replace(/\s+/g, ' ').trim();
};


const formatDate = (date: string): string => {
    const parsed = new Date(date);
    if (!date || isNaN(parsed.getTime())) return 'N/A';
    return new Intl.DateTimeFormat('en-GB', {
        day: '2-digit',
        month: 'short',
        year: 'numeric',
    }).format(parsed);
};


const Divider: React.FC = () => <div className={styles.divider} />;

const PriorityIcon: React.FC<{ type: string }> = ({ type }) => {
    switch (type) {
        case 'Critical':
            return <CriticalPriorityIcon />;
        case 'High':
            return <HighPriorityIcon />;
        case 'Medium':
            return <MediumPriorityIcon />;
        case 'Low':
        default:
            return <LowPriorityIcon />;
    }
};

const ActionStatusIcon: React.FC<{ status: string }> = ({ status }) => {
    switch (status) {
        case 'Overdue':
            return <OverDueActionIcon />;
        case 'Not Started':
            return <NotStartedActionIcon />;
        case 'In Progress':
            return <InProgressActionIcon />;
        case 'Completed':
            return <CompletedActionIcon />;
        default:
            return null;
    }
};

const ActionStatusTooltips: React.FC<{ actions: RawActionStatus[]; max: number }> = ({
    actions,
    max,
}) => {
    const visible = actions.slice(0, max);
    const extra = actions.length - max;

    return (
        <div className={styles['action-main-container']}>
            <div className={styles['action-status-container']}>
                {visible.map((item, index) => (
                    <ToolTip2
                        key={`${item.owner}-${item.dueDate}-${item.actionStatus}-${index}`}
                        direction="Bottom-Center"
                        type="HTML Content"
    // or appendToBody / portalContainer
  zIndex={6000}

                        outerContainerClass={`${styles['expanded-row-tooltip-container']} ${styles[`tooltip-pos-${index}`]}`}
                        htmlContent={
                            <>
                                <div className={styles['tooltip-desc-text']}>
                                    Owner:{' '}
                                    <span className={styles['tooltip-desc-text-value']}>
                                        {item.owner ?? 'Unassigned'}
                                    </span>
                                </div>
                                <div className={styles['tooltip-desc-text']}>
                                    Status:{' '}
                                    <span className={styles['tooltip-desc-text-value']}>
                                        {item.actionStatus ?? 'Pending'}
                                    </span>
                                </div>
                                <div className={styles['tooltip-desc-text']}>
                                    Log Date:{' '}
                                    <span className={styles['tooltip-desc-text-value']}>
                                        {formatDate(item.logDate ?? '')}
                                    </span>
                                </div>
                                <div className={styles['tooltip-desc-text']}>
                                    Due Date:{' '}
                                    <span className={styles['tooltip-desc-text-value']}>
                                        {formatDate(item.dueDate ?? '')}
                                    </span>
                                </div>
                            </>
                        }
                        wrapperComponent={<ActionStatusIcon status={item.actionStatus ?? ''} />}
                    />
                ))}
                {extra > 0 && (
                    <>
                        <div className={styles['extra-dash-circle']}></div>
                        <div className={styles['extra-action-count']}>+{extra}</div>
                    </>
                )}
            </div>
        </div>
    );
};

interface Props {
    exception: RawExceptionItem;
    onCardClick: () => void;  
    contextType: 'Issues' | 'Risks' | 'Opportunities';
}

const ExceptionCard: React.FC<Props> = ({
    exception,
    onCardClick,
    contextType,
}) => {
    const title = truncateText(exception.title, 30);
    const description = 'issueDescription' in exception
        ? stripHtmlToText(exception.riskDescription ?? '')
        : stripHtmlToText(exception.riskDescription ?? '');

    const descRef = useRef<HTMLSpanElement | null>(null);
    const [isClamped, setIsClamped] = useState(false);

    useLayoutEffect(() => {
        const el = descRef.current;
        if (!el) return;

        const check = () => setIsClamped(el.scrollHeight > el.clientHeight + 1);
        check();

        const ro = new ResizeObserver(check);
        ro.observe(el);
        return () => ro.disconnect();
    }, [description]);

    
const idLabel =
    contextType === 'Issues'
      ? 'Issue ID'
      : contextType === 'Risks'
      ? 'Risk ID'
      : 'Opportunity ID';

const displayedId =
  (contextType === 'Issues'
    ? (exception as any).issueId
    : contextType === 'Risks'
    ? (exception as any).riskId
    : (exception as any).opportunityId) ??
  (exception as any).exceptionId ??
  (exception as any).id ??
  'N/A';

    return (
        <div className={styles.card} role="button" tabIndex={0} onClick={onCardClick}>
            <div className={styles.topSection}>
                <div className={styles.header}>
                    {title}
                    <PriorityIcon type={exception.priority} />
                </div>

                <div className={styles.id}>
                  
  {`${idLabel} #${displayedId ?? 'N/A'}`}
  {exception.probability && (
    <span> .  Probability {exception.probability}</span>
  )}

                </div>

                <div>
                    <div className={`${styles.descriptionWrap} ${isClamped ? styles.isClamped : ''}`}>
                        <span ref={descRef} className={styles.descriptionText} title={description}>
                            {description}
                        </span>
                    </div>
                </div>
            </div>
            <Divider />
            <div className={styles.footer}>
                <div className={styles.actionTooltips}>
                    <ActionStatusTooltips actions={exception.actionStatus} max={4} />
                </div>
                <span className={styles.actionTag}>{exception.decisionStatus ?? 'N/A'}</span>
            </div>
        </div>
    );
};
export default ExceptionCard;
