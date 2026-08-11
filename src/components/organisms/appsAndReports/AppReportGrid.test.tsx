import { render, screen, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom';
import AppReportGrid from './AppReportGrid';

const defaultProps = {
  selectedCategory: 'App',
  setSelectedCategory: jest.fn(),
  handleCategoryChange: jest.fn(),
  handleSearchChange: jest.fn(),
  isFavoriteClicked: false,
  handleFavoriteButtonToggle: jest.fn(),
  setIsFilterFlyoutOpen: jest.fn(),
  setIsResetButtonClicked: jest.fn(),
  setPreviousFilterSelection: jest.fn(),
  selectedRegion: [],
  selectedFunction: [],
  selectedSubfunction: [],
  selectedReportType: [],
  loading: false,
  totalItems: 0,
  paginatedData: [],
  handleFavoriteToggle: jest.fn(),
  currentPage: 1,
  handlePageChange: jest.fn(),
  handlePageSizeChange: jest.fn(),
  pageSize: 5,
  noFavoritesFound: () => <div data-testid="no-favorites">No Favorites</div>,
  noRecordsFound: () => <div data-testid="no-records">No Records</div>,
  filters: [],
  setNewFilters: jest.fn(),
  onReset: jest.fn(),
  filterRenderKey: 1,
  regionDD: [],
  functionDD: [],
  subfunctionDD: [],
  reportTypeDD: [],
  openApplicationOrReport: jest.fn(),
  totalFavouriteCount: 0,
};

describe('AppReportGrid', () => {
  it('renders search input and favorites button', () => {
    render(<AppReportGrid {...defaultProps} />);
    expect(screen.getByPlaceholderText('Search')).toBeInTheDocument();
    expect(screen.getByText('Favorites')).toBeInTheDocument();
  });

  it('shows no records when totalItems is 0 and not favorite clicked', () => {
    render(<AppReportGrid {...defaultProps} isFavoriteClicked={false} />);
    expect(screen.getByTestId('no-records')).toBeInTheDocument();
  });

  it('shows no favorites when totalItems is 0 and favorite clicked', () => {
    render(<AppReportGrid {...defaultProps} isFavoriteClicked={true} />);
    expect(screen.getByTestId('no-favorites')).toBeInTheDocument();
  });

  it('renders cards when paginatedData is present', () => {
    const paginatedData = [
      {
        objectId: '1',
        objectName: 'Test App',
        objectType: 'App',
        description: 'Test Description',
        isFavourite: false,
        objectOwner: 'Owner',
        documentationLink: 'http://example.com',
      },
    ];
    render(
      <AppReportGrid
        {...defaultProps}
        totalItems={1}
        paginatedData={paginatedData}
      />
    );
    expect(screen.getByText('Test App')).toBeInTheDocument();
    expect(screen.getByText('Owner: Owner')).toBeInTheDocument();
    expect(screen.getByText('Documentation & Access')).toBeInTheDocument();
  });

  it('calls handleFavoriteButtonToggle when favorites button is clicked', () => {
    render(<AppReportGrid {...defaultProps} />);
    fireEvent.click(screen.getByText('Favorites'));
    expect(defaultProps.handleFavoriteButtonToggle).toHaveBeenCalled();
  });


  it('calls openApplicationOrReport when description is clicked', () => {
    const paginatedData = [
      {
        objectId: '1',
        objectName: 'Test App',
        objectType: 'App',
        description: 'Test Description',
        isFavourite: false,
        objectOwner: 'Owner',
        documentationLink: 'http://example.com',
      },
    ];
    const openApplicationOrReport = jest.fn();
    render(
      <AppReportGrid
        {...defaultProps}
        totalItems={1}
        paginatedData={paginatedData}
        openApplicationOrReport={openApplicationOrReport}
      />
    );
    fireEvent.click(screen.getByText('Test Description'));
    expect(openApplicationOrReport).toHaveBeenCalledWith('1', 'Test App', 'App');
  });
});
