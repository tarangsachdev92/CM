// Mock react-router-dom hooks
jest.mock('react-router-dom', () => ({
  ...jest.requireActual('react-router-dom'),
  useLocation: jest.fn(() => ({ pathname: '/' })),
  useNavigate: jest.fn(() => jest.fn()),
}));

import { mount } from 'enzyme';
import { Provider } from 'react-redux';
import { createStore } from 'redux';
import DataTable from './DataTable';
import { FilterType } from '../applied-filters/AppliedFilters';
import { IRoleData, IColumnFilterData } from '../../../types/response';

// Minimal dummy reducer for testing
const dummyReducer = (state = {}) => state;
const store = createStore(dummyReducer);

describe('DataTable', () => {
  const defaultFilters = {
    role: [{ label: 'Admin', value: 1 }],
    function: [{ label: 'IT', value: 2 }],
    rolelevel: [{ label: 'Level 1', value: 3 }],
    region: [{ label: 'APAC', value: 4 }],
    market: [{ label: 'India', value: 5 }],
    site: [{ label: 'Site A', value: 6 }],
    usercount: [{ label: '10+', value: 7 }],
    isactive: [{ label: 'Active', value: 8 }],
  };

  const filtersData = {
    role: [{ label: 'Admin', value: 1 }],
  };

  const existingFilters: FilterType[] = [
    {
      id: 'role',
      title: 'Role',
      selectedFilters: [{ label: 'Admin', value: '1' }],
      defaultFilters: [{ label: 'Admin', value: '1' }],
      onClose: () => {},
    }
  ];

  const roleData: IRoleData[] = [
    {
      roleId: 1,
      role: 'Admin',
      function: 'IT',
      roleLevel: 'Level 1',
      region: 'APAC',
      regionId: 1,
      market: 'India',
      site: 'Site A',
      numberOfUsers: 10,
      isActive: true,
      totalRows: 1,
      totalPages: 1,
      roleType: null,
      roleLevelId: 0,
      latestRoleId: null,
      functionId: 0,
      subFunction: '',
      subFunctionId: 0,
      department: '',
      departmentId: 0,
      clusterId: '',
      cluster: '',
      marketId: '',
      siteId: '',
      roleAlias: '',
      roleGeoName: null,
      secondaryRoles: null,
      geographyLevel: null,
      fullRoleName: '',
      responsibilityLevel: '',
      roleName: '',
      status: true,
      userCount: 5
    }
  ];

  const appliedFilters: IColumnFilterData[] = [];

  it('renders without crashing', () => {
    const wrapper = mount(
      <Provider store={store}>
        <DataTable
          defaultFilters={defaultFilters}
          filtersData={filtersData}
          setNewFilters={() => {}}
          existingFilters={existingFilters}
          roleData={roleData}
          pageSize={10}
          pageNumber={1}
          totalRows={1}
          loading={false}
          searchText={''}
          handleSorting={() => {}}
          handlePageChange={() => {}}
          handlePageSizeChange={() => {}}
          refreshData={() => {}}
          appliedFilters={appliedFilters}
        />
      </Provider>
    );
    expect(wrapper.exists()).toBe(true);
    expect(wrapper.find('.table-container').length).toBe(2);
  });

  it('shows empty state when no roles are added', () => {
    const wrapper = mount(
      <Provider store={store}>
        <DataTable
          defaultFilters={defaultFilters}
          filtersData={filtersData}
          setNewFilters={() => {}}
          existingFilters={existingFilters}
          roleData={[]}
          pageSize={10}
          pageNumber={1}
          totalRows={0}
          loading={false}
          searchText={''}
          handleSorting={() => {}}
          handlePageChange={() => {}}
          handlePageSizeChange={() => {}}
          refreshData={() => {}}
          appliedFilters={[]}
        />
      </Provider>
    );
    expect(wrapper.text()).toContain('No Roles Added Yet');
  });

  it('shows no records found when searchText is present and no data', () => {
    const wrapper = mount(
      <Provider store={store}>
        <DataTable
          defaultFilters={defaultFilters}
          filtersData={filtersData}
          setNewFilters={() => {}}
          existingFilters={existingFilters}
          roleData={[]}
          pageSize={10}
          pageNumber={1}
          totalRows={0}
          loading={false}
          searchText={'something'}
          handleSorting={() => {}}
          handlePageChange={() => {}}
          handlePageSizeChange={() => {}}
          refreshData={() => {}}
          appliedFilters={[]}
        />
      </Provider>
    );
    expect(wrapper.text()).toContain('No Matches Found');
  });

  it('shows loading overlay when loading is true', () => {
    const wrapper = mount(
      <Provider store={store}>
        <DataTable
          defaultFilters={defaultFilters}
          filtersData={filtersData}
          setNewFilters={() => {}}
          existingFilters={existingFilters}
          roleData={roleData}
          pageSize={10}
          pageNumber={1}
          totalRows={1}
          loading={true}
          searchText={''}
          handleSorting={() => {}}
          handlePageChange={() => {}}
          handlePageSizeChange={() => {}}
          refreshData={() => {}}
          appliedFilters={[]}
        />
      </Provider>
    );
    expect(wrapper.find('.overlay').length).toBe(1);
  });
});
