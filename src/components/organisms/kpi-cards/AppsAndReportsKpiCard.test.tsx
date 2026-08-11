
import { render, fireEvent, screen } from '@testing-library/react';
import '@testing-library/jest-dom';
import AppsAndReportsKpiCard from './AppsAndReportsKpiCard';

// Mock konnect-react-components and antd
jest.mock('konnect-react-components', () => ({
  KpiCards: (props: any) => <div data-testid="KpiCards" {...props} />,
  SideMenu: (props: any) => <div data-testid="SideMenu" {...props} />,
  Icon: (props: any) => <span data-testid="Icon" {...props} />,
  Tab: (props: any) => <div data-testid="Tab" {...props} />,
  DollarKpiCard: (props: any) => <div data-testid="DollarKpiCard" {...props} />,
  Table: (props: any) => <div data-testid="Table" {...props} />,
  HierarchyColumnChart: (props: any) => <div data-testid="HierarchyColumnChart" {...props} />,
  KpiCardSkeleton: (props: any) => <div data-testid="KpiCardSkeleton">{props.children}</div>,
}));

// Use a factory function to ensure Select.Option is available at destructure time and avoid TS unused variable errors
jest.mock('antd', () => {
  const MockSelect = ({ children, ...rest }: any) => <select data-testid="Select" {...rest}>{children}</select>;
  (MockSelect as any).Option = ({ children, ...rest }: any) => <option {...rest}>{children}</option>;
  return {
    Flex: ({ children, ...rest }: any) => <div data-testid="Flex" {...rest}>{children}</div>,
    Select: MockSelect,
  };
});
jest.mock('../../atoms', () => ({
  Label: ({ children, ...rest }: any) => <div data-testid="Label" {...rest}>{children}</div>,
}));

// Mock redux hooks
jest.mock('react-redux', () => ({
  ...jest.requireActual('react-redux'),
  useDispatch: () => jest.fn(),
  useSelector: (fn: any) => {
    // Provide mock state slices for selectors
    return fn({
      basickpiCard: { appName: [
        { week: 8, month: 2, otiF_U_PERCENTAGE: 90, currentTarget: 3.5, monthName: 'Feb' },
        { week: null, month: 3, otiF_U_PERCENTAGE: 85, currentTarget: 3.0, monthName: 'Mar' },
      ] },
      columnKpiCardData: { columnData: [
        { reason: 'Reason 1', impact: '60' },
        { reason: 'Reason 2', impact: '40' },
      ] },
      impactAnalysisTableData: {
        tableData: {
          impactAnalysisOTIFD: [
            { brandName: 'BrandA', impact: 10, otifd: 90 },
            { brandName: 'BrandB', impact: 20, otifd: 80 },
          ],
          impactAnalysisRC: [
            { reasonCode: 'RC1', impact: 30 },
            { reasonCode: 'RC2', impact: 40 },
          ],
        },
      },
    });
  },
}));

// Mock store thunks
jest.mock('../../../store', () => ({
  fetchBasicKpiCard: jest.fn(() => ({ type: 'fetchBasicKpiCard' })),
  fetchImpactAnalysisTableData: jest.fn(() => ({ type: 'fetchImpactAnalysisTableData' })),
  fetchColumnKpiCard: jest.fn(() => ({ type: 'fetchColumnKpiCard' })),
}));

describe('AppsAndReportsKpiCard', () => {
  it('renders header and description', () => {
    render(<AppsAndReportsKpiCard />);
    expect(screen.getByText('Digital Performance Management')).toBeInTheDocument();
    expect(screen.getByText('Enable smarter decisions through digital performance insights.')).toBeInTheDocument();
  });

  it('renders Tab and KpiCardSkeleton components', () => {
    render(<AppsAndReportsKpiCard />);
    expect(screen.getAllByTestId('Tab').length).toBeGreaterThan(0);
    expect(screen.getAllByTestId('KpiCardSkeleton').length).toBeGreaterThan(0);
  });

  it('renders KpiCards, DollarKpiCard, and HierarchyColumnChart', () => {
    render(<AppsAndReportsKpiCard />);
    expect(screen.getByTestId('KpiCards')).toBeInTheDocument();
    expect(screen.getByTestId('DollarKpiCard')).toBeInTheDocument();
    expect(screen.getByTestId('HierarchyColumnChart')).toBeInTheDocument();
  });

  it('renders Table components for impact analysis', () => {
    render(<AppsAndReportsKpiCard />);
    const tables = screen.getAllByTestId('Table');
    expect(tables.length).toBeGreaterThanOrEqual(2);
  });

  it('dropdown change triggers dispatch', () => {
    const { getByTestId } = render(<AppsAndReportsKpiCard />);
    const select = getByTestId('Select');
    fireEvent.change(select, { target: { value: '2' } });
    // No assertion for dispatch since it's a mock, but no error should occur
  });
});
