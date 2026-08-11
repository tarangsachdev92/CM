import { Flex } from 'antd';
import { SearchInput } from 'konnect-react-components';
import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useLocation } from 'react-router-dom';
import { AppDispatch, RootState } from '../../../store';
import { convertOptions, removeElementByKey } from '../../../utils/helpers';
import { validateSearchInput, handleKeyDownValidation } from '../../../utils/validation';
import { Label } from '../../atoms';
import _ from 'lodash';
import { AppliedFilters } from '../../molecules';
import { FilterType } from '../../molecules/applied-filters/AppliedFilters';
import ForumManagementDataTable from './ForumManagementDataTable';
import styles from './ForumManagementTable.module.scss';
import { IColumnFilterData, IForumData, IForumFiltersData } from '../../../types/response';
import { IGetForumDetailsRequest } from '../../../types/request';
import { setCurrentPage } from '../../../store/slice/roleDataSlice';
import { getForumManagementDetails } from '../../../store/thunks/getForumManagementDetails';

type ForumTableProps = {
    onEditForum: (forum: IForumData) => void;
    refreshKey?: number;
    triggerToast: (message: string, type: 'Success' | 'Error' | 'Delete') => void;
    onRefreshDate?: (date: Date) => void;
};

function ForumManagementTable({ onEditForum, refreshKey, triggerToast,onRefreshDate }: ForumTableProps) {
    const dispatch = useDispatch<AppDispatch>();
    const location = useLocation();
    const [defaultFilters, setDefaultFilters] = useState<any>({
        forumName: [],
        functionName: [],
        subFunctionName: [],
        region: [],
        cluster: [],
        market: [],
        site: [],
        forumOwner1: [],
        repeatEveryType: [],
    });
    const {
        data: forums,
        columnFilters: filtersData,
        paginationData: pagination,
    } = useSelector((state: RootState) => state.forumDetails);
    const totalRows = pagination?.totalRows;

    const [filters, setFilters] = useState<FilterType[]>([]);
    const [pageNumber, setPageNumber] = useState(1);
    const [pageSize, setPageSize] = useState(10);
    const [searchText, setSearchText] = useState('');
    const [loading, setLoading] = useState(true);
    const [searchKeyword, setSearchKeyword] = useState('');
    const [sortColumn, setSortColumnName] = useState<string>('');
    const [sortDirection, setSortDirection] = useState<string>('');
    const [appliedFilters, setAppliedFilters] = useState<IColumnFilterData[]>([]);

    const matchingFilter = appliedFilters.find(filter =>
        filter?.columnValue.toLowerCase().includes(searchKeyword.toLowerCase()),
    );

    const fetchData = useCallback(async () => {
        setLoading(true);
        const request: IGetForumDetailsRequest = {
            pageSize,
            pageNumber,
            sortColumnName: sortColumn,
            sortDirection,
            searchKeyword,
            searchTerm: matchingFilter ? matchingFilter.columnName : 'forumName',
            gridFilters: appliedFilters.map(filter => ({
                ColumnName: filter.columnName,
                ColumnValue: filter.columnValue,
            })),
        };
        try {
           const response = await dispatch(getForumManagementDetails(request));
           
 if (response?.payload?.data?.length > 0) {
            const refreshDate = response.payload.data[0]?.refreshDate
                ? new Date(response.payload.data[0].refreshDate)
                : new Date();

            onRefreshDate?.(refreshDate);
        } else {
            onRefreshDate?.(new Date());
        }

        } finally {
            setLoading(false);
        }
    }, [
        dispatch,
        pageNumber,
        pageSize,
        sortColumn,
        sortDirection,
        searchKeyword,
        appliedFilters,
        matchingFilter,
    ]);

    useEffect(() => {
        fetchData();
    }, [fetchData, refreshKey]);

    useEffect(() => {
        if (location.state?.showToast) {
            triggerToast(location.state.toastMessage, location.state.toastType);
        }
    }, [location.state, triggerToast]);

    useEffect(() => {
        const appliedFilterArray: IColumnFilterData[] = [];
        filters.forEach(filter => {
            filter.selectedFilters.forEach(({ label, value }) => {
                const isStatus = label === 'Active' || label === 'InActive';
                appliedFilterArray.push({
                    columnName:filter.id,
                    columnValue: isStatus ? value : label,
                    id: isStatus ? null : String(value),
                });
            });
        });
        setAppliedFilters(appliedFilterArray);
        setPageNumber(1);
    }, [filters]);

    useEffect(() => {
        const delayDebounce = setTimeout(() => {
            setSearchKeyword(prev => {
                if (prev !== searchText) {
                    setPageNumber(1);
                }
                return searchText;
            });
        }, 500);
        return () => clearTimeout(delayDebounce);
    }, [searchText]);

    const updateAppliedFilters = useCallback(() => {
        const appliedFilterArray: IColumnFilterData[] = [];
        filters.map((filter: FilterType) => {
            filter.selectedFilters.map((selectedFilterObj: { label: string; value: string }) => {
                if (
                    selectedFilterObj.label !== 'Active' &&
                    selectedFilterObj.label !== 'InActive'
                ) {
                    const filterObj: IColumnFilterData = {
                        columnName: filter.id,
                        columnValue: selectedFilterObj.label,
                        id: String(selectedFilterObj.value),
                    };
                    appliedFilterArray.push(filterObj);
                } else {
                    const filterObj: IColumnFilterData = {
                        columnName: selectedFilterObj.label,
                        columnValue: selectedFilterObj.value,
                        id: null,
                    };
                    appliedFilterArray.push(filterObj);
                }
            });
        });
        setAppliedFilters([...appliedFilterArray]);
        setPageNumber(1);
    }, [filters]);
    useEffect(() => {
        updateAppliedFilters();
    }, [filters]);
    const onResetFilters = useCallback(() => {
        setFilters([]);
        setCurrentPage(1);
        return true;
    }, []);

    const onRemoveFilter = useCallback((filterKey: string, filterArray: Array<FilterType>) => {
        const newFilter = removeElementByKey(filterArray, 'id', filterKey);
        setFilters(newFilter);
    }, []);

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

    const filteredForums = useMemo(() => {
    if (!Array.isArray(forums)) return [];

    if (appliedFilters.length === 0 && !searchKeyword) return forums;

    // Group filters by columnName
    const filterMap = appliedFilters.reduce<Record<string, string[]>>((acc, filter) => {
        const key = filter.columnName;
        const value = filter.columnValue.toLowerCase();
        if (!acc[key]) acc[key] = [];
        acc[key].push(value);
        return acc;
    }, {});

    return forums.filter((forum) => {
        // Check if forum matches any value for each filter column
        const matchesFilters = Object.entries(filterMap).every(([column, values]) => {
            const forumValue = forum[column as keyof IForumData];
            return (
                forumValue &&
                values.some((val) =>
                    forumValue.toString().toLowerCase().includes(val)
                )
            );
        });

        const matchesSearch =
            !searchKeyword ||
            forum.forumName.toLowerCase().includes(searchKeyword.toLowerCase()) ||
            forum.forumId.toString().includes(searchKeyword);

        return matchesFilters && matchesSearch;
    });
}, [forums, appliedFilters, searchKeyword]);


    const handleSorting = async (columnName: string, order: string) => {
        if (order !== 'unsort') {
            setSortColumnName(columnName);
            setSortDirection(order);
        }
    };

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

    const addDefaultFilters = useCallback((allFiltersData: IForumFiltersData) => {
        if (allFiltersData) {
            const forumNameData = convertOptions(allFiltersData.forumName, 'columnValue', 'id');
            const functionData = convertOptions(allFiltersData.functionName, 'columnValue', 'id');
            const subFunctionData = convertOptions(allFiltersData.subFunctionName, 'columnValue', 'id');
            // Fix case-sensitive property names here
            const regionData = convertOptions(allFiltersData.Region, 'columnValue', 'id');
            const clusterData = convertOptions(allFiltersData.Cluster, 'columnValue', 'id');
            const marketData = convertOptions(allFiltersData.Market, 'columnValue', 'id');
            const siteData = convertOptions(allFiltersData.Site, 'columnValue', 'id');
            const forumLevel = convertOptions(allFiltersData.forumLevel, 'columnValue', 'id');
            const forumPeriod = convertOptions(allFiltersData.forumPeriod, 'columnValue', 'id');
            const ownerData = convertOptions(
                allFiltersData.forumOwner,
                'columnValue',
                'id',
            );
            const repeatEveryData = convertOptions(
                allFiltersData.repeatsEveryType,
                'columnValue',
                'columnValue',
            );
            const finalObj = {
                forumName: forumNameData,
                functionName: functionData,
                subFunctionName : subFunctionData,
                region: regionData,
                cluster: clusterData,
                market: marketData,
                site: siteData,
                forumOwner1: ownerData,
                repeatEvery: repeatEveryData,
                forumLevel:forumLevel,
                 forumPeriod:forumPeriod,
            };

            updatePreviousFilters(finalObj);
            setDefaultFilters(finalObj);
        }
    }, []);

    useEffect(() => {
        addDefaultFilters(filtersData);
    }, [filtersData]);

    return (
        <Flex vertical className={styles['rm-container']} gap={24}>
            <Flex justify="space-between">
                <Flex vertical gap={8}>
                    <Label type="body1">
                        <span className={styles['rm-card-title']}>All Forums</span>
                    </Label>
                    <Label type="body2">
                        <span className={styles['rm-card-description']}>
                            You can edit or delete any forum by clicking the icons in the actions
                            column
                        </span>
                    </Label>
                </Flex>
                {(searchText !== '' || (forums && forums.length > 0)) && (
                    <div
                        className={styles['search-box']}
                        onKeyDown={(event: React.KeyboardEvent<HTMLInputElement>) => {
                            handleKeyDownValidation(event);
                        }}
                    >
                        <SearchInput
                            isAnimatedSearch={true}
                            onChange={(text: string | string[]) => {
                                if (typeof text === 'string') {
                                    const validatedText = validateSearchInput(text);
                                    setSearchText(validatedText);
                                    if (validatedText === '') {
                                        setSearchKeyword('');
                                    }
                                }
                            }}
                            placeholder="Search"
                            menuButton={true}
                        />
                    </div>
                )}
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

            <ForumManagementDataTable
                defaultFilters={defaultFilters}
                filtersData={filtersData}
                setNewFilters={setNewFilters}
                existingFilters={filters}
                forumData={filteredForums}
                pageSize={pageSize}
                pageNumber={pageNumber}
                handleSorting={handleSorting}
                handlePageChange={setPageNumber}
                handlePageSizeChange={setPageSize}
                totalRows={totalRows}
                loading={loading}
                searchText={searchText}
                refreshData={fetchData}
                appliedFilters={appliedFilters}
                onEditForum={onEditForum}
                triggerToast={triggerToast}
            />
        </Flex>
    );
}

export default ForumManagementTable;