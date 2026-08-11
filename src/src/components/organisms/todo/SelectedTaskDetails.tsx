import React from 'react';
import TaskDetails from './TaskDetails';
import { IToDoDetails } from '../../../types/response';

interface Props {
    tasks: IToDoDetails[];
    selectedId: string;
    helpDisplay?: string;
    clearSelection: () => void;
}

const SelectedTaskDetails: React.FC<Props> = ({ tasks, selectedId, helpDisplay = 'flex', clearSelection }) => {
    const selectedTask = tasks.find(t => String(t.id) === selectedId);

    return (
        <div>{selectedTask && <TaskDetails task={selectedTask} helpDisplay={helpDisplay} clearSelection={clearSelection} />}</div>
    );
};

export default SelectedTaskDetails;
