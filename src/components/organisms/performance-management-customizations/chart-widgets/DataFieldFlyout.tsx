import React, { ReactNode, useMemo, useRef, useState } from "react";
import styles from "./DataFieldFlyout.module.scss";
import { CategoryType } from "./DimentionValueChip";
import {
    Icon,
    SearchInput,
    SideMenu,
} from 'konnect-react-components';
import { OptionValue } from "./ChartCustomizationPanel";

export type FieldType = "Measure" | "Geography" | "Time" | "Dimension" | "Target" | "Tolerance";
export interface GroupChip {
    id: string;
    label: string;
};

export interface Group {
    id: string;
    name: string;
    chips: GroupChip[];
};
export interface FieldItem {
    id: string;
    label: string;
    type: FieldType;
    allowed: string[];
    display: string;
    selected_value?: string;
    eyeOpen?: boolean;
    source?: string;
    groupId?: string;
    groupName?: string;
    parentId?:string;
    chip?: FieldItem[]

}
interface Props {
    fields: FieldItem[] | OptionValue[] | undefined | null;
    onSelect?: (field: FieldItem, option: {
        label: ReactNode;
        value: string;
    }) => void;
    axisSetup: {
        yAxis: FieldItem[],
        secondaryYAxis: FieldItem[],
        xAxis: FieldItem[],
        target: FieldItem[],
    }
}

const categoryIconMap: Record<CategoryType, any> = {
    Measure: "hash-02",
    Dimension: "cube-01",
    Time: "clock",
    Geography: "globe-01",
    Target: "hash-02",
    Tolerance: "hash-02"

};

const DataFields: React.FC<Props> = ({ fields, onSelect, axisSetup }) => {
    const [search, setSearch] = useState<string | string[]>("");
    const chipRef = useRef(null)

    const filteredFields = useMemo(() => {
        return fields?.filter(f =>
            (f as FieldItem)?.label?.toLowerCase().includes((search as string).toLowerCase())
        );
    }, [fields, search]);

    const getIcon = (item: FieldItem) => {
        return categoryIconMap[item.type];
    }
    const defaultSize = "xm"

    const checkIfInvalid = (item: FieldItem) => {
        if ([...axisSetup.yAxis, ...axisSetup.secondaryYAxis, ...axisSetup.xAxis, ...axisSetup.target].filter(itm => itm.id === item.id).length) {
            return true
        }
        return false
    }

    const getOptionsForMenu = (item: FieldItem) => {
        if (item.type === 'Dimension' || item.type === "Geography" || item.type === "Time") {
            return [
                {
                    label: 'Add to x-axis',
                    value: 'x_axis_add',
                }
            ]
        } else {
            return [
                {
                    label: 'Add to y-axis',
                    value: 'y_axis_add',
                },
                {
                    label: 'Add to target',
                    value: 'target_axis_add',
                },
            ]
        }
    }

    return (
        <div className={styles.container}>
            <div className={styles.title}>Data Fields</div>
            <div className={styles.subtitle}>
                Drag and drop fields to selected areas
            </div>
            <div className={styles.searchBox}>
                <SearchInput
                    menuButton={false}
                    placeholder="Search"
                    className={styles['searchInput-performanceM-page']}
                    onChange={e => setSearch(e)}
                />
            </div>
            <div className={styles.list}>
                {filteredFields?.map((field, index) => (
                    <button
                        ref={chipRef.current}
                        draggable
                        itemType="button"
                        key={(field as FieldItem).id}
                        className={styles.item}
                        // onClick={() => onSelect?.(field as FieldItem)}
                        onDragStart={e => {
                            e.dataTransfer.setData(
                                "drag-item",
                                JSON.stringify({
                                    source: "DATA_FIELD",
                                    item: field,
                                    index: index
                                })
                            );
                        }
                        }
                    >
                        <div className={styles.itemSubContainer}>
                            <Icon name={getIcon(field as FieldItem)} size={defaultSize} color="neutrals-B100" />
                            <span className={styles.label}>{(field as FieldItem).label}</span>
                        </div>
                        {!checkIfInvalid(field as FieldItem) && <SideMenu
                            style={{ width: 10, marginRight: 10 }}
                            className={styles.menuContainer}
                            action={
                                <button className={styles.dotBtn} onClick={() => { }}>
                                    <Icon name={"dots-vertical"} size={defaultSize} color="neutrals-B100" />
                                </button>
                            }
                            onOptionSelect={(option: {
                                label: ReactNode;
                                value: string;
                            }) => {
                                onSelect?.(field as FieldItem, option)
                            }}
                            options={getOptionsForMenu(field as FieldItem)}
                        />}
                    </button>
                ))}
            </div>
        </div>
    );
};
export default DataFields;