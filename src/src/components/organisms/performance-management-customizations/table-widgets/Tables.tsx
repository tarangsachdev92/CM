import { Flex } from 'antd';
import { DropDown, Divider, ChartTypeButton, Table, Accordion } from 'konnect-react-components';
import { useEffect, useState, useCallback, forwardRef, useImperativeHandle, useMemo } from 'react';
import styles from '../PerformanceManagementCustomisations.module.scss';
import { Label } from '../../../atoms';
import { AppDispatch, RootState } from '../../../../store';
import { useDispatch, useSelector } from 'react-redux';
import { SimpleTableIcon } from '../../../../assets/icons/icons';
import { fetchPerformanceOverviewFilters } from '../../../../store/thunks/performanceManagementWidgets';
import { TableTypeString } from '../../../../store/slice/performanceWidgetsByTabSlice';
import TableHeader from './TableHeader';

interface ITables {
    widgetId: string;

    /** Fired whenever the number of templates “marked for add” changes */
    onTablesSelectedCountChange?: (count: number) => void;

    /** Gives the parent the full selected templates (to persist on Add) */
    onTableTemplatesSelected?: (templates: KpiOption[]) => void;
    onTableTypeSelected?: (tableType: TableTypeString | null) => void;
}

export type KpiOption = {
    label: string;
    value: string;
    category?: string;
};

interface PerformanceOverviewKpi {
    kpiId: number;
    kpiName: string;
}

type Column<T> = {
    key?: string;
    dataIndex?: keyof T;
    title: string;
    width?: string;
    children?: Column<T>[];
};

type TableRow = {
    key: number;
    franchise: string;
    brand: string;
    sku: string;
    week1: number;
    week2: number;
    week3: number;
    week4: number;
};

const columns: Column<TableRow>[] = [
    {
        title: 'Franchise',
        dataIndex: 'franchise',
        key: 'franchise',
        width: '150px',
    },
    {
        title: 'Brand',
        dataIndex: 'brand',
        key: 'brand',
        width: '150px',
    },
    {
        title: 'SKU',
        dataIndex: 'sku',
        key: 'sku',
        width: '120px',
    },
    {
        title: 'Group1',
        key: 'group1',
        children: [
            {
                title: 'APAC - Week 1',
                dataIndex: 'week1',
                key: 'week1',
                width: '100px',
            },
            {
                title: 'APAC - Week 2',
                dataIndex: 'week2',
                key: 'week2',
                width: '100px',
            },
            {
                title: 'APAC - Week 3',
                dataIndex: 'week3',
                key: 'week3',
                width: '100px',
            },
            {
                title: 'APAC - Week 4',
                dataIndex: 'week4',
                key: 'week4',
                width: '100px',
            },
        ],
    },
];

const data = Array.from({ length: 10 }).map((_, i) => ({
    key: i,
    franchise: 'Franchise',
    brand: 'Brand',
    sku: 'SKU',
    week1: 100,
    week2: 100,
    week3: 100,
    week4: 100,
}));

export const DemoKpiCard: React.FC = () => {
    const [currentPage, setCurrentPage] = useState(1);
    const [pageSize, setPageSize] = useState(10);

    const handlePageChange = (page: number) => setCurrentPage(page);
    const handlePageSizeChange = (size: number) => setPageSize(size);

    const largeData: TableRow[] = Array.from({ length: 12 }).map((_, i) => data[i % data.length]!);

    const paginatedData = useMemo(
        () => largeData.slice((currentPage - 1) * pageSize, currentPage * pageSize),
        [largeData, currentPage, pageSize],
    );
    return (
        <Table
            columns={columns}
            data={paginatedData}
            pagination={{
                totalItems: largeData.length,
                pageSize,
                currentPage,
                onPageChange: handlePageChange,
                onPageSizeChange: handlePageSizeChange,
            }}
        />
    );
};

/** Expose a reset handle to parent */
export type TablesHandle = {
    /** Clears all local selection state and notifies parent to reset counts */
    reset: () => void;
};

export const Tables = forwardRef<TablesHandle, ITables>(
    (
        { widgetId, onTablesSelectedCountChange, onTableTemplatesSelected, onTableTypeSelected },
        ref,
    ) => {
        const dispatch = useDispatch<AppDispatch>();
        const [kpiOptionsData, setKpiOptionsData] = useState<KpiOption[]>([]);
        const [selectedKpiValues, setSelectedKpiValues] = useState<KpiOption[]>([]);
        const [selectedTableType, setSelectedTableType] = useState<TableTypeString | null>(null);
        const [, setSelectedTemplatesToAdd] = useState<KpiOption[]>([]);
        const [isExistingTemplateMarked, setIsExistingTemplateMarked] = useState<boolean>(false);
        const [isTableOptionsExpanded, setIsTableOptionsExpanded] = useState<boolean>(true);

        const performanceOverviewFilters = useSelector(
            (state: RootState) => state.performanceOverviewFilter.performanceOverviewFilters,
        );

        useEffect(() => {
            dispatch(fetchPerformanceOverviewFilters({ performanceOverviewWidgetId: widgetId }));
        }, [dispatch, widgetId]);

        useEffect(() => {
            if (performanceOverviewFilters?.length && performanceOverviewFilters[0]?.kpIs) {
                const transformData = performanceOverviewFilters[0].kpIs.map(
                    (item: PerformanceOverviewKpi): KpiOption => ({
                        label: item.kpiName,
                        value: String(item.kpiId),
                    }),
                );
                setKpiOptionsData(transformData);
            }
        }, [performanceOverviewFilters]);

        const addCurrentSelectionToTemplates = useCallback(() => {
            if (isExistingTemplateMarked) {
                setSelectedTemplatesToAdd([]);
                setIsExistingTemplateMarked(false);
                onTablesSelectedCountChange?.(0);
                onTableTemplatesSelected?.([]);
                return;
            }

            if (!selectedKpiValues.length) return;

            setSelectedTemplatesToAdd(() => {
                onTablesSelectedCountChange?.(selectedKpiValues.length);
                onTableTemplatesSelected?.(selectedKpiValues);
                return selectedKpiValues;
            });

            setIsExistingTemplateMarked(true);
        }, [
            isExistingTemplateMarked,
            selectedKpiValues,
            onTablesSelectedCountChange,
            onTableTemplatesSelected,
        ]);

        useEffect(() => {
            if (selectedKpiValues.length === 0) {
                setIsExistingTemplateMarked(false);
            }
        }, [selectedKpiValues.length]);

        const previewWrapperClass = isExistingTemplateMarked
            ? `${styles['chart-category']} ${styles['chart-category-selected']}`
            : styles['chart-category'];

        /**
         * ✅ FIXED: Toggle table type selection
         * Selecting enables Add Widget
         * Deselecting disables Add Widget
         */
        const selectTableType = (t: TableTypeString) => {
            const nextType = selectedTableType === t ? null : t;
            setSelectedTableType(nextType);
            onTableTypeSelected?.(nextType);
        };

        const reset = useCallback(() => {
            setSelectedKpiValues([]);
            setSelectedTableType(null);
            setSelectedTemplatesToAdd([]);
            setIsExistingTemplateMarked(false);

            onTablesSelectedCountChange?.(0);
            onTableTemplatesSelected?.([]);
            onTableTypeSelected?.(null);
        }, [onTablesSelectedCountChange, onTableTemplatesSelected, onTableTypeSelected]);

        useImperativeHandle(ref, () => ({ reset }), [reset]);

        return (
            <>
                <Flex gap={16} vertical>
                    <Flex vertical>
                        <Label type="body2">Existing Templates</Label>
                        <Label type="body3">
                            <span className={styles['performance-overview-kpi-label']}>
                                Select a metric to preview existing tables used across command
                                center.
                            </span>
                        </Label>
                    </Flex>

                    <DropDown
                        className={styles['metric-dropdown']}
                        dropdown={{
                            isMultiSelect: true,
                            options: kpiOptionsData,
                            selectedOptions: selectedKpiValues,
                            showSelectAll: true,
                            selectAllOption: { label: 'Select All', value: 'all' },
                            onChange: ({ label, value }) => {
                                setSelectedKpiValues(prev =>
                                    prev.some(p => p.value === value)
                                        ? prev.filter(p => p.value !== value)
                                        : [...prev, { label, value }],
                                );
                            },
                            placeholder: 'Select from the list',
                            size: 'L',
                            type: 'checkbox',
                        }}
                        searchInput={{
                            searchPlaceholder: 'Search',
                            searchSize: 'L',
                        }}
                        id="drop-down"
                    />

                    {selectedKpiValues.length > 0 && (
                        <Flex
                            vertical
                            gap={16}
                            style={{ maxWidth: 840, cursor: 'pointer' }}
                            className={previewWrapperClass}
                            onClick={addCurrentSelectionToTemplates}
                            title="Click to add/remove this table"
                        >
                            <Label type="body2">Table</Label>
                            <TableHeader
                                title="PSI Projection"
                                subtitle="Geography | 2025"
                                appliedFilters={['Region: APAC', 'Category: Electronics']}
                                performanceStatus={[
                                    { label: 'MTD', value: 60, target: 40, type: 'Success' },
                                    { label: 'QTD', value: 52, target: 40, type: 'Warning' },
                                ]}
                                /* Widget actions */
                                onDeleteWidget={() => { }}
                                onDuplicateWidget={() => { }}
                                onEditWidget={() => { }}
                                /* ✅ Tab scoping (IMPORTANT) */
                                // activeTabId={activeTab.tabCode}
                                // widgetTabId={widget.tabId}

                                /* ✅ 7. Column Drilldown */
                                enableColumnDrilldown
                                columnDrilldownOptions={[
                                    { label: 'Year', value: 'year' },
                                    { label: 'Quarter', value: 'quarter' },
                                    { label: 'Month', value: 'month' },
                                    { label: 'Week', value: 'week' },
                                ]}
                                /* ✅ 8. Drilldown Buttons */
                                enableDrilldownButtons
                                /* ✅ 9. Row Hierarchy */
                                enableRowHierarchy
                                rowHierarchyOptions={[
                                    { label: 'Region', value: 'region' },
                                    { label: 'Country', value: 'country' },
                                    { label: 'City', value: 'city' },
                                ]}
                                /* ✅ Optional extras */
                                enableWidgetFilters
                                widgetFilterOptions={[
                                    { label: 'Top 10', value: 'top10' },
                                    { label: 'Bottom 10', value: 'bottom10' },
                                ]}
                            />
                        </Flex>
                    )}
                </Flex>

                <Divider size="thin" className={styles['performance-overview-divider']} />

                <Flex gap={16} vertical>
                    <Accordion
                        title="All Table Types"
                        description="Select a table type to customise from scratch."
                        outlined={false}
                        isExpanded={isTableOptionsExpanded}
                        leftRightSpaceZero
                        onToggle={() => setIsTableOptionsExpanded(prev => !prev)}
                        className={styles['table-options-accordion']}
                    >
                        <div className={styles['setup-flex']}>
                            <Flex
                                vertical
                                gap={12}
                                className={styles['chart-category']}
                            >
                                <Label type="body2">Simple Table</Label>
                                <Flex gap={12}>
                                    <ChartTypeButton
                                        icon={<SimpleTableIcon />}
                                        size={56}
                                        onClick={() => selectTableType('table')}
                                    />
                                </Flex>
                            </Flex>
                        </div>
                    </Accordion>
                </Flex>
            </>
        );
    },
);

export default Tables;
