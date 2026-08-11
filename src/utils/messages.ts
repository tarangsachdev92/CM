export const MESSAGES = {
    SUCCESS_TEAMS_CHAT: (IssueTitle: string, teamsUrl: string): string => `Teams chat created successfully. 
    Please open teams and search with the title '${IssueTitle}'. 
    ${teamsUrl}${IssueTitle}`,

    ERROR_DUPLICATE_TEAMS_CHAT: (issueId: number): string =>
        `Teams chat already exists for '#${issueId}'`,

    ERROR_TEAMS_CHAT: (): string =>
        `Error while creating Teams chat. Please try again.`,

    SCR_TEMPLATE_SUCCESS : (isGenerated: boolean) : string => 
        `${isGenerated?'SCR Template removed successfully':'SCR Template Generated successfully'}`,
    
     SCR_TEMPLATE_ERROR : (isGenerated: boolean) : string => 
        `${isGenerated?'Error while  removing SCR Template ':'Error while  generating SCR Template'}`,
     
     REMOVAL_SUCCESS_MESSAGE: (type: 'Notification'|'Notice' | 'Alert' | 'Warning'): string =>
        `${type} removed successfully`,
     
     REMOVAL_ERROR_MESSAGE : (type: 'Notification'|'Notice' | 'Alert' | 'Warning'): string =>
        `Unable to remove ${type} `,
     MARK_ALL_READ_SUCCESS_MESSAGE: (): string=> 'All notifications marked as read.',
     MARK_ALL_READ_ERROR_MESSAGE: (): string=> 'Failed to mark notifications as read.',
     CLEAR_ALL_READ_SUCCESS_MESSAGE: (): string=> 'All read notifications are cleared.',
     CLEAR_ALL_READ_ERROR_MESSAGE: (): string=> 'Failed to clear read notifications.',


    } as const;
