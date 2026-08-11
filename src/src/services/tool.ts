import { deleteAPI, postAPI } from './api';
import { logError } from '../utils/helpers';

export const deleteTool = async (payload: { toolId: number }) => {
    try {
        const response = await deleteAPI(
            `api/application/applications?toolId=${payload.toolId}`,
            {},
        );
        return response?.data?.data;
    } catch (error) {
        logError('deleteTool error : ', error);
        return error;
    }
};

export const setToolActivity = async (payload: { toolId: number; status: boolean }) => {
    try {
        const response = await postAPI(
            `api/application/set-tool-activeincative?toolId=${payload.toolId}&isActive=${payload.status}`,
            {},
        );
        return response?.data?.data;
    } catch (error) {
        logError('setToolActivity error : ', error);
        return error;
    }
};

