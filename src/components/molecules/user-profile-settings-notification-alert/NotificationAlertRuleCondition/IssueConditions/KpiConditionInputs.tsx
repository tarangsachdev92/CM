import { Button, Flex, Input, Select } from 'antd';
import Style from './IssueConditionInputs.module.scss';
import { Icon } from 'konnect-react-components';
import { INotiConditionDetail } from '../../../../../types/response';
import { useEffect, useState } from 'react';

type Props = {
    conditions: INotiConditionDetail[];
    handleDataChange: (condition: INotiConditionDetail) => void;
    handleAddButtonState: (state: boolean) => void;
    onDelete: (id: string) => void;
};

type ValidationEntry = { id: string; status: boolean };
function KpiConditionInputs({
    conditions,
    handleDataChange,
    handleAddButtonState,
    onDelete,
}: Props) {
    const [validationList, setValidationList] = useState<ValidationEntry[]>([]);

    useEffect(() => {
        if (conditions && conditions.length > 0) {
            const faulty = conditions.some(
                con =>
                    con.comparisonOperator === null ||
                    con.comparisonOperator === '' ||
                    con.kpiValue === null ||
                    isNaN(con.kpiValue),
            );
            handleAddButtonState(!faulty);
        } else {
            handleAddButtonState(true);
        }
    }, [conditions]);

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
    
    }

    return (
        <>
            {conditions.map(cond => {
                return (
                    <div key={cond.id}>
                        <Flex className={Style['issue-condition-module-cond-header-input-grp']}>
                            <Input
                                placeholder="Value is"
                                className={Style['issue-condition-kpi-value-is-title']}
                                value={'Value is'}
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
                        <Flex className={Style['issue-condition-module-cond-subtitle-input-grp']}>
                            {/* <RenderConditionValues /> */}
                            <Select
                                placeholder="Select Operator"
                                getPopupContainer={trigger => trigger.parentNode}
                                onChange={value => {
                                    handleOperatorChange(cond.id, value);
                                }}
                                  options={
                    [
                         {
                            value: '<',
                            label: '<'
                        },
                        {
                            value: '<=',
                            label: '<='
                        },
                         {
                            value: '>',
                            label: '>'
                        },
                        {
                            value: '>=',
                            label: '>='
                        },
                         {
                            value: '=',
                            label: '='
                        },
                         {
                            value: '=/',
                            label: '=/'
                        },
                    ]
                }
                                className="noti-rule-issue-kpi-type-operator"
                                value={cond.comparisonOperator}
                            />
                            <Input
                                placeholder="Enter value"
                                // className={Style['issue-condition-kpi-value']}
                                className={validationList.some(v=> v.id === cond.id) ? (Style['issue-condition-kpi-value'],Style['error']) :Style['issue-condition-kpi-value']}
                                value={cond.kpiValue ?? ''}
                                type="number"
                                onChange={event => {
                                    handleValueChange(cond.id, event.target.value);
                                }}
                                onKeyUp={(e)=>handleValueKeyUp(e,cond.id)}
                            />
                        </Flex>
                        {validationList.some(v=> v.id===cond.id) && (
                            <Flex gap={10} style={{marginTop:'0.5rem'}}>
                                <Icon name="info-circle" color="status-error-color" />
                                <label className={Style['issueInput-error-label']}>
                                    Invalid entry : Please enter a numerical value only. No special
                                    characters such as % or $ should be entered here.
                                </label>
                            </Flex>
                        )}
                    </div>
                );
            })}
        </>
    );
}

export default KpiConditionInputs;
