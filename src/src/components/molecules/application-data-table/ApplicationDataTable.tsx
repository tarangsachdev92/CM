import {
    Table,
    AnimatedLoaders,
    Icon,
    SideMenu,
    Button,
    Flyout,
    FilterChip,
    DropDown,
    IconButton,
    Status,
} from 'konnect-react-components';
import { useCallback, useEffect, useMemo, useState, useRef } from 'react';
import styles from './ApplicationDataTable.module.scss';
import { Flex } from 'antd';
import { NoMatchesFound, RoleManagementEmptyState } from '../../../assets/images/images';
import { Label } from '../../atoms';
import { Props } from '../../../types/common';
import { useNavigate } from 'react-router-dom';
import { useDispatch } from 'react-redux';
import {
    AppDispatch,
    fetchGeographicalClustersOnMultipleRegionsIds,
    fetchGeographicalMarketsOnMultipleClusterIds,
    fetchGeographicalRegion,
    fetchGeographicalSitesOnMultipleMarketIds,
    fetchOwnerName,
    fetchApplicationDetailsById,
} from '../../../store';
import { updateApplicationDetails } from '../../../services/application';
import { formatLastRefreshedDate, logError } from '../../../utils/helpers';

type ToolData = {
    toolId: number;
    tool: string;
    toolName: string;
    toolType: string;
    toolIdAlias: string;
    function: string;
    team: string;
    version: number;
    toolOwner: string;
    region: string;
    regionAll: string;
    market: string;
    site: string;
    totalRows: number;
    totalPages: number;
    status: string;
    lastUpdated: string;
};

function ApplicationDataTable({
    toolDetails,
    applicationData,
    geographicalRegion,
    ownerNames,
    pageSize,
    pageNumber,
    totalRows,
    loading,
    handleSorting,
    handlePageChange,
    handlePageSizeChange,
    searchText,
    defaultFilters,
    filtersData,
    existingFilters,
    setNewFilters,
    renderButtons,
    setAppNamesString,
    setIsAppDetailsUpdated,
    onSelectedAppsChange,
    openDialog
}: Props) {
    const dispatch = useDispatch<AppDispatch>();

    const [selectedApps, setSelectedApps] = useState<{ label: string; value: number }[]>([]);
    const [isOpen, setIsOpen] = useState<boolean>(false);

    // Dropdown Data
    const [ownerDD, setOwnerDD] = useState<{ label: string; value: string } | null>(null);
    const [regionDD, setRegionDD] = useState<{ label: string; value: number }[]>([]);
    const [clusterDD, setClusterDD] = useState<{ label: string; value: number }[]>([]);
    const [marketDD, setMarketDD] = useState<{ label: string; value: number }[]>([]);
    const [siteDD, setSiteDD] = useState<{ label: string; value: number }[]>([]);

    // Selected values
    const [selectedRegion, setSelectedRegion] = useState<{ label: string; value: number }[]>([]);
    const [selectedCluster, setSelectedCluster] = useState<{ label: string; value: number }[]>([]);
    const [selectedMarket, setSelectedMarket] = useState<{ label: string; value: number }[]>([]);
    const [selectedSite, setSelectedSite] = useState<{ label: string; value: number }[]>([]);

    const [isAppSelected, setIsAppSelected] = useState<boolean>(false);

    const flyoutRef = useRef<HTMLDivElement>(null);
    const { toolDetail, geography } = toolDetails;
    const defaultOriginalValues = {
        owner: null as { label: string; value: string } | null,
        region: [] as { label: string; value: number }[],
        cluster: [] as { label: string; value: number }[],
        market: [] as { label: string; value: number }[],
        site: [] as { label: string; value: number }[],
    };

    const [originalValues, setOriginalValues] = useState(defaultOriginalValues);
    const [isSaveLoading, setIsSaveLoading] = useState<boolean>(false);

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            const target = event.target as HTMLElement;

            // If clicking inside the flyout, ignore the event
            if (flyoutRef.current?.contains(target)) return;

            // If clicking on interactive elements inside flyout (input, dropdowns, buttons), ignore
            if (target.closest('.flyout-container, button, .drop-down')) return;

            // Otherwise, close the flyout
            setIsOpen(false);
        };

        document.addEventListener('mousedown', handleClickOutside);

        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
        };
    }, [isOpen]);

    useEffect(() => {
        dispatch(fetchOwnerName());
        dispatch(fetchGeographicalRegion());
    }, [dispatch]);

    useEffect(() => {
        onSelectedAppsChange(selectedApps);
    }, [selectedApps, onSelectedAppsChange]);

    useEffect(() => {
        const fetchAndSetAppDetails = async () => {
            if (selectedApps.length === 1) {
                const appId = selectedApps[0]?.value || 0;
                try {
                    dispatch(fetchApplicationDetailsById({ appId: Number(appId) }));
                    navigate(`${appId}/${encodeURIComponent(selectedApps[0]?.label || "")}`);
                } catch (error) {
                    logError(error);
                }
            } else {
                setOriginalValues(defaultOriginalValues);
            }
        };

        fetchAndSetAppDetails();
    }, [selectedApps]);

    useEffect(() => {
        if (selectedApps.length === 1) {
            const fullName = `${toolDetail?.firstName} ${toolDetail?.lastName}`;
            const owner = { label: fullName, value: toolDetail?.toolOwner };
            const region =
                geography?.region?.map((geo : {geographyName: string, geographyId: string}) => ({
                    label: geo.geographyName,
                    value: geo.geographyId,
                })) ?? [];
            const cluster =
                geography?.cluster?.map((geo : {geographyName: string, geographyId: string}) => ({
                    label: geo.geographyName,
                    value: geo.geographyId,
                })) ?? [];
            const market =
                geography?.market?.map((geo : {geographyName: string, geographyId: string}) => ({
                    label: geo.geographyName,
                    value: geo.geographyId,
                })) ?? [];
            const site =
                geography?.site?.map((geo : {geographyName: string, geographyId: string}) => ({
                    label: geo.geographyName,
                    value: geo.geographyId,
                })) ?? [];

            setOwnerDD(owner);
            setSelectedRegion(region);
            setSelectedCluster(cluster);
            setSelectedMarket(market);
            setSelectedSite(site);

            setOriginalValues({
                owner,
                region,
                cluster,
                market,
                site,
            });
        }
    }, [toolDetails, selectedApps]);

    useEffect(() => {
        if (selectedApps.length !== 1) {
            setOwnerDD(null);
            setSelectedRegion([]);
            setSelectedCluster([]);
            setSelectedMarket([]);
            setSelectedSite([]);
        }
    }, [selectedApps]);

    const getDisabled = useMemo(() => {
        const isAnyEmpty =
            !ownerDD ||
            selectedRegion.length === 0 ||
            selectedCluster.length === 0 ||
            selectedMarket.length === 0 ||
            selectedSite.length === 0;

        const isSingleAppUnchanged =
            selectedApps.length === 1 &&
            JSON.stringify(ownerDD) === JSON.stringify(originalValues.owner) &&
            JSON.stringify(selectedRegion) === JSON.stringify(originalValues.region) &&
            JSON.stringify(selectedCluster) === JSON.stringify(originalValues.cluster) &&
            JSON.stringify(selectedMarket) === JSON.stringify(originalValues.market) &&
            JSON.stringify(selectedSite) === JSON.stringify(originalValues.site);

        return isAnyEmpty || isSingleAppUnchanged;
    }, [
        selectedApps,
        ownerDD,
        selectedRegion,
        selectedCluster,
        selectedMarket,
        selectedSite,
        originalValues,
    ]);

    useEffect(() => {
        setRegionDD(
            geographicalRegion.map((region : {regionName: string, regionId: string}) => ({
                label: region.regionName,
                value: region.regionId,
            })),
        );
    }, [geographicalRegion]);

    // Fetch Clusters when region changes
    useEffect(() => {
        if (selectedRegion.length > 0) {
            const regionIds = selectedRegion?.map(region => region.value) ?? [];
            dispatch(fetchGeographicalClustersOnMultipleRegionsIds({ regionIds }))
                .unwrap()
                .then((response: any) => {
                    if (Array.isArray(response)) {
                        const clusters = response.map(
                            (cluster: { clusterId: number; clusterName: string }) => ({
                                label: cluster.clusterName,
                                value: cluster.clusterId,
                            }),
                        );
                        setClusterDD(clusters);
                    } else {
                        logError('API response did not contain cluster data.');
                        setClusterDD([]);
                    }
                })
                .catch((error: any) => {
                    logError(error);
                });
        } else {
            setClusterDD([]);
        }
    }, [selectedRegion]);

    // Fetch Markets when Cluster changes
    useEffect(() => {
        if (selectedCluster.length > 0) {
            const clusterIds = selectedCluster?.map(cluster => cluster.value) ?? [];
            dispatch(fetchGeographicalMarketsOnMultipleClusterIds({ clusterIds }))
                .unwrap()
                .then((response: any) => {
                    if (Array.isArray(response)) {
                        const markets = response.map(
                            (market: { marketId: number; marketName: string }) => ({
                                label: market.marketName,
                                value: market.marketId,
                            }),
                        );
                        setMarketDD(markets);
                    } else {
                        logError('API response did not contain market data.');
                        setMarketDD([]);
                    }
                })
                .catch((error: any) => {
                    logError(error);
                });
        } else {
            setMarketDD([]);
        }
    }, [selectedCluster]);

    // Fetch Sites when Market changes
    useEffect(() => {
        if (selectedMarket.length > 0) {
            const marketIds = selectedMarket?.map(market => market.value) ?? [];
            dispatch(fetchGeographicalSitesOnMultipleMarketIds({ marketIds }))
                .unwrap()
                .then((response: any) => {
                    if (Array.isArray(response)) {
                        const sites = response.map(
                            (site: { siteId: number; siteName: string }) => ({
                                label: site.siteName,
                                value: site.siteId,
                            }),
                        );
                        setSiteDD(sites);
                    } else {
                        logError('API response did not contain site data.');
                        setSiteDD([]);
                    }
                })
                .catch((error: any) => {
                    logError(error);
                });
        } else {
            setSiteDD([]);
        }
    }, [selectedMarket]);

    const handleDeselectAll = () => {
        setSelectedApps([]);
        setIsAppSelected(false);
    };

    const tableData = useMemo(
        () =>
            (applicationData || []).map(application => ({
                ...application,
            })),
        [applicationData],
    );

    const navigate = useNavigate();

    const getExistingFiltersData = (existingFiltersData: any, id: string) => {
        const currentData = existingFiltersData.find((item: any) => item.id === id);
        return currentData?.selectedFilters;
    };

    const getCustomActionsForEditFlyout = () => (
        <Flex justify="space-between" align="center" className={styles['custom-action-container']}>
            <span className={styles['header']}>Edit Tools</span>
            <Flex justify="flex-end" gap="16px">
                <IconButton
                    icon="x-close"
                    onClick={() => {
                        onClose();
                    }}
                    size="Tiny"
                />
            </Flex>
        </Flex>
    );

    const handleSelectionChange = (appId: number, appName: string) => {
        setSelectedApps([{ label: appName, value: appId }]);
    };

    const handleEditApp = (appId: number, appName: string) => {
        handleSelectionChange(appId, appName)
    };

    const getColumns = useCallback(() => {
        return [
            {
                key: 'toolName',
                dataIndex: 'toolName',
                title: 'Tools',
                width: '340px',
                fixedWidth: true,
                resizable: true,
                sortable: true,
                sticky: 'left',
                columnFilterProps: {
                    sortColumnOptions: true,
                    filter: {
                        options: defaultFilters.tool,
                        selectedOptions: getExistingFiltersData(existingFilters, 'tool') ?? [],
                        onChange: () => {
                            // nothing to do
                        },
                        onSubmit: (selectedList: any) => {
                            setNewFilters(
                                'tool',
                                'Tool',
                                selectedList,
                                existingFilters,
                                defaultFilters,
                            );
                        },
                        onCancel: () => {
                            // nothing to do
                        },
                        onClear: () => {
                            setNewFilters('tool', 'Tool', [], existingFilters);
                        },
                    },
                    pinColumnOptions: true,
                    hideColumnOption: true,
                    manageColumns: {
                        onSubmit: () => { }, // required (empty)
                        onCancel: () => { },
                    },
                },
                render: (_value: string, record: ToolData) => {
                    return (
                        <button
                            className={styles['toolNavigationButton']}
                            onClick={() => {
                                handleEditApp(record.toolId, record.toolName);
                            }}>
                            <Flex gap={4} justify="space-between">
                                <Flex gap={8}>
                                    <Flex
                                        vertical
                                        align='start'
                                        gap={1}
                                    >
                                        <div className={styles['roleId']}>{record.toolIdAlias}</div>
                                        <div
                                            className={styles.role}
                                        >
                                            {record.toolName}
                                        </div>
                                    </Flex>
                                </Flex>

                                <Flex
                                    align="flex-end center"
                                    justify="space-around"
                                    onClick={event => {
                                        event.stopPropagation();
                                    }}
                                >
                                    {selectedApps.length <= 1 && (
                                        <SideMenu
                                            action={
                                                <div>
                                                    <Icon
                                                        color="neutrals-B800"
                                                        name="dots-vertical"
                                                        size="xm"
                                                    />
                                                </div>
                                            }
                                            onOptionSelect={(option: any) => {
                                                if (openDialog) {
                                                    openDialog({ type: option.value, appName: record.toolName, toolId: record.toolId, status: record.status })
                                                }
                                            }}
                                            options={record.status.toLowerCase() === "active" ? [
                                                {
                                                    label: 'Set as Inactive',
                                                    value: 'setInActive',
                                                },
                                                {
                                                    label: 'Delete',
                                                    value: 'deleteAction',
                                                },
                                            ] : [
                                                {
                                                    label: 'Set as Active',
                                                    value: 'setActive',
                                                },
                                                {
                                                    label: 'Delete',
                                                    value: 'deleteAction',
                                                },
                                            ]}
                                        />
                                    )}
                                </Flex>
                            </Flex>
                        </button>
                    );
                },
            },
            {
                key: 'type',
                dataIndex: 'type',
                title: 'Type',
                width: '120px',
                resizable: true,
                sortable: true,
                columnFilterProps: {
                    sortColumnOptions: true,
                    filter: {
                        options: defaultFilters.toolType,
                        selectedOptions: getExistingFiltersData(existingFilters, 'toolType') ?? [],
                        onChange: () => {
                            // nothing to do
                        },
                        onSubmit: (selectedList: any) => {
                            setNewFilters(
                                'toolType',
                                'ToolType',
                                selectedList,
                                existingFilters,
                                defaultFilters,
                            );
                        },
                        onCancel: () => {
                            // nothing to do
                        },
                        onClear: () => {
                            setNewFilters('toolType', 'ToolType', [], existingFilters);
                        },
                    },
                    pinColumnOptions: true,
                    hideColumnOption: true,
                    manageColumns: {
                        onSubmit: () => { }, // required (empty)
                        onCancel: () => { },
                    },
                },
            },
            {
                key: 'subFunction',
                dataIndex: 'subFunction',
                title: 'Sub-Function',
                width: '140px',
                resizable: true,
                sortable: true,
                columnFilterProps: {
                    sortColumnOptions: true,
                    filter: {
                        options: defaultFilters.subFunctionData,
                        selectedOptions: getExistingFiltersData(existingFilters, 'subFunctionData') ?? [],
                        onChange: () => {
                            // nothing to do
                        },
                        onSubmit: (selectedList: any) => {
                            setNewFilters(
                                'subFunctionData',
                                'Sub-Function',
                                selectedList,
                                existingFilters,
                                defaultFilters,
                            );
                        },
                        onCancel: () => {
                            // nothing to do
                        },
                        onClear: () => {
                            setNewFilters('subFunctionData', 'Sub-Function', [], existingFilters);
                        },
                    },
                    pinColumnOptions: true,
                    hideColumnOption: true,
                    manageColumns: {
                        onSubmit: () => { }, // required (empty)
                        onCancel: () => { },
                    },
                },
            },
            {
                key: 'team',
                dataIndex: 'team',
                title: 'Team',
                width: '100px',
                resizable: true,
                sortable: true,
                columnFilterProps: {
                    sortColumnOptions: true,
                    filter: {
                        options: defaultFilters.team,
                        selectedOptions: getExistingFiltersData(existingFilters, 'team') ?? [],
                        onChange: () => {
                            // nothing to do
                        },
                        onSubmit: (selectedList: any) => {
                            setNewFilters(
                                'team',
                                'Team',
                                selectedList,
                                existingFilters,
                                defaultFilters,
                            );
                        },
                        onCancel: () => {
                            // nothing to do
                        },
                        onClear: () => {
                            setNewFilters('team', 'Team', [], existingFilters);
                        },
                    },
                    pinColumnOptions: true,
                    hideColumnOption: true,
                    manageColumns: {
                        onSubmit: () => { }, // required (empty)
                        onCancel: () => { },
                    },
                },
            },
            {
                key: 'owner',
                dataIndex: 'owner',
                title: 'Owner',
                width: '140px',
                resizable: true,
                sortable: true,
                columnFilterProps: {
                    sortColumnOptions: true,
                    filter: {
                        options: defaultFilters.toolOwner,
                        selectedOptions: getExistingFiltersData(existingFilters, 'toolOwner') ?? [],
                        onChange: () => {
                            // nothing to do
                        },
                        onSubmit: (selectedList: any) => {
                            setNewFilters(
                                'toolOwner',
                                'Owner',
                                selectedList,
                                existingFilters,
                                defaultFilters,
                            );
                        },
                        onCancel: () => {
                            // nothing to do
                        },
                        onClear: () => {
                            setNewFilters('toolOwner', 'Owner', [], existingFilters);
                        },
                    },
                    pinColumnOptions: true,
                    hideColumnOption: true,
                    manageColumns: {
                        onSubmit: () => { }, // required (empty)
                        onCancel: () => { },
                    },
                },
            },
            {
                key: 'geographyLevel',
                dataIndex: 'geographyLevel',
                title: 'Geography',
                width: '140px',
                resizable: true,
                sortable: true,
                columnFilterProps: {
                    sortColumnOptions: true,
                    filter: {
                        options: defaultFilters.geography,
                        selectedOptions: getExistingFiltersData(existingFilters, 'geography') ?? [],
                        onChange: () => {
                            // nothing to do
                        },
                        onSubmit: (selectedList: any) => {
                            setNewFilters(
                                'geography',
                                'Geography Level',
                                selectedList,
                                existingFilters,
                                defaultFilters,
                            );
                        },
                        onCancel: () => {
                            // nothing to do
                        },
                        onClear: () => {
                            setNewFilters('geography', 'Geography Level', [], existingFilters);
                        },
                    },
                    pinColumnOptions: true,
                    hideColumnOption: true,
                    manageColumns: {
                        onSubmit: () => { }, // required (empty)
                        onCancel: () => { },
                    },
                },
            },
            {
                key: 'version',
                dataIndex: 'version',
                title: 'Version',
                width: '90px',
                resizable: true,
                sortable: true,
                columnFilterProps: {
                    sortColumnOptions: true,
                    filter: {
                        options: defaultFilters.version,
                        selectedOptions: getExistingFiltersData(existingFilters, 'version') ?? [],
                        onChange: () => {
                            // nothing to do
                        },
                        onSubmit: (selectedList: any) => {
                            setNewFilters(
                                'version',
                                'Version',
                                selectedList,
                                existingFilters,
                                defaultFilters,
                            );
                        },
                        onCancel: () => {
                            // nothing to do
                        },
                        onClear: () => {
                            setNewFilters('version', 'Version', [], existingFilters);
                        },
                    },
                    pinColumnOptions: true,
                    hideColumnOption: true,
                    manageColumns: {
                        onSubmit: () => { }, // required (empty)
                        onCancel: () => { },
                    },
                },
            },
            {
                key: 'lastUpdated',
                dataIndex: 'lastUpdated' as keyof ToolData,
                title: 'Last Updated',
                externalStyles: { textAlign: 'center' },
                width: '160px',
                resizable: true,
                sortable: true, 
                render: (_value: any, record: ToolData) => {
                    if (typeof record.lastUpdated === 'string') {
                        return record.lastUpdated ? formatLastRefreshedDate(record.lastUpdated) : '';
                    }
                    return '';
                },
            },
            {
                key: 'status',
                dataIndex: 'status',
                title: 'Status',
                width: '100px',
                resizable: true,
                sortable: true,
                columnFilterProps: {
                    sortColumnOptions: true,
                    filter: {
                        options: defaultFilters.status ?? [],
                        selectedOptions: getExistingFiltersData(existingFilters, 'status') ?? [],
                        onChange: () => { },
                        onSubmit: (selectedList: any) => {
                            setNewFilters(
                                'status',
                                'Status',
                                selectedList,
                                existingFilters,
                                defaultFilters,
                            );
                        },
                        onCancel: () => { },
                        onClear: () => {
                            setNewFilters('status', 'Status', [], existingFilters);
                        },
                    },
                    pinColumnOptions: true,
                    hideColumnOption: true,
                    manageColumns: {
                        onSubmit: () => { }, // required (empty)
                        onCancel: () => { },
                    },
                },
                render: (value: string) => {
                    return (
                        <Status
                            size="S"
                            text={value}
                            type={value === "Active" ? 'Success' : 'Warning'}
                        />
                    )
                },
            },
        ];
    }, [existingFilters, defaultFilters, filtersData, isAppSelected, selectedApps]);

    const columnsWithClickableRoleName = useCallback(
        () =>
            getColumns().map((column: any) => {
                if (column.key === 'Tool') {
                    return {
                        ...column,
                        render: (value: any, record: ToolData) => (
                            <div
                                // onClick={() => handleRowClick(record)}
                                style={{ cursor: 'pointer' }}
                            >
                                {column.render ? column.render(value, record) : value}
                            </div>
                        ),
                    };
                }
                return column;
            }),
        [getColumns, defaultFilters],
    );

    const renderTable = useCallback(() => {
        return (
            <Table
                columns={columnsWithClickableRoleName()}
                data={tableData}
                sort={(type: any, key: any) => {
                    handleSorting(key, type);
                }}
                pagination={{
                    totalItems: totalRows, // Total number of rows
                    pageSize,
                    currentPage: pageNumber,
                    onPageChange: (page: number) => {
                        handlePageChange(page);
                        setSelectedApps([]);
                    },
                    onPageSizeChange: handlePageSizeChange,
                    blankOut: 10,
                }}
            />
        );
    }, [
        columnsWithClickableRoleName,
        tableData,
        totalRows,
        pageNumber,
        pageSize,
        handlePageChange,
        handlePageSizeChange,
        handleSorting,
    ]);

    const openAddNewRolePage = useCallback(() => {
        navigate('add-new-tool');
        return true;
    }, []);

    const noApplicationsAdded = () => {
        return (
            <Flex
                vertical
                className={styles['am-empty-state']}
                align="center"
                justify="center"
                gap={16}
            >
                <Flex vertical align="center" justify="center" gap={40}>
                    <RoleManagementEmptyState />
                    <Flex vertical align="center" justify="center" gap={4}>
                        <Label type="body1">
                            <span className={styles['am-empty-state-title']}>No Tools Added</span>
                        </Label>
                        <Label type="body2">
                            <span className={styles['am-empty-state-description']}>
                                Click on the button below to start adding and managing the tools
                            </span>
                        </Label>
                    </Flex>
                    <Button icon="plus" text="Add New Tool" onClick={openAddNewRolePage} variant="Primary" />
                </Flex>
            </Flex>
        );
    };

    const noRecordsForSearchFound = () => {
        return (
            <Flex
                vertical
                className={styles['am-empty-state']}
                align="center"
                justify="center"
                gap={16}
            >
                <Flex vertical align="center" justify="center" gap={16}>
                    <NoMatchesFound />
                    <Flex vertical align="center" justify="center" gap={4}>
                        <Label type="body1">
                            <span className={styles['am-empty-state-title']}>No Matches Found</span>
                        </Label>
                        <Label type="body2">
                            <span className={styles['am-empty-state-description']}>
                                Sorry, nothing matches your search. Please try using a different
                                term.
                            </span>
                        </Label>
                    </Flex>
                </Flex>
            </Flex>
        );
    };

    const noRecordsFound = () => {
        return (
            <Flex
                vertical
                className={styles['am-empty-state']}
                align="center"
                justify="center"
                gap={16}
            >
                <Flex vertical align="center" justify="center" gap={16}>
                    <RoleManagementEmptyState />
                    <Flex vertical align="center" justify="center" gap={4}>
                        <Label type="body1">
                            <span className={styles['am-empty-state-title']}>No Tools Found</span>
                        </Label>
                        <Label type="body2">
                            <span className={styles['am-empty-state-description']}>
                                Try adjusting or clearing your filters to view tools
                            </span>
                        </Label>
                    </Flex>
                </Flex>
            </Flex>
        );
    };

    useEffect(() => {
        renderButtons(
            selectedApps.length > 0 ? (
                <Flex>
                    <div className={styles['deselectallbtn']}>
                        <Button
                            icon="x-square"
                            text="Deselect All"
                            variant="Subtle2"
                            onClick={handleDeselectAll}
                        />
                    </div>
                    <div className={styles['editselectedbtn']}>
                        <Button
                            icon="edit-02"
                            text="Edit Selected"
                            variant="Subtle2"
                            onClick={() => setIsOpen(true)}
                        />
                    </div>
                </Flex>
            ) : null,
        );
    }, [selectedApps]);

    const onClose = useCallback(() => {
        onRevertButtonClick();
        setIsOpen(false);
    }, []);

    const onSaveBtnClick = useCallback(async () => {
        setIsSaveLoading(true);
        try {
            const getCommaSeparatedValues = (items: { value: string | number }[]) => {
                return items.map(item => String(item.value)).join(',');
            };

            const applicationUpdatedData = {
                toolIds: getCommaSeparatedValues(selectedApps),
                owner: ownerDD ? String(ownerDD.value) : '',
                region: getCommaSeparatedValues(selectedRegion),
                cluster: getCommaSeparatedValues(selectedCluster),
                market: getCommaSeparatedValues(selectedMarket),
                site: getCommaSeparatedValues(selectedSite),
            };
            const namesString = selectedApps.map(app => app.label).join(', ');
            setAppNamesString(namesString);

            const response = await updateApplicationDetails(applicationUpdatedData);
            if (response.data) {
                setIsAppDetailsUpdated(true);
                setIsOpen(false);
                onRevertButtonClick();
                setSelectedApps([]);
            }
        } catch (error) {
            logError(error);
        } finally {
            setIsSaveLoading(false);
        }
    }, [selectedApps, ownerDD, selectedRegion, selectedCluster, selectedMarket, selectedSite]);

    const onRevertButtonClick = () => {
        if (selectedApps.length === 1) {
            setOwnerDD(originalValues.owner);
            setSelectedRegion(originalValues.region);
            setSelectedCluster(originalValues.cluster);
            setSelectedMarket(originalValues.market);
            setSelectedSite(originalValues.site);
        } else {
            setOwnerDD(null);
            setSelectedRegion([]);
            setSelectedCluster([]);
            setSelectedMarket([]);
            setSelectedSite([]);
        }
    };

    const popupBody = useCallback(() => {
        return (
            <div className={styles.container}>
                {/* Selected Applications */}
                <label className={styles['flyout-labels']}>Selected Tools:</label>
                <div className={styles['flyout-chips']}>
                    {selectedApps.map(app => (
                        <FilterChip
                            key={String(app.value)}
                            label={String(app.label)}
                            onClose={() =>
                                setSelectedApps(prev => {
                                    const updated = prev.filter(
                                        selectedApp => selectedApp.value !== app.value,
                                    );
                                    if (updated.length === 0) {
                                        onRevertButtonClick();
                                        setIsOpen(false);
                                    }
                                    return updated;
                                })
                            }
                        />
                    ))}
                </div>

                {/* Edit Owner Section */}
                <div className={styles['flyout-labels']}>
                    <label>Edit Owner</label>
                    <p className={styles['flyout-description']}>
                        All selected tools will be updated as per the new selected Owner.
                    </p>
                    <DropDown
                        dropdown={{
                            isDisabled: false,
                            onChange: (selectedOption: { label: string; value: string }) =>
                                setOwnerDD(selectedOption),
                            options: ownerNames.map(
                                (owner: {
                                    firstName: string;
                                    lastName: string;
                                    userEmail: string;
                                }) => ({
                                    label: `${owner.firstName} ${owner.lastName}`,
                                    value: owner.userEmail,
                                }),
                            ),
                            placeholder: 'Select Owner',
                            selectedOptions: ownerDD ? [ownerDD] : [],
                            size: 'L',
                            type: 'radio',
                        }}
                        searchInput={{
                            searchPlaceholder: 'Search',
                            searchSize: 'L',
                            searchWholeString: true,
                        }}
                    />
                </div>

                {/* Edit Geographical Information */}
                <div className={styles['flyout-labels']}>
                    <label>Edit Geographical Information</label>
                    <p className={styles['flyout-description']}>
                        All selected tools will be updated as per the new selected geography.
                    </p>
                    <DropDown
                        className="drop-down"
                        dataTestId="dropd-down"
                        dropdown={{
                            isDisabled: false,
                            isLabelInline: false,
                            label: 'Region',
                            onChange: (_option, _checked: boolean, tree: object[]) => {
                                const selectedTree = tree as { label: string; value: number }[];
                                setSelectedRegion(selectedTree);

                                // Clear all child selections when region changes
                                setSelectedCluster([]);
                                setSelectedMarket([]);
                                setSelectedSite([]);

                                // Optional: Clear child dropdown data if needed
                                setClusterDD([]);
                                setMarketDD([]);
                                setSiteDD([]);
                            },
                            options: regionDD.map(item => ({
                                label: item.label,
                                value: String(item.value),
                            })),
                            placeholder: 'Select Region',
                            required: false,
                            reset: false,
                            showSelectAll: true,
                            selectAllOption: {
                                label: 'ALL',
                                value: 'all',
                            },
                            selectedOptions: selectedRegion.map(option => ({
                                label: option.label,
                                value: String(option.value),
                            })),
                            size: 'L',
                            type: 'checkbox',
                        }}
                        dropdownOptionsClassName="dropdown-options-custom"
                        id="drop-down"
                        searchInput={{
                            searchPlaceholder: 'Search',
                            searchSize: 'L',
                            searchWholeString: true,
                        }}
                    />
                    <div className={styles['space-v-16']} />
                    <DropDown
                        className="drop-down"
                        dataTestId="dropd-down"
                        dropdown={{
                            isDisabled: selectedRegion.length === 0,
                            isLabelInline: false,
                            label: 'Cluster',
                            onChange: (_option, _checked: boolean, tree: object[]) => {
                                const selectedTree = tree as { label: string; value: number }[];
                                setSelectedCluster(selectedTree);

                                // Clear downstream selections
                                setSelectedMarket([]);
                                setSelectedSite([]);

                                // Optional: Clear downstream dropdown data
                                setMarketDD([]);
                                setSiteDD([]);
                            },
                            options: clusterDD.map(item => ({
                                label: item.label,
                                value: String(item.value),
                            })),
                            placeholder: 'Select Cluster',
                            required: false,
                            reset: false,
                            showSelectAll: true,
                            selectAllOption: {
                                label: 'ALL',
                                value: 'all',
                            },
                            selectedOptions: selectedCluster.map(option => ({
                                label: option.label,
                                value: String(option.value),
                            })),
                            size: 'L',
                            type: 'checkbox',
                        }}
                        dropdownOptionsClassName="dropdown-options-custom"
                        id="drop-down"
                        searchInput={{
                            searchPlaceholder: 'Search',
                            searchSize: 'L',
                            searchWholeString: true,
                        }}
                    />
                    <div className={styles['space-v-16']} />
                    <DropDown
                        className="drop-down"
                        dataTestId="dropd-down"
                        dropdown={{
                            isDisabled: selectedCluster.length === 0,
                            isLabelInline: false,
                            label: 'Market',
                            onChange: (_option, _checked: boolean, tree: object[]) => {
                                const selectedTree = tree as { label: string; value: number }[];
                                setSelectedMarket(selectedTree);

                                // Clear downstream selection
                                setSelectedSite([]);

                                // Optional: Clear downstream dropdown data
                                setSiteDD([]);
                            },
                            options: marketDD.map(item => ({
                                label: item.label,
                                value: String(item.value),
                            })),
                            placeholder: 'Select Market',
                            required: false,
                            reset: false,
                            showSelectAll: true,
                            selectAllOption: {
                                label: 'ALL',
                                value: 'all',
                            },
                            selectedOptions: selectedMarket.map(option => ({
                                label: option.label,
                                value: String(option.value),
                            })),
                            size: 'L',
                            type: 'checkbox',
                        }}
                        dropdownOptionsClassName="dropdown-options-custom"
                        id="drop-down"
                        searchInput={{
                            searchPlaceholder: 'Search',
                            searchSize: 'L',
                            searchWholeString: true,
                        }}
                    />
                    <div className={styles['space-v-16']} />
                    <DropDown
                        className="drop-down"
                        dataTestId="dropd-down"
                        dropdown={{
                            isDisabled: selectedMarket.length === 0,
                            isLabelInline: false,
                            label: 'Site',
                            onChange: (_option, _checked: boolean, tree: object[]) => {
                                const selectedTree = tree as { label: string; value: number }[];
                                setSelectedSite(selectedTree);
                            },
                            options: siteDD.map(item => ({
                                label: item.label,
                                value: String(item.value),
                            })),
                            placeholder: 'Select Site',
                            required: false,
                            reset: false,
                            showSelectAll: true,
                            selectAllOption: {
                                label: 'ALL',
                                value: 'all',
                            },
                            selectedOptions: selectedSite.map(option => ({
                                label: option.label,
                                value: String(option.value),
                            })),
                            size: 'L',
                            type: 'checkbox',
                        }}
                        dropdownOptionsClassName="dropdown-options-custom"
                        id="drop-down"
                        searchInput={{
                            searchPlaceholder: 'Search',
                            searchSize: 'L',
                            searchWholeString: true,
                        }}
                    />
                </div>
            </div>
        );
    }, [
        selectedApps,
        ownerDD,
        selectedRegion,
        clusterDD,
        selectedCluster,
        marketDD,
        selectedMarket,
        siteDD,
        selectedSite,
    ]);

    return (
        <div className={styles['table-container']}>
            {loading && (
                <div className={styles['overlay']}>
                    <AnimatedLoaders id="lazy-loader" type="page" />
                </div>
            )}
            <div className={loading ? styles['content-disabled'] : ''}>
                {applicationData && applicationData?.length > 0
                    ? renderTable()
                    : searchText
                        ? noRecordsForSearchFound()
                        : applicationData?.length === 0
                            ? noApplicationsAdded()
                            : !loading && noRecordsFound()}
            </div>
            <div className={styles['outer-container']}>
                <Flyout
                    heading={''}
                    flyoutOpen={isOpen}
                    direction="right"
                    cancelIconClick={onClose}
                    primaryBtnProps={{
                        text: 'Save',
                        onClick: onSaveBtnClick,
                        disabled: getDisabled,
                        loading: isSaveLoading,
                    }}
                    secondaryBtnProps={{
                        text: 'Revert',
                        onClick: onRevertButtonClick,
                        disabled: getDisabled,
                        loading: loading,
                    }}
                    content={popupBody()}
                    id="role-selection-flyout"
                    customActions={getCustomActionsForEditFlyout()}
                />
            </div>
        </div>
    );
}

export default ApplicationDataTable;