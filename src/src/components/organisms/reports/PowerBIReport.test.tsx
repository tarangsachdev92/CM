import '@testing-library/jest-dom';

// Explicitly mock useSelector as a Jest mock function before importing react-redux
jest.mock('react-redux', () => ({
  ...jest.requireActual('react-redux'),
  useSelector: jest.fn(),
}));
import { render, screen, waitFor } from '@testing-library/react';
import PowerBIReport from './PowerBIReport';
// import * as redux from 'react-redux';

// Explicitly mock getPowerBIEmbedToken as a Jest mock function
jest.mock('../../../services/application', () => ({
  ...jest.requireActual('../../../services/application'),
  getPowerBIEmbedToken: jest.fn(),
}));
jest.mock('konnect-react-components', () => ({
  AnimatedLoaders: () => <div data-testid="loader" />,
}));
jest.mock('../../../assets/images/images', () => ({
  ReportAccessDeniedState: () => <div data-testid="access-denied" />,
}));
jest.mock('../../atoms', () => ({ Label: ({ children }: any) => <span>{children}</span> }));
jest.mock('antd', () => ({ Flex: ({ children }: any) => <div>{children}</div> }));
jest.mock('powerbi-client', () => ({
  models: {
    FilterType: { Basic: 'Basic' },
    ViewMode: { View: 'View' },
    TokenType: { Embed: 'Embed' }
  },
  service: {
    Service: jest.fn(() => ({
      reset: jest.fn(),
      embed: jest.fn(() => ({
        on: jest.fn(),
        getActivePage: jest.fn(),
        getVisuals: jest.fn()
      }))
    }))
  },
  factories: {
    hpmFactory: {},
    wpmpFactory: {},
    routerFactory: {}
  }
}));

import { useSelector as mockUseSelectorFn } from 'react-redux';
import { getPowerBIEmbedToken as mockGetPowerBIEmbedTokenFn } from '../../../services/application';
const mockUseSelector = mockUseSelectorFn as unknown as jest.Mock;
const mockGetPowerBIEmbedToken = mockGetPowerBIEmbedTokenFn as jest.Mock;

const defaultFilters: any = [{ tableName: 'Table', columnName: 'Column', dateFormat: 'MM-YYYY', slicerName: 'Slicer' }];
const defaultToolId = 1;

beforeEach(() => {
  jest.clearAllMocks();
});

describe('PowerBIReport', () => {
  it('shows loader when loading', async () => {
    mockUseSelector.mockImplementation((fn: any) => fn({ setSelectedCalendar: { data: null }, primaryRole: { data: { roleType: 'ADMIN' } }, rolePermissions: { isAdmin: true } }));
    mockGetPowerBIEmbedToken.mockResolvedValueOnce(null);
    render(<PowerBIReport toolId={defaultToolId} filters={defaultFilters} />);
    expect(screen.getByTestId('loader')).toBeInTheDocument();
  });

  it('shows access denied state when not authorized', async () => {
    mockUseSelector.mockImplementation((fn: any) => fn({ setSelectedCalendar: { data: null }, primaryRole: { data: { roleType: 'ADMIN' } }, rolePermissions: { isAdmin: true } }));
    mockGetPowerBIEmbedToken.mockResolvedValueOnce({ token: null, hasAccess: false });
    render(<PowerBIReport toolId={defaultToolId} filters={defaultFilters} />);
    await waitFor(() => expect(screen.getByTestId('access-denied')).toBeInTheDocument());
  });
});
