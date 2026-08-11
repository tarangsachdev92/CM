 
declare module 'issueManagement/App' {
    const Component: React.ComponentType<any>;
    export default Component;
}

declare module 'dpmWrapper/dpm' {
    const Component: React.ComponentType<any>;
    export default Component;
}

declare module 'advancedForecasting/AFWrapper' {
    const Component: React.ComponentType<any>;
    export default Component;
}

declare module 'issueManagement/issueLogNewFlyout' {
    const Component: React.ComponentType<any>;
    export default Component;
}

declare module 'riskAndOpportunity/RiskAndOpportunityDetailsFlyout' {
    const Component: React.ComponentType<any>;
    export default Component;
}

declare module 'issueManagement/issueDetailsFlyout' {
    const Component: React.ComponentType<any>;
    export default Component;
}

declare module 'digitalWorker/App' {
    const Component: React.ComponentType<any>;
    export default Component;
}
declare module 'riskAndOpportunity/App' {
    const Component: React.ComponentType<any>;
    export default Component;
}

declare module 'digitalWorker/translations' {
    const translations: Record<string, { translation: Record<string, string> }>;
    export default translations;
}

declare module 'riskAndOpportunity/RiskAndOpportunityNew' {
    const Component: React.ComponentType<any>;
    export default Component;
}

declare module 'knowledgeHub/App' {
    const Component: React.ComponentType<any>;
    export default Component;
}

declare module 'knowledgeHub/translations' {
    const translations: Record<string, { translation: Record<string, string> }>;
    export default translations;
}

declare module 'truckInspection/App' {
    import type { ApplicationMfeProps } from '../../utils/applicationMfeRegistry';
    const Component: React.ComponentType<ApplicationMfeProps>;
    export default Component;
}

declare module 'truckInspection/translations' {
    const translations: Record<string, { translation: Record<string, string> }>;
    export default translations;
}

declare module 'gembaWalk/App' {
    const Component: React.ComponentType<any>;
    export default Component;
}

declare module 'gembaWalk/translations' {
    const translations: Record<string, { translation: Record<string, string> }>;
    export default translations;
}
