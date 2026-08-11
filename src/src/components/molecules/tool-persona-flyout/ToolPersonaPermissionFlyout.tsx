import React, { useEffect } from 'react';
import { Flyout } from 'konnect-react-components';

import styles from './ToolPersonaPermissionFlyout.module.scss';
import PermissionMatrixTable from '../permission-matrix/PermissionMatrixTable';

export interface FlyoutPersona {
    personaId: string;
    personaName: string;
}

export interface FlyoutPermissionRow {
    key: string | number;
    moduleId?: string | number;
    moduleName?: string;
    permissionName?: string;
    personaAccess: Record<string, boolean | null>;
    isPersonaSelectorRow?: boolean;
}

interface ToolPersonaPermissionFlyoutProps {
    open: boolean;
    toolName?: string;
    personas: FlyoutPersona[];
    permissions: FlyoutPermissionRow[];
    onClose: (uncheckedPersonaIds: string[]) => void;
}

const ToolPersonaPermissionFlyout = ({
    open,
    personas,
    permissions,
    onClose,
}: ToolPersonaPermissionFlyoutProps) => {
    const [personaSelection, setPersonaSelection] = React.useState<Record<string, boolean>>({});

    // Persona columns

    const groupedPermissions = React.useMemo(() => {
        if (!permissions || permissions.length === 0) {
            return [];
        }

        const moduleMap = new Map<string, FlyoutPermissionRow[]>();

        permissions.forEach(permission => {
            const moduleKey = String(permission.moduleId);
            if (!moduleMap.has(moduleKey)) {
                moduleMap.set(moduleKey, []);
            }
            moduleMap.get(moduleKey)!.push(permission);
        });

        const flattened: any[] = [];

        moduleMap.forEach(modulePermissions => {
            modulePermissions.forEach((permission, index) => {
                flattened.push({
                    ...permission,
                    isFirstInModule: index === 0,
                });
            });
        });

        return flattened;
    }, [permissions]);

    useEffect(() => {
        const nextSelection: Record<string, boolean> = {};
        personas.forEach(p => {
            nextSelection[p.personaId] = true; // default checked
        });
        setPersonaSelection(nextSelection);
    }, [personas]);

    const personaSelectorRow: FlyoutPermissionRow = {
        key: -1,
        isPersonaSelectorRow: true,
        personaAccess: personaSelection,
    };
    const handleClose = () => {
        const uncheckedPersonaIds = Object.entries(personaSelection)
            .filter(([, checked]) => !checked)
            .map(([personaId]) => personaId);

        onClose(uncheckedPersonaIds);
    };

    return (
        <Flyout
            id="tool-persona-permission-flyout"
            flyoutOpen={open}
            direction="right"
            containerMaxWidth="64rem"
            heading="Access & Permissions"
            subHeading={`Assign permissions to personas for each module and sub-module`}
            cancelIconClick={handleClose}
            iconForCancel={{ icon: 'x-close', onClick: handleClose }}
            onBackDropClick={handleClose}
            content={
                <div className={styles.contentAligner}>
                    <div className={styles.flyoutRow}>
                        <div className={styles.tableCol}>
                            <PermissionMatrixTable
                                personas={personas}
                                rows={[personaSelectorRow, ...groupedPermissions]}
                                personaSelection={personaSelection}
                                onPersonaToggle={(_id, checked) =>
                                    setPersonaSelection(prev => ({ ...prev, checked }))
                                }
                                mode="read"
                            />
                        </div>

                        {personas.length === 0 && (
                            <div className={styles.emptyCol}>
                                <div className={styles.emptyState}>
                                    <div className={styles.emptyTitle}>No Persona’s Added</div>
                                    <div className={styles.emptySubTitle}>
                                        Add Persona’s to start mapping permissions
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            }
        />
    );
};

export default ToolPersonaPermissionFlyout;
