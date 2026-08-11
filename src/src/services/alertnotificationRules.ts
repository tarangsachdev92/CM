import type { INotiRuleAddUpdateRequest } from '../types/request';
import { deleteAPI, getAPI, postAPI } from './api';

export const getRuleValuebyRuleType = async (ruleType: string) => {
    const response = await getAPI(`api/notification/values-by-rule-type?ruleType=${ruleType}`);
    return response?.data?.data;
};

export const getRuleTypes = async () => {
    const response = await getAPI(`api/notification/rule-types`);
    return response?.data?.data;
};

export const getRuleDetailsById = async (id: number) => {
    const response = await getAPI(`api/notification/rule-details-by-id?ruleId=${id}`);
    return response?.data?.data;
};

export const saveRule = async (payload: INotiRuleAddUpdateRequest) => {
    const response = await postAPI(`api/notification/rule-details`, payload);
    return response;
};

export const toggleRuleDetail = async (
    ruleId: number,
): Promise<{ data: string; statusCode: number; message: null | string }> => {
    const response = await postAPI(`api/notification/toggle-rule-detail?ruleId=${ruleId}`, {});
    return response.data;
};

export const deleteRuleById = async (
    ruleId: number,
): Promise<{ data: string; statusCode: number; message: null | string }> => {
    const response = await deleteAPI(`api/notification/rule?ruleId=${ruleId}`, {});
    return response?.data;
};

export const deleteNotificationByIdAndType = async (
    id: number,
    type: string,
    isGenericNotification: boolean,
): Promise<{ data: string; statusCode: number; message: null | string }> => {
    const response = await deleteAPI(
        `api/notification/remove-notification?id=${id}&type=${type}&isGenericNotification=${isGenericNotification}`,
        {},
    );
    return response.data;
};



export const notificationMarkAsRead = async (id: number,type:string,isGenericNotification:boolean) => {
    const response = await postAPI(`api/notification/mark-as-read?id=${id}&notificationType=${type}&isGenericNotification=${isGenericNotification}`,{});
    return response?.data?.data;
};


export const manageNotifications = async (
    markAllRead: boolean | null,
    clearAllRead: boolean | null,
): Promise<{ data: string; statusCode: number; message: null | string }> => {
    const response = await postAPI(`api/notification/manage-notification-action`, {
        markAllRead,
        clearAllRead,
    });
    return response?.data;
};

