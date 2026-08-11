import { mount } from 'enzyme';
import { Provider } from 'react-redux';
import configureStore from 'redux-mock-store';
import NotificationAlertRuleCard from './NotificationAlertRuleCard';
import { CheckBox, Dialog, IconButton} from 'konnect-react-components';

jest.mock('../../../services/alertnotificationRules', () => ({
  deleteRuleById: jest.fn(() => Promise.resolve({ statusCode: 200 })),
}));

const defaultProps = {
  ruleTypeId: 1 as const,
  ruleId: 123,
  kpiName: 'KPI Name',
  dimensions: { Geography: 'US', Other: 'Test' },
  notificationsCount: 2,
  warningsCount: 1,
  alertsCount: 3,
  isEnabled: true,
  notificationType: null,
  onChangeHandlerOfRule: jest.fn(),
  handleEditRule: jest.fn(),
  showToastOnSuccess: jest.fn(),
};

const mockStore = configureStore([]);
const store = mockStore({});

describe('<NotificationAlertRuleCard />', () => {
  let wrapper: ReturnType<typeof mount>;

  beforeEach(() => {
    wrapper = mount(
      <Provider store={store}>
        <NotificationAlertRuleCard {...defaultProps} />
      </Provider>
    );
  });

  it('renders CheckBox with correct checked state', () => {
    const checkbox = wrapper.find(CheckBox).at(0);
    expect(checkbox.exists()).toBe(true);
    expect(checkbox.props().checked).toBe(true);
  });

  it('renders rule title', () => {
    expect(wrapper.text()).toContain('KPI Name');
  });

  it('renders notification, warning, and alert counts', () => {
    expect(wrapper.text()).toContain('Notification');
    expect(wrapper.text()).toContain('Warnings');
    expect(wrapper.text()).toContain('Alerts');
    expect(wrapper.text()).toContain('2');
    expect(wrapper.text()).toContain('1');
    expect(wrapper.text()).toContain('3');
  });

  it('shows Dialog when showDeletePopup is true', () => {
    wrapper.find('div').at(0).simulate('mouseenter');
    wrapper.find(IconButton).at(1).simulate('click');
    wrapper.update();
    const dialog = wrapper.find(Dialog);
    expect(dialog.exists()).toBe(true);
    expect(dialog.props().isOpen).toBe(true);
  });

  it('calls handleEditRule when edit icon is clicked', () => {
    wrapper.find('div').at(0).simulate('mouseenter');
    wrapper.find(IconButton).at(0).simulate('click');
    expect(defaultProps.handleEditRule).toHaveBeenCalledWith(123);
  });

  it('calls onChangeHandlerOfRule when CheckBox is changed', () => {
    const checkbox = wrapper.find(CheckBox).at(0);
    checkbox.props().onChange(false);
    expect(defaultProps.onChangeHandlerOfRule).toHaveBeenCalledWith(false, 123);
  });
});
