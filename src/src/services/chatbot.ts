import { logError } from "../utils/helpers";
import { postAPI, AppService } from "./api";

export const postMessageToChatBot = async (payload: {
    conversationId: string, message: { role: string, content: string }, uiContext: {
        tenantId: string,
        geoLevel?: string,
        region?: string[],
        timePeriodLevel?: string,
        locale?: string,
        route?: string
    }
}) => {
    try {
        const response = await postAPI(
            `v1/conversations/${payload.conversationId}/turns`,
            {
                message: payload.message,
                uiContext: payload.uiContext,
            },
            AppService.CHATBOT
        );
        return response?.data;
    } catch (error) {
        logError('setToolActivity error : ', error);
        return error;
    }
};
