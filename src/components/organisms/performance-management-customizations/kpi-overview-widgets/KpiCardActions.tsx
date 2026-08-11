import React, { useCallback, useState } from 'react';
import { IconButton, Dialog } from 'konnect-react-components';
import { useDispatch, useSelector } from 'react-redux';
import { AppDispatch } from '../../../../store';
import {
    appendToWidgetOrder,
    removeFromWidgetOrder,
    setSingleKpiSelectedIds,
    setSingleKpiSelectedMetric,
    selectTabWidgetsState,
    setSingleKpiProjectionsEnabled,
    setSingleKpiTrendPeriod,
} from '../../../../store/slice/performanceWidgetsByTabSlice';
import SingleKpiEditFlyout from './SingleKpiEditFlyout';
import type { RootState } from '../../../../store';

type KpiOption = {
    label: string;
    value: string;
};

type Props = {
    /** The token for this widget in the order list, e.g., 'single-kpi:<id>' or 'single-kpi:<id>@<n>' */
    token: string;
    /** Active tab ID to scope Redux updates */
    tabId: number;
    /** Live preview (KpiCards instance) to display in the flyout's left pane */
    preview?: React.ReactNode;

    /** Header config flow */
    kpiOptions: KpiOption[];
    activeKpiId?: string;
    currentTitle?: string;
    showPeriod: boolean;

    /** KPI Card Setup current values (from parent) */
    showGraph: boolean;
    chartType: 'area' | 'bar' | 'line';
    selectedPeriod: '' | 'mtd' | 'qtd' | 'ytd';

    /** Live updates (preview) */
    onLiveHeaderUpdate: (payload: {
        title?: string;
        showPeriod?: boolean;
        kpi?: KpiOption | null;
        showGraph?: boolean;
        chartType?: 'area' | 'bar' | 'line';
        selectedPeriod?: '' | 'mtd' | 'qtd' | 'ytd';
        trendPeriod?: '3M' | '6M' | '1Y';
        projectionsEnabled?: boolean;
    }) => void;

    /** Persist on save (for now parent already has latest live state) */
    onApplyHeaderConfig: (payload: {
        title?: string;
        showPeriod: boolean;
        kpi?: KpiOption | null;
        showGraph?: boolean;
        chartType?: 'area' | 'bar' | 'line';
        selectedPeriod?: '' | 'mtd' | 'qtd' | 'ytd';
    }) => void;
};

/** ===== Helpers for token handling ===== */
const SINGLE_KPI_PREFIX = 'single-kpi:';
const getBaseSingleKpiToken = (t: string): string => {
    if (!t.startsWith(SINGLE_KPI_PREFIX)) return t;
    const after = t.slice(SINGLE_KPI_PREFIX.length);
    const idOnly = after.split('@')[0]; // drop suffix if any
    return `${SINGLE_KPI_PREFIX}${idOnly}`;
};
const getSuffixFromToken = (t: string): string => {
    if (!t.startsWith(SINGLE_KPI_PREFIX)) return '';
    const after = t.slice(SINGLE_KPI_PREFIX.length);
    const parts = after.split('@');
    return parts.length > 1 ? '@' + parts.slice(1).join('@') : '';
};
/**
 * Given a base token (no suffix), compute the next available '@n' token
 * based on what's already in the current widgetOrder.
 *
 * We map: base -> n=1, base@2 -> n=2, ... and create base@{max+1}
 */
const nextDuplicateToken = (baseToken: string, existing: string[]): string => {
    let maxN = 0;
    const baseExact = baseToken;
    const pattern = new RegExp(`^${baseExact.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}(?:@(\\d+))?$`);
    for (const tok of existing) {
        const m = tok.match(pattern);
        if (!m) continue;
        const n = m[1] ? parseInt(m[1], 10) : 1; // base (no suffix) counts as 1
        if (!Number.isNaN(n)) maxN = Math.max(maxN, n);
    }
    return `${baseToken}@${maxN + 1}`;
};

/**
 * Action strip for KPI cards
 */
const KpiCardActions: React.FC<Props> = ({
    token,
    tabId,
    preview,
    kpiOptions,
    activeKpiId,
    currentTitle,
    showPeriod,
    showGraph,
    chartType,
    selectedPeriod,
    onLiveHeaderUpdate,
    onApplyHeaderConfig,
}) => {
    const dispatch = useDispatch<AppDispatch>();
    const [isDeleteOpen, setIsDeleteOpen] = useState(false);
    const [isEditOpen, setIsEditOpen] = useState(false);

    // Read current saved state so we can compute replacements on Save
    const activeSaved = useSelector((s: RootState) => selectTabWidgetsState(s, tabId));
    const savedIds: string[] = activeSaved.singleKpi?.selectedIds ?? [];
    const savedMetrics: KpiOption[] = activeSaved.singleKpi?.selectedMetric ?? [];
    const widgetOrder: string[] = activeSaved.widgetOrder ?? [];

    const onEdit = useCallback(() => {
         
        setIsEditOpen(true);
    }, [token]);

    const onDuplicate = useCallback(() => {
        // Only handle duplication for single-kpi tokens
        if (!token.startsWith(SINGLE_KPI_PREFIX)) {
            dispatch(appendToWidgetOrder({ tabId, items: [token] }));
            return;
        }

        const base = getBaseSingleKpiToken(token);
        const newToken = nextDuplicateToken(base, widgetOrder);
        dispatch(appendToWidgetOrder({ tabId, items: [newToken] }));
    }, [dispatch, tabId, token, widgetOrder]);

    const onDeleteClick = useCallback(() => setIsDeleteOpen(true), []);
    const onDialogClose = useCallback(() => setIsDeleteOpen(false), []);

    const onConfirmDelete = useCallback(() => {
        dispatch(removeFromWidgetOrder({ tabId, items: [token] }));
        setIsDeleteOpen(false);
    }, [dispatch, tabId, token]);

    return (
        <>
            {/* Order matches screenshot: Delete, Duplicate, Edit */}
            <div style={{ display: 'flex', gap: 8 }}>
                <IconButton icon="trash-01" size="Small" onClick={onDeleteClick} />
                <IconButton icon="copy-04" size="Small" onClick={onDuplicate} />
                <IconButton icon="edit-02" size="Small" onClick={onEdit} />
            </div>

            {isDeleteOpen && (
                <Dialog
                    title="Delete Widget"
                    content="Are you sure you want to delete the selected widget from your report ?"
                    isOpen
                    onClose={onDialogClose}
                    onPrimaryButtonClick={onConfirmDelete}
                    onSecondaryButtonClick={onDialogClose}
                    primaryButtonText="Delete"
                    secondaryButtonText="Continue to edit report"
                />
            )}

            {/* EDIT FLYOUT */}
            <SingleKpiEditFlyout
                isOpen={isEditOpen}
                onClose={() => setIsEditOpen(false)}
                preview={preview}
                kpiOptions={kpiOptions}
                activeKpiId={activeKpiId}
                currentTitle={currentTitle}
                showPeriod={showPeriod}
                showGraph={showGraph}
                chartType={chartType}
                selectedPeriod={selectedPeriod}
                onLiveHeaderUpdate={onLiveHeaderUpdate}
                trendPeriod={activeSaved.singleKpi?.trendPeriod ?? '1Y'}
                projectionsEnabled={activeSaved.singleKpi?.projectionsEnabled ?? false}
                onSaveHeader={payload => {
                    onApplyHeaderConfig(payload);

                    const oldId = activeKpiId;
                    const newKpi = payload.kpi ?? null;
                    const newId = newKpi?.value;

                    if (oldId && newId && oldId !== newId) {
                        const nextIds = savedIds.map(id => (id === oldId ? newId : id));
                        dispatch(setSingleKpiSelectedIds({ tabId, selectedIds: nextIds }));

                        const nextMetrics: KpiOption[] = savedMetrics.map(m =>
                            m.value === oldId ? { label: newKpi.label, value: newId } : m,
                        );
                        dispatch(
                            setSingleKpiSelectedMetric({ tabId, selectedMetric: nextMetrics }),
                        );

                        // Replace token in order while preserving suffix if possible
                        const oldToken = token;
                        const oldSuffix = getSuffixFromToken(oldToken);
                        const baseNew = `${SINGLE_KPI_PREFIX}${newId}`;
                        let candidate = `${baseNew}${oldSuffix}`;

                        // If conflict with existing order, pick the next available duplicate token
                        if (widgetOrder.includes(candidate)) {
                            candidate = nextDuplicateToken(
                                getBaseSingleKpiToken(candidate),
                                widgetOrder,
                            );
                        }

                        dispatch(removeFromWidgetOrder({ tabId, items: [oldToken] }));
                        dispatch(appendToWidgetOrder({ tabId, items: [candidate] }));
                    }

                    setIsEditOpen(false);

                    if (payload.trendPeriod) {
                        dispatch(setSingleKpiTrendPeriod({ tabId, trendPeriod: payload.trendPeriod }));
                    }

                    if (payload.projectionsEnabled !== undefined) {
                        dispatch(
                            setSingleKpiProjectionsEnabled({
                                tabId,
                                enabled: payload.projectionsEnabled
                            })
                        );
                    }
                }}
            />
        </>
    );
};

export default KpiCardActions;
