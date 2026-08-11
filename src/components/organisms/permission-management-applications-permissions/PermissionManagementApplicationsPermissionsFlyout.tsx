import { useState, useEffect, useCallback, useRef } from 'react';
import {
    Flyout,
    Button,
    Dialog,
    Icon,
    Table,
    TagSelector,
    Counter,
    FilterChip,
    CheckBox,
    IconButton,
    Toast,
} from 'konnect-react-components';
import { Flex, Skeleton, Tooltip } from 'antd';
import { useDispatch, useSelector } from 'react-redux';
import { AppDispatch, RootState, fetchApplicationPermissionsForRole } from '../../../store';
import {
    deleteApplicationRoleMapping,
    submitApplicationRoleMapping,
} from '../../../services/permission';
import styles from './PermissionManagementApplicationsPermissionsFlyout.module.scss';
import type { AppRole, IApplicationsAdGroupsData } from '../../../types/response';
import type { OptionType, ICustomOptionType } from '../../../types/common';
import { EllipsisWithTooltip, Label } from '../../atoms';
import { isEqual, cloneDeep } from 'lodash';
import { logError } from '../../../utils/helpers';

interface IPermissionManagementApplicationsPermissionsFlyoutProps {
    toggleFlyout: boolean;
    roleDetails: AppRole;
    onCancelIconClickOfFlyout: () => void;
}

interface TableRow {
    key: number;
    application?: string;
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
}

type ApplicationRoleMappingPayload = {
    roleId: number;
    toolPermissions: {
        toolId: number;
        toolFeatureId: number;
        isActive: number;
    }[];
};

const PermissionManagementApplicationsPermissionsFlyout = ({
    toggleFlyout,
    roleDetails,
    onCancelIconClickOfFlyout,
}: Readonly<IPermissionManagementApplicationsPermissionsFlyoutProps>) => {
    const dispatch = useDispatch<AppDispatch>();

    const rolePermissionState = useSelector((state: RootState) => state.rolePermissions);
    const { existingToolPermissions, otherToolPermissions, pagination } =
        rolePermissionState.applicationsData;

    const [resetKeys, setResetKeys] = useState<Record<string, number>>({});
    const [showDialogForSaveEditChanges, setShowDialogForSaveEditChanges] =
        useState<boolean>(false);
    const [showDialogForCancelEditChanges, setShowDialogForCancelEditChanges] =
        useState<boolean>(false);
    const [tableRowData, setTableRowData] = useState<TableRow[]>([]);
    const [paginatedData, setPaginatedData] = useState<TableRow[]>([]);
    const [pageNumber, setPageNumber] = useState(1);
    const [pageSize, setPageSize] = useState(10);
    const [isAddNewApplicationButtonDisabled, setIsAddNewApplicationButtonDisabled] =
        useState<boolean>(false);
    const [isEditModeOn, setIsEditModeOn] = useState<boolean>(false);
    const [selectedApplications, setSelectedApplications] = useState<Record<number, OptionType[]>>(
        {},
    );
    const [selectedAdGroups, setSelectedAdGroups] = useState<Record<number, OptionType[]>>({});
    const [adGroupOptions, setAdGroupOptions] = useState<
        Record<number, IApplicationsAdGroupsData[]>
    >({});
    const [toggleSuccessToast, setToggleSuccessToast] = useState(false);
    const [toggleErrorToast, setToggleErrorToast] = useState<boolean>(false);
    const [toggleDeleteToast, setToggleDeleteToast] = useState<boolean>(false);
    const tableRef = useRef<any>(null);
    const savedChangesPayloadRef = useRef<{
        payload: ApplicationRoleMappingPayload;
    }>({
        payload: {} as ApplicationRoleMappingPayload,
    });
    const [, setEditedApplicationIds] = useState(new Set<number>());
    const [applicationNameList, setapplicationNameList] = useState<string[]>([]);
    const [appNameWithoutAdGroups, setAppNameWithoutAdGroups] = useState<string[]>([]);
    const [isEditButtonDisabled, setIsEditButtonDisabled] = useState<boolean>(false);
    const [currentRecord, setCurrentRecord] = useState<any>(null);
    const [buttonLoadingState, setButtonLoadingState] = useState<boolean>(false);
    const [isRoleDeleted, setIsRoleDeleted] = useState<boolean>(false);
    const [showDialogForAddNewApplication, setShowDialogForAddNewApplication] =
        useState<boolean>(false);
    const [showDialogForApplicationDeletion, setShowDialogForApplicationDeletion] =
        useState<boolean>(false);
    const [tableRowExpandedState, setTableRowExpandedState] = useState(false);
    useEffect(() => {
        if (!roleDetails.roleId) {
            return;
        }
        dispatch(
            fetchApplicationPermissionsForRole({
                roleId: roleDetails.roleId,
                pageNumber: pageNumber,
                pageSize: pageSize,
            }),
        );
    }, [roleDetails.roleId, pageNumber, pageSize, isRoleDeleted]);

    useEffect(() => {
        if (existingToolPermissions?.length) {
            loadExistingApplicationsForRole();
        }
    }, [existingToolPermissions]);

    useEffect(() => {
        tableRef.current?.toogleRowExpandCallBack(0, tableRowExpandedState);
    }, [tableRowExpandedState]);

    useEffect(() => {
        if (tableRowData.length == 0) {
            const newPageNumber = pageNumber == 1 ? 1 : pageNumber - 1;
            setPageNumber(newPageNumber);
        }

        setPaginatedData(tableRowData);
    }, [tableRowData]);

    const [isSaveButtonDisabled, setIsSaveButtonDisabled] = useState(true);
    const previousTableRowDataRef = useRef(cloneDeep(tableRowData));
    const initialDataRef = useRef(cloneDeep(tableRowData));

    useEffect(() => {
        if (!previousTableRowDataRef.current.length) {
            previousTableRowDataRef.current = cloneDeep(tableRowData);
        }
    }, [tableRowData]);

    const removeEditModeFlag = (object: any) => {
        if (Array.isArray(object)) {
            object.forEach(removeEditModeFlag);
        } else if (object && typeof object === 'object') {
            delete object.isEditMode;
            Object.values(object).forEach(removeEditModeFlag);
        }
    };

    useEffect(() => {
        const currentDataCopy = cloneDeep(tableRowData);
        removeEditModeFlag(currentDataCopy);

        const hasChanges = isEditModeOn && !isEqual(currentDataCopy, initialDataRef.current);
        setIsSaveButtonDisabled(!hasChanges);

        if (hasChanges) {
            initialDataRef.current = cloneDeep(tableRowData);
        }
    }, [tableRowData, isEditModeOn, selectedAdGroups]);

    useEffect(() => {
        if (isEditModeOn) {
            setIsSaveButtonDisabled(true);
        }
    }, [isEditModeOn]);

    const loadExistingApplicationsForRole = useCallback(() => {
        if (!existingToolPermissions.length) {
            return;
        }

        const newTableRowData = existingToolPermissions.map((application, idx) => {
            let uniqueAdGroups = application.adgroups.flatMap(adgroup =>
                adgroup.permission
                    .filter(perm => perm.isActiveToolPermission)
                    .map(() => adgroup.adGroup),
            );
            uniqueAdGroups = [...new Set(uniqueAdGroups)];

            return {
                key: idx,
                application: application.toolDetails.toolName,
                applicationId: application.toolDetails.toolId.toString(),
                toolType: application.toolDetails.toolType,
                role: '',
                adgroup: uniqueAdGroups,
                action: '',
                isEditMode: false,
                disableEditForApplicationRow: true,
                selectedPermissionCount: application.activePermissionCount,
                expandedRowData: application.adgroups.flatMap(adgroup =>
                    adgroup.permission.map(perm => ({
                        key: perm.toolPermissionId,
                        appFeature: perm.toolPermissionName,
                        appModuleName: perm.toolModuleName,
                        role: '',
                        adgroup: [''],
                        action: '',
                        parentRowKey: idx,
                        isActive: perm.isActiveToolPermission,
                        isEditMode: false,
                    })),
                ),
                isRowSaved: true,
            };
        });

        setTableRowData(newTableRowData);

        const adGroupOptions: Record<number, IApplicationsAdGroupsData[]> = {};
        const selectedAdGroups: Record<number, OptionType[]> = {};

        newTableRowData.forEach(row => {
            const { adgroup, applicationId, key } = row;
            const filteredAdGroups = existingToolPermissions.flatMap(appPermission =>
                appPermission.adgroups.filter(adGroup => {
                    return adgroup.includes(adGroup.adGroup);
                }),
            );

            const uniqueAdGroups = new Set<string>();
            const uniqueSelectedAdGroups = new Set<string>();

            adGroupOptions[key] = existingToolPermissions
                .filter(app => app.toolDetails.toolId.toString() === applicationId)
                .flatMap(app =>
                    app.adgroups
                        .map(adGroup => {
                            const adGroupKey = `${adGroup.adGroup}-${adGroup.adGroupId}`;
                            if (!uniqueAdGroups.has(adGroupKey)) {
                                uniqueAdGroups.add(adGroupKey);
                                return {
                                    adGroup: adGroup.adGroup,
                                    adGroupId: adGroup.adGroupId,
                                    permission: adGroup.permission,
                                    status: adGroup.status,
                                };
                            }
                            return null;
                        })
                        .filter(
                            (adGroup): adGroup is IApplicationsAdGroupsData => adGroup !== null,
                        ),
                );

            selectedAdGroups[key] = filteredAdGroups
                .filter(adGroup => {
                    if (!uniqueSelectedAdGroups.has(adGroup.adGroupId)) {
                        uniqueSelectedAdGroups.add(adGroup.adGroupId);
                        return true;
                    }
                    return false;
                })
                .map(adGroup => ({
                    label: adGroup.adGroup,
                    value: adGroup.adGroupId,
                }));
        });

        // Update state
        setAdGroupOptions(adGroupOptions);
        setSelectedAdGroups(selectedAdGroups);
    }, [existingToolPermissions]);

    const onClickHandlerForAddNewApplicationButton = () => {
        setIsAddNewApplicationButtonDisabled(true);
        setIsEditModeOn(false);
        setIsEditButtonDisabled(true);
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
            },
            ...prevData,
        ]);
    };

    const onClickHandlerForEditButton = () => {
        setIsAddNewApplicationButtonDisabled(false);
        setIsEditModeOn(true);
        setTableRowData(prevValue => {
            prevValue = prevValue.map(row => {
                return {
                    ...row,
                    isEditMode: true,
                    expandedRowData: row.expandedRowData?.map(expandedRow => ({
                        ...expandedRow,
                        isEditMode: true,
                    })),
                };
            });
            return prevValue;
        });
    };

    const getApplicationsForDropdown = (selectedApps: string[]) => {
        return otherToolPermissions
            .filter(app => !selectedApps.includes(app.toolDetails.toolName))
            .map(app => ({
                desc: app.toolDetails.toolName,
                label: `${app.toolDetails.toolType} ${app.toolDetails.toolId}`,
                value: app.toolDetails.toolId.toString(),
                toolType: app.toolDetails.toolType,
            }));
    };

    const handleAppChange = (value: ICustomOptionType, record: TableRow) => {
        const selectedApp = otherToolPermissions.filter(
            app => app.toolDetails.toolId.toString() === value.value,
        )[0];

        if (!selectedApp) {
            return;
        }
        setResetKeys(prev => ({
            ...prev,
            [record.key]: (prev[record.key] ?? 0) + 1,
        }));

        setSelectedApplications(prev => {
            prev[record.key] = [value];
            return prev;
        });

        const adGroups = selectedApp?.adgroups;
        const permissions = adGroups.flatMap(group => group.permission);

        setAdGroupOptions(prev => {
            const newAdGroupOptions = { ...prev };
            newAdGroupOptions[record.key] = adGroups;
            return newAdGroupOptions;
        });

        setSelectedAdGroups(prev => {
            const updatedSelected = { ...prev };
            updatedSelected[record.key] = [];
            return updatedSelected;
        }); // Update only the selected row

        checkIfSingleAdGroupForSelectedTool(record.key);

        // Update only the selected row
        setTableRowData(prevData =>
            prevData.map(row =>
                row.key === record.key
                    ? {
                          ...row,
                          application: value.desc, // Correct app name update
                          applicationId: value.value, // Update the selected application id
                          toolType: value.toolType,
                          adgroup: [''], // Reset adgroup selection
                          selectedPermissionCount: 0, //Reset
                          expandedRowData: permissions.map(perm => ({
                              key: perm.toolPermissionId,
                              appFeature: perm.toolPermissionName || '',
                              appModuleName: perm.toolModuleName,
                              role: '',
                              adgroup: [''],
                              action: '',
                              parentRowKey: row.key,
                              isEditMode: Boolean(Object.keys(selectedAdGroups).length),
                              isActive: null,
                          })),
                      }
                    : row,
            ),
        );
    };

    const checkIfSingleAdGroupForSelectedTool = (key: number) => {
        setAdGroupOptions(options => {
            const selectedToolAdGroupOptions = options[key];
            if (selectedToolAdGroupOptions?.length === 1) {
                const mappedAdGroups = selectedToolAdGroupOptions.map(({ adGroup, adGroupId }) => ({
                    label: adGroup,
                    value: adGroupId,
                }));
                handleApplyAdGroups(key, mappedAdGroups);
            }
            return options;
        });
    };

    const handleApplyAdGroups = (recordKey: number, selectedValues: OptionType[]) => {
        const selectedAdGroupIds = [...new Set(selectedValues.map(item => item.value))];
        if (selectedAdGroupIds.length && !isEditModeOn) {
            // Expand the expandedRow on selection of ad group. 0 index because we need to expand only the initial row.
            setTimeout(() => {
                setTableRowExpandedState(true);
            }, 1000);
        }

        setSelectedAdGroups(prev => ({
            ...prev,
            [recordKey]: selectedValues,
        }));

        if (!isAddNewApplicationButtonDisabled) {
            const rowWithoutAdGroup = tableRowData
                .filter(
                    app =>
                        (app.adgroup.length == 0 && app.key !== recordKey) ||
                        (app.key === recordKey && selectedValues.length === 0),
                )
                .map(app => app.application)
                .filter((app): app is string => app !== undefined); // Filter out undefined values

            setAppNameWithoutAdGroups(rowWithoutAdGroup);

            const appRowData = tableRowData
                .filter(
                    app =>
                        (app.expandedRowData?.filter(expandedRow => expandedRow.isActive).length ===
                            0 &&
                            app.key !== recordKey) ||
                        (app.key === recordKey && selectedValues.length === 0),
                )
                .map(app => app.application)
                .filter((app): app is string => app !== undefined);

            setapplicationNameList(appRowData);
        }

        setTableRowData(prevData => {
            return prevData.map(row => {
                if (row.key === recordKey && row.expandedRowData) {
                    // Add the application id to the Set upon updation of AD Group
                    setEditedApplicationIds(prevData => prevData.add(Number(row.applicationId)));

                    let checkedPermissionsCountForAdGroup = 0;
                    const appPermissions = [...existingToolPermissions, ...otherToolPermissions];
                    const updatedExpandedRowData = row.expandedRowData.map(permission => {
                        const isPermissionActive =
                            selectedAdGroupIds.length > 0 &&
                            appPermissions.some(app =>
                                app.adgroups.some(group => {
                                    const groupMatch = selectedAdGroupIds.includes(group.adGroupId);
                                    const permissionMatch = group.permission.some(
                                        p => p.toolPermissionId === permission.key,
                                    );
                                    return groupMatch && permissionMatch;
                                }),
                            );

                        if (isPermissionActive) {
                            checkedPermissionsCountForAdGroup += 1;
                        }

                        return {
                            ...permission,
                            isActive: isPermissionActive ? true : null,
                            isEditMode: isPermissionActive,
                        };
                    });

                    return {
                        ...row,
                        adgroup: selectedAdGroupIds.length ? selectedAdGroupIds : null,
                        expandedRowData: updatedExpandedRowData,
                        selectedPermissionCount: checkedPermissionsCountForAdGroup,
                    };
                }
                return row;
            }) as TableRow[];
        });
    };

    const handleSelectedPermission = (key: number, recordKey: number, checked: boolean) => {
        setTableRowData(prevData =>
            prevData.map(row => {
                if (row.key === key) {
                    // Add the application id to the Set upon updation of permissions
                    setEditedApplicationIds(prevData => prevData.add(Number(row.applicationId)));

                    return {
                        ...row,
                        expandedRowData: row.expandedRowData?.map(expandedRow => {
                            if (expandedRow.key === recordKey) {
                                return {
                                    ...expandedRow,
                                    isActive: checked,
                                };
                            } else {
                                return expandedRow;
                            }
                        }),
                    };
                }
                return row;
            }),
        );

        setTableRowData(prevData =>
            prevData.map(row => {
                if (!isAddNewApplicationButtonDisabled) {
                    const appRowData = prevData
                        .filter(
                            r1 =>
                                r1.expandedRowData?.filter(expandedRow => expandedRow.isActive)
                                    .length == 0,
                        )
                        .map(app => app.application)
                        .filter((app): app is string => app !== undefined); // Filter out undefined values

                    setapplicationNameList(appRowData);
                }
                return {
                    ...row,
                    selectedPermissionCount: row.expandedRowData?.filter(
                        expandedRow => expandedRow.isActive,
                    ).length,
                };
            }),
        );
    };

    const getDisabledStatusForCheck = (key: number) => {
        if (!selectedAdGroups[key] || selectedAdGroups[key].length === 0) {
            return true;
        }
        return false;
    };

    const getAdGroupLabel = (adGroupId: string) => {
        const adGroup = existingToolPermissions
            .flatMap(app => app.adgroups)
            .find(group => group.adGroupId === adGroupId);
        const adGroupOptionsArray = Object.values(adGroupOptions).flat();
        const adGroupForNewApplication = adGroupOptionsArray.find(
            group => group.adGroupId === adGroupId,
        );
        // Return the label if found, otherwise return the adGroupId
        return adGroup?.adGroup || adGroupForNewApplication?.adGroup || adGroupId;
    };

    const handleCheckClick = (record: TableRow) => {
        setTableRowExpandedState(true);
        setTableRowData(prevData =>
            prevData.map(row =>
                row.key === record.key
                    ? {
                          ...row,
                          isEditMode: false,
                          disableEditForApplicationRow: true,
                          isRowSaved: true,
                          // This is being done to handle edit mode for permission checkboxes
                          expandedRowData: row.expandedRowData?.map(expandedRow => ({
                              ...expandedRow,
                              isEditMode: false,
                              isRowSaved: true,
                          })),
                      }
                    : row,
            ),
        );
        setCurrentRecord(record);
        setShowDialogForAddNewApplication(true);
    };

    const handleRemoveRow = async (key: number, type?: string) => {
        setButtonLoadingState(true);

        const rowToRemove = tableRowData.find(row => row.key === key);
        if (!rowToRemove) return;

        const payload = {
            toolId: Number(rowToRemove.applicationId),
            roleId: Number(roleDetails.roleId),
        };

        try {
            await deleteApplicationRoleMapping(payload);

            setTableRowData(prevData => prevData.filter(row => row.key !== key));

            setAdGroupOptions(prev => {
                const updatedOptions = { ...prev };
                delete updatedOptions[key];
                return updatedOptions;
            });

            setSelectedAdGroups(prev => {
                const updatedSelected = { ...prev };
                delete updatedSelected[key];
                return updatedSelected;
            });

            setIsAddNewApplicationButtonDisabled(false);
            setIsEditButtonDisabled(false);
            setTableRowExpandedState(false);
            setButtonLoadingState(false);
            setIsRoleDeleted(true);
            if (type === 'delete') {
                setToggleDeleteToast(true);
            }
        } catch (error) {
            logError('PermissionManagementApplicationsPermissionsFlyout - handleRemoveRow', error);
            setToggleErrorToast(true);
            setButtonLoadingState(false);
            setIsRoleDeleted(false);
        }
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

    const getAdGroupOptions = (key: number) => {
        return (
            adGroupOptions[key]?.map(({ adGroup, adGroupId }) => ({
                label: adGroup,
                value: adGroupId,
            })) || []
        );
    };

    const getSelectedAdGroups = (key: number) => {
        return (
            selectedAdGroups[key]?.map(({ label, value }) => ({
                label,
                value,
            })) || []
        );
    };

    const handlePageChange = (page: number) => {
        setPageNumber(page);
    };

    const handlePageSizeChange = (size: number) => {
        setPageSize(size);
    };

    const preparePayloadForSavingChanges = () => {
        const data = {} as ApplicationRoleMappingPayload;
        const appPermissions: ApplicationRoleMappingPayload['toolPermissions'] = [];
        tableRowData
            .filter(r => r.isRowSaved)
            .forEach(row => {
                row.expandedRowData?.forEach(perm => {
                    appPermissions.push({
                        toolId: Number(row.applicationId),
                        toolFeatureId: Number(perm.key),
                        isActive: Number(perm.isActive),
                    });
                });
                data.roleId = Number(roleDetails.roleId);
                data.toolPermissions = appPermissions;
                savedChangesPayloadRef.current.payload = data;
            });
    };

    const onClickHandlerForSaveChanges = async () => {
        preparePayloadForSavingChanges();
        if (
            !savedChangesPayloadRef.current.payload.roleId ||
            !savedChangesPayloadRef.current.payload.toolPermissions.length
        ) {
            return;
        }
        setButtonLoadingState(true);
        try {
            const response = await submitApplicationRoleMapping([
                savedChangesPayloadRef.current.payload,
            ]);
            if (response.statusCode === 200) {
                setShowDialogForAddNewApplication(false);
                setShowDialogForSaveEditChanges(false);
                setToggleSuccessToast(true);
                // Collapse the expanded row
                setTableRowExpandedState(false);
            }
        } catch (error) {
            logError(
                'PermissionManagementApplicationsPermissionsFlyout - onClickHandlerForSaveChanges - submitApplicationRoleMapping error',
                error,
            );
            setToggleErrorToast(true);
        } finally {
            setIsAddNewApplicationButtonDisabled(false);
            setIsEditButtonDisabled(false);
            setIsEditModeOn(false);
            setButtonLoadingState(false);
        }
    };

    const onClickHandlerForAddToolReviewEntry = () => {
        setTableRowExpandedState(true);
        setTableRowData(prevData =>
            prevData.map(row =>
                row.key === currentRecord.key
                    ? {
                          ...row,
                          isEditMode: true,
                          disableEditForApplicationRow: true,
                          isRowSaved: false,
                          // This is being done to handle edit mode for permission checkboxes
                          expandedRowData: row.expandedRowData?.map(expandedRow => ({
                              ...expandedRow,
                              isEditMode: true,
                              isRowSaved: false,
                          })),
                      }
                    : row,
            ),
        );
        setIsAddNewApplicationButtonDisabled(true);
        setIsEditButtonDisabled(true);
        setIsEditModeOn(false);
    };

    const onClickHandlerForSaveEditButton = () => {
        setTableRowData(prevData =>
            prevData.map(row => ({
                ...row,
                isEditMode: false,
                disableEditForApplicationRow: true,
                isRowSaved: true,
                // This is being done to handle edit mode for permission checkboxes
                expandedRowData: row.expandedRowData?.map(expandedRow => ({
                    ...expandedRow,
                    isEditMode: false,
                })),
            })),
        );
        preparePayloadForSavingChanges();
        setapplicationNameList([]);
        setAppNameWithoutAdGroups([]);
        setShowDialogForSaveEditChanges(true);
    };

    const onClickHandlerForContinueEditing = () => {
        setTableRowData(prevData =>
            prevData.map(row => ({
                ...row,
                isEditMode: true,
                disableEditForApplicationRow: true,
                isRowSaved: false,
                // This is being done to handle edit mode for permission checkboxes
                expandedRowData: row.expandedRowData?.map(expandedRow => ({
                    ...expandedRow,
                    isEditMode: true,
                })),
            })),
        );
        setShowDialogForSaveEditChanges(false);
    };

    const onClickHandlerForCancelEditButton = () => {
        setButtonLoadingState(true);
        setIsEditModeOn(false);
        setapplicationNameList([]);
        setAppNameWithoutAdGroups([]);
        loadExistingApplicationsForRole();
        setButtonLoadingState(false);
        setShowDialogForCancelEditChanges(false);
    };

    const onClickHandlerForDelete = (record: any) => {
        setCurrentRecord(record);
        setShowDialogForApplicationDeletion(true);
    };
    const normalizedRole = roleDetails.role?.trim() ?? '';
    const normalizedRegion = roleDetails.roleRegion?.trim() ?? '';

    const roleIncludesRegion =
        normalizedRegion && normalizedRole.toLowerCase().includes(normalizedRegion.toLowerCase());

    const heading =
        roleIncludesRegion || !normalizedRegion
            ? normalizedRole
            : `${normalizedRole} ${normalizedRegion}`;

    const getCustomActionsForFlyout = () => {
        return (
            <Flex justify="flex-end" gap={'16px'} style={{ width: '100%', marginRight: '10px' }}>
                {!isEditModeOn ? (
                    <Button
                        text="Add Tool"
                        disabled={isAddNewApplicationButtonDisabled}
                        variant="Secondary"
                        size="M"
                        onClick={onClickHandlerForAddNewApplicationButton}
                        icon="plus"
                    />
                ) : (
                    isEditModeOn && (
                        <Button
                            text="Cancel"
                            variant="Secondary"
                            size="M"
                            onClick={() => setShowDialogForCancelEditChanges(true)}
                        />
                    )
                )}

                {!isEditModeOn ? (
                    <Button
                        text="Edit"
                        variant="Secondary"
                        size="M"
                        onClick={onClickHandlerForEditButton}
                        icon="edit-02"
                        disabled={isEditButtonDisabled}
                    />
                ) : (
                    isEditModeOn && (
                        <Button
                            text="Save edit"
                            variant="Primary"
                            size="M"
                            onClick={onClickHandlerForSaveEditButton}
                            disabled={isSaveButtonDisabled}
                        />
                    )
                )}
            </Flex>
        );
    };

    const getContentForFlyout = () => {
        return rolePermissionState.isLoading ? (
            <Skeleton active paragraph={{ rows: 4, width: '100%' }} />
        ) : (
            <div>
                {applicationNameList.length > 0 ? (
                    <div className={styles['error-text-container']}>
                        <Label type="body2">
                            <Icon name="info-circle" size="xm" color="status-error-color" />
                            <span className={styles['error-text-color']}>
                                {' '}
                                No permission selected for tools{' '}
                                {applicationNameList.map(item => `"${item}"`).join(', ')}. The tool
                                will be removed from users list if no permission is selected.
                            </span>
                        </Label>{' '}
                    </div>
                ) : null}

                {appNameWithoutAdGroups.length > 0 ? (
                    <div className={styles['error-text-container']}>
                        <Label type="body2">
                            <Icon name="info-circle" size="xm" color="status-error-color" />
                            <span className={styles['error-text-color']}>
                                {' '}
                                No AD Group selected for tools{' '}
                                {appNameWithoutAdGroups.map(item => `"${item}"`).join(', ')}. The
                                tool will be removed from users list if no AD Group is selected.
                            </span>
                        </Label>
                    </div>
                ) : null}

                <Table
                    columns={TableColumns as any}
                    expandableRows={true}
                    data={paginatedData}
                    pagination={{
                        // totalItems: tableRowData.length > 0 ? tableRowData.length : 1,
                        totalItems: pagination.totalRows,
                        pageSize: pageSize,
                        currentPage: pageNumber,
                        onPageChange: handlePageChange,
                        onPageSizeChange: handlePageSizeChange,
                        blankOut: 10,
                    }}
                    ref={tableRef}
                />
            </div>
        );
    };

    const TableColumns = [
        {
            key: 'application',
            dataIndex: 'application',
            title: 'Tools & Permissions',
            externalStyles: { alignItems: 'center', whiteSpace: 'normal' },
            customExpandableColumn: true,
            render: (_value: string, record: TableRow) => (
                <>
                    {record.expandedRowData ? (
                        record.isEditMode && !record.disableEditForApplicationRow ? (
                            // This is done because the dropdown click event was being propogated due to which the expanded row was getting collapsed.
                            <div
                                style={{ width: '100%' }}
                                onClick={event => {
                                    event.stopPropagation();
                                }}
                            >
                                <TagSelector
                                    dataTestId="drop-down"
                                    id="drop-down"
                                    className={styles['application-tag-selector']}
                                    onChange={value =>
                                        handleAppChange(value as ICustomOptionType, record)
                                    }
                                    options={getApplicationsForDropdown(
                                        tableRowData.map(row => {
                                            return row.application;
                                        }) as string[],
                                    )}
                                    selectedOptions={getSelectedApplication(record.key)}
                                    placeholder="Select Tool"
                                    searchInput={{
                                        searchPlaceholder: 'Search',
                                        searchSize: 'L',
                                        searchWholeString: true,
                                    }}
                                    size="L"
                                    type="default"
                                    showCloseIcon={false}
                                    optionsContainerClassName={
                                        styles['application-tag-selector-dropdown-container']
                                    }
                                    portal={true}
                                />
                            </div>
                        ) : (
                            <div className={styles['application-cell-container']}>
                                {record.isRowSaved && (
                                    <Icon name="chevron-down" size="xm" color="neutrals-B300" />
                                )}
                                <div className={styles['header-title']}>
                                    <span className={styles['application-permissions-cell-title']}>
                                        {record.toolType} {record.applicationId}
                                    </span>
                                    <span
                                        className={styles['application-permissions-cell-content']}
                                    >
                                        <EllipsisWithTooltip
                                            text={String(record.application)}
                                            onClick={() => {}}
                                        />
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
            key: 'role',
            dataIndex: 'role',
            title: roleDetails.role ?? '',
            subTitle: `${roleDetails.roleId ?? ''} | ${roleDetails.roleRegion ?? ''}`,
            render: (_value: string, record: any) => {
                return record.expandedRowData ? (
                    <div className={styles['role_permissions_column']}>
                        <Counter
                            value={
                                record.selectedPermissionCount > 10
                                    ? record.selectedPermissionCount
                                    : `0${record.selectedPermissionCount}`
                            }
                            size="Small"
                        />
                    </div>
                ) : (
                    <div className={styles['role_permissions_column']}>
                        {record.isActive !== null ? (
                            <CheckBox
                                onChange={checked =>
                                    handleSelectedPermission(
                                        record.parentRowKey,
                                        record.key,
                                        checked,
                                    )
                                }
                                checked={record.isActive}
                                disabled={!record.isEditMode}
                            />
                        ) : (
                            <Icon name="x-close" size="l" color="neutrals-B80" />
                        )}
                    </div>
                );
            },
        },
        {
            key: 'adgroup',
            dataIndex: 'adgroup',
            title: 'AD groups',
            render: (_value: string, record: TableRow) => (
                <>
                    {record.expandedRowData &&
                        (record.adgroup !== null && record.isEditMode ? (
                            <Tooltip
                                title={record.adgroup.map(getAdGroupLabel).join(', ')}
                                placement="bottom"
                            >
                                <span>
                                    <TagSelector
                                        key={`tag-selector-${record.key}-${resetKeys[record.key] ?? 0}`}
                                        confirmSelection={{
                                            onApply: selectedValues =>
                                                handleApplyAdGroups(record.key, selectedValues),
                                            onCancel: () => {
                                                // clear the selected values for the row
                                                setSelectedAdGroups(prev => ({
                                                    ...prev,
                                                    [record.key]: [],
                                                }));
                                                //  reset key to force re-render
                                                setResetKeys(prev => ({
                                                    ...prev,
                                                    [record.key]: (prev[record.key] ?? 0) + 1,
                                                }));
                                            },
                                        }}
                                        dataTestId="drop-down"
                                        onChange={() => {}}
                                        id="drop-down"
                                        options={getAdGroupOptions(record.key)}
                                        placeholder="Select AD Group"
                                        searchInput={{
                                            searchPlaceholder: 'Search AD Group',
                                            searchSize: 'L',
                                            searchWholeString: true,
                                        }}
                                        selectedOptions={getSelectedAdGroups(record.key)}
                                        size="L"
                                        type="checkbox"
                                        filterChipProps={{
                                            showCloseIcon: false,
                                            outerContainerClass:
                                                styles['row-edit-filterchip-container'],
                                            showTooltip: false,
                                        }}
                                        optionsContainerClassName={
                                            styles['adgroup-tag-selector-dropdown-container']
                                        }
                                        portal={true}
                                    />
                                </span>
                            </Tooltip>
                        ) : record.adgroup && record.adgroup.length ? (
                            <Tooltip
                                title={record.adgroup.map(getAdGroupLabel).join(', ')}
                                placement="bottom"
                            >
                                <span>
                                    <FilterChip
                                        key={String(record.key)}
                                        label={`${record.adgroup.map(getAdGroupLabel).join(', ').slice(0, 28)}...`}
                                        counter={record?.adgroup?.length - 1}
                                        showCloseIcon={false}
                                        outerContainerClass={
                                            styles['row-view-filterchip-container']
                                        }
                                        showTooltip={false}
                                    />
                                </span>
                            </Tooltip>
                        ) : null)}
                </>
            ),
        },
        {
            key: 'action',
            dataIndex: 'action',
            title: 'Actions',
            render: (_value: string, record: TableRow) => (
                <Flex align="center" justify="center" gap={8}>
                    {record.expandedRowData &&
                        (record.isEditMode && !isEditModeOn ? (
                            <>
                                <IconButton
                                    size="Small"
                                    icon="check"
                                    onClick={() => handleCheckClick(record)}
                                    disabled={getDisabledStatusForCheck(record.key)}
                                />
                                <IconButton
                                    size="Small"
                                    icon="x-close"
                                    onClick={() => handleRemoveRow(record.key, 'cancel')}
                                    disabled={false}
                                />
                            </>
                        ) : (
                            <IconButton
                                size="Small"
                                icon="trash-01"
                                onClick={() => {
                                    onClickHandlerForDelete(record);
                                }}
                                disabled={isEditModeOn}
                            />
                        ))}
                </Flex>
            ),
        },
    ];

    return (
        <>
            <div className={styles['outer-container']}>
                <Flyout
                    id="permission-management-applications-permission-flyout"
                    flyoutOpen={toggleFlyout}
                    direction="right"
                    containerMaxWidth={'56.5rem'}
                    cancelIconClick={onCancelIconClickOfFlyout}
                    heading={heading}
                    subHeading={'View/add tools and AD groups for the selected role.'}
                    content={getContentForFlyout()}
                    customActions={getCustomActionsForFlyout()}
                    iconForCancel={{
                        icon: 'x-close',
                        onClick: () => {
                            onCancelIconClickOfFlyout();
                        },
                    }}
                />
            </div>

            {/* This dialog is for Add new tool functionality - Confirm add tool dialog on click of Check icon */}
            <div className={styles['permission-management-dialog']}>
                <Dialog
                    isOpen={showDialogForAddNewApplication}
                    title="Add Tool"
                    content={`Are you sure you want to give access for the tool “${currentRecord?.application}”? AD Group request for the same will be sent on confirmation.`}
                    primaryButtonText="Add Tool"
                    onPrimaryButtonClick={onClickHandlerForSaveChanges}
                    secondaryButtonText="Review Entry"
                    onSecondaryButtonClick={() => {
                        setShowDialogForAddNewApplication(false);
                        onClickHandlerForAddToolReviewEntry();
                    }}
                    onClose={() => {
                        setShowDialogForAddNewApplication(false);
                        onClickHandlerForAddToolReviewEntry();
                    }}
                    loading={buttonLoadingState}
                />
            </div>

            {/* This dialog is for Delete functionality - Confirm delete dialog on click of Trash icon */}
            <div className={styles['permission-management-dialog']}>
                <Dialog
                    isOpen={showDialogForApplicationDeletion}
                    title="Confirm Deletion"
                    content={`Are you sure you want to remove access for tool “${currentRecord?.application}”?`}
                    primaryButtonText="Delete"
                    onPrimaryButtonClick={() => {
                        handleRemoveRow(currentRecord?.key, 'delete');
                        setShowDialogForApplicationDeletion(false);
                    }}
                    secondaryButtonText="Don’t Delete"
                    onSecondaryButtonClick={() => {
                        setShowDialogForApplicationDeletion(false);
                    }}
                    onClose={() => {
                        setShowDialogForApplicationDeletion(false);
                    }}
                    loading={buttonLoadingState}
                />
            </div>

            {/* This dialog is for Edit functionality - Confirm dialog on click of Save edit */}
            <div className={styles['permission-management-dialog']}>
                <Dialog
                    isOpen={showDialogForSaveEditChanges}
                    title="Save Changes"
                    content={`
                        Your updates to the tool access setting for the role “${roleDetails.role}” will be saved. 
                        These changes may affect user access within the Command Centre.`}
                    primaryButtonText="Save"
                    onPrimaryButtonClick={onClickHandlerForSaveChanges}
                    secondaryButtonText="Continue Editing"
                    onSecondaryButtonClick={onClickHandlerForContinueEditing}
                    onClose={() => {
                        setShowDialogForSaveEditChanges(false);
                    }}
                    loading={buttonLoadingState}
                />
            </div>

            {/* This dialog is for Edit functionality - Discard confirm dialog on click of Cancel */}
            <div className={styles['permission-management-dialog']}>
                <Dialog
                    isOpen={showDialogForCancelEditChanges}
                    title="Discard Changes"
                    content="Are you sure you want to leave without saving your changes?"
                    primaryButtonText="Discard Changes"
                    onPrimaryButtonClick={onClickHandlerForCancelEditButton}
                    secondaryButtonText="Continue Editing"
                    onSecondaryButtonClick={() => {
                        setShowDialogForCancelEditChanges(false);
                    }}
                    onClose={() => {
                        setShowDialogForCancelEditChanges(false);
                    }}
                />
            </div>

            <Toast
                type="Success"
                message={`Role '${roleDetails.role}' updated successfully.`}
                mode="Top Right"
                distance="x5l"
                toggle={toggleSuccessToast}
                timer={5000}
                onCloseToast={() => setToggleSuccessToast(false)}
            />

            <Toast
                type="Delete"
                message={`Access to tool '${currentRecord?.application}' removed.`}
                mode="Top Right"
                distance="x5l"
                toggle={toggleDeleteToast}
                timer={5000}
                onCloseToast={() => setToggleDeleteToast(false)}
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

            <style>
                {`.flyout-header-main-text {
                width: 100%;
            }`}
            </style>
        </>
    );
};

export default PermissionManagementApplicationsPermissionsFlyout;
