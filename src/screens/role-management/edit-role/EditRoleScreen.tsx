import { Flex, Skeleton } from 'antd';
import {
    Icon,
    Tab,
    Toast,
    InputField,
    DropDown,
    Dialog,
    Button,
    Divider,
    FilterChip,
} from 'konnect-react-components';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Link, useParams, useNavigate } from 'react-router-dom';
import { BackArrowIcon } from '../../../assets/icons/icons';
import { Label } from '../../../components/atoms';
import { DUPLICATE_ROLE_ERROR_MESSAGE } from '../../../utils/constants';
import { IoMdInformationCircleOutline } from 'react-icons/io';
import {
    checkDuplicateRoleDetails,
    getRoleDetailsById,
    updateRoleDetails,
} from '../../../services/roles';
import styles from './EditRoleScreen.module.scss';
import { ExpandableForm, RoleAccessPermissionTab } from '../../../components';
import { IRoleGeneralInformation } from '../../../types/response';
import {
    AppDispatch,
    RootState,
    fetchRoleFunctions,
    fetchSubRoleFunctions,
    fetchRoleLevels,
    fetchDepartments,
    fetchGeographicalRegion,
    fetchUserAttributes,
    fetchRoleDropdownData,
    fetchDepartmentsBySubfunctionId,
    fetchSubDepartmentList,
    fetchToolPersonaPermissionByRole,
} from '../../../store';
import { useDispatch, useSelector } from 'react-redux';
import {
    convertOptions,
    extractOnlyRoleName,
    formatRefreshText,
    logError,
} from '../../../utils/helpers';
import { OptionType } from '../../../types/common';
import RoleUserManagementTable from '../../../../src/components/organisms/user-management-table/RoleUserManagementTable';

enum TabNamesEnum {
    GeneralInformation = 'General Information',
    AccessPermissions = 'Access & Permissions',
    LinkedWorkflowsProcess = 'Linked Workflows & Processes',
    Users = 'Users',
}

function EditRoleScreen() {
    const [selectedTab, setSelectedTab] = useState<string>(TabNamesEnum.GeneralInformation);
    const [generalInfo, setGeneralInfo] = useState<IRoleGeneralInformation>({
        roleId: 0,
        latestRoleId: null,
        role: '',
        roleType: null,
        responsibilityLevelId: 0,
        responsibilityLevel: '',
        function: '',
        functionId: '0',
        subFunction: '',
        subFunctionId: '0',
        isActive: null,
        regionId: '',
        region: '',
        clusterId: '',
        cluster: '',
        marketId: '',
        market: '',
        siteId: '',
        site: '',
        userCount: null,
        totalRows: 0,
        totalPages: 0,
        department: '',
        departmentId: '0',
        subDepartmentId: '0',
        subDepartment: '',
        geographyLevel: '',
        geographyLevelId: 0,
    });
    const [previousGeneralInfo, setPreviousGeneralInfo] = useState<IRoleGeneralInformation>({
        roleId: 0,
        latestRoleId: null,
        role: '',
        roleType: null,
        responsibilityLevelId: 0,
        responsibilityLevel: '',
        function: '',
        functionId: '0',
        subFunction: '',
        subFunctionId: '0',
        isActive: false,
        regionId: '',
        region: '',
        clusterId: '',
        cluster: '',
        marketId: '',
        market: '',
        siteId: '',
        site: '',
        userCount: null,
        totalRows: 0,
        totalPages: 0,
        department: '',
        departmentId: '0',
        subDepartmentId: '0',
        subDepartment: '',
        geographyLevel: '',
        geographyLevelId: 0,
    });
    const [, setIsEditingBasicInfo] = useState(false);
    const [, setIsEditingGeoInfo] = useState(false);
    const roleParams = useParams<{ roleId: string }>();
    const dispatch = useDispatch<AppDispatch>();

    const [isReset, setIsReset] = useState({
        functions: false,
        subFunctions: false,
        levels: false,
        region: false,
        cluster: false,
        market: false,
        sites: false,
        department: false,
        subDepartment: false,
    });
    const [showDuplicateRoleMessage, setShowDuplicateRoleMessage] = useState(false);
    const [toastConfig, setToastConfig] = useState<{
        visible: boolean;
        message: string;
        type: 'Delete' | 'Error' | 'Success';
    }>({ visible: false, message: '', type: 'Delete' });
    const ALL_OPTION = {
        label: 'ALL',
        value: 'ALL',
    };
    const addAllOption = (options: OptionType[]) => {
        return [ALL_OPTION, ...options];
    };

    //New states

    const [openCancelDialog, setOpenCancelDialog] = useState<boolean>(false);
    const [hasUnsavedPermissionChanges, setHasUnsavedPermissionChanges] = useState(false);
    const [triggerRender, setTriggerRender] = useState(0);
    const [showSavingLoader, setShowSavingLoader] = useState<boolean>(false);

    const [selectedAttributes, setSelectedAttributes] = useState<
        { label: string; value: string }[]
    >([]);

    const [prevSelectedAttributes, setprevSelectedAttributes] = useState<
        { label: string; value: string }[]
    >([]);

    const navigate = useNavigate();
    const [lastRefreshDate, setLastRefreshDate] = useState<Date | null>(null);
    const [pendingTab, setPendingTab] = useState<string | null>(null);
    const [openDiscardDialog, setOpenDiscardDialog] = useState<boolean>(false);
    const [openSaveDialog, setOpenSaveDialog] = useState<boolean>(false);
    const [permissionResetKey, setPermissionResetKey] = useState(0);
    const [permissionPersonaIds, setPermissionPersonaIds] = useState<string[]>([]);
    const [openUserAttributesContainer, setOpenUserAttributesContainer] = useState<boolean>(false);
    const usersTabLabel = `${TabNamesEnum.Users}(${generalInfo?.userCount ?? 0})`;
    const onClickUserAtrributeContainer = useCallback(() => {
        setOpenUserAttributesContainer(!openUserAttributesContainer);
    }, [openUserAttributesContainer]);

    const DEFAULT_STATE_OPTIONS = [
        { label: 'Active', value: 'true' },
        { label: 'Inactive', value: 'false' },
    ];
    const isSubFunctionChangedByUser = useRef(false);

    useEffect(() => {
        if (generalInfo?.subFunctionId && !isSubFunctionChangedByUser.current) {
            // Fetch departments for existing subfunction
            dispatch(
                fetchDepartmentsBySubfunctionId({
                    subfunctionid: String(generalInfo?.subFunctionId),
                }),
            );
        }
    }, [generalInfo?.subFunctionId]);

    useEffect(() => {
        if (generalInfo?.departmentId && !isSubFunctionChangedByUser.current) {
            dispatch(
                fetchSubDepartmentList({
                    departmentId: String(generalInfo?.departmentId),
                }),
            );
        }
    }, [generalInfo?.departmentId]);

    function RenderTabContent() {
        switch (selectedTab) {
            case TabNamesEnum.GeneralInformation:
                return <>{RenderGeneralInformation()}</>;
            case TabNamesEnum.AccessPermissions:
                return (
                    <RoleAccessPermissionTab
                        key={permissionResetKey}
                        onNewToolCommitted={hasChanges => {
                            setHasUnsavedPermissionChanges(hasChanges);
                        }}
                        onPersonaIdsChange={(ids: string[]) => {
                            setPermissionPersonaIds(ids);
                        }}
                    />
                );

            case TabNamesEnum.Users:
                return (
                    <RoleUserManagementTable
                        key={roleParams?.roleId}
                        roleId={Number(roleParams?.roleId) || 0}
                    />
                );

            default:
                return selectedTab;
        }
    }
    const handleRefresh = () => {
        setTriggerRender(prev => prev + 1);
    };
    const handleBackClick = (e: any) => {
        if (hasUnsavedChanges || hasUnsavedPermissionChanges) {
            e.preventDefault();
            setOpenCancelDialog(true);
        }
    };

    const normalizeGeneralInfo = (info: IRoleGeneralInformation) => ({
        ...info,
        role: info.role?.trim() || '',
        functionId: Number(info.functionId) || 0,
        subFunctionId: Number(info.subFunctionId) || 0,
        departmentId: Number(info.departmentId) || 0,
        responsibilityLevelId: Number(info.responsibilityLevelId) || 0,
        subsubDepartmentId: Number(info.subDepartmentId) || 0,
        isActive: typeof info.isActive === 'boolean' ? info.isActive : info.isActive === 'true',
    });
    const isGeneralInfoDirty = (
        current: IRoleGeneralInformation,
        saved: IRoleGeneralInformation,
    ): boolean => {
        if (!current || !saved) return false;

        const normalizedCurrent = normalizeGeneralInfo(current);
        const normalizedSaved = normalizeGeneralInfo(saved);

        return Object.keys(normalizedCurrent).some(key => {
            return (
                normalizedCurrent[key as keyof IRoleGeneralInformation] !==
                normalizedSaved[key as keyof IRoleGeneralInformation]
            );
        });
    };
    const isOnlyRoleNameChanged = (
        current: IRoleGeneralInformation,
        previous: IRoleGeneralInformation,
    ): boolean => {
        const curr = normalizeGeneralInfo(current);
        const prev = normalizeGeneralInfo(previous);

        // Check role name changed
        if (curr.role === prev.role) return false;

        // Check everything else is same
        return Object.keys(curr).every(key => {
            if (key === 'role') return true;

            return (
                curr[key as keyof IRoleGeneralInformation] ===
                prev[key as keyof IRoleGeneralInformation]
            );
        });
    };
    const normalizeAttributes = (attrs: { label: string; value: string }[]) =>
        attrs
            .map(a => a.value.trim()) // compare only IDs
            .sort();
    const areUserAttributesEqual = (
        current: { label: string; value: string }[],
        previous: { label: string; value: string }[],
    ): boolean => {
        const currIds = normalizeAttributes(current);
        const prevIds = normalizeAttributes(previous);

        if (currIds.length !== prevIds.length) return false;

        return currIds.every((id, i) => id === prevIds[i]);
    };
    const hasUserAttributeChanges = !areUserAttributesEqual(
        selectedAttributes,
        prevSelectedAttributes,
    );

    const hasUnsavedChanges =
        isGeneralInfoDirty(generalInfo, previousGeneralInfo) ||
        hasUnsavedPermissionChanges ||
        hasUserAttributeChanges;

    const isBasicInfoSaveDisabled =
        generalInfo?.role?.trim() === '' ||
        generalInfo?.subFunction?.trim() === '' ||
        generalInfo?.department?.trim() === '' ||
        generalInfo?.subDepartment?.trim() === '';

    const onUserSelectTab = useCallback(
        ({ label }: any) => {
            const nextTab =
                typeof label === 'string' && label.startsWith(TabNamesEnum.Users)
                    ? TabNamesEnum.Users
                    : label;

            if (nextTab === selectedTab) return;

            if (hasUnsavedChanges) {
                setPendingTab(nextTab);
                setOpenCancelDialog(true);
                return;
            }

            setSelectedTab(nextTab);
        },
        [hasUnsavedChanges, selectedTab],
    );

    const handleDiscard = (info: IRoleGeneralInformation) => {
        setGeneralInfo(info);
        isSubFunctionChangedByUser.current = false;

        if (info.subFunctionId) {
            dispatch(
                fetchDepartmentsBySubfunctionId({
                    subfunctionid: String(info.subFunctionId),
                }),
            );
        }

        if (info.departmentId) {
            dispatch(
                fetchSubDepartmentList({
                    departmentId: String(info.departmentId),
                }),
            );
        }
    };

    useEffect(() => {
        const fetchRoleDetails = async () => {
            const response = await getRoleDetailsById({
                roleId: Number(roleParams.roleId),
                pageNumber: 1,
                pageSize: 10,
            });
            if (response) {
                setGeneralInfo(response.generalInformation);

                setLastRefreshDate(new Date());
                setPreviousGeneralInfo(response.generalInformation);

                //attributes
                if (response.userAttributes && response.userAttributes.length > 0) {
                    const attributes = response.userAttributes.map(a => ({
                        label: a.userAttribute,
                        value: a.userAttributeId.toString(),
                    }));
                    setSelectedAttributes(attributes);
                    setprevSelectedAttributes(attributes);
                }
            }
        };
        fetchRoleDetails();
        dispatch(fetchUserAttributes());

        if (roleParams.roleId) {
            // Preload existing persona mappings so saving from General Information tab
            // does not clear access when Access & Permissions tab is never opened.
            dispatch(
                fetchToolPersonaPermissionByRole({
                    roleId: Number(roleParams.roleId),
                    pageNumber: 1,
                    pageSize: 10,
                }),
            );
        }
    }, [roleParams.roleId, triggerRender]);

    useEffect(() => {
        dispatch(fetchRoleLevels());
        dispatch(fetchRoleFunctions());
        dispatch(fetchDepartments());

        if (generalInfo?.functionId) {
            dispatch(fetchSubRoleFunctions({ functionId: Number(generalInfo.functionId) }));
        }
        dispatch(fetchGeographicalRegion());
        dispatch(fetchRoleDropdownData());
    }, [generalInfo?.functionId, dispatch]);

    useEffect(() => {
        if (isReset.subFunctions) {
            setIsReset(prev => ({
                ...prev,
                subFunctions: false,
            }));
        }
    }, [isReset.subFunctions]);

    useEffect(() => {
        if (isReset.cluster || isReset.market || isReset.sites) {
            setIsReset(prev => ({
                ...prev,
                cluster: false,
                market: false,
                sites: false,
            }));
        }
    }, [isReset.cluster, isReset.market, isReset.sites]);

    const existingToolPersonaPermissions = useSelector(
        (state: RootState) =>
            state.rolePermissions.toolPersonaData?.existingToolPersonaPermissions ?? [],
    );

    // Flatten API tool->personas structure into a unique list of persona IDs for role update payload.
    const existingPermissionPersonaIds = useMemo(
        () =>
            Array.from(
                new Set(
                    existingToolPersonaPermissions
                        .flatMap(tool => tool.personas ?? [])
                        .map(persona => String(persona.personaId))
                        .filter(Boolean),
                ),
            ),
        [existingToolPersonaPermissions],
    );

    useEffect(() => {
        // Initialize local persona state once from fetched mappings.
        // Access tab can still overwrite this with user-edited persona IDs.
        if (!permissionPersonaIds.length && existingPermissionPersonaIds.length) {
            setPermissionPersonaIds(existingPermissionPersonaIds);
        }
    }, [existingPermissionPersonaIds, permissionPersonaIds.length]);

    const handleSaveType = async (
        newInfo: IRoleGeneralInformation,
        previousInfo: IRoleGeneralInformation,
    ) => {
        // Prefer latest IDs from Access tab; fallback to preloaded IDs when that tab wasn't opened.
        const personaIdsToPersist =
            permissionPersonaIds.length > 0 ? permissionPersonaIds : existingPermissionPersonaIds;

        const payload = {
            roleName: extractOnlyRoleName(
                String(newInfo?.role),
                String(newInfo?.responsibilityLevel),
            ),
            roleId: Number(newInfo?.roleId) || 0,
            responsibilityLevelId: Number(newInfo?.responsibilityLevelId) || 0,
            geographyLevelId: Number(newInfo?.geographyLevelId) || 0,
            functionId: Number(newInfo?.functionId) || 0,
            subFunctionId: Number(newInfo?.subFunctionId) || 0,
            departmentId: Number(newInfo?.departmentId) || 0,
            subDepartmentId: Number(newInfo?.subDepartmentId) || 0,
            userAttributeIds:
                selectedAttributes.length > 0 ? selectedAttributes.map(a => a.value).join(',') : '',
            isAllSubFunction: newInfo?.subFunction === 'ALL',
            isAllDepartment: newInfo?.department === 'ALL',
            isAllSubDepartment: newInfo?.subDepartment === 'ALL',
            toolPersonaIds: personaIdsToPersist.join(','),
        };

        await handleDuplicate(newInfo, previousInfo, payload);
    };

    const handleDuplicate = async (
        newInfo: IRoleGeneralInformation,
        previousInfo: IRoleGeneralInformation,
        payloadBasedOnSaveType: any,
    ) => {
        //  Case 1: No changes at all
        if (
            !isGeneralInfoDirty(newInfo, previousInfo) &&
            !hasUnsavedPermissionChanges &&
            !hasUserAttributeChanges
        ) {
            setShowDuplicateRoleMessage(true);
            return;
        }

        //  Case 2: Only role name changed → skip duplicate API
        if (isOnlyRoleNameChanged(newInfo, previousInfo)) {
            setShowDuplicateRoleMessage(false);
            await saveRoleChanges(payloadBasedOnSaveType);
            handleRefresh();
            return;
        }
        //  Case 3: Only User attributes changed

        if (!isGeneralInfoDirty(newInfo, previousInfo) && hasUserAttributeChanges) {
            setShowDuplicateRoleMessage(false);
            await saveRoleChanges(payloadBasedOnSaveType);
            handleRefresh();
            return;
        }

        //  Case 4: Other changes → check duplicate
        const response = await checkDuplicateRoleDetails(payloadBasedOnSaveType);
        const isDuplicate = response.data.data;

        if (isDuplicate && !hasUnsavedPermissionChanges) {
            setShowDuplicateRoleMessage(true);
        } else {
            await saveRoleChanges(payloadBasedOnSaveType);
            handleRefresh();
        }
    };

    const onChangeRoleFunctionHandler = useCallback(
        (functionId: number) => {
            setIsReset(prev => ({ ...prev, subFunctions: true }));
            dispatch(fetchSubRoleFunctions({ functionId }));
        },
        [dispatch],
    );

    const primaryRoleFunctions = useSelector((state: RootState) => state.roleFunctions.data);
    const primaryRoleSubFunctions = useSelector(
        (state: RootState) => state.roleFunctions.subFunctionData,
    );
    const primaryRoleLevels = useSelector((state: RootState) => state.roleFunctions.roleLevelsData);
    const userAttributes = useSelector((state: RootState) => state.roleFunctions.userAttributes);
    const departments = useSelector(
        (state: RootState) => state.roleFunctions.departmentsBySubfunction,
    );
    const geographyLevels = useSelector((state: RootState) => state.roleFunctions.geographyLevel);

    const subDepartmentsList = useSelector(
        (state: RootState) => state.roleFunctions.subDepartments,
    );

    const ATTRIBUTE_SELECT_ALL_OPTION = {
        label: 'Select All',
        value: 'all',
    };

    const getUserAttributeOptions = useCallback(
        () =>
            userAttributes.map(d => ({
                label: d.userAttributeName,
                value: d.userAttributeId.toString(),
            })),
        [userAttributes],
    );

    const isAttributeSelectAllValue = (value?: string | number) =>
        String(value ?? '').toLowerCase() === ATTRIBUTE_SELECT_ALL_OPTION.value;

    const areAllUserAttributesSelected = (
        attributes: { label: string; value: string }[] = selectedAttributes,
    ) => {
        const attributeOptions = getUserAttributeOptions();
        if (attributeOptions.length === 0) return false;

        const selectedAttributeValues = new Set(
            attributes
                .filter(attribute => !isAttributeSelectAllValue(attribute.value))
                .map(attribute => attribute.value.trim()),
        );

        return attributeOptions.every(attribute => selectedAttributeValues.has(attribute.value));
    };

    const getSelectedUserAttributeOptions = () => {
        const selectedAttributeOptions = selectedAttributes
            .filter(attribute => !isAttributeSelectAllValue(attribute.value))
            .map(attribute => ({
                label: attribute.label,
                value: attribute.value.trim(),
            }));

        if (areAllUserAttributesSelected()) {
            return [ATTRIBUTE_SELECT_ALL_OPTION, ...selectedAttributeOptions];
        }

        return selectedAttributeOptions;
    };

    const getNormalizedUserAttributeSelection = (
        changedOption: OptionType | undefined,
        isChecked: boolean | undefined,
        selectedTree: object[],
    ) => {
        const attributeOptions = getUserAttributeOptions();
        const changedOptionIsSelectAll = isAttributeSelectAllValue(changedOption?.value);

        if (changedOptionIsSelectAll) {
            return isChecked === false ? [] : attributeOptions;
        }

        const selectedOptions = selectedTree as { label: string; value: string | number }[];

        if (
            isChecked !== false &&
            selectedOptions.some(attribute => isAttributeSelectAllValue(attribute.value))
        ) {
            return attributeOptions;
        }

        const selectedAttributeValues = new Set(
            selectedOptions
                .filter(attribute => !isAttributeSelectAllValue(attribute.value))
                .map(attribute => String(attribute.value).trim()),
        );

        if (isChecked === false && changedOption?.value !== undefined) {
            selectedAttributeValues.delete(String(changedOption.value).trim());
        }

        return attributeOptions.filter(attribute => selectedAttributeValues.has(attribute.value));
    };

    const getPrimaryRoleFunctions = useCallback(() => {
        if (!primaryRoleFunctions.length) return [];
        return convertOptions(primaryRoleFunctions, 'functionName', 'functionId');
    }, [primaryRoleFunctions]);

    const getPrimaryRoleSubFunctions = useCallback(() => {
        if (!primaryRoleSubFunctions.length) return [];
        const converted = convertOptions(
            primaryRoleSubFunctions,
            'subFunctionName',
            'subFunctionId',
        );
        return [ALL_OPTION, ...converted];
    }, [primaryRoleSubFunctions]);

    const getDepartmentOptions = useCallback(() => {
        // NO sub-function selected → show NOTHING
        if (!generalInfo.subFunctionId || generalInfo.subFunctionId === '0') {
            return [];
        }

        //  If Sub-function is ALL → only ALL
        if (generalInfo?.subFunction === 'ALL') {
            return [ALL_OPTION];
        }

        if (!departments.length) return [];

        const converted = convertOptions(departments as any, 'departmentName', 'departmentId');

        //  Add ALL option
        return [ALL_OPTION, ...converted];
    }, [departments, generalInfo?.subFunction]);

    const getSubDepartmentOptions = useCallback(() => {
        //  NO department selected → show nothing
        if (!generalInfo?.departmentId || generalInfo?.departmentId === '0') {
            return [];
        }

        if (generalInfo?.subFunction === 'ALL' || generalInfo?.department === 'ALL') {
            return [ALL_OPTION];
        }

        return addAllOption(
            convertOptions(subDepartmentsList as any, 'subDepartmentName', 'subDepartmentId'),
        );
    }, [
        subDepartmentsList,
        generalInfo?.departmentId,
        primaryRoleSubFunctions,
        generalInfo?.department,
        generalInfo?.subFunction,
    ]);

    const getPrimaryRoleLevels = useCallback(() => {
        if (!primaryRoleLevels.length) return [];
        return convertOptions(
            primaryRoleLevels,
            'responsibilityLevelName',
            'responsibilityLevelId',
        );
    }, [primaryRoleLevels]);

    const getGeographyLevels = useCallback(() => {
        if (!geographyLevels.length) return [];

        return convertOptions(geographyLevels, 'geographyLevelName', 'geographyLevelID');
    }, [geographyLevels]);

    const handleFieldChange = useCallback(() => {
        setShowDuplicateRoleMessage(false);
    }, []);

    const saveRoleChanges = useCallback(
        async (payloadBasedOnSaveType: any) => {
            setShowDuplicateRoleMessage(false);
            try {
                const [, roleDetails] = await Promise.all([
                    updateRoleDetails(payloadBasedOnSaveType),
                    getRoleDetailsById({
                        roleId: Number(roleParams.roleId),
                        pageNumber: 1,
                        pageSize: 10,
                    }),
                ]);

                if (roleDetails?.generalInformation) {
                    setGeneralInfo(roleDetails.generalInformation);
                    setPreviousGeneralInfo(roleDetails.generalInformation);
                    setToastConfig({
                        visible: true,
                        message: `Role '${roleDetails.generalInformation.role}' updated successfully.`,
                        type: 'Success',
                    });
                }
                setIsEditingBasicInfo(false);
                setIsEditingGeoInfo(false);
                setprevSelectedAttributes(selectedAttributes);
            } catch (error) {
                setToastConfig({
                    visible: true,
                    message: `Failed to update the role. Please try again`,
                    type: 'Error',
                });
                logError('An Error Occured,', error);
            }
            return true;
        },
        [generalInfo, roleParams.roleId],
    );

    const RenderGeneralInformation = () => {
        return (
            <>
                {/* Basic Information Section */}
                <Flex
                    justify="space-between"
                    className={`${styles['section']} ${styles['edit-mode']}`}
                >
                    <Flex vertical gap={16} className={styles['formColumn']}>
                        <Label type="h2">
                            <span className={styles['section-heading']}>Basic Information</span>
                        </Label>

                        {/* Role Name */}
                        <Flex gap={4} align="center" className={styles['field']}>
                            <Icon name="user-01" size="xm" color="primary-green-500-color" />
                            <span className={styles['field-name']}>Role Name:</span>
                            <InputField
                                value={generalInfo?.role || ''}
                                onChange={e => {
                                    setGeneralInfo((prev: any) => ({
                                        ...prev,
                                        role: e.target.value,
                                    }));
                                    handleFieldChange();
                                }}
                            />
                        </Flex>
                        {/* Level */}
                        <Flex gap={4} align="center" className={styles['field']}>
                            <Icon name="barr-chart-01" size="xm" color="primary-green-500-color" />
                            <span className={styles['field-name']}>Responsibility Level:</span>

                            <DropDown
                                id="level-dropdown"
                                className={styles['fullWidthDropdown']}
                                dropdown={{
                                    options: getPrimaryRoleLevels(),
                                    reset: isReset.levels,
                                    placeholder: 'Select Level',
                                    onChange: (option: any) => {
                                        setGeneralInfo((prev: any) => ({
                                            ...prev,
                                            responsibilityLevel: option.label,
                                            responsibilityLevelId: option.value,
                                        }));
                                        handleFieldChange();
                                    },
                                    selectedOptions:
                                        generalInfo?.responsibilityLevel &&
                                        generalInfo.responsibilityLevelId
                                            ? [
                                                  {
                                                      label: String(
                                                          generalInfo.responsibilityLevel,
                                                      ),
                                                      value: String(
                                                          generalInfo.responsibilityLevelId,
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

                        {/* Geography Level */}
                        <Flex gap={4} align="center" className={styles['field']}>
                            <Icon name="barr-chart-01" size="xm" color="primary-green-500-color" />
                            <span className={styles['field-name']}>Geography Level:</span>

                            <DropDown
                                id="level-dropdown"
                                className={styles['fullWidthDropdown']}
                                dropdown={{
                                    options: getGeographyLevels(),
                                    reset: isReset.levels,
                                    placeholder: 'Select Geography Level',
                                    onChange: (option: any) => {
                                        setGeneralInfo((prev: any) => ({
                                            ...prev,
                                            geographyLevel: option.label,
                                            geographyLevelId: option.value,
                                        }));
                                        handleFieldChange();
                                    },
                                    selectedOptions:
                                        generalInfo?.geographyLevel && generalInfo.geographyLevelId
                                            ? [
                                                  {
                                                      label: String(generalInfo.geographyLevel),
                                                      value: String(generalInfo.geographyLevelId),
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

                        {/* Function */}
                        <Flex gap={4} align="center" className={styles['field']}>
                            <Icon name="sliders-01" size="xm" color="primary-green-500-color" />
                            <span className={styles['field-name']}>Function:</span>

                            <DropDown
                                id="function-dropdown"
                                className={styles['fullWidthDropdown']}
                                dropdown={{
                                    options: getPrimaryRoleFunctions(),
                                    reset: isReset.functions,
                                    placeholder: 'Select Function',
                                    onChange: (option: any) => {
                                        onChangeRoleFunctionHandler(option.value);
                                        //  reset everything downstream
                                        isSubFunctionChangedByUser.current = true;

                                        setGeneralInfo(prev => ({
                                            ...prev,
                                            function: option.label,
                                            functionId: option.value,

                                            // reset sub function
                                            subFunction: '',
                                            subFunctionId: '0',

                                            //  reset department
                                            department: '',
                                            departmentId: '0',

                                            //  reset sub department
                                            subDepartment: '',
                                            subDepartmentId: '0',
                                        }));

                                        setIsReset(prev => ({
                                            ...prev,
                                            subFunctions: true,
                                            department: true,
                                            subDepartment: true,
                                        }));

                                        dispatch(
                                            fetchSubRoleFunctions({ functionId: option.value }),
                                        );

                                        handleFieldChange();
                                    },
                                    selectedOptions:
                                        generalInfo?.function && generalInfo.functionId
                                            ? [
                                                  {
                                                      label: String(generalInfo.function),
                                                      value: String(generalInfo.functionId),
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

                        {/* Sub Function */}
                        <Flex gap={4} align="center" className={styles['field']}>
                            <Icon name="settings-04" size="xm" color="primary-green-500-color" />
                            <span className={styles['field-name']}>Sub Function:</span>

                            <DropDown
                                id="sub-function-dropdown"
                                className={styles['fullWidthDropdown']}
                                dropdown={{
                                    options: getPrimaryRoleSubFunctions(),
                                    reset: isReset.subFunctions,
                                    placeholder: 'Select Sub Function',
                                    onChange: (option: any) => {
                                        //  mark as user-driven change
                                        isSubFunctionChangedByUser.current = true;

                                        setGeneralInfo(prev => ({
                                            ...prev,
                                            subFunction: option.label,
                                            subFunctionId: String(option.value),

                                            //  clear dependent fields
                                            department: '',
                                            departmentId: '0',
                                            subDepartment: '',
                                            subDepartmentId: '0',
                                        }));

                                        //  reset dropdown UI
                                        setIsReset(prev => ({
                                            ...prev,
                                            department: true,
                                            subDepartment: true,
                                        }));

                                        //  fetch fresh departments
                                        if (option.value && option.value !== 'ALL') {
                                            dispatch(
                                                fetchDepartmentsBySubfunctionId({
                                                    subfunctionid: option.value,
                                                }),
                                            );
                                        }

                                        handleFieldChange();
                                    },
                                    selectedOptions: generalInfo?.subFunction
                                        ? [
                                              generalInfo.subFunction === 'ALL'
                                                  ? ALL_OPTION
                                                  : {
                                                        label: String(generalInfo.subFunction),
                                                        value: String(generalInfo.subFunctionId),
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
                        {/* Department */}
                        <Flex gap={4} align="center" className={styles['field']}>
                            <Icon name="archieve" size="xm" color="primary-green-500-color" />
                            <span className={styles['field-name']}>Department:</span>

                            <DropDown
                                id="department-dropdown"
                                className={styles['fullWidthDropdown']}
                                dropdown={{
                                    options: getDepartmentOptions(),
                                    reset: isReset.department,
                                    placeholder: 'Select Department',
                                    onChange: (option: any) => {
                                        setGeneralInfo(prev => ({
                                            ...prev,
                                            department: option.label,
                                            departmentId: option.value,

                                            //  reset sub department
                                            subDepartment: '',
                                            subDepartmentId: 0,
                                        }));

                                        setIsReset(prev => ({
                                            ...prev,
                                            subDepartment: true,
                                        }));

                                        if (option.value && option.value !== 'ALL') {
                                            dispatch(
                                                fetchSubDepartmentList({
                                                    departmentId: option.value,
                                                }),
                                            );
                                        }

                                        handleFieldChange();
                                    },
                                    selectedOptions: generalInfo?.department
                                        ? [
                                              generalInfo.department === 'ALL'
                                                  ? ALL_OPTION
                                                  : {
                                                        label: String(generalInfo.department),
                                                        value: String(generalInfo.departmentId),
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

                        {/* Sub Department */}
                        <Flex gap={4} align="center" className={styles['field']}>
                            <Icon name="archieve" size="xm" color="primary-green-500-color" />
                            <span className={styles['field-name']}>Sub-Department:</span>

                            <DropDown
                                id="department-dropdown"
                                className={styles['fullWidthDropdown']}
                                dropdown={{
                                    options: getSubDepartmentOptions(),
                                    reset: isReset.subDepartment,
                                    placeholder: 'Select Sub-Department',
                                    onChange: (option: any) => {
                                        setGeneralInfo((prev: any) => ({
                                            ...prev,
                                            subDepartment: option.label,
                                            subDepartmentId: option.value,
                                        }));
                                        handleFieldChange();
                                    },
                                    selectedOptions: generalInfo?.subDepartment
                                        ? [
                                              generalInfo.subDepartment === 'ALL'
                                                  ? ALL_OPTION
                                                  : {
                                                        label: String(generalInfo.subDepartment),
                                                        value: String(generalInfo.subDepartmentId),
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

                        {/* Default State */}
                        <Flex gap={4} align="center" className={styles['field']}>
                            <Icon name="user-check-01" size="xm" color="primary-green-500-color" />
                            <span className={styles['field-name']}>Default State:</span>

                            <DropDown
                                id="default-state-dropdown"
                                className={styles['fullWidthDropdown']}
                                dropdown={{
                                    options: DEFAULT_STATE_OPTIONS,
                                    placeholder: 'Select State',
                                    onChange: (option: any) => {
                                        setGeneralInfo(prev => ({
                                            ...prev,
                                            isActive: option.value === 'true',
                                        }));
                                        handleFieldChange();
                                    },
                                    selectedOptions:
                                        typeof generalInfo.isActive === 'boolean'
                                            ? [
                                                  {
                                                      label: generalInfo.isActive
                                                          ? 'Active'
                                                          : 'Inactive',
                                                      value: generalInfo.isActive
                                                          ? 'true'
                                                          : 'false',
                                                  },
                                              ]
                                            : [],
                                }}
                            />
                        </Flex>

                        {/* No of Users (static) */}
                        <Flex gap={4} align="center" className={styles['field']}>
                            <Icon name="users-01" size="xm" color="primary-green-500-color" />
                            <span className={styles['field-name']}>No of Users:</span>

                            <InputField
                                value={String(generalInfo?.userCount ?? 0)}
                                onChange={() => {}}
                                isDisabled={true}
                            />
                        </Flex>
                    </Flex>
                </Flex>

                {showDuplicateRoleMessage && (
                    <Flex gap={4} align="center" className={styles['field']}>
                        <div className={styles['custom-message']}>
                            <IoMdInformationCircleOutline className={styles['info-icon']} />
                            <span className={styles['message']}>
                                {DUPLICATE_ROLE_ERROR_MESSAGE}
                            </span>
                        </div>
                    </Flex>
                )}
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
                                        onChange: (
                                            option: OptionType | undefined,
                                            isChecked: boolean | undefined,
                                            tree: object[],
                                        ) => {
                                            setSelectedAttributes(
                                                getNormalizedUserAttributeSelection(
                                                    option,
                                                    isChecked,
                                                    tree,
                                                ),
                                            );
                                        },
                                        onScroll: () => {},
                                        options: getUserAttributeOptions(),
                                        placeholder: 'Select attributes',
                                        required: false,
                                        reset: false,
                                        selectAllOption: ATTRIBUTE_SELECT_ALL_OPTION,
                                        selectedOptions: getSelectedUserAttributeOptions(),
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
                                        key={generalInfo.geographyLevel}
                                    >
                                        {generalInfo.geographyLevel}
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
                    onClick={onClickUserAtrributeContainer}
                    additionalContentInTitleContainer={
                        <Icon
                            name={openUserAttributesContainer ? 'chevron-up' : 'chevron-down'}
                            size="l"
                            color="neutrals-B800"
                        />
                    }
                />
            </>
        );
    };

    return (
        <Flex vertical gap={24}>
            <Flex vertical gap={8} className={styles['edit-role-title']}>
                <Flex align="center" gap={8} justify="space-between">
                    <Flex align="flex-start" gap={16}>
                        <div className={styles['header-back-button']}>
                            <Link to="/admin-hub/role-management" onClick={handleBackClick}>
                                {BackArrowIcon(8, 12)}
                            </Link>
                        </div>
                        <Flex justify="flex-start" vertical gap={8}>
                            <Label type="h2">
                                {!generalInfo ? (
                                    <Skeleton.Node
                                        active
                                        style={{ width: '300px', height: '2rem' }}
                                    />
                                ) : (
                                    <span className={styles['edit-role-heading']}>
                                        {generalInfo?.responsibilityLevel} - {generalInfo?.role}
                                    </span>
                                )}
                            </Label>
                            <Label type="body2">
                                <span className={styles['firstLine']}>
                                    {generalInfo?.subFunction} {generalInfo?.department},{' '}
                                    {generalInfo?.geographyLevel}
                                </span>

                                <span className={styles['secondLine']}>
                                    {formatRefreshText(lastRefreshDate)}
                                </span>
                            </Label>
                        </Flex>
                    </Flex>

                    {hasUnsavedChanges && (
                        <Flex align="center" gap={12}>
                            <Button
                                variant="Secondary"
                                size="M"
                                text="Discard changes"
                                onClick={() => {
                                    setOpenDiscardDialog(true);
                                }}
                            ></Button>

                            <Button
                                variant="Primary"
                                size="M"
                                text="Save changes"
                                disabled={isBasicInfoSaveDisabled || showSavingLoader}
                                onClick={async () => {
                                    setOpenSaveDialog(true);
                                }}
                            ></Button>
                        </Flex>
                    )}

                    <Flex className={styles['add-role-button-container']} align="center" gap={8}>
                        {toastConfig.visible && (
                            <Toast
                                distance="x5l"
                                message={toastConfig.message}
                                mode="Top Right"
                                onCloseToast={() =>
                                    setToastConfig({ ...toastConfig, visible: false })
                                }
                                toggle
                                type={toastConfig.type}
                                timer={5000}
                            />
                        )}

                        {toastConfig.visible && (
                            <Toast
                                distance="x5l"
                                message={toastConfig.message}
                                mode="Top Right"
                                onCloseToast={() =>
                                    setToastConfig({ ...toastConfig, visible: false })
                                }
                                toggle
                                type={toastConfig.type}
                                timer={5000}
                            />
                        )}
                    </Flex>
                </Flex>
                <Flex className={styles['tabs-wrapper']}>
                    <Tab
                        items={[
                            {
                                label: TabNamesEnum.GeneralInformation,
                                icon: 'info-circle',
                            },
                            {
                                label: TabNamesEnum.AccessPermissions,
                                icon: 'shield-tick',
                            },
                            {
                                label: TabNamesEnum.LinkedWorkflowsProcess,
                                icon: 'data-flow-02',
                                isDisabledTab: true,
                            },
                            {
                                label: usersTabLabel,
                                icon: 'users-01',
                            },
                        ]}
                        onClick={onUserSelectTab}
                    />
                </Flex>
            </Flex>

            <Dialog
                title="Unsaved Role"
                content={
                    <>
                        <p>
                            You have unsaved changes in the current section. If you navigate away,
                            your edits will be lost.
                        </p>

                        <p>Are you sure you want to leave without saving your changes?</p>
                    </>
                }
                isOpen={openCancelDialog}
                onClose={() => {
                    setOpenCancelDialog(false);
                    setPendingTab(null);
                }}
                onPrimaryButtonClick={() => {
                    // Discard changes
                    setGeneralInfo(previousGeneralInfo);
                    setSelectedAttributes(prevSelectedAttributes);
                    handleDiscard(previousGeneralInfo);

                    setHasUnsavedPermissionChanges(false);
                    setPermissionResetKey(prev => prev + 1);

                    setOpenCancelDialog(false);

                    if (pendingTab) {
                        setSelectedTab(pendingTab);
                        setPendingTab(null);
                    } else {
                        navigate('/admin-hub/role-management');
                    }
                }}
                onSecondaryButtonClick={() => {
                    setOpenCancelDialog(false);
                    setPendingTab(null);
                }}
                primaryButtonText="Discard changes"
                secondaryButtonText="Continue Editing"
            />
            <Dialog
                title="Discard Changes"
                content="Are you sure you want to revert all recent changes?"
                isOpen={openDiscardDialog}
                onClose={() => {
                    setOpenDiscardDialog(false);
                    setPendingTab(null);
                }}
                onPrimaryButtonClick={() => {
                    // Discard changes
                    setGeneralInfo(previousGeneralInfo);
                    handleDiscard(previousGeneralInfo);
                    setSelectedAttributes(prevSelectedAttributes);
                    setHasUnsavedPermissionChanges(false);
                    setPermissionResetKey(prev => prev + 1);
                    setIsEditingBasicInfo(false);
                    setIsEditingGeoInfo(false);
                    setOpenDiscardDialog(false);
                }}
                onSecondaryButtonClick={() => {
                    setOpenDiscardDialog(false);
                }}
                primaryButtonText="Discard changes"
                secondaryButtonText="Continue Editing"
            />
            <Dialog
                title="Save Changes"
                content="Are you sure you want to save all the updates to the selected role. These changes may affect user access within Command Center."
                isOpen={openSaveDialog}
                onClose={() => {
                    setOpenSaveDialog(false);
                }}
                onPrimaryButtonClick={async () => {
                    // Save changes
                    setShowSavingLoader(true);
                    await handleSaveType(generalInfo, previousGeneralInfo);

                    setHasUnsavedPermissionChanges(false);
                    setPermissionPersonaIds([]);

                    setShowSavingLoader(false);
                    setOpenSaveDialog(false);

                    setTimeout(() => {
                        navigate('/admin-hub/role-management');
                    }, 1500);
                }}
                onSecondaryButtonClick={() => {
                    setOpenSaveDialog(false);
                }}
                primaryButtonText="Save"
                secondaryButtonText="Continue Editing"
            />
            <div>{RenderTabContent()}</div>
        </Flex>
    );
}

export default EditRoleScreen;
