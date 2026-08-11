import React, { useEffect, useState } from 'react';
import {
    KpiCards,
    SideMenu,
    Icon,
    Tab,
    BarChartComponent,
    Table,
    HierarchyColumnChart,
    KpiCardSkeleton,
} from 'konnect-react-components';
import styles from './AppsAndReportsKpiCard.module.scss';
import { Flex } from 'antd';
import { Label } from '../../atoms';
import { useDispatch, useSelector } from 'react-redux';
import {
    fetchBasicKpiCard,
    fetchImpactAnalysisTableData,
    fetchColumnKpiCard,
} from '../../../store';
import { RootState, AppDispatch } from '../../../store';
import { Select } from 'antd';

const { Option } = Select;

function AppsAndReportsKpiCard() {
    const dispatch = useDispatch<AppDispatch>();
    const basicKpiCardData = useSelector((state: RootState) => state.basickpiCard.appName);
    const columnKpiCardData = useSelector((state: RootState) => state.columnKpiCardData.columnData);

    const impactAnalysisTableData = useSelector(
        (state: RootState) => state.impactAnalysisTableData.tableData,
    );

    const queryParams1 = {
        FilterGroup: null,
        FinancialCycle: null,
        Year: 2025,
        Month: 2,
        Week: 8,
        Region: 'EMEA',
        Cluster: null,
        Market: 'Denmark',
        MfgSites: null,
        SiteCodes: null,
        SalesOrg: null,
        Segment: null,
        Category: null,
        Brand: null,
        SubBrand: null,
        SKU: null,
        Channel: null,
        Customer: null,
    };

    const queryParams2 = {
        FilterGroup: null,
        FinancialCycle: null,
        Year: 2025,
        Month: 3,
        Week: null,
        Region: 'EMEA',
        Cluster: null,
        Market: 'Denmark',
        MfgSites: null,
        SiteCodes: null,
        SalesOrg: null,
        Segment: null,
        Category: null,
        Brand: null,
        SubBrand: null,
        SKU: null,
        Channel: null,
        Customer: null,
    };

    const queryParams3 = {
        FilterGroup: null,
        FinancialCycle: null,
        Year: 2025,
        Month: 2,
        Week: null,
        Region: 'APAC',
        Cluster: null,
        Market: 'Japan',
        MfgSites: null,
        SiteCodes: null,
        SalesOrg: null,
        Segment: null,
        Category: null,
        Brand: null,
        SubBrand: null,
        SKU: null,
        Channel: null,
        Customer: null,
    };

    let queryParamsCards: any;

    const onDropdownChange = (selectedOption: '1' | '2' | '3' | string) => {
        switch (selectedOption) {
            case '1':
                queryParamsCards = queryParams1;
                break;
            case '2':
                queryParamsCards = queryParams2;
                break;
            case '3':
                queryParamsCards = queryParams3;
                break;
            default:
                queryParamsCards = {};
        }
        dispatch(fetchBasicKpiCard(queryParamsCards));
        return queryParamsCards;
    };

    useEffect(() => {
        dispatch(fetchBasicKpiCard(queryParams1));
        dispatch(fetchImpactAnalysisTableData());
        dispatch(fetchColumnKpiCard());
    }, [dispatch]);

    interface KpiCardData {
        week: number | null;
        month: number;
        otiF_U_PERCENTAGE: number;
        currentTarget: number;
        monthName?: string;
    }

    const metricData = basicKpiCardData.map((item: KpiCardData) => ({
        forecast: false,
        month: item.week !== null ? 'W' + `${item.week}` : `${item.monthName}`,
        value: item.otiF_U_PERCENTAGE,
    }));

    const dollarKpiMetricData = basicKpiCardData.map((item: KpiCardData) => ({
        month: item.week !== null ? 'W' + `${item.week}` : `${item.monthName}`,
        Actual: item.otiF_U_PERCENTAGE,
        DIO: item.otiF_U_PERCENTAGE,
        DOS: item.otiF_U_PERCENTAGE,
        Target1: item.currentTarget,
        Target2: item.currentTarget,
    }));

    const impactAnalysisOTIFD = impactAnalysisTableData.impactAnalysisOTIFD.map((item: any) => ({
        name: item.brandName,
        age: `${item.impact}%`,
        address: `${item.otifd}%`,
    }));

    const impactAnalysisRC = impactAnalysisTableData.impactAnalysisRC.map((item: any) => ({
        name: item.reasonCode,
        age: `${item.impact}%`,
    }));

    const chartData = columnKpiCardData.map((item: any) => ({
        level: 0,
        name: item.reason,
        parentName: 'name',
        target: '60%',
        value: parseFloat(item.impact),
    }));

    const headerInfoComponent = () => (
        <div
            style={{
                marginTop: '8px',
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
            }}
        >
            <Icon name="target-icon-grey" size="xm" color="neutrals-B300" /> 3.5{' '}
            <Icon name="double-chevron-up-green" size="xm" color="primary-green-color" /> 9% vs BP
        </div>
    );

    //---------------------------

    interface ISwitchProps {
        label: string;
        key: string;
        checked: boolean;
        isDisable: boolean;
    }

    const [options, setOptions] = useState<ISwitchProps[]>([]);

    const data: ISwitchProps[] = [
        {
            label: 'Target',
            key: 'T',
            checked: true,
            isDisable: false,
        },
        {
            label: 'Insights',
            key: 'I',
            checked: true,
            isDisable: false,
        },
    ];

    useEffect(() => {
        setOptions(data);
    }, []);

    //----------------------------------

    return (
        <Flex vertical gap={24}>
            <Flex
                justify="flex-start"
                className={styles['admin-console-container']}
                vertical
                gap={8}
            >
                <Label type="h2">
                    <span className={styles['admin-console-header-title']}>
                        Digital Performance Management
                    </span>
                </Label>
                <Label type="body2">
                    <span className={styles['admin-console-header-description']}>
                        Enable smarter decisions through digital performance insights.
                    </span>
                </Label>
                <Tab
                    items={[
                        { label: 'Monthly Review' },
                        { label: 'Issues & Actions', icon: 'info-circle' },
                        { label: 'Root Cause Problem Solving', icon: 'puzzle-piece-01' },
                        { label: 'History', icon: 'check-circle' },
                    ]}
                    onClick={() => {}}
                />
            </Flex>

            <Flex vertical className={styles['card-section']} gap={24}>
                <KpiCardSkeleton
                    kpiName="Monthly Review"
                    switchDropdownProps={{
                        options: options,
                        onToggle: (option, toggleValue) => {
                            setOptions(prevOptions =>
                                prevOptions.map(item =>
                                    item.key === option.key
                                        ? {
                                              ...item,
                                              checked: toggleValue,
                                          }
                                        : item,
                                ),
                            );
                        },
                        reset: {
                            disabled: false,
                            text: 'Reset',
                            onClick: () => {
                                setOptions(prevOptions =>
                                    prevOptions.map(item => ({
                                        ...item,
                                        checked: false,
                                    })),
                                );
                            },
                        },
                    }}
                >
                    <Flex vertical className={styles['basic-kpi-card-container']}>
                        <Flex className={styles['dropdown-container']}>
                            <Select
                                showSearch
                                className={styles['dropdown']}
                                placeholder="Select"
                                optionFilterProp="children"
                                onChange={selectedOption => onDropdownChange(selectedOption)}
                                filterOption={(input, option) =>
                                    option?.children?.some(
                                        child =>
                                            child.toLowerCase().indexOf(input.toLowerCase()) >= 0,
                                    ) ?? false
                                }
                            >
                                <Option value="1">EMEA-Denmark-Week-8</Option>
                                <Option value="2">EMEA-Denmark-Month</Option>
                                <Option value="3">APAC-Japan-Week-3</Option>
                            </Select>
                        </Flex>
                        <Flex className={styles['kpiCard-container']}>
                            <KpiCards
                                data={{
                                    currentPeriodValue: 90,
                                    currentPeriodValueColor: 'red',
                                    deviation: 'decrease',
                                    deviationString: '2.4% vs PM',
                                    kpi: 'OTIFD',
                                    date: '',
                                    metricData: metricData,
                                    selectedMetric: '%',
                                }}
                                selectedPeriod="YTD"
                                selectedPeriodValue="12"
                                targetToshowOnCard={'3.5'}
                                targetWithSelectedPeriod="3.5%"
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
                                            { label: 'Log Issue', value: 'logIssue' },
                                            { label: 'Export as Image', value: 'exportAsImage' },
                                        ]}
                                    />
                                }
                            />
                        </Flex>
                    </Flex>
                </KpiCardSkeleton>
            </Flex>

            <Flex vertical className={styles['card-section']} gap={24}>
                <KpiCardSkeleton
                    kpiName="OTIFD Analysis (%)"
                    subTitle="Site1 | Apr 2025 | %"
                    headerInfoRender={headerInfoComponent()}
                    onUpButtonClick={() => {}}
                    onDownButtonClick={() => {}}
                    switchDropdownProps={{
                        options: options,
                        onToggle: (option, toggleValue) => {
                            setOptions(prevOptions =>
                                prevOptions.map(item =>
                                    item.key === option.key
                                        ? {
                                              ...item,
                                              checked: toggleValue,
                                          }
                                        : item,
                                ),
                            );
                        },
                        reset: {
                            disabled: false,
                            text: 'Reset',
                            onClick: () => {
                                setOptions(prevOptions =>
                                    prevOptions.map(item => ({
                                        ...item,
                                        checked: false,
                                    })),
                                );
                            },
                        },
                    }}
                >
                    <BarChartComponent
                        bar1FillColor="#D3BDF2"
                        bar1Radius={[4, 4, 0, 0]}
                        barSize={40}
                        data={dollarKpiMetricData}
                        dataKey1="Actual"
                        line1StrokeColor="#FF9355"
                        lineDataKey1="Target1"
                        projectionLineStrokeColor="#575757"
                        setXaxis="month"
                        showLineInTooltip={false}
                        unit="%"
                        yXaxisLineIntervals={20}
                        isStacked={false}
                        bar2FillColor={''}
                        line2StrokeColor={''}
                        line3StrokeColor={''}
                    />
                </KpiCardSkeleton>
                <Flex vertical style={{ marginTop: 50 }}>
                    <Flex vertical gap={8} style={{ marginBottom: 20 }}>
                        <Label type="body1">
                            <span className={styles['rm-card-title']}>Impact Analysis</span>
                        </Label>
                    </Flex>
                    <Flex
                        style={{
                            display: 'flex',
                            flexDirection: 'row',
                            justifyContent: 'space-between',
                            gap: 20,
                        }}
                    >
                        <Table
                            columns={[
                                {
                                    dataIndex: 'name',
                                    key: 'name',
                                    resizable: true,
                                    title: 'Brands',
                                    width: '200px',
                                },
                                {
                                    dataIndex: 'age',
                                    key: 'age',
                                    resizable: true,
                                    title: 'Impact',
                                    width: '100px',
                                },
                                {
                                    dataIndex: 'address',
                                    key: 'address',
                                    resizable: false,
                                    title: 'OTIF-D',
                                    width: '100px',
                                },
                            ]}
                            data={impactAnalysisOTIFD}
                        />
                        <Table
                            columns={[
                                {
                                    dataIndex: 'name',
                                    key: 'name',
                                    resizable: true,
                                    title: 'Top 3 Reason Codes',
                                    width: '200px',
                                },
                                {
                                    dataIndex: 'age',
                                    key: 'age',
                                    resizable: false,
                                    title: 'Impact',
                                    width: '100px',
                                },
                            ]}
                            data={impactAnalysisRC}
                        />
                    </Flex>
                </Flex>
            </Flex>
            <Flex vertical className={styles['card-section']} gap={24}>
                <KpiCardSkeleton
                    kpiName="Failure Mode"
                    subTitle="APAC | Apr 2025 | %"
                    switchDropdownProps={{
                        options: options,
                        onToggle: (option, toggleValue) => {
                            setOptions(prevOptions =>
                                prevOptions.map(item =>
                                    item.key === option.key
                                        ? {
                                              ...item,
                                              checked: toggleValue,
                                          }
                                        : item,
                                ),
                            );
                        },
                        reset: {
                            disabled: false,
                            text: 'Reset',
                            onClick: () => {
                                setOptions(prevOptions =>
                                    prevOptions.map(item => ({
                                        ...item,
                                        checked: false,
                                    })),
                                );
                            },
                        },
                    }}
                >
                    <React.Fragment>
                        <HierarchyColumnChart
                            data={chartData}
                            dataKey="value"
                            levels={[]}
                            setYaxis="name"
                            unit={'%'}
                            legendsLabels={[]}
                        />
                    </React.Fragment>
                </KpiCardSkeleton>
            </Flex>
        </Flex>
    );
}

export default AppsAndReportsKpiCard;
