import { AnimatedLoaders, Button, DropDown, Flyout, Toast } from 'konnect-react-components';
import styles from './NotificationAddNewRuleFlyout.module.scss';
import { useCallback, useEffect, useRef, useState } from 'react';
import {
    getRuleDetailsById,
    getRuleTypes,
    getRuleValuebyRuleType,
    saveRule,
} from '../../../../services/alertnotificationRules';
import RuleFlyoutDimensionMapping from '../../../molecules/user-profile-settings-notification-alert/RuleFlyoutDimensionMapping';
import NotififcationRuleConditionCard from '../../../molecules/user-profile-settings-notification-alert/NotificationAlertRuleCondition/NotififcationRuleConditionCard';
import {
    RuleAlertConditionCircle,
    RuleNotifyConditionCircle,
    RuleWarnConditionCircle,
} from '../../../../assets/icons/icons';
import {
    INotiConditionDetail,
    INotiDimensionMapping,
    INotificationAltertRuleData,
    INotiRuleDetail,
} from '../../../../types/response';
import { Divider, Flex } from 'antd';
import { OptionType } from '../../../../types/common';
import { generateUniqueId } from '../../../../utils/helpers';
import { INotiRuleAddUpdateRequest, ITriggerFrequencyPayload } from '../../../../types/request';
import { isEqual } from 'lodash';
import {
    GEOGRAPHY,
    NOTI_FREQ_CAT,
    NotificationRuleTypes,
    NotificationType,
} from '../../../../utils/constants';
import TriggerFrequency from '../../../molecules/user-profile-settings-notification-alert/NotificationAlertTriggerFrequency/TriggerFrequency';

type Props = {
    flyoutOpen: boolean;
    handleFlyoutOpen: (state: boolean) => void;
    ruleId: number;
    setLastOperatedRule: (ruleType: number) => void;
};

type DdlOptions = {
    label: string;
    value: string;
    desc?: 'string';
};

function NotificationAddNewRuleFlyout({
    flyoutOpen,
    handleFlyoutOpen,
    ruleId,
    setLastOperatedRule,
}: Props) {
    const [ruletypeOptions, setruletypeOptions] = useState<DdlOptions[] | null>(null);
    const [ruleTyeValueOptions, setRuleTypeValueOptions] = useState<DdlOptions[] | null>(null);
    const [isVaueOptionsLoading, setIsValueOptionsLoading] = useState<boolean>(false);
    const [existingRuleDetails, setexistingRuleDetails] = useState<INotificationAltertRuleData>({
        ruleDetail: {
            ruleTypeId: 0,
            ruleTypeName: '',
            functionId: 0,
            functionName: '',
            kpiId: 0,
            kpiName: '',
            categoryId: '',
            tagId: '',
        },
        dimensionMapping: [],
        conditionDetail: [],
        triggerFrequencyDetails: {
            every: 1,
            frequencyType: '',
            on: null,
            selectedValues: '',
            starting: null,
            calendarType: 'StandardCalendar',
        },
    });

    const [ruleDetails, setRuleDetails] = useState<INotiRuleDetail>();
    const [dimensionMappings, SetDimensionMappings] = useState<INotiDimensionMapping[]>([]);
    const [conditions, setConditions] = useState<INotiConditionDetail[]>([]);
    const [disableSaveButton, setDisableSaveButton] = useState<boolean>(true);
    const [isloading, setIsLoading] = useState<boolean>(true);
    const [isDataSaving, setIsDataSaving] = useState<boolean>(false);
    const flyoutRef = useRef<HTMLDivElement>(null);
    const [isTrigFreqOpen, setTrigFreqOpen] = useState<boolean>(false);
    const [issueCategoryOptions, setissueCategoryOptions] = useState<DdlOptions[] | null>(null);
    const [issueTagsOptions, setissueTagsOptions] = useState<DdlOptions[] | null>(null);
    const [triggerFrequency, setTriggerFrequency] = useState<ITriggerFrequencyPayload | null>(null);

    const [toastConfig, setToastConfig] = useState<{
        visible: boolean;
        message: string;
        type: 'Delete' | 'Error' | 'Success';
    }>({ visible: false, message: '', type: 'Success' });

    // --> globaly making use of states and effects for both dropdown
    const [openDdId, setOpenDdId] = useState<string | null>(null);

    useEffect(() => {
        if (!flyoutOpen) setOpenDdId(null);
    }, [flyoutOpen]);

    const suppressOpenRef = useRef(false);
    const reopenLockUntilRef = useRef<number>(0);

    const openHandler = (id: string) => {
        const now = Date.now();
        if (reopenLockUntilRef.current > now) return;
        if (suppressOpenRef.current) {
            suppressOpenRef.current = false;
            return;
        }
        if (openDdId !== id) setOpenDdId(id);
    };

    const closeAfterSelect = () => {
        reopenLockUntilRef.current = Date.now() + 200;
        suppressOpenRef.current = true;

        (document.activeElement as HTMLElement | null)?.blur?.();

        requestAnimationFrame(() => setOpenDdId(null));
    };

    useEffect(() => {
        if (!flyoutOpen) return;
        const onDocMouseDown = (e: MouseEvent) => {
            const t = e.target as HTMLElement;
            const insidePopup =
                !!t.closest('.noti-rule-type-dropdown-options-custom') ||
                !!t.closest('.geography-custom-dropdown') ||
                !!t.closest('.dropdown-options-custom');
            const insideRoot = !!t.closest('[data-dd-root]');
            if (!insidePopup && !insideRoot) setOpenDdId(null);
        };
        document.addEventListener('mousedown', onDocMouseDown, true);
        return () => document.removeEventListener('mousedown', onDocMouseDown, true);
    }, [flyoutOpen]);

    const fetchRuleDetailsById = async (ruleId: number) => {
        //api call to get the details
        setIsLoading(true);
        try {
            const resp: INotificationAltertRuleData = await getRuleDetailsById(ruleId);

            setexistingRuleDetails(resp);
            setRuleDetails(resp.ruleDetail);
            setDimensionRows(resp.dimensionMapping.map(d => ({ ...d, id: generateUniqueId() })));
            setConditions(resp.conditionDetail.map(c => ({ ...c, id: generateUniqueId() })));
            setTriggerFrequency({
                every: resp.triggerFrequencyDetails.every,
                frequencyType: resp.triggerFrequencyDetails.frequencyType,
                on: resp.triggerFrequencyDetails.on,
                selectedValues: resp.triggerFrequencyDetails?.selectedValues?.split(',') ?? [],
                starting: resp.triggerFrequencyDetails.starting,
                calendarType: resp.triggerFrequencyDetails.calendarType,
                fiscalValue: null,
            });
            setIsLoading(false);
        } catch {
            setIsLoading(false);
        }
    };

    const fetchRuleTypeName = (name: string) => {
        let ruleTypeName = '';
        switch (name) {
            case 'KPI':
                ruleTypeName = "KPI's";
                break;
            case 'Opportunity':
                ruleTypeName = 'Opportunities';
                break;
            default:
                ruleTypeName = name;
                break;
        }
        return ruleTypeName;
    };
    //Get rule type options
    useEffect(() => {
        if (!flyoutOpen) return;

        getRuleTypes()
            .then(resp => {
                const options = resp.map((r: any) => ({
                    label: fetchRuleTypeName(r.ruleTypeName),
                    value: String(r.ruleTypeId),
                }));
                setruletypeOptions(options);
            })
            .catch(() => {});
        //fetch ruleDetails if existing rule id, else initialize to blank state
        if (ruleId !== 0) {
            fetchRuleDetailsById(ruleId);
        } else {
            const resp: INotificationAltertRuleData = {
                ruleDetail: {
                    ruleTypeId: 0,
                    ruleTypeName: '',
                    functionId: 0,
                    functionName: '',
                    kpiId: 0,
                    kpiName: '',
                    categoryId: '',
                    tagId: '',
                },
                dimensionMapping: [],
                conditionDetail: [],
                triggerFrequencyDetails: {
                    every: 1,
                    frequencyType: NOTI_FREQ_CAT.Shift,
                    on: null,
                    selectedValues: '',
                    starting: null,
                    calendarType: 'StandardCalendar',
                },
            };

            setexistingRuleDetails(resp);
            setRuleDetails(resp.ruleDetail);
            setDimensionRows(resp.dimensionMapping);
            setConditions(resp.conditionDetail.map(c => ({ ...c, id: generateUniqueId() })));
            setTriggerFrequency({
                every: resp.triggerFrequencyDetails.every,
                frequencyType: resp.triggerFrequencyDetails.frequencyType,
                on: resp.triggerFrequencyDetails.on,
                selectedValues: resp.triggerFrequencyDetails?.selectedValues?.split(',') ?? [],
                starting: resp.triggerFrequencyDetails.starting,
                calendarType: resp.triggerFrequencyDetails.calendarType,
                fiscalValue: null,
            });
            setIsLoading(false);
        }
    }, [flyoutOpen]);
    //Get the options for second drop down when rule type ddl changes
    useEffect(() => {
        if (!ruleDetails?.ruleTypeName) return;

        setIsValueOptionsLoading(true);
        let options: DdlOptions[] = [];
        let categoryOptions: DdlOptions[] = [];
        let tagsOptions: DdlOptions[] = [];

        getRuleValuebyRuleType(ruleDetails?.ruleTypeId.toString())
            .then(resp => {
                if (fetchRuleTypeName(ruleDetails?.ruleTypeName) === NotificationRuleTypes.KPIs) {
                    options = resp.kpis.map((k: any) => ({
                        value: String(k.kpiId),
                        label: k.kpiName,
                        desc: k.frequency + ' | ' + k.units,
                    }));
                    setRuleTypeValueOptions(options);
                    setIsValueOptionsLoading(false);
                } else {
                    options = resp.functions.map((k: any) => ({
                        value: String(k.functionId),
                        label: k.functionName,
                    }));
                    categoryOptions = resp.issueCategories.map((k: any) => ({
                        value: String(k.categoryId),
                        label: k.categoryName,
                    }));
                    tagsOptions = resp.issueTags.map((k: any) => ({
                        value: String(k.tagId),
                        label: k.tag,
                    }));

                    setRuleTypeValueOptions(options);
                    setissueCategoryOptions(categoryOptions);
                    setissueTagsOptions(tagsOptions);
                    setIsValueOptionsLoading(false);
                }
            })
            .catch(() => {});
    }, [ruleDetails?.ruleTypeId]);
    //track data to enable or disable save button
    useEffect(() => {
        //validate rule basic details
        if (ruleDetails?.ruleTypeName === '' || ruleDetails?.ruleTypeName === null) {
            setDisableSaveButton(true);
            return;
        }

        //issue category
        if (fetchRuleTypeName(ruleDetails?.ruleTypeName ?? '') === NotificationRuleTypes.Issue) {
            if (ruleDetails?.categoryId === '' || ruleDetails?.categoryId === null) {
                setDisableSaveButton(true);
                return;
            }
        }

        //check for KPI and function
        if (fetchRuleTypeName(ruleDetails?.ruleTypeName ?? '') === NotificationRuleTypes.KPIs) {
            if (ruleDetails?.kpiName === '' || ruleDetails?.kpiName === null) {
                setDisableSaveButton(true);
                return;
            }
        } else {
            if (!ruleDetails?.functionId || isNaN(ruleDetails.functionId)) {
                setDisableSaveButton(true);
                return;
            }
        }

        //validate dimensions
        if (dimensionMappings.length === 0) {
            setDisableSaveButton(true);
            return;
        }

        if (!dimensionMappings.some(d => d.dimensionName.toLowerCase() === 'geography')) {
            setDisableSaveButton(true);
            return;
        }
        if (
            dimensionMappings.some(
                d => d.dimensionName.toLowerCase() === 'geography' && d.value.length === 0,
            )
        ) {
            setDisableSaveButton(true);
            return;
        }

        if (
            dimensionMappings.some(
                d =>
                    d.value === '' ||
                    d.value.split(',').length === 0 ||
                    d.dimensionName === '' ||
                    d.dimensionName === null,
            )
        ) {
            setDisableSaveButton(true);
            return;
        }

        //validate frequency
        const isTriggerFreqSet = !!triggerFrequency?.frequencyType;
        if (!isTriggerFreqSet) {
            setDisableSaveButton(true);
            return;
        }

        //validate conditions
        //Issue conditions
        if (fetchRuleTypeName(ruleDetails?.ruleTypeName ?? '') !== NotificationRuleTypes.KPIs) {
            if (
                conditions.some(
                    cond =>
                        !cond.whenCondition ||
                        cond.whenCondition === null ||
                        cond.whenCondition === '',
                )
            ) {
                setDisableSaveButton(true);
                return;
            }

            const negPosImpOnFaulty = conditions.some(
                con =>
                    (con.whenCondition?.toLowerCase() === 'positive impact on' ||
                        con.whenCondition?.toLowerCase() === 'negative impact on') &&
                    (con.kpiName === '' ||
                        con.kpiName === null ||
                        con.comparisonOperator === '' ||
                        con.comparisonOperator === null ||
                        con.kpiValue === null ||
                        isNaN(con.kpiValue)),
            );

            const priorityCond = conditions.some(
                con =>
                    con.whenCondition?.toLowerCase() === 'priority is' &&
                    (con.priorityId === null || isNaN(con.priorityId)),
            );

            if (negPosImpOnFaulty || priorityCond) {
                setDisableSaveButton(true);
                return;
            }
        }
        //validate KPI conditions
        if (fetchRuleTypeName(ruleDetails?.ruleTypeName ?? '') === NotificationRuleTypes.KPIs) {
            if (conditions && conditions.length > 0) {
                const faulty = conditions.some(
                    con =>
                        con.comparisonOperator === null ||
                        con.comparisonOperator === '' ||
                        con.kpiValue === null ||
                        isNaN(con.kpiValue),
                );

                if (faulty) {
                    setDisableSaveButton(faulty);
                    return;
                }
            }
        }
        //atleast 1 condition should be present
        if (conditions.length === 0) {
            setDisableSaveButton(true);
            return;
        }
        //if new rule is been added then enable save as all above conditions are passed
        if (ruleId === 0) {
            setDisableSaveButton(false);
        }

        if (ruleId !== 0) {
            const isRuleHeaderChanged = !isEqual(ruleDetails, existingRuleDetails.ruleDetail);
            const isDimensionChanged = !isEqual(
                dimensionMappings.map(d => ({
                    id: d.dimensionId,
                    name: d.dimensionName,
                    value: d.value,
                })),
                existingRuleDetails.dimensionMapping.map(d => ({
                    id: d.dimensionId,
                    name: d.dimensionName,
                    value: d.value,
                })),
            );

            const isConditionChanged = !isEqual(
                conditions.map(con => ({
                    allTrue: con.allTrue,
                    compOp: con.comparisonOperator,
                    escId: con.escalationId,
                    kpiId: con.kpiId,
                    kpiValue: con.kpiValue,
                    conId: con.conditionId,
                    notiType: con.notificationType,
                    priorityId: con.priorityId,
                    whenCOnd: con.whenCondition,
                })),
                existingRuleDetails.conditionDetail.map(con => ({
                    allTrue: con.allTrue,
                    compOp: con.comparisonOperator,
                    escId: con.escalationId,
                    kpiId: con.kpiId,
                    kpiValue: con.kpiValue,
                    conId: con.conditionId,
                    notiType: con.notificationType,
                    priorityId: con.priorityId,
                    whenCOnd: con.whenCondition,
                })),
            );

            const isTriggerChanged = !isEqual(
                {
                    every: existingRuleDetails?.triggerFrequencyDetails?.every,
                    frequencyType: existingRuleDetails?.triggerFrequencyDetails?.frequencyType,
                    on: existingRuleDetails?.triggerFrequencyDetails?.on,
                    selectedValues:
                        existingRuleDetails?.triggerFrequencyDetails?.selectedValues?.split(',') ??
                        [],
                    starting: existingRuleDetails?.triggerFrequencyDetails?.starting,
                },
                {
                    every: triggerFrequency?.every,
                    frequencyType: triggerFrequency?.frequencyType,
                    on: triggerFrequency?.on,
                    selectedValues: triggerFrequency?.selectedValues ?? [],
                    starting: triggerFrequency?.starting,
                },
            );

            if (
                isRuleHeaderChanged ||
                isDimensionChanged ||
                isConditionChanged ||
                isTriggerChanged
            ) {
                setDisableSaveButton(false);
            } else {
                setDisableSaveButton(true);
            }
        }
        //if its existing rule the check for any change
    }, [ruleDetails, dimensionMappings, conditions, triggerFrequency]);

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (flyoutRef.current && !flyoutRef.current.contains(event.target as Node)) {
                handleFlyoutOpen(false);
                setOpenDdId(null);
            }
        };

        if (flyoutOpen) {
            document.addEventListener('mousedown', handleClickOutside);
        }

        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
        };
    }, [flyoutOpen]);

    //handler for change in rule type drop down
    const handleRuleDdlTypeChange = (value: OptionType) => {
        if (!ruleDetails) return;

        const updatedRuleDetails = {
            ...ruleDetails,
            ruleTypeId: parseInt(value.value),
            ruleTypeName: value.label,
            functionId: 0,
            functionName: '',
        };

        setRuleDetails(updatedRuleDetails);
        setConditions([]);
        setDimensionRows([]);
    };

    const handleIssueCategoryChange = (value: OptionType) => {
        if (!ruleDetails) return;

        const updatedRuleDetails = {
            ...ruleDetails,
            categoryId: value.value,
        };
        setRuleDetails(updatedRuleDetails);
    };

    const handleIssueTagsChange = (value: OptionType[]) => {
        if (!ruleDetails) return;

        const updatedRuleDetails = {
            ...ruleDetails,
            tagId: value.map(m => m.value).join(','),
        };
        setRuleDetails(updatedRuleDetails);
    };

    //handler for change in rule value e.g. kpi or issue function
    const handleRuleFunctionddlChange = (value: OptionType) => {
        if (!ruleDetails) return;
        const updatedRuleDetails: INotiRuleDetail = {
            ...ruleDetails,
            functionId:
                fetchRuleTypeName(ruleDetails.ruleTypeName ?? '') !== NotificationRuleTypes.KPIs
                    ? parseInt(value.value)
                    : null,
            functionName:
                fetchRuleTypeName(ruleDetails.ruleTypeName ?? '') !== NotificationRuleTypes.KPIs
                    ? value.label
                    : null,
            kpiId:
                fetchRuleTypeName(ruleDetails.ruleTypeName ?? '') === NotificationRuleTypes.KPIs
                    ? parseInt(value.value)
                    : null,
            kpiName:
                fetchRuleTypeName(ruleDetails.ruleTypeName ?? '') === NotificationRuleTypes.KPIs
                    ? value.label
                    : null,
        };

        setRuleDetails(updatedRuleDetails);
    };

    const setDimensionRows = (data: INotiDimensionMapping[]) => {
        if (data.length === 0) {
            SetDimensionMappings(data);
            return;
        }

        const geoDimension = data.find(d => d.dimensionName === GEOGRAPHY);

        if (geoDimension) {
            const hasSelected =
                Array.isArray(geoDimension.selectedValues) &&
                geoDimension.selectedValues.length > 0;
            if (!hasSelected && geoDimension.value) {
                geoDimension.selectedValues = geoDimension.value.split(',').map(v => ({
                    label: v,
                    value: v,
                    originalLabel: v.split(':')[1] ?? '',
                }));
            }
        }

        SetDimensionMappings([...data]);
    };

    const handleConditionsChanges = (data: INotiConditionDetail) => {
        if (!conditions.some(c => c.id === data.id)) {
            setConditions(prev => [...prev, data]);
        } else {
            setConditions(prev => prev.map(c => (c.id === data.id ? { ...data } : c)));
        }
    };

    const handleConditionDelete = (id: string) => {
        const newConds = conditions.filter(c => c.id != id);
        setConditions(newConds);
    };

    //this function will update the all values of 'allTrue' field for each rule type when changed
    const handleTriggerIfRadioChanges = (type: string, value: string) => {
        const newConditions = conditions
            .filter(c => c.notificationType === type)
            .map(con => ({ ...con, allTrue: value === 'true' ? true : false }));
        setConditions(prev => [...prev.filter(p => p.notificationType !== type), ...newConditions]);
    };

    //handle save rule
    const handleSaveRule = () => {
        setIsDataSaving(true);
        setDisableSaveButton(true);
        if (!ruleDetails || !dimensionMappings || !conditions) return;

        let toastMessage: string = '';
        const Payload: INotiRuleAddUpdateRequest = {
            ruleId: ruleId !== 0 ? ruleId : null,
            isUpdateRule: ruleId !== 0,

            ruleJSON: {
                functionId: ruleDetails?.functionId,
                ruleTypeId: ruleDetails.ruleTypeId,
                kpiId: ruleDetails.kpiId,
            },
            conditionsJSON: conditions.map(con => ({
                notificationType: con.notificationType,
                whenCondition: con.whenCondition,
                kpiId:
                    fetchRuleTypeName(ruleDetails.ruleTypeName ?? '') ===
                        NotificationRuleTypes.KPIs && ruleId !== 0
                        ? ruleDetails.kpiId
                        : con.kpiId,
                comparisionOperator: con.comparisonOperator,
                kpiValue: con.kpiValue,
                priorityId: con.priorityId,
                priorityName: con.priorityName,
                escalationId: con.escalationId,
                allTrue: con.allTrue ? 1 : 0,
            })),
            dimensionsJSON: dimensionMappings.map(dim => ({
                dimensionId: dim.dimensionId,
                value: dim.value,
            })),
            issueCategoryId:
                fetchRuleTypeName(ruleDetails.ruleTypeName ?? '') === NotificationRuleTypes.KPIs
                    ? null
                    : ruleDetails.categoryId,
            tagId:
                fetchRuleTypeName(ruleDetails.ruleTypeName ?? '') === NotificationRuleTypes.KPIs
                    ? null
                    : ruleDetails.tagId,
            triggerFrequencyJson: triggerFrequency ?? null,
        };

        const geography: string = `${dimensionMappings
            .filter(d => d.dimensionName.toLowerCase() === 'geography')[0]
            ?.value.split(',')
            .map(g => g.split('-').at(-1))
            .join(',')}`;
        const others: string = dimensionMappings
            .filter(d => d.dimensionName.toLowerCase() !== 'geography')
            .map(m => m.value)
            .join(' | ');
        saveRule(Payload)
            .then(() => {
                if (ruleId === 0) {
                    toastMessage = `New ${ruleDetails.ruleTypeName} Rule Added for ${geography} ${others === 'undefined' || others === '' ? '' : '| ' + others}`;
                    setToastConfig(prev => ({
                        ...prev,
                        message: toastMessage,
                        visible: true,
                        type: 'Success',
                    }));
                } else {
                    toastMessage = `${ruleDetails.ruleTypeName} Rule Updated for ${geography} ${others === 'undefined' || others === '' ? '' : '| ' + others}`;
                    setToastConfig(prev => ({
                        ...prev,
                        message: toastMessage,
                        visible: true,
                        type: 'Success',
                    }));
                }
                handleFlyoutOpen(false);
                setIsDataSaving(false);
                setDisableSaveButton(false);
                setLastOperatedRule(Payload.ruleJSON.ruleTypeId ?? 0);
            })
            .catch(() => {
                if (ruleId === 0) {
                    toastMessage = `Error occurred while Adding New ${ruleDetails.ruleTypeName} Rule for ${geography} ${others === 'undefined' || others === '' ? '' : '| ' + others}`;
                    setToastConfig(prev => ({
                        ...prev,
                        message: toastMessage,
                        visible: true,
                        type: 'Error',
                    }));
                } else {
                    toastMessage = `Error occurred while updating ${ruleDetails.ruleTypeName} Rule for ${geography} ${others === 'undefined' || others === '' ? '' : '| ' + others}`;
                    setToastConfig(prev => ({
                        ...prev,
                        message: toastMessage,
                        visible: true,
                        type: 'Error',
                    }));
                }

                setIsDataSaving(false);
                setDisableSaveButton(false);
            });
    };

    const RenderRuleTypeSection = useCallback(() => {
        return (
            <>
                <label className={styles['add-rule-titles']}>Rule Details</label>
                {/* Rule Type dropdown here*/}
                <div
                    data-dd-root
                    onClick={e => {
                        if (
                            (e.target as HTMLElement).closest(
                                '.noti-rule-type-dropdown-options-custom',
                            )
                        )
                            return;
                        openHandler('rule-type');
                    }}
                >
                    <DropDown
                        className="drop-down"
                        dataTestId="noti-rule-dropd-down"
                        dropdown={{
                            isOpen: openDdId === 'rule-type',
                            isDisabled: ruleId === 0 ? false : true,
                            isLabelInline: false,
                            label: 'Rule Type',
                            onChange: option => {
                                handleRuleDdlTypeChange(option);
                                closeAfterSelect();
                            },
                            options: ruletypeOptions ?? [],
                            placeholder: 'Select',
                            required: true,
                            reset: false,
                            selectedOptions:
                                ruleDetails && ruleDetails.ruleTypeId && ruleDetails.ruleTypeName
                                    ? [
                                        {
                                            value: String(ruleDetails?.ruleTypeId ?? ''),
                                            label: fetchRuleTypeName(
                                                ruleDetails?.ruleTypeName ?? '',
                                            ),
                                        },
                                    ]
                                    : [],
                            size: 'L',
                            type: 'radio',
                        }}
                        dropdownOptionsClassName="noti-rule-type-dropdown-options-custom"
                        id="noti-rule-drop-down"
                        searchInput={
                                        Array.isArray(ruletypeOptions) &&
                                        ruletypeOptions.length > 10
                                            ? {
                                                  searchPlaceholder: 'Search',
                                                  searchSize: 'L',
                                                  searchWholeString: true,
                                              }
                                            : undefined
                                    }
                    />
                </div>
                {/* Issue category */}
                {fetchRuleTypeName(ruleDetails?.ruleTypeName ?? '') ===
                    NotificationRuleTypes.Issue && (
                        <>
                            <div className={styles['noti-rule-dropd-down']} />

                            <DropDown
                                className="drop-down"
                                dataTestId="noti-rule-dropd-down"
                                dropdown={{
                                    // isOpen: openDdId === 'rule-type',
                                    // isDisabled: ruleId === 0 ? false : true,
                                    isLabelInline: false,
                                    label: 'Issue Category',
                                    onChange: option => {
                                        handleIssueCategoryChange(option);
                                        closeAfterSelect();
                                    },
                                    options: issueCategoryOptions ?? [],
                                    placeholder: 'Select',
                                    required: true,
                                    reset: false,
                                    selectedOptions:
                                        ruleDetails && ruleDetails.categoryId
                                            ? issueCategoryOptions?.filter(
                                                c => c.value === ruleDetails.categoryId,
                                            )
                                            : [],
                                    size: 'L',
                                    type: 'radio',
                                }}
                                dropdownOptionsClassName="noti-rule-type-dropdown-options-custom"
                                id="noti-rule-drop-down"
                                searchInput={{
                                    searchPlaceholder: 'Search',
                                    searchSize: 'L',
                                    searchWholeString: true,
                                }}
                            />
                        </>
                    )}
                {ruleDetails?.ruleTypeName && (
                    <>
                        <div className={styles['noti-rule-dropd-down']} />
                        <div
                            data-dd-root
                            onClick={e => {
                                if (
                                    (e.target as HTMLElement).closest(
                                        '.noti-rule-type-dropdown-options-custom',
                                    )
                                )
                                    return;
                                openHandler('rule-value');
                            }}
                        >
                            <DropDown
                                className="drop-down"
                                dataTestId="noti-rule-dropd-down"
                                dropdown={{
                                    isOpen: openDdId === 'rule-value',
                                    isDisabled: isVaueOptionsLoading,
                                    isLabelInline: false,
                                    label:
                                        fetchRuleTypeName(ruleDetails?.ruleTypeName) ===
                                            NotificationRuleTypes.KPIs
                                            ? 'KPI Name'
                                            : 'Issue Function',
                                    onChange: option => {
                                        handleRuleFunctionddlChange(option);
                                        closeAfterSelect();
                                    },
                                    options: ruleTyeValueOptions ?? [],
                                    placeholder:
                                        fetchRuleTypeName(ruleDetails?.ruleTypeName) ===
                                            NotificationRuleTypes.KPIs
                                            ? 'Select KPI'
                                            : 'Select Function',
                                    required: true,
                                    reset: false,
                                    showRadio:
                                        fetchRuleTypeName(ruleDetails?.ruleTypeName) ===
                                            NotificationRuleTypes.KPIs
                                            ? false
                                            : true,
                                    showDescription: true,
                                    selectedOptions:
                                        fetchRuleTypeName(ruleDetails?.ruleTypeName) ===
                                            NotificationRuleTypes.KPIs && ruleDetails.kpiId
                                            ? [
                                                {
                                                    value: String(ruleDetails?.kpiId),
                                                    label: ruleDetails?.kpiName ?? '',
                                                },
                                            ]
                                            : ruleDetails.functionId
                                                ? [
                                                    {
                                                        value:
                                                            String(ruleDetails?.functionId ?? ''),
                                                        label: ruleDetails?.functionName ?? '',
                                                    },
                                                ]
                                                : [],
                                    size: 'L',
                                    type: 'radio',
                                }}
                                dropdownOptionsClassName="noti-rule-type-dropdown-options-custom"
                                id="noti-rule-drop-down"
                                searchInput={{
                                    searchPlaceholder: 'Search',
                                    searchSize: 'L',
                                    searchWholeString: true,
                                }}
                            />
                        </div>
                    </>
                )}
            </>
        );
    }, [ruletypeOptions, ruleTyeValueOptions, ruleDetails, openDdId]);

    const RenderFlyoutBody = () => {
        return (
            <>
                {isloading ? (
                    <Flex
                        align="center"
                        justify="center"
                        style={{ height: '584px', width: '100%' }}
                    >
                        <AnimatedLoaders id="page-loader" text="Loading" type="page" />
                    </Flex>
                ) : (
                    <div className={styles.container}>
                        <RenderRuleTypeSection />
                        <div className={styles['space-v-16']} />
                        {/* Issue category */}
                        {fetchRuleTypeName(ruleDetails?.ruleTypeName ?? '') ===
                            NotificationRuleTypes.Issue && (
                                <>
                                    <div className={styles['noti-rule-dropd-down']} />

                                    <DropDown
                                        id="Tags-dropdown"
                                        className="drop-down"
                                        dropdown={{
                                            label: 'Issue Tags',
                                            options: issueTagsOptions ?? [],
                                            reset: false,
                                            placeholder: 'Select',
                                            isMultiSelect: true,
                                            type: 'checkbox',
                                            onChange: (
                                                _: OptionType,
                                                __: boolean,
                                                tree: OptionType[],
                                            ) => {
                                                handleIssueTagsChange(tree);
                                            },
                                            selectedOptions:
                                                ruleDetails && ruleDetails.tagId
                                                    ? issueTagsOptions?.filter(b =>
                                                        ruleDetails.tagId
                                                            ?.split(',')
                                                            .includes(b.value.toString()),
                                                    )
                                                    : [],
                                        }}
                                        dropdownOptionsClassName="dropdown-options-custom"
                                        searchInput={{
                                            searchPlaceholder: 'Search Tags',
                                            searchSize: 'L',
                                            searchWholeString: true,
                                        }}
                                    />
                                </>
                            )}
                        {ruleDetails?.ruleTypeName && (
                            <>
                                <RuleFlyoutDimensionMapping
                                    dimensions={dimensionMappings ?? []}
                                    setDimension={setDimensionRows}
                                    ruleId={ruleId}
                                    openDdId={openDdId}
                                    setOpenDdId={setOpenDdId}
                                />
                                <Flex justify="space-between" style={{ marginTop: '1rem' }}>
                                    <label className="inputfield-label-container">
                                        Trigger Frequency{' '}
                                        <span className={styles['form-required-fields']}>*</span>
                                    </label>
                                    <Button
                                        variant="Link"
                                        onClick={() => {
                                            setTrigFreqOpen(true);
                                        }}
                                        text="Every Month on C+1"
                                    />
                                    {isTrigFreqOpen && (
                                        <TriggerFrequency
                                            isOpen={isTrigFreqOpen}
                                            handleClose={setTrigFreqOpen}
                                            saveTriggerFrequency={setTriggerFrequency}
                                            existingTriggerFreq={{
                                                every: triggerFrequency?.every ?? 1,
                                                frequencyType:
                                                    triggerFrequency?.frequencyType ??
                                                    NOTI_FREQ_CAT.Shift,
                                                on: triggerFrequency?.on ?? null,
                                                selectedValues: triggerFrequency?.selectedValues
                                                    ? triggerFrequency?.selectedValues.join(',')
                                                    : '',
                                                starting: triggerFrequency?.starting ?? null,
                                                calendarType:
                                                    triggerFrequency?.calendarType ??
                                                    'StandardCalendar',
                                            }}
                                        />
                                    )}
                                </Flex>
                                <Divider className={styles['rule-divider']} />
                                <label className={styles['add-rule-titles']}>
                                    Set conditions for notice, warning & alert
                                </label>
                                <NotififcationRuleConditionCard
                                    ConditionIcon={RuleNotifyConditionCircle()}
                                    ConditionType={NotificationType.Notify}
                                    RuleType={fetchRuleTypeName(ruleDetails?.ruleTypeName)}
                                    data={
                                        conditions?.filter(
                                            c => c.notificationType === NotificationType.Notify,
                                        ) ?? []
                                    }
                                    handleDataChange={handleConditionsChanges}
                                    handleDeleteCondition={handleConditionDelete}
                                    handleTriggerIfRadioChange={handleTriggerIfRadioChanges}
                                />
                                <NotififcationRuleConditionCard
                                    ConditionIcon={RuleWarnConditionCircle()}
                                    ConditionType={NotificationType.Warn}
                                    RuleType={fetchRuleTypeName(ruleDetails?.ruleTypeName)}
                                    data={
                                        conditions?.filter(
                                            c => c.notificationType === NotificationType.Warn,
                                        ) ?? []
                                    }
                                    handleDataChange={handleConditionsChanges}
                                    handleDeleteCondition={handleConditionDelete}
                                    handleTriggerIfRadioChange={handleTriggerIfRadioChanges}
                                />
                                <NotififcationRuleConditionCard
                                    ConditionIcon={RuleAlertConditionCircle()}
                                    ConditionType={NotificationType.Alert}
                                    RuleType={fetchRuleTypeName(ruleDetails?.ruleTypeName)}
                                    data={
                                        conditions?.filter(
                                            c => c.notificationType === NotificationType.Alert,
                                        ) ?? []
                                    }
                                    handleDataChange={handleConditionsChanges}
                                    handleDeleteCondition={handleConditionDelete}
                                    handleTriggerIfRadioChange={handleTriggerIfRadioChanges}
                                />
                            </>
                        )}
                    </div>
                )}
            </>
        );
    };

    const onClickOutsideFlyoutContainer = () => {
        if (flyoutOpen) {
            handleFlyoutOpen(false);
            handleRuleDdlTypeChange({ value: '', label: '' });
            setRuleTypeValueOptions(null);
            setOpenDdId(null);
        }
    };

    useEffect(() => {
        const flyoutWrapper = document.getElementById('noti-rule-fly-out');
        if (!flyoutWrapper) return;

        const handleClick = (event: MouseEvent) => {
            const target = event.target as HTMLElement;

            if (target.closest('[class^="flyout-container"]')) return;

            onClickOutsideFlyoutContainer();
        };

        flyoutWrapper.addEventListener('click', handleClick);
        return () => flyoutWrapper.removeEventListener('click', handleClick);
    }, [onClickOutsideFlyoutContainer]);

    return (
        <>
            {toastConfig.visible && (
                <Toast
                    distance="s"
                    message={toastConfig.message}
                    mode="Top Right"
                    onCloseToast={() => setToastConfig({ ...toastConfig, visible: false })}
                    toggle={toastConfig.visible}
                    type={toastConfig.type}
                    timer={5000}
                />
            )}
            <Flyout
                containerMaxWidth={'30rem'}
                className={styles['notification-add-rule-flyout']}
                cancelIconClick={() => { }}
                cancelBtnProps={{
                    disabled: false,
                    onClick: () => {
                        handleFlyoutOpen(false);
                        handleRuleDdlTypeChange({ value: '', label: '' });
                        setRuleTypeValueOptions(null);
                        setLastOperatedRule(0);
                        setOpenDdId(null);
                    },
                    text: 'Cancel',
                    variant: 'Subtle',
                }}
                content={RenderFlyoutBody()}
                dataTestId="noti-rule-fly-out"
                direction="right"
                flyoutOpen={flyoutOpen}
                heading={ruleId === 0 ? 'Add New Rule' : 'Edit Rule'}
                id="noti-rule-fly-out"
                primaryBtnProps={{
                    disabled: disableSaveButton,
                    onClick: () => {
                        handleSaveRule();
                    },
                    text: isDataSaving ? 'Saving...' : 'Save',
                    variant: 'Primary',
                }}
                subHeading="Setup a personalised notification"
            />
        </>
    );
}

export default NotificationAddNewRuleFlyout;
