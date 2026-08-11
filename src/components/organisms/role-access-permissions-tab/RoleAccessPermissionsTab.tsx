import { Flex } from 'antd';
import { Label } from '../../atoms';
import styles from './RoleAccessPermissionTab.module.scss';
import {
    Button,
    Table,
    IconButton,
    Icon,
    TagSelector,
    Dialog,
    Toast,
} from 'konnect-react-components';
import { useCallback, useEffect, useRef, useState } from 'react';
import { useParams } from 'react-router-dom';
import {
    getRoleDetailsById,
    updateRoleDetails,
    getAllToolsPersonaPermissionDetails,
    deleteRoleToolPersona,
} from '../../../services/roles';
import {
    IAccessPermissionsRowData,
    IADGroupDATA,
    IADGroupPermissionData,
    IPersona,
    IRoleApplicationData,
    IRoleDetails,
} from '../../../types/response';
import { useDispatch, useSelector } from 'react-redux';
import { AppDispatch, fetchToolPersonaPermissionByRole, RootState } from '../../../store';
import { OptionType, ICustomOptionType } from '../../../types/common';
import { extractOnlyRoleName, logError } from '../../../utils/helpers';
import ToolPersonaPermissionFlyout, {
    FlyoutPermissionRow,
    FlyoutPersona,
} from '../../molecules/tool-persona-flyout/ToolPersonaPermissionFlyout';

interface Props {
    onNewToolCommitted: (hasChanges: boolean) => void;
    onPersonaIdsChange: (ids: string[]) => void;
}
type CleanRow = {
    applicationId?: string;
    personaId?: string;
    expandedRowData?: {
        key: number;
        isActive?: boolean | null;
    }[];
};

interface TableRow {
    key: number;
    application: string;
    applicationId?: string;
    toolType?: string;
    appFeature?: string;
    appModuleName?: string;
    role: string;
    adgroup: string[];
    action: string;
    isActive?: boolean | null;
    isEditMode?: boolean;
    selectedPermissionCount?: number;
    parentRowKey?: number;
    expandedRowData?: TableRow[];
    disableEditForApplicationRow?: boolean;
    isRowSaved?: boolean;
    persona: string;
    personaId?: string;
    appModuleNameId?: string;
    isFromApi: boolean;
}

function RoleAccessPermissionTab({ onNewToolCommitted, onPersonaIdsChange }: Props) {
    const dispatch = useDispatch<AppDispatch>();

    const [tableRowData, setTableRowData] = useState<TableRow[]>([]);
    const [isAddNewApplicationButtonDisabled, setIsAddNewApplicationButtonDisabled] =
        useState<boolean>(false);

    const [selectedApplications, setSelectedApplications] = useState<Record<number, OptionType[]>>(
        {},
    );
    const [selectedPersona, setSelectedPersona] = useState<Record<number, OptionType[]>>({});

    const roleParams = useParams<{ roleId: string }>();
    const [pageNumber, setPageNumber] = useState<number>(1);
    const [pageSize, setPageSize] = useState<number>(10);
    const [, setTotalRows] = useState<number>(1);
    const [roleGeneralInfo, setRoleGeneralInfo] = useState<any>([]);
    const [rolePermissionsInfo, setRolePermissionsInfo] = useState<any>([]);
    const [userSelectedPermissions, setUserSelectedPermissions] = useState<number[]>([]);
    const [loading, setLoading] = useState<boolean>(false);
    const [isDailogOpen, setIsDailogOpen] = useState<boolean>(false);
    const recordKeyRef = useRef<number>(0);
    const tableRef = useRef<any>(null);
    const rolePermissionState = useSelector((state: RootState) => state.rolePermissions);
    const existingToolPersonaPermissions =
        rolePermissionState?.toolPersonaData?.existingToolPersonaPermissions ?? [];
    const otherToolPersonaPermissions =
        rolePermissionState?.toolPersonaData?.otherToolPersonaPermissions ?? [];
    const [appNamesWithoutPermissions, setAppNamesWithoutPermissions] = useState<string[]>([]);
    const [selectedActivePermissions, setSelectedActivePermissions] = useState<number[]>([]);
    const [openSaveEditDialog, setOpenSaveEditDialog] = useState<boolean>(false);
    const [openCancelDialog, setOpenCancelDialog] = useState<boolean>(false);
    const [openCheckSaveDialog, setOpenCheckSaveDialog] = useState<boolean>(false);
    const [personaDetails, setPersonaDetails] = useState<IRoleApplicationData[]>([]);
    const [openPersonaFlyout, setOpenPersonaFlyout] = useState(false);
    const [, setActiveToolRowKey] = useState<number | null>(null);
    const [selectedToolName, setSelectedToolName] = useState('');
    const [flyoutPersonas, setFlyoutPersonas] = useState<FlyoutPersona[]>([]);
    const [flyoutPermissions, setFlyoutPermissions] = useState<FlyoutPermissionRow[]>([]);

    const [personaIds, setPersonaIds] = useState<string[]>([]);
    const [toastConfig, setToastConfig] = useState<{
        visible: boolean;
        message: string;
        type: 'Delete' | 'Error' | 'Success';
    }>({ visible: false, message: '', type: 'Delete' });
    const [savedPersonasByRow, setSavedPersonasByRow] = useState<Record<number, OptionType[]>>({});
    const hasNewRowRef = useRef(false);
    const originalTableRef = useRef<CleanRow[]>([]);
    const isFlyoutActionRef = useRef(false);

    const [isSaving, setIsSaving] = useState(false);

    useEffect(() => {
        fetchPersonaDetails();
        fetchRoleDetails();
    }, []);

    const fetchPersonaDetails = useCallback(async () => {
        const response = await getAllToolsPersonaPermissionDetails();
        if (response) {
            setPersonaDetails(response.data?.data ?? []);
        }
    }, []);

    useEffect(() => {
        if (!Number(roleParams.roleId)) {
            return;
        }

        dispatch(
            fetchToolPersonaPermissionByRole({
                roleId: Number(roleParams.roleId),
                pageNumber,
                pageSize,
            }),
        );
    }, [roleParams.roleId, pageNumber, pageSize]);

    useEffect(() => {
        //  If user just added a new row, don't override it
        if (hasNewRowRef.current) return;

        loadExistingApplicationsForRole();
    }, [personaDetails, existingToolPersonaPermissions]);

    const loadExistingApplicationsForRole = useCallback(() => {
        if (existingToolPersonaPermissions?.length === 0) {
            setTableRowData([]);
            return;
        }

        const newTableRowData: any[] = existingToolPersonaPermissions.flatMap(
            (application, idx) => {
                return application.personas?.map(persona => {
                    const expandedRowData =
                        personaDetails
                            .find(
                                item =>
                                    item.toolDetails.toolName === application.toolDetails.toolName,
                            )
                            ?.personas?.flatMap((persona: IPersona) =>
                                persona.modules.flatMap((module: any) =>
                                    module.permission.map((permission: any) => ({
                                        key: permission.permissionId,
                                        parentRowKey: permission.permissionId,
                                        personaId: persona.personaId ?? 'DEFAULT',
                                        application: application.toolDetails.toolName,
                                        applicationId: application.toolDetails.toolId.toString(),
                                        toolType: application.toolDetails.toolType,
                                        appModuleName: module.module,
                                        appModuleNameId: module.moduleId,
                                        appFeature: permission.permissionName,
                                        isActive: permission.isActiveToolPermission ?? null,
                                        isEditMode: true,
                                        isRowSaved: false,
                                    })),
                                ),
                            ) || [];
                    return {
                        key: idx,
                        application: application.toolDetails.toolName,
                        applicationId: application.toolDetails.toolId.toString(),
                        toolType: application.toolDetails.toolType,
                        role: '',
                        action: '',
                        isEditMode: false,
                        disableEditForApplicationRow: true,
                        selectedPermissionCount: application.activePermissionCount,
                        isRowSaved: true,
                        persona: persona.personaName,
                        personaId: persona.personaId,
                        modules: persona.modules,
                        personaDescription: persona.personaDescription,
                        isFromApi: true,
                        expandedRowData,
                    };
                });
            },
        );

        setTableRowData(newTableRowData);

        newTableRowData.forEach(row => {
            setPersonaIds(prev => [...prev, row?.personaId]);
        });
        //Original snapshot of the Table

        originalTableRef.current = newTableRowData.map(row => ({
            applicationId: row.applicationId,
            personaId: row.personaId,
            expandedRowData: row.expandedRowData?.map((er: any) => ({
                key: er.key,
                isActive: er.isActive,
            })),
        }));

        setIsAddNewApplicationButtonDisabled(false);
        hasNewRowRef.current = false;
        setIsSaving(false);
    }, [existingToolPersonaPermissions, personaDetails]);
    const getCleanData = (rows: TableRow[]): CleanRow[] => {
        return rows
            .filter(row => row.isRowSaved)
            .map(row => ({
                applicationId: row.applicationId,
                personaId: row.personaId,
                expandedRowData: row.expandedRowData?.map(er => ({
                    key: er.key,
                    isActive: er.isActive,
                })),
            }));
    };
    const buildCleanSnapshot = (rows: TableRow[]): CleanRow[] => {
        return rows
            .filter(r => r.isRowSaved)
            .map(r => ({
                applicationId: r.applicationId,
                personaId: r.personaId,
                expandedRowData: r.expandedRowData?.map(er => ({
                    key: er.key,
                    isActive: er.isActive,
                })),
            }));
    };

    useEffect(() => {
        if (isSaving) {
            onNewToolCommitted(true);
            return;
        }

        const current = getCleanData(tableRowData);
        const original = originalTableRef.current;

        const hasOnlyDraftRows = tableRowData.length > 0 && tableRowData.every(r => !r.isRowSaved);

        const isSame = JSON.stringify(current) === JSON.stringify(original);

        const hasNewlyAddedRow = tableRowData.some(row => row.isRowSaved && !row.isFromApi);

        let hasChanges = (!isSame && !hasOnlyDraftRows) || hasNewlyAddedRow;

        if (tableRowData.length === 0) {
            hasChanges = false;
        }

        onNewToolCommitted(hasChanges);
    }, [tableRowData, isSaving]);

    const updateRoleInfo = useCallback(
        (response: IRoleDetails) => {
            const allAppsInfo: IAccessPermissionsRowData[] = [];
            const existingUserSelectedPermissions: any = [];
            if (response.accessAndPermission.length > 0) {
                response.accessAndPermission.map((permissionsInfo: IAccessPermissionsRowData) => {
                    const appInfo: IAccessPermissionsRowData = permissionsInfo;
                    appInfo['expandedRowData'] = [];
                    const selectedADGroups: any = [];
                    permissionsInfo.adgroups.map((adGroupRowData: IADGroupDATA) => {
                        adGroupRowData.permission.map((permission: IADGroupPermissionData) => {
                            if (
                                permission.isActiveToolPermission !== null &&
                                permission.isActiveToolPermission
                            ) {
                                selectedADGroups.push(adGroupRowData.adGroupId);
                            }
                        });
                    });
                    permissionsInfo.adgroups.map((adGroupRowData: IADGroupDATA) => {
                        adGroupRowData.permission.map((permission: IADGroupPermissionData) => {
                            const currentPermission = permission;
                            const findAdGroup = selectedADGroups.findIndex(
                                (item: any) => item === adGroupRowData.adGroupId,
                            );
                            if (findAdGroup !== -1) {
                                currentPermission.userSelected = true;
                            } else {
                                currentPermission.userSelected = false;
                            }
                            appInfo['expandedRowData'].push(currentPermission);
                            if (permission.isActiveToolPermission) {
                                existingUserSelectedPermissions.push(permission.toolPermissionId);
                            }
                        });
                    });
                    allAppsInfo.push(appInfo);
                });
                setRoleGeneralInfo(response.generalInformation);
                setRolePermissionsInfo([...allAppsInfo]);
                storeUserSelectedPermissions(existingUserSelectedPermissions, 'multiple');
                setTotalRows(response.pagination.totalRows);
            } else {
                setRoleGeneralInfo(response.generalInformation);
            }
        },
        [userSelectedPermissions, rolePermissionsInfo],
    );

    const fetchRoleDetails = useCallback(async () => {
        const response = await getRoleDetailsById({
            roleId: Number(roleParams.roleId),
            pageNumber,
            pageSize,
        });
        if (response) {
            updateRoleInfo(response);
        }
    }, []);
    const onClickHandlerForCheck = (key: number) => {
        handleCheckClick(key);
    };

    const onClickHandlerForAddNewApplicationButton = () => {
        setIsAddNewApplicationButtonDisabled(true);

        setSelectedPersona({});
        setTableRowData(prevData => [
            {
                key: Date.now(),
                application: '',
                applicationId: '',
                toolType: '',
                role: '',
                adgroup: [''],
                action: '',
                appFeature: '',
                appModuleName: '',
                isEditMode: true,
                selectedPermissionCount: 0,
                expandedRowData: [],
                disableEditForApplicationRow: false,
                isRowSaved: false,
                isFromApi: false,
                persona: '',
            },
            ...prevData,
        ]);
        hasNewRowRef.current = true;
    };

    const handleAppChange = (value: ICustomOptionType, record: TableRow) => {
        const selectedApp = otherToolPersonaPermissions.filter(
            app => app.toolDetails.toolId.toString() === value.value,
        )[0];

        if (!selectedApp) {
            return;
        }

        setSelectedApplications(prev => {
            prev[record.key] = [value];
            return prev;
        });

        // Update only the selected row
        setTableRowData((prevData: any) =>
            prevData.map((row: any) =>
                row.key === record.key
                    ? {
                          ...row,
                          application: value.label,
                          applicationId: value.value,
                          persona: value.persona, // Update the selected application id
                          toolType: value.toolType,
                          adgroup: [''], // Reset adgroup selection
                          selectedPermissionCount: 0, //Reset
                      }
                    : row,
            ),
        );
    };

    const handlePersonaChange = (value: ICustomOptionType, record: TableRow) => {
        // Update only the selected row
        setSelectedPersona(prev => {
            prev[record.key] = [value];
            return prev;
        });

        const personaIdsTemp = personaIds.filter(item => item !== record.personaId);

        setPersonaIds(personaIdsTemp);

        setTableRowData(prevData =>
            prevData.map(row =>
                row.key === record.key
                    ? {
                          ...row,
                          isEditMode: true,
                          isFromApi: false,
                      }
                    : row,
            ),
        );
    };
    const getUsedPersonasByTool = () => {
        const map: Record<string, Set<string>> = {};

        tableRowData.forEach(row => {
            if (!row.applicationId || !row.personaId || !row.isRowSaved || row.isEditMode) {
                return;
            }

            const toolId = row.applicationId;

            if (!map[toolId]) {
                map[toolId] = new Set<string>();
            }

            map[toolId]!.add(String(row.personaId));
        });

        return map;
    };

    const getApplicationsForDropdown = () => {
        const usedPersonasByTool = getUsedPersonasByTool();

        return otherToolPersonaPermissions
            .filter(tool => {
                const toolId = tool.toolDetails.toolId.toString();
                const totalPersonas =
                    personaDetails.find(p => p.toolDetails.toolId === tool.toolDetails.toolId)
                        ?.personas?.length ?? 0;
                const usedPersonasCount = usedPersonasByTool[toolId]?.size ?? 0;

                // Allow tool until ALL personas are used
                return usedPersonasCount < totalPersonas;
            })
            .map(tool => ({
                desc: `${tool.toolDetails.toolType} ${tool.toolDetails.toolId}`,
                label: tool.toolDetails.toolName,
                value: tool.toolDetails.toolId.toString(),
                toolType: tool.toolDetails.toolType,
            }));
    };
    const getPersonaDropdown = (_: string[], record: TableRow) => {
        const usedPersonasByTool = getUsedPersonasByTool();

        const tool = personaDetails.find(
            p => p.toolDetails.toolId.toString() === record.applicationId,
        );

        if (!tool) return [];

        const usedPersonas = usedPersonasByTool[record.applicationId ?? ''] ?? new Set<string>();

        const personas = tool.personas ?? [];

        return personas
            .filter(p => !usedPersonas.has(String(p.personaId)))
            .map(p => ({
                desc: p.personaDescription,
                label: p.personaName,
                value: p.personaId,
                modules: p.modules,
            }));
    };

    const getSelectedApplication = (key: number) => {
        return (
            selectedApplications[key]?.map(({ label, value, desc }) => ({
                desc: desc as string,
                label,
                value,
            })) || []
        );
    };

    const getSelectedPersona = (key: number) => {
        return (
            selectedPersona[key]?.map(({ label, value }) => ({
                desc: label,
                label,
                value,
            })) || []
        );
    };

    const getSelectedPersonaFromApi = (persona: string) => {
        return [
            {
                desc: persona,
                label: '',
                value: '',
            },
        ];
    };

    const handleCheckClick = (key: number) => {
        const row = tableRowData.find(r => r.key === key);
        if (!row?.applicationId) return;

        const selected = selectedPersona[key]?.[0];

        const tool = personaDetails.find(
            p => p.toolDetails.toolId.toString() === row.applicationId,
        );
        if (!tool || !tool.personas) {
            return;
        }

        const persona = tool.personas.find(p => String(p.personaId) === String(selected?.value));

        if (!persona) {
            return;
        }

        const expandedRowData: TableRow[] =
            persona?.modules.flatMap(module => {
                if (!('permission' in module)) return [];

                return module.permission.map(permission => ({
                    key: permission.permissionId,
                    persona: persona.personaName,
                    parentRowKey: permission.permissionId,
                    personaId: selected?.value,
                    application: row.application,
                    applicationId: row.applicationId,
                    toolType: row.toolType,
                    appModuleName: module.module,
                    appModuleNameId: module.moduleId,
                    appFeature: permission.permissionName,
                    isActive: false,
                    isEditMode: false,
                    isRowSaved: true,
                    role: '',
                    adgroup: [],
                    action: '',
                    isFromApi: false,
                }));
            }) ?? [];

        setTableRowData(prevData =>
            prevData.map(row =>
                row.key === key
                    ? {
                          ...row,
                          isEditMode: false,
                          disableEditForApplicationRow: true,
                          isRowSaved: true,
                          expandedRowData,
                          persona: selected?.label ?? row.persona,
                          personaId: selected?.value ?? row.personaId,
                      }
                    : row,
            ),
        );
        hasNewRowRef.current = false;
        if (!row.isFromApi && hasNewRowRef.current) {
            onNewToolCommitted(true); // enables Save / Discard buttons
        }

        const finalPersonas = selectedPersona[key] ?? [];

        setSavedPersonasByRow(prev => ({
            ...prev,
            [key]: finalPersonas,
        }));
        setIsAddNewApplicationButtonDisabled(false);

        // Collapse the expanded row
        tableRef.current?.toogleRowExpandCallBack(0, false);
    };

    const handleRemoveRow = (key: number) => {
        const appToDelete = tableRowData.find(row => row.key == key)?.application;
        if (
            existingToolPersonaPermissions.filter(item => item.toolDetails.toolName === appToDelete)
                .length
        ) {
            setTableRowData(prevData =>
                prevData.map(row =>
                    row.key === tableRowData.find(row => row.key == key)?.key
                        ? {
                              ...row,
                              isEditMode: false,
                              isFromApi: true,
                              isExistingData: true,
                          }
                        : row,
                ),
            );
            return;
        }
        setTableRowData(prevData => prevData.filter(row => row.key !== key));
        const rowToDelete = tableRowData.find(row => row.key === key);
        if (!rowToDelete?.applicationId) {
            setIsAddNewApplicationButtonDisabled(false);
            return;
        }

        if (rowToDelete.isFromApi) {
            setTableRowData(prevData =>
                prevData.map(row =>
                    row.key === key
                        ? {
                              ...row,
                              isEditMode: false,
                              isFromApi: true,
                              isExistingData: true,
                          }
                        : row,
                ),
            );
            setIsAddNewApplicationButtonDisabled(false);
            return;
        }

        // Remove saved display personas
        setSavedPersonasByRow(prev => {
            const updated = { ...prev };
            delete updated[key];
            return updated;
        });

        setIsAddNewApplicationButtonDisabled(false);
        setAppNamesWithoutPermissions(prevApps => prevApps.filter(app => app !== appToDelete));
    };

    const prepareFlyoutDataForRow = (clickedRowKey: number) => {
        const clickedRow = tableRowData.find(r => r.key === clickedRowKey);
        if (!clickedRow?.applicationId) return;

        const toolId = clickedRow.applicationId;

        // All rows (personas) added for this tool
        const toolRows = tableRowData.filter(r => r.applicationId === toolId && r.personaId);

        if (!toolRows.length) return;

        // Personas shown in flyout header
        const personas: FlyoutPersona[] = toolRows.map(r => ({
            personaId: String(r.personaId),
            personaName: r.persona ?? '',
        }));

        // Tool master data
        const tool = personaDetails.find(t => t.toolDetails.toolId.toString() === toolId);
        if (!tool?.personas) return;

        const permissionMap = new Map<string, FlyoutPermissionRow>();

        personas.forEach(persona => {
            const personaEntry = tool.personas?.find(
                p => String(p.personaId) === persona.personaId,
            );
            if (!personaEntry) return;

            personaEntry.modules.forEach(module => {
                module.permission.forEach(permission => {
                    const permissionKey = `${module.moduleId}_${permission.permissionId}`;

                    if (!permissionMap.has(permissionKey)) {
                        const entry: FlyoutPermissionRow = {
                            key: permissionKey,
                            moduleId: module.moduleId,
                            moduleName: module.module,
                            permissionName: permission.permissionName,
                            personaAccess: {},
                        };

                        // initialize all personas
                        personas.forEach(p => {
                            entry.personaAccess[p.personaId] = false;
                        });

                        permissionMap.set(permissionKey, entry);
                    }

                    const isActiveForPersona = toolRows.some(row =>
                        row.expandedRowData?.some(
                            er =>
                                String(er.key) === String(permission.permissionId) &&
                                String(er.personaId) === persona.personaId &&
                                er.isActive === true,
                        ),
                    );

                    permissionMap.get(permissionKey)!.personaAccess[persona.personaId] =
                        isActiveForPersona || permission.isActiveToolPermission === true;
                });
            });
        });

        setFlyoutPersonas(personas);
        setFlyoutPermissions(Array.from(permissionMap.values()));
    };
    const TableColumns = [
        {
            key: 'application',
            dataIndex: 'application',
            title: 'Tools Name',
            customExpandableColumn: true,
            externalStyles: { whiteSpace: 'normal' },
            width: '360px',
            render: (_value: string, record: TableRow) => (
                <>
                    {record.isEditMode && !record.disableEditForApplicationRow ? (
                        <div
                            style={{ width: '100%' }}
                            onClick={event => {
                                event.stopPropagation();
                            }}
                        >
                            <TagSelector
                                dataTestId="drop-down"
                                id="drop-down"
                                displayLabel
                                className={styles['application-tag-selector']}
                                onChange={value =>
                                    handleAppChange(value as ICustomOptionType, record)
                                }
                                options={getApplicationsForDropdown()}
                                selectedOptions={getSelectedApplication(record.key)}
                                placeholder="Select Tool"
                                searchInput={{
                                    searchPlaceholder: 'Search',
                                    searchSize: 'L',
                                    searchWholeString: true,
                                }}
                                size="L"
                                type="menuList"
                                showCloseIcon={false}
                                optionsContainerClassName={
                                    styles['row-edit-application-tag-selector-container']
                                }
                                portal={true}
                            />
                        </div>
                    ) : (
                        <div
                            className={styles['header-title']}
                            onClick={e => {
                                e.stopPropagation();

                                setActiveToolRowKey(record.key);
                                setSelectedToolName(record.application ?? '');
                                prepareFlyoutDataForRow(record.key);
                                setOpenPersonaFlyout(true);
                            }}
                        >
                            <span className={styles['application-permissions-cell-title']}>
                                {record.toolType} {record.applicationId}
                            </span>
                            <span className={styles['application-permissions-cell-content']}>
                                {record.application}
                            </span>
                        </div>
                    )}
                </>
            ),
        },
        {
            key: 'persona',
            dataIndex: 'persona',
            title: 'Persona',
            width: '200px',
            render: (_value: string, record: TableRow) => {
                const isPersonaEditable = record.isEditMode && !record.isFromApi;

                if (!isPersonaEditable) {
                    return (
                        <div
                            className={styles['persona-readonly-text']}
                            onClick={e => e.stopPropagation()}
                        >
                            {record.persona || '-'}
                        </div>
                    );
                }

                return (
                    <>
                        <div
                            style={{ width: '100%' }}
                            onClick={event => {
                                event.stopPropagation();
                            }}
                        >
                            <TagSelector
                                key={record.key}
                                dataTestId="drop-down"
                                id="drop-down"
                                className={styles['application-tag-selector']}
                                onChange={value =>
                                    handlePersonaChange(value as ICustomOptionType, record)
                                }
                                options={getPersonaDropdown([record.application], record)}
                                selectedOptions={
                                    record.isFromApi
                                        ? getSelectedPersonaFromApi(record.persona)
                                        : getSelectedPersona(record.key)
                                }
                                footerContent={
                                    <div
                                        style={{ padding: '12px' }}
                                        onClick={e => e.stopPropagation()}
                                    >
                                        <Button
                                            text="View Permissions"
                                            variant="Subtle"
                                            onClick={() => {
                                                setActiveToolRowKey(record.key);
                                                setSelectedToolName(record.application ?? '');
                                                prepareFlyoutDataForRow(record.key);
                                                setOpenPersonaFlyout(true);
                                            }}
                                        />
                                    </div>
                                }
                                placeholder="Select Persona"
                                size="L"
                                type="menuList"
                                showCloseIcon={false}
                                optionsContainerClassName={
                                    styles['application-tag-selector-dropdown-container']
                                }
                                portal={true}
                            />
                        </div>
                    </>
                );
            },
        },
        {
            key: 'action',
            dataIndex: 'action',
            title: 'Actions',
            width: '50px',
            render: (_value: string, record: TableRow) => (
                <Flex align="center" justify="center" gap={8}>
                    {record.isEditMode ? (
                        <>
                            <IconButton
                                size="Small"
                                icon="check"
                                onClick={() => {
                                    onClickHandlerForCheck(record.key);
                                }}
                                disabled={getDisabledStatusForCheck(record.key)}
                            />
                            <IconButton
                                size="Small"
                                icon="x-close"
                                onClick={() => handleRemoveRow(record.key)}
                                disabled={false}
                            />
                        </>
                    ) : (
                        <IconButton
                            size="Small"
                            icon="trash-01"
                            onClick={() => OpenDeleteAppDailog(record.key)}
                        />
                    )}
                </Flex>
            ),
        },
    ];

    useEffect(() => {
        if (!tableRowData.length) {
            // Set isAddNewApplicationButtonClicked to false to hide the table if no data present in table
            setIsAddNewApplicationButtonDisabled(false);
        } else {
            const selectedPermission: number[] = [];
            tableRowData.forEach(row =>
                row.expandedRowData?.forEach(expandedRow => {
                    if (expandedRow.isActive) {
                        selectedPermission.push(expandedRow.key);
                    }
                }),
            );
            setSelectedActivePermissions(selectedPermission);
        }

        const allCommittedPersonaIds = tableRowData
            .filter(row => row.isRowSaved && !row.isEditMode && row.personaId)
            .map(row => String(row.personaId));

        onPersonaIdsChange([...new Set(allCommittedPersonaIds)]);
    }, [tableRowData]);

    useEffect(() => {
        // handleAppPermissions(selectedActivePermissions);
    }, [selectedActivePermissions]);

    const storeUserSelectedPermissions = useCallback(
        (ids: any, type: 'single' | 'multiple') => {
            const existingPermissions = new Set(userSelectedPermissions);
            if (type == 'single') {
                if (existingPermissions.has(ids)) {
                    existingPermissions.delete(ids);
                } else {
                    existingPermissions.add(ids);
                }
            } else {
                ids.forEach((id: any) => {
                    existingPermissions.add(id);
                });
            }
            setUserSelectedPermissions([...existingPermissions]);
        },
        [userSelectedPermissions],
    );

    const updateUserSelectedPermissions = useCallback(
        (idsToRemove: any, idsToAdd: any = []) => {
            const existingPermissions = new Set(userSelectedPermissions);

            idsToRemove.forEach((id: any) => {
                if (existingPermissions.has(id)) {
                    existingPermissions.delete(id);
                }
            });

            idsToAdd.forEach((id: any) => {
                if (!existingPermissions.has(id)) {
                    existingPermissions.add(id);
                }
            });

            setUserSelectedPermissions([...existingPermissions]);
        },
        [userSelectedPermissions],
    );

    const OpenDeleteAppDailog = (recordKey: number) => {
        recordKeyRef.current = recordKey; //use the appId to delete the record.
        setIsDailogOpen(true);
    };

    const deleteHandler = async () => {
        const roleId = Number(roleParams.roleId);
        const removeRecord = tableRowData.filter(data => data.key == recordKeyRef.current);
        const removeIds = [removeRecord[0]?.personaId];
        const idsToRemove = removeIds?.map((obj: any) => Number(obj?.key ?? ''));

        await deleteRoleToolPersona({
            roleId,
            personaId: Number(removeRecord[0]?.personaId),
        });
        updateUserSelectedPermissions(idsToRemove);
        handleRemoveRow(recordKeyRef.current);
        setIsDailogOpen(false);

        dispatch(
            fetchToolPersonaPermissionByRole({
                roleId: Number(roleParams.roleId),
                pageNumber: pageNumber,
                pageSize: pageSize,
            }),
        );
        setToastConfig({
            visible: true,
            message: `Access to tool '${removeRecord[0]?.application}' removed.`,
            type: 'Delete',
        });
    };

    const handlePageChange = (page: number) => {
        setPageNumber(page);
    };

    const handlePageSizeChange = (size: number) => {
        setPageSize(size);
    };

    const saveEditData = useCallback(async () => {
        setIsSaving(true);
        const allPersonaIds = tableRowData
            .filter(row => row.isRowSaved && row.personaId)
            .map(row => String(row.personaId));
        const request = {
            roleName: extractOnlyRoleName(
                String(roleGeneralInfo?.role),
                String(roleGeneralInfo?.responsibilityLevel),
            ),
            roleId: Number(roleGeneralInfo?.roleId) || 0,
            responsibilityLevelId: Number(roleGeneralInfo?.responsibilityLevelId) || 0,
            geographyLevelId: Number(roleGeneralInfo?.geographyLevelId) || 0,
            functionId: Number(roleGeneralInfo?.functionId) || 0,
            subFunctionId: Number(roleGeneralInfo?.subFunctionId) || 0,
            departmentId: Number(roleGeneralInfo?.departmentId) || 0,
            subDepartmentId: Number(roleGeneralInfo?.subDepartmentId) || 0,
            userAttributeIds: '', // to be updated later
            isAllSubFunction: roleGeneralInfo?.subFunction === 'ALL',
            isAllDepartment: roleGeneralInfo?.department === 'ALL',
            isAllSubDepartment: roleGeneralInfo?.subDepartment === 'ALL',

            toolPersonaIds: [...new Set(allPersonaIds)].join(','),
        };
        try {
            setLoading(true);
            await updateRoleDetails(request);

            setAppNamesWithoutPermissions([]);
            setToastConfig({
                visible: true,
                message: `Role '${roleGeneralInfo?.role}' updated successfully.`,
                type: 'Success',
            });
            dispatch(
                fetchToolPersonaPermissionByRole({
                    roleId: Number(roleParams.roleId),
                    pageNumber: pageNumber,
                    pageSize: pageSize,
                }),
            );
        } catch (error) {
            setToastConfig({
                visible: true,
                message: `Failed to update Role '${roleGeneralInfo?.role}'.`,
                type: 'Error',
            });
            logError(error);
            setIsSaving(false);
        } finally {
            setLoading(false);
        }
    }, [roleGeneralInfo, userSelectedPermissions, selectedPersona, tableRowData]);

    const cancelEditApp = () => {
        setTableRowData([]);
        setAppNamesWithoutPermissions([]);
        loadExistingApplicationsForRole();
    };

    const getDisabledStatusForCheck = (key: number) => {
        if (!selectedPersona[key] || selectedPersona[key].length === 0) {
            return true;
        }
        return false;
    };

    const showPermissionsValidationMessage = useCallback(() => {
        return (
            appNamesWithoutPermissions.length > 0 && (
                <div className={styles['error-text-container']}>
                    <Label type="body2">
                        <Icon name="info-circle" size="xm" color="status-error-color" />
                        <span className={styles['error-text-color']}>
                            {' '}
                            No permission selected for tools{' '}
                            {appNamesWithoutPermissions.map(item => `"${item}"`).join(', ')}. The
                            tool will be removed from users list if no permission is selected.
                        </span>
                    </Label>
                </div>
            )
        );
    }, [appNamesWithoutPermissions]);

    return (
        <Flex id="role-access-permission-tab" vertical className={styles['container']}>
            <Flex flex={1} justify="space-between">
                <Flex vertical>
                    <Label type="body2-b">Tool Access Settings</Label>
                    <div className={styles['space-v-8']} />
                    <Label type="body3">
                        <span className={styles['description-text']}>
                            Select all the tools and persona’s the role will have access to
                        </span>
                    </Label>
                </Flex>

                <Flex>
                    <Button
                        variant="Secondary"
                        disabled={isAddNewApplicationButtonDisabled}
                        icon="plus"
                        text="Add Tool"
                        onClick={onClickHandlerForAddNewApplicationButton}
                    />
                    <div className={styles['space-h-16']} />
                </Flex>
            </Flex>
            <div className={styles['space-v-16']} />
            {showPermissionsValidationMessage()}
            {tableRowData.length > 0 && (
                <Table
                    columns={TableColumns as any}
                    data={tableRowData}
                    expandableRows={false}
                    pagination={{
                        totalItems: tableRowData.length, //totalRows,
                        pageSize,
                        currentPage: pageNumber,
                        onPageChange: handlePageChange,
                        onPageSizeChange: handlePageSizeChange,
                        blankOut: 10,
                    }}
                    ref={tableRef}
                />
            )}
            <Dialog
                content={`Are you sure you want to remove access for the tool "${tableRowData.filter(row => row.key == recordKeyRef.current)[0]?.application}"`}
                isOpen={isDailogOpen}
                iconName="trash-01"
                size="Small"
                color="black-color"
                variant="HeaderTitleIcon"
                onClose={() => {
                    setIsDailogOpen(false);
                }}
                onPrimaryButtonClick={deleteHandler}
                onSecondaryButtonClick={() => {
                    setIsDailogOpen(false);
                }}
                primaryButtonText="Delete"
                secondaryButtonText="Don't Delete"
                title="Confirm Deletion"
            />
            <Dialog
                content={`Your updates to the tool access setting for the role "${roleGeneralInfo?.role}" will be saved. These changes may affect user access within the Command Centre.`}
                isOpen={openSaveEditDialog}
                onClose={() => {
                    setOpenSaveEditDialog(false);
                }}
                onPrimaryButtonClick={() => {
                    saveEditData();
                    setOpenSaveEditDialog(false);
                }}
                onSecondaryButtonClick={() => {
                    setOpenSaveEditDialog(false);
                }}
                primaryButtonText="Save"
                secondaryButtonText="Continue Editing"
                title="Save Changes"
            />

            <Dialog
                content={`Are you sure you want to leave without saving your changes?`}
                isOpen={openCancelDialog}
                onClose={() => {
                    setOpenCancelDialog(false);
                }}
                onPrimaryButtonClick={() => {
                    cancelEditApp();
                    setOpenCancelDialog(false);
                }}
                onSecondaryButtonClick={() => {
                    setOpenCancelDialog(false);
                }}
                primaryButtonText="Discard Changes"
                secondaryButtonText="Continue Editing"
                title="Discard Changes"
            />
            <Dialog
                content={`Are you sure you want to give access for the tool "${tableRowData.filter(row => row.key == recordKeyRef.current)[0]?.application}"? AD Group request for the same will be sent on confirmation`}
                isOpen={openCheckSaveDialog}
                onClose={() => {
                    setOpenCheckSaveDialog(false);
                }}
                onPrimaryButtonClick={() => {
                    onClickHandlerForCheck(recordKeyRef.current);
                }}
                onSecondaryButtonClick={() => {
                    setOpenCheckSaveDialog(false);
                }}
                primaryButtonText="Add Tool"
                secondaryButtonText="Review Entry"
                title="Add Tool"
                loading={loading}
            />
            {toastConfig.visible && (
                <Toast
                    distance="x5l"
                    message={toastConfig.message}
                    mode="Top Right"
                    onCloseToast={() => setToastConfig({ ...toastConfig, visible: false })}
                    toggle
                    type={toastConfig.type}
                    timer={5000}
                />
            )}
            <div style={{ zIndex: 999 }}>
                <ToolPersonaPermissionFlyout
                    open={openPersonaFlyout}
                    toolName={selectedToolName}
                    personas={flyoutPersonas}
                    permissions={flyoutPermissions}
                    onClose={async (uncheckedPersonaIds: string[]) => {
                        if (!uncheckedPersonaIds.length) {
                            setOpenPersonaFlyout(false);
                            return;
                        }

                        const roleId = Number(roleParams.roleId);

                        const rowsToDelete = tableRowData.filter(
                            row =>
                                row.isFromApi &&
                                row.personaId &&
                                uncheckedPersonaIds.includes(String(row.personaId)),
                        );

                        // Call API for API rows

                        if (rowsToDelete.length > 0) {
                            await Promise.all(
                                rowsToDelete.map(row =>
                                    deleteRoleToolPersona({
                                        roleId,
                                        personaId: Number(row.personaId),
                                    }),
                                ),
                            );

                            // ONE single refresh
                            dispatch(
                                fetchToolPersonaPermissionByRole({
                                    roleId,
                                    pageNumber,
                                    pageSize,
                                }),
                            );
                        }

                        setTableRowData(prevData => {
                            const updated = prevData.filter(row => {
                                const rowPersonas = savedPersonasByRow[row.key];
                                if (rowPersonas?.length) {
                                    return !rowPersonas.some(p =>
                                        uncheckedPersonaIds.includes(String(p.value)),
                                    );
                                }
                                if (row.personaId) {
                                    return !uncheckedPersonaIds.includes(String(row.personaId));
                                }
                                return true;
                            });

                            // sync snapshot so no "false change detection"
                            originalTableRef.current = buildCleanSnapshot(updated);

                            return updated;
                        });

                        if (rowsToDelete.length > 0) {
                            isFlyoutActionRef.current = true;
                            const names = rowsToDelete.map(r => r.persona).join(', ');

                            setToastConfig({
                                visible: true,
                                message: `Access removed for persona(s): ${names}`,
                                type: 'Delete',
                            });

                            setTimeout(() => {
                                isFlyoutActionRef.current = false;
                            }, 0);
                        }

                        setOpenPersonaFlyout(false);
                    }}
                />
            </div>
        </Flex>
    );
}

export default RoleAccessPermissionTab;
