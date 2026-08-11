import { Flex } from 'antd';
import { Pagination } from 'konnect-react-components';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { NoMatchesFound, RoleManagementEmptyState } from '../../../assets/images/images';
import {
    AppDispatch,
    fetchFunctions,
    fetchGeographicalRegion,
    fetchSubfunctionsOnMultipleFunctionIds,
    getAppAndReports,
    getAppAndReportsFavourite,
    RootState,
} from '../../../store';
import { IAppSReportItem } from '../../../types/request';
import { Label } from '../../atoms';
import AppReportGrid from './AppReportGrid';
import styles from './AppsAndReportsLandingPage.module.scss';
import FilterFlyout from './FilterFlyout';
import { ToolType } from '../../../utils/constants';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { addRecentlyOpenedAppsAndReports } from '../../../store';
import { useTranslation } from 'react-i18next';
import { logError } from '../../../utils/helpers';

type FilterOption = { label: string; value: number };

type AppliedFiltersType = {
    region: FilterOption[];
    function: FilterOption[];
    subFunction: FilterOption[];
    reportType: FilterOption[];
};

interface AppReport {
    objectId: number;
    objectName: string;
    objectType: string;
    description: string;
    objectOwner: string;
    isFavourite: boolean;
    documentationURL: string | null;
    totalCount: number;
    totalRows: number;
    totalPages: number;
    applicationURL: string | null;
}

interface Pagination {
    totalRows: number;
    totalPages: number;
}

interface FavouriteCount {
    totalAppFavourites: number;
    totalReportFavourites: number;
}

interface AppReportsResponse {
    data: {
        data: AppReport[];
        pagination: Pagination;
        favouriteCount: FavouriteCount;
    };
}

interface AppReportsState {
    data: AppReportsResponse;
    statusCode: number;
    message: string | null;
}

const AppsAndReports = () => {
    const { t } = useTranslation('digital-tools-library', { useSuspense: false });
    const dispatch = useDispatch<AppDispatch>();
    const appsAndReports = useSelector(
        (state: RootState) => state.appReportsCardsData,
    ) as unknown as AppReportsState;
    const LOCAL_STORAGE_KEY = 'selectedCategory';
    const [currentPage, setCurrentPage] = useState(1);
    const [pageSize, setPageSize] = useState(10);
    const [isLoading, setLoading] = useState(false);
    const [searchTerm, setSearchTerm] = useState('');

    const getInitialCategory = (): 'App' | 'Report' => {
        const saved = localStorage.getItem(LOCAL_STORAGE_KEY);
        return saved === 'App' || saved === 'Report' ? saved : 'App';
    };

    const selectedCategoryRef = useRef<'App' | 'Report'>(getInitialCategory());

    const [selectedCategory, setSelectedCategory] = useState<'App' | 'Report'>(
        selectedCategoryRef.current,
    );
    const [paginatedData, setPaginatedData] = useState<any>();
    const [totalItems, setTotalItems] = useState<number>(0);
    const [isFilterFlyoutOpen, setIsFilterFlyoutOpen] = useState<boolean>(false);
    const [isFavoriteClicked, setIsFavoriteClicked] = useState<boolean>(false);
    const [isResetButtonClicked, setIsResetButtonClicked] = useState<boolean>(false);
    const [totalFavouriteCount, setTotalFavouriteCount] = useState(0);

    // Dropdowns
    const [regionDD, setRegionDD] = useState<{ label: string; value: number }[]>([]);
    const [functionDD, setFunctionDD] = useState<{ label: string; value: number }[]>([]);
    const [subfunctionDD, setSubfunctionDD] = useState<{ label: string; value: number }[]>([]);
    const [reportTypeDD, setReportTypeDD] = useState<{ label: string; value: number }[]>([]);

    // Selected values
    const [selectedRegion, setSelectedRegion] = useState<{ label: string; value: number }[]>([]);
    const [selectedFunction, setSelectedFunction] = useState<{ label: string; value: number }[]>(
        [],
    );
    const [hasAccess, setHasAccess] = useState(true);
    const [selectedSubfunction, setSelectedSubfunction] = useState<
        { label: string; value: number }[]
    >([]);
    const [selectedReportType, setSelectedReportType] = useState<
        { label: string; value: number }[]
    >([]);
    const [previousFilterSelection, setPreviousFilterSelection] = useState<{
        region: { label: string; value: number }[];
        function: { label: string; value: number }[];
        subFunction: { label: string; value: number }[];
        reportType: { label: string; value: number }[];
    }>({
        region: [],
        function: [],
        subFunction: [],
        reportType: [],
    });

    const favouritesUpdated = useSelector(
        (state: RootState) => state.appReportsCardsData.favouritesUpdated,
    );

    const geographicalRegion = useSelector(
        (state: RootState) => state.fetchGeographicalInformation.data.regions,
    );
    const functionalInformation = useSelector(
        (state: RootState) => state.fetchFunctionSubfunctionInformation,
    );
    const allFunctions = functionalInformation.data.functions;
    const multipleSubfunctions = functionalInformation.data.subfunctions;
    const [filterRenderKey, setFilterRenderKey] = useState(0);
    const [appliedFilters, setAppliedFilters] = useState<AppliedFiltersType>({
        region: [],
        function: [],
        subFunction: [],
        reportType: [],
    });
    const latestSelectedFunctionsRef = useRef<{ label: string; value: number }[]>([]);
    const navigate = useNavigate();
    const [searchParams] = useSearchParams();

    // Sync category from URL query param which is done by breadcrumb navigation
    useEffect(() => {
        const categoryParam = searchParams.get('category');
        if (categoryParam === 'App' || categoryParam === 'Report') {
            selectedCategoryRef.current = categoryParam;
            setSelectedCategory(categoryParam);
            localStorage.setItem(LOCAL_STORAGE_KEY, categoryParam);
        }
    }, [searchParams]);

    const filters = useMemo(
        () => [
            {
                id: 'region',
                title: t('filters.region'),
                selectedFilters: appliedFilters.region.map(f => ({ ...f, value: String(f.value) })),
                defaultFilters: regionDD.map(f => ({ ...f, value: String(f.value) })),
                onClose: () => {
                    setSelectedRegion([]);
                    setAppliedFilters(prev => ({
                        ...prev,
                        region: [],
                    }));
                },
            },
            {
                id: 'function',
                title: t('filters.function'),
                selectedFilters: appliedFilters.function.map(f => ({
                    ...f,
                    value: String(f.value),
                })),
                defaultFilters: functionDD.map(f => ({ ...f, value: String(f.value) })),
                onClose: () => {
                    setSelectedFunction([]);
                    setAppliedFilters(prev => ({
                        ...prev,
                        function: [],
                    }));
                },
            },
            {
                id: 'subFunction',
                title: t('filters.subFunction'),
                selectedFilters: appliedFilters.subFunction.map(f => ({
                    ...f,
                    value: String(f.value),
                })),
                defaultFilters: subfunctionDD.map(f => ({ ...f, value: String(f.value) })),
                onClose: () => {
                    setSelectedSubfunction([]);
                    setAppliedFilters(prev => ({
                        ...prev,
                        subFunction: [],
                    }));
                },
            },
            {
                id: 'reportType',
                title: t('filters.reportType'),
                selectedFilters: appliedFilters.reportType.map(f => ({
                    ...f,
                    value: String(f.value),
                })),
                defaultFilters: reportTypeDD.map(f => ({ ...f, value: String(f.value) })),
                onClose: () => {
                    setSelectedReportType([]);
                    setAppliedFilters(prev => ({
                        ...prev,
                        reportType: [],
                    }));
                },
            },
        ],
        [appliedFilters, regionDD, functionDD, subfunctionDD, reportTypeDD, t],
    );

    const setNewFilters = (
        filterName: string,
        _filterTitle: string,
        filterArray: Array<{ label: string; value: number }>,
    ) => {
        let updatedSelectedFunction = selectedFunction;
        let updatedSelectedSubfunction = selectedSubfunction;

        if (filterName === 'function') {
            updatedSelectedFunction = filterArray;
            latestSelectedFunctionsRef.current = filterArray;

            // Compute valid subfunctions immediately
            const selectedFunctionIds = filterArray.map(f => Number(f.value));
            const validSubfunctions = multipleSubfunctions
                .filter(sub => selectedFunctionIds.includes(Number(sub.functionId)))
                .map(sub => sub.subFunctionId);

            updatedSelectedSubfunction = selectedSubfunction.filter(sub =>
                validSubfunctions.includes(Number(sub.value)),
            );

            setSelectedFunction(updatedSelectedFunction);
            setSelectedSubfunction(updatedSelectedSubfunction);
        }

        switch (filterName) {
            case 'region':
                setSelectedRegion(filterArray);
                break;

            case 'subFunction':
                updatedSelectedSubfunction = filterArray;
                setSelectedSubfunction(updatedSelectedSubfunction);
                break;

            case 'reportType':
                setSelectedReportType(filterArray);
                break;
        }

        const updatedFilters = {
            region: filterName === 'region' ? filterArray : selectedRegion,
            function: filterName === 'function' ? updatedSelectedFunction : selectedFunction,
            subFunction:
                filterName === 'function'
                    ? updatedSelectedSubfunction
                    : filterName === 'subFunction'
                      ? filterArray
                      : selectedSubfunction,
            reportType: filterName === 'reportType' ? filterArray : selectedReportType,
        };

        setAppliedFilters(updatedFilters);
        setPreviousFilterSelection(updatedFilters);
        setFilterRenderKey(prev => prev + 1); // Force re-render of AppliedFilters
    };

    useEffect(() => {
        localStorage.setItem(LOCAL_STORAGE_KEY, selectedCategory);
    }, [selectedCategory]);
    const onReset = () => {
        setSelectedRegion([]);
        setSelectedFunction([]);
        setSelectedSubfunction([]);
        setSelectedReportType([]);
        setSelectedCategory(selectedCategory);
        setPreviousFilterSelection({
            region: [],
            function: [],
            subFunction: [],
            reportType: [],
        });
        setAppliedFilters({
            region: [],
            function: [],
            subFunction: [],
            reportType: [],
        });
    };

    const handleSearchChange = (value: string | string[]) => {
        const searchValue = Array.isArray(value) ? value[0] : value;
        setSearchTerm(searchValue ?? '');
    };

    const handleCategoryChange = (value: string) => {
        if (value === 'App' || value === 'Report') {
            selectedCategoryRef.current = value;
            setSelectedCategory(value);
        }
    };

    const handleFavoriteToggle = async (item: IAppSReportItem, selectedCategory: string) => {
        const newFavouriteStatus = !item.isFavourite;

        if (newFavouriteStatus && totalFavouriteCount >= 5) {
            return;
        }

        setPaginatedData((prevData: AppReport[]) => {
            if (isFavoriteClicked && !newFavouriteStatus) {
                // Remove item from list if it's being unfavorited while in favorites view
                setTotalItems(prev => prev - 1);
                return prevData.filter(prevItem => prevItem.objectId !== item.objectId);
            } else {
                return prevData.map(prevItem =>
                    prevItem.objectId === item.objectId
                        ? { ...prevItem, isFavourite: newFavouriteStatus }
                        : prevItem,
                );
            }
        });
        const payload = {
            objectId: item.objectId,
            objectType: selectedCategory === 'App' ? ToolType.Application : ToolType.Report,
            isFavourite: newFavouriteStatus,
        };

        try {
            await dispatch(getAppAndReportsFavourite(payload)).unwrap();
            setTotalFavouriteCount(prev => (newFavouriteStatus ? prev + 1 : Math.max(prev - 1, 0)));
        } catch {
            setPaginatedData((prevData: AppReport[]) => {
                if (isFavoriteClicked && !item.isFavourite) {
                    // Re-add the item if it was removed
                    return [...prevData, { ...item, isFavourite: true }];
                } else {
                    return prevData.map(prevItem =>
                        prevItem.objectId === item.objectId
                            ? { ...prevItem, isFavourite: item.isFavourite }
                            : prevItem,
                    );
                }
            });
        } finally {
            setLoading(false);
        }
    };

    const handlePageChange = (page: number) => {
        setCurrentPage(page);
        setLoading(true);
    };

    const handlePageSizeChange = (size: number) => {
        setPageSize(size);
        setCurrentPage(1);
        setLoading(true);
    };

    const syncSelectedToAppliedFilters = () => {
        setAppliedFilters({
            region: selectedRegion,
            function: selectedFunction,
            subFunction: selectedSubfunction,
            reportType: selectedReportType,
        });
    };

    useEffect(() => {
        const count =
            (appsAndReports.data?.data?.favouriteCount?.totalAppFavourites ?? 0) +
            (appsAndReports.data?.data?.favouriteCount?.totalReportFavourites ?? 0);
        setTotalFavouriteCount(count);
    }, [appsAndReports]);

    useEffect(() => {
        setLoading(true);
        const getObjectType = () => {
            const reportTypes = appliedFilters.reportType.map(rt => rt.label);

            if (reportTypes.length === 2) return null;

            if (reportTypes.length === 1) {
                if (reportTypes[0] === 'App') return 'Application';
                if (reportTypes[0] === 'Report') return 'Report';
            }

            // Fallback to selectedCategoryRef
            if (selectedCategoryRef.current === 'App') return 'Application';
            if (selectedCategoryRef.current === 'Report') return 'Report';

            return selectedCategoryRef.current || null;
        };

        const payload = {
            objectType: getObjectType(),
            objectName: searchTerm ?? null,
            pageNumber: searchTerm.length > 1 ? 1 : currentPage,
            pageSize: pageSize,
            regionId: appliedFilters.region.map(region => region.value).join(','),
            functionId: appliedFilters.function.map(func => func.value).join(','),
            subFunctionId: appliedFilters.subFunction.map(func => func.value).join(','),
            isFavourite: isFavoriteClicked ? 1 : null,
        };
        if (!isResetButtonClicked) {
            dispatch(getAppAndReports(payload))
                .then(() => {
                    setLoading(false);
                })
                .catch(() => {
                    setLoading(false);
                });
        }
    }, [
        dispatch,
        isFavoriteClicked,
        searchTerm,
        selectedCategory,
        currentPage,
        pageSize,
        previousFilterSelection,
        appliedFilters,
        isResetButtonClicked,
        favouritesUpdated,
    ]);

    useEffect(() => {
        if (isResetButtonClicked) {
            setIsResetButtonClicked(false);
        }
    }, [isResetButtonClicked]);

    useEffect(() => {
        dispatch(fetchGeographicalRegion());
        dispatch(fetchFunctions());
        setReportTypeDD([
            { label: 'App', value: 1 },
            { label: 'Report', value: 2 },
        ]);
    }, [dispatch]);

    useEffect(() => {
        if (geographicalRegion.length > 0) {
            setRegionDD(
                geographicalRegion.map(region => ({
                    label: region.regionName,
                    value: region.regionId,
                })),
            );
        }
    }, [geographicalRegion]);

    useEffect(() => {
        if (allFunctions.length > 0) {
            setFunctionDD(
                allFunctions.map(func => ({
                    label: func.functionName ?? '',
                    value: func.functionId,
                })),
            );
        }
    }, [allFunctions]);

    useEffect(() => {
        const functionIds = selectedFunction.map(func => func.value);
        if (functionIds.length > 0) {
            dispatch(fetchSubfunctionsOnMultipleFunctionIds({ functionIds })).catch(error => {
                logError('Failed to fetch subfunctions:', error);
            });
        } else {
            // If no functions are selected, reset
            setSubfunctionDD([]);
            setSelectedSubfunction([]);
        }
    }, [selectedFunction, dispatch]);

    useEffect(() => {
        const functionIds = selectedFunction.map(func => Number(func.value));
        const updatedSubfunctions = multipleSubfunctions
            .filter(sub => functionIds.includes(sub.functionId))
            .map(sub => ({
                label: sub.subFunctionName ?? '',
                value: sub.subFunctionId,
            }));
        setSubfunctionDD(updatedSubfunctions);
        // Filter out subfunctions that no longer belong to selected functions
        setSelectedSubfunction(prev =>
            prev.filter(sel =>
                updatedSubfunctions.some(sub => Number(sub.value) === Number(sel.value)),
            ),
        );
    }, [selectedFunction, multipleSubfunctions]);

    useEffect(() => {
        setLoading(true);
        const appData = Array.isArray(appsAndReports?.data?.data?.data)
            ? appsAndReports.data.data.data
            : [];
        setPaginatedData(appData);
        const totalRows = appsAndReports?.data?.data?.pagination?.totalRows;
        const total = typeof totalRows === 'number' ? totalRows : appData.length;
        setTotalItems(total);
        const noFiltersApplied =
            !searchTerm &&
            selectedRegion.length === 0 &&
            selectedFunction.length === 0 &&
            selectedSubfunction.length === 0 &&
            selectedReportType.length === 0 &&
            !isFavoriteClicked;
        setTotalItems(typeof totalRows === 'number' ? totalRows : appData.length);
        setHasAccess(!(total === 0 && noFiltersApplied));
        setLoading(false);
    }, [appsAndReports, isFavoriteClicked]);

    const handleFavoriteButtonToggle = useCallback(() => {
        setIsFavoriteClicked(prev => !prev);
    }, []);

    const noRecordsFound = () => {
        const isFilterActive =
            selectedRegion.length > 0 ||
            selectedFunction.length > 0 ||
            selectedSubfunction.length > 0 ||
            selectedReportType.length > 0;

        const showAccessMessage = !hasAccess || isFilterActive;

        return (
            <Flex
                vertical
                className={styles['am-empty-state']}
                align="center"
                justify="center"
                gap={16}
            >
                <Flex vertical align="center" justify="center" gap={2}>
                    {showAccessMessage ? <RoleManagementEmptyState /> : <NoMatchesFound />}
                    <Flex vertical align="center" justify="center" gap={4}>
                        <Label type="body1">
                            <span className={styles['am-empty-state-title']}>
                                {showAccessMessage ? t('noToolsFound') : t('noMatchesFound')}
                            </span>
                        </Label>
                        <Label type="body2">
                            <span className={styles['am-empty-state-description']}>
                                {showAccessMessage
                                    ? t('noToolsFoundDescription')
                                    : t('noMatchesFoundDescription')}
                            </span>
                        </Label>
                    </Flex>
                </Flex>
            </Flex>
        );
    };

    const noFavoritesFound = () => {
        return (
            <Flex
                vertical
                className={styles['am-empty-state']}
                align="center"
                justify="center"
                gap={16}
            >
                <Flex vertical align="center" justify="center" gap={16}>
                    <Flex vertical align="center" justify="center" gap={4}>
                        <Label type="body1">
                            <span className={styles['am-empty-state-title']}>
                                {t('noFavoritesFound')}
                            </span>
                        </Label>
                        <Label type="body2">
                            <span className={styles['am-empty-state-description']}>
                                {t('noFavoritesFoundDescription')}
                            </span>
                        </Label>
                    </Flex>
                </Flex>
            </Flex>
        );
    };

    const openApplicationOrReport = (
        id: string,
        toolName: string,
        toolType: string,
        description?: string,
    ) => {
        if (id && toolName) {
            dispatch(
                addRecentlyOpenedAppsAndReports({
                    objectId: Number(id),
                    objectType: toolType,
                }),
            );

            navigate(`${toolType}/${id}/${toolName}`, {
                state: { description: description?.trim() ?? '' },
            });
        }
    };

    return (
        <>
            {isLoading && <div></div>}
            <Flex vertical gap={8} className={styles['apps-and-reports-title']}>
                <Flex align="center" gap={8} justify="space-between">
                    <Flex align="flex-start" gap={16}>
                        <Flex justify="flex-start" vertical gap={8}>
                            <Label type="h2">
                                <span className={styles['apps-and-reports-heading']}>
                                    {t('title')}
                                </span>
                            </Label>
                            <Label type="body2">
                                <span className={styles['apps-and-reports-description']}>
                                    {t('description')}
                                </span>
                            </Label>
                        </Flex>
                    </Flex>
                </Flex>
            </Flex>

            <AppReportGrid
                selectedCategory={selectedCategory}
                setSelectedCategory={(value: string) => {
                    if (value === 'App' || value === 'Report') {
                        selectedCategoryRef.current = value;
                        setSelectedCategory(value);
                    }
                }}
                handleCategoryChange={handleCategoryChange}
                handleSearchChange={handleSearchChange}
                isFavoriteClicked={isFavoriteClicked}
                handleFavoriteButtonToggle={handleFavoriteButtonToggle}
                setIsFilterFlyoutOpen={setIsFilterFlyoutOpen}
                setIsResetButtonClicked={setIsResetButtonClicked}
                setPreviousFilterSelection={setPreviousFilterSelection}
                selectedRegion={selectedRegion}
                selectedFunction={selectedFunction}
                selectedSubfunction={selectedSubfunction}
                selectedReportType={selectedReportType}
                loading={isLoading}
                totalItems={totalItems}
                paginatedData={paginatedData}
                handleFavoriteToggle={handleFavoriteToggle}
                currentPage={currentPage}
                handlePageChange={handlePageChange}
                handlePageSizeChange={handlePageSizeChange}
                pageSize={pageSize}
                noFavoritesFound={noFavoritesFound}
                noRecordsFound={noRecordsFound}
                filters={filters}
                setNewFilters={setNewFilters}
                onReset={onReset}
                filterRenderKey={filterRenderKey}
                regionDD={regionDD}
                functionDD={functionDD}
                subfunctionDD={subfunctionDD}
                reportTypeDD={reportTypeDD}
                openApplicationOrReport={openApplicationOrReport}
                totalFavouriteCount={totalFavouriteCount}
            />
            <FilterFlyout
                isOpen={isFilterFlyoutOpen}
                setIsOpen={setIsFilterFlyoutOpen}
                onClose={() => {
                    setSelectedRegion([]);
                    setSelectedFunction([]);
                    setSelectedSubfunction([]);
                    setSelectedReportType([]);
                    setIsFilterFlyoutOpen(false);
                }}
                regionDD={regionDD}
                functionDD={functionDD}
                subfunctionDD={subfunctionDD}
                reportTypeDD={reportTypeDD}
                selectedRegion={selectedRegion}
                setSelectedRegion={setSelectedRegion}
                selectedFunction={selectedFunction}
                setSelectedFunction={setSelectedFunction}
                selectedSubfunction={selectedSubfunction}
                setSelectedSubfunction={setSelectedSubfunction}
                selectedReportType={selectedReportType}
                setSelectedReportType={setSelectedReportType}
                setSubfunctionDD={setSubfunctionDD}
                previousFilterSelection={previousFilterSelection}
                setPreviousFilterSelection={setPreviousFilterSelection}
                searchTerm={searchTerm}
                setIsFavoriteClicked={setIsFavoriteClicked}
                currentPage={currentPage}
                pageSize={pageSize}
                isFavoriteClicked={isFavoriteClicked}
                selectedCategory={selectedCategory}
                setSelectedCategory={setSelectedCategory}
                dispatch={dispatch}
                setFilterRenderKey={setFilterRenderKey}
                setAppliedFilters={setAppliedFilters}
                syncSelectedToAppliedFilters={syncSelectedToAppliedFilters}
            />
        </>
    );
};

export default AppsAndReports;
