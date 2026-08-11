import { Button, DropDown, Flyout, MultiFilterChipSelector, Toast } from 'konnect-react-components';
import styles from './RequestNewRole.module.scss';
import { useCallback, useEffect, useRef, useState } from 'react';
import { Flex } from 'antd';
import { useDispatch, useSelector } from 'react-redux';
import {
    AppDispatch,
    fetchDepartmentsBySubfunctionId,
    fetchFunctionSubFunctionLocationRole,
    fetchRoleDropdownData,
    fetchRoleFunctions,
    fetchSubDepartmentList,
    fetchSubRoleFunctions,
    RootState,
} from '../../../store';
import { convertOptions } from '../../../utils/helpers';
import { TreeDropDownOptionType } from '../../../types/common';
import RoleRequestAdditionalInfo from './RoleRequestAdditionalInfo';
import { INewRoleRequest, IROleAttributeRequest } from '../../../types/request';
import RolesPermissions from './RolesPermissions';
import { getFilteredRoles, GetUserRoleRequests, saveNewRoleRequest } from '../../../services/roles';
import { IRoleRequestResponse, RoleResponse } from '../../../types/response';
import { ROLE_SELECTION_DEFAULT_PAGE_SIZE } from '../../../utils/constants';

interface RequestNewRoleFlyoutProps {
    flyoutOpen: boolean;
    setIsFlyoutOpen: (val: boolean) => void;
    action: 'add' | 'edit';
    roleType: 'primary' | 'secondary';
    callBackFetchRoles: () => void;
}

interface DdlOption {
    label: string;
    value: string;
    desc?: string;
}

interface SelectedData {
    roleLocation: DdlOption | null;
    function: string | null;
    subFunction: string | null;
    department: string | null;
    subDepartment: string | null;
    roleLevel: string | null;
    role: DdlOption | null;
}

const RequestNewRole: React.FC<RequestNewRoleFlyoutProps> = ({
    flyoutOpen,
    setIsFlyoutOpen,
    action,
    roleType,
    callBackFetchRoles,
}) => {
    const dispatch = useDispatch<AppDispatch>();
    const [selectedRoleData, setSelectedRoleData] = useState<RoleResponse | null>(null);
    const primaryFunctions = useSelector((state: RootState) => state.roleFunctions);
    const primaryRoleFunctions = primaryFunctions.data;
    const primaryRoleSubFunctions = primaryFunctions.subFunctionData;
    const primaryRoleLevels = primaryFunctions.roleLevelsData;
    const departments = primaryFunctions.departmentsBySubfunction;
    const subDepartmentsList = primaryFunctions.subDepartments;

    const functionsSubFunctionsLocationsRoles = useSelector(
        (state: RootState) => state.roleFunctions.functionSubFunctionLocationRoleData,
    );
    const isLocationLoading = useSelector((state: RootState) => state.roleFunctions.isLoading);
    const { locations } = functionsSubFunctionsLocationsRoles;

    //DDL Options states
    const [roleOptions, setRoleOptions] = useState<DdlOption[]>([]);
    const [roleList, setRoleList] = useState<RoleResponse[]>([]);
    const [showAdditionalInfo, setShowAdditionalInfo] = useState(false);
    const [showPermissions, setShowPermissions] = useState(false);
    const [toastConfig, setToastConfig] = useState<{
        open: boolean;
        message: string;
        type: 'Success' | 'Error';
    }>({ open: false, message: '', type: 'Success' });
    const [isSavingRole, setIsSavingRole] = useState<boolean>(false);
    const [selectedData, setSelectedData] = useState<SelectedData>({
        function: null,
        subFunction: null,
        department: null,
        subDepartment: null,
        roleLevel: null,
        role: null,
        roleLocation: null,
    });
    const [isDirty, setIsDirty] = useState(false);
    const [noRolesFound, setNoRolesFound] = useState(false);
    const [roleSearch, setRoleSearch] = useState<string | null>(null);
    const currentPageRef = useRef(1);
    const [hasMoreRoles, setHasMoreRoles] = useState(true);
    const [existingRoleAttributes, setExistingRoleAttributes] = useState<IROleAttributeRequest[]>(
        [],
    );
    useEffect(() => {
        if (!flyoutOpen) return;
        setIsDirty(false);
        dispatch(fetchRoleFunctions());
        dispatch(fetchRoleDropdownData());
        dispatch(fetchFunctionSubFunctionLocationRole({}));
        setSelectedData({
            function: null,
            subFunction: null,
            department: null,
            subDepartment: null,
            roleLevel: null,
            role: null,
            roleLocation: null,
        });
        setRoleOptions([]);
    }, [flyoutOpen]);

    const addAllOption = (options: any[]) => [
        {
            label: 'All',
            value: '0',
        },
        ...options,
    ];

    const getRoleFunctions = useCallback(() => {
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

    const getRoleSubFunctions = useCallback(() => {
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
        if (!departments.length) return [];
        const converted = convertOptions(departments as any, 'departmentName', 'departmentId');
        return addAllOption(converted);
    }, [departments, selectedData?.subFunction]);

    const getSubDepartmentOptions = useCallback(() => {
        if (!subDepartmentsList.length) return [];

        const converted = convertOptions(
            subDepartmentsList as any,
            'subDepartmentName',
            'subDepartmentId',
        );
        return addAllOption(converted);
    }, [subDepartmentsList, selectedData?.subFunction, selectedData?.department]);

    const pushConvertedData = useCallback(
        (name: string, id: number, typeId: number, arrToPush: any) => {
            if (!!id && !!name) {
                const obj: TreeDropDownOptionType = {
                    label: name,
                    value: id.toString(),
                    typeId: typeId.toString(),
                    subOption: [],
                };
                arrToPush.push(obj);
            }
        },
        [],
    );
    const isRoleLocationSelected = !!selectedData.roleLocation;
    const isFormValid =
        !!selectedData.roleLocation &&
        !!selectedData.subFunction &&
        !!selectedData.department &&
        !!selectedData.subDepartment &&
        !!selectedData.role;

    const getLocationOptionsConversion = useCallback(
        (selectedLocationId?: number, typeId?: number) => {
            const convertedLocations: TreeDropDownOptionType[] = [];
            let selectedHeirarchy = {};
            const sortedLocations = [...locations].sort((a, b) => {
                const aName = a.regionName?.toLowerCase();
                const bName = b.regionName?.toLowerCase();

                if (aName === 'global') return -1;
                if (bName === 'global') return 1;
                return 0;
            });
            sortedLocations.forEach((layer1, index) => {
                pushConvertedData(
                    layer1.regionName,
                    layer1.regionId,
                    layer1.geographyTypeId,
                    convertedLocations,
                );
                if (
                    !!selectedLocationId &&
                    layer1.regionId == selectedLocationId &&
                    layer1.geographyTypeId == typeId
                ) {
                    selectedHeirarchy = {
                        value: layer1.regionId,
                        label: layer1.regionName,
                    };
                }
                if (Object.hasOwn(layer1, 'clusters') && layer1?.clusters?.length > 0) {
                    layer1.clusters.forEach((layer2: any, index1: number) => {
                        pushConvertedData(
                            layer2.clusterName,
                            layer2.clusterId,
                            layer2.geographyTypeId,
                            convertedLocations[index]?.['subOption'],
                        );
                        if (
                            !!selectedLocationId &&
                            layer2.clusterId == selectedLocationId &&
                            layer2.geographyTypeId == typeId
                        ) {
                            selectedHeirarchy = {
                                value: layer1.regionId,
                                label: layer1.regionName,
                                subOption: {
                                    value: layer2.clusterId,
                                    label: layer2.clusterName,
                                },
                            };
                        }
                        if (Object.hasOwn(layer2, 'markets') && layer2?.markets?.length > 0) {
                            layer2.markets.forEach((layer3: any, index2: number) => {
                                pushConvertedData(
                                    layer3.marketName,
                                    layer3.marketId,
                                    layer3.geographyTypeId,
                                    convertedLocations?.[index]?.['subOption']?.[index1]?.[
                                        'subOption'
                                    ],
                                );
                                if (
                                    !!selectedLocationId &&
                                    layer3.marketId == selectedLocationId &&
                                    layer3.geographyTypeId == typeId
                                ) {
                                    selectedHeirarchy = {
                                        value: layer1.regionId,
                                        label: layer1.regionName,
                                        subOption: {
                                            value: layer2.clusterId,
                                            label: layer2.clusterName,
                                            subOption: {
                                                value: layer3.marketId,
                                                label: layer3.marketName,
                                            },
                                        },
                                    };
                                }
                                if (Object.hasOwn(layer3, 'sites') && layer3?.sites?.length > 0) {
                                    layer3.sites.forEach((layer4: any) => {
                                        pushConvertedData(
                                            layer4.siteName,
                                            layer4.siteId,
                                            layer4.geographyTypeId,
                                            convertedLocations?.[index]?.['subOption']?.[index1]?.[
                                                'subOption'
                                            ]?.[index2]?.['subOption'],
                                        );
                                        if (
                                            !!selectedLocationId &&
                                            layer4.siteId == selectedLocationId
                                        ) {
                                            selectedHeirarchy = {
                                                value: layer1.regionId,
                                                label: layer1.regionName,
                                                subOption: {
                                                    value: layer2.clusterId,
                                                    label: layer2.clusterName,
                                                    subOption: {
                                                        value: layer3.marketId,
                                                        label: layer3.marketName,
                                                        subOption: {
                                                            value: layer4.siteId,
                                                            label: layer4.siteName,
                                                        },
                                                    },
                                                },
                                            };
                                        }
                                    });
                                }
                            });
                        }
                    });
                }
            });
            return selectedLocationId ? selectedHeirarchy : convertedLocations;
        },
        [locations],
    );

    const getRoleLevels = useCallback(() => {
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

    const flyoutHeader = 'Role Request';
    const flyoutSubheader =
        'Select your role to raise access request for the same. You will be notified once the request is approved.';

    const fetchRoles = useCallback(
        (reset = false) => {
            if (!isRoleLocationSelected) {
                return;
            }

            if (selectedData.roleLocation === null) return;

            const pageToFetch = reset ? 1 : currentPageRef.current + 1;
            getFilteredRoles({
                locationId: Number(selectedData.roleLocation.value),
                functionId: selectedData.function === null ? null : Number(selectedData.function),
                subFunctionId:
                    selectedData.subFunction === null ? null : Number(selectedData.subFunction),
                departmentId:
                    selectedData.department === null ? null : Number(selectedData.department),
                subDepartmentId:
                    selectedData.subDepartment === null ? null : Number(selectedData.subDepartment),
                responsibilityLevelId:
                    selectedData.roleLevel === null ? null : Number(selectedData.roleLevel),
                pageNumber: pageToFetch,
                pageSize: ROLE_SELECTION_DEFAULT_PAGE_SIZE,
                search: roleSearch,
            })
                .then((res: RoleResponse[]) => {
                    setNoRolesFound(res.length === 0);

                    if (res.length === 0) {
                        setSelectedData(prev => ({
                            ...prev,
                            role: null,
                        }));
                    }

                    const options = res.map(r => ({
                        label: `${r.responsibilityLevel ?? ''} - ${r.role}`,
                        value: r.roleId.toString(),
                        desc: `${r.roleGeoName ?? ''} ${r.subFunction ?? ''} ${r.department ?? ''}`,
                    }));
                    if (
                        action === 'edit' &&
                        selectedData.role?.value &&
                        !selectedData.role?.label
                    ) {
                        const selectedRoleOption = options.find(
                            o => o.value === selectedData.role?.value,
                        );

                        if (selectedRoleOption) {
                            setSelectedData(prev => ({
                                ...prev,
                                role: selectedRoleOption,
                            }));
                        }
                        const selectedRole = res.find(
                            r => r.roleId.toString() === selectedData.role?.value,
                        );

                        if (selectedRole) {
                            setSelectedRoleData(selectedRole);
                        }
                    }

                    if (reset) {
                        setRoleOptions(options);
                        setRoleList(res);
                    } else {
                        setRoleOptions(prev => [...prev, ...options]);
                        setRoleList(prev => [...prev, ...res]);
                    }

                    currentPageRef.current = pageToFetch;

                    setHasMoreRoles(res.length === 20);
                })
                .catch(() => {});
        },
        [
            isRoleLocationSelected,
            selectedData.roleLocation,
            selectedData.function,
            selectedData.subFunction,
            selectedData.department,
            selectedData.subDepartment,
            selectedData.roleLevel,
            selectedData.role,
            action,
            roleSearch,
        ],
    );

    useEffect(() => {
        if (!isRoleLocationSelected) return;

        currentPageRef.current = 1;
        setHasMoreRoles(true);
        setRoleOptions([]);
        setRoleList([]);
        setNoRolesFound(false);
        fetchRoles(true);
    }, [
        isRoleLocationSelected,
        selectedData.roleLocation,
        selectedData.function,
        selectedData.subFunction,
        selectedData.department,
        selectedData.subDepartment,
        selectedData.roleLevel,
    ]);

    useEffect(() => {
        if (action === 'edit') {
            GetUserRoleRequests(roleType)
                .then((resp: IRoleRequestResponse) => {
                    if (!resp) return;

                    setSelectedData(prev => ({
                        ...prev,
                        roleLocation: { label: '', value: resp.roleLocation?.toString() },
                    }));

                    //set function and get subfunctions
                    if (resp.functionId && resp.functionId !== null) {
                        dispatch(fetchSubRoleFunctions({ functionId: Number(resp.functionId) }));
                        setSelectedData(prev => ({
                            ...prev,
                            function: resp.functionId?.toString(),
                        }));
                    }

                    //set subfunction and get department
                    dispatch(
                        fetchDepartmentsBySubfunctionId({
                            subfunctionid: resp.subFunctionId?.toString() ?? '0',
                        }),
                    );

                    setSelectedData(prev => ({
                        ...prev,
                        subFunction: resp.subFunctionId?.toString() ?? '0',
                    }));

                    //set department and get subdepartment
                    dispatch(
                        fetchSubDepartmentList({
                            departmentId: resp.departmentId?.toString() ?? '0',
                        }),
                    );

                    setSelectedData(prev => ({
                        ...prev,
                        department: resp.departmentId?.toString() ?? '0',
                    }));

                    //set sub - department
                    setSelectedData(prev => ({
                        ...prev,
                        subDepartment: resp.subDepartmentId?.toString() ?? '0',
                    }));
                    //set level
                    if (resp.responsibilityLevelId && resp.responsibilityLevelId !== null) {
                        setSelectedData(prev => ({
                            ...prev,
                            roleLevel: resp.responsibilityLevelId?.toString() ?? '',
                        }));
                    }

                    if (resp.roleId && resp.roleId !== null) {
                        setSelectedData(prev => ({
                            ...prev,
                            role: {
                                value: resp.roleId.toString(),
                                label: '',
                            },
                        }));

                        const selectedRole = roleList.find(r => r.roleId === resp.roleId);

                        setSelectedRoleData(selectedRole ?? null);
                    }
                    setExistingRoleAttributes(resp.roleAttributes ?? []);
                })
                .catch(_ => {});
        }
    }, [action, roleType]);

    const searchRoles = (term: string) => {
        if (selectedData.roleLocation === null) return;

        setRoleSearch(term);
        getFilteredRoles({
            locationId: Number(selectedData.roleLocation.value),
            functionId: selectedData.function === null ? null : Number(selectedData.function),
            subFunctionId:
                selectedData.subFunction === null ? null : Number(selectedData.subFunction),
            departmentId: selectedData.department === null ? null : Number(selectedData.department),
            subDepartmentId:
                selectedData.subDepartment === null ? null : Number(selectedData.subDepartment),
            responsibilityLevelId:
                selectedData.roleLevel === null ? null : Number(selectedData.roleLevel),
            pageNumber: 1,
            pageSize: 20,
            search: term,
        })
            .then((res: RoleResponse[]) => {
                const roleOptions: DdlOption[] = res.map(r => ({
                    label: `${r.responsibilityLevel ?? ''} - ${r.role}`,
                    value: r.roleId.toString(),
                    desc: `${r.roleGeoName ?? ''} ${r.subFunction ?? ''} ${r.department ?? ''}`,
                }));

                setRoleOptions(roleOptions);
                setRoleList(res);
            })
            .catch(_ => {});
    };

    let debounceTimeout: ReturnType<typeof setTimeout>;
    const handleSearch = (value: string): void => {
        clearTimeout(debounceTimeout);

        debounceTimeout = setTimeout(() => {
            searchRoles(value);
        }, 500);
    };

    const handleSaveRoleRequest = (attributes: IROleAttributeRequest[], comment: string) => {
        setIsSavingRole(true);
        const payload: INewRoleRequest = {
            department: selectedData.department === null ? null : Number(selectedData.department),
            subDepartment:
                selectedData.subDepartment === null ? null : Number(selectedData.subDepartment),
            function: selectedData.function === null ? null : Number(selectedData.function),
            subFunction:
                selectedData.subFunction === null ? null : Number(selectedData.subFunction),
            location: Number(selectedData.roleLocation?.value),
            roleId: Number(selectedData.role?.value),
            responsibilityLevel:
                selectedData.roleLevel === null ? null : Number(selectedData.roleLevel),
            roleType: roleType,
            requestComment: comment,
            roleAttributes: attributes,
            accessRequestId: null,
        };

        saveNewRoleRequest(payload)
            .then(resp => {
                if (resp.statusCode === 200) {
                    setToastConfig({
                        message: 'Role requested created',
                        open: true,
                        type: 'Success',
                    });
                    callBackFetchRoles();
                } else {
                    setToastConfig({ message: 'Role requested failed', open: true, type: 'Error' });
                }
                setIsSavingRole(false);
                setShowAdditionalInfo(false);
                setIsFlyoutOpen(false);
            })
            .catch(_ => {
                setToastConfig({ message: 'Role requested failed', open: true, type: 'Error' });
                setIsSavingRole(false);
            });
    };

    const RequestRoleContent = (
        <Flex vertical gap={10}>
            <DropDown
                className={styles['request-new-role-ddl']}
                id="role-selection-popup-dropdown-three"
                dropdown={{
                    required: true,
                    isDisabled: isLocationLoading,
                    label: 'Select role location',
                    onChange: (option: any) => {
                        setRoleSearch(null);
                        setSelectedData(prev => ({
                            ...prev,
                            roleLocation: option,
                            role: null,
                        }));
                    },
                    options: getLocationOptionsConversion() as TreeDropDownOptionType[],
                    placeholder: 'Select',
                    size: 'L',
                    type: 'tree',
                    selectedOptions:
                        !!selectedData && selectedData?.roleLocation
                            ? [selectedData?.roleLocation]
                            : [],
                }}
                searchInput={{
                    searchPlaceholder: 'Search',
                    searchSize: 'S',
                    searchWholeString: true,
                }}
            />

            <MultiFilterChipSelector
                width="23rem"
                options={getRoleFunctions()}
                required={true}
                label="Select your function"
                onChange={(option: string[]) => {
                    const selectedValue =
                        option && option.length > 0 && option[0] ? option[0] : null;
                    setSelectedData(prev => ({
                        ...prev,
                        function: selectedValue,
                        subFunction: null,
                        department: null,
                        subDepartment: null,
                        roleLevel: null,
                        role: null,
                    }));
                    setIsDirty(true);
                    if (selectedValue === null) return;

                    dispatch(fetchSubRoleFunctions({ functionId: Number(selectedValue) }));
                }}
                value={!!selectedData && selectedData?.function ? [selectedData.function] : []}
                isMultiSelect={false}
                assistiveText={undefined}
                prefixLabel=""
            />

            <MultiFilterChipSelector
                width="23rem"
                required={true}
                options={getRoleSubFunctions()}
                label="Select your sub-function"
                onChange={(option: string[]) => {
                    const selectedValue =
                        option && option.length > 0 && option[0] ? option[0] : null;

                    setSelectedData(prev => ({
                        ...prev,
                        subFunction: selectedValue,
                        department: null,
                        subDepartment: null,
                        roleLevel: null,
                        role: null,
                    }));

                    setIsDirty(true);

                    if (selectedValue === null) return;
                    dispatch(
                        fetchDepartmentsBySubfunctionId({
                            subfunctionid: selectedValue,
                        }),
                    );
                }}
                value={
                    !!selectedData && selectedData?.subFunction ? [selectedData.subFunction] : []
                }
                isMultiSelect={false}
                assistiveText={undefined}
                prefixLabel=""
            />

            <MultiFilterChipSelector
                width="23rem"
                options={getDepartmentOptions()}
                required={true}
                label="Select your Department"
                onChange={(option: string[]) => {
                    const selectedValue =
                        option && option.length > 0 && option[0] ? option[0] : null;
                    setSelectedData(prev => ({
                        ...prev,
                        department: selectedValue,
                        subDepartment: null,
                        roleLevel: null,
                        role: null,
                    }));
                    setIsDirty(true);
                    if (selectedValue === null) return;
                    dispatch(fetchSubDepartmentList({ departmentId: selectedValue }));
                }}
                value={!!selectedData && selectedData?.department ? [selectedData.department] : []}
                isMultiSelect={false}
                assistiveText={undefined}
                prefixLabel=""
            />

            <MultiFilterChipSelector
                width="23rem"
                options={getSubDepartmentOptions()}
                required={true}
                label="Select your Sub-department"
                onChange={(option: string[]) => {
                    const selectedValue =
                        option && option.length > 0 && option[0] ? option[0] : null;
                    setIsDirty(true);
                    setSelectedData(prev => ({
                        ...prev,
                        subDepartment: selectedValue,
                        roleLevel: null,
                        role: null,
                    }));
                }}
                value={
                    !!selectedData && selectedData?.subDepartment
                        ? [selectedData?.subDepartment]
                        : []
                }
                isMultiSelect={false}
                assistiveText={undefined}
                prefixLabel=""
            />

            <MultiFilterChipSelector
                width="23rem"
                required={true}
                options={getRoleLevels()}
                label="Select your role level"
                onChange={(option: string[]) => {
                    const selectedValue =
                        option && option.length > 0 && option[0] ? option[0] : null;
                    setIsDirty(true);

                    setSelectedData(prev => ({
                        ...prev,
                        roleLevel: selectedValue,
                        role: null,
                    }));
                }}
                value={selectedData && selectedData.roleLevel ? [selectedData.roleLevel] : []}
                isMultiSelect={false}
                assistiveText={undefined}
                prefixLabel=""
            />

            <DropDown
                className={'dropdown-options-custom'}
                id="role-selection-popup-dropdown-one"
                dropdown={{
                    caption: noRolesFound ? 'No roles found for the selected criteria' : '',

                    captionIcon: noRolesFound ? 'info-circle' : undefined,

                    captionMessageType: noRolesFound ? 'default' : undefined,

                    label: 'Select your Role',
                    required: true,
                    options: roleOptions,
                    placeholder: 'Select',
                    onChange: (option: any, _) => {
                        setIsDirty(true);

                        const selectedRole = roleList.find(
                            r => r.roleId.toString() === option.value,
                        );

                        setSelectedRoleData(selectedRole ?? null);

                        setSelectedData(prev => ({
                            ...prev,
                            role: option,
                        }));
                    },
                    selectedOptions: selectedData && selectedData.role ? [selectedData.role] : [],
                    showDescription: true,
                    showRadio: false,
                    onScroll: () => {
                        if (hasMoreRoles) {
                            fetchRoles();
                        }
                    },
                    onSearch: (term: string) => {
                        handleSearch(term);
                    },
                }}
                searchInput={{
                    searchPlaceholder: 'Search',
                    searchSize: 'L',
                    searchWholeString: true,
                }}
            />

            {selectedData.role !== null && (
                <Button
                    variant="Link"
                    text="View Role Permissions"
                    onClick={() => {
                        setShowPermissions(true);
                    }}
                />
            )}
        </Flex>
    );

    return (
        <>
            <Flyout
                flyoutOpen={flyoutOpen}
                heading={flyoutHeader}
                subHeading={flyoutSubheader}
                content={RequestRoleContent}
                primaryBtnProps={{
                    variant: 'Primary',
                    onClick: () => {
                        setShowAdditionalInfo(true);
                    },
                    text: 'Add Addition Details',

                    disabled: !isFormValid || (action === 'edit' && !isDirty),
                }}
                secondaryBtnProps={{
                    variant: 'Secondary',
                    onClick: () => {
                        setIsDirty(false);
                        setNoRolesFound(false);
                        setSelectedData({
                            department: null,
                            function: null,
                            role: null,
                            roleLevel: null,
                            roleLocation: null,
                            subDepartment: null,
                            subFunction: null,
                        });
                    },
                    text: 'Reset',
                }}
                cancelIconClick={() => {
                    setIsFlyoutOpen(false);
                }}
                iconForCancel={{
                    icon: 'x-close',
                    onClick: () => {
                        setIsFlyoutOpen(false);
                    },
                }}
                containerMaxWidth={'26.5rem'}
                direction="right"
                dataTestId="flyout-filter"
                id="primary-role-request-flyout"
                className={styles['role-selection-flyout']}
            />

            {showAdditionalInfo && selectedRoleData && (
                <RoleRequestAdditionalInfo
                    flyoutOpen={showAdditionalInfo}
                    setIsAddDetFlyoutOpen={setShowAdditionalInfo}
                    role={selectedRoleData}
                    roleLocation={selectedData.roleLocation!}
                    handleSaveRequestAccess={handleSaveRoleRequest}
                    isSaving={isSavingRole}
                    roleAttributes={existingRoleAttributes}
                />
            )}

            {showPermissions && (
                <RolesPermissions
                    flyoutOpen={showPermissions}
                    handleClose={setShowPermissions}
                    roleId={
                        roleList.filter(r => r.roleId.toString() === selectedData.role?.value)[0]
                            ?.roleId ?? 0
                    }
                />
            )}
            {toastConfig.open && (
                <Toast
                    type={toastConfig.type}
                    message={toastConfig.message}
                    toggle={toastConfig.open}
                    onCloseToast={() =>
                        setToastConfig({ message: '', open: false, type: 'Success' })
                    }
                    mode="Top Right"
                    distance="x5l"
                    timer={5000}
                />
            )}
        </>
    );
};

export default RequestNewRole;
