import { Flex } from 'antd';
import styles from './TableHeader.module.scss';
import { Button, DropDown, Icon, IconButton, Status } from 'konnect-react-components';
import { Grow } from '@mui/material';
import { useState } from 'react';
import { TableHeaderProps } from '../../../../types/common';

function TableHeader(props: TableHeaderProps) {
    const {
        title,
        subtitle,
        linkButton,
        showInsightButton,
        appliedFilters,
        performanceStatus,
        onDeleteWidget,
        onDuplicateWidget,
        onEditWidget,
        activeTabId,
        widgetTabId,

        /* ✅ Editor driven controls */
        enableColumnDrilldown,
        columnDrilldownOptions = [],
        enableDrilldownButtons,
        enableRowHierarchy,
        rowHierarchyOptions = [],
        enableWidgetFilters,
        // widgetFilterOptions = [],
    } = props;

    const [showActions, setShowActions] = useState(false);
    const [isEditing, setIsEditing] = useState(false);

    /* ✅ Tab scoping */
    if (widgetTabId !== undefined && String(widgetTabId) !== String(activeTabId)) {
        return null;
    }

    const getSuffix = (label: 'MTD' | 'QTD' | 'YTD') => {
        switch (label) {
            case 'MTD':
                return 'PM';
            case 'QTD':
                return 'PQ';
            case 'YTD':
                return 'PY';
            default:
                return '';
        }
    };

    const renderComparison = (p: any) => {
        const percentage = p.comparison?.percentage;
        

        if (percentage === null || percentage === undefined) return null;

        const isPositive = percentage > 0;
        const suffix = getSuffix(p.label);

        return (
            <span className={styles['kpi-wrapper']}>
                <span className={styles['kpi-dot']}>•</span>

                {percentage !== 0 && (
                    <Icon
                        name={isPositive ? 'double-chevron-up-green' : 'double-chevron-down-red'}
                        size="xm"
                        color={isPositive ? 'primary-green-color' : 'status-error-color'}
                    />
                )}

                <span className={styles['kpi-text']}>
                    {percentage}% vs {suffix}
                </span>
            </span>
        );
    };

    return (
        <div className={styles['table-header-container']}>
            {/* ───────────── Header ───────────── */}
            <Flex justify="space-between">
                <Flex vertical>
                    <Flex gap={10}>
                        <span className={styles['table-header-title']}>{title}</span>
                        <Flex gap={5}>
                            {linkButton?.visible && (
                                <IconButton size="Tiny" icon="share-04" onClick={() => {}} />
                            )}
                            {showInsightButton && (
                                <IconButton size="Tiny" icon="file-04" onClick={() => {}} />
                            )}
                        </Flex>
                    </Flex>
                    <span className={styles['table-header-applied-filters']}>
                        {appliedFilters?.join(' | ')}
                    </span>
                </Flex>

                {/* Actions */}
                <div>
                    {showActions && !isEditing && (
                        <Grow dir="up" in>
                            <div className={styles['table-header-action-button-container']}>
                                <IconButton
                                    size="Small"
                                    icon="trash-01"
                                    onClick={() => onDeleteWidget?.()}
                                />
                                <IconButton
                                    size="Small"
                                    icon="copy-04"
                                    onClick={() => onDuplicateWidget?.()}
                                />
                                <IconButton
                                    size="Small"
                                    icon="edit-02"
                                    onClick={() => {
                                        setIsEditing(true);
                                        onEditWidget?.();
                                    }}
                                />
                            </div>
                        </Grow>
                    )}

                    <Button
                        icon="chevron-up"
                        size="M"
                        variant="Secondary"
                        className={styles['table-header-action-button']}
                        onClick={() => setShowActions(!showActions)}
                    />
                </div>
            </Flex>

            <span className={styles['table-header-subtitle']}>{subtitle}</span>

            {/* ───────────── Performance Indicators ───────────── */}
            <Flex gap={5} className={styles['perf-indicators']}>
                {performanceStatus?.map(p => (
                    <Status
                        key={p.label}
                        type={p.type}
                        size="M"
                        text={
                            <Flex align="center" gap={8}>
                                <span className={styles['kpi-label']}>{p.label}:</span>
                                <span className={styles['kpi-value']}>{p.value}</span>
                                <span className={styles['kpi-target-icon']}>
                                    <Icon name="target-04" size="xm" color="neutrals-B300" />
                                </span>
                                <span className={styles['kpi-target-group']}>
                                    <span className={styles['kpi-target']}>{p.target}</span>
                                    {p.comparison?.type === "Previous" &&(renderComparison(p))}
                                </span>
                            </Flex>
                        }
                    />
                ))}
            </Flex>

            {/* ───────────── Controls Row (7 → 10) ───────────── */}
            <Flex gap={10} align="flex-end">
                {/* 7. Column Drilldown */}
                {enableColumnDrilldown && (
                    <DropDown
                        dropdown={{
                            label: 'Column Drilldown',
                            type: 'tree-multiselect',
                            options: columnDrilldownOptions,
                            selectedOptions: [],
                            showSelectAll: true,
                            size: 'M',
                            placeholder: 'Select columns',
                            onChange: () => {},
                        }}
                    />
                )}

                {/* 8. Drilldown Buttons */}
                {enableDrilldownButtons && (
                    <>
                        <Button
                            variant="Secondary"
                            className={styles['drill-down-buttons']}
                            icon="arrow-up"
                            size="M"
                            onClick={() => {}}
                        />
                        <Button
                            variant="Secondary"
                            className={styles['drill-down-buttons']}
                            icon="arrow-down"
                            size="M"
                            onClick={() => {}}
                        />
                    </>
                )}

                {/* 9. Row Hierarchy */}
                {enableRowHierarchy && (
                    <DropDown
                        dropdown={{
                            label: 'Row Hierarchy',
                            options: rowHierarchyOptions,
                            size: 'M',
                            placeholder: 'Select hierarchy',
                            onChange: () => {},
                        }}
                    />
                )}

                {/* 10. Widget Filter */}
                {enableWidgetFilters && (
                    <Button variant="Subtle2" size="S" onClick={() => {}} icon="filter-funnel-02" />
                )}
            </Flex>
        </div>
    );
}

export default TableHeader;
