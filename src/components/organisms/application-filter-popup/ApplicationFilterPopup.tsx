import { DropDown, Flyout, Toast, AnimatedLoaders } from 'konnect-react-components';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import {
    AppDispatch,
    fetchApplications,
    fetchAppRoleAndFunctions,
    fetchRoleAppsAndFunctions,
    fetchRoleFunctions,
    fetchRoleLocations,
    fetchRoles,
    fetchTools,
    RootState,
} from '../../../store';
import { resetSubFunctions } from '../../../store/slice/roleFunctionsSlice';
import styles from './ApplicationFilterPopup.module.scss';
import { convertOptions, logError, logWarning } from '../../../utils/helpers';
import type {
    ApplicationFilterPopupType,
    OptionType,
    TreeDropDownOptionType,
} from '../../../types/common';
import type {
    IClustersData,
    ILocationsData,
    IMarketsData,
    ISitesData,
} from '../../../types/response';
import type { IToolFunctionLocationRoleFiltersPayload } from '../../../types/request';

function ApplicationFilterPopup({
    isOpen,
    onCancelClick,
    setFilters,
    filters,
}: Readonly<ApplicationFilterPopupType>) {
    const dispatch = useDispatch<AppDispatch>();

    const filtersDataByTool = useSelector((state: RootState) => state.roleFunctions.appDetailsData);
    const {
        functions: functionsByTool,
        locations: locationsByTool,
        roles: rolesByTool,
        toolTypes: toolTypesByTool,
        tools: toolsByTool,
    } = filtersDataByTool;

    const filtersDataByRole = useSelector(
        (state: RootState) => state.roleFunctions.roleDetailsData,
    );
    const {
        functions: functionsByRole,
        locations: locationsByRole,
        roles: rolesByRole,
        toolTypes: toolTypesByRole,
        tools: toolsByRole,
    } = filtersDataByRole;

    const isFiltersDataLoading = useSelector((state: RootState) => state.roleFunctions.isLoading);

    const [toolTypeDD, setToolTypeDD] = useState<{ label: string; value: number }[]>([]);
    const [applicationDD, setApplicationDD] = useState<{ label: string; value: number }[]>([]);
    const [applicationFunctionDD, setApplicationFunctionDD] = useState<
        { label: string; value: number }[]
    >([]);
    const [applicationLocationDD, setApplicationLocationDD] = useState<
        Record<string, (string | number)[]>
    >({});
    const [applicationRolesDD, setApplicationRolesDD] = useState<
        { label: string; value: number }[]
    >([]);

    const [rolesDD, setRolesDD] = useState<{ label: string; value: number }[]>([]);
    const [rolesFunctionDD, setRolesFunctionDD] = useState<{ label: string; value: number }[]>([]);
    const [rolesLocationDD, setRolesLocationDD] = useState<Record<string, (string | number)[]>>({});
    const [rolesApplicationDD, setRolesApplicationDD] = useState<
        { label: string; value: number }[]
    >([]);

    const [toggleToast, setToggleToast] = useState<boolean>(false);
    const [toggleErrorToast, setToggleErrorToast] = useState<boolean>(false);
    const [loading, setLoading] = useState<boolean>(false);
    const [resetKey, setResetKey] = useState(0);
    const [isReset, setIsReset] = useState<
        Partial<{
            toolType: boolean;
            application: boolean;
            applicationFunction: boolean;
            applicationLocation: boolean;
            applicationRoles: boolean;
            roles: boolean;
            rolesFunction: boolean;
            rolesLocation: boolean;
            rolesApplication: boolean;
        }>
    >({
        toolType: false,
        application: false,
        applicationFunction: false,
        applicationLocation: false,
        applicationRoles: false,
        roles: false,
        rolesFunction: false,
        rolesLocation: false,
        rolesApplication: false,
    });

    useEffect(() => {
        updateDropdownState(filters);
    }, [filters, isOpen]);

    useEffect(() => {
        getToolFunctionLocationRoleForByToolFilters({});
        getToolFunctionLocationRoleForByRoleFilters({});
    }, []);

    useMemo(() => {
        dispatch(fetchRoleFunctions());
        dispatch(fetchRoleLocations());
        dispatch(fetchApplications());
        dispatch(fetchRoles());
        dispatch(fetchTools());
    }, []);

    const checkIfFiltersArePreSelected = () => {
        return Object.entries(filters).some(([, value]) => {
            if (value.length > 0) {
                return true;
            } else {
                return false;
            }
        });
    };

    const updateDropdownState = (filters: Record<string, any>) => {
        const doesFiltersExist = checkIfFiltersArePreSelected();
        if (!doesFiltersExist) return;

        const payloadForByTools: any = {};
        const payloadForByRoles: any = {};

        Object.entries(filters).forEach(([key, value]) => {
            switch (key) {
                // By TOOLS
                case 'toolTypeId':
                    setToolTypeDD(value);
                    payloadForByTools['toolTypeId'] = value;
                    break;
                case 'toolDD':
                    setApplicationDD(value);
                    payloadForByTools['toolDD'] = value;
                    break;
                case 'toolFunctionDD':
                    setApplicationFunctionDD(value);
                    payloadForByTools['toolFunctionDD'] = value;
                    break;
                case 'toolLocationDD': {
                    const applicationLocationPair = value.reduce(
                        (
                            acc: Record<string, (string | number)[]>,
                            item: { label: string; value: number },
                        ) => {
                            acc[item.label] = [item.value];
                            return acc;
                        },
                        {} as Record<string, (string | number)[]>,
                    );
                    setApplicationLocationDD(applicationLocationPair);
                    payloadForByTools['toolLocationDD'] = value;
                    break;
                }
                case 'toolRolesDD':
                    setApplicationRolesDD(value);
                    payloadForByTools['toolRolesDD'] = value;
                    break;
                // By ROLES
                case 'rolesDD':
                    setRolesDD(value);
                    payloadForByRoles['rolesDD'] = value;
                    break;
                case 'rolesFunctionDD':
                    setRolesFunctionDD(value);
                    payloadForByRoles['rolesFunctionDD'] = value;
                    break;
                case 'rolesLocationDD': {
                    const roleLocationPair = value.reduce(
                        (
                            acc: Record<string, (string | number)[]>,
                            item: { label: string; value: number },
                        ) => {
                            acc[item.label] = [item.value];
                            return acc;
                        },
                        {} as Record<string, (string | number)[]>,
                    );
                    setRolesLocationDD(roleLocationPair);
                    payloadForByRoles['rolesLocationDD'] = value;
                    break;
                }
                case 'rolesToolDD':
                    setRolesApplicationDD(value);
                    payloadForByRoles['rolesToolDD'] = value;
                    break;

                default:
                    logWarning(`Unhandled filter key: ${key}`);
            }
        });
        fetchDataForPreSelectedFilters(payloadForByTools, payloadForByRoles);
    };

    const fetchDataForPreSelectedFilters = (payloadForByTools: any, payloadForByRoles: any) => {
        const byToolsPayload = {
            toolTypeIds: preparePayloadForFilters(payloadForByTools.toolTypeId),
            toolIds: preparePayloadForFilters(payloadForByTools.toolDD),
            functionIds: preparePayloadForFilters(payloadForByTools.toolFunctionDD),
            geographyIds: preparePayloadForLocationFilters(payloadForByTools.toolLocationDD),
            roleIds: preparePayloadForFilters(payloadForByTools.toolRolesDD),
        };
        getToolFunctionLocationRoleForByToolFilters(byToolsPayload);

        const byRolesPayload = {
            roleIds: preparePayloadForFilters(payloadForByRoles.rolesDD),
            functionIds: preparePayloadForFilters(payloadForByRoles.rolesFunctionDD),
            geographyIds: preparePayloadForLocationFilters(payloadForByRoles.rolesLocationDD),
            toolIds: preparePayloadForFilters(payloadForByRoles.rolesToolDD),
        };
        getToolFunctionLocationRoleForByRoleFilters(byRolesPayload);
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

    // TODO - Keep this for sometime.
    // const getRoleLocationOptionsConversion = useCallback(
    //     (locations: ILocationsData[], selectedLocationId?: number, typeId?: number) => {
    //         if (!locations?.length) {
    //             return;
    //         }
    //         const convertedLocations: TreeDropDownOptionType[] = [];
    //         let selectedHeirarchy = {};
    //         locations.forEach((layer1, index) => {
    //             pushConvertedData(
    //                 layer1.regionName,
    //                 layer1.regionId,
    //                 layer1.geographyTypeId,
    //                 convertedLocations,
    //             );
    //             if (
    //                 !!selectedLocationId &&
    //                 layer1.regionId == selectedLocationId &&
    //                 layer1.geographyTypeId == typeId
    //             ) {
    //                 selectedHeirarchy = {
    //                     value: layer1.regionId,
    //                     label: layer1.regionName,
    //                 };
    //             }
    //             if (layer1.hasOwnProperty('clusters') && layer1?.clusters?.length > 0) {
    //                 layer1.clusters.forEach((layer2: any, index1: number) => {
    //                     pushConvertedData(
    //                         layer2.clusterName,
    //                         layer2.clusterId,
    //                         layer2.geographyTypeId,
    //                         convertedLocations[index]?.['subOption'],
    //                     );
    //                     if (
    //                         !!selectedLocationId &&
    //                         layer2.clusterId == selectedLocationId &&
    //                         layer2.geographyTypeId == typeId
    //                     ) {
    //                         selectedHeirarchy = {
    //                             value: layer1.regionId,
    //                             label: layer1.regionName,
    //                             subOption: {
    //                                 value: layer2.clusterId,
    //                                 label: layer2.clusterName,
    //                             },
    //                         };
    //                     }
    //                     if (layer2.hasOwnProperty('markets') && layer2?.markets?.length > 0) {
    //                         layer2.markets.forEach((layer3: any, index2: number) => {
    //                             pushConvertedData(
    //                                 layer3.marketName,
    //                                 layer3.marketId,
    //                                 layer3.geographyTypeId,
    //                                 convertedLocations?.[index]?.['subOption']?.[index1]?.[
    //                                     'subOption'
    //                                 ],
    //                             );
    //                             if (
    //                                 !!selectedLocationId &&
    //                                 layer3.marketId == selectedLocationId &&
    //                                 layer3.geographyTypeId == typeId
    //                             ) {
    //                                 selectedHeirarchy = {
    //                                     value: layer1.regionId,
    //                                     label: layer1.regionName,
    //                                     subOption: {
    //                                         value: layer2.clusterId,
    //                                         label: layer2.clusterName,
    //                                         subOption: {
    //                                             value: layer3.marketId,
    //                                             label: layer3.marketName,
    //                                         },
    //                                     },
    //                                 };
    //                             }
    //                             if (layer3.hasOwnProperty('sites') && layer3?.sites?.length > 0) {
    //                                 layer3.sites.forEach((layer4: any) => {
    //                                     pushConvertedData(
    //                                         layer4.siteName,
    //                                         layer4.siteId,
    //                                         layer4.geographyTypeId,
    //                                         convertedLocations?.[index]?.['subOption']?.[index1]?.[
    //                                             'subOption'
    //                                         ]?.[index2]?.['subOption'],
    //                                     );
    //                                     if (
    //                                         !!selectedLocationId &&
    //                                         layer4.siteId == selectedLocationId
    //                                     ) {
    //                                         selectedHeirarchy = {
    //                                             value: layer1.regionId,
    //                                             label: layer1.regionName,
    //                                             subOption: {
    //                                                 value: layer2.clusterId,
    //                                                 label: layer2.clusterName,
    //                                                 subOption: {
    //                                                     value: layer3.marketId,
    //                                                     label: layer3.marketName,
    //                                                     subOption: {
    //                                                         value: layer4.siteId,
    //                                                         label: layer4.siteName,
    //                                                     },
    //                                                 },
    //                                             },
    //                                         };
    //                                     }
    //                                 });
    //                             }
    //                         });
    //                     }
    //                 });
    //             }
    //         });
    //         return selectedLocationId ? selectedHeirarchy : convertedLocations;
    //     },
    //     [locationsByTool],
    // );

    const getRoleLocationOptionsConversionPMF = useCallback(
        (
            source: any[],
            selectedLocationId?: number,
            typeId?: number,
        ): TreeDropDownOptionType[] | {} => {
            if (!source?.length) {
                return [];
            }

            const convertedLocations: TreeDropDownOptionType[] = [];
            let selectedHierarchy = {};

            source.forEach((region: ILocationsData) => {
                pushConvertedData(
                    region.regionName,
                    region.regionId,
                    region.geographyTypeId,
                    convertedLocations,
                );
                const regionIndex = convertedLocations.length - 1;
                const regionRef = convertedLocations[regionIndex];

                if (!regionRef) return;

                if (
                    selectedLocationId &&
                    region.regionId === selectedLocationId &&
                    region.geographyTypeId === typeId
                ) {
                    selectedHierarchy = { value: region.regionId, label: region.regionName };
                }

                if (region.clusters?.length) {
                    regionRef.subOption = regionRef.subOption ?? [];

                    region.clusters.forEach((cluster: IClustersData) => {
                        regionRef.subOption = regionRef.subOption ?? [];

                        pushConvertedData(
                            cluster.clusterName,
                            cluster.clusterId,
                            cluster.geographyTypeId,
                            regionRef.subOption,
                        );
                        const clusterIndex = regionRef.subOption.length - 1;
                        const clusterRef = regionRef.subOption[clusterIndex];

                        if (!clusterRef) return;

                        if (
                            selectedLocationId &&
                            cluster.clusterId === selectedLocationId &&
                            cluster.geographyTypeId === typeId
                        ) {
                            selectedHierarchy = {
                                value: region.regionId,
                                label: region.regionName,
                                subOption: { value: cluster.clusterId, label: cluster.clusterName },
                            };
                        }

                        if (cluster.markets?.length) {
                            clusterRef.subOption = clusterRef.subOption ?? [];

                            cluster.markets.forEach((market: IMarketsData) => {
                                clusterRef.subOption = clusterRef.subOption ?? [];

                                pushConvertedData(
                                    market.marketName,
                                    market.marketId,
                                    market.geographyTypeId,
                                    clusterRef.subOption,
                                );
                                const marketIndex = clusterRef.subOption.length - 1;
                                const marketRef = clusterRef.subOption[marketIndex];

                                if (!marketRef) return;

                                if (
                                    selectedLocationId &&
                                    market.marketId === selectedLocationId &&
                                    market.geographyTypeId === typeId
                                ) {
                                    selectedHierarchy = {
                                        value: region.regionId,
                                        label: region.regionName,
                                        subOption: {
                                            value: cluster.clusterId,
                                            label: cluster.clusterName,
                                            subOption: {
                                                value: market.marketId,
                                                label: market.marketName,
                                            },
                                        },
                                    };
                                }

                                if (market.sites?.length) {
                                    marketRef.subOption = marketRef.subOption ?? [];

                                    market.sites.forEach((site: ISitesData) => {
                                        pushConvertedData(
                                            site.siteName,
                                            site.siteId,
                                            site.geographyTypeId,
                                            marketRef.subOption,
                                        );

                                        if (
                                            selectedLocationId &&
                                            site.siteId === selectedLocationId
                                        ) {
                                            selectedHierarchy = {
                                                value: region.regionId,
                                                label: region.regionName,
                                                subOption: {
                                                    value: cluster.clusterId,
                                                    label: cluster.clusterName,
                                                    subOption: {
                                                        value: market.marketId,
                                                        label: market.marketName,
                                                        subOption: {
                                                            value: site.siteId,
                                                            label: site.siteName,
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

            return selectedLocationId ? selectedHierarchy : convertedLocations;
        },
        [],
    );

    const resetState = (isResetManual = false) => {
        setToolTypeDD([]);
        setApplicationDD([]);
        setApplicationFunctionDD([]);
        setApplicationLocationDD({});
        setApplicationRolesDD([]);

        setRolesDD([]);
        setRolesFunctionDD([]);
        setRolesLocationDD({});
        setRolesApplicationDD([]);

        setIsReset({
            toolType: true,
            application: true,
            applicationFunction: true,
            applicationLocation: true,
            applicationRoles: true,
            roles: true,
            rolesFunction: true,
            rolesLocation: true,
            rolesApplication: true,
        });
        setResetKey(prevKey => prevKey + 1);

        dispatch(resetSubFunctions());
        const doesFiltersExist = checkIfFiltersArePreSelected();
        if (doesFiltersExist && !isResetManual) return;

        getToolFunctionLocationRoleForByToolFilters({});
        getToolFunctionLocationRoleForByRoleFilters({});
    };

    const onClose = () => {
        resetState();
        onCancelClick();
    };

    const onResetButtonClick = () => {
        resetState(true);
    };

    const onRequestBtnClick = useCallback(async () => {
        try {
            setLoading(true);

            const parseValues = (arr: { label: string; value: number | string }[]) =>
                arr.map(item => ({ label: item.label, value: Number(item.value) }));

            const parseLocationValues = (obj: Record<string, (string | number)[]>) =>
                Object.entries(obj).flatMap(([key, values]) =>
                    values.map(value => ({ label: key, value: Number(value) })),
                );

            const selectedFilters = {
                toolDD: parseValues(applicationDD),
                toolFunctionDD: parseValues(applicationFunctionDD),
                toolLocationDD: parseLocationValues(applicationLocationDD),
                toolRolesDD: parseValues(applicationRolesDD),
                rolesDD: parseValues(rolesDD),
                rolesFunctionDD: parseValues(rolesFunctionDD),
                rolesLocationDD: parseLocationValues(rolesLocationDD),
                rolesToolDD: parseValues(rolesApplicationDD),
                toolTypeId: parseValues(toolTypeDD),
            };
            setFilters(selectedFilters);

            onCancelClick();
        } catch (error) {
            logError('ApplicationFilterPopup - onRequestBtnClick - Error', error);
            setToggleErrorToast(true);
        } finally {
            setLoading(false);
        }
    }, [
        applicationDD,
        applicationFunctionDD,
        applicationLocationDD,
        applicationRolesDD,
        rolesDD,
        rolesFunctionDD,
        rolesLocationDD,
        rolesApplicationDD,
        toolTypeDD,
    ]);

    const areFiltersSelectionEmpty = useMemo(() => {
        if (
            Object.keys(toolTypeDD).length > 0 ||
            Object.keys(applicationFunctionDD).length > 0 ||
            Object.keys(applicationDD).length > 0 ||
            Object.keys(applicationLocationDD).length > 0 ||
            Object.keys(applicationRolesDD).length > 0 ||
            Object.keys(rolesFunctionDD).length > 0 ||
            Object.keys(rolesDD).length > 0 ||
            Object.keys(rolesLocationDD).length > 0 ||
            Object.keys(rolesApplicationDD).length > 0
        ) {
            return false;
        } else {
            return true;
        }
    }, [
        toolTypeDD,
        applicationFunctionDD,
        applicationDD,
        applicationLocationDD,
        applicationRolesDD,
        rolesFunctionDD,
        rolesDD,
        rolesLocationDD,
        rolesApplicationDD,
    ]);

    const getDisabledStatusForDropdownApplyButton = (
        _: typeof toolTypeDD | typeof applicationLocationDD,
    ) => {
        return false;
    };

    const getDisabledStatusForApplyFiltersButton = () => {
        if (areFiltersSelectionEmpty && !checkIfFiltersArePreSelected()) {
            return true;
        } else {
            return false;
        }
    };

    const getToolFunctionLocationRoleForByToolFilters = ({
        toolTypeIds,
        toolIds,
        functionIds,
        geographyIds,
        roleIds,
    }: Partial<IToolFunctionLocationRoleFiltersPayload>) => {
        const payload = {} as IToolFunctionLocationRoleFiltersPayload;
        if (toolTypeIds) {
            payload['toolTypeIds'] = toolTypeIds;
        }
        if (toolIds) {
            payload['toolIds'] = toolIds;
        }
        if (functionIds) {
            payload['functionIds'] = functionIds;
        }
        if (geographyIds) {
            payload['geographyIds'] = geographyIds;
        }
        if (roleIds) {
            payload['roleIds'] = roleIds;
        }
        dispatch(fetchAppRoleAndFunctions(payload));
    };

    const getToolFunctionLocationRoleForByRoleFilters = ({
        toolIds,
        functionIds,
        geographyIds,
        roleIds,
    }: Partial<IToolFunctionLocationRoleFiltersPayload>) => {
        const payload = {} as IToolFunctionLocationRoleFiltersPayload;
        if (toolIds) {
            payload['toolIds'] = toolIds;
        }
        if (functionIds) {
            payload['functionIds'] = functionIds;
        }
        if (geographyIds) {
            payload['geographyIds'] = geographyIds;
        }
        if (roleIds) {
            payload['roleIds'] = roleIds;
        }
        dispatch(fetchRoleAppsAndFunctions(payload));
    };

    const getOptionsForToolTypeDropdown = (isFilterSelectionByTool = true): OptionType[] => {
        let data = [];
        if (isFilterSelectionByTool) {
            data = toolTypesByTool;
        } else {
            data = toolTypesByRole;
        }
        const convertedOptions = convertOptions(data, 'toolTypeName', 'toolTypeId');
        return convertedOptions;
    };

    const getOptionsForToolsDropdown = (isFilterSelectionByTool = true): OptionType[] => {
        let data = [];
        if (isFilterSelectionByTool) {
            data = toolsByTool;
        } else {
            data = toolsByRole;
        }
        const convertedOptions = convertOptions(data, 'toolName', 'toolId');
        return convertedOptions;
    };

    const getOptionsForFunctionsDropdown = (isFilterSelectionByTool = true): OptionType[] => {
        let data = [];
        if (isFilterSelectionByTool) {
            data = functionsByTool;
        } else {
            data = functionsByRole;
        }
        const convertedOptions = convertOptions(data, 'functionName', 'functionId');
        return convertedOptions;
    };

    const getOptionsForLocationsDropdown = (
        isFilterSelectionByTool = true,
    ): TreeDropDownOptionType[] => {
        let data = [];
        if (isFilterSelectionByTool) {
            data = locationsByTool;
        } else {
            data = locationsByRole;
        }
        const convertedOptions = getRoleLocationOptionsConversionPMF(
            data,
        ) as TreeDropDownOptionType[];
        return convertedOptions;
    };

    const getOptionsForRolesDropdown = (
        isFilterSelectionByTool = true,
    ): TreeDropDownOptionType[] => {
        let data = [];
        if (isFilterSelectionByTool) {
            data = rolesByTool;
        } else {
            data = rolesByRole;
        }
        const convertedOptions = convertOptions(data, 'role', 'roleId');
        return convertedOptions;
    };

    const preparePayloadForFilters = (data: any[]) => {
        return data.map(item => item.value).join();
    };

    const preparePayloadForLocationFilters = (data: Record<string, (string | number)[]>) => {
        return Object.values(data).flat().join();
    };

    const onChangeHandlerForToolType = (toolTypeTree: any[], isFilterSelectionByTool = true) => {
        const toolTypeIds = preparePayloadForFilters(toolTypeTree);
        const payload = {
            toolTypeIds,
            toolIds: preparePayloadForFilters(applicationDD),
            functionIds: preparePayloadForFilters(applicationFunctionDD),
            geographyIds: preparePayloadForLocationFilters(applicationLocationDD),
            roleIds: preparePayloadForFilters(applicationRolesDD),
        };
        if (isFilterSelectionByTool) {
            getToolFunctionLocationRoleForByToolFilters(payload);
        } else {
            getToolFunctionLocationRoleForByRoleFilters(payload);
        }
    };

    const onChangeHandlerForTool = (toolTree: any[], isFilterSelectionByTool = true) => {
        const toolIds = preparePayloadForFilters(toolTree);
        if (isFilterSelectionByTool) {
            const payload = {
                toolTypeIds: preparePayloadForFilters(toolTypeDD),
                toolIds,
                functionIds: preparePayloadForFilters(applicationFunctionDD),
                geographyIds: preparePayloadForLocationFilters(applicationLocationDD),
                roleIds: preparePayloadForFilters(applicationRolesDD),
            };
            getToolFunctionLocationRoleForByToolFilters(payload);
        } else {
            const payload = {
                toolIds,
                functionIds: preparePayloadForFilters(rolesFunctionDD),
                geographyIds: preparePayloadForLocationFilters(rolesLocationDD),
                roleIds: preparePayloadForFilters(rolesDD),
            };
            getToolFunctionLocationRoleForByRoleFilters(payload);
        }
    };

    const onChangeHandlerForFunction = (functionTree: any[], isFilterSelectionByTool = true) => {
        const functionIds = preparePayloadForFilters(functionTree);

        if (isFilterSelectionByTool) {
            const payload = {
                toolTypeIds: preparePayloadForFilters(toolTypeDD),
                toolIds: preparePayloadForFilters(applicationDD),
                functionIds,
                geographyIds: preparePayloadForLocationFilters(applicationLocationDD),
                roleIds: preparePayloadForFilters(applicationRolesDD),
            };
            getToolFunctionLocationRoleForByToolFilters(payload);
        } else {
            const payload = {
                toolIds: preparePayloadForFilters(rolesApplicationDD),
                functionIds,
                geographyIds: preparePayloadForLocationFilters(rolesLocationDD),
                roleIds: preparePayloadForFilters(rolesDD),
            };
            getToolFunctionLocationRoleForByRoleFilters(payload);
        }
    };

    const onChangeHandlerForLocation = (locationTree: any[], isFilterSelectionByTool = true) => {
        const geographyIds = preparePayloadForFilters(locationTree);
        if (isFilterSelectionByTool) {
            const payload = {
                toolTypeIds: preparePayloadForFilters(toolTypeDD),
                toolIds: preparePayloadForFilters(applicationDD),
                functionIds: preparePayloadForFilters(applicationFunctionDD),
                geographyIds,
                roleIds: preparePayloadForFilters(applicationRolesDD),
            };
            getToolFunctionLocationRoleForByToolFilters(payload);
        } else {
            const payload = {
                toolIds: preparePayloadForFilters(rolesApplicationDD),
                functionIds: preparePayloadForFilters(rolesFunctionDD),
                geographyIds,
                roleIds: preparePayloadForFilters(rolesDD),
            };
            getToolFunctionLocationRoleForByRoleFilters(payload);
        }
    };

    const onChangeHandlerForRole = (roleTree: any[], isFilterSelectionByTool = true) => {
        const roleIds = preparePayloadForFilters(roleTree);
        if (isFilterSelectionByTool) {
            const payload = {
                toolTypeIds: preparePayloadForFilters(toolTypeDD),
                toolIds: preparePayloadForFilters(applicationDD),
                functionIds: preparePayloadForFilters(applicationFunctionDD),
                geographyIds: preparePayloadForLocationFilters(applicationLocationDD),
                roleIds,
            };
            getToolFunctionLocationRoleForByToolFilters(payload);
        } else {
            const payload = {
                toolIds: preparePayloadForFilters(rolesApplicationDD),
                functionIds: preparePayloadForFilters(rolesFunctionDD),
                geographyIds: preparePayloadForLocationFilters(rolesLocationDD),
                roleIds,
            };
            getToolFunctionLocationRoleForByRoleFilters(payload);
        }
    };

    const loaderComponent = useMemo(() => {
        return isFiltersDataLoading ? (
            <div className={styles['overlay']}>
                <AnimatedLoaders id="lazy-loader" type="page" />
            </div>
        ) : null;
    }, [isFiltersDataLoading]);

    const popupBody = useCallback(() => {
        return (
            <>
                {loaderComponent}
                <div
                    className={isFiltersDataLoading ? styles['content-disabled'] : styles.container}
                >
                    <label>By Tool</label>

                    <div className={styles['space-v-16']} />
                    <DropDown
                        key={`tool-${resetKey}`}
                        dataTestId="dropd-down"
                        dropdown={{
                            isDisabled: false,
                            label: 'Tool Type',
                            onChange: () => {},
                            options: getOptionsForToolTypeDropdown(),
                            placeholder: 'Select',
                            required: false,
                            reset: isReset.toolType,
                            selectedOptions: toolTypeDD.map(option => ({
                                label: option.label,
                                value: String(option.value),
                            })),
                            size: 'L',
                            type: 'checkbox',
                        }}
                        id="drop-down"
                        confirmSelection={{
                            apply: {
                                onClick: tree => {
                                    const selectedTree = tree as { label: string; value: number }[];
                                    setToolTypeDD(selectedTree);
                                    onChangeHandlerForToolType(tree);
                                },
                                disabled: getDisabledStatusForDropdownApplyButton(toolTypeDD),
                            },
                        }}
                        handleApplyButtonDisable={true}
                        searchInput={{
                            searchPlaceholder: 'Search',
                            searchSize: 'L',
                            searchWholeString: true,
                        }}
                    />

                    <div className={styles['space-v-16']} />
                    <DropDown
                        key={`application-${resetKey}`}
                        dataTestId="dropd-down"
                        dropdown={{
                            isDisabled: false,
                            label: 'Tool',
                            onChange: () => {},
                            options: getOptionsForToolsDropdown(),
                            placeholder: 'Select',
                            required: false,
                            reset: isReset.application,
                            selectedOptions: applicationDD.map(option => ({
                                label: option.label,
                                value: String(option.value),
                            })),
                            size: 'L',
                            type: 'checkbox',
                        }}
                        id="drop-down"
                        searchInput={{
                            searchPlaceholder: 'Search',
                            searchSize: 'L',
                            searchWholeString: true,
                        }}
                        confirmSelection={{
                            apply: {
                                onClick: tree => {
                                    const selectedTree = tree as { label: string; value: number }[];
                                    setApplicationDD(selectedTree);
                                    onChangeHandlerForTool(tree);
                                },
                                disabled: getDisabledStatusForDropdownApplyButton(applicationDD),
                            },
                        }}
                        handleApplyButtonDisable={true}
                    />

                    <div className={styles['space-v-16']} />
                    <DropDown
                        key={`applicationFunction-${resetKey}`}
                        dataTestId="dropd-down"
                        dropdown={{
                            isDisabled: false,
                            label: 'Function',
                            onChange: () => {},
                            options: getOptionsForFunctionsDropdown(),
                            placeholder: 'Select',
                            required: false,
                            reset: isReset.applicationFunction,
                            selectedOptions: applicationFunctionDD.map(option => ({
                                label: option.label,
                                value: String(option.value),
                            })),
                            size: 'L',
                            type: 'checkbox',
                        }}
                        id="drop-down"
                        searchInput={{
                            searchPlaceholder: 'Search',
                            searchSize: 'L',
                            searchWholeString: true,
                        }}
                        confirmSelection={{
                            apply: {
                                onClick: tree => {
                                    const selectedTree = tree as { label: string; value: number }[];
                                    setApplicationFunctionDD(selectedTree);
                                    onChangeHandlerForFunction(tree);
                                },
                                disabled:
                                    getDisabledStatusForDropdownApplyButton(applicationFunctionDD),
                            },
                        }}
                        handleApplyButtonDisable={true}
                    />

                    <div className={styles['space-v-16']} />
                    <DropDown
                        id="role-selection-popup-dropdown-two"
                        key={`applicationLocation-${resetKey}`}
                        dropdown={{
                            isDisabled: false,
                            label: 'Geography',
                            reset: isReset.applicationLocation,
                            onChange: () => {},
                            options: getOptionsForLocationsDropdown(),
                            placeholder: 'Select',
                            size: 'L',
                            type: 'tree-multiselect',
                            selectedOptions: Object.entries(applicationLocationDD).flatMap(
                                ([label, values]) =>
                                    values.map(value => ({
                                        label,
                                        value: String(value),
                                    })),
                            ),
                        }}
                        searchInput={{
                            searchPlaceholder: 'Search',
                            searchSize: 'S',
                            searchWholeString: true,
                        }}
                        autoSelectParentChild={false}
                        confirmSelection={{
                            apply: {
                                onClick: (
                                    options: { label: string; value: string; key: string }[],
                                ) => {
                                    const locationResultSet: any = {};
                                    for (const option of options) {
                                        if (locationResultSet[option.label]) {
                                            locationResultSet[option.label].push(option.value);
                                        } else {
                                            locationResultSet[option.label] = [option.value];
                                        }
                                    }
                                    setApplicationLocationDD(locationResultSet);
                                    onChangeHandlerForLocation(options);
                                },
                                disabled:
                                    getDisabledStatusForDropdownApplyButton(applicationLocationDD),
                            },
                        }}
                        handleApplyButtonDisable={true}
                    />

                    <div className={styles['space-v-16']} />
                    <DropDown
                        key={`applicationRoles-${resetKey}`}
                        dataTestId="dropd-down"
                        dropdown={{
                            isDisabled: false,
                            label: 'Accessed by roles',
                            onChange: () => {},
                            options: getOptionsForRolesDropdown(),
                            placeholder: 'Select',
                            required: false,
                            reset: isReset.applicationRoles,
                            selectedOptions: applicationRolesDD.map(option => ({
                                label: option.label,
                                value: String(option.value),
                            })),
                            size: 'L',
                            type: 'checkbox',
                        }}
                        id="drop-down"
                        searchInput={{
                            searchPlaceholder: 'Search',
                            searchSize: 'L',
                            searchWholeString: true,
                        }}
                        confirmSelection={{
                            apply: {
                                onClick: tree => {
                                    const selectedTree = tree as { label: string; value: number }[];
                                    setApplicationRolesDD(selectedTree);
                                    onChangeHandlerForRole(tree);
                                },
                                disabled:
                                    getDisabledStatusForDropdownApplyButton(applicationRolesDD),
                            },
                        }}
                        handleApplyButtonDisable={true}
                    />

                    <label style={{ marginTop: '20px' }}>By Roles</label>
                    <div className={styles['space-v-16']} />
                    <DropDown
                        key={`roles-${resetKey}`}
                        dataTestId="dropd-down"
                        dropdown={{
                            isDisabled: false,
                            label: 'Role',
                            onChange: () => {},
                            options: getOptionsForRolesDropdown(false),
                            placeholder: 'Select',
                            required: false,
                            reset: isReset.roles,
                            selectedOptions: rolesDD.map(option => ({
                                label: option.label,
                                value: String(option.value),
                            })),
                            size: 'L',
                            type: 'checkbox',
                        }}
                        id="drop-down"
                        searchInput={{
                            searchPlaceholder: 'Search',
                            searchSize: 'L',
                            searchWholeString: true,
                        }}
                        confirmSelection={{
                            apply: {
                                onClick: tree => {
                                    const selectedTree = tree as { label: string; value: number }[];
                                    setRolesDD(selectedTree);
                                    onChangeHandlerForRole(tree, false);
                                },
                                disabled: getDisabledStatusForDropdownApplyButton(rolesDD),
                            },
                        }}
                        handleApplyButtonDisable={true}
                    />

                    <div className={styles['space-v-16']} />
                    <DropDown
                        key={`rolesFunction-${resetKey}`}
                        dataTestId="dropd-down"
                        dropdown={{
                            isDisabled: false,
                            label: 'Function',
                            onChange: () => {},
                            options: getOptionsForFunctionsDropdown(false),
                            placeholder: 'Select',
                            required: false,
                            reset: isReset.rolesFunction,
                            selectedOptions: rolesFunctionDD.map(option => ({
                                label: option.label,
                                value: String(option.value),
                            })),
                            size: 'L',
                            type: 'checkbox',
                        }}
                        id="drop-down"
                        searchInput={{
                            searchPlaceholder: 'Search',
                            searchSize: 'L',
                            searchWholeString: true,
                        }}
                        confirmSelection={{
                            apply: {
                                onClick: tree => {
                                    const selectedTree = tree as { label: string; value: number }[];
                                    setRolesFunctionDD(selectedTree);
                                    onChangeHandlerForFunction(tree, false);
                                },
                                disabled: getDisabledStatusForDropdownApplyButton(rolesFunctionDD),
                            },
                        }}
                        handleApplyButtonDisable={true}
                    />

                    <div className={styles['space-v-16']} />
                    <DropDown
                        id="role-selection-popup-dropdown-two"
                        key={`rolesLocation-${resetKey}`}
                        dropdown={{
                            isDisabled: false,
                            label: 'Geography',
                            reset: isReset.rolesLocation,
                            onChange: () => {},
                            options: getOptionsForLocationsDropdown(false),
                            placeholder: 'Select',
                            size: 'L',
                            type: 'tree-multiselect',
                            selectedOptions: Object.entries(rolesLocationDD).map(
                                ([key, values]) => ({
                                    label: key,
                                    value: Array.isArray(values)
                                        ? values.map(String).join(',')
                                        : String(values),
                                }),
                            ),
                        }}
                        searchInput={{
                            searchPlaceholder: 'Search',
                            searchSize: 'S',
                            searchWholeString: true,
                        }}
                        autoSelectParentChild={false}
                        confirmSelection={{
                            apply: {
                                onClick: (
                                    options: { label: string; value: string; key: string }[],
                                ) => {
                                    const locationResultSet: any = {};
                                    for (const option of options) {
                                        if (locationResultSet[option.label]) {
                                            locationResultSet[option.label].push(option.value);
                                        } else {
                                            locationResultSet[option.label] = [option.value];
                                        }
                                    }
                                    setRolesLocationDD(locationResultSet);
                                    onChangeHandlerForLocation(options, false);
                                },
                                disabled: getDisabledStatusForDropdownApplyButton(rolesLocationDD),
                            },
                        }}
                        handleApplyButtonDisable={true}
                    />

                    <div className={styles['space-v-16']} />
                    <DropDown
                        key={`rolesApplication-${resetKey}`}
                        dataTestId="dropd-down"
                        dropdown={{
                            isDisabled: false,
                            label: 'Access to applications',
                            onChange: () => {},
                            options: getOptionsForToolsDropdown(false),
                            placeholder: 'Select',
                            required: false,
                            reset: isReset.rolesApplication,
                            selectedOptions: rolesApplicationDD.map(option => ({
                                label: option.label,
                                value: String(option.value),
                            })),
                            size: 'L',
                            type: 'checkbox',
                        }}
                        id="drop-down"
                        searchInput={{
                            searchPlaceholder: 'Search',
                            searchSize: 'L',
                            searchWholeString: true,
                        }}
                        confirmSelection={{
                            apply: {
                                onClick: tree => {
                                    const selectedTree = tree as { label: string; value: number }[];
                                    setRolesApplicationDD(selectedTree);
                                    onChangeHandlerForTool(tree, false);
                                },
                                disabled:
                                    getDisabledStatusForDropdownApplyButton(rolesApplicationDD),
                            },
                        }}
                        handleApplyButtonDisable={true}
                    />
                </div>
            </>
        );
    }, [
        applicationFunctionDD,
        applicationDD,
        applicationLocationDD,
        applicationRolesDD,
        rolesFunctionDD,
        rolesDD,
        rolesLocationDD,
        rolesApplicationDD,
        isReset,
        filters,
        toolTypeDD,
        // New depedencies
        functionsByTool,
        locationsByTool,
        rolesByTool,
        toolTypesByTool,
        toolsByTool,
        getDisabledStatusForDropdownApplyButton,
        isOpen,
    ]);

    return (
        <div className={styles['outer-container']}>
            <Flyout
                heading={'Filters'}
                iconForHeading="filter-funnel-01"
                flyoutOpen={isOpen}
                direction="right"
                subHeading={'Select filters to be applied to the tools and permission tables.'}
                cancelIconClick={onClose}
                primaryBtnProps={{
                    text: 'Apply Filter',
                    onClick: onRequestBtnClick,
                    disabled: getDisabledStatusForApplyFiltersButton(),
                    loading: loading,
                }}
                secondaryBtnProps={{
                    text: 'Reset Filter',
                    onClick: onResetButtonClick,
                    disabled: areFiltersSelectionEmpty,
                    loading: loading,
                }}
                content={popupBody()}
                id="role-selection-flyout"
                iconForCancel={{
                    icon: 'x-close',
                    onClick: () => {
                        onClose();
                    },
                }}
                onBackDropClick={() => {
                    onClose();
                }}
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

export default ApplicationFilterPopup;
