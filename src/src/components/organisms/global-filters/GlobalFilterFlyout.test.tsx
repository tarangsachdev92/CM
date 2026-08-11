
import { render, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import type { FilterGroupRequest } from '../../../types/request';


// Mock useDispatch and ApplyFilterGroup thunk
jest.mock('react-redux', () => ({
  ...jest.requireActual('react-redux'),
  useDispatch: () => () => Promise.resolve(),
}));
jest.mock('../../../store/thunks/globalFilterApplyFilterGroup', () => ({
  ApplyFilterGroup: () => () => Promise.resolve(),
}));

import GlobalFilterFlyout from './GlobalFilterFlyout';

jest.mock('konnect-react-components', () => ({
  Flyout: ({ iconForCancel, primaryBtnProps, content }: { iconForCancel?: any; primaryBtnProps?: any; content?: any }) => (
    <div data-testid="flyout-mock">
      <button data-testid="cancel-btn" onClick={iconForCancel?.onClick}>Cancel</button>
      <button data-testid="primary-btn" onClick={primaryBtnProps?.onClick} disabled={primaryBtnProps?.disabled}>
        {primaryBtnProps?.text}
      </button>
      {content}
    </div>
  ),
  Toast: ({ toggle, message, onCloseToast }: { toggle?: any; message?: any; onCloseToast?: any }) => (
    toggle ? <div data-testid="toast-mock">{message}<button data-testid="close-toast" onClick={onCloseToast}>Close</button></div> : null
  ),
}));

jest.mock('../user-profile-settings-global-fliter-section/UserProfileSettingsGlobalFilters', () => () => <div data-testid="user-profile-settings-global-filters" />);

const defaultProps = {
  isOpen: true,
  setIsOpen: jest.fn(),
  onCancelClick: jest.fn(),
  isFilterEnabled: false,
  handleCheckboxChange: jest.fn(),
  isFilterGroupSelected: false,
  handleFilterGroupCheckboxChange: jest.fn(),
   selectedFilterGroups: {
    filterGroupJson: [],
    roleBasedJSON: [],
  } as FilterGroupRequest, 
};

describe('GlobalFilterFlyout', () => {
  it('renders Flyout and UserProfileSettingsGlobalFilters', () => {
    const { getByTestId } = render(<GlobalFilterFlyout {...defaultProps} />);
    expect(getByTestId('flyout-mock')).toBeInTheDocument();
    expect(getByTestId('user-profile-settings-global-filters')).toBeInTheDocument();
  });

  it('calls onCancelClick when cancel button is clicked', () => {
    const onCancelClick = jest.fn();
    const { getByTestId } = render(<GlobalFilterFlyout {...defaultProps} onCancelClick={onCancelClick} />);
    fireEvent.click(getByTestId('cancel-btn'));
    expect(onCancelClick).toHaveBeenCalled();
  });

  it('disables Apply Filter button if no filters are enabled/selected', () => {
    const { getByTestId } = render(<GlobalFilterFlyout {...defaultProps} />);
    expect(getByTestId('primary-btn')).toBeDisabled();
  });

  it('enables Apply Filter button if isFilterEnabled or isFilterGroupSelected is true', () => {
    const { getByTestId } = render(<GlobalFilterFlyout {...defaultProps} isFilterEnabled={true} />);
    expect(getByTestId('primary-btn')).not.toBeDisabled();
  });

  it('shows Toast after applying filter', async () => {
    jest.useFakeTimers();
    // Use a valid IFilterGroupItem shape for the test
    const selectedFilterGroups: FilterGroupRequest = {
  filterGroupJson: [{ filterId: 1, isFilterApplied: true }],
  roleBasedJSON: [], // ✅ Now correctly typed
};

    const setIsOpen = jest.fn();
    const { getByTestId, queryByTestId } = render(
      <GlobalFilterFlyout {...defaultProps} isFilterEnabled={true} selectedFilterGroups={selectedFilterGroups} setIsOpen={setIsOpen} />
    );
    fireEvent.click(getByTestId('primary-btn'));
    await waitFor(() => expect(queryByTestId('toast-mock')).toBeInTheDocument());
    // Fast-forward timers to trigger setTimeout
    jest.runAllTimers();
    fireEvent.click(getByTestId('close-toast'));
    expect(setIsOpen).toHaveBeenCalled();
    jest.useRealTimers();
  });
});
