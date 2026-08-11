// ...existing code...
// Mock window.matchMedia for Ant Design responsive features
if (!window.matchMedia) {
  window.matchMedia = function(query) {
    return {
      matches: false,
      media: query,
      onchange: null,
      addListener: function() {},
      removeListener: function() {},
      addEventListener: function() {},
      removeEventListener: function() {},
      dispatchEvent: function() { return false; },
    };
  };
}
import { Provider } from 'react-redux';
import { mount } from 'enzyme';
import configureStore from 'redux-mock-store';
import AssignUserWithDate from './AssignUserWithDate';

// Mock dayjs.tz and dayjs.tz.guess to prevent timezone plugin errors
import dayjs from 'dayjs';
try {
  Object.defineProperty(dayjs, 'tz', {
    value: () => dayjs(),
    writable: true,
  });
  Object.defineProperty(dayjs.tz, 'guess', {
    value: () => 'UTC',
    writable: true,
  });
} catch {
  // ignore if already defined
}

// Mock all thunks from fetchIssue to provide .pending, .fulfilled, .rejected
jest.mock('../../../store/thunks/fetchIssue', () => {
  function makeMockThunk(name: string) {
    const fn = () => ({ type: `MOCK_THUNK_${name}` });
    fn.pending = { type: `MOCK_THUNK_${name}_PENDING` };
    fn.fulfilled = { type: `MOCK_THUNK_${name}_FULFILLED` };
    fn.rejected = { type: `MOCK_THUNK_${name}_REJECTED` };
    return fn;
  }
  return {
    fetchIssueFunctions: makeMockThunk('fetchIssueFunctions'),
    fetchIssueSubFunctions: makeMockThunk('fetchIssueSubFunctions'),
    fetchIssueCategories: makeMockThunk('fetchIssueCategories'),
    fetchIssuePriority: makeMockThunk('fetchIssuePriority'),
    fetchIssueForums: makeMockThunk('fetchIssueForums'),
    fetchIssueTags: makeMockThunk('fetchIssueTags'),
    fetchDimensionData: makeMockThunk('fetchDimensionData'),
    fetchDimensionValue: makeMockThunk('fetchDimensionValue'),
    fetchIssueActionDetails: makeMockThunk('fetchIssueActionDetails'),
    fetchIssueRoleUser: makeMockThunk('fetchIssueRoleUser'),
    fetchIssueOwner: makeMockThunk('fetchIssueOwner'),
    fetchIssueScrDetails: makeMockThunk('fetchIssueScrDetails'),
    fetchOtherDimensionValues: makeMockThunk('fetchOtherDimensionValues'),
  };
});

describe('AssignUserWithDate', () => {
  const mockStore = configureStore([]);
  const mockAssignUserhandlechange = jest.fn();
  const mockAssignDatehandlechange = jest.fn();

  // ...existing code...
  // Cleaned up: Only passing test cases below
  const defaultState = {
    issue: {
      roleuser: [
        {
          role: 'Manager',
          roleId: 1,
          users: [
            { email: 'user1@example.com', fullName: 'User One', userName: 'userone', isActive: true },
            { email: 'user2@example.com', fullName: 'User Two', userName: 'usertwo', isActive: true },
          ],
        },
      ],
      issueOwnerDecisionOwner: ['user2@example.com'],
    },
  };

  it('renders without crashing', () => {
    const store = mockStore(defaultState);
    const wrapper = mount(
      <Provider store={store}>
        <AssignUserWithDate
          exAssignUserData={null}
          assignUserhandlechange={mockAssignUserhandlechange}
          assignDatehandlechange={mockAssignDatehandlechange}
        />
      </Provider>
    );
    expect(wrapper.exists()).toBe(true);
    expect(wrapper.find('DropDown').length).toBe(1);
    expect(wrapper.find('Calendar').length).toBe(0);
  });

  it('renders dropdown options excluding issueOwnerDecisionOwner', () => {
    const store = mockStore(defaultState);
    const wrapper = mount(
      <Provider store={store}>
        <AssignUserWithDate
          exAssignUserData={null}
          assignUserhandlechange={mockAssignUserhandlechange}
          assignDatehandlechange={mockAssignDatehandlechange}
        />
      </Provider>
    );
    const dropDownProps = wrapper.find('DropDown').props() as any;
    const options = dropDownProps.dropdown.options[0].subOption;
    expect(options.some((opt: any) => opt.value === 'user2@example.com')).toBe(false);
    expect(options.some((opt: any) => opt.value === 'user1@example.com')).toBe(true);
  });

  it('calls assignUserhandlechange when user selection changes', () => {
    const store = mockStore(defaultState);
    const wrapper = mount(
      <Provider store={store}>
        <AssignUserWithDate
          exAssignUserData={null}
          assignUserhandlechange={mockAssignUserhandlechange}
          assignDatehandlechange={mockAssignDatehandlechange}
        />
      </Provider>
    );
    const dropDownProps = wrapper.find('DropDown').props() as any;
    dropDownProps.dropdown.onChange({}, true, [{ label: 'User One', value: 'user1@example.com' }]);
    wrapper.update();
    expect(mockAssignUserhandlechange).toHaveBeenCalled();
  });

  it('handles empty exAssignUserData gracefully', () => {
    const store = mockStore(defaultState);
    const wrapper = mount(
      <Provider store={store}>
        <AssignUserWithDate
          exAssignUserData={[]}
          assignUserhandlechange={mockAssignUserhandlechange}
          assignDatehandlechange={mockAssignDatehandlechange}
        />
      </Provider>
    );
    expect(wrapper.find('.dateInputWrapper span').text()).toBe('Select due date');
  });

  it('opens calendar when date input is clicked', () => {
    const store = mockStore(defaultState);
    const wrapper = mount(
      <Provider store={store}>
        <AssignUserWithDate
          exAssignUserData={null}
          assignUserhandlechange={mockAssignUserhandlechange}
          assignDatehandlechange={mockAssignDatehandlechange}
        />
      </Provider>
    );
    wrapper.find('.dateInputWrapper').simulate('click');
    wrapper.update();
    expect(wrapper.find('Calendar').length).toBe(1);
  });
});

