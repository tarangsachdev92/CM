import React, { useEffect, useState } from "react";
import styles from "./DimentionValueChip.module.scss";
import { Icon } from 'konnect-react-components';
import { Popover } from "antd";
import { FieldItem } from "./DataFieldFlyout";

export type CategoryType = "Measure" | "Dimension" | "Time" | "Geography" | "Target" | "Tolerance";
export interface DimentionValueChipProps {
    label: string;
    value: string;
    category?: CategoryType;
    icon?: string;
    onRemove: (id: string) => void;
    onEdit?: () => void;
    className?: string;
    id: string;
    allowed: string[];
    EditComponent: React.ReactNode;
    draggingItem: FieldItem;
    isEdit: boolean;
    setIsEdit: (isEdit: boolean, id: string, groupChisId?: string) => void;
    eyeOpen?: boolean;
    setIsEyeOpenInParent: (eyeOpen: boolean, label: string) => void;
    hideIcon?: boolean
    groupedItem?: FieldItem | undefined;
    chipsEditEdit?: string | undefined;
    lastItemEyeOpen?: boolean;

}
const defaultSize = "xm"

const categoryIconMap: Record<CategoryType, any> = {
    Measure: "hash-02",
    Dimension: "cube-01",
    Time: "clock",
    Geography: "globe-01",
    Target: "hash-02",
    Tolerance: "hash-02"
};

const DimentionValueChip: React.FC<DimentionValueChipProps> = ({
    label,
    value,
    category,
    icon,
    onRemove,
    EditComponent,
    className,
    id,
    allowed,
    draggingItem,
    isEdit,
    setIsEdit,
    onEdit,
    eyeOpen,
    setIsEyeOpenInParent,
    hideIcon,
    groupedItem,
    chipsEditEdit,
    lastItemEyeOpen
}) => {
    const [isEyeOpen, setIsEyeOpen] = useState<boolean | undefined>(eyeOpen)
    const [expandId, setExpandId] = useState<string | null>(null)
    const renderIcon = icon || (category ? categoryIconMap[category] : null);

    useEffect(() => {
        setIsEyeOpen(eyeOpen)
    }, [eyeOpen])

    const renderEditMenu = (item?: FieldItem) => {
        const isChildEdit = Boolean(item);

        const isThisPopoverOpen =
            isEdit &&
            (
                isChildEdit
                    ? chipsEditEdit === item?.id
                    : !chipsEditEdit
            );

        return (
            <Popover
                open={isThisPopoverOpen}
                content={EditComponent}
                trigger="click"
            >
                <button
                    className={styles.editBtn}
                    type="button"
                    onClick={() => setIsEdit(!isThisPopoverOpen, id, item?.id)}
                >
                    <Icon
                        name={"edit-01"}
                        size={defaultSize}
                        color="neutrals-B100"
                    />
                </button>
            </Popover>
        );
    };

    return (
        <div className={`${styles.container} ${className || ""}`}>
            <div className={styles.subcontainer}>
                {groupedItem ? <>
                    <div className={styles.left}>
                        <button className={styles.closeBtn} onClick={() => setExpandId(expandId === groupedItem.id ? null : groupedItem.id)} type="button"> <Icon name={expandId === groupedItem.id ? "chevron-up" : "chevron-down"} size={defaultSize} color="neutrals-B100" /></button>
                        <span className={styles.text}>
                            {label} : <span className={styles.value}>{groupedItem.chip?.length}</span>
                        </span>
                    </div>
                    <div className={styles.actions}>
                        {onEdit && (
                            renderEditMenu()
                        )}
                        {!hideIcon && <button className={styles.closeBtn} onClick={() => {
                            if (lastItemEyeOpen) return;
                            setIsEyeOpenInParent(!isEyeOpen, label)
                            setIsEyeOpen(!isEyeOpen)
                        }}>
                            <Icon name={isEyeOpen ? 'eye' : "eye-off"} size={defaultSize} color="neutrals-B100" />
                        </button>}
                        <button className={styles.closeBtn} onClick={() => onRemove(id)}>
                            <Icon name={"x-close"} size={defaultSize} color="neutrals-B100" />
                        </button>
                    </div>


                </> : <>
                    <div className={styles.left}>
                        {renderIcon && <Icon name={renderIcon} size={defaultSize} color="neutrals-B100" />}
                        <span className={styles.text}>
                            {hideIcon ? label : label.split(" ").length > 0 ? label.split(" ")[0] : label} {!hideIcon && ':'} {!hideIcon && <span className={styles.value}>{value}</span>}
                        </span>
                    </div>
                    <div className={styles.actions}>
                        {onEdit && !hideIcon && renderEditMenu()}
                        {!hideIcon && <button className={styles.closeBtn} onClick={() => {
                            if (lastItemEyeOpen) return;
                            setIsEyeOpenInParent(!isEyeOpen, label)
                            setIsEyeOpen(!isEyeOpen)
                        }}>
                            <Icon name={isEyeOpen ? 'eye' : "eye-off"} size={defaultSize} color="neutrals-B100" />
                        </button>}
                        {<button className={styles.closeBtn} onClick={() => onRemove(id)}>
                            <Icon name={"x-close"} size={defaultSize} color="neutrals-B100" />
                        </button>}
                    </div>
                </>
                }

            </div>
            {groupedItem && expandId === groupedItem?.id && groupedItem?.chip?.map((item) => {
                const value = item.selected_value;
                const label = item.label;
                return (
                    <div style={{ marginTop: "15px", display: "flex", justifyContent: "space-between", paddingLeft: "20px" }} className={styles.subRow} key={item.id}>
                        <div className={styles.left}>
                            {/* Visual Anchor: Cube Icon for child items */}
                            <Icon name={renderIcon} size={defaultSize} color="neutrals-B100" />
                            <span className={styles.text}>
                                {label} : <span className={styles.value}>{value}</span>
                            </span>
                        </div>
                        <div className={styles.actions}>
                            {onEdit && (
                                renderEditMenu(item)
                            )}


                            <button className={styles.closeBtn} onClick={() => onRemove(item.id)}>
                                <Icon name={"x-close"} size={defaultSize} color="neutrals-B100" />
                            </button>

                        </div>
                    </div>
                );
            })}
            {allowed.includes(draggingItem?.label) && <div className={styles.underline} />}
        </div>
    );
};
export default DimentionValueChip;