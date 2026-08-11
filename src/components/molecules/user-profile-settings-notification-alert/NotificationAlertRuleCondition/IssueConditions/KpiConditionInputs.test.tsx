import { mount } from 'enzyme';
import KpiConditionInputs from './KpiConditionInputs';
import { act } from 'react-dom/test-utils';

describe('KpiConditionInputs', () => {
  const baseCondition = {
    id: '1',
    conditionId: 1,
    whenCondition: 'Positive Impact On',
    kpiId: 1,
    kpiName: 'KPI1',
    kpiValue: 10,
    escalationId: null,
    escalationName: null,
    priorityId: null,
    priorityName: null,
    comparisonOperator: '>',
    notificationType: '',
    allTrue: false,
  };

  it('renders operator select and value input', () => {
    const wrapper = mount(
      <KpiConditionInputs
        conditions={[baseCondition]}
        handleDataChange={jest.fn()}
        handleAddButtonState={jest.fn()}
        onDelete={jest.fn()}
      />
    );
    expect(wrapper.find('.noti-rule-issue-kpi-type-operator').exists()).toBe(true);
    expect(wrapper.find('input[type="number"]').exists()).toBe(true);
  });

  it('calls handleValueChange when value is changed', () => {
    const handleDataChange = jest.fn();
    const wrapper = mount(
      <KpiConditionInputs
        conditions={[baseCondition]}
        handleDataChange={handleDataChange}
        handleAddButtonState={jest.fn()}
        onDelete={jest.fn()}
      />
    );
    act(() => {
      wrapper.find('input[type="number"]').at(0).simulate('change', { target: { value: '42' } });
      wrapper.update();
    });
    expect(handleDataChange).toHaveBeenCalledWith(expect.objectContaining({ kpiValue: 42 }));
  });

  it('calls onDelete when trash button is clicked', () => {
    const onDelete = jest.fn();
    const wrapper = mount(
      <KpiConditionInputs
        conditions={[baseCondition]}
        handleDataChange={jest.fn()}
        handleAddButtonState={jest.fn()}
        onDelete={onDelete}
      />
    );
    act(() => {
      wrapper.find('button').at(0).simulate('click');
      wrapper.update();
    });
    expect(onDelete).toHaveBeenCalledWith(baseCondition.id);
  });

  it('shows validation error when value is empty and keyup occurs', () => {
    const wrapper = mount(
      <KpiConditionInputs
        conditions={[{ ...baseCondition, kpiValue: null }]}
        handleDataChange={jest.fn()}
        handleAddButtonState={jest.fn()}
        onDelete={jest.fn()}
      />
    );
    act(() => {
      wrapper.find('input[type="number"]').at(0).simulate('keyup', { target: { value: '' } });
      wrapper.update();
    });
    expect(wrapper.text()).toContain('Invalid entry');
  });
});
