import { lazy, type ComponentType, type LazyExoticComponent } from 'react';

/** Props the host shell passes to every application MFE. */
export interface ApplicationMfeProps {
    /** When true (default), the remote runs embedded in Command Center and uses `language` from the host. */
    hostMode?: boolean;
    /** The user's profile language code, e.g. `EN`. Remotes normalize casing. */
    language?: string;
}

type ApplicationMfeComponent = LazyExoticComponent<ComponentType<ApplicationMfeProps>>;

const normalizeToolName = (name: string): string => name.trim().toLowerCase();

/**
 * Maps application tool names (from api/application/application-details-by-id) to federated MFE entry points.
 * Add new applications here when onboarding another MFE — access is handled generically by toolId.
 */
const APPLICATION_MFE_REGISTRY: Record<string, ApplicationMfeComponent> = {
    [normalizeToolName('Truck Inspection')]: lazy(() => import('truckInspection/App')),
    [normalizeToolName('Gemba Walk')]: lazy(() => import('gembaWalk/App')),
};

export const resolveApplicationMfe = (toolName: string | undefined): ApplicationMfeComponent | null => {
    if (!toolName) {
        return null;
    }
    return APPLICATION_MFE_REGISTRY[normalizeToolName(toolName)] ?? null;
};
