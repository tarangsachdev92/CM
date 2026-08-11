import styles from './AddNewRoleScreen.module.scss';
import { DUPLICATE_ROLE_ERROR_MESSAGE } from '../../../utils/constants';
import {
    Button,
    Dialog,
    DropDown,
    Icon,
    InputField,
    Table,
    TagSelector,
    FilterChip,
    Toast,
    IconButton,
    Divider,
} from 'konnect-react-components';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { BackArrowIcon } from '../../../assets/icons/icons';
import { ExpandableForm, Label } from '../../../components';
import { useCallback, useState, useEffect, useRef } from 'react';
import { Flex, Row, Col } from 'antd';
import { useDispatch, useSelector } from 'react-redux';
import {
    AppDispatch,
    RootState,
    fetchSubRoleFunctions,
    fetchSubDepartmentList,
    fetchRoleDropdownData,
    fetchDepartmentsBySubfunctionId,
    fetchUserAttributes,
} from '../../../store';
import {
    checkDuplicateRoleDetails,
    getRoleDetailsByIId,
    saveRoleDetails,
    getLatestRoleId,
    getAllToolsPersonaPermissionDetails,
} from '../../../services/roles';
import { convertOptions, getIdOrZero, logError } from '../../../utils/helpers';
import type { OptionType, ICustomOptionType } from '../../../types/common';
import type { IToolPersona, IToolPersonaPermission } from '../../../types/response';
import { validateRoleName } from '../../../utils/validation';
import InlineAlert from '../../../components/molecules/inline-alert/InlineAlert';
import ToolPersonaPermissionFlyout, {
    FlyoutPermissionRow,
    FlyoutPersona,
} from '../../../components/molecules/tool-persona-flyout/ToolPersonaPermissionFlyout';

export type IAddNewRoleFormData = {
    generalInformationFormData: {
        roleName: string;
        roleLevel: Record<string, string | number>;
        roleFunction: Record<string, string | number>;
        roleSubFunction: Record<string, string | number>;
        department: DropdownOption | null;
        subDepartment: DropdownOption | null;
        selectedGeographyLevel: Record<string, string | number>;
    };
    accessAndPermissionsFormData: {
        applicationPermissionIds: string[];
    };
};

interface TableRow {
    key: number;
    application?: string;
    applicationId?: string;
    appFeature?: string;
    appModuleName?: string;
    role: string;
    adgroup: string;
    action: string;
    isActive?: boolean | null;
    isEditMode?: boolean;
    selectedPermissionCount?: number;
    parentRowKey?: number;
    expandedRowData?: IPermissionRow[];
    disableEditForApplicationRow?: boolean;
    isRowSaved?: boolean;
    toolType?: string;
}
interface IPermissionRow {
    key: number;
    appModuleName: string;
    appModuleNameId: string | number | null;
    appFeature: string;
    parentRowKey: number;
    personaId: number | 'DEFAULT';
    isActive: boolean | null;
    isEditMode: boolean;
    isRowSaved?: boolean;

    application: string;
    applicationId: string;
    toolType?: string;
    expandedRowData?: IPermissionRow[];
}

interface DropdownOption {
    label: string;
    value: string | number;
}

function AddNewRoleScreen() {
    const navigate = useNavigate();
    const location = useLocation();
    const searchParams = new URLSearchParams(location.search);
    const roleIdRef = useRef<string | null>(null);

    useEffect(() => {
        const fetchLatestRoleId = async () => {
            try {
                const response = await getLatestRoleId();
                setRoleAlias(response.data?.data);
            } catch (error) {
                logError(error);
                setRoleAlias('');
            }
        };

        fetchLatestRoleId();
    }, []);
    useEffect(() => {
        if (!roleIdRef.current) {
            roleIdRef.current = searchParams.get('roleId');
            if (roleIdRef.current != null) {
                setRoleId(roleIdRef.current);
            }
        }
        if (roleIdRef.current) {
            fetchRoleDetails(parseInt(roleIdRef.current, 10));
        }
    }, []);

    const [openCancelDialog, setOpenCancelDialog] = useState<boolean>(false);
    const [openGeneralContainer, setOpenGeneralContainer] = useState<boolean>(true);
    const [openAccessPermissionsContainer, setOpenAccessPermissionsContainer] =
        useState<boolean>(false);
    const [isGeneralContainerFormSaved, setIsGeneralContainerFormSaved] = useState<boolean>(false);
    const [toggleToast, setToggleToast] = useState<boolean>(false);
    const [toggleErrorToast, setToggleErrorToast] = useState<boolean>(false);
    const [loading, setLoading] = useState<boolean>(false);
    const addNewRoleFormDataRef = useRef<IAddNewRoleFormData>({} as IAddNewRoleFormData);

    const [unSavedDialog, setUnSavedDialog] = useState<boolean>(false);

    const [openUserAttributesContainer, setOpenUserAttributesContainer] = useState<boolean>(false);
    const [selectedAttributes, setSelectedAttributes] = useState<
        { label: string; value: string; isGeography?: boolean }[]
    >([]);

    const onClickGeneralContainer = useCallback(() => {
        setOpenGeneralContainer(!openGeneralContainer);
    }, [openGeneralContainer]);

    const onClickAccessPermissionsContainer = useCallback(() => {
        setOpenAccessPermissionsContainer(!openAccessPermissionsContainer);
    }, [openAccessPermissionsContainer]);

    const onClickUserAtrributeContainer = useCallback(() => {
        setOpenUserAttributesContainer(!openUserAttributesContainer);
    }, [openUserAttributesContainer]);

    const onSaveClose = useCallback(() => {
        navigate('/admin-hub/role-management');
        window.location.reload(); //TempFix
        return true;
    }, []);

    const dispatch = useDispatch<AppDispatch>();

    const primaryFunctions = useSelector((state: RootState) => state.roleFunctions);
    const primaryRoleFunctions = primaryFunctions.data;
    const primaryRoleSubFunctions = primaryFunctions.subFunctionData;
    const primaryRoleLevels = primaryFunctions.roleLevelsData;
    const departments = primaryFunctions.departmentsBySubfunction;
    const subDepartmentsList = primaryFunctions.subDepartments;
    const geographyLevels = primaryFunctions.geographyLevel;
    const userAttributes = primaryFunctions.userAttributes;

    const [roleName, setRoleName] = useState<string>('');
    const [roleId, setRoleId] = useState<string>('');
    const [, setRoleAlias] = useState<string>('');
    const [roleLevel, setRoleLevel] = useState<Record<string, string | number>>({});
    const [roleFunction, setRoleFunction] = useState<Record<string, string | number>>({});
    const [roleSubFunction, setRoleSubFunction] = useState<Record<string, string | number>>({});
    const [roleRegion, setRoleRegion] = useState<Record<string, string | number>>({});
    const [roleCluster, setRoleCluster] = useState<Record<string, string | number>>({});
    const [roleMarket, setRoleMarket] = useState<Record<string, string | number>>({});
    const [roleSite, setRoleSite] = useState<Record<string, string | number>>({});
    const [showDuplicateRoleMessage, setShowDuplicateRoleMessage] = useState(false);
    const [isReset, setIsReset] = useState<{ [key: string]: boolean }>({
        levels: false,
        functions: false,
        subFunctions: false,
        geographyLevels: false,
        subDepartments: false,
        region: false,
        cluster: false,
        market: false,
        sites: false,
    });
    const [department, setDepartment] = useState<DropdownOption | null>(null);
    const [subDepartment, setSubDepartment] = useState<DropdownOption | null>(null);
    const [isSaveButtonDisabled, setIsSaveButtonDisabled] = useState(true);
    const [appNamesWithoutPermissions, setAppNamesWithoutPermissions] = useState<string[]>([]);
    const [appNamesWithoutAdGroups, setAppNamesWithoutAdGroups] = useState<string[]>([]);
    const [openSaveRoleDialog, setOpenSaveRoleDialog] = useState<boolean>(false);
    const [selectedGeographyLevel, setSelectedGeographyLevel] = useState<
        Record<string, string | number>
    >({});
    const [isSaveAndContinueClicked, setIsSaveAndContinueClicked] = useState<boolean>(false);

    const [committedPersonasByApp, setCommittedPersonasByApp] = useState<
        Record<string, Set<string>>
    >({});

    const [savedPersonasByRow, setSavedPersonasByRow] = useState<Record<number, OptionType[]>>({});

    const [openPersonaFlyout, setOpenPersonaFlyout] = useState(false);
    const [, setActiveToolRowKey] = useState<number | null>(null);
    const [selectedToolName, setSelectedToolName] = useState('');
    const [flyoutPersonas, setFlyoutPersonas] = useState<FlyoutPersona[]>([]);
    const [flyoutPermissions, setFlyoutPermissions] = useState<FlyoutPermissionRow[]>([]);

    useEffect(() => {
        if (roleIdRef.current == null) {
            setRoleId('00001');
        } else {
            setRoleId(roleIdRef.current);
        }

        dispatch(fetchRoleDropdownData());
        dispatch(fetchUserAttributes());
    }, []);

    const ALL_OPTION = {
        label: 'ALL',
        value: 'ALL',
    };

    const addAllOption = (options: OptionType[]) => {
        return [ALL_OPTION, ...options];
    };

    const getPrimaryRoleLevels = useCallback(() => {
        if (!primaryRoleLevels.length) {
            return [];
        }
        const convertedData = convertOptions(
            primaryRoleLevels as any,
            'responsibilityLevelName',
            'responsibilityLevelId',
        );
        return convertedData;
    }, [primaryRoleLevels]);

    const getPrimaryRoleFunctions = useCallback(() => {
        if (!primaryRoleFunctions.length) {
            return [];
        }
        const convertedData = convertOptions(
            primaryRoleFunctions as any,
            'functionName',
            'functionId',
        );
        return convertedData;
    }, [primaryRoleFunctions]);

    const getPrimaryRoleSubFunctions = useCallback(() => {
        if (!primaryRoleSubFunctions.length) {
            return [];
        }
        const convertedData = convertOptions(
            primaryRoleSubFunctions as any,
            'subFunctionName',
            'subFunctionId',
        );
        return addAllOption(convertedData);
    }, [primaryRoleSubFunctions]);

    const getDepartmentOptions = useCallback(() => {
        // If Sub-function is ALL → only ALL
        if (roleSubFunction?.value === 'ALL') {
            return [ALL_OPTION];
        }

        if (!departments.length) return [];

        const converted = convertOptions(departments as any, 'departmentName', 'departmentId');

        return addAllOption(converted);
    }, [departments, roleSubFunction]);

    const getSubDepartmentOptions = useCallback(() => {
        // If Sub-function OR Department is ALL → only ALL
        if (roleSubFunction?.value === 'ALL' || department?.value === 'ALL') {
            return [ALL_OPTION];
        }

        if (!subDepartmentsList.length) return [];

        const converted = convertOptions(
            subDepartmentsList as any,
            'subDepartmentName',
            'subDepartmentId',
        );

        return addAllOption(converted);
    }, [subDepartmentsList, roleSubFunction, department]);

    const getGeographyLevels = useCallback(() => {
        if (!geographyLevels.length) {
            return [];
        }

        const convertedData = convertOptions(
            geographyLevels as any,
            'geographyLevelName',
            'geographyLevelID',
        );
        return convertedData;
    }, [geographyLevels]);

    const onChangeRoleFunctionHandler = useCallback((functionId: number) => {
        setIsReset({
            levels: false,
            functions: false,
            subFunctions: true,
            region: false,
            cluster: false,
            market: false,
            sites: false,
        });
        setRoleSubFunction({});
        setIsSaveAndContinueClicked(false);
        dispatch(fetchSubRoleFunctions({ functionId }));
    }, []);

    useEffect(() => {
        if (
            roleName &&
            roleLevel.value &&
            roleFunction.value &&
            roleSubFunction.value &&
            department?.value &&
            subDepartment?.value &&
            selectedGeographyLevel?.value
        ) {
            setIsSaveButtonDisabled(false);
        } else {
            setIsSaveButtonDisabled(true);
            setShowDuplicateRoleMessage(false);
        }
    }, [
        roleName,
        roleId,
        roleLevel,
        roleFunction,
        roleSubFunction,
        roleRegion,
        roleCluster,
        roleMarket,
        roleSite,
        department,
        subDepartment,
        selectedGeographyLevel,
    ]);

    const onClickHandlerForGeneralInformation = async () => {
        const _duplicateCheckPayload = {
            roleName: roleName,
            responsibilityLevelId: Number(roleLevel.value),
            functionId: Number(roleFunction.value),
            subFunctionId: getIdOrZero(roleSubFunction.value),
            departmentId: getIdOrZero(department?.value),
            subDepartmentId: getIdOrZero(subDepartment?.value),
            geographyLevelId: Number(selectedGeographyLevel?.value),
            userAttributeIds: '',
            kpiIds: '',
            isAllSubFunction: roleSubFunction?.value === 'ALL',
            isAllDepartment: department?.value === 'ALL',
            isAllSubDepartment: subDepartment?.value === 'ALL',
        };

        try {
            const response = await checkDuplicateRoleDetails(_duplicateCheckPayload);
            const isDuplicateRole = response.data.data;
            if (isDuplicateRole) {
                setShowDuplicateRoleMessage(true);
                setIsSaveButtonDisabled(true);
            } else {
                const _generalInformationFormData = {
                    roleName,
                    roleLevel,
                    roleFunction,
                    roleSubFunction,
                    department,
                    subDepartment,
                    selectedGeographyLevel,
                };
                setIsGeneralContainerFormSaved(true);
                setOpenGeneralContainer(!openGeneralContainer);
                addNewRoleFormDataRef.current.generalInformationFormData =
                    _generalInformationFormData;
            }
            setIsSaveAndContinueClicked(true);
        } catch (error) {
            logError('Error checking duplicate role:', error);
        }
    };

    const [isAddNewApplicationButtonClicked, setIsAddNewApplicationButtonClicked] =
        useState<boolean>(false);
    const [isAddNewApplicationButtonDisabled, setIsAddNewApplicationButtonDisabled] =
        useState<boolean>(false);
    const [isEditModeOn, setIsEditModeOn] = useState<boolean>(false);
    const [, setShowEditButton] = useState<boolean>(false);
    const [data, setData] = useState<IPermissionRow[]>([]);
    const [paginatedData, setPaginatedData] = useState<IPermissionRow[]>([]);
    const [selectedApplications, setSelectedApplications] = useState<Record<number, OptionType[]>>(
        {},
    );
    const [pageNumber, setPageNumber] = useState(1);
    const [pageSize, setPageSize] = useState(10);
    const currentRecordRef = useRef<{ currentRecordKey: null | number }>({
        currentRecordKey: null,
    });
    const tableRef = useRef<any>(null);
    const [toolsPersonaData, setToolsPersonaData] = useState<any[]>([]);
    const [, setIsToolsLoading] = useState(false);
    const [personaOptions, setPersonaOptions] = useState<Record<number, IToolPersona[]>>({});
    const [selectedPersonas, setSelectedPersonas] = useState<Record<number, OptionType[]>>({});
    useEffect(() => {
        const fetchToolsAndPersonas = async () => {
            try {
                setIsToolsLoading(true);
                const response = await getAllToolsPersonaPermissionDetails();
                setToolsPersonaData(response.data?.data ?? []);
            } catch (error) {
                logError('Failed to fetch tools persona permission details', error);
                setToolsPersonaData([]);
            } finally {
                setIsToolsLoading(false);
            }
        };

        fetchToolsAndPersonas();
    }, []);

    const getSelectedPersonas = (key: number) => {
        return savedPersonasByRow[key] ?? [];
    };
    const prepareFlyoutDataForRow = (clickedRowKey: number) => {
        const clickedRow = data.find(row => row.key === clickedRowKey);
        if (!clickedRow || !clickedRow.applicationId) return;

        const toolId = clickedRow.applicationId;

        // Collect ALL rows for this tool
        const toolRows = data.filter(
            row =>
                row.applicationId === toolId &&
                Array.isArray(row.expandedRowData) &&
                row.expandedRowData.length > 0,
        );
        if (!toolRows.length) return;

        //  Collect ONLY personas actually ADDED by user (tool-level)
        const committedPersonaIds = Array.from(committedPersonasByApp[toolId] ?? []).map(id =>
            String(id),
        );

        const personas: FlyoutPersona[] = committedPersonaIds
            .map(personaId => {
                const personaOption = Object.values(savedPersonasByRow)
                    .flat()
                    .find(p => p.value === personaId);

                if (!personaOption) return null;

                return {
                    personaId,
                    personaName: personaOption.label,
                };
            })
            .filter(Boolean) as FlyoutPersona[];

        // Aggregate permissions
        const permissionMap = new Map<string, FlyoutPermissionRow>();

        toolRows.forEach(row => {
            row.expandedRowData!.forEach(permission => {
                const permissionKey = String(permission.key);

                if (!permissionMap.has(permissionKey)) {
                    const entry: FlyoutPermissionRow = {
                        key: permissionKey,
                        moduleId: permission.appModuleNameId ?? 0,
                        moduleName: permission.appModuleName,
                        permissionName: permission.appFeature,
                        personaAccess: {},
                    };

                    // Initialize ONLY added personas
                    personas.forEach(p => {
                        entry.personaAccess[p.personaId] = null;
                    });

                    permissionMap.set(permissionKey, entry);
                }

                const rowEntry = permissionMap.get(permissionKey)!;

                const normalizedPersonaId =
                    permission.personaId === 'DEFAULT' ? 'DEFAULT' : String(permission.personaId);

                //  Ignore permissions belonging to personas not added
                if (!Object.hasOwn(rowEntry.personaAccess, normalizedPersonaId)) {
                    return;
                }

                const currentValue = rowEntry.personaAccess[normalizedPersonaId];

                //  OR-merge logic
                if (currentValue === true) {
                    rowEntry.personaAccess[normalizedPersonaId] = true;
                } else if (permission.isActive === true) {
                    rowEntry.personaAccess[normalizedPersonaId] = true;
                } else {
                    rowEntry.personaAccess[normalizedPersonaId] = false;
                }
            });
        });

        // Push to Flyout
        setFlyoutPersonas(personas);
        setFlyoutPermissions(Array.from(permissionMap.values()));
    };

    const onClickHandlerForAddNewApplicationButton = () => {
        setOpenAccessPermissionsContainer(true);
        setIsAddNewApplicationButtonDisabled(true);
        setIsAddNewApplicationButtonClicked(true);
        setIsEditModeOn(false);

        const recordKey = Date.now();
        currentRecordRef.current.currentRecordKey = recordKey;

        setData(prev => [
            {
                key: recordKey,
                parentRowKey: recordKey,
                application: '',
                applicationId: '',
                toolType: '',
                appModuleName: '',
                appModuleNameId: null,
                appFeature: '',
                personaId: 'DEFAULT',
                isActive: null,
                isEditMode: true,
                isRowSaved: false,
                expandedRowData: [],
            },
            ...prev,
        ]);

        //  initialize persona state for NEW row
        setSelectedPersonas(prev => ({
            ...prev,
            [recordKey]: [],
        }));

        setPersonaOptions(prev => ({
            ...prev,
            [recordKey]: [],
        }));
    };

    const getApplicationsForDropdown = () => {
        return toolsPersonaData
            .filter(tool => {
                const toolId = tool.toolDetails.toolId.toString();
                const committedCount = committedPersonasByApp[toolId]?.size ?? 0;
                return committedCount < tool.personas.length;
            })
            .map(tool => ({
                label: tool.toolDetails.toolName,
                desc: `${tool.toolDetails.toolType} ${tool.toolDetails.toolId}`,
                value: tool.toolDetails.toolId.toString(),
                toolType: tool.toolDetails.toolType,
            }));
    };
    const handleBackClick = (e: any) => {
        e.preventDefault();
        setUnSavedDialog(true);
    };

    const handleAppChange = useCallback(
        (value: ICustomOptionType, record: TableRow) => {
            // Find the selected tool from API response
            const selectedTool = toolsPersonaData.find(
                (tool: IToolPersonaPermission) =>
                    tool.toolDetails.toolId.toString() === value.value,
            );
            // CLEAR previously selected personas for THIS ROW
            setSelectedPersonas(prev => {
                const updated = { ...prev };
                delete updated[record.key];
                return updated;
            });

            setPersonaOptions(prev => ({
                ...prev,
                [record.key]: selectedTool.personas,
            }));

            if (!selectedTool) {
                return;
            }

            //  Update selected application for this row
            setSelectedApplications(prev => ({
                ...prev,
                [record.key]: [value],
            }));

            //  Store personas for this tool (row‑wise)
            setPersonaOptions(prev => ({
                ...prev,
                [record.key]: selectedTool.personas,
            }));

            setData(prevData => {
                if (!selectedTool) return prevData;

                const toolRowKey = record.key;

                const expandedRowData: IPermissionRow[] = selectedTool.personas.flatMap(
                    (persona: any) =>
                        persona.modules.flatMap((module: any) =>
                            module.permission.map((permission: any) => ({
                                key: permission.permissionId,
                                parentRowKey: toolRowKey,
                                personaId: persona.personaId ?? 'DEFAULT',
                                application: selectedTool.toolDetails.toolName,
                                applicationId: selectedTool.toolDetails.toolId.toString(),
                                toolType: selectedTool.toolDetails.toolType,
                                appModuleName: module.module,
                                appModuleNameId: module.moduleId,
                                appFeature: permission.permissionName,
                                isActive: permission.isActiveToolPermission ?? null,
                                isEditMode: true,
                                isRowSaved: false,
                            })),
                        ),
                );

                return prevData.map(row =>
                    row.key === toolRowKey
                        ? {
                              ...row,
                              application: selectedTool.toolDetails.toolName,
                              applicationId: selectedTool.toolDetails.toolId.toString(),
                              toolType: selectedTool.toolDetails.toolType,
                              expandedRowData,
                          }
                        : row,
                );
            });

            // Reset persona and permission warnings for this tool
            setAppNamesWithoutPermissions(prev => prev.filter(app => app !== value.desc));

            setAppNamesWithoutAdGroups(prev => prev.filter(app => app !== value.desc));
        },
        [toolsPersonaData],
    );

    const handleApplyPersonas = useCallback(
        (recordKey: number, selectedValues: OptionType[]) => {
            const personaOpts =
                personaOptions[recordKey]?.map(persona => ({
                    label: persona.personaName ?? 'Default Persona',
                    value: String(persona.personaId),
                })) ?? [];

            const hydratedValues: OptionType[] = selectedValues.map(v => {
                const match = personaOpts.find(opt => opt.value === v.value);
                return {
                    value: v.value,
                    label: match?.label ?? '',
                };
            });

            //  Store personas PER ROW

            setSelectedPersonas(prev => ({
                ...prev,
                [recordKey]: selectedValues,
            }));

            const selectedPersonaIds = hydratedValues.map(p => p.value);

            // Update permissions table based on selected personas
            setData(prevData =>
                prevData.map(row => {
                    if (row.key !== recordKey || !row.expandedRowData) {
                        return row;
                    }

                    let activePermissionCount = 0;

                    const updatedExpandedRows = row.expandedRowData.map((permission: any) => {
                        // No persona selected → reset
                        if (selectedPersonaIds.length === 0) {
                            return {
                                ...permission,
                                isActive: null,
                                isEditMode: false,
                            };
                        }

                        const isPersonaMatched = selectedPersonaIds.includes(
                            permission.personaId.toString(),
                        );

                        if (isPersonaMatched && permission.isActive) {
                            activePermissionCount += 1;
                        }

                        return {
                            ...permission,
                            isEditMode: isPersonaMatched,
                            isActive: isPersonaMatched ? permission.isActive : null,
                        };
                    });

                    return {
                        ...row,
                        expandedRowData: updatedExpandedRows,
                        selectedPermissionCount: activePermissionCount,
                    };
                }),
            );

            const appName = data.find(row => row.key === recordKey)?.application ?? '';

            if (selectedPersonaIds.length === 0) {
                setAppNamesWithoutAdGroups(prev =>
                    appName && !prev.includes(appName) ? [...prev, appName] : prev,
                );
            } else {
                setAppNamesWithoutAdGroups(prev => prev.filter(app => app !== appName));
            }
        },
        [personaOptions, data],
    );

    const getDisabledStatusForCheck = (key: number) => {
        if (!selectedPersonas[key] || selectedPersonas[key].length === 0) {
            return true;
        }
        return false;
    };
    const handleCheckClick = (key: number) => {
        const row = data.find(r => r.key === key);
        if (!row?.applicationId) return;

        const finalPersonas = selectedPersonas[key] ?? [];
        const appId = row.applicationId;

        // Save personas for READ (view mode)
        setSavedPersonasByRow(prev => ({
            ...prev,
            [key]: finalPersonas,
        }));

        // Commit personas for TOOL‑LEVEL
        setCommittedPersonasByApp(prev => {
            const updated = { ...prev };
            const existingSet = updated[appId] ?? new Set<string>();

            finalPersonas.forEach(p => existingSet.add(p.value));

            updated[appId] = existingSet;
            return updated;
        });

        setData(prev =>
            prev.map(r =>
                r.key === key
                    ? {
                          ...r,
                          isEditMode: false,
                          isRowSaved: true,
                          disableEditForApplicationRow: true,
                          disableExpand: true,
                      }
                    : r,
            ),
        );

        setSelectedPersonas(prev => {
            const updated = { ...prev };
            delete updated[key];
            return updated;
        });

        // Enable Add Tool again
        setIsAddNewApplicationButtonDisabled(false);
    };

    const handleRemoveRow = (key: number) => {
        const rowToDelete = data.find(row => row.key === key);
        if (!rowToDelete?.applicationId) return;

        const appId = rowToDelete.applicationId;
        const personasToFree = savedPersonasByRow[key] ?? [];

        // Free only this row’s personas
        setCommittedPersonasByApp(prev => {
            const updated = { ...prev };
            const existingSet = updated[appId];

            if (!existingSet) return updated;

            const newSet = new Set(existingSet);
            personasToFree.forEach(p => newSet.delete(p.value));

            if (newSet.size === 0) {
                delete updated[appId];
            } else {
                updated[appId] = newSet;
            }

            return updated;
        });

        // Remove saved display personas
        setSavedPersonasByRow(prev => {
            const updated = { ...prev };
            delete updated[key];
            return updated;
        });

        // Remove draft personas (if any)
        setSelectedPersonas(prev => {
            const updated = { ...prev };
            delete updated[key];
            return updated;
        });

        //  Remove row itself
        setData(prev => prev.filter(row => row.key !== key));

        //  Re‑enable Add Tool button
        setIsAddNewApplicationButtonDisabled(false);
    };

    const getPersonaOptions = (key: number): OptionType[] => {
        // 1 Find the tool selected in this row
        const row = data.find(r => r.key === key);
        const appId = row?.applicationId ?? '';

        if (!appId) return [];

        // 2 Get personas already committed for this tool
        const committedPersonaIds: string[] = committedPersonasByApp[appId]
            ? Array.from(committedPersonasByApp[appId])
            : [];

        // 3 Get all personas available for this row’s tool
        const personasForRow = personaOptions[key] ?? [];

        // 4 Filter out already‑committed personas and map to dropdown options
        const availablePersonaOptions: OptionType[] = personasForRow
            .filter(persona => {
                const personaId = String(persona.personaId);
                return !committedPersonaIds.includes(personaId);
            })
            .map(persona => ({
                label: persona.personaName ?? 'Default Persona',
                value: String(persona.personaId),
                desc: persona.personaDescription ?? '',
            }));

        return availablePersonaOptions;
    };

    const getSelectedApplication = (key: number) => {
        return (
            selectedApplications[key]?.map(({ label, value, desc }) => ({
                label,
                value,
                desc: desc as string,
            })) || []
        );
    };

    const handlePageChange = (page: number) => {
        setPageNumber(page);
    };

    const handlePageSizeChange = (size: number) => {
        setPageSize(size);
    };

    const TableColumns = [
        {
            key: 'application',
            dataIndex: 'application',
            title: 'Tools & Permissions',
            width: '360px',
            externalStyles: { whiteSpace: 'normal', alignItems: 'center' },
            customExpandableColumn: true,
            render: (_value: string, record: TableRow) => (
                <>
                    {record.expandedRowData ? (
                        record.isEditMode && !record.disableEditForApplicationRow ? (
                            <div
                                style={{ width: '100%' }}
                                onClick={event => {
                                    event.stopPropagation();
                                }}
                            >
                                <TagSelector
                                    dataTestId="application-drop-down"
                                    id="application-drop-down"
                                    displayLabel
                                    className={styles['application-tag-selector']}
                                    onChange={value => {
                                        handleAppChange(value as ICustomOptionType, record);
                                    }}
                                    options={getApplicationsForDropdown()}
                                    selectedOptions={getSelectedApplication(record.key)}
                                    placeholder="Select Tool"
                                    searchInput={{
                                        searchPlaceholder: 'Search',
                                        searchSize: 'S',
                                        searchWholeString: true,
                                    }}
                                    size="S"
                                    type="menuList"
                                    showCloseIcon={false}
                                    optionsContainerClassName={
                                        styles['row-edit-application-tag-selector-container']
                                    }
                                    portal={true}
                                />
                            </div>
                        ) : (
                            <div className={styles['application-cell-container']}>
                                {!record.isRowSaved && (
                                    <Icon name="chevron-down" size="xm" color="neutrals-B300" />
                                )}
                                <div className={styles['header-title']}>
                                    <span className={styles['application-permissions-cell-title']}>
                                        {record.toolType} {record.applicationId}
                                    </span>
                                    <span
                                        className={styles['application-permissions-cell-content']}
                                        onClick={e => {
                                            e.stopPropagation();

                                            setActiveToolRowKey(record.key);
                                            setSelectedToolName(record.application ?? '');
                                            prepareFlyoutDataForRow(record.key);
                                            setOpenPersonaFlyout(true);
                                        }}
                                    >
                                        {record.application}
                                    </span>
                                </div>
                            </div>
                        )
                    ) : (
                        <div className={styles['header-title']}>
                            <span className={styles['application-permissions-cell-title']}>
                                {record.appModuleName}
                            </span>
                            <span className={styles['application-permissions-cell-content']}>
                                {record.appFeature}
                            </span>
                        </div>
                    )}
                </>
            ),
        },

        {
            key: 'adgroup',
            dataIndex: 'adgroup',
            title: 'Persona',
            width: '200px',
            externalStyles: { whiteSpace: 'normal', alignItems: '' },

            render: (_value: string, record: TableRow) => {
                const personas = getSelectedPersonas(record.key);

                // AFTER SAVE → TEXT ONLY
                if (record.isRowSaved) {
                    return (
                        <div
                            className={styles['persona-readonly-text']}
                            onClick={e => e.stopPropagation()}
                        >
                            {personas.length > 0 ? personas.map(p => p.label).join(', ') : '-'}
                        </div>
                    );
                }

                // BEFORE SAVE → TAGSELECTOR
                return (
                    <>
                        <div
                            onClick={e => {
                                e.stopPropagation();
                            }}
                        >
                            <TagSelector
                                key={`persona-${record.key}-${record.applicationId}`}
                                dataTestId="adgroup-drop-down"
                                displayLabel
                                portal={true}
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
                                id="adgroup-drop-down"
                                maxWidth={500}
                                onChange={value => {
                                    const selectedValues = Array.isArray(value) ? value : [value];
                                    handleApplyPersonas(record.key, selectedValues);
                                }}
                                options={getPersonaOptions(record.key)}
                                placeholder="Select Persona"
                                selectedOptions={personas}
                                size="L"
                                type="menuList"
                                optionsContainerClassName={
                                    styles['row-edit-application-tag-selector-container']
                                }
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
                <Flex align="center" justify="flex-start" gap={8}>
                    {record.expandedRowData &&
                        (record.isEditMode && !isEditModeOn ? (
                            <Flex justify="space-between" gap={20}>
                                <IconButton
                                    size="Small"
                                    icon="check"
                                    onClick={() => {
                                        handleCheckClick(record.key);
                                    }}
                                    disabled={getDisabledStatusForCheck(record.key)}
                                />
                                <IconButton
                                    size="Small"
                                    icon="x-close"
                                    onClick={() => handleRemoveRow(record.key)}
                                    disabled={false}
                                />
                            </Flex>
                        ) : (
                            <IconButton
                                size="Small"
                                icon="trash-01"
                                onClick={() => {
                                    handleRemoveRow(record.key);
                                }}
                                disabled={isEditModeOn}
                            />
                        ))}
                </Flex>
            ),
        },
    ];

    useEffect(() => {
        if (!data.length) {
            // Set isAddNewApplicationButtonClicked to false to hide the table if no data present in table
            setIsAddNewApplicationButtonClicked(false);
            // Disable Edit button if no data present in table on click of remove button
            setShowEditButton(false);
            setIsEditModeOn(false);
        }
        const _paginatedData = data.slice((pageNumber - 1) * pageSize, pageNumber * pageSize);
        setPaginatedData(_paginatedData);
    }, [data, pageNumber, pageSize]);

    const fetchRoleDetails = async (roleId: number) => {
        try {
            const response = await getRoleDetailsByIId({
                roleId,
            });
            const roleData = response.generalInformation;

            setRoleLevel({
                value: roleData.responsibilityLevelId,
                label: roleData.responsibilityLevel,
            });
            setRoleFunction({ value: roleData.functionId, label: roleData.function });
            setRoleSubFunction({ value: roleData.subFunctionId, label: roleData.subFunction });
            setRoleRegion({ value: roleData.regionId, label: roleData.region });
            setRoleCluster({ value: roleData.clusterId, label: roleData.cluster });
            setRoleMarket({ value: roleData.marketId, label: roleData.market });
            setRoleSite({ value: roleData.siteId, label: roleData.site });
        } catch (error) {
            logError('Failed to fetch role details:', error);
        }
    };
    const getAllSavedPersonaIds = (personasByRow: Record<number, OptionType[]>): string | null => {
        const ids = Object.values(personasByRow)
            .flat()
            .map(p => p.value);

        if (ids.length === 0) {
            return null;
        }

        return Array.from(new Set(ids)).join(',');
    };

    const onSaveRole = useCallback(async () => {
        try {
            setLoading(true);

            const roleData = {
                roleName: roleName,
                responsibilityLevelId: Number(roleLevel.value),
                functionId: Number(roleFunction.value),
                subFunctionId: getIdOrZero(roleSubFunction.value),
                departmentId: getIdOrZero(department?.value),
                subDepartmentId: getIdOrZero(subDepartment?.value),
                geographyLevelId: Number(selectedGeographyLevel?.value),
                userAttributeIds:
                    selectedAttributes.length > 0
                        ? selectedAttributes.map(a => a.value).join(',')
                        : null,
                kpiIds: '',
                isAllSubFunction: roleSubFunction?.value === 'ALL',
                isAllDepartment: department?.value === 'ALL',
                isAllSubDepartment: subDepartment?.value === 'ALL',
                toolPersonaIds: getAllSavedPersonaIds(savedPersonasByRow),
            };

            await saveRoleDetails(roleData);
            setToggleToast(true);
            setShowEditButton(false);
            setOpenCancelDialog(false);
            setUnSavedDialog(false);
            setTimeout(() => {
                navigate('/admin-hub/role-management');
            }, 3000);
        } catch (error) {
            logError(error);
            setToggleErrorToast(true);
            setShowEditButton(true);
        } finally {
            setLoading(false);
        }
        return true;
    }, [
        roleName,
        roleLevel,
        roleFunction,
        roleSubFunction,
        department,
        subDepartment,
        selectedGeographyLevel,
        selectedAttributes,
        savedPersonasByRow,
        selectedPersonas,
    ]);

    const showAdGroupValidationMessage = useCallback(() => {
        return (
            appNamesWithoutAdGroups.length > 0 && (
                <div className={styles['error-text-container']}>
                    <Label type="body2">
                        <Icon name="info-circle" size="xm" color="status-error-color" />
                        <span className={styles['error-text-color']}>
                            {' '}
                            No AD Group selected for tool{' '}
                            {appNamesWithoutAdGroups.map(item => `"${item}"`).join(', ')}. The tool
                            will be removed from users list if no AD Group is selected.
                        </span>
                    </Label>
                </div>
            )
        );
    }, [appNamesWithoutAdGroups]);

    const showPermissionsValidationMessage = useCallback(() => {
        return (
            appNamesWithoutPermissions.length > 0 && (
                <div className={styles['error-text-container']}>
                    <Label type="body2">
                        <Icon name="info-circle" size="xm" color="status-error-color" />
                        <span className={styles['error-text-color']}>
                            {' '}
                            No permission selected for tool{' '}
                            {appNamesWithoutPermissions.map(item => `"${item}"`).join(', ')}. The
                            tool will be removed from users list if no permission is selected.
                        </span>
                    </Label>
                </div>
            )
        );
    }, [appNamesWithoutPermissions]);

    return (
        <div className={styles['container']}>
            <div className={styles['header']}>
                <div className={styles['header-title-container']}>
                    <div className={styles['header-back-button']}>
                        <Link to="/admin-hub/role-management" onClick={handleBackClick}>
                            {BackArrowIcon(8, 12)}
                        </Link>
                    </div>
                    <div className={styles['header-title']}>
                        <Label type="h2">Add New Role</Label>
                        <div className={styles['space-v-8']} />
                        <Label type="body2">
                            <span className={styles['add-new-role-description']}>
                                Create a role and define role permissions here.
                            </span>
                        </Label>
                    </div>
                </div>
                <div className={styles['header-action-container']}>
                    <Button
                        text="Cancel"
                        variant="Secondary"
                        size="S"
                        onClick={() => setOpenCancelDialog(true)}
                    />
                    <div className={styles['space-h-8']} />
                    <Button
                        text="Save Role"
                        disabled={isSaveButtonDisabled || !isSaveAndContinueClicked}
                        variant="Primary"
                        size="S"
                        onClick={() => {
                            setOpenSaveRoleDialog(true);
                        }}
                        loading={loading}
                    />
                </div>
            </div>
            <ExpandableForm
                title={
                    <>
                        {isGeneralContainerFormSaved && (
                            <Icon name="check-circle" size="xl" color="feedback-success-color" />
                        )}

                        <span>General Information</span>
                    </>
                }
                description={`Add key tool details like the name, function, level and appropriate
                            geographical information to make it findable and accessible`}
                applyCustomSpacing={true}
                isOpen={openGeneralContainer}
                content={
                    <div>
                        <div className={styles['form-category-heading']}>
                            <Label type="h2">
                                <span className={styles['form-category-heading-typography']}>
                                    Overview
                                </span>
                            </Label>
                        </div>

                        <Row gutter={{ xs: 24, md: 24 }}>
                            <Col span={8}>
                                <Flex className={styles['form-inputs-flex-col']}>
                                    <InputField
                                        label={'Role Name'}
                                        placeholder="Enter Role Name"
                                        value={roleName}
                                        required={true}
                                        onChange={event => {
                                            isGeneralContainerFormSaved &&
                                                setIsGeneralContainerFormSaved(false);
                                            const { value } = event.target;
                                            const maxLength = 91; // total role name character limit is 100, but since whiles save or editing  - region will be added, we are limiting the length to 100-9 = 91

                                            if (
                                                value.length <= maxLength &&
                                                validateRoleName(value)
                                            ) {
                                                setRoleName(value);
                                            }
                                            setIsSaveAndContinueClicked(false);
                                            setShowDuplicateRoleMessage(false);
                                        }}
                                    />
                                </Flex>
                            </Col>

                            <Col span={8}>
                                <Flex className={styles['form-inputs-flex-col']}>
                                    <DropDown
                                        id="level-dropdown"
                                        dropdown={{
                                            label: 'Responsibility Level',
                                            options: getPrimaryRoleLevels(),
                                            reset: isReset.levels,
                                            placeholder: 'Select Responsibility Level',
                                            required: true,
                                            onChange: (option: any) => {
                                                isGeneralContainerFormSaved &&
                                                    setIsGeneralContainerFormSaved(false);
                                                setRoleLevel(option);
                                                setShowDuplicateRoleMessage(false);
                                                setIsSaveAndContinueClicked(false);
                                            },
                                            portal: true,

                                            selectedOptions:
                                                roleLevel && roleLevel.value && roleLevel.label
                                                    ? [
                                                          {
                                                              label: String(roleLevel.label),
                                                              value: String(roleLevel.value),
                                                          },
                                                      ]
                                                    : [],
                                        }}
                                        searchInput={{
                                            searchPlaceholder: 'Search',
                                            searchSize: 'L',
                                            searchWholeString: true,
                                        }}
                                    />
                                </Flex>
                            </Col>
                            <Col span={8}>
                                <Flex className={styles['form-inputs-flex-col']}>
                                    <DropDown
                                        id="level-dropdown"
                                        dropdown={{
                                            label: 'Geography Level',
                                            options: getGeographyLevels(),
                                            reset: isReset.levels,
                                            placeholder: 'Select Geography Level',
                                            required: true,
                                            onChange: (option: any) => {
                                                isGeneralContainerFormSaved &&
                                                    setIsGeneralContainerFormSaved(false);
                                                setSelectedGeographyLevel(option);
                                                setShowDuplicateRoleMessage(false);
                                                setIsSaveAndContinueClicked(false);
                                            },
                                            portal: true,
                                            selectedOptions:
                                                selectedGeographyLevel &&
                                                selectedGeographyLevel.value &&
                                                selectedGeographyLevel.label
                                                    ? [
                                                          {
                                                              label: String(
                                                                  selectedGeographyLevel.label,
                                                              ),
                                                              value: String(
                                                                  selectedGeographyLevel.value,
                                                              ),
                                                          },
                                                      ]
                                                    : [],
                                        }}
                                        searchInput={{
                                            searchPlaceholder: 'Search',
                                            searchSize: 'L',
                                            searchWholeString: true,
                                        }}
                                    />
                                </Flex>
                            </Col>
                        </Row>

                        <Row
                            gutter={{ xs: 24, sm: 24, md: 24, lg: 24 }}
                            className={styles['form-category-heading']}
                        >
                            <Col span={8}>
                                <Flex className={styles['form-inputs-flex-col']}>
                                    <DropDown
                                        id="function-dropdown"
                                        dropdown={{
                                            label: 'Function',
                                            options: getPrimaryRoleFunctions(),
                                            reset: isReset.functions,
                                            placeholder: 'Select Function',
                                            required: true,
                                            onChange: (option: any) => {
                                                isGeneralContainerFormSaved &&
                                                    setIsGeneralContainerFormSaved(false);
                                                onChangeRoleFunctionHandler(option.value);
                                                setRoleFunction(option);
                                                setShowDuplicateRoleMessage(false);
                                                setIsSaveAndContinueClicked(false);
                                            },
                                            portal: true,
                                            selectedOptions:
                                                roleFunction &&
                                                roleFunction.value &&
                                                roleFunction.label
                                                    ? [
                                                          {
                                                              label: String(roleFunction.label),
                                                              value: String(roleFunction.value),
                                                          },
                                                      ]
                                                    : [],
                                        }}
                                        searchInput={{
                                            searchPlaceholder: 'Search',
                                            searchSize: 'L',
                                            searchWholeString: true,
                                        }}
                                    />
                                </Flex>
                            </Col>
                            <Col span={8}>
                                <Flex className={styles['form-inputs-flex-col']}>
                                    <DropDown
                                        id="sub-function-dropdown"
                                        dropdown={{
                                            label: 'Sub-Function',
                                            options: getPrimaryRoleSubFunctions(),
                                            reset: isReset.subFunctions,
                                            placeholder: 'Select Sub-Function',
                                            required: true,
                                            onChange: (option: any) => {
                                                isGeneralContainerFormSaved &&
                                                    setIsGeneralContainerFormSaved(false);
                                                setIsReset(oldState => ({
                                                    ...oldState,
                                                    subFunctions: false,
                                                }));
                                                setRoleSubFunction(option);
                                                setShowDuplicateRoleMessage(false);
                                                setIsSaveAndContinueClicked(false);

                                                if (option?.value && option.value !== 'ALL') {
                                                    dispatch(
                                                        fetchDepartmentsBySubfunctionId({
                                                            subfunctionid: option.value,
                                                        }),
                                                    );
                                                }
                                            },
                                            portal: true,
                                            selectedOptions:
                                                roleSubFunction &&
                                                roleSubFunction.value &&
                                                roleSubFunction.label
                                                    ? [
                                                          {
                                                              label: String(roleSubFunction.label),
                                                              value: String(roleSubFunction.value),
                                                          },
                                                      ]
                                                    : [],
                                        }}
                                        searchInput={{
                                            searchPlaceholder: 'Search',
                                            searchSize: 'L',
                                            searchWholeString: true,
                                        }}
                                    />
                                </Flex>
                            </Col>
                            <Col span={8}>
                                <Flex className={styles['form-inputs-flex-col']}>
                                    <DropDown
                                        id="department-dropdown"
                                        dropdown={{
                                            label: 'Department',
                                            options: getDepartmentOptions(),
                                            reset: isReset.departments,
                                            placeholder: 'Select Department',
                                            required: true,
                                            portal: true,
                                            onChange: (option: any) => {
                                                isGeneralContainerFormSaved &&
                                                    setIsGeneralContainerFormSaved(false);

                                                // Set department
                                                setDepartment(option);

                                                //Reset sub-department every time department changes
                                                setSubDepartment(null);

                                                //Trigger dropdown reset (same pattern as sub-functions)
                                                setIsReset(prev => ({
                                                    ...prev,
                                                    subDepartments: true,
                                                }));

                                                setIsSaveAndContinueClicked(false);
                                                setShowDuplicateRoleMessage(false);

                                                // Handle ALL vs specific department
                                                if (option.value === 'ALL') {
                                                    setSubDepartment({
                                                        label: 'ALL',
                                                        value: 'ALL',
                                                    });
                                                } else {
                                                    dispatch(
                                                        fetchSubDepartmentList({
                                                            departmentId: option.value,
                                                        }),
                                                    );
                                                }
                                            },
                                            selectedOptions:
                                                department?.value && department?.label
                                                    ? [
                                                          {
                                                              label: String(department.label),
                                                              value: String(department.value),
                                                          },
                                                      ]
                                                    : [],
                                        }}
                                        searchInput={{
                                            searchPlaceholder: 'Search',
                                            searchSize: 'L',
                                            searchWholeString: true,
                                        }}
                                    />
                                </Flex>
                            </Col>
                        </Row>

                        <Row
                            gutter={{ xs: 24, sm: 24, md: 24, lg: 24 }}
                            className={styles['form-category-heading']}
                        >
                            <Col span={8}>
                                <Flex className={styles['form-inputs-flex-col']}>
                                    <DropDown
                                        id="department-dropdown"
                                        dropdown={{
                                            label: 'Sub-Department',
                                            options: getSubDepartmentOptions(),
                                            reset: isReset.subDepartments,
                                            placeholder: 'Select Sub-Department',
                                            required: true,
                                            portal: true,

                                            onChange: (option: any) => {
                                                isGeneralContainerFormSaved &&
                                                    setIsGeneralContainerFormSaved(false);

                                                setSubDepartment(option);

                                                //  Clear reset flag after selection
                                                setIsReset(prev => ({
                                                    ...prev,
                                                    subDepartments: false,
                                                }));

                                                setShowDuplicateRoleMessage(false);
                                                setIsSaveAndContinueClicked(false);
                                            },
                                            selectedOptions:
                                                subDepartment?.value && subDepartment?.label
                                                    ? [
                                                          {
                                                              label: String(subDepartment.label),
                                                              value: String(subDepartment.value),
                                                          },
                                                      ]
                                                    : [],
                                        }}
                                        searchInput={{
                                            searchPlaceholder: 'Search',
                                            searchSize: 'L',
                                            searchWholeString: true,
                                        }}
                                    />
                                </Flex>
                            </Col>
                        </Row>

                        <Flex
                            justify={showDuplicateRoleMessage ? 'space-between' : 'flex-end'}
                            align="flex-start"
                        >
                            {showDuplicateRoleMessage && (
                                <InlineAlert
                                    variant="error"
                                    title="This role combination already exists"
                                    description={DUPLICATE_ROLE_ERROR_MESSAGE}
                                />
                            )}
                            {!showDuplicateRoleMessage &&
                                roleName &&
                                roleLevel?.value &&
                                roleFunction?.value &&
                                roleSubFunction?.value &&
                                department?.value &&
                                subDepartment?.value &&
                                selectedGeographyLevel?.value && (
                                    <InlineAlert
                                        title="Full role as visible on command center for a user will be:"
                                        description={`${roleLevel.label} ${roleName} – ${roleSubFunction.label} ${department.label}, ${selectedGeographyLevel.label}Name`}
                                    />
                                )}
                        </Flex>
                    </div>
                }
                onClick={onClickGeneralContainer}
                additionalContentInTitleContainer={
                    <>
                        {openGeneralContainer && (
                            <Button
                                text="Save & Continue"
                                variant="Primary"
                                size="L"
                                onClick={onClickHandlerForGeneralInformation}
                                disabled={isSaveButtonDisabled}
                            />
                        )}

                        <Icon
                            name={openGeneralContainer ? 'chevron-up' : 'chevron-down'}
                            size="l"
                            color="neutrals-B800"
                        />
                    </>
                }
            />

            <ExpandableForm
                title={<span>User attributes for the role</span>}
                description="Add all attributes related to the role. Users requesting access to the role will need to select values of the defined attributes as well."
                isOpen={openUserAttributesContainer}
                content={
                    <>
                        <Divider />
                        <Flex style={{ marginTop: '1rem' }} gap={10} align="center">
                            <DropDown
                                className="drop-down"
                                dataTestId="dropd-down"
                                dropdown={{
                                    excludeSelectAllOnFilter: false,
                                    isDisabled: false,
                                    onChange: (__, _: boolean, tree: any[]) => {
                                        const selectedTree = tree as {
                                            label: string;
                                            value: string;
                                        }[];

                                        const allOptions =
                                            userAttributes?.map(d => ({
                                                label: d.userAttributeName,
                                                value: d.userAttributeId.toString(),
                                                isGeography: false,
                                            })) || [];

                                        const isSelectAll = selectedTree.some(
                                            item => item.value === 'all',
                                        );

                                        if (isSelectAll) {
                                            setSelectedAttributes(allOptions);
                                            return;
                                        }

                                        setSelectedAttributes(
                                            selectedTree.map(item => ({
                                                label: item.label,
                                                value: item.value,
                                                isGeography: false,
                                            })),
                                        );
                                    },
                                    onScroll: () => {},
                                    options: [
                                        ...(userAttributes?.map(d => ({
                                            label: d.userAttributeName,
                                            value: d.userAttributeId.toString(),
                                        })) || []),
                                    ],
                                    placeholder: 'Select attributes',
                                    required: false,
                                    reset: false,
                                    selectAllOption: {
                                        label: 'Select All',
                                        value: 'All',
                                    },
                                    portal: true,
                                    selectedOptions: selectedAttributes
                                        .filter(f => !f.isGeography)
                                        .map(({ label, value }) => ({ label, value })),
                                    showMoreCount: false,
                                    showSelectAll: true,
                                    showtooltipcounter: true,
                                    size: 'L',
                                    type: 'checkbox',
                                }}
                                dropdownOptionsClassName="dropdown-options-custom"
                                id="drop-down"
                                searchInput={{
                                    searchCharLimit: 3,
                                    searchPlaceholder: 'Search',
                                    searchSize: 'L',
                                }}
                            />

                            <Flex style={{ flexWrap: 'wrap' }} gap={5}>
                                <div
                                    className={styles['user-attribute-geo-chip']}
                                    key={selectedGeographyLevel.label?.toString() ?? ''}
                                >
                                    {selectedGeographyLevel.label?.toString() ?? ''}
                                </div>
                                {selectedAttributes.map(a => {
                                    return (
                                        <FilterChip
                                            key={a.label}
                                            label={a.label}
                                            className={styles['user-attributes-chip']}
                                            onClose={() => {
                                                setSelectedAttributes(
                                                    selectedAttributes.filter(
                                                        f => f.label !== a.label,
                                                    ),
                                                );
                                            }}
                                        />
                                    );
                                })}
                            </Flex>
                        </Flex>
                    </>
                }
                disabled={!isGeneralContainerFormSaved}
                onClick={onClickUserAtrributeContainer}
                additionalContentInTitleContainer={
                    isGeneralContainerFormSaved && (
                        <Icon
                            name={openUserAttributesContainer ? 'chevron-up' : 'chevron-down'}
                            size="l"
                            color="neutrals-B800"
                        />
                    )
                }
            />
            <ExpandableForm
                title={<span>Tool Access & Permissions</span>}
                description="Select all the tools and persona's the role will have access to"
                isOpen={openAccessPermissionsContainer}
                content={
                    !isEditModeOn &&
                    isAddNewApplicationButtonClicked &&
                    isGeneralContainerFormSaved ? (
                        <>
                            {showPermissionsValidationMessage()}
                            {showAdGroupValidationMessage()}
                            <Table
                                columns={TableColumns as any}
                                expandableRows={false}
                                data={paginatedData}
                                pagination={{
                                    totalItems: data.length > 0 ? data.length : 1,
                                    pageSize,
                                    currentPage: pageNumber,
                                    onPageChange: handlePageChange,
                                    onPageSizeChange: handlePageSizeChange,
                                    blankOut: 10,
                                }}
                                ref={tableRef}
                            />
                        </>
                    ) : (
                        isEditModeOn && (
                            <>
                                {showPermissionsValidationMessage()}
                                {showAdGroupValidationMessage()}
                                <Table
                                    columns={TableColumns as any}
                                    expandableRows={true}
                                    data={data}
                                />
                            </>
                        )
                    )
                }
                disabled={!isGeneralContainerFormSaved}
                onClick={onClickAccessPermissionsContainer}
                additionalContentInTitleContainer={
                    <>
                        {isGeneralContainerFormSaved && (
                            <Button
                                text="Add Tool"
                                disabled={isAddNewApplicationButtonDisabled}
                                variant="Secondary"
                                size="M"
                                onClick={onClickHandlerForAddNewApplicationButton}
                                icon="plus"
                            />
                        )}

                        {isAddNewApplicationButtonClicked && (
                            <Icon
                                name={
                                    openAccessPermissionsContainer ? 'chevron-up' : 'chevron-down'
                                }
                                size="l"
                                color="neutrals-B800"
                            />
                        )}
                    </>
                }
            />

            <Dialog
                content="Are you sure you want to leave without saving the role or continue adding?"
                isOpen={openCancelDialog}
                onClose={() => setOpenCancelDialog(false)}
                onPrimaryButtonClick={() => {
                    setOpenCancelDialog(false);
                    onSaveClose();
                }}
                onSecondaryButtonClick={() => {
                    setOpenCancelDialog(false);
                }}
                primaryButtonText="Leave without Saving"
                secondaryButtonText="Continue Adding"
                title="Unsaved Role"
            />
            <Dialog
                content={
                    <>
                        <p>
                            You have unsaved changes in the current section. If you navigate away,
                            your edits will be lost.
                        </p>

                        <p>Are you sure you want to leave without saving your changes?</p>
                    </>
                }
                isOpen={unSavedDialog}
                onClose={() => setUnSavedDialog(false)}
                onPrimaryButtonClick={() => {
                    setUnSavedDialog(false);
                    onSaveClose();
                }}
                onSecondaryButtonClick={() => {
                    setUnSavedDialog(false);
                }}
                primaryButtonText="Discard Changes"
                secondaryButtonText="Continue Editing"
                title="Unsaved Role"
            />
            <Toast
                type="Success"
                message={`Role: ${roleName} has been added successfully`}
                mode="Top Right"
                distance="x5l"
                toggle={toggleToast}
                timer={5000}
                onCloseToast={() => setToggleToast(false)}
            />
            <Toast
                type="Error"
                message="Failed to send request. Please try again."
                mode="Top Right"
                distance="x5l"
                toggle={toggleErrorToast}
                timer={5000}
                onCloseToast={() => setToggleErrorToast(false)}
            />
            <Dialog
                content={`You are about to create a new role using the provided details. Once saved, this role will be available in command centre. Please confirm to proceed.`}
                isOpen={openSaveRoleDialog}
                onClose={() => {
                    setOpenSaveRoleDialog(false);
                }}
                onPrimaryButtonClick={() => {
                    onSaveRole();
                    setOpenSaveRoleDialog(false);
                    setIsSaveAndContinueClicked(false);
                }}
                onSecondaryButtonClick={() => {
                    setOpenSaveRoleDialog(false);
                }}
                primaryButtonText="Save Role"
                secondaryButtonText="Continue Adding"
                title="Save New Role"
            />

            <ToolPersonaPermissionFlyout
                open={openPersonaFlyout}
                toolName={selectedToolName}
                personas={flyoutPersonas}
                permissions={flyoutPermissions}
                onClose={(uncheckedPersonaIds: string[]) => {
                    if (!uncheckedPersonaIds.length) {
                        setOpenPersonaFlyout(false);
                        return;
                    }

                    //  Remove entire rows that contain any unchecked persona
                    setData(prevData =>
                        prevData.filter(row => {
                            const rowPersonas = savedPersonasByRow[row.key] ?? [];
                            return !rowPersonas.some(p => uncheckedPersonaIds.includes(p.value));
                        }),
                    );

                    setSavedPersonasByRow(prev => {
                        const updated = { ...prev };
                        Object.keys(updated).forEach(rowKey => {
                            const remaining = updated[Number(rowKey)]?.filter(
                                p => !uncheckedPersonaIds.includes(p.value),
                            );
                            if (!remaining || remaining.length === 0) {
                                delete updated[Number(rowKey)];
                            } else {
                                updated[Number(rowKey)] = remaining;
                            }
                        });
                        return updated;
                    });

                    setCommittedPersonasByApp(prev => {
                        const updated = { ...prev };
                        Object.keys(updated).forEach(appId => {
                            const next = new Set(updated[appId]);
                            uncheckedPersonaIds.forEach(id => next.delete(id));
                            if (next.size === 0) {
                                delete updated[appId];
                            } else {
                                updated[appId] = next;
                            }
                        });
                        return updated;
                    });

                    setOpenPersonaFlyout(false);
                }}
            />
        </div>
    );
}

export default AddNewRoleScreen;
