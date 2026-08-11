import { Flex } from 'antd';
import { useState } from 'react';
import styles from './CasualAnalysis.module.scss';
import CasualKPITree, { KPINodeData } from './CasualKPITree';
import {
    Asterisk,
    ChevronDropdown,
    ChevronRight,
    ClockRewind,
    Filter,
    GlobeIcon,
} from '../../../assets/icons/icons';
import { DropDown, Button } from 'konnect-react-components';
import type { OptionType } from '../../../types/common';

const mockTreeData: KPINodeData = {
    id: '1',
    name: 'OTIF-D',
    value: '85.7',
    target: '85',
    status: 'good',
    children: [
        {
            id: '2',
            name: 'OTIF-SC',
            value: '85.7',
            target: '85',
            status: 'good',
            children: [
                {
                    id: '3',
                    name: 'Distribution Miss',
                    value: '85.7',
                    target: '85',
                    status: 'good',
                },
                {
                    id: '4',
                    name: 'OTIF-A',
                    value: '85.7',
                    target: '85',
                    status: 'good',
                    children: [
                        {
                            id: '5',
                            name: 'Order Management Miss',
                            value: '85.7',
                            target: '85',
                            status: 'good',
                        },
                        {
                            id: '6',
                            name: 'Product Availability Miss',
                            value: '85.7',
                            target: '85',
                            status: 'good',
                        },
                        {
                            id: '7',
                            name: 'Customer Miss',
                            value: '85.7',
                            target: '85',
                            status: 'good',
                        },
                    ],
                },
            ],
        },
        {
            id: '8',
            name: 'Transportation Miss',
            value: '85.7',
            target: '85',
            status: 'bad',
        },
    ],
};

const CasualAnalysis = () => {
    const [kpi, setKpi] = useState<OptionType | undefined>();
    const [applied, setApplied] = useState<boolean>(false);

    return (
        <Flex className={styles['causal-tree-wrapper']} vertical>
            <Flex gap={16}>
                <ChevronRight />
                <Flex className={styles['header']} justify="space-between" align="top" gap={8}>
                    <Flex vertical gap={4}>
                        <div className={styles['header-title']}>
                            {kpi?.value ? 'Casual Analysis : KPI Tree' : 'Casual Analysis'}
                        </div>
                        <div className={styles['header-subtitle']}>Last Refreshed 2 hours ago</div>
                    </Flex>

                    <div className={styles['history']}>
                        <ClockRewind />
                    </div>
                </Flex>
            </Flex>

            <Flex className={styles['filter-bar']} align="center">
                <Flex className={styles['filter-icons']}>
                    <GlobeIcon />
                    <Filter />
                    <ChevronDropdown />
                </Flex>
                <Flex gap={8} align="center">
                    <Flex className={styles['chip']} gap={6} align="center">
                        <Asterisk />
                        <span className={styles['chip-key']}>Period</span>
                        <span className={styles['equal-operator']}>=</span>
                        <span className={styles['chip-value']}>Q1 2026</span>
                    </Flex>
                    <Flex className={styles['chip']} align="center">
                        <Asterisk />
                        <span className={styles['chip-key']}>KPI</span>
                        <span className={styles['equal-operator']}>=</span>
                        <span className={styles['chip-value']}>{kpi?.value}</span>
                    </Flex>
                    <span className={styles['clear']}>Clear All</span>
                </Flex>
            </Flex>

            <Flex className={styles['select-kpi-section']} vertical gap={16}>
                <div className={styles['select-kpi-text']}>
                    Select KPI to generate the corresponding metric tree and start your analysis
                </div>
                <Flex gap={8} vertical>
                    <DropDown
                        id="casual-kpi-dropdown"
                        dropdown={{
                            label: 'KPI',
                            options: [{ label: 'OTIF-D', value: 'OTIF-D' }],
                            placeholder: 'Select',
                            required: true,
                            reset: false,
                            onChange: (opt: OptionType) => {
                                setKpi(opt);
                                setApplied(false);
                            },
                            selectedOptions: kpi ? [kpi] : [],
                        }}
                    />
                </Flex>
                {kpi && (
                    <div className={styles['top-actions-bar']}>
                        <Button
                            className={styles['undo-btn']}
                            onClick={() => {
                                setKpi(undefined);
                                setApplied(false);
                            }}
                            text="Undo All"
                            variant="Secondary"
                        />

                        <Button
                            className={styles['apply-btn']}
                            disabled={!kpi}
                            onClick={() => setApplied(true)}
                            text="Apply"
                            variant="Primary"
                        />
                    </div>
                )}
            </Flex>
            <Flex
                className={styles['tree-section']}
                vertical
                align="top"
                style={{
                    flex: 1,
                    minHeight: 700,
                }}
            >
                {!applied && (
                    <Flex className={styles['empty-state']} vertical align="center">
                        <Flex className={styles['empty-title']} align="center">
                            Apply mandatory (<Asterisk />) filters to view data
                        </Flex>
                        <Flex className={styles['empty-subtitle']}>
                            Select and apply filters above to load relevant data
                        </Flex>
                    </Flex>
                )}

                {applied && kpi?.value && <CasualKPITree data={mockTreeData} />}
            </Flex>
        </Flex>
    );
};

export default CasualAnalysis;
