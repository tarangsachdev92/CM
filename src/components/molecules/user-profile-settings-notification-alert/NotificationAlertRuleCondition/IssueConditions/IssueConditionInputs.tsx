import { Button, Flex, Input, Select, Skeleton } from 'antd';
import Style from './IssueConditionInputs.module.scss';
import { Icon } from 'konnect-react-components';
import { INotiConditionDetail } from '../../../../../types/response';
import { useEffect, useState } from 'react';
import { OptionType } from '../../../../../types/common';
import { getIssueForums, getIssuePriority, getKpiMasters } from '../../../../../services/issue';
import { NotiRuleWhenCondition } from '../../../../../utils/constants';
import { logError } from '../../../../../utils/helpers';

type Props = {
    conditions: INotiConditionDetail[];
    handleDataChange: (condition: INotiConditionDetail) => void;
    handleAddButtonState: (state: boolean) => void;
    onDelete: (id: string) => void;
};

type ValidationEntry = { id: string; status: boolean };

function IssueConditionInputs({
    conditions,
    handleAddButtonState,
    handleDataChange,
    onDelete,
}: Props) {
    const [priorityOptions, setPriorityOptions] = useState<OptionType[]>([]);
    const [forumOptions, setforumOptions] = useState<OptionType[]>([]);
    const [kpiOptions, setkpiOptions] = useState<OptionType[]>([]);
    const [isAllOptionsLoaded, setIsAllOptionsLoaded] = useState<boolean>(false);
    const [validationList, setValidationList] = useState<ValidationEntry[]>([]);

    useEffect(() => {
        const kpiPromise = getKpiMasters();
        const forumPromise = getIssueForums();
        const priorityPromise = getIssuePriority();

        Promise.all([kpiPromise, forumPromise, priorityPromise])
            .then(result => {
                setkpiOptions(
                    result[0].data.data.map((k: any) => ({ value: k.kpiId, label: k.kpiName })),
                );
                setforumOptions(
                    result[1].map((f: any) => ({ label: f.forumName, value: f.forumId })),
                );
                setPriorityOptions(
                    result[2].map((p: any) => ({ label: p.priorityName, value: p.priorityId })),
                );
                setIsAllOptionsLoaded(true);
            })
            .catch(err => {
                logError(err);
                setIsAllOptionsLoaded(false);
            });
    }, []);

    //monitor conditions to enable or disable add button changes
    useEffect(() => {
        //for entries where conditions are not set
        if (
            conditions.some(
                cond =>
                    !cond.whenCondition || cond.whenCondition === null || cond.whenCondition === '',
            )
        ) {
            handleAddButtonState(false);
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
            handleAddButtonState(false);
        } else {
            handleAddButtonState(true);
        }
    }, [conditions]);

    //Input hadlers
    const handleWhenConditionChanged = (id: string, value: string) => {
        const condition = conditions.filter(c => c.id === id)[0];

        if (!condition) return;
        handleDataChange({
            ...condition,
            whenCondition: value,
            kpiId: null,
            kpiName: null,
            kpiValue: null,
            escalationId: null,
            escalationName: null,
            priorityId: null,
            priorityName: null,
            comparisonOperator: null,
        });
    };

    const handleKpiValueChange = (id: string, option: OptionType) => {
        const condition = conditions.filter(c => c.id === id)[0];

        if (!condition) return;
        handleDataChange({
            ...condition,
            kpiName: option.label,
            kpiId: parseInt(option.value),
        });
    };

    //handle operator change
    const handleOperatorChange = (id: string, value: string) => {
        const condition = conditions.filter(c => c.id === id)[0];

        if (!condition) return;
        handleDataChange({
            ...condition,
            comparisonOperator: value,
        });
    };

    //handle value change
    const handleValueChange = (id: string, value: string) => {
        const condition = conditions.filter(c => c.id === id)[0];

        if (!condition) return;

        handleDataChange({
            ...condition,
            kpiValue: parseFloat(value),
        });
    };

    const handleValueKeyUp = (e: React.KeyboardEvent<HTMLInputElement>, id: string) => {
        const inputValue = (e.target as HTMLInputElement).value;

        setValidationList(prev => {
            // const exists = prev.find(item => item.id === id);

            if (inputValue === '') {
                // Add new invalid entry
                return [...prev, { id, status: true }];
            } else {
                return prev.filter(item => item.id !== id);
            }
            return prev;
        });
    };

    //handle priority change
    const handlePriorityChange = (id: string, option: OptionType) => {
        const condition = conditions.filter(c => c.id === id)[0];

        if (!condition) return;

        handleDataChange({
            ...condition,
            priorityId: parseInt(option.value),
            priorityName: option.label,
        });
    };

    //handle escaleted to
    const handleEscalatedChange = (id: string, option: OptionType) => {
        const condition = conditions.filter(c => c.id === id)[0];

        if (!condition) return;

        handleDataChange({
            ...condition,
            escalationId: parseInt(option.value),
            escalationName: option.label,
        });
    };

    const RenderConditionValues = (data: INotiConditionDetail) => {
        switch (data.whenCondition) {
            case NotiRuleWhenCondition.PositiveImpactOn:
                return RenderPositiveNegativeImpactOn(data);
                break;
            case NotiRuleWhenCondition.NegativeImapctOn:
                return RenderPositiveNegativeImpactOn(data);
                break;
            case NotiRuleWhenCondition.PriorityIs:
                return RenderPriorityIs(data);
                break;
            case NotiRuleWhenCondition.SharedTo:
                return RenderEscalatedTo(data);
                break;
            default:
                return '';
        }
    };

    //Render positive negative impact on
    const RenderPositiveNegativeImpactOn = (data: INotiConditionDetail) => {
        return (
            <>
                <Select
                    placeholder="Select KPI"
                    getPopupContainer={trigger => trigger.parentNode}
                    onChange={(_, option) => {
                        let selectedOption: OptionType = { value: '', label: '' };
                        if (option && Array.isArray(option) && option[0]) {
                            selectedOption = option[0];
                        }
                        if (option && !Array.isArray(option)) {
                            selectedOption = option;
                        }
                        handleKpiValueChange(data.id, selectedOption);
                    }}
                    options={kpiOptions}
                    className="noti-rule-issue-kpi-name-ddl"
                    value={data.kpiId}
                />
                <Select
                    placeholder="Select Operator"
                    getPopupContainer={trigger => trigger.parentNode}
                    onChange={value => {
                        handleOperatorChange(data.id, value);
                    }}
                    options={[
                        {
                            value: '<',
                            label: 'is <',
                        },
                        {
                            value: '<=',
                            label: 'is <=',
                        },
                        {
                            value: '>',
                            label: 'is >',
                        },
                        {
                            value: '>=',
                            label: 'is >=',
                        },
                        {
                            value: '=',
                            label: 'is =',
                        },
                        {
                            value: '=/',
                            label: 'is =/',
                        },
                    ]}
                    className="noti-rule-issue-kpi-operator"
                    value={data.comparisonOperator}
                />
                <Input
                    placeholder="Enter value"
                    className={
                        validationList.some(v => v.id === data.id)
                            ? (Style['issue-condition-kpi-value'], Style['error'])
                            : Style['issue-condition-kpi-value']
                    }
                    value={data.kpiValue ?? ''}
                    type="number"
                    onChange={event => {
                        handleValueChange(data.id, event.target.value);
                    }}
                    onKeyUp={e => handleValueKeyUp(e, data.id)}
                />
            </>
        );
    };

    //render priority IS
    const RenderPriorityIs = (data: INotiConditionDetail) => {
        return (
            <>
                <Select
                    placeholder="Select Priority"
                    getPopupContainer={trigger => trigger.parentNode}
                    onChange={(_, option) => {
                        let selectedOption: OptionType = { value: '', label: '' };
                        if (option && Array.isArray(option) && option[0]) {
                            selectedOption = option[0];
                        }
                        if (option && !Array.isArray(option)) {
                            selectedOption = option;
                        }
                        handlePriorityChange(data.id, selectedOption);
                    }}
                    options={priorityOptions}
                    className="noti-rule-issue-priority-is-ddl"
                    value={data.priorityId}
                />
            </>
        );
    };

    //Render escalated to
    const RenderEscalatedTo = (data: INotiConditionDetail) => {
        return (
            <>
                <Select
                    placeholder="Select Shared To"
                    getPopupContainer={trigger => trigger.parentNode}
                    onChange={(_, option) => {
                        let selectedOption: OptionType = { value: '', label: '' };
                        if (option && Array.isArray(option) && option[0]) {
                            selectedOption = option[0];
                        }
                        if (option && !Array.isArray(option)) {
                            selectedOption = option;
                        }
                        handleEscalatedChange(data.id, selectedOption);
                    }}
                    options={forumOptions}
                    className="noti-rule-issue-priority-is-ddl"
                    value={data.escalationId}
                />
            </>
        );
    };

    return (
        <>
            {!isAllOptionsLoaded && <Skeleton.Input active block />}
            {isAllOptionsLoaded &&
                conditions.map(cond => {
                    return (
                        <div key={cond.id}>
                            <Flex className={Style['issue-condition-module-cond-header-input-grp']}>
                                <Select
                                    placeholder="Select Type"
                                    getPopupContainer={trigger => trigger.parentNode}
                                    onChange={value => {
                                        handleWhenConditionChanged(cond.id, value);
                                    }}
                                    options={[
                                        {
                                            label: NotiRuleWhenCondition.PositiveImpactOn,
                                            value: NotiRuleWhenCondition.PositiveImpactOn,
                                        },
                                        {
                                            label: NotiRuleWhenCondition.NegativeImapctOn,
                                            value: NotiRuleWhenCondition.NegativeImapctOn,
                                        },
                                        {
                                            label: NotiRuleWhenCondition.PriorityIs,
                                            value: NotiRuleWhenCondition.PriorityIs,
                                        },
                                        {
                                            label: NotiRuleWhenCondition.SharedTo,
                                            value: NotiRuleWhenCondition.SharedTo,
                                        },
                                    ]}
                                    className="noti-rule-issueConditioTypeDddl"
                                    value={cond.whenCondition ?? null}
                                />
                                <Button
                                    icon={<Icon name="trash-01" size="xm" color="black-color" />}
                                    onClick={() => {
                                        onDelete(cond.id);
                                    }}
                                    className={
                                        Style['issue-condition-module-header-input-trash-button']
                                    }
                                />
                            </Flex>
                            <Flex
                                className={Style['issue-condition-module-cond-subtitle-input-grp']}
                            >
                                {RenderConditionValues(cond)}
                            </Flex>

                            {validationList.some(v => v.id === cond.id) && (
                                <Flex gap={10} style={{ marginTop: '0.5rem' }}>
                                    <Icon name="info-circle" color="status-error-color" />
                                    <label className={Style['issueInput-error-label']}>
                                        Invalid entry : Please enter a numerical value only. No
                                        special characters such as % or $ should be entered here.
                                    </label>
                                </Flex>
                            )}
                        </div>
                    );
                })}
        </>
    );
}

export default IssueConditionInputs;
