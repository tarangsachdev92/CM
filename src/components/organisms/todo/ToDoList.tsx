import React, { useState, useEffect } from 'react';
import styles from './ToDos.module.scss';
import { Flex } from 'antd';
import { groupTasksByDueDate } from './groupUtils';
import GroupedToDoCards from './GroupedToDoCards';
import SelectedTaskDetails from './SelectedTaskDetails';
import { IToDoDetails } from '../../../types/response';
import { MyToDoEmptyState } from '../../../assets/images/images';
import { Label, Card } from '../../atoms';
import ToDoHeader from './ToDoHeader';
import { fetchToDos, AppDispatch } from '../../../store';
import { useDispatch } from 'react-redux';
import { AnimatedLoaders } from 'konnect-react-components';
import { useNavigate } from 'react-router-dom';

interface Props {
    tasks: IToDoDetails[];
    helpDisplay?: string;
    message?: string;
    onFilterChange: (value: 'Open' | 'Overdue' | 'Completed') => void;
    count?: number;
    sortOrder: 'asc' | 'desc';
    selectedIdFromUrl?: string | null;
}

const ToDoList: React.FC<Props> = ({
    tasks,
    helpDisplay = 'flex',
    message,
    onFilterChange,
    count,
    sortOrder,
    selectedIdFromUrl,
}) => {
    const [selectedId, setSelectedId] = useState<string>(''); // default to empty string
    const filteredTasks = tasks.filter(task => !task.isIncorrectAssignment);
    const groupedTasks = groupTasksByDueDate(filteredTasks, sortOrder);
    const [isLoading, setIsLoading] = useState<boolean>(false);

    const [selectedIdHighlight, setSelectedIdHighlight] = useState<string>(selectedIdFromUrl ?? '');

    const navigate = useNavigate();

    const handleSelect = (task: IToDoDetails) => {
        const taskId = String(task.id);
        setSelectedId(prevId => {
            const nextId = prevId === taskId ? '' : taskId;

            const params = new URLSearchParams(location.search);
            if (params.has('selectedId')) {
                navigate('/todo', { replace: true });
                setSelectedIdHighlight('');
            }

            return nextId;
        });
    };

    const clearSelection = () => setIsSelectionSnooze(true);
    const [IsSelectionSnooze, setIsSelectionSnooze] = useState<boolean>(false);

    useEffect(() => {
        setIsLoading(true);
        const allTaskIds = Object.values(groupedTasks)
            .flat()
            .map(task => String(task.id));

        if (selectedId && !allTaskIds.includes(selectedId) && IsSelectionSnooze) {
            const prevIndex = allTaskIds.indexOf(selectedId);
            const nextId = allTaskIds[prevIndex + 1] ?? allTaskIds[prevIndex - 1] ?? '';
            setSelectedId(nextId);
            setIsSelectionSnooze(false);
        }
        setIsLoading(false);
    }, [groupedTasks, selectedId]);

    const dispatch = useDispatch<AppDispatch>();
    useEffect(() => {
        if (selectedIdFromUrl) {
            setSelectedId(selectedIdFromUrl);
            dispatch(fetchToDos({ selectedId: selectedIdFromUrl }));
        } else {
            setSelectedIdHighlight('');
        }
    }, [selectedIdFromUrl]);

    return (
        <>
            {isLoading ? (
                <Card title={'TO-DO’s'} style={{ height: '70vh' }}>
                    <Flex className={styles['initial-loader-container']}>
                        <AnimatedLoaders id="initial-loader" type="page" />
                    </Flex>
                </Card>
            ) : (
                <>
                    {tasks.length > 0 ? (
                        <Flex
                            justify="space-between"
                            align="flex-start"
                            gap={16}
                            className={`${styles['card-border']} ${styles['card-mt-10']}`}
                        >
                            <Flex vertical flex={1} className={styles['taskCard']}>
                                <Flex vertical>
                                    <ToDoHeader count={count} />
                                </Flex>
                                <Flex vertical className={styles['taskCard-height']}>
                                    <GroupedToDoCards
                                        groupedTasks={groupedTasks}
                                        selectedId={selectedId}
                                        onSelect={handleSelect}
                                        onFilterChange={onFilterChange}
                                        highlightId={selectedIdHighlight}
                                    />
                                </Flex>
                            </Flex>

                            <Flex vertical flex={0} className={styles['taskDetails']}>
                                {selectedId !== '' && (
                                    <SelectedTaskDetails
                                        tasks={tasks}
                                        selectedId={selectedId}
                                        helpDisplay={helpDisplay}
                                        clearSelection={clearSelection}
                                    />
                                )}
                            </Flex>
                        </Flex>
                    ) : (
                        <div className={styles['empty-task-details-state']}>
                            <div className={styles['empty-image']}>
                                <MyToDoEmptyState />
                            </div>
                            <div className={styles['empty-state-message']}>
                                <Label type="body3">
                                    <span className={styles['card-children-content-text']}>
                                        {message}
                                    </span>
                                </Label>
                            </div>
                        </div>
                    )}
                </>
            )}
        </>
    );
};

export default ToDoList;
