import React, { useMemo, useRef, useState } from "react";
import styles from "./KpiFlyout.module.scss";
import { Accordion, CheckBox, Icon, SearchInput } from "konnect-react-components";

export type FieldType = "Measure" | "Geography" | "Time" | "Dimension";

export interface FieldItem {
    id: string;
    label: string;
    type: FieldType;
}

type KpiItem = {
    unitLabel?: string;
    id: string;
    label: string;
};

export type KpiCategory = {
    id: string;
    title: string;
    kpis: KpiItem[];
};

interface Props {
    fields: KpiCategory[];
    onSelect?: (field: FieldItem) => void;
}

type FlyoutDragPayload = {
    source: "KPI_FLYOUT";
    fromCategoryId: string;
    items: KpiItem[];
};

const KpiFlyout: React.FC<Props> = ({ fields, onSelect }) => {
    const [search, setSearch] = useState("");
    const chipRef = useRef<HTMLDivElement | null>(null);

    /**
     * Selection is scoped by category.
     * User may select across categories, but a drag only carries the selection
     * from the category where the drag started.
     */
    const [selectedByCategory, setSelectedByCategory] = useState<Record<string, Set<string>>>({});

    const filteredCategories = useMemo(() => {
        const q = search.trim().toLowerCase();
        if (!q) return fields;

        return fields
            .map((cat) => ({
                ...cat,
                kpis: cat.kpis.filter((k) => k.label.toLowerCase().includes(q)),
            }))
            .filter((cat) => cat.kpis.length > 0);
    }, [search, fields]);

    const isSelected = (categoryId: string, kpiId: string) => {
        return selectedByCategory[categoryId]?.has(kpiId) ?? false;
    };

    const toggleSelected = (categoryId: string, kpi: KpiItem) => {
        setSelectedByCategory((prev) => {
            const next: Record<string, Set<string>> = { ...prev };
            const set = new Set(next[categoryId] ?? []);
            const already = set.has(kpi.id);

            if (already) set.delete(kpi.id);
            else set.add(kpi.id);

            next[categoryId] = set;
            return next;
        });

        // Preserve existing behavior: notify parent when user selects.
        // Only fire onSelect when the KPI becomes selected (not on unselect).
        if (!isSelected(categoryId, kpi.id)) {
            onSelect?.(kpi as unknown as FieldItem);
        }
    };

    const buildDragItems = (category: KpiCategory, draggedKpi: KpiItem): KpiItem[] => {
        const selectedSet = selectedByCategory[category.id];
        const draggedIsSelected = selectedSet?.has(draggedKpi.id);

        if (!draggedIsSelected) {
            // Dragging a non-selected KPI -> only drag that KPI
            return [draggedKpi];
        }

        // Dragging a selected KPI -> drag all selected KPIs from this category (in display order)
        return category.kpis.filter((k) => selectedSet?.has(k.id));
    };

    return (
        <div className={styles.container}>
            <div className={styles.title}>KPI List</div>
            <div className={styles.subtitle}>Select KPI’s to add in widget</div>

            <div className={styles.searchBox}>
                <SearchInput placeholder="Search" onChange={(e) => setSearch(e as string)} />
            </div>

            {filteredCategories.map((cat) => (
                <Accordion key={cat.id} title={cat.title} outlined={false} containerWidth={"100%"} leftRightSpaceZero>
                    <div className={styles.kpiCategoryDropdownContent}>
                        {cat.kpis.map((kpi) => {
                            const checked = isSelected(cat.id, kpi.id);

                            return (
                                <div
                                    key={kpi.id}
                                    ref={chipRef}
                                    className={styles.dragHandle}
                                    draggable
                                    onDragStart={(e) => {
                                        const items = buildDragItems(cat, kpi);

                                        const payload: FlyoutDragPayload = {
                                            source: "KPI_FLYOUT",
                                            fromCategoryId: cat.id,
                                            items: items.map((x) => ({
                                                id: x.id,
                                                label: x.label,
                                                unitLabel: x.unitLabel,
                                            })),
                                        };

                                        // Optional: better drag image if we have a ref
                                        if (chipRef.current) {
                                            e.dataTransfer.setDragImage(chipRef.current, 20, 20);
                                        }

                                        e.dataTransfer.setData("drag-item", JSON.stringify(payload));
                                    }}
                                >
                                    <span className={styles.icon}>
                                        <Icon name="hash-02" size="xs" color="neutrals-B60" />
                                    </span>
                                    <CheckBox
                                        label={kpi.label}
                                        checked={checked}
                                        onChange={() => toggleSelected(cat.id, kpi)}
                                    />
                                </div>
                            );
                        })}
                    </div>
                </Accordion>
            ))}
        </div>
    );
};

export default KpiFlyout;