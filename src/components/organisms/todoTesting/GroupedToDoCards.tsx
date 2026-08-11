import React from 'react';
import ToDoCard from './ToDoCard';
import styles from './ToDos.module.scss';
import { IToDoDetails } from '../../../types/response';

interface Props {
    groupedTasks: Record<string, IToDoDetails[]>;
    selectedId: string;
    onSelect: (task: IToDoDetails) => void;
    onFilterChange: (value: 'Open' | 'Overdue' | 'Completed') => void;
    /** NEW: id whose card must appear at the very top */
    highlightId?: string | null;
}

const GroupedToDoCards: React.FC<Props> = ({
    groupedTasks,
    selectedId,
    onSelect,
    onFilterChange, // (still passed through; used by ToDoCard)
    highlightId,
}) => {
    // Find the highlighted task from all groups once
    const allTasks: IToDoDetails[] = Object.values(groupedTasks).flat();
    const highlightedTask = highlightId
        ? allTasks.find(t => String(t.id) === String(highlightId))
        : undefined;

    return (
        <div className={styles['cards-wrapper']}>
            {/* --- TOP SECTION: highlighted card --- */}
            {highlightedTask && (
                <div className={styles['highlighted-section']}>
                    <ToDoCard
                        key={`highlight-${highlightedTask.id}`}
                        task={highlightedTask}
                        selected={String(highlightedTask.id) === String(selectedId)}
                        onSelect={() => onSelect(highlightedTask)}
                        onFilterChange={onFilterChange}
                    />
                </div>
            )}

            {/* --- Grouped lists: exclude highlighted to avoid duplication --- */}
            {Object.entries(groupedTasks).map(([groupName, tasks]) =>
                tasks.length > 0 ? (
                    <div key={groupName} className={styles.cardContainer}>
                        <div className={styles['taskCardtitle']}>{groupName}</div>
                        {tasks
                            .filter(t => String(t.id) !== String(highlightId))
                            .map(task => (
                                <ToDoCard
                                    key={task.id}
                                    task={task}
                                    selected={String(task.id) === String(selectedId)}
                                    onSelect={() => onSelect(task)}
                                    onFilterChange={onFilterChange}
                                />
                            ))}
                    </div>
                ) : null,
            )}
        </div>
    );
};

export default GroupedToDoCards;
