// UserProfileSettingsGlobalFilters.test.tsx
import { Provider } from 'react-redux';
import configureStore from 'redux-mock-store';
import { mount } from 'enzyme';
import UserProfileSettingsGlobalFilters from './UserProfileSettingsGlobalFilters';
import { DropDown, IconButton } from 'konnect-react-components';
import RoleBasedFilterCard from '../../molecules/role-based-filter-card/RoleBasedFilterCard';

const mockStore = configureStore([]);
const store = mockStore({
  filterGroupDetails: {
    data: [
      {
        filterId: 1,
        filterName: 'Test Group',
        financialCycle: 'FY24',
        hierarchy: {
          geographies: { regions: [] },
          products: { segments: [] },
          customers: { channelCustomers: [] },
        },
      },
    ],
    hierarchies: [],
  },
  primaryRole: {
    data: { roleType: 'Admin', region: 'US' },
  },
});

describe('<UserProfileSettingsGlobalFilters />', () => {
  let wrapper: ReturnType<typeof mount>;

  beforeEach(() => {
    // Mock dispatch to handle thunks as plain objects
    // @ts-expect-error will consider in test coverage
    store.dispatch = jest.fn((action) => {
      if (typeof action === 'function') {
        return {};
      }
      return action;
    });
    wrapper = mount(
      <Provider store={store}>
        <UserProfileSettingsGlobalFilters />
      </Provider>
    );
  });

  it('renders DropDown for hierarchy selection', () => {
    const dropdown = wrapper.find(DropDown).at(0);
    expect(dropdown.exists()).toBe(true);
    expect(dropdown.props().dropdown.label).toBe('Command Center Hierarchy');
  });

  it('renders IconButton for info', () => {
    const iconButton = wrapper.find(IconButton).at(0);
    expect(iconButton.exists()).toBe(true);
    expect(iconButton.props().icon).toBe('info-circle');
  });

  it('renders RoleBasedFilterCard', () => {
    const roleCard = wrapper.find(RoleBasedFilterCard).at(0);
    expect(roleCard.exists()).toBe(true);
  });

  it('renders filter group title', () => {
    expect(wrapper.text()).toContain('Filter Groups');
  });

  it('renders filter group data from store', () => {
    expect(wrapper.text()).toContain('Test Group');
  });
});
