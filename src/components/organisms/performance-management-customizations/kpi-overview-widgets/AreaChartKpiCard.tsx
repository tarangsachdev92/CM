// import { useEffect, useState } from 'react';
import styles from '../PerformanceManagementCustomisations.module.scss';
// import { Flex } from 'antd';
// import { Label } from '../../atoms';
import { KpiCards } from 'konnect-react-components';

interface IAreaChartKpiCard {
    selectedChartType?: string | undefined;
}

const AreaChartKpiCard: React.FC<IAreaChartKpiCard> = ({ selectedChartType }) => {
    return (
        <>
            <KpiCards
                data={{
                    currentPeriodValue: 4,
                    currentPeriodValueColor: 'green',
                    date: 'Jul 2024',
                    deviation: 'decrease',
                    deviationString: '2.4% vs PM',
                    deviationValueColor: 'black',
                    kpi: 'OTIF-D Trend Analysis (%)',
                    metricData: [
                        {
                            forecast: false,
                            month: 'January',
                            showInXAxis: true,
                            target: 3,
                            value: 1,
                        },
                        {
                            forecast: false,
                            month: 'February',
                            showInXAxis: false,
                            target: 3,
                            value: 6,
                        },
                        {
                            forecast: false,
                            month: 'March',
                            showInXAxis: false,
                            target: 3,
                            value: 4,
                        },
                        {
                            forecast: false,
                            month: 'April',
                            showInXAxis: false,
                            target: 3,
                            value: 3,
                        },
                        {
                            forecast: false,
                            month: 'May',
                            showInXAxis: false,
                            target: 3,
                            value: 4,
                        },
                        {
                            forecast: false,
                            month: 'Jun',
                            showInXAxis: true,
                            target: 3,
                            value: 12,
                        },
                        {
                            forecast: false,
                            month: 'July',
                            showInXAxis: false,
                            target: 3,
                            value: 2,
                        },
                        {
                            forecast: false,
                            month: 'August',
                            showInXAxis: false,
                            target: 3,
                            value: 10,
                        },
                        {
                            forecast: false,
                            month: 'September',
                            showInXAxis: false,
                            target: 3,
                            value: 12,
                        },
                        {
                            forecast: false,
                            month: 'October',
                            showInXAxis: false,
                            target: 3,
                            value: 2,
                        },
                        {
                            forecast: false,
                            month: 'November',
                            showInXAxis: false,
                            target: 3,
                            value: 12,
                        },
                        {
                            forecast: false,
                            month: 'December',
                            showInXAxis: true,
                            target: 3,
                            value: 3,
                        },
                    ],
                    // selectedMetric: '($ MM)',
                }}
                selectedPeriod="ytd"
                selectedPeriodValue={'12'}
                targetToshowOnCard={'3.5'}
                // verticalDotsDropdown={
                //     <SideMenu
                //         action={<Icon color="neutrals-B600" name="horizontal-dot-grey" size="xm" />}
                //         onOptionSelect={() => {}}
                //         options={[
                //             { label: 'Test1', value: 'options1' },
                //             { label: 'Test2', value: 'options2' },
                //         ]}
                //     />
                // }
                className={styles['overview-area-kpi-cards']}
                // onClick={onPerformanceOverviewKpiCardSelected}
                // selected={isKpiSelected}
                chartType={selectedChartType as 'area' | 'bar'}
            />
        </>
    );
};

export default AreaChartKpiCard;
