import { DropDown, Flyout, Toast, AnimatedLoaders, TextArea } from 'konnect-react-components';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { createPrimaryRole, editPrimaryRole } from '../../../services/users';
import {
    AppDispatch,
    fetchUserPrimaryRole,
    fetchUserSecondaryRole,
    fetchApplicationPermissionsForRole,
    fetchFunctionSubFunctionLocationRole,
    RootState,
} from '../../../store';
import { resetSubFunctions } from '../../../store/slice/roleFunctionsSlice';
import { ROLE_TYPE } from '../../../utils/constants';
import {
    convertOptions,
    getLastAvailableChild,
    logError,
    transformResponseToLocationOptions,
} from '../../../utils/helpers';
import styles from './RoleSelectionPopup.module.scss';
import {
    LocationHierarchy,
    RoleSelectionPopupType,
    TreeDropDownOptionType,
} from '../../../types/common';
import ViewPermissionsTable from './ViewPermissionsTable';
import { TextButton } from '../../atoms';
import { isEqual } from 'lodash';
import { useIsGuestUser } from '../../../utils/customHooks';

interface IFunctionSubFunctionLocationRolePayload {
    functionId: number;
    subFunctionId: number;
    geographyId: number;
    roleId: number;
    triggerType: string;
}

function RoleSelectionPopup({
    isOpen,
    isPrimaryRoleAdded,
    onCancelClick,
    isAddingSecondaryRole,
}: Readonly<RoleSelectionPopupType>) {
    const dispatch = useDispatch<AppDispatch>();
    const [functionDD, setFunctionDD] = useState<Record<string, string | number>>({});
    const [subFunctionDD, setSubFunctionDD] = useState<Record<string, string | number>>({});
    const [locationDD, setLocationDD] = useState<Record<string, string | number>>({});
    const [roleDD, setRoleDD] = useState<Record<string, string | number>>({});
    const [isReset, setIsReset] = useState<Record<string, boolean>>({
        functions: false,
        subFunctions: false,
        locations: false,
        locationRoles: false,
    });
    const [toggleToast, setToggleToast] = useState<boolean>(false);
    const [toggleErrorToast, setToggleErrorToast] = useState<boolean>(false);
    const [loading, setLoading] = useState<boolean>(false);
    const [toggleViewPermissionsTable, setToggleViewPermissionsTable] = useState(false);
    const [requestComment, setRequestComment] = useState<string>('');
    const flyoutRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        dispatch(fetchFunctionSubFunctionLocationRole({}));
    }, []);

    const primaryRoleDetails = useSelector((state: RootState) => state.primaryRole.data);
    const appPermissionsByRoleId = useSelector(
        (state: RootState) => state.rolePermissions.applicationsData,
    );
    const isAppPermissionsByRoleIdLoading = useSelector(
        (state: RootState) => state.rolePermissions.isLoading,
    );
    const functionsSubFunctionsLocationsRoles = useSelector(
        (state: RootState) => state.roleFunctions.functionSubFunctionLocationRoleData,
    );
    const isFunctionsSubFuntionsLocationsRolesLoading = useSelector(
        (state: RootState) => state.roleFunctions.isLoading,
    );
    const { functions, subFunctions, locations, roles } = functionsSubFunctionsLocationsRoles;

    const isGuestUser = useIsGuestUser();

    // sets value of role drop down if editing primary role only
    useEffect(() => {
        if (
            isOpen &&
            isPrimaryRoleAdded &&
            !isAddingSecondaryRole &&
            primaryRoleDetails &&
            !isGuestUser
        ) {
            setRoleDD({
                label: String(primaryRoleDetails.role),
                value: String(primaryRoleDetails.roleId),
            });
        }
    }, [primaryRoleDetails, isOpen]);

    const onClose = (isActionTypeClose = true) => {
        setIsReset({
            functions: true,
            subFunctions: true,
            locations: true,
            locationRoles: true,
        });
        setFunctionDD({});
        setSubFunctionDD({});
        setLocationDD({});
        setRoleDD({});
        setRequestComment('');
        dispatch(resetSubFunctions());
        if (isActionTypeClose) {
            onCancelClick();
        }
        dispatch(fetchFunctionSubFunctionLocationRole({}));
    };

    const onRequestBtnClick = useCallback(async () => {
        try {
            const locationHeirarchy: any = findHierarchy(
                getLocationOptionsConversion() as TreeDropDownOptionType[],
                locationDD.value as string,
            );

            setLoading(true);

            const roleData = {
                functionId: Number(functionDD.value),
                subFunctionId: Number(subFunctionDD.value),
                regionId: Number(locationHeirarchy?.regionId) || 0,
                clusterId: Number(locationHeirarchy?.clusterId) || 0,
                marketId: Number(locationHeirarchy?.marketId) || 0,
                siteId: Number(locationHeirarchy?.siteId) || 0,
                roleId: Number(roleDD.value),
                roleType: isAddingSecondaryRole ? ROLE_TYPE.SECONDARY : ROLE_TYPE.PRIMARY,
                RequestComment: requestComment?.trim() || undefined,
            };

            if (isPrimaryRoleAdded && !isAddingSecondaryRole) {
                await editPrimaryRole(roleData);
            } else {
                await createPrimaryRole(roleData);
            }

            onClose();
            setToggleToast(true);

            if (isAddingSecondaryRole) {
                dispatch(fetchUserSecondaryRole({ roleType: ROLE_TYPE.SECONDARY }));
            } else {
                dispatch(fetchUserPrimaryRole({ roleType: ROLE_TYPE.PRIMARY }));
            }
        } catch (error) {
            logError('RoleSelectionPopup - onRequestBtnClick - Error', error);
            setToggleErrorToast(true);
        } finally {
            setLoading(false);
        }
    }, [functionDD, subFunctionDD, roleDD, locationDD, isPrimaryRoleAdded, requestComment]);

    const isResetButtonDisabled = () => {
        if (
            Object.keys(functionDD).length > 0 ||
            Object.keys(subFunctionDD).length > 0 ||
            Object.keys(locationDD).length > 0 ||
            Object.keys(roleDD).length > 0
        ) {
            return false;
        } else {
            return true;
        }
    };

    const getPrimaryRoleFunctions = useCallback(() => {
        const convertedData = convertOptions(functions as any, 'functionName', 'functionId');
        return convertedData;
    }, [functions]);

    const getPrimaryRoleSubFunctions = useCallback(() => {
        const convertedData = convertOptions(
            subFunctions as any,
            'subFunctionName',
            'subFunctionId',
        );
        return convertedData;
    }, [subFunctions]);

    const getPrimaryLocationRoles = useCallback(() => {
        const filteredRoles =
            isAddingSecondaryRole && isPrimaryRoleAdded
                ? roles.filter(role => role.roleId !== primaryRoleDetails.roleId)
                : roles;
        const uniqueRolesMap = new Map<number, (typeof roles)[0]>();

        filteredRoles.forEach(role => {
            if (!uniqueRolesMap.has(role.roleId)) {
                uniqueRolesMap.set(role.roleId, role);
            }
        });

        return Array.from(uniqueRolesMap.values()).map(role => {
            return {
                label: `${role.roleLevelName} - ${role.role ?? ''}`,
                value: role.roleId.toString(),
                desc: `${role.geographyName}  ${role.subFunctionName}  ${role.departmentName}`,
            };
        });
    }, [[roles, isAddingSecondaryRole, isPrimaryRoleAdded, primaryRoleDetails]]);
    const getRoleNomecleture = useCallback(() => {
        const filteredRoles =
            isAddingSecondaryRole && isPrimaryRoleAdded
                ? roles.filter(role => role.roleId !== primaryRoleDetails.roleId)
                : roles;

        const uniqueRolesMap = new Map<number, (typeof roles)[0]>();

        filteredRoles.forEach(role => {
            if (role && !uniqueRolesMap.has(role.roleId)) {
                uniqueRolesMap.set(role.roleId, role);
            }
        });

        const roleStrings = Array.from(uniqueRolesMap.values()).map(role => {
            return `${role.subFunctionName} ${role.departmentName}`;
        });

        return roleStrings;
    }, [roles, isAddingSecondaryRole, isPrimaryRoleAdded, primaryRoleDetails]);

    const onChangeHandlerForFunctionDropdown = (functionId: number) => {
        getFunctionSubFunctionLocationRole({
            functionId,
            subFunctionId: Number(subFunctionDD.value),
            geographyId: Number(locationDD.value),
            roleId: Number(roleDD.value),
            triggerType: 'Function',
        });
    };

    const onChangeHandlerForSubFunctionDropdown = (subFunctionId: number) => {
        getFunctionSubFunctionLocationRole({
            functionId: Number(functionDD.value),
            subFunctionId,
            geographyId: Number(locationDD.value),
            roleId: Number(roleDD.value),
            triggerType: 'SubFunction',
        });
    };

    const onChangeHandlerForLocationDropdown = (geographyId: number) => {
        getFunctionSubFunctionLocationRole({
            functionId: Number(functionDD.value),
            subFunctionId: Number(subFunctionDD.value),
            geographyId,
            roleId: undefined,
            triggerType: 'Location',
        });
    };

    const onChangeHandlerForRoleDropdown = (roleId: number) => {
        getFunctionSubFunctionLocationRole({
            functionId: Number(functionDD.value),
            subFunctionId: Number(subFunctionDD.value),
            geographyId: Number(locationDD.value),
            roleId,
            triggerType: 'Role',
        });
    };

    const getFunctionSubFunctionLocationRole = ({
        functionId,
        subFunctionId,
        geographyId,
        roleId,
        triggerType,
    }: Partial<IFunctionSubFunctionLocationRolePayload>) => {
        const payload = {} as IFunctionSubFunctionLocationRolePayload;
        if (triggerType) payload['triggerType'] = triggerType;
        if (functionId) {
            payload['functionId'] = functionId;
        }
        if (subFunctionId) {
            payload['subFunctionId'] = subFunctionId;
        }
        if (geographyId) {
            payload['geographyId'] = geographyId;
        }
        if (roleId) {
            payload['roleId'] = roleId;
        }
        dispatch(fetchFunctionSubFunctionLocationRole(payload));
    };
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

    const getNormalizedLocation = () => {
        const hierarchy = findHierarchy(
            getLocationOptionsConversion() as TreeDropDownOptionType[],
            locationDD.value as string,
        );

        return {
            regionId: String(hierarchy?.regionId ?? ''),
            clusterId: String(hierarchy?.clusterId ?? ''),
            marketId: String(hierarchy?.marketId ?? ''),
            siteId: String(hierarchy?.siteId ?? ''),
        };
    };

    const getOldNormalizedLocation = () => ({
        regionId: String(primaryRoleDetails.regionId ?? ''),
        clusterId: String(primaryRoleDetails.clusterId ?? ''),
        marketId: String(primaryRoleDetails.marketId ?? ''),
        siteId: String(primaryRoleDetails.siteId ?? ''),
    });

    const getDisabled = useMemo(() => {
        if (
            Object.keys(functionDD).length > 0 &&
            Object.keys(subFunctionDD).length > 0 &&
            Object.keys(locationDD).length > 0 &&
            Object.keys(roleDD).length > 0
        ) {
            //compare and check if anything changed while editing primary role. if changed then only enable button
            if (!isAddingSecondaryRole && isPrimaryRoleAdded) {
                const newRoleDetails = {
                    roleId: String(roleDD.value),
                    functionId: String(functionDD.value),
                    subFunId: String(subFunctionDD.value),
                    location: getNormalizedLocation(),
                };

                const oldRoleDetails = {
                    roleId: String(primaryRoleDetails.roleId),
                    functionId: String(primaryRoleDetails.functionId),
                    subFunId: String(primaryRoleDetails.subFunctionId),
                    location: getOldNormalizedLocation(),
                };

                const isSame = isEqual(newRoleDetails, oldRoleDetails);
                if (isSame) {
                    return true;
                }
            }
            if (!requestComment?.trim()) {
                return true;
            }
            return false;
        } else {
            return true;
        }
    }, [functionDD, subFunctionDD, locationDD, roleDD, requestComment]);

    useEffect(() => {
        if (isOpen && (isPrimaryRoleAdded || isAddingSecondaryRole)) {
            setIsReset({
                functions: false,
                subFunctions: false,
                locations: false,
                locationRoles: false,
            });
            const locationOptions = transformResponseToLocationOptions(primaryRoleDetails);
            const selectedLocation = getLastAvailableChild(locationOptions);

            setFunctionDD({
                label: primaryRoleDetails.function,
                value: String(primaryRoleDetails.functionId),
            });

            setSubFunctionDD({
                label: String(primaryRoleDetails.subFunction),
                value: String(primaryRoleDetails.subFunctionId),
            });

            setLocationDD(selectedLocation);

            dispatch(
                fetchFunctionSubFunctionLocationRole({
                    functionId: primaryRoleDetails.functionId,
                    subFunctionId: primaryRoleDetails.subFunctionId,
                    geographyId: Number(selectedLocation?.value),
                    locationLabel: selectedLocation.label,
                }),
            );
        }
    }, [isOpen, isPrimaryRoleAdded, isAddingSecondaryRole, primaryRoleDetails]);

    function findHierarchy(
        data: TreeDropDownOptionType[],
        targetValue: string,
    ): LocationHierarchy | null {
        function traverseTree(
            node: TreeDropDownOptionType,
            path: LocationHierarchy,
        ): LocationHierarchy | null {
            const currentPath: LocationHierarchy = { ...path };
            switch (node.typeId) {
                case '1':
                    currentPath.regionId = node.value;
                    break;
                case '2':
                    currentPath.clusterId = node.value;
                    break;
                case '3':
                    currentPath.marketId = node.value;
                    break;
                case '4':
                    currentPath.siteId = node.value;
                    break;
            }

            if (node.value === targetValue) {
                return currentPath;
            }

            if (node.subOption && node.subOption.length > 0) {
                for (const child of node.subOption) {
                    const result = traverseTree(child, currentPath);
                    if (result) return result;
                }
            }

            return null;
        }

        for (const region of data) {
            const result = traverseTree(region, {});
            if (result) return result;
        }

        return null;
    }

    // This use effect is to fetch application permissions for selected role from the dropdown.
    useEffect(() => {
        if (!roleDD?.value) {
            setToggleViewPermissionsTable(false);
            return;
        }
        dispatch(fetchApplicationPermissionsForRole({ roleId: Number(roleDD.value) }));
    }, [roleDD]);

    const loaderComponent = useMemo(() => {
        return isFunctionsSubFuntionsLocationsRolesLoading ? (
            <div className={styles['overlay']}>
                <AnimatedLoaders id="lazy-loader" type="page" />
            </div>
        ) : null;
    }, [isFunctionsSubFuntionsLocationsRolesLoading]);

    const popupBody = useCallback(() => {
        return (
            <>
                {loaderComponent}
                <div
                    className={
                        isFunctionsSubFuntionsLocationsRolesLoading
                            ? styles['content-disabled']
                            : styles.container
                    }
                >
                    <DropDown
                        id="role-selection-popup-dropdown-one"
                        dropdown={{
                            label: 'What function are you a part of?',
                            options: getPrimaryRoleFunctions(),
                            reset: isReset.functions,
                            placeholder: 'Select',
                            onChange: (option: any, _) => {
                                setFunctionDD(option);
                                onChangeHandlerForFunctionDropdown(Number(option.value));
                            },
                            selectedOptions:
                                functionDD?.value && functionDD.label
                                    ? [
                                          {
                                              label: String(functionDD.label),
                                              value: String(functionDD.value),
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

                    <div className={styles['space-v-16']} />
                    <DropDown
                        id="role-selection-popup-dropdown-two"
                        dropdown={{
                            label: 'What sub-function are you a part of?',
                            options: getPrimaryRoleSubFunctions(),
                            reset: isReset.subFunctions,
                            placeholder: 'Select',
                            onChange: (option: any, _) => {
                                setSubFunctionDD(option);
                                onChangeHandlerForSubFunctionDropdown(Number(option.value));
                            },
                            selectedOptions:
                                subFunctionDD?.value && subFunctionDD.label
                                    ? [
                                          {
                                              label: String(subFunctionDD.label),
                                              value: String(subFunctionDD.value),
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
                    <div className={styles['space-v-16']} />
                    <DropDown
                        id="role-selection-popup-dropdown-three"
                        key={isReset.locations ? 'reset' : 'normal'}
                        dropdown={{
                            isDisabled: false,
                            label: 'What location are you based in?',
                            reset: isReset.locations,
                            onChange: (option: any) => {
                                setLocationDD(option);
                                setRoleDD({});
                                onChangeHandlerForLocationDropdown(Number(option.value));
                            },
                            options: getLocationOptionsConversion() as TreeDropDownOptionType[],
                            placeholder: 'Select',
                            size: 'L',
                            type: 'tree',
                            selectedOptions:
                                locationDD?.value && locationDD.label
                                    ? [
                                          {
                                              label: String(locationDD.label),
                                              value: String(locationDD.value),
                                          },
                                      ]
                                    : [],
                        }}
                        searchInput={{
                            searchPlaceholder: 'Search',
                            searchSize: 'S',
                            searchWholeString: true,
                        }}
                    />
                    <div className={styles['space-v-16']} />
                    {Object.keys(locationDD).length > 0 && (
                        <DropDown
                            id="role-selection-popup-dropdown-four"
                            dropdown={{
                                label: 'Select Role',
                                options: getPrimaryLocationRoles(),
                                reset: isReset.locationRoles,
                                placeholder: 'Select',
                                onChange: (option: any, _) => {
                                    setRoleDD(option);
                                    onChangeHandlerForRoleDropdown(Number(option.value));
                                },
                                captionIcon: 'info-circle',
                                captionMessageType: 'default',
                                selectedOptions: roleDD.value
                                    ? [{ label: String(roleDD.label), value: String(roleDD.value) }]
                                    : [],
                                showDescription: true,
                                showRadio: false,
                            }}
                            searchInput={{
                                searchPlaceholder: 'Search',
                                searchSize: 'L',
                                searchWholeString: true,
                            }}
                        />
                    )}
                    <div className={styles['space-v-16']} />
                    <TextArea
                        label="Please provide a brief reason for requesting this role "
                        placeholder="Enter here"
                        value={requestComment}
                        onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) =>
                            setRequestComment(e.target.value)
                        }
                        required={true}
                        maxCharacters={500}
                        customheight={40}
                    />

                    {/* View permissions table section */}
                    {roleDD.value && (
                        <div className={styles['view-permissions-container']}>
                            <TextButton
                                onClick={() => {
                                    setToggleViewPermissionsTable(!toggleViewPermissionsTable);
                                }}
                            >
                                <span className={styles['view-permissions-typography']}>
                                    {`${toggleViewPermissionsTable ? `Hide` : `View`} Permissions`}
                                </span>
                            </TextButton>
                        </div>
                    )}
                    {toggleViewPermissionsTable && (
                        <ViewPermissionsTable
                            appPermissionsByRoleId={appPermissionsByRoleId}
                            selectedRoleDetails={{
                                roleName: String(roleDD.label),
                                roleId: Number(roleDD.value),
                                roleRegion: String(locationDD.label),
                                getRoleNomenclature: String(getRoleNomecleture()),
                            }}
                            isAppPermissionsByRoleIdLoading={isAppPermissionsByRoleIdLoading}
                        />
                    )}
                </div>
            </>
        );
    }, [
        locationDD,
        getPrimaryRoleFunctions,
        getPrimaryRoleSubFunctions,
        getPrimaryLocationRoles,
        getLocationOptionsConversion,
        subFunctionDD,
        isReset,
        toggleViewPermissionsTable,
        appPermissionsByRoleId,
        isAppPermissionsByRoleIdLoading,
    ]);

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (flyoutRef.current && !flyoutRef.current.contains(event.target as Node)) {
                onClose();
            }
        };

        if (isOpen) {
            document.addEventListener('mousedown', handleClickOutside);
        }

        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
        };
    }, [isOpen]);

    const onClickOutsideFlyoutContainer = () => {
        if (isOpen) {
            onClose();
        }
    };

    useEffect(() => {
        const flyoutWrapper = document.getElementById('role-selection-flyout');
        if (!flyoutWrapper) return;

        const handleClick = (event: MouseEvent) => {
            const target = event.target as HTMLElement;

            if (target.closest('[class^="flyout-container"]')) return;

            onClickOutsideFlyoutContainer();
        };

        flyoutWrapper.addEventListener('click', handleClick);
        return () => flyoutWrapper.removeEventListener('click', handleClick);
    }, [onClickOutsideFlyoutContainer]);

    return (
        <div className={styles['outer-container']}>
            <Flyout
                containerMaxWidth="616px"
                heading={
                    isAddingSecondaryRole
                        ? 'Add Secondary Role'
                        : isPrimaryRoleAdded
                          ? 'Edit Primary Role'
                          : 'Add Primary Role'
                }
                flyoutOpen={isOpen}
                direction="right"
                subHeading={
                    isAddingSecondaryRole
                        ? 'You can add a new role from here. Primary role details are entered by default.' +
                          ' Change the selected role to request access for it'
                        : isPrimaryRoleAdded
                          ? 'You can edit your primary role from here.'
                          : 'You can add a new role from here.'
                }
                cancelIconClick={onClose}
                cancelBtnProps={{ text: 'Cancel', onClick: onClose, variant: 'Subtle' }}
                primaryBtnProps={{
                    text: 'Request Access',
                    onClick: onRequestBtnClick,
                    disabled: getDisabled,
                    loading: loading,
                }}
                secondaryBtnProps={{
                    text: 'Reset',
                    onClick: () => {
                        onClose(false);
                    },
                    disabled: isResetButtonDisabled(),
                    variant: 'Secondary',
                }}
                content={popupBody()}
                id="role-selection-flyout"
                iconForCancel={{
                    icon: 'x-close',
                    onClick: () => {
                        onClose();
                    },
                }}
                // onBackDropClick={() => onClose()}
            />
            <Toast
                type="Success"
                message="Role Request Sent"
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
        </div>
    );
}

export default RoleSelectionPopup;
