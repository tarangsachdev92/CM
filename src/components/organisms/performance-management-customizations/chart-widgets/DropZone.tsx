import React, { useRef, useState } from "react";
import styles from "./DropZone.module.scss";
import DimentionValueChip, { CategoryType } from "./DimentionValueChip";
import { FieldItem } from "./DataFieldFlyout";
import { ToolTip } from "konnect-react-components";
import EditFieldModal, { SAVED_DATA } from "./EditFieldModal";

type AxisType = {
    yAxis: FieldItem[];
    secondaryYAxis: FieldItem[];
    xAxis: FieldItem[];
    target: FieldItem[];
    performanceIndicatorBase: string;
};

interface Props {
    items: FieldItem[];
    filtertab?: boolean;
    onDropItem?: (item: FieldItem) => void;
    axisSetup: AxisType;
    setAxisSetup: (item: FieldItem[]) => void;
    dataFieldType: CategoryType[];
    dataFieldId?: string[];
    onBtnClick: () => void;
    optionKey: string;
    xAxis?: boolean;
    handleOptionChange: (key: string, value: any) => void;
    setIsEyeOpenInParent: (eyeOpen: boolean, label: string) => void;
    singleKpi?: boolean;
    hideIcon?: boolean
}

type DropPosition = "before" | "inside" | "after";

type DropTarget = {
    index: number;
    position: DropPosition;
};

const DropZone: React.FC<Props> = ({
    items,
    filtertab,
    axisSetup,
    setAxisSetup,
    dataFieldType,
    dataFieldId,
    onBtnClick,
    optionKey,
    handleOptionChange,
    setIsEyeOpenInParent,
    xAxis,
    singleKpi,
    hideIcon
}) => {
    const groupCounterRef = useRef(1);

    const [isOver, setIsOver] = useState(false);
    const [invalid, setInvalid] = useState(false);
    const [draggingItem, setDraggingItem] = useState<FieldItem | null>(null);

    const [dropTarget, setDropTarget] = useState<DropTarget | null>(null);
    const dropTargetRef = useRef<DropTarget | null>(null);

    const [isEdit, setIsEdit] = useState(false);
    const [editItemId, setEditItemId] = useState("");
    const [editItemChipId, setEditItemChipId] = useState<string | undefined>();

    const setCurrentDropTarget = (target: DropTarget | null) => {
        dropTargetRef.current = target;
        setDropTarget(target);
    };

    const clearDragState = () => {
        setIsOver(false);
        setDraggingItem(null);
        setCurrentDropTarget(null);
    };

    const getFlattenedAxisItems = () => {
        return [
            ...axisSetup.yAxis,
            ...axisSetup.secondaryYAxis,
            ...axisSetup.xAxis,
            ...axisSetup.target
        ].flatMap((itm: FieldItem) => (itm.chip ? itm.chip : [itm]));
    };

    const checkIfInvalid = (item: FieldItem, source: string) => {

        if (source !== "DATA_FIELD") return false;

        const alreadyExists = getFlattenedAxisItems().some(
            (itm: FieldItem) => itm.id === item.id
        );
       
        let typeNotAllowed: boolean;
        if (dataFieldId) {

            typeNotAllowed = !dataFieldType.includes(item.type) || !dataFieldId?.includes(item?.parentId ?? "");
        } else {
            typeNotAllowed = !dataFieldType.includes(item.type);

        }

        return alreadyExists || typeNotAllowed;
    };

    const normalizeItemsForGroup = (itm: FieldItem, fallbackSource?: string): FieldItem[] => {
        if (itm.chip && itm.chip.length > 0) {
            return itm.chip.map((child: FieldItem) => ({
                ...child,
                source: child.source || itm.source || fallbackSource || "xAxis"
            }));
        }

        return [
            {
                ...itm,
                source: itm.source || fallbackSource || "xAxis"
            }
        ];
    };

    const getNextGroupNumber = () => {
        const groupNumbers = items
            .map((itm: FieldItem) => {
                const match = `${itm.id || ""}`.match(/^group-(\d+)$/);
                return match ? Number(match[1]) : 0;
            })
            .filter(Boolean);

        const maxExistingGroupNumber = groupNumbers.length
            ? Math.max(...groupNumbers)
            : 0;

        const nextGroupNumber = Math.max(
            groupCounterRef.current,
            maxExistingGroupNumber + 1
        );

        groupCounterRef.current = nextGroupNumber + 1;

        return nextGroupNumber;
    };

    const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
        e.preventDefault();
        e.dataTransfer.dropEffect = "move";
        setIsOver(true);

        /**
         * If user is dragging over empty space inside the container,
         * then drop should append to the end.
         *
         * Important:
         * Do not clear target when event is coming from chip children.
         */
        if (e.target === e.currentTarget) {
            setCurrentDropTarget(null);
        }
    };

    const handleDragLeave = (e: React.DragEvent<HTMLDivElement>) => {
        const relatedTarget = e.relatedTarget as Node | null;

        if (relatedTarget && e.currentTarget.contains(relatedTarget)) {
            return;
        }

        setIsOver(false);
        setInvalid(false);
        setCurrentDropTarget(null);
    };

    const handleChipDragOver = (
        e: React.DragEvent<HTMLDivElement>,
        index: number
    ) => {
        e.preventDefault();
        e.stopPropagation();

        e.dataTransfer.dropEffect = "move";
        setIsOver(true);

        const rect = e.currentTarget.getBoundingClientRect();
        const mouseY = e.clientY - rect.top;
        const ratio = mouseY / rect.height;

        let position: DropPosition;

        /**
         * Top 35%    => reorder before
         * Middle 30% => group
         * Bottom 35% => reorder after
         */
        if (ratio < 0.35) {
            position = "before";
        } else if (ratio > 0.65) {
            position = "after";
        } else {
            position = "inside";
        }

        setCurrentDropTarget({
            index,
            position
        });
    };

    const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
        e.preventDefault();
        if (singleKpi) return;

        const rawData = e.dataTransfer.getData("drag-item");

        if (!rawData) {
            clearDragState();
            return;
        }

        let parsedData: {
            source: string;
            item: FieldItem;
            index?: number;
        };

        try {
            parsedData = JSON.parse(rawData);
        } catch {
            clearDragState();
            return;
        }

        const { source, item, index: fromIndex } = parsedData;

        if (checkIfInvalid(item, source)) {
            setInvalid(true);
            setDraggingItem(null);
            setCurrentDropTarget(null);

            setTimeout(() => setInvalid(false), 2000);
            return;
        }

        const isSameSourceDrag = source === "CHIP";
        const target = dropTargetRef.current;

        const droppingItem: FieldItem =
            source === "CHIP"
                ? item
                : {
                    ...item,
                    eyeOpen: true
                };

        const originalItems = [...items];

        /**
         * CASE 1:
         * Drop outside any chip / empty area.
         * Append item at the end.
         */
        if (!target) {
            let updated = [...originalItems];

            if (isSameSourceDrag && typeof fromIndex === "number") {
                updated = updated.filter((_, idx) => idx !== fromIndex);
            }

            updated.push(droppingItem);

            setAxisSetup(updated);
            clearDragState();
            return;
        }

        const targetItem = originalItems[target.index];

        if (!targetItem) {
            clearDragState();
            return;
        }

        /**
         * If dragging same chip on itself, do nothing.
         */
        if (
            isSameSourceDrag &&
            typeof fromIndex === "number" &&
            originalItems[fromIndex]?.id === targetItem.id
        ) {
            clearDragState();
            return;
        }

        /**
         * Remove dragged item first by id/index.
         * Then locate target again by id.
         * This avoids wrong index calculation when dragging bottom-to-top or top-to-bottom.
         */
        let updatedItems = [...originalItems];

        if (isSameSourceDrag && typeof fromIndex === "number") {
            updatedItems = updatedItems.filter((_, idx) => idx !== fromIndex);
        }

        const currentTargetIndex = updatedItems.findIndex(
            (itm: FieldItem) => itm.id === targetItem.id
        );

        if (currentTargetIndex === -1) {
            clearDragState();
            return;
        }

        /**
         * CASE 2:
         * Drop in middle area of chip.
         * If target is already a group, push into that group.
         * Otherwise create a new group.
         */
        if (target.position === "inside") {
            const currentTargetItem = updatedItems[currentTargetIndex];

            if (currentTargetItem?.chip) {
                const updatedGroup: FieldItem = {
                    ...currentTargetItem,
                    chip: [
                        ...currentTargetItem.chip,
                        ...normalizeItemsForGroup(
                            droppingItem,
                            currentTargetItem.source || "xAxis"
                        )
                    ]
                };

                updatedItems.splice(currentTargetIndex, 1, updatedGroup);
                setAxisSetup(updatedItems);
                clearDragState();
                return;
            }

            const groupNumber = getNextGroupNumber();

            const newGroup: FieldItem = {
                id: `group-${groupNumber}`,
                label: `Group${groupNumber}`,
                display: `Group${groupNumber}`,
                type: currentTargetItem?.type || droppingItem.type || "string",
                allowed: currentTargetItem?.allowed || [],
                selected_value: "",
                source: currentTargetItem?.source || droppingItem.source || "xAxis",
                groupId: `group-${groupNumber}`,
                groupName: `Group${groupNumber}`,
                chip: [
                    ...normalizeItemsForGroup(
                        currentTargetItem as any,
                        currentTargetItem?.source || "xAxis"
                    ),
                    ...normalizeItemsForGroup(
                        droppingItem,
                        currentTargetItem?.source || droppingItem.source || "xAxis"
                    )
                ]
            };

            updatedItems.splice(currentTargetIndex, 1, newGroup);

            setAxisSetup(updatedItems);
            clearDragState();
            return;
        }

        /**
         * CASE 3:
         * Reorder / insert before or after target.
         */
        let insertIndex =
            target.position === "before"
                ? currentTargetIndex
                : currentTargetIndex + 1;

        if (insertIndex < 0) insertIndex = 0;
        if (insertIndex > updatedItems.length) insertIndex = updatedItems.length;

        updatedItems.splice(insertIndex, 0, droppingItem);

        setAxisSetup(updatedItems);
        clearDragState();
    };

    const onRemoveChip = (item: FieldItem, id: string) => {
        if (item.id.includes("group") && id.includes("group")) {

            const updated = items
                .filter((itm) => itm.id !== id)
                .map((t, idx) => ({
                    ...t,
                    display:
                        idx % 2 === 0
                            ? `${t.label} Target`
                            : `${t.label} Tolerance`,
                }));


            setAxisSetup(updated);
            return
        }
        //  CASE 1: If it's a group
        if (item.id.includes("group")) {
            const updated = items.map((itm) => {
                if (itm.id === item.id && itm.chip) {
                    const updatedChips = itm.chip.filter(ch => ch.id !== id);

                    return {
                        ...itm,
                        chip: updatedChips
                    };
                }
                return itm;
            });

            setAxisSetup(updated);
            return;
        }

        //  CASE 2: Normal item (your existing logic)
        const updated = items
            .filter((itm) => itm.id !== id)
            .map((t, idx) => ({
                ...t,
                display:
                    idx % 2 === 0
                        ? `${t.label}`
                        : `${t.label}`,
            }));

        setAxisSetup(updated);

        handleOptionChange(
            optionKey,
            updated.map((i) => i.label)
        );
    };

    const getEditMenuOptions = (label: string) => {
        return label === "Month"
            ? {
                name: "Month",
                select_options: [
                    "all_months",
                    "current_month",
                    "previous_month",
                    "next_x_months",
                    "prev_x_months",
                    "custom",
                    "custom_range"
                ]
            }
            : {
                name: label,
                select_options: [
                    "select",
                    "all_regions",
                    "top",
                    "bottom",
                    "custom"
                ]
            };
    };

    const updateChipDataOnEdit = (
        savedData: SAVED_DATA
    ) => {

        const isGroupRename =
            savedData.selectedValues.name?.includes("group");

        const updated = items.map((item: FieldItem) => {
            /**
             * CASE 1:
             * Rename group by group id from savedData.selectedValues.name
             *
             * Example savedData:
             * {
             *   updatedName: "mmmmm",
             *   selectedValues: {
             *     name: "group-1",
             *     values: []
             *   }
             * }
             */
            if (isGroupRename && item.id === savedData.selectedValues.name) {
                return {
                    ...item,
                    label: savedData.updatedName,
                    display: savedData.updatedName,
                    groupName: savedData.updatedName,
                    selected_value: item.selected_value
                };
            }

            /**
             * CASE 2:
             * Editing child chip inside group.
             * editItemId = group id
             * editItemChipId = chip id inside that group
             */
            if (
                editItemChipId &&
                item.id === editItemId &&
                item.chip
            ) {
                return {
                    ...item,
                    chip: item.chip.map((chipItem: FieldItem) => {
                        if (chipItem.id === editItemChipId) {
                            return {
                                ...chipItem,
                                display: savedData.updatedName,
                                selected_value: savedData.selectedValues.name
                            };
                        }

                        return chipItem;
                    })
                };
            }

            /**
             * CASE 3:
             * Editing normal item.
             */
            if (item.id === editItemId) {
                return {
                    ...item,
                    display: savedData.updatedName,
                    selected_value: savedData.selectedValues.name
                };
            }

            return item;
        });

        setAxisSetup(updated);
    };

    return (
        <ToolTip
            visible={invalid}
            type="Text Only"
            direction="Top-Center"
            text={"Data field cannot be placed here"}
            wrapperComponent={
                <div
                    className={`
                        ${styles.chipContainer}
                        ${isOver ? styles.active : ""}
                        ${invalid ? styles.invalid : ""}
                    `}
                    onDragOver={handleDragOver}
                    onDragLeave={handleDragLeave}
                    onDrop={handleDrop}
                    onDragEnd={clearDragState}
                >
                    {items.length === 0 ? (
                        <button
                            className={styles.addField}
                            onClick={(e) => {
                                e.preventDefault();
                                onBtnClick();
                            }}
                        >
                            + Add Data Fields
                        </button>
                    ) : (
                        items.map((item: FieldItem, index: number) => {
                            const isCurrentDropTarget =
                                dropTarget?.index === index;

                            return (
                                <div
                                    key={item.id}
                                    draggable
                                    onDragOver={(e) =>
                                        handleChipDragOver(e, index)
                                    }
                                    onDragStart={(e) => {
                                        e.dataTransfer.effectAllowed = "move";

                                        e.dataTransfer.setDragImage(
                                            e.currentTarget,
                                            20,
                                            20
                                        );

                                        e.dataTransfer.setData(
                                            "drag-item",
                                            JSON.stringify({
                                                source: "CHIP",
                                                item,
                                                index
                                            })
                                        );

                                        setDraggingItem(item);
                                    }}
                                    onDragEnd={clearDragState}
                                    data-drop-position={
                                        isCurrentDropTarget
                                            ? dropTarget?.position
                                            : undefined
                                    }
                                    className={`
                                        ${isCurrentDropTarget
                                            ? styles.hovered
                                            : ""
                                        }
                                    `}
                                >
                                    <DimentionValueChip
                                        setIsEyeOpenInParent={
                                            setIsEyeOpenInParent
                                        }
                                        lastItemEyeOpen={(xAxis && item.eyeOpen) ? true : false}

                                        eyeOpen={item.eyeOpen}
                                        EditComponent={
                                            <EditFieldModal
                                                category={item.type}
                                                options={getEditMenuOptions(
                                                    item.label
                                                )}
                                                isGroupId={item.id.includes("group") && !editItemChipId ? item : null}
                                                label={item.label}
                                                onSave={(
                                                    savedData: SAVED_DATA
                                                ) => {
                                                    const updatedSavedData = {
                                                        ...savedData,
                                                        selectedValues: {
                                                            ...savedData.selectedValues,
                                                            name:
                                                                savedData.selectedValues.name === "Custom Select"
                                                                    ? savedData.selectedValues.values?.join(",") || ""
                                                                    : savedData.selectedValues.name,
                                                        },
                                                    };

                                                    updateChipDataOnEdit(updatedSavedData);
                                                    setIsEdit(false);
                                                }}
                                            />
                                        }
                                        isEdit={
                                            item.id === editItemId && isEdit
                                        }
                                        chipsEditEdit={editItemChipId}
                                        setIsEdit={(
                                            isEditValue: boolean,
                                            id: string,
                                            groupChisId?: string
                                        ) => {
                                            setEditItemId(id);
                                            setEditItemChipId(groupChisId)
                                            setIsEdit(isEditValue);
                                        }}
                                        draggingItem={draggingItem as FieldItem}
                                        label={item.display}
                                        value={item.selected_value ?? ""}
                                        onRemove={(id) =>
                                            onRemoveChip(item, id)
                                        }
                                        hideIcon={
                                            (filtertab === true &&
                                                item.source === "xAxis") || hideIcon
                                        }
                                        onEdit={() => { }}
                                        category={item.type}
                                        id={item.id}
                                        allowed={item.allowed}
                                        groupedItem={
                                            item.chip ? item : undefined
                                        }
                                    />
                                </div>
                            );
                        })
                    )}
                </div>
            }
        />
    );
};

export default DropZone;