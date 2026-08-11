export const ISSUE_ACTIVITY_MESSAGES = {
    NEW_ISSUE_LOGGED: (): string => 'logged the issue.',
    //Actions Tab
    ADD_NEW_ACTION:(title:string):string=>`added <strong>Action</strong> “${title}”.`,
    CHANGE_ACTION_STATUS:(title:string,status:string):string=>`updated <strong>Action Status</strong> to <strong>${status}</strong> for action “${title}”.`,
    ADD_ACTION_COMMENT:(title:string):string=>
        `added a <strong>comment</strong> for action “${title}”`,
    REMOVE_ACTION:(title:string):string=>
        `removed <strong>Action</strong> “${title}”.`,    
    CHANGE_DECISION_STATUS:(decisionStatus:string)=>
        `changed the <strong>Decision Status</strong> to <strong>“${decisionStatus}”</strong>`,
    ASSIGN_USER:(user:string,section:string)=>
        `assigned <strong>${user}</strong> to <strong>${section}</strong> section.`,
    UPDATE_COMPLICATION_SECTION:()=>'updated the <strong>Complication</strong> section.',
    UPDATE_SITUATION_SECTION:()=>'updated the <strong>Situation</strong> section.',
    ADD_RECOM:(recoTitle:string)=> `added <Strong>Recommendation</strong> “${recoTitle}”.`,
    UPDATE_RECOM:(recoTitle:string)=> `updated <Strong>Recommendation</strong> “${recoTitle}”.`,
    MARK_FINAL_RES:(recoTitle:string)=> `selected <strong>Final Resolution</strong> “${recoTitle}”.`,    
    REMOVE_RECO:(recoTitle:string)=> `removed <strong>Recommendation</strong> “${recoTitle}”.`,
    ADD_RESOLUTION_COMMENT:(title:string):string=>
        `added a <strong>comment</strong> for resolution “${title}”`,
    CHANGE_ISSUE_TITLE:(title:string):string=>
        `updated the <strong>Issue Tittle</strong> to <strong>${title}</strong>.`,
    CHANGE_ISSUE_FUNCTION:(functionName:string)=>
         `updated the <strong>Function</strong> to <strong>${functionName}</strong>.`,
    CHANGE_ISSUE_SUBFUNCTION:(functionName:string)=>
         `updated the <strong>Sub-Function</strong> to <strong>${functionName}</strong>.`,
    CHANGE_ISSUE_CATEGORY:(category:string)=>
         `updated the <strong>Category</strong> to <strong>${category}</strong>.`,
    CHANGE_ISSUE_FORUM:(forum:string)=>
         `updated the <strong>Forum</strong> to <strong>${forum}</strong>.`,
    CHANGE_ISSUE_PRIORITY:(priority:string)=>
         `updated the <strong>Priority</strong> to <strong>${priority}</strong>.`,
    CHANGE_ISSUE_ESCALATED:(escalation:string)=>
         `updated the <strong>Escalation</strong> to <strong>${escalation}</strong>.`,
    CHANGE_ISSUE_TAGS_REMOVED:(tags:string)=>
         `removed the <strong>Tags</strong> <strong>${tags}</strong>.`,
    CHANGE_ISSUE_TAGS_ADDED:(tags:string)=>
         `added the <strong>Tags</strong> <strong>${tags}</strong>.`,
    CHANGE_ISSUE_TAGS_UPDATED:(tags:string)=>
         `updated the <strong>Tags</strong> to <strong>${tags}</strong>.`,
    CHANGE_BLOCKED_BY:(blockedby:string)=>
         `updated the <strong>Blocked by</strong> to <strong>${blockedby}</strong>.`,
     UPDATE_ACTION_DUE_DATE:(dueDate:string,title:string):string=>
        `updated <strong>Due Date</strong> to <strong>${dueDate}</strong> for action “${title}”.`, 
    UNSELECT_FINAL_RES:(recoTitle:string)=> `unselected <strong>Final Resolution</strong> “${recoTitle}”.`,    

       


} as const;
