import React, { useCallback, useMemo, useRef, useState } from "react";
import styles from "./KpiDropzone.module.scss";
import { ToolTip, Icon, Button, Switch, SegmentedControl, ChartTypeButton, Dialog } from "konnect-react-components";
import { ClusteredColumnIcon, FilledAreaIcon, SingleLineIcon } from '../../../../assets/icons/icons';

export type KpiChartType = "bar-clustered" | "area" | "line";
export type KpiTrendPeriod = "3M" | "6M" | "1Y";
export type KpiMainValue = "MTD" | "QTD" | "YTD";

export type KpiChipSettings = {
    chartEnabled: boolean;
    chartType: KpiChartType;
    trendPeriod: KpiTrendPeriod;
    projectionsEnabled: boolean;
    mainValue: KpiMainValue;
    showMTD: boolean;
    showQTD: boolean;
    showYTD: boolean;
};

export const areKpiChipSettingsEqual = (a: KpiChipSettings, b: KpiChipSettings) => {
    return a.chartEnabled === b.chartEnabled
        && a.chartType === b.chartType
        && a.trendPeriod === b.trendPeriod
        && a.projectionsEnabled === b.projectionsEnabled
        && a.mainValue === b.mainValue
        && a.showMTD === b.showMTD
        && a.showQTD === b.showQTD
        && a.showYTD === b.showYTD;
};

export type KpiItem = {
    id: string;
    label: string;
    unitLabel?: string;
    /**
     * Optional: where this KPI originated from in the flyout.
     * We'll start setting this from the flyout / parent later for stronger validation,
     * but this file does not require it to exist.
     */
    originCategoryId?: string;
    customSettings?: KpiChipSettings;
};

type FlyoutDragPayloadLegacy = {
    source: "KPI_FLYOUT";
    item: KpiItem;
    index?: number;
    /** legacy name coming from current KpiFlyout.tsx */
    categoryId?: string;
    /** new, correct name */
    fromCategoryId?: string;
};

type FlyoutDragPayloadMulti = {
    source: "KPI_FLYOUT";
    items: KpiItem[];
    /** legacy name coming from current KpiFlyout.tsx */
    categoryId?: string;
    /** new, correct name */
    fromCategoryId?: string;
};

type ChipDragPayload = {
    source: "KPI_CHIP";
    item: KpiItem;
    fromCategoryId: string;
    index: number;
};

type DragPayload = FlyoutDragPayloadLegacy | FlyoutDragPayloadMulti | ChipDragPayload;

type Props = {
    categoryId: string;
    items: KpiItem[];
    onAddFromFlyout: (categoryId: string, item: KpiItem) => void;
    onMoveChip: (
        fromCategoryId: string,
        toCategoryId: string,
        fromIndex: number,
        toIndex: number
    ) => void;
    onRemoveChip: (categoryId: string, itemId: string) => void;
    onUpdateChip: (categoryId: string, itemId: string, customSettings?: KpiChipSettings) => void;
    defaultChipSettings: KpiChipSettings;

    /**
     * If true, KPIs from any category are allowed to be dropped here.
     * If false/undefined, only KPIs from the same category can be dropped.
     */
    isCustomCategory?: boolean;
};

type InvalidReason = "wrongCategory" | null;

const KpiDropZone: React.FC<Props> = ({
    categoryId,
    items,
    onAddFromFlyout,
    onMoveChip,
    onRemoveChip,
    onUpdateChip,
    defaultChipSettings,
    isCustomCategory = false,
}) => {
    const [isOver, setIsOver] = useState(false);
    const [invalidReason, setInvalidReason] = useState<InvalidReason>(null);
    const [dragOverIndex, setDragOverIndex] = useState<number | null>(null);
    const [editingChipId, setEditingChipId] = useState<string | null>(null);
    const [editingSettings, setEditingSettings] = useState<KpiChipSettings>(defaultChipSettings);
    const [initialEditingSettings, setInitialEditingSettings] = useState<KpiChipSettings>(defaultChipSettings);
    const [revertingChipId, setRevertingChipId] = useState<string | null>(null);
    const [popoverPlacement, setPopoverPlacement] = useState<"top" | "bottom">("top");

    const chipRef = useRef<HTMLDivElement | null>(null);
    const chipWrapperRefs = useRef<Record<string, HTMLDivElement | null>>({});

    const showInvalid = invalidReason !== null;

    const invalidText = invalidReason === "wrongCategory"
        ? "KPI can only be added to its original category or a custom category"
        : "";

    const resetDragState = () => {
        setIsOver(false);
        setInvalidReason(null);
        setDragOverIndex(null);
    };

    const getEffectiveChipSettings = (item: KpiItem): KpiChipSettings => {
        return item.customSettings ?? defaultChipSettings;
    };

    const isChipCustomized = (item: KpiItem) => {
        return !areKpiChipSettingsEqual(getEffectiveChipSettings(item), defaultChipSettings);
    };

    const openEditChip = (item: KpiItem) => {
        const currentSettings = getEffectiveChipSettings(item);
        const bounds = chipWrapperRefs.current[item.id]?.getBoundingClientRect();
        const estimatedPopoverHeight = 360;
        const spaceAbove = bounds?.top ?? 0;
        const spaceBelow = typeof window !== "undefined"
            ? window.innerHeight - (bounds?.bottom ?? 0)
            : 0;

        setEditingChipId(item.id);
        setEditingSettings(currentSettings);
        setInitialEditingSettings(currentSettings);
        setPopoverPlacement(spaceAbove < estimatedPopoverHeight && spaceBelow > spaceAbove ? "bottom" : "top");
    };

    const closeEditChip = (revertChanges = true) => {
        if (revertChanges && editingChipId) {
            onUpdateChip(
                categoryId,
                editingChipId,
                areKpiChipSettingsEqual(initialEditingSettings, defaultChipSettings)
                    ? undefined
                    : initialEditingSettings,
            );
        }
        setEditingChipId(null);
        setEditingSettings(defaultChipSettings);
        setInitialEditingSettings(defaultChipSettings);
        setPopoverPlacement("top");
    };

    const applyEditingSettings = useCallback((updater: (prev: KpiChipSettings) => KpiChipSettings) => {
        setEditingSettings((prev) => {
            const next = updater(prev);

            if (editingChipId) {
                onUpdateChip(
                    categoryId,
                    editingChipId,
                    areKpiChipSettingsEqual(next, defaultChipSettings) ? undefined : next,
                );
            }

            return next;
        });
    }, [categoryId, defaultChipSettings, editingChipId, onUpdateChip]);

    const flashInvalid = (reason: InvalidReason) => {
        if (!reason) return;
        setInvalidReason(reason);
        setTimeout(() => setInvalidReason(null), 2000);
    };

    const handleDragOver = (e: React.DragEvent) => {
        e.preventDefault();
        setIsOver(true);
    };

    const handleDragLeave = () => {
        resetDragState();
    };

    const getFlyoutFromCategoryId = (payload: FlyoutDragPayloadLegacy | FlyoutDragPayloadMulti) => {
        // Support both new and legacy names
        return payload.fromCategoryId ?? payload.categoryId ?? "";
    };

    const getFlyoutItems = (payload: FlyoutDragPayloadLegacy | FlyoutDragPayloadMulti): KpiItem[] => {
        // Support multi and legacy single item shape
        if ("items" in payload && Array.isArray(payload.items)) return payload.items;
        if ("item" in payload && payload.item) return [payload.item];
        return [];
    };

    const isWrongCategoryDrop = (fromCategoryId: string) => {
        // If it's a custom category dropzone, all KPIs are allowed.
        if (isCustomCategory) return false;

        // Not custom category: must match origin category
        return fromCategoryId !== categoryId;
    };

    const handleDrop = (e: React.DragEvent) => {
        e.preventDefault();

        const data = e.dataTransfer.getData("drag-item");
        if (!data) return;

        let payload: DragPayload;
        try {
            payload = JSON.parse(data) as DragPayload;
        } catch {
            // ignore malformed payload
            resetDragState();
            return;
        }

        const insertIndex = dragOverIndex ?? items.length;

        // Dropping KPI(s) from flyout
        if (payload.source === "KPI_FLYOUT") {
            const fromCategoryId = getFlyoutFromCategoryId(payload);
            const kpisToAdd = getFlyoutItems(payload);

            // Safety: nothing to add
            if (kpisToAdd.length === 0) {
                resetDragState();
                return;
            }

            // Validation: wrong category (unless custom)
            if (isWrongCategoryDrop(fromCategoryId)) {
                flashInvalid("wrongCategory");
                // resetDragState();
                return;
            }

            // Add all KPIs (multi-drag) in order
            // Note: onAddFromFlyout currently appends in parent; insertIndex is reserved for later enhancement.
            kpisToAdd.forEach((kpi) => onAddFromFlyout(categoryId, kpi));

            resetDragState();
            return;
        }

        if (payload.source === "KPI_CHIP") {
            // enforce same validation rules as flyout drops
            if (!isCustomCategory && payload.fromCategoryId !== categoryId) {
                flashInvalid("wrongCategory");
                return;
            }

            onMoveChip(payload.fromCategoryId, categoryId, payload.index, insertIndex);
            resetDragState();
            return;
        }

        resetDragState();
    };

    const editingChip = useMemo(
        () => items.find((item) => item.id === editingChipId) ?? null,
        [items, editingChipId],
    );

    const isChipSettingsDirty = Boolean(
        editingChip && !areKpiChipSettingsEqual(editingSettings, initialEditingSettings),
    );

    const showMTDToggle = editingSettings.mainValue !== "MTD";
    const showQTDToggle = editingSettings.mainValue !== "QTD";
    const showYTDToggle = editingSettings.mainValue !== "YTD";

    const saveChipSettings = () => {
        closeEditChip(false);
    };

    const chartBtnStyle: React.CSSProperties = {
        outline: '2px solid transparent',
        borderRadius: 8,
    };
    const chartBtnSelectedStyle: React.CSSProperties = {
        outline: '2px solid var(--green-500, #2BB673)',
        borderRadius: 8,
    };

    return (
        <>
            <ToolTip
                visible={showInvalid}
                type="Text Only"
                direction="Top-Center"
                text={invalidText}
                outerContainerClass={styles["dropzone-outer-container"]}
                wrapperComponent={
                    <div
                        className={`${styles.dropZone} ${isOver ? styles.active : ""} ${showInvalid ? styles.invalid : ""
                            }`}
                        onDragOver={handleDragOver}
                        onDragLeave={handleDragLeave}
                        onDrop={handleDrop}
                    >
                        {items.length === 0 ? (
                            <button type="button" className={styles.addHint}>
                                + Drop KPI here
                            </button>
                        ) : (
                            items.map((item, index) => {
                                const isEditing = editingChipId === item.id;
                                const isCustomized = isChipCustomized(item);

                                return (
                                    <div key={item.id} className={styles.chipRowWrapper} ref={(node) => {
                                        chipWrapperRefs.current[item.id] = node;
                                    }}>
                                        <div
                                            ref={chipRef}
                                            className={styles.kpiChipRow}
                                            draggable
                                            onDragOver={(e) => {
                                                e.preventDefault();
                                                setDragOverIndex(index);
                                            }}
                                            onDragStart={(e) => {
                                                if (chipRef.current) {
                                                    e.dataTransfer.setDragImage(chipRef.current, 20, 20);
                                                }
                                                e.dataTransfer.setData(
                                                    "drag-item",
                                                    JSON.stringify({
                                                        source: "KPI_CHIP",
                                                        item,
                                                        fromCategoryId: categoryId,
                                                        index,
                                                    } satisfies ChipDragPayload)
                                                );
                                            }}
                                        >
                                            <div className={styles.kpiChipMeta}>
                                                <span className={styles.kpiChipLabel}>{item.label}</span>
                                                {isCustomized && (
                                                    <span className={styles.kpiChipSubtitle}>Setup Changed</span>
                                                )}
                                            </div>

                                            <div className={styles.kpiChipActions}>
                                                {isCustomized && (
                                                    <button
                                                        type="button"
                                                        className={styles.removeBtn}
                                                        onClick={(e) => {
                                                            e.stopPropagation();
                                                            setRevertingChipId(item.id);
                                                        }}
                                                        aria-label="Revert KPI setup"
                                                    >
                                                        <Icon name="refresh-ccw-01" size="xm" color="neutrals-B400" />
                                                    </button>
                                                )}
                                                <button
                                                    type="button"
                                                    className={styles.removeBtn}
                                                    onClick={(e) => {
                                                        e.stopPropagation();
                                                        openEditChip(item);
                                                    }}
                                                    aria-label="Edit KPI setup"
                                                >
                                                    <Icon name="edit-01" size="xm" color="neutrals-B400" />
                                                </button>
                                                <button
                                                    type="button"
                                                    className={styles.removeBtn}
                                                    onClick={(e) => {
                                                        e.stopPropagation();
                                                        onRemoveChip(categoryId, item.id);
                                                    }}
                                                    aria-label="Remove KPI"
                                                >
                                                    <Icon name="x-close" size="xm" color="neutrals-B400" />
                                                </button>
                                            </div>
                                        </div>

                                        {isEditing && (
                                            <div className={`${styles.kpiChipPopover} ${popoverPlacement === 'bottom' ? styles.kpiChipPopoverBottom : styles.kpiChipPopoverTop}`}>
                                                <div className={styles.kpiChipPopoverHeader}>
                                                    <span className={styles.kpiChipPopoverTitle}>Edit KPI Card</span>
                                                    <button
                                                        type="button"
                                                        className={styles.kpiChipPopoverClose}
                                                        onClick={() => closeEditChip(true)}
                                                        aria-label="Close edit popup"
                                                    >
                                                        <Icon name="x-close" size="xm" color="neutrals-B400" />
                                                    </button>
                                                </div>

                                                <div className={styles.kpiChipPopoverBody}>
                                                    <div className={styles.kpiChipSettingRow}>
                                                        <span>Chart</span>
                                                        <Switch
                                                            onToggle={(checked) => applyEditingSettings((prev) => ({ ...prev, chartEnabled: checked }))}
                                                            position="right"
                                                            checked={editingSettings.chartEnabled}
                                                        />
                                                    </div>

                                                    {editingSettings.chartEnabled && (
                                                        <>
                                                            <div className={styles.kpiChipSettingRow}>
                                                                <span>Chart Type</span>
                                                                <div className={styles.kpiChipChartButtons}>
                                                                    <div style={editingSettings.chartType === 'area' ? chartBtnSelectedStyle : chartBtnStyle}>
                                                                        <ChartTypeButton icon={<FilledAreaIcon />} onClick={() => applyEditingSettings((prev) => ({ ...prev, chartType: 'area' }))} size={56} />
                                                                    </div>
                                                                    <div style={editingSettings.chartType === 'bar-clustered' ? chartBtnSelectedStyle : chartBtnStyle}>
                                                                        <ChartTypeButton icon={<ClusteredColumnIcon />} onClick={() => applyEditingSettings((prev) => ({ ...prev, chartType: 'bar-clustered' }))} size={56} />
                                                                    </div>
                                                                    <div style={editingSettings.chartType === 'line' ? chartBtnSelectedStyle : chartBtnStyle}>
                                                                        <ChartTypeButton icon={<SingleLineIcon />} onClick={() => applyEditingSettings((prev) => ({ ...prev, chartType: 'line' }))} size={56} />
                                                                    </div>
                                                                </div>
                                                            </div>

                                                            <div className={styles.kpiChipSettingRow}>
                                                                <span>Trend Period</span>
                                                                <SegmentedControl
                                                                    onClick={(val: any) => applyEditingSettings((prev) => ({ ...prev, trendPeriod: val }))}
                                                                    options={[{ value: '3M' }, { value: '6M' }, { value: '1Y' }]}
                                                                    size="S"
                                                                    selected={editingSettings.trendPeriod}
                                                                />
                                                            </div>

                                                            <div className={styles.kpiChipSettingRow}>
                                                                <span>Projections</span>
                                                                <Switch
                                                                    onToggle={(checked) => applyEditingSettings((prev) => ({ ...prev, projectionsEnabled: checked }))}
                                                                    position="right"
                                                                    checked={editingSettings.projectionsEnabled}
                                                                />
                                                            </div>
                                                        </>
                                                    )}

                                                    <div className={styles.kpiChipSettingRow}>
                                                        <span>Main Value</span>
                                                        <SegmentedControl
                                                            onClick={(val: any) => applyEditingSettings((prev) => ({ ...prev, mainValue: val }))}
                                                            options={[{ value: 'MTD' }, { value: 'QTD' }, { value: 'YTD' }]}
                                                            size="S"
                                                            selected={editingSettings.mainValue}
                                                        />
                                                    </div>

                                                    {showMTDToggle && (
                                                        <div className={styles.kpiChipSettingRow}>
                                                            <span>MTD</span>
                                                            <Switch
                                                                onToggle={(checked) => applyEditingSettings((prev) => ({ ...prev, showMTD: checked }))}
                                                                position="right"
                                                                checked={editingSettings.showMTD}
                                                            />
                                                        </div>
                                                    )}
                                                    {showQTDToggle && (
                                                        <div className={styles.kpiChipSettingRow}>
                                                            <span>QTD</span>
                                                            <Switch
                                                                onToggle={(checked) => applyEditingSettings((prev) => ({ ...prev, showQTD: checked }))}
                                                                position="right"
                                                                checked={editingSettings.showQTD}
                                                            />
                                                        </div>
                                                    )}
                                                    {showYTDToggle && (
                                                        <div className={styles.kpiChipSettingRow}>
                                                            <span>YTD</span>
                                                            <Switch
                                                                onToggle={(checked) => applyEditingSettings((prev) => ({ ...prev, showYTD: checked }))}
                                                                position="right"
                                                                checked={editingSettings.showYTD}
                                                            />
                                                        </div>
                                                    )}
                                                </div>

                                                <div className={styles.kpiChipPopoverFooter}>
                                                    <Button text="Save" variant="Primary" onClick={saveChipSettings} disabled={!isChipSettingsDirty} />
                                                </div>
                                            </div>
                                        )}

                                        {isOver && dragOverIndex === index && (
                                            <div className={styles.insertLine} />
                                        )}
                                    </div>
                                );
                            })
                        )}
                    </div>
                }
            />
            <Dialog
                title="Revert to Default Setup"
                content="Are you sure you want to revert the KPI setup back to default?"
                isOpen={Boolean(revertingChipId)}
                onClose={() => setRevertingChipId(null)}
                onPrimaryButtonClick={() => {
                    if (revertingChipId) {
                        onUpdateChip(categoryId, revertingChipId, undefined);
                    }
                    setRevertingChipId(null);
                }}
                onSecondaryButtonClick={() => setRevertingChipId(null)}
                primaryButtonText="Revert"
                secondaryButtonText="Don't Revert"
                color="neutrals-B800"
            />
        </>
    );
};

export default KpiDropZone;