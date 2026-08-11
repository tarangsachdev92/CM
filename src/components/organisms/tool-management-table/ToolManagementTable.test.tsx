import '@testing-library/jest-dom';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import ToolManagementTable from './ToolManagementTable';

const mockFetchApplicationData = jest.fn((request: unknown) => ({
  type: 'MOCK_FETCH_APP_DATA',
  payload: request,
}));

const mockDispatch = jest.fn(async () => Promise.resolve());

const mockReduxState = {
  applicationData: {
    data: [],
    paginationData: { totalRows: 1 },
    columnFilters: {},
  },
  teamAndOwnerName: {
    ownerName: [],
  },
  fetchGeographicalInformation: {
    data: {
      regions: [],
    },
  },
  applicationManagement: {
    toolDetails: [],
  },
  lastRefreshDate: {
    data: {
      activityTimeStamp: null,
    },
  },
};

jest.mock('konnect-react-components', () => ({
  Toast: ({ message, toggle }: any) => (toggle ? <div data-testid="toast">{message}</div> : null),
  SearchInput: ({ onChange, placeholder }: any) => (
    <input data-testid="search-input" placeholder={placeholder} onChange={e => onChange(e.target.value)} />
  ),
  Dialog: () => null,
}));
jest.mock('react-router-dom', () => ({
  useParams: jest.fn(() => ({ roleId: 'test-role-id' })),
}));
jest.mock('react-redux', () => ({
  Provider: ({ children }: any) => <>{children}</>,
  useDispatch: () => mockDispatch,
  useSelector: (selector: any) => selector(mockReduxState),
}));
jest.mock('../../atoms', () => ({
  Label: ({ children }: any) => <span>{children}</span>,
}));
jest.mock('../../molecules/applied-filters/AppliedFilters', () => ({
  __esModule: true,
  default: ({ filters }: any) => <div data-testid="applied-filters">{filters.length > 0 ? 'Filters Applied' : ''}</div>,
}));
jest.mock('../../molecules/application-data-table/ApplicationDataTable', () => ({
  __esModule: true,
  default: (props: any) => (
    <div data-testid="application-data-table">
      <button
        data-testid="apply-tool-type-filter"
        onClick={() =>
          props.setNewFilters(
            'toolType',
            'Tool Type',
            [{ label: 'Analytics', value: 'Analytics' }],
            props.existingFilters,
            { ...props.defaultFilters, toolType: [{ label: 'Analytics', value: 'Analytics' }] },
          )
        }
      >
        apply tool type
      </button>
      <button
        data-testid="apply-tool-null-filter"
        onClick={() =>
          props.setNewFilters(
            'tool',
            'Tool',
            [{ label: 'Unknown Tool', value: 'null' }],
            props.existingFilters,
            { ...props.defaultFilters, tool: [{ label: 'Unknown Tool', value: 'null' }] },
          )
        }
      >
        apply tool null
      </button>
      <button
        data-testid="trigger-toast"
        onClick={() => props.setIsAppDetailsUpdated(true)}
      >
        trigger toast
      </button>
    </div>
  ),
}));
jest.mock('../../../store', () => ({
  fetchApplicationData: (request: unknown) => mockFetchApplicationData(request),
}));
jest.mock('../../../utils/helpers', () => ({
  convertOptions: jest.fn(() => []),
  removeElementByKey: jest.fn(() => []),
}));

describe('ToolManagementTable', () => {
  beforeEach(() => {
    mockFetchApplicationData.mockClear();
    mockDispatch.mockClear();
  });

  it('renders main title and description', () => {
    render(<ToolManagementTable />);
    expect(screen.getByText('All Tools')).toBeInTheDocument();
    expect(screen.getByText(/Click on a tool name to view more details/i)).toBeInTheDocument();
  });

  it('renders SearchInput', () => {
    render(<ToolManagementTable />);
    expect(screen.getByTestId('search-input')).toBeInTheDocument();
  });

  it('renders ApplicationDataTable', () => {
    render(<ToolManagementTable />);
    expect(screen.getByTestId('application-data-table')).toBeInTheDocument();
  });

  it('shows toast when toggleUpdateToast is true', () => {
    render(<ToolManagementTable />);

    expect(screen.queryByTestId('toast')).not.toBeInTheDocument();
    fireEvent.click(screen.getByTestId('trigger-toast'));

    expect(screen.getByTestId('toast')).toBeInTheDocument();
  });

  it('maps toolType filter to backend column Type in gridFilters request', async () => {
    render(<ToolManagementTable />);

    fireEvent.click(screen.getByTestId('apply-tool-type-filter'));

    await waitFor(() => {
      expect(mockFetchApplicationData).toHaveBeenCalledWith(
        expect.objectContaining({
          gridFilters: expect.arrayContaining([
            expect.objectContaining({
              columnName: 'Type',
              columnValue: 'Analytics',
              id: 'Analytics',
            }),
          ]),
        }),
      );
    });
  });

  it('normalizes string null filter value to id null in gridFilters request', async () => {
    render(<ToolManagementTable />);

    fireEvent.click(screen.getByTestId('apply-tool-null-filter'));

    await waitFor(() => {
      expect(mockFetchApplicationData).toHaveBeenCalledWith(
        expect.objectContaining({
          gridFilters: expect.arrayContaining([
            expect.objectContaining({
              columnName: 'Tool Name',
              columnValue: 'Unknown Tool',
              id: null,
            }),
          ]),
        }),
      );
    });
  });
});
