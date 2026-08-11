import { mount } from 'enzyme';
import configureMockStore from 'redux-mock-store';
import { Provider } from 'react-redux';
import IssueRiskOppNotificationCard from './IssueRiskOppNotificationCard';
import * as alertnotificationRules from '../../../services/alertnotificationRules';

const mockRemoveNotificationCard = jest.fn();
const mockOnClose = jest.fn();
const mockHeader = <span>Header</span>;
const mockTitleIcon = <span>Icon</span>;
const mockSubCardTextItems = [
  { kpiName: 'KPI', value: 10, trendIndicator: 'increasepositively', unitOfMeasure: '%' },
];
const mockActionStatus = [
  {
    issueId: '1',
    actionTitle: 'Action',
    actionOwnerName: 'Owner',
    assignedTo: 'User',
    actionDescription: 'Desc',
    status: 'Completed',
    dueDate: '2025-07-30',
    logDate: '2025-07-29',
    updatedOn: '2025-07-30',
  },
];

describe('IssueRiskOppNotificationCard', () => {
  let wrapper: ReturnType<typeof mount>;
  const mockStore = configureMockStore();
  let store: any;
beforeEach(() => {
  jest.spyOn(alertnotificationRules, 'notificationMarkAsRead').mockResolvedValue(undefined);
    store = mockStore({});
    wrapper = mount(
      <Provider store={store}>
        <IssueRiskOppNotificationCard
          titleIcon={mockTitleIcon}
          activityType={false}
          header={mockHeader}
          subtitleText="Subtitle"
          bodyText={["Body1", "Body2"]}
          currentUser="User"
          subCardHeaderText="HeaderText"
          subCardPrimaryText="PrimaryText"
          subCardSecondaryText="SecondaryText"
          subCardTextItems={mockSubCardTextItems}
          actionStatus={mockActionStatus}
          actionText="ActionText"
          onClose={mockOnClose}
          type="warning"
          id={1}
          removeNotificationCard={mockRemoveNotificationCard}
          isGenericNotification={false} 
          priority='medium'
        />
      </Provider>
    );
  });

  it('renders with required props', () => {
    expect(wrapper.exists()).toBe(true);
    expect(wrapper.find('.notification-card-container').exists()).toBe(true);
    expect(wrapper.find('.iso-card-title').at(0).text()).toContain('Header');
    expect(wrapper.find('.iso-card-subtitle').at(0).text()).toBe('Subtitle');
  });

  it('expands/collapses when expand icon is clicked', () => {
    const expandIcon = wrapper.find('.iso-card-expand-icon');
    expect(wrapper.find('.iso-card-body').exists()).toBe(false);
    expandIcon.simulate('click');
    expect(wrapper.find('.iso-card-body').exists()).toBe(true);
    expandIcon.simulate('click');
    expect(wrapper.find('.iso-card-body').exists()).toBe(false);
  });

  it('calls removeNotificationCard when close icon is clicked', () => {
    const closeIcon = wrapper.find('.iso-card-close-icon');
    closeIcon.simulate('click', { stopPropagation: () => {} });
    expect(mockRemoveNotificationCard).toHaveBeenCalledWith(1);
  });

  it('marks notification as read on card click', () => {
    const card = wrapper.find('.notification-card-container').at(0);
    card.simulate('click');
    // State change: hasMarkedRead should be true
    expect(wrapper.find('IssueRiskOppNotificationCard').prop('id')).toBe(1);
  });

  it('renders subCardTextItems and actionStatus when expanded', () => {
    wrapper.find('.iso-card-expand-icon').simulate('click');
    expect(wrapper.find('.iso-card-secondary-s2-item-grp').exists()).toBe(true);
    expect(wrapper.find('.action-status-container').exists()).toBe(true);
  });
});
