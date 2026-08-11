import { IToDoDetails } from '../../../types/response';

type GroupKey =
    | 'Older'
    | 'last 30 days'
    | 'last 7 days'
    | 'Yesterday'
    | 'Today'
    | 'Tomorrow'
    | 'This week'
    | 'Next week'
    | 'Later';

const priorityOrder: Record<string, number> = {
    Critical: 1,
    High: 2,
    Medium: 3,
    Low: 4,
};

export const groupTasksByDueDate = (tasks: IToDoDetails[], sortOrder: 'asc' | 'desc') => {
    const groups: Record<GroupKey, IToDoDetails[]> = {
        Older: [],
        'last 30 days': [],
        'last 7 days': [],
        Yesterday: [],
        Today: [],
        Tomorrow: [],
        'This week': [],
        'Next week': [],
        Later: [],
    };

    const currentDate = new Date();
    currentDate.setHours(0, 0, 0, 0);

    const sortedTasks = [...tasks].sort((a, b) => {
        const dateA = new Date(a.dueDate).getTime();
        const dateB = new Date(b.dueDate).getTime();
        const sortDirection = sortOrder === 'asc' ? -1 : 1; // Inverted logic

        if (dateA !== dateB) {
            return (dateA - dateB) * sortDirection;
        }

        const priorityA = priorityOrder[a.priority] || 5;
        const priorityB = priorityOrder[b.priority] || 5;
        if (priorityA !== priorityB) {
            return priorityA - priorityB;
        }

        return (a.title || '').localeCompare(b.title || '');
    });

    sortedTasks.forEach(task => {
        const taskDueDate = new Date(task.dueDate);
        if (taskDueDate.getTime() === 0) return;

        taskDueDate.setHours(0, 0, 0, 0);

        const diffTime = taskDueDate.getTime() - currentDate.getTime();
        const diff = Math.floor(diffTime / (1000 * 60 * 60 * 24));

        const dayOfWeek = currentDate.getDay();
        const daysUntilEndOfWeek = 6 - dayOfWeek;
        const daysUntilStartOfNextWeek = daysUntilEndOfWeek + 1;
        const daysUntilEndOfNextWeek = daysUntilStartOfNextWeek + 6;

        if (diff <= -31) groups['Older'].push(task);
        else if (diff <= -8 && diff >= -30) groups['last 30 days'].push(task);
        else if (diff <= -2 && diff >= -7) groups['last 7 days'].push(task);
        else if (diff === -1) groups['Yesterday'].push(task);
        else if (diff === 0) groups['Today'].push(task);
        else if (diff === 1) groups['Tomorrow'].push(task);
        else if (diff >= 2 && diff <= daysUntilEndOfWeek) groups['This week'].push(task);
        else if (diff >= daysUntilStartOfNextWeek && diff <= daysUntilEndOfNextWeek)
            groups['Next week'].push(task);
        else {
            groups['Later'].push(task);
        }
    });

    const groupOrder: GroupKey[] =
        sortOrder === 'asc'
            ? [
                  'Later',
                  'Next week',
                  'This week',
                  'Tomorrow',
                  'Today',
                  'Yesterday',
                  'last 7 days',
                  'last 30 days',
                  'Older',
              ]
            : [
                  'Older',
                  'last 30 days',
                  'last 7 days',
                  'Yesterday',
                  'Today',
                  'Tomorrow',
                  'This week',
                  'Next week',
                  'Later',
              ];

    const sortedGroups: Record<GroupKey, IToDoDetails[]> = {} as Record<GroupKey, IToDoDetails[]>;

    groupOrder.forEach(groupKey => {
        sortedGroups[groupKey] = groups[groupKey];
    });

    return sortedGroups;
};
