export type Priority = 'Critical' | 'High' | 'Medium' | 'Low';

export interface Task {
    id: string;
    title: string;
    status: 'Open' | 'Overdue' | 'Completed';
    completedOn?: string | null;
    dueDate: string; // ISO date
    priority: Priority;
    assignee: string;
    source: string;
    description: string;
    isCompleted: boolean;
    subTitle: string;
}
