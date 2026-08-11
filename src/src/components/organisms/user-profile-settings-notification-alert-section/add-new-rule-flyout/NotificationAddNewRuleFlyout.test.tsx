import { mount } from 'enzyme';
import NotificationAddNewRuleFlyout from './NotificationAddNewRuleFlyout';
import { Flyout,DropDown } from 'konnect-react-components';

jest.mock('../../../../services/alertnotificationRules', () => ({
  getRuleDetailsById: jest.fn(() => Promise.resolve({
    ruleDetail: {
      ruleTypeId: 1,
      ruleTypeName: 'KPI',
      functionId: 1,
      functionName: 'Function',
      kpiId: 1,
      kpiName: 'KPI Name',
    },
    dimensionMapping: [],
    conditionDetail: [],
  })),
  getRuleTypes: jest.fn(() => Promise.resolve([
    { ruleTypeId: 1, ruleTypeName: 'KPI' },
    { ruleTypeId: 2, ruleTypeName: 'Opportunity' },
  ])),
  getRuleValuebyRuleType: jest.fn(() => Promise.resolve({
    kpis: [{ kpiId: 1, kpiName: 'KPI Name' }],
    functions: [{ functionId: 1, functionName: 'Function' }],
  })),
  saveRule: jest.fn(() => Promise.resolve({})),
}));

const defaultProps = {
  flyoutOpen: true,
  handleFlyoutOpen: jest.fn(),
  ruleId: 0,
  setLastOperatedRule: jest.fn(),
};

describe('<NotificationAddNewRuleFlyout />', () => {
  let wrapper: ReturnType<typeof mount>;

  beforeEach(() => {
    wrapper = mount(<NotificationAddNewRuleFlyout {...defaultProps} />);
  });

  it('renders Flyout with correct heading for add mode', () => {
    const flyout = wrapper.find(Flyout).at(0);
    expect(flyout.exists()).toBe(true);
    expect(flyout.props().heading).toBe('Add New Rule');
  });

  it('renders DropDown for rule type', () => {
    const dropdown = wrapper.find(DropDown).at(0);
    expect(dropdown.exists()).toBe(true);
    expect(dropdown.props().dropdown.label).toBe('Rule Type');
  });
});
