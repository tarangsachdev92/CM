import React from 'react';
import { Table, CheckBox, Icon } from 'konnect-react-components';
import { Flex } from 'antd';
import styles from './PermissionMatrixTable.module.scss';

export interface PermissionMatrixPersona {
    personaId: string;
    personaName: string;
}

export interface PermissionMatrixRow {
    key: string | number;
    moduleId?: string | number;
    moduleName?: string;

    subModuleId?: string | number;
    subModuleName?: string;

    permissionName?: string;

    /** personaId -> permission flag */
    personaAccess: Record<string, boolean | null>;

    /** Special row for persona selection */
    isPersonaSelectorRow?: boolean;

    /** Used to render module name only once */
    isFirstInModule?: boolean;
    isFirstInSubModule?: boolean;
}

export interface PermissionMatrixTableProps {
    personas: PermissionMatrixPersona[];
    rows: PermissionMatrixRow[];

    /** Persona enable / disable (used mainly in Flyout) */
    personaSelection?: Record<string, boolean>;
    onPersonaToggle?: (personaId: string, checked: boolean) => void;

    /** NEW: controls editability */
    mode?: 'read' | 'edit';

    /** Called only in edit mode */
    onPermissionToggle?: (rowKey: string | number, personaId: string, checked: boolean) => void;
}

const PermissionMatrixTable: React.FC<PermissionMatrixTableProps> = ({
    personas,
    rows,
    
    mode = 'read',
    onPermissionToggle,
}) => {
    const isEditable = mode === 'edit';

    /* ---------- Persona columns ---------- */
    const personaColumns = personas.map(persona => ({
        key: persona.personaId,
        dataIndex: persona.personaId,
        title: persona.personaName,
        externalHeaderStyles: {
            textAlign: 'center',
        },
        width: '120px',

        render: (_: any, record: PermissionMatrixRow) => {
            /* Persona selector row */

            if (record.isPersonaSelectorRow) {
                const dataRows = rows.filter(r => !r.isPersonaSelectorRow);

                // only consider allowed rows (ignore X rows)
                const allowedRows = dataRows.filter(
                    r => r.personaAccess?.[persona.personaId] !== null,
                );

                const checkedCount = allowedRows.filter(
                    r => r.personaAccess?.[persona.personaId] === true,
                ).length;

                const totalCount = allowedRows.length;

                const isAllChecked = totalCount > 0 && checkedCount === totalCount;

                return (
                    <Flex justify="center">
                        <CheckBox
                            checked={isAllChecked}
                            disabled={!isEditable}
                            onChange={(checked: boolean) => {
                                if (!isEditable) return;
                                // ONLY header triggers ALL
                                onPermissionToggle?.('ALL', persona.personaId, checked);
                            }}
                        />
                    </Flex>
                );
            }

            const value = record.personaAccess?.[persona.personaId];

            /* No access for this persona */
            if (value === null) {
                return (
                    <Flex justify="center">
                        <Icon name="x-close" size="m" color="neutrals-B100" />
                    </Flex>
                );
            }

            /* Permission checkbox */
            return (
                <Flex justify="center">
                    <CheckBox
                        checked={value === true}
                        disabled={!isEditable}
                        onChange={(checked: boolean) => {
                            if (!isEditable) return;
                            onPermissionToggle?.(record.key, persona.personaId, checked);
                        }}
                    />
                </Flex>
            );
        },
    }));
    const hasSubModules = React.useMemo(() => {
        return rows.some(r => !r.isPersonaSelectorRow && r.subModuleName);
    }, [rows]);

    /* ---------- Base columns ---------- */
    const baseColumns = [
        {
            key: 'module',
            title: 'Module',
            dataIndex: 'moduleName',
            width: '260px',
            render: (_: any, record: PermissionMatrixRow) => {
                if (record.isPersonaSelectorRow) return null; // hide for first row

                if (!record.isFirstInModule) return null;

                return (
                    <div className={styles['moduleCell']}>
                        <div className={styles['moduleId']}>Module #{record.moduleId}</div>
                        <div className={styles['moduleName']}>{record.moduleName}</div>
                    </div>
                );
            },
        },

        ...(hasSubModules
            ? [
                  {
                      key: 'submodule',
                      title: 'Sub-Modules',
                      dataIndex: 'subModuleName',
                      width: '240px',
                      render: (_: any, record: PermissionMatrixRow) => {
                          if (record.isPersonaSelectorRow) return null;
                          if (!record.isFirstInSubModule) return null;

                          if (!record.subModuleName) return null;

                          return (
                              <div className={styles['moduleCell']}>
                                  <div className={styles['moduleId']}>
                                      Sub-Module #<span>{record['subModuleId']}</span>
                                  </div>
                                  <div className={styles['moduleName']}>{record.subModuleName}</div>
                              </div>
                          );
                      },
                  },
              ]
            : []),

        {
            key: 'permission',
            title: 'Permissions',
            dataIndex: 'permissionName',
            width: '280px',
            render: (value: string, record: PermissionMatrixRow) => {
                if (record.isPersonaSelectorRow) return null; // hide for first row

                return <div className={styles['permissionName']}>{value}</div>;
            },
        },
    ];

    let columns = [...baseColumns];

    if (personas.length > 0) {
        columns = [...baseColumns, ...personaColumns];
    } else if (mode === 'edit') {
        // only add fake column in edit mode
        columns = [
            ...baseColumns,
            {
                key: 'empty-persona',
                title: '',
                dataIndex: 'empty',
                width: '100%',
                render: () => null,
            },
        ];
    }

    return (
        <div
            className={`${styles['tableWrapper']} ${isEditable && personas.length === 0 ? styles['emptyPersonaMode'] : ''}`}
        >
            <Table columns={columns as any} data={rows} expandableRows={false} />

            {isEditable && personas.length === 0 && (
                <div className={styles['emptyOverlay']}>
                    <div className={styles['emptyState']}>
                        <div className={styles['emptyTitle']}>No Persona’s Added</div>
                        <div className={styles['emptySubTitle']}>
                            Add Persona’s to start mapping permissions
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default PermissionMatrixTable;
