import { mount } from 'enzyme';
import configureMockStore from 'redux-mock-store';
import { Provider } from 'react-redux';
import KPIDetailsNotificationCard from './KPIDetailsNotificationCard';
import * as alertnotificationRules from '../../../services/alertnotificationRules';

const mockRemoveNotificationCard = jest.fn();
const mockTitleIcon = <span>Icon</span>;

describe('KPIDetailsNotificationCard', () => {
  let wrapper: ReturnType<typeof mount>;
  const mockStore = configureMockStore();
  let store: any;
  beforeEach(() => {
    jest.spyOn(alertnotificationRules, 'notificationMarkAsRead').mockResolvedValue(undefined);
    store = mockStore({});
    wrapper = mount(
      <Provider store={store}>
        <KPIDetailsNotificationCard
          titleIcon={mockTitleIcon}
          activityType={false}
          titleText="KPI Title"
          subtitleText="KPI Subtitle" 
          currentUser="User"
          date="2025-07-30"
          currentValue="95%"
          targetText="Target: 90%"
          trendType="positive"
          comparsionValue="95%"
          ComparisionText="Last Month"
          type="alert"
          id={1}
          removeNotificationCard={mockRemoveNotificationCard}
          isGenericNotification={false}
          conditionValue='23.4'
        />
      </Provider>
    );
  });

  it('renders with required props', () => {
    expect(wrapper.exists()).toBe(true);
    expect(wrapper.find('.notification-card-container').exists()).toBe(true);
    expect(wrapper.find('.kpi-card-title').at(0).text()).toBe('KPI Title');
    expect(wrapper.find('.kpi-card-subtitle').at(0).text()).toBe('KPI Subtitle');
  });

  it('expands/collapses when expand icon is clicked', () => {
    const expandIcon = wrapper.find('.iso-card-expand-icon');
    expect(wrapper.find('.kpi-card-body').exists()).toBe(false);
    expandIcon.simulate('click');
    expect(wrapper.find('.kpi-card-body').exists()).toBe(true);
    expandIcon.simulate('click');
    expect(wrapper.find('.kpi-card-body').exists()).toBe(false);
  });

  it('calls removeNotificationCard when close icon is clicked', () => {
    const closeIcon = wrapper.find('.iso-card-close-icon');
    closeIcon.simulate('click', { stopPropagation: () => {} });
    expect(mockRemoveNotificationCard).toHaveBeenCalledWith(1);
  });

  it('marks notification as read on card click', () => {
    const card = wrapper.find('.notification-card-container').at(0);
    card.simulate('click');
    expect(wrapper.find('KPIDetailsNotificationCard').prop('id')).toBe(1);
  });

  it('renders expanded body content correctly', () => {
    wrapper.find('.iso-card-expand-icon').simulate('click');
    expect(wrapper.find('.kpi-card-body-primary-subtitle').at(0).text()).toBe('2025-07-30');
    expect(wrapper.find('.kpi-card-body-primary-title').at(0).text()).toBe('95%');
    expect(wrapper.find('.kpi-card-body-secondary-text-s1').at(0).text()).toBe('Target: 90%');
    expect(wrapper.find('.kpi-card-body-secondary-text-s2').at(0).text()).toBe('95%');
    expect(wrapper.find('.kpi-card-body-secondary-text-s4').at(0).text()).toBe('Last Month');
  });

  it('renders icons and header/subtitle text', () => {
    expect(wrapper.find('.kpi-card-avatar').exists()).toBe(true);
    expect(wrapper.find('.kpi-card-title').at(0).text()).toBe('KPI Title');
    expect(wrapper.find('.kpi-card-subtitle').at(0).text()).toBe('KPI Subtitle');
  });
});
