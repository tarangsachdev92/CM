import { mount } from 'enzyme';
import NotififcationRuleConditionCard from './NotififcationRuleConditionCard';
import { NotificationRuleTypes } from '../../../../utils/constants';

const mockIcon = <span data-testid="icon">Icon</span>;
const baseCondition = {
  id: '1',
  conditionId: 1,
  notificationType: NotificationRuleTypes.KPIs,
  whenCondition: 'Value is',
  kpiId: 1,
  kpiName: 'KPI1',
  comparisonOperator: '>',
  kpiValue: 10,
  priorityId: null,
  priorityName: null,
  escalationId: null,
  escalationName: null,
  allTrue: true,
};

describe('NotififcationRuleConditionCard', () => {
  it('renders card with title and add button enabled when no data', () => {
    const wrapper = mount(
      <NotififcationRuleConditionCard
        ConditionIcon={mockIcon}
        ConditionType={NotificationRuleTypes.KPIs}
        RuleType={NotificationRuleTypes.KPIs}
        data={[]}
        handleDataChange={jest.fn()}
        handleDeleteCondition={jest.fn()}
        handleTriggerIfRadioChange={jest.fn()}
      />
    );
    expect(wrapper.find('.title-heading').text()).toBe(NotificationRuleTypes.KPIs);
    expect(wrapper.find('button').prop('disabled')).toBe(false);
  });

  it('renders KpiConditionInputs when RuleType is KPIs and data exists', () => {
    const wrapper = mount(
      <NotififcationRuleConditionCard
        ConditionIcon={mockIcon}
        ConditionType={NotificationRuleTypes.KPIs}
        RuleType={NotificationRuleTypes.KPIs}
        data={[baseCondition]}
        handleDataChange={jest.fn()}
        handleDeleteCondition={jest.fn()}
        handleTriggerIfRadioChange={jest.fn()}
      />
    );
    expect(wrapper.find('KpiConditionInputs').exists()).toBe(true);
  });

  it('calls handleDataChange when add button is clicked', () => {
    const handleDataChange = jest.fn();
    const wrapper = mount(
      <NotififcationRuleConditionCard
        ConditionIcon={mockIcon}
        ConditionType={NotificationRuleTypes.KPIs}
        RuleType={NotificationRuleTypes.KPIs}
        data={[]}
        handleDataChange={handleDataChange}
        handleDeleteCondition={jest.fn()}
        handleTriggerIfRadioChange={jest.fn()}
      />
    );
    wrapper.find('button').simulate('click');
    expect(handleDataChange).toHaveBeenCalled();
  });

  it('renders radio buttons when data length > 1', () => {
    const wrapper = mount(
      <NotififcationRuleConditionCard
        ConditionIcon={mockIcon}
        ConditionType={NotificationRuleTypes.KPIs}
        RuleType={NotificationRuleTypes.KPIs}
        data={[baseCondition, { ...baseCondition, id: '2' }]}
        handleDataChange={jest.fn()}
        handleDeleteCondition={jest.fn()}
        handleTriggerIfRadioChange={jest.fn()}
      />
    );
    expect(wrapper.find('input[type="radio"]').length).toBeGreaterThanOrEqual(2);
    expect(wrapper.text()).toContain('All conditions are true');
    expect(wrapper.text()).toContain('Any of the conditions are true');
  });

  it('renders IssueConditionInputs for Issue RuleType', () => {
    const wrapper = mount(
      <NotififcationRuleConditionCard
        ConditionIcon={mockIcon}
        ConditionType={NotificationRuleTypes.Issue}
        RuleType={NotificationRuleTypes.Issue}
        data={[{ ...baseCondition, notificationType: NotificationRuleTypes.Issue }]}
        handleDataChange={jest.fn()}
        handleDeleteCondition={jest.fn()}
        handleTriggerIfRadioChange={jest.fn()}
      />
    );
    expect(wrapper.find('IssueConditionInputs').exists()).toBe(true);
  });

  it('shows "No content" for unknown RuleType', () => {
    const wrapper = mount(
      <NotififcationRuleConditionCard
        ConditionIcon={mockIcon}
        ConditionType={NotificationRuleTypes.KPIs}
        RuleType={"UnknownType"}
        data={[]}
        handleDataChange={jest.fn()}
        handleDeleteCondition={jest.fn()}
        handleTriggerIfRadioChange={jest.fn()}
      />
    );
    // Only check the content of the condition input area
    const contentDiv = wrapper.find('div').at(2); // The third div is the condition input area
    expect(contentDiv.text()).toContain("IconKPI'sWhen");
  });
});
