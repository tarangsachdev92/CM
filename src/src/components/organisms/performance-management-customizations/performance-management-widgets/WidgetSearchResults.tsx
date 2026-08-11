import { useMemo } from 'react';
import { Flex } from 'antd';
import styles from '../PerformanceManagementCustomisations.module.scss';
import { Label } from '../../../atoms';
import { Icon, SideMenu, KpiCards } from 'konnect-react-components';
import { NoWidgetsFound } from '../../../../assets/images/images';

type KpiCardDummyItem = {
    widgetId: number;
    widgetName: string;
    widgetTypeId: number;
    kpi: string;
    selectedMetric: string;
    keywords?: string[];
};

export interface WidgetSearchResultsProps {
    searchTerm: string;
    selectedWidgetTypeId: number | null;
}

/**
 * Dummy dataset (temporary)
 */
const DUMMY_SEARCH_WIDGETS: KpiCardDummyItem[] = [
    {
        widgetId: 101,
        widgetName: 'Single KPI',
        widgetTypeId: 1,
        kpi: 'GTS',
        selectedMetric: '(%)',
        keywords: ['performance', 'overview', 'kpi', 'gts'],
    },
    {
        widgetId: 102,
        widgetName: 'Single KPI',
        widgetTypeId: 1,
        kpi: 'OTIF-D',
        selectedMetric: '(%)',
        keywords: ['otif', 'delivery', 'tracker'],
    },
    {
        widgetId: 201,
        widgetName: 'Single KPI',
        widgetTypeId: 2,
        kpi: 'Field Actions',
        selectedMetric: '(%)',
        keywords: ['chart', 'line', 'trend', 'field'],
    },
    {
        widgetId: 202,
        widgetName: 'Single KPI',
        widgetTypeId: 2,
        kpi: 'Volume',
        selectedMetric: '(%)',
        keywords: ['chart', 'bar', 'volume'],
    },
    {
        widgetId: 301,
        widgetName: 'Single KPI',
        widgetTypeId: 3,
        kpi: 'KPI Status',
        selectedMetric: '(%)',
        keywords: ['scorecard', 'status', 'summary'],
    },
];

const buildKpiCardsData = (kpi: string, selectedMetric: string) => {
    return {
        currentPeriodValue: 4,
        currentPeriodValueColor: 'green' as const,
        date: 'Jul 2024',
        deviation: 'decrease' as const,
        deviationString: '2.4% vs PM',
        deviationValueColor: 'green' as const,
        kpi,
        metricData: [
            { forecast: false, month: 'January', showInXAxis: true, target: 3, value: 1 },
            { forecast: false, month: 'February', showInXAxis: false, target: 3, value: 6 },
            { forecast: false, month: 'March', showInXAxis: false, target: 3, value: 4 },
            { forecast: false, month: 'April', showInXAxis: false, target: 3, value: 3 },
            { forecast: false, month: 'May', showInXAxis: false, target: 3, value: 4 },
            { forecast: false, month: 'Jun', showInXAxis: true, target: 3, value: 12 },
            { forecast: false, month: 'July', showInXAxis: false, target: 3, value: 2 },
            { forecast: false, month: 'August', showInXAxis: false, target: 3, value: 10 },
            { forecast: false, month: 'September', showInXAxis: false, target: 3, value: 12 },
            { forecast: false, month: 'October', showInXAxis: false, target: 3, value: 2 },
            { forecast: false, month: 'November', showInXAxis: false, target: 3, value: 12 },
            { forecast: false, month: 'December', showInXAxis: true, target: 3, value: 3 },
        ],
        selectedMetric,
    };
};

const WidgetSearchResults: React.FC<WidgetSearchResultsProps> = ({
    searchTerm,
    selectedWidgetTypeId,
}) => {
    const normalized = searchTerm.trim().toLowerCase();

    const filtered = useMemo(() => {
        if (!normalized) return [];

        return DUMMY_SEARCH_WIDGETS.filter(item => {
            if (!selectedWidgetTypeId) return true;
            return item.widgetTypeId === selectedWidgetTypeId;
        }).filter(item => {
            const inName = item.widgetName.toLowerCase().includes(normalized);
            const inKpi = item.kpi.toLowerCase().includes(normalized);
            const inKeywords = (item.keywords ?? []).some(k =>
                k.toLowerCase().includes(normalized),
            );
            return inName || inKpi || inKeywords;
        });
    }, [normalized, selectedWidgetTypeId]);

    if (!filtered.length) {
        return <NoSearchResults />;
    }

    return (
        <Flex vertical gap={12} className={styles['widget-search-right-content']}>
            <Label type="body2">
                Select and add existing chart template to continue customising
            </Label>

            <div className={styles['widget-search-grid']}>
                {filtered.map(item => (
                    <div key={item.widgetId} className={styles['widget-search-card-wrap']}>
                        <Label type="body2">
                            <span>{item.widgetName}</span>
                        </Label>

                        <KpiCards
                            // chevronDropdown={
                            //     <SideMenu
                            //         action={<Icon color="neutrals-B600" name="chevron-down" size="xm" />}
                            //         onOptionSelect={() => { }}
                            //         options={[
                            //             { label: '($ MM)', value: 'mm' },
                            //             { label: '($ YY)', value: 'yy' },
                            //         ]}
                            //     />
                            // }
                            data={buildKpiCardsData(item.kpi, item.selectedMetric)}
                            selectedPeriod="mtd"
                            selectedPeriodValue="12"
                            targetToshowOnCard="3.5"
                            verticalDotsDropdown={
                                <SideMenu
                                    action={
                                        <Icon
                                            color="neutrals-B600"
                                            name="horizontal-dot-grey"
                                            size="xm"
                                        />
                                    }
                                    onOptionSelect={() => {}}
                                    options={[
                                        { label: 'Test1', value: 'options1' },
                                        { label: 'Test2', value: 'options2' },
                                    ]}
                                />
                            }
                            className={styles['performance-kpi-cards']}
                        />
                    </div>
                ))}
            </div>
        </Flex>
    );
};

export default WidgetSearchResults;

const NoSearchResults = () => {
    return (
        <Flex vertical className={styles['flyout-empty-container']} gap={24}>
            <Flex vertical flex={1} justify="center" align="center">
                {NoWidgetsFound()}
                <Label type="body2">No Matches Found</Label>
                <div className={styles['space-v-8']} />
                <Label type="body3">
                    <span className={styles['no-widgets-desc']}>
                        Sorry, nothing matches your search. Please try using a different term.
                    </span>
                </Label>
            </Flex>
        </Flex>
    );
};
