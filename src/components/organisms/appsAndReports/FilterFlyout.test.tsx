import { render, screen, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom';

import FilterFlyout from './FilterFlyout';
import type { AppDispatch } from '../../../store';

const mockDispatch = jest.fn(() => Promise.resolve({ unwrap: () => Promise.resolve() })) as unknown as AppDispatch;

const defaultProps = {
  isOpen: true,
  onClose: jest.fn(),
  setIsOpen: jest.fn(),
  regionDD: [
    { label: 'Region1', value: 1 },
    { label: 'Region2', value: 2 },
  ],
  functionDD: [
    { label: 'Function1', value: 1 },
    { label: 'Function2', value: 2 },
  ],
  subfunctionDD: [
    { label: 'Sub1', value: 1 },
    { label: 'Sub2', value: 2 },
  ],
  reportTypeDD: [
    { label: 'App', value: 1 },
    { label: 'Report', value: 2 },
  ],
  selectedRegion: [],
  setSelectedRegion: jest.fn(),
  selectedFunction: [],
  setSelectedFunction: jest.fn(),
  selectedSubfunction: [],
  setSelectedSubfunction: jest.fn(),
  selectedReportType: [],
  setSelectedReportType: jest.fn(),
  setSubfunctionDD: jest.fn(),
  setSelectedCategory: jest.fn(),
  previousFilterSelection: {
    region: [],
    function: [],
    subFunction: [],
    reportType: [],
  },
  setPreviousFilterSelection: jest.fn(),
  searchTerm: '',
  currentPage: 1,
  pageSize: 10,
  isFavoriteClicked: false,
  setIsFavoriteClicked: jest.fn(),
  selectedCategory: 'App',
  dispatch: mockDispatch,
  setFilterRenderKey: jest.fn(),
  setAppliedFilters: jest.fn(),
  syncSelectedToAppliedFilters: jest.fn(),
};

describe('FilterFlyout', () => {
  it('renders all dropdowns', () => {
    render(<FilterFlyout {...defaultProps} />);
    expect(screen.getAllByText('Region')[0]).toBeInTheDocument();
    expect(screen.getAllByText('Function')[0]).toBeInTheDocument();
    expect(screen.getAllByText('Sub-Function')[0]).toBeInTheDocument();
    expect(screen.getAllByText('Report Type')[0]).toBeInTheDocument();
  });

  it('calls onClose when cancel icon is clicked', () => {
    const { container } = render(<FilterFlyout {...defaultProps} />);
    // Find the first icon-only button (the close button)
    const closeBtn = container.querySelector('button.icon-only');
    expect(closeBtn).toBeInTheDocument();
    if (closeBtn) fireEvent.click(closeBtn);
    expect(defaultProps.setIsOpen).toHaveBeenCalledWith(false);
  });

  it('calls setAppliedFilters and closes on Apply Filter', () => {
    // Provide a selectedRegion so Apply Filter is enabled
    const props = {
      ...defaultProps,
      selectedRegion: [{ label: 'Region1', value: 1 }],
    };
    render(<FilterFlyout {...props} />);
    const applyBtn = screen.getByRole('button', { name: /Apply Filter/i });
    expect(applyBtn).not.toBeDisabled();
    fireEvent.click(applyBtn);
    expect(props.setAppliedFilters).toHaveBeenCalled();
    expect(props.setIsOpen).toHaveBeenCalledWith(false);
  });

  it('calls setIsFavoriteClicked and resets filters on Reset', () => {
    render(<FilterFlyout {...defaultProps} />);
    const resetBtn = screen.getByRole('button', { name: /Reset/i });
    fireEvent.click(resetBtn);
    expect(defaultProps.setIsFavoriteClicked).toHaveBeenCalledWith(false);
    expect(defaultProps.setSelectedRegion).toHaveBeenCalledWith([]);
    expect(defaultProps.setSelectedFunction).toHaveBeenCalledWith([]);
    expect(defaultProps.setSelectedSubfunction).toHaveBeenCalledWith([]);
    expect(defaultProps.setSelectedReportType).toHaveBeenCalledWith([]);
  });

  it('disables Apply Filter button when all filters are empty', () => {
    render(<FilterFlyout {...defaultProps} />);
    const applyBtn = screen.getByRole('button', { name: /Apply Filter/i });
    expect(applyBtn).toBeDisabled();
  });
});
