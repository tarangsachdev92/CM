import React, { useState, useEffect } from "react";
import styles from "./EditFieldModal.module.css";
import { Button, CheckBox, IconButton, InputField, Radio, SearchInput } from "konnect-react-components";
import { getGeographyHeirarchy, getProductHeirarchy } from "../../../../services/users";
import { logError } from "../../../../utils/helpers";
import { EditMenuFiscalCalendar } from "./EditMenuFiscalCalendar";
import dayjs from "dayjs";
import { MultiDatePicker } from "./MultiSelectDatePicker";
import { FieldItem } from "./DataFieldFlyout";

type OptionType = "select" | "all_regions" | "top" | "bottom" | "custom" | "all_months" | "current_month" | "previous_month" | "next_x_months" | "prev_x_months" | "custom_range";

const OptionTypeGeoAndDimention = new Set(['region', 'cluster', 'site', 'market', 'area', 'segment', 'sub-segment', 'brand', 'sub-brand', 'sku'])

const MONTHS = [{ label: 'Jan' }, { label: 'Feb' }, { label: 'Mar' }, { label: 'Apr' }, { label: 'May' }, { label: 'Jun' }, { label: "Jul" }, { label: "Aug" }, { label: "Sep" }, { label: "Oct" }, { label: "Nov" }, { label: "Dec" }]

const QUARTER = [{ label: 'Quarter 1(Jan - Mar)' }, { label: 'Quarter 2(Apr - Jun)' }, { label: 'Quarter 3(Jul - Sep)' }, { label: 'Quarter 4(Oct - Dec)' }]

const YEARS = [{ label: '2023' }, { label: '2024' }, { label: '2025' }, { label: '2026' }]

const SHIFT = [{ label: "Shift 1" }, { label: "Shift 2" }, { label: "Shift 3" }]

const LINE = [{ label: "Actual" }, { label: "Target" }]

const getWeeksOfCurrentMonth = () => {
    const startOfMonth = dayjs().startOf("month");
    const endOfMonth = dayjs().endOf("month");
    let current = startOfMonth.startOf("week");
    const weeks = [];

    while (current.isBefore(endOfMonth)) {
        const weekStart = current.startOf("week");
        const weekEnd = current.endOf("week");
        weeks.push({
            label: `Week ${current.week()} (${weekStart.format("D MMM")} - ${weekEnd.format("D MMM")})`,
            start: weekStart.format("YYYY-MM-DD"),
            end: weekEnd.format("YYYY-MM-DD"),
        });
        current = current.add(1, "week");
    } return weeks;
};
const WEEK = getWeeksOfCurrentMonth();

const getDatesOfCurrentMonth = () => {
    const startOfMonth = dayjs().startOf("month");
    const endOfMonth = dayjs().endOf("month");
    const dates = [];
    let current = startOfMonth;
    while (current.isBefore(endOfMonth) || current.isSame(endOfMonth, "day")) {
        dates.push({
            label: current.format("D"),          // 1, 2, 3...
            value: current.format("YYYY-MM-DD"), // full date
        });
        current = current.add(1, "day");
    }
    return dates;
};

const DAYS = getDatesOfCurrentMonth();

export type SAVED_DATA = {
    updatedName: string,
    selectedValues: {
        name: string,
        values: string[],
        selectedOption?: string
    }
}

type EDIT_OPTION_VALUE = {
    name: string,
    selected_options: {
        name: string,
        values: string[]
    },
    custom_select: string[],
    custom_range: {
        start: string,
        end: string
    }
}

type Option = {
    label: string;
    value?: string;
    desc?: string;
    siteType?: string; //  used only for Site / SiteCode
};

type EditFieldModelProps = {
    onSave: (savedData: SAVED_DATA) => void;
    category: string;

    options: {
        name: string;
        select_options: string[]
    }

    label: string;
    selectedOptions?: any;
    chartHeader?: boolean;
    onClose?: () => void;
    isGroupId?: FieldItem | null
}

const EditFieldModal: React.FC<EditFieldModelProps> = ({ isGroupId, onSave, category, options, label, selectedOptions, chartHeader, onClose }) => {
    const [selectedOption, setSelectedOption] = useState<OptionType>(selectedOptions ?? "all_regions");
    const [search, setSearch] = useState<string | string[]>("");
    const [selectedValues, setSelectedValues] = useState<string[]>([]);

    const [groupRename, setGroupRename] = useState<string | undefined>(isGroupId?.label);
    const [monthValues, setMonthValues] = useState({
        next_x_months: "5",
        prev_x_months: "5",
        top: "5",
        bottom: "5"
    });
    const [dimensionName, setDimensionName] = useState<string>(options.name)
    const [editedData, setEditedData] = useState<EDIT_OPTION_VALUE>({
        name: '',
        selected_options: {
            name: '',
            values: ['']
        },
        custom_select: [],
        custom_range: {
            start: '',
            end: ''
        }
    })
    const [customOptions, setCustomOptions] = useState<Option[]>([{
        label: '',
        value: '',
        desc: '',
        siteType: ''
    }])
    useEffect(() => {
        fetchDefaultDropDownOptions()
    }, [])

    const getRequestParam = () => {
        if (label === "Region") {
            return { regionId: null }
        } else if (label === "Cluster") {
            return { clusterId: null }
        } else if (label === "Market") {
            return { marketId: null }
        } else if (label === "Site") {
            return { siteId: null }
        } else if (label === "Area") {
            return { areaId: null }
        } else if (label === "Segment") {
            return { segmentId: null }
        } else if (label === "Sub-Sengment") {
            return { subSegmentId: null }
        } else if (label === "Brand") {
            return { brandId: null }
        } else if (label === "Sub-Brand") {
            return { subBrandId: null }
        } else if (label === "SKU") {
            return { skuId: null }
        }
        return { regionId: null }
    }

    const fetchDefaultDropDownOptions = () => {
        if (category === "Geography") {
            fetchGeographyHeirarchy(getRequestParam());
        } else if (category === "Dimension") {
            fetchProductHeirarchy(getRequestParam());
        }
    };

    const fetchGeographyHeirarchy = async (
        payload: any
    ) => {
        const geographyHeirarchyResponse = await getGeographyHeirarchy(payload);
        fetchGeographyHierarchyDropdowns(geographyHeirarchyResponse[0]);
    };
    const fetchGeographyHierarchyDropdowns = (
        geographyHeirarchy: any,
    ) => {
        let customOpts: Option[] = []
        if (label === "Region") {
            customOpts = (geographyHeirarchy.regions || []).map(
                (obj: { region?: string; regionId: number }) => ({
                    label: `${obj.region ?? ''}`,
                    value: String(obj.regionId),
                    id: obj.regionId,
                }),
            );
        } else if (label === "Cluster") {
            customOpts = (geographyHeirarchy.clusters || []).map(
                (obj: { cluster?: string; clusterId: number }) => ({
                    label: `${obj.cluster ?? ''}`,
                    value: String(obj.clusterId),
                    id: obj.clusterId,
                }),
            );
        } else if (label === "Market") {
            customOpts = (geographyHeirarchy.markets || []).map(
                (obj: { market?: string; marketId: number }) => ({
                    label: `${obj.market ?? ''}`,
                    value: String(obj.marketId),
                    id: obj.marketId,
                }),
            );
        } else if (label === "Site") {
            type RawSite = {
                siteId: number;
                manufacturingSite?: string;
                siteCode?: string;
                siteType?: string;
            };

            const rawSites: RawSite[] = (geographyHeirarchy.sites || []) as RawSite[];

            customOpts = rawSites.map(s => ({
                label: s.manufacturingSite ?? '',
                value: String(s.siteId),
                siteType: s.siteType ?? '',
            }));
        } else if (label === "Area") {
            customOpts = []
        }
        setCustomOptions(customOpts)
    };

    const fetchProductHeirarchy = async (
        payload: any,
        pageSize: number = 20,
        pageNumber: number = 1,
    ) => {
        try {
            const res = await getProductHeirarchy({ ...payload, pageSize, pageNumber });

            const data = Array.isArray(res) ? (res[0] ?? {}) : (res ?? {});
            fetchProductHierarchyDropdowns(data);
        } catch (error) {
            logError('Error fetching product hierarchy:', error);
        }
    };

    const fetchProductHierarchyDropdowns = (
        productHeirarchy: any
    ) => {
        let customOpts: Option[] = []
        if (label === "Segment") {
            customOpts = (productHeirarchy.segments || []).map(
                (obj: { segment: string; segmentId: number }) => ({
                    label: `${obj.segment ?? ''}`,
                    value: String(obj.segmentId),
                    id: obj.segmentId,
                    desc: `${obj.segment ?? ''}`,
                }),
            );
        } else if (label === "Sub-Segment") {
            customOpts = (productHeirarchy.subSegements || []).map(
                (obj: { subSegment: string; subSegmentId: number }) => ({
                    label: `${obj.subSegment ?? ''}`,
                    value: String(obj.subSegmentId),
                    desc: `${obj.subSegment ?? ''}`,
                }),
            );

        } else if (label === "Brand") {
            customOpts = (productHeirarchy.brands || []).map(
                (obj: { brand: string; brandId: number }) => ({
                    label: `${obj.brand ?? ''}`,
                    value: String(obj.brandId),
                    desc: `${obj.brand ?? ''}`,
                }),
            );
        } else if (label === "Sub-Brand") {
            customOpts = (productHeirarchy.subBrands || []).map(
                (obj: { subBrand: string; subBrandId: number }) => ({
                    label: `${obj.subBrand ?? ''}`,
                    value: String(obj.subBrandId),
                    desc: `${obj.subBrand ?? ''}`,
                }),
            );

        } else if (label === "SKU") {
            customOpts = (productHeirarchy.skUs || [])
                .filter((obj: { sku?: string; skuId?: string }) => obj.sku && obj.skuId !== undefined)
                .map((obj: { sku: string; skuId: string }) => ({
                    label: `${obj.sku ?? ''}`,
                    value: String(obj.skuId),
                    desc: `${obj.sku ?? ''}`,
                }));
        }

        setCustomOptions(customOpts)
    }

    let filteredOptions: Option[] | string[] = []
    if (OptionTypeGeoAndDimention.has(label.toLowerCase())) {
        filteredOptions = customOptions.filter((item) =>
            item.label.toLowerCase().includes((search as string).toLowerCase())
        )
    } else if (label.toLowerCase() === "year") {
        filteredOptions = YEARS.filter((item) =>
            item.label.toLowerCase().includes((search as string).toLowerCase()))
    } else if (label.toLowerCase() === 'week') {
        filteredOptions = WEEK.filter((item) =>
            item.label.toLowerCase().includes((search as string).toLowerCase()))
    } else if (label.toLowerCase() === "quarter") {
        filteredOptions = QUARTER.filter((item) =>
            item.label.toLowerCase().includes((search as string).toLowerCase()))
    } else if (label.toLowerCase() === "shift") {
        filteredOptions = SHIFT.filter((item) =>
            item.label.toLowerCase().includes((search as string).toLowerCase()))
    } else if (label.toLowerCase() === "line") {
        filteredOptions = LINE.filter((item) =>
            item.label.toLowerCase().includes((search as string).toLowerCase()))
    } else if (label.toLowerCase() === "day") {
        filteredOptions = DAYS.filter((item) =>
            item.label.toLowerCase().includes((search as string).toLowerCase()))
    } else {
        filteredOptions = MONTHS.filter((item) =>
            item.label.toLowerCase().includes((search as string).toLowerCase())
        );
    }

    const toggleValue = (value: string) => {
        setSelectedValues((prev) =>
            prev.includes(value)
                ? prev.filter((v) => v !== value)
                : [...prev, value]
        );
    };

    const renderCustomDateSelection = () => {
        return (
            <>
                <p className={styles.sectionTitle}>From</p>
                <EditMenuFiscalCalendar selectedDateProp={editedData.custom_range.start} onSaveDate={(date: any) => {
                    setEditedData({
                        ...editedData, custom_range: {
                            ...editedData?.custom_range,
                            start: `${date.month} ${date.year}`
                        }
                    })
                }} />
                <p className={styles.sectionTitle}>To</p>
                <EditMenuFiscalCalendar selectedDateProp={editedData.custom_range.end} onSaveDate={(date: any) => {
                    setEditedData({
                        ...editedData, custom_range: {
                            ...editedData?.custom_range,
                            end: `${date.month} ${date.year}`
                        }
                    })
                }} />
            </>
        )
    }

    const handleInputChange = (option: string, value: string) => {
        setMonthValues((prev) => ({
            ...prev,
            [option]: value,
        }));
    };

    return (
        <div className={styles.modal}>
            <div className={styles['closeButton-wrapper']}>

                <h3 className={styles.title}>{chartHeader ? `Filter : ${options.name}` : 'Edit Field'}   </h3>
                {chartHeader &&
                    <IconButton
                        onClick={() => onClose?.()}
                        icon="x-close"
                        size="Tiny"
                    />
                }
            </div>
            {!isGroupId && <div className={styles.separator} />}
            {/* Scrollable Section */}
            {!isGroupId && <div className={styles.scrollSection}>
                {!chartHeader && <div className={styles.section}>
                    <label className={styles.label}>Dimension Name</label>
                    <InputField
                        captionMessageType="default"
                        isDisabled={false}
                        className={styles.value}
                        onChange={(e) => {
                            setDimensionName(e.target.value)
                        }}
                        value={dimensionName}
                    ></InputField>
                    <label className={styles.subText}>Default Name: {options.name}</label>
                </div>}
                <p className={styles.sectionTitle}>Select values required</p>
                {(options.select_options as OptionType[]).map(
                    (option) => (
                        <label key={option} className={styles.radio}>
                            <Radio
                                className={styles["radioButton"]}
                                key={String(option)}
                                label={String(getLabel(option).display)}
                                value={"String(option)"}
                                checked={selectedOption === option}
                                onChange={() => setSelectedOption(option)}
                            />
                            {/* <input
                                type="radio"
                                checked={selectedOption === option}
                                onChange={() => setSelectedOption(option)}
                            /> */}
                            {/* {getLabel(option).display} */}
                            {(option === 'next_x_months' || option === 'prev_x_months' || option === 'top' || option === 'bottom') &&
                                <div className={styles.customSelectionTextbox}>
                                    <InputField
                                        captionMessageType="default"
                                        isDisabled={false}
                                        onChange={(e) => handleInputChange(option, e.target.value)}
                                        value={monthValues[option] || ""}
                                        size="S"
                                    ></InputField></div>}
                            {(option === 'next_x_months' || option === 'prev_x_months') && "Months"}
                        </label>
                    )
                )}
                {/* Custom Select Section */}
                {selectedOption === "custom" && (
                    <div className={styles.customSection}>
                        {label.toLowerCase() !== 'day' && <SearchInput
                            menuButton={false}
                            placeholder="Search"
                            className={styles['searchInput-performanceM-page']}
                            onChange={(e) => setSearch(e)}
                        />}
                        <div className={styles.checkboxList}>
                            {(label.toLowerCase() === 'day' && selectedOption === "custom") ? <MultiDatePicker setSelectedValues={setSelectedValues} /> : <>{filteredOptions.map((item) => (
                                <label key={(item as Option).label} className={styles.checkbox}>
                                    <CheckBox
                                        className={styles['radioButton']}
                                        checked={selectedValues.includes((item as Option).label)}
                                        onChange={() => toggleValue((item as Option).label)}
                                    />
                                    {(item as Option).label}
                                </label>
                            ))}</>}
                        </div>
                    </div>
                )}
                {selectedOption === "custom_range" && renderCustomDateSelection()}
            </div>}

            {isGroupId && <div>

                <InputField

                    label="Group Name"
                    captionMessageType="default"
                    isDisabled={false}
                    className={styles.value}
                    onChange={(e) => {
                        setGroupRename(e.target.value)
                    }}
                    value={groupRename}
                ></InputField>

            </div>}

            <div className={styles.buttonContainer}>
                <Button className={styles["saveBtn"]} text="Save" variant="Primary" onClick={() => {
                    if (isGroupId) {
                        onSave({
                            updatedName: groupRename ?? "",
                            selectedValues: {
                                name: isGroupId.id,
                                values: []
                            }
                        })

                        return;
                    }
                    if (chartHeader) {

                        const labelWord = getLabel(selectedOption).value.split(" ")[0];

                        let nameValue: string;

                        if (labelWord?.toLowerCase() === "custom") {

                            nameValue = selectedValues.toString();
                        } else {

                            const key = labelWord?.toLowerCase() as keyof typeof monthValues;
                            nameValue = `${labelWord} ${monthValues[key] || ''}`.trim();
                        }


                        onSave({
                            updatedName: dimensionName,
                            selectedValues: {
                                name: nameValue,
                                values: selectedValues,
                                selectedOption: selectedOption
                            }
                        })
                    } else {

                        onSave({
                            updatedName: dimensionName,
                            selectedValues: {
                                name: getLabel(selectedOption).value,
                                values: selectedValues
                            }
                        })
                    }
                }} />
            </div>
        </div>
    );
};

function getLabel(option: OptionType): { display: string, value: string } {
    switch (option) {
        case "select":
            return { display: "Select field only", value: "Select field only" };
        case "all_regions":
            return { display: "All Values", value: "All" };
        case "top":
            return { display: "Top", value: "Top 5" };
        case "bottom":
            return { display: "Bottom", value: "Bottom 5" };
        case "custom":
            return { display: "Custom Select", value: "Custom Select" };
        case "custom_range":
            return { display: "Custom Range", value: "Custom Range" };
        case "current_month":
            return { display: "Current Month", value: "Current Month" };
        case "previous_month":
            return { display: "Previous Month", value: "Previous Month" };
        case "next_x_months":
            return { display: "Next", value: "Next 5" }
        case "prev_x_months":
            return { display: "Prev", value: "Prev 5" }
        case "all_months":
            return { display: "All Months", value: "All" }
        default:
            return option;
    }
}
export default EditFieldModal;

