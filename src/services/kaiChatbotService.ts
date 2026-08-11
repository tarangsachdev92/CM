import { getAPI } from "./api";

export const getSuggestedPromptForUser = async () => {
    const response = await getAPI(`api/kaichatbot/get-suggested-prompts`);
    return response.data.data;
};