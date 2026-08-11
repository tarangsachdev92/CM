import { Button, Flex } from 'antd';
import Style from './NotififcationRuleConditionCard.module.scss';
import { Icon, Radio } from 'konnect-react-components';
import { IRuleConditionCardPropsType } from '../../../../types/common';
import IssueConditionInputs from './IssueConditions/IssueConditionInputs';
import KpiConditionInputs from './IssueConditions/KpiConditionInputs';
import { useEffect, useState } from 'react';
import { INotiConditionDetail } from '../../../../types/response';
import { generateUniqueId } from '../../../../utils/helpers';
import { NotificationRuleTypes, NotificationType } from '../../../../utils/constants';

function NotififcationRuleConditionCard({
    ConditionIcon,
    ConditionType,
    RuleType,
    data,
    handleDataChange,
    handleDeleteCondition,
    handleTriggerIfRadioChange,
}: IRuleConditionCardPropsType) {    
    const [isAddEnabled, setIsAddEnabled] = useState<boolean>(false);    
    useEffect(() => {
        if (data.length === 0) {
            setIsAddEnabled(true);
            return;
        }
    }, [data]);

    const RenderConditionInputs = () => {
        switch (RuleType) {
            case NotificationRuleTypes.KPIs:
                return (
                    <KpiConditionInputs
                        conditions={data}
                        handleAddButtonState={setIsAddEnabled}
                        handleDataChange={handleDataChange}
                        onDelete={handleDeleteCondition}
                    />
                );
                break;
            case NotificationRuleTypes.Issue:
                return (
                    <IssueConditionInputs
                        conditions={data}
                        handleAddButtonState={setIsAddEnabled}
                        handleDataChange={handleDataChange}
                        onDelete={handleDeleteCondition}
                    />
                );
                break;
            case NotificationRuleTypes.Risk:
                return (
                    <IssueConditionInputs
                        conditions={data}
                        handleAddButtonState={setIsAddEnabled}
                        handleDataChange={handleDataChange}
                        onDelete={handleDeleteCondition}
                    />
                );
                break;
            case NotificationRuleTypes.Opportunities:
                return (
                    <IssueConditionInputs
                        conditions={data}
                        handleAddButtonState={setIsAddEnabled}
                        handleDataChange={handleDataChange}
                        onDelete={handleDeleteCondition}
                    />
                );
                break;
            default:
                return 'No content';
        }
    };

    const handleAddCondition = () => {
        const newCond: INotiConditionDetail = {
            id: generateUniqueId(),
            conditionId: null,
            notificationType: ConditionType,
            whenCondition: RuleType===NotificationRuleTypes.KPIs? 'Value is' : null,
            kpiId: null,
            kpiName: null,
            comparisonOperator: null,
            kpiValue: null,
            priorityId: null,
            priorityName: null,
            escalationId: null,
            escalationName: null,
            allTrue: data.filter(d=> d.allTrue!==null)[0]?.allTrue??true,
        };

        handleDataChange(newCond);
    };
    

    return (
        <div className={Style['rule-condition-card-container']}>
            <Flex justify="space-between" align="center">
                <div className={Style['card-title-names']}>
                    {ConditionIcon}
                    <label className={Style['title-heading']}>{ConditionType == NotificationType.Notify ? 'Notice': ConditionType}</label>
                    <label className={Style['title-subheading']}>When</label>
                </div>
                <div>
                    <Button
                        type="link"
                        icon={<Icon name="plus" size="xm" color={isAddEnabled ? "primary-green-700-color":'neutrals-B100' }/>}
                        className={Style['rule-condition-card-add-link']}
                        disabled={!isAddEnabled}
                        onClick={() => {
                            handleAddCondition();
                        }}
                    >
                        Condition
                    </Button>
                </div>
            </Flex>

            <div>{data && data.length > 0 && RenderConditionInputs()}</div>

            {data && data.length > 1 && (
                <Flex vertical style={{ marginTop: '1rem' }} gap={'0.5rem'}>
                    <label className={Style['radio-subheading']}>Trigger is true if</label>
                    <Radio
                        label="All conditions are true"
                        value="true"
                        checked={(data[0]?.allTrue ?? true) === true}
                        onChange={value => handleTriggerIfRadioChange(data[0]?.notificationType??'', value)}
                    />
                    <Radio
                        label="Any of the conditions are true"
                        value="false"
                        checked={(data[0]?.allTrue ?? true) === false}
                        onChange={value => handleTriggerIfRadioChange(data[0]?.notificationType??'', value)}
                    />
                </Flex>
            )}
        </div>
    );
}

export default NotififcationRuleConditionCard;
