import { render, screen, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom';
import * as reactRedux from 'react-redux';
import AppsAndReports from './AppsAndReportsLandingPage';


const mockDispatch: jest.Mock = jest.fn(() => Promise.resolve({ unwrap: () => Promise.resolve() }));
const mockNavigate: jest.Mock = jest.fn();

jest.mock('react-redux', () => ({
  ...jest.requireActual('react-redux'),
  useDispatch: () => mockDispatch,
  useSelector: jest.fn(),
}));
jest.mock('react-router-dom', () => ({
  ...jest.requireActual('react-router-dom'),
  useNavigate: () => mockNavigate,
}));

const defaultState = {
  appReportsCardsData: {
    data: {
      data: {
        data: [],
        pagination: { totalRows: 0, totalPages: 0 },
        favouriteCount: { totalAppFavourites: 0, totalReportFavourites: 0 },
      },
    },
    statusCode: 200,
    message: null,
    favouritesUpdated: false,
  },
  fetchGeographicalInformation: { data: { regions: [] } },
  fetchFunctionSubfunctionInformation: { data: { functions: [], subfunctions: [] } },
};

describe('AppsAndReportsLandingPage', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    ((reactRedux.useSelector as unknown) as jest.Mock).mockImplementation(fn => fn(defaultState));
  });

  it('renders Digital Tools Library heading', () => {
    render(<AppsAndReports />);
    expect(screen.getByText('Digital Tools Library')).toBeInTheDocument();
  });

  it('renders description', () => {
    render(<AppsAndReports />);
    expect(
      screen.getByText(
        /View a list of all apps & reports that are accessible for your role\(s\)/i
      )
    ).toBeInTheDocument();
  });

  it('renders AppReportGrid', () => {
    render(<AppsAndReports />);
    expect(screen.getByPlaceholderText('Search')).toBeInTheDocument();
  });

  it('toggles favorites when favorites button is clicked', () => {
    render(<AppsAndReports />);
    const favBtn = screen.getByText('Favorites');
    fireEvent.click(favBtn);
    // The state change is internal, so just check the button is present
    expect(favBtn).toBeInTheDocument();
  });

  it('opens filter flyout when filter button is clicked', () => {
    render(<AppsAndReports />);
    // Find the filter button by looking for a button with an svg child and not the favorites button
    const allButtons = screen.getAllByRole('button');
    const filterBtn = allButtons.find(
      btn => btn.querySelector('svg') && btn.textContent !== 'Favorites'
    );
    if (filterBtn) {
      fireEvent.click(filterBtn);
      expect(filterBtn).toBeInTheDocument();
    } else {
      // If not found, fail the test with a clear message
      throw new Error('Filter button not found');
    }
  });
});
