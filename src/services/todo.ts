import { logError } from '../utils/helpers';
import { postAPI } from './api';

export const updateToDoStatus = async (payload: { id: number; isCompleted: boolean }) => {
    const response = await postAPI(
        //`api/todo/update-todo-status?id=${payload.id}&isCompleted=${payload.isCompleted}`,
        `api/todo/update-Newtodo-status?id=${payload.id}&isCompleted=${payload.isCompleted}`,
        {},
    );

    return response.data;
};

export const manageToDoDetails = async (payload: {
    TODOId: number;
    ActionType?:
        | 'MarkComplete'
        | 'IncorrectAssignment'
        | 'Snooze'
        | 'Ignore'
        | 'RemoveIgnore'
        | 'Unsnooze';
    NewDueDate?: Date | null;
    IgnoreTill?: Date | null;
    ignorenumber?: string | null;
}): Promise<{ data: any; statusCode: number; message: string }> => {
    const refinedPayload = {
        ...payload,
        NewDueDate: payload.NewDueDate ? new Date(payload.NewDueDate).toISOString() : null,
        IgnoreTill: payload.IgnoreTill ? new Date(payload.IgnoreTill).toISOString() : null,
        ignorenumber: payload.ignorenumber ?? null,
    };

    try {
        const response = await postAPI(`/api/todo/manage-todo-details`, refinedPayload);
        return response.data;
    } catch (error) {
        logError('Error updating action status:', error);
        throw error;
    }
};

export const updateToDoComments = async (payload: {
    toDoId: number;
    commentText: string;
}): Promise<{ data: any; statusCode: number; message: string }> => {
    // Normalize payload to the expected contract
    const refinedPayload = {
        ToDoId: payload.toDoId,
        CommentText: payload.commentText?.trim() ?? '',
    };

    try {
        const response = await postAPI(`/api/todo/save-todocomment`, refinedPayload);
        return response.data;
    } catch (error) {
        logError('Error saving to-do comment:', error);
        throw error;
    }
};
