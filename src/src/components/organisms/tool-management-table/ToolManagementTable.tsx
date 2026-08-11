import { Flex } from 'antd';
import { useCallback, useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import _ from 'lodash';
import { AppDispatch, fetchApplicationData, RootState } from '../../../store';
import { Label } from '../../atoms';
import styles from './ToolManagementTable.module.scss';
import ApplicationDataTable from '../../molecules/application-data-table/ApplicationDataTable';
import { Dialog, SearchInput, Toast } from 'konnect-react-components';
import AppliedFilters, { FilterType } from '../../molecules/applied-filters/AppliedFilters';
import { convertOptions, removeElementByKey } from '../../../utils/helpers';
import { IApplicationFiltersData, IColumnFilterData } from '../../../types/response';
import type { IApplicationRequest } from '../../../types/request';
import { useParams } from 'react-router-dom';
import { deleteTool, setToolActivity } from '../../../services/tool';

type Props = {
    onRefreshDate?: (date: Date) => void;
};

type DialogProps = {
    id?: number,
    variant?: 'Neutral' | 'With Illustration' | 'HeaderTitleIcon',
    title: string,
    description: string,
    primaryButtonText: string,
    secondaryButtonText: string,
    primaryButtonAction?: () => void,
    secondaryButtonAction?: () => void
}

const FILTER_COLUMN_NAME_MAP: Record<string, string> = {
    tool: 'Tool Name',
    toolType: 'Type',
    function: 'Function',
    subFunctionData: 'Sub-Function',
    team: 'Team',
    toolOwner: 'Owner',
    geography: 'Geography Level',
    market: 'Market',
    site: 'Site',
    version: 'Version',
    status: 'Status',
};

function ToolManagementTable({ onRefreshDate }: Readonly<Props>) {
    const [pageNumber, setPageNumber] = useState(1);
    const [pageSize, setPageSize] = useState(10);
    const [loading, setLoading] = useState(true);
    const [sortColumn, setSortColumnName] = useState<string>('lastUpdated');
    const [sortDirection, setSortDirection] = useState<string>('desc');
    const [searchColumn, setSearchColumn] = useState<string>('tool');
    const [searchText, setSearchText] = useState<string>('');
    const [searchKeyword, setSearchKeyword] = useState<string>('');
    const [appliedFilters, setAppliedFilters] = useState<Array<IColumnFilterData>>([]);
    const [filters, setFilters] = useState<Array<FilterType>>([]);
    const [defaultFilters, setDefaultFilters] = useState<any>({
        tool: [],
        toolType: [],
        function: [],
        subFunctionData: [],
        team: [],
        geography: [],
        version: [],
        toolOwner: [],
        market: [],
        site: [],
        status: [],
    });
    const [buttons, setButtons] = useState<React.ReactNode | null>(null);
    const [toggleUpdateToast, setToggleUpdateToast] = useState<boolean>(false);
    const [toastMessage, setToastMessage] = useState<string>('')
    const [appNamesString, setAppNamesString] = useState<string>('');
    const [isAppDetailsUpdated, setIsAppDetailsUpdated] = useState<boolean>(false);
    const [selectedAppsFromChild, setSelectedAppsFromChild] = useState<
        { label: string; value: number }[]
    >([]);

    const [shouldDisplayDialog, setShouldDisplayDialog] = useState<boolean>(false)
    const [selectedTooldata, setSelectedToolData] = useState({ id: 1, active: false })
    const [dialogData, setDialogData] = useState<DialogProps>({ id: 0, variant: "Neutral", title: "", description: "", primaryButtonText: "", secondaryButtonText: "", primaryButtonAction: () => { setShouldDisplayDialog(false) }, secondaryButtonAction: () => { setShouldDisplayDialog(false) } })
    const roleParams = useParams<{ roleId: string }>();

    const request: IApplicationRequest = {
        pageSize: pageSize,
        pageNumber: pageNumber,
        sortColumnName: sortColumn,
        sortDirection: sortDirection,
        searchKeyword: searchKeyword,
        searchTerm: searchKeyword ? searchColumn : '',
        gridFilters: appliedFilters,
        roleId: roleParams.roleId
    };
    const dispatch = useDispatch<AppDispatch>();
    const applicationData = useSelector((state: RootState) => state.applicationData.data);
    const pagination = useSelector((state: RootState) => state.applicationData.paginationData);
    const filtersData = useSelector((state: RootState) => state.applicationData.columnFilters);
    const ownerNames = useSelector((state: RootState) => state.teamAndOwnerName.ownerName);

    const geographicalRegion = useSelector(
        (state: RootState) => state.fetchGeographicalInformation.data.regions,
    );

    const toolDetails = useSelector((state: RootState) => state.applicationManagement.toolDetails);
    const lastRefreshDate = useSelector((state: RootState) => state.lastRefreshDate);

    const totalRows = pagination?.totalRows;

    useEffect(() => {
        if (!applicationData || applicationData.length === 0) {
            onRefreshDate?.(new Date());
            return;
        }
        const refreshDate = lastRefreshDate.data.activityTimeStamp;
        const finalDate = refreshDate
            ? new Date(refreshDate)
            : new Date();

        onRefreshDate?.(finalDate);
    }, [applicationData, onRefreshDate]);

    const fetchData = useCallback(async () => {
        setLoading(true);
        try {
            await dispatch(fetchApplicationData(request));
        } finally {
            setLoading(false);
            setIsAppDetailsUpdated(false);
        }
    }, [
        dispatch,
        pageNumber,
        pageSize,
        sortColumn,
        sortDirection,
        searchKeyword,
        searchColumn,
        appliedFilters,
        isAppDetailsUpdated
    ]);

    useEffect(() => {
        if (isAppDetailsUpdated) {
            setToggleUpdateToast(true);
        }
        fetchData();
    }, [fetchData, isAppDetailsUpdated]);

    const handlePageChange = (page: number) => {
        setPageNumber(page);
    };

    const handlePageSizeChange = (size: number) => {
        setPageSize(size);
    };

    const handleSorting = async (columnName: string, order: string) => {
        if (order !== 'unsort') {
            setSortColumnName(columnName);
            setSortDirection(order);
        }
    };

    useEffect(() => {
        setPageNumber(1);
    }, []);

    useEffect(() => {
        setPageNumber(1);
        const delayDebounce = setTimeout(() => {
            setSearchKeyword(searchText);
        }, 500);

        return () => clearTimeout(delayDebounce);
    }, [searchText]);

    const deleteToolAPI = async () => {
        setShouldDisplayDialog(false)
        setLoading(true);
        setToastMessage(`Tool ${appNamesString.includes(',') ? 's' : ''} ${appNamesString} has been deleted.`)
        try {
            await deleteTool({
                toolId: selectedTooldata.id
            });
        } finally {
            setLoading(false);
            setIsAppDetailsUpdated(false);
            setToggleUpdateToast(true)
            fetchData()
        }
    }

    const setActiveAndInactiveToolAPI = async () => {
        setShouldDisplayDialog(false)
        setLoading(true);
        setToastMessage(`Tool ${appNamesString.includes(',') ? 's' : ''} ${appNamesString} has been set as ${selectedTooldata.active ? 'active' : 'inactive'}.`)
        try {
            await setToolActivity({
                toolId: selectedTooldata.id,
                status: selectedTooldata.active
            });
        } finally {
            setLoading(false);
            setIsAppDetailsUpdated(false);
            setToggleUpdateToast(true)
            fetchData()
        }
    }

    const onRemoveFilter = useCallback((filterKey: string, filterArray: Array<FilterType>) => {
        const newFilter = removeElementByKey(filterArray, 'id', filterKey);
        setFilters(newFilter);
    }, []);

    const onResetFilters = useCallback(() => {
        setFilters([]);
        return true;
    }, []);

    const updateAppliedFilters = useCallback(() => {
        const appliedFilterArray: IColumnFilterData[] = [];
        filters.forEach((filter: FilterType) => {
            const backendColumnName = FILTER_COLUMN_NAME_MAP[filter.id] ?? filter.title;

            filter.selectedFilters.forEach((selectedFilterObj: { label: string; value: string }) => {
                const selectedValue = selectedFilterObj.value;
                const normalizedId =
                    String(selectedValue).toLowerCase() === 'null'
                        ? null
                        : String(selectedValue);

                const filterObj: IColumnFilterData = {
                    columnName: backendColumnName,
                    columnValue: selectedFilterObj.label,
                    id: normalizedId,
                };
                appliedFilterArray.push(filterObj);
            });
        });
        setAppliedFilters([...appliedFilterArray]);
        setPageNumber(1);
    }, [filters]);

    useEffect(() => {
        updateAppliedFilters();
    }, [updateAppliedFilters]);

    const setNewFilters = useCallback(
        (
            filterName: string,
            filterTitle: string,
            newFiltersData: any,
            existingFilters: any,
            defaultExistingFilters: any,
        ) => {
            let newFilters = existingFilters;
            if (newFiltersData.length > 0) {
                const singleFilter: any = {};
                singleFilter['id'] = filterName;
                singleFilter['title'] = filterTitle;
                singleFilter['selectedFilters'] = newFiltersData;
                singleFilter['defaultFilters'] = defaultExistingFilters[filterName];
                singleFilter['onClose'] = onRemoveFilter;
                const existingData = newFilters.findIndex((obj: any) => obj.id === filterName);
                if (existingData === -1) {
                    newFilters.push(singleFilter);
                } else {
                    newFilters[existingData] = singleFilter;
                }
            } else {
                newFilters = newFilters.filter((obj: any) => obj.id !== filterName);
            }
            setFilters([...newFilters]);
        },
        [],
    );

    const updatePreviousFilters = useCallback((newFilterData: any) => {
        setFilters((prevFilters: any) => {
            const updatedFilters: any = [];
            if (prevFilters.length > 0) {
                prevFilters.forEach((existFilterData: any) => {
                    const updatedObj = existFilterData;
                    updatedObj['selectedFilters'] =
                        existFilterData['selectedFilters'].length >
                            newFilterData[existFilterData['id']].length
                            ? newFilterData[existFilterData['id']]
                            : existFilterData['selectedFilters'];
                    updatedFilters.push(updatedObj);
                });
                return _.isEqual(updatedFilters, prevFilters) ? prevFilters : updatedFilters;
            }
            return prevFilters;
        });
    }, []);

    const addDefaultFilters = useCallback((allFiltersData: IApplicationFiltersData) => {
        if (allFiltersData) {
            const applicationData = convertOptions(allFiltersData['Tool Name'], 'columnValue', 'id');
            const toolTypeData = convertOptions(
                allFiltersData.Type,
                'columnValue',
                'columnValue',
            );
            const subFunctionData = convertOptions(allFiltersData['Sub-Function'], 'columnValue', 'id');
            const functionData = convertOptions(allFiltersData.Function, 'columnValue', 'id');
            const appOwnerData = (allFiltersData.Owner || []).reduce(
                (acc: Array<{ label: string; value: string }>, owner, index: number) => {
                    const label = String(owner?.columnValue ?? 'Null');
                    // Fallback to columnValue when id is null/undefined to avoid selecting all items at once.
                    const value = String(owner?.id ?? owner?.columnValue ?? `owner-${index}`);

                    if (!acc.some(option => option.label === label && option.value === value)) {
                        acc.push({ label, value });
                    }

                    return acc;
                },
                [],
            );
            const marketData = convertOptions(allFiltersData.Market, 'columnValue', 'id');
            const geographyData = convertOptions(allFiltersData['Geography Level'], 'columnValue', 'id');
            const siteData = convertOptions(allFiltersData.Site, 'columnValue', 'id');
            const teamData = convertOptions(allFiltersData.Team, 'columnValue', 'columnValue');
            const versionData = convertOptions(
                allFiltersData.Version,
                'columnValue',
                'columnValue',
            );
            const statusData = convertOptions(
                allFiltersData.Status,
                'columnValue',
                'columnValue',
            );

            const finalObj = {
                tool: applicationData,
                toolType: toolTypeData,
                function: functionData,
                toolOwner: appOwnerData,
                geography: geographyData,
                market: marketData,
                site: siteData,
                team: teamData,
                version: versionData,
                subFunctionData: subFunctionData,
                status: statusData
            };
            updatePreviousFilters(finalObj);
            setDefaultFilters(finalObj);
        }
    }, []);

    useEffect(() => {
        addDefaultFilters(filtersData);
    }, [filtersData]);

    return (
        <Flex vertical className={styles['am-container']} gap={24}>
            <Flex justify="space-between">
                <Flex vertical gap={8}>
                    <Label type="body1">
                        <span className={styles['am-card-title']}>All Tools</span>
                    </Label>
                    <Label type="body2">
                        <span className={styles['am-card-description']}>
                            Click on a tool name to view more details
                        </span>
                    </Label>
                </Flex>
                <div>
                    {selectedAppsFromChild.length > 0 ? (
                        <div className={styles['buttons-multiple']}>{buttons}</div>
                    ) : (
                        <div className={styles['search-box']}>
                            <SearchInput
                                isAnimatedSearch={true}
                                menuButtonProps={{
                                    onClick: column => {
                                        setSearchColumn(column.value);
                                    },
                                    options: [
                                        {
                                            label: 'Tools',
                                            value: 'tool',
                                        },
                                        {
                                            label: 'Function',
                                            value: 'function',
                                        },
                                        {
                                            label: 'Team',
                                            value: 'team',
                                        },
                                        {
                                            label: 'Version',
                                            value: 'version',
                                        },
                                        {
                                            label: 'Tool Owner',
                                            value: 'toolOwner',
                                        },
                                        {
                                            label: 'Region',
                                            value: 'region',
                                        },
                                        {
                                            label: 'Market',
                                            value: 'market',
                                        },
                                        {
                                            label: 'Site',
                                            value: 'site',
                                        },
                                    ],
                                    text: 'Tools',
                                    optionContainerClass: styles['search-box-container'],
                                }}
                                onChange={(text: string | string[]) => {
                                    if (typeof text === 'string') {
                                        setSearchText(text);
                                    }
                                }}
                                placeholder="Search"
                                menuButton={true}
                            />
                        </div>
                    )}
                </div>
            </Flex>
            {filters.length > 0 && (
                <Flex gap={8}>
                    <AppliedFilters
                        onReset={onResetFilters}
                        filters={filters}
                        setNewFilters={setNewFilters}
                        defaultFilters={defaultFilters}
                        existingFilters={filters}
                    />
                </Flex>
            )}
            <ApplicationDataTable
                toolDetails={toolDetails}
                geographicalRegion={geographicalRegion}
                ownerNames={ownerNames}
                openDialog={(option: { type: string, appName: string, toolId: number, status: string }) => {
                    setShouldDisplayDialog(true)
                    setAppNamesString(option.appName)
                    setSelectedToolData({ id: option.toolId, active: option.status !== "Active" })
                    if (option.type === "deleteAction") {
                        setDialogData({
                            id: 0,
                            variant: 'HeaderTitleIcon',
                            title: "Confirm Deletion",
                            description: `Are you sure you want to delete the application ${option.appName}`,
                            primaryButtonText: "Delete",
                            secondaryButtonText: "Don't Delete",
                        })
                    } else {
                        const description = option.status === "Active" ? "Are you sure you want to change the status to “Inactive”. The tool will be removed from command center until active." : "Are you sure you want to change the status to “Active”. The tool will be added to the command center until inactive"
                        setDialogData({
                            id: 1,
                            variant: "Neutral",
                            title: `Set as ${option.status === "Active" ? "Inactive" : "Active"}`,
                            description: description,
                            primaryButtonText: `Set as ${option.status === "Active" ? "Inactive" : "Active"}`,
                            secondaryButtonText: "Cancel",
                        })
                    }
                }}
                applicationData={applicationData}
                pageSize={pageSize}
                pageNumber={pageNumber}
                handleSorting={handleSorting}
                handlePageChange={handlePageChange}
                handlePageSizeChange={handlePageSizeChange}
                totalRows={totalRows}
                loading={loading}
                searchText={searchText}
                defaultFilters={defaultFilters}
                filtersData={filtersData}
                existingFilters={filters}
                setNewFilters={setNewFilters}
                renderButtons={setButtons}
                setAppNamesString={setAppNamesString}
                setIsAppDetailsUpdated={setIsAppDetailsUpdated}
                onSelectedAppsChange={setSelectedAppsFromChild}
            />
            <Toast
                type="Success"
                message={toastMessage}
                mode="Top Right"
                distance="x5l"
                toggle={toggleUpdateToast}
                timer={5000}
                onCloseToast={() => setToggleUpdateToast(false)}
            />

            <Dialog
                size="Small"
                variant={dialogData.variant}
                iconName={"trash-01"}
                content={
                    <>
                        <span>{dialogData.description}</span>
                    </>
                }
                isOpen={shouldDisplayDialog}
                onClose={() => setShouldDisplayDialog(false)}
                onPrimaryButtonClick={() => {
                    if (dialogData.id === 0) {
                        deleteToolAPI()
                    } else {
                        setActiveAndInactiveToolAPI()
                    }
                }}
                onSecondaryButtonClick={() => setShouldDisplayDialog(false)}
                primaryButtonText={dialogData.primaryButtonText}
                secondaryButtonText={dialogData.secondaryButtonText}
                title={dialogData.title}
                color="neutrals-B800"
                className={styles.wraptext}
            />
        </Flex>
    );
}

export default ToolManagementTable;
