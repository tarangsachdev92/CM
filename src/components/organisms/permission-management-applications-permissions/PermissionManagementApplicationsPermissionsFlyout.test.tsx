import { render, screen, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom';
import PermissionManagementApplicationsPermissionsFlyout from './PermissionManagementApplicationsPermissionsFlyout';

// Mock dependencies if needed
jest.mock('react-redux', () => ({
  useDispatch: () => jest.fn(),
  useSelector: jest.fn(fn => fn({
    rolePermissions: {
      applicationsData: {
        existingToolPermissions: [],
        otherToolPermissions: [],
        pagination: { totalRows: 0 },
      },
      isLoading: false,
    },
  })),
}));
jest.mock('konnect-react-components', () => ({
  Flyout: ({ content, cancelIconClick, heading, subHeading, customActions }: any) => (
    <div data-testid="permissions-flyout">
      <div data-testid="flyout-heading">{heading}</div>
      <button data-testid="cancel-icon" onClick={cancelIconClick}>Cancel</button>
      {subHeading}
      {content}
      {customActions}
    </div>
  ),
  Button: ({ text, onClick }: any) => <button onClick={onClick}>{text}</button>,
  Dialog: () => <div data-testid="dialog" />,
  Toast: () => <div data-testid="toast" />,
  Table: () => <div data-testid="table" />,
  TagSelector: () => <div data-testid="tag-selector" />,
  Counter: () => <div data-testid="counter" />,
  FilterChip: () => <div data-testid="filter-chip" />,
  CheckBox: () => <input type="checkbox" data-testid="checkbox" />,
  IconButton: ({ icon, onClick }: any) => <button data-testid={`icon-button-${icon}`} onClick={onClick}>{icon}</button>,
  Icon: () => <span data-testid="icon" />,
}));
jest.mock('antd', () => ({ Flex: ({ children }: any) => <div>{children}</div>, Skeleton: () => <div data-testid="skeleton" />, Tooltip: ({ children }: any) => <span>{children}</span> }));
jest.mock('../../atoms', () => ({ EllipsisWithTooltip: ({ text }: any) => <span>{text}</span>, Label: ({ children }: any) => <span>{children}</span> }));
jest.mock('lodash', () => ({ isEqual: jest.fn(() => true), cloneDeep: jest.fn(obj => obj) }));

const mockRoleDetails = { role: 'Admin', roleId: 1, roleRegion: 'US', hasIncremented: false, permissionCount: 0 };
const mockOnCancelIconClickOfFlyout = jest.fn();

describe('PermissionManagementApplicationsPermissionsFlyout', () => {
  it('renders flyout with heading and cancel icon', () => {
    render(
      <PermissionManagementApplicationsPermissionsFlyout
        toggleFlyout={true}
        roleDetails={mockRoleDetails}
        onCancelIconClickOfFlyout={mockOnCancelIconClickOfFlyout}
      />
    );
    expect(screen.getByTestId('permissions-flyout')).toBeInTheDocument();
    expect(screen.getByTestId('flyout-heading')).toHaveTextContent('Admin US');
    expect(screen.getByTestId('cancel-icon')).toBeInTheDocument();
  });

  it('calls onCancelIconClickOfFlyout when cancel icon is clicked', () => {
    render(
      <PermissionManagementApplicationsPermissionsFlyout
        toggleFlyout={true}
        roleDetails={mockRoleDetails}
        onCancelIconClickOfFlyout={mockOnCancelIconClickOfFlyout}
      />
    );
    fireEvent.click(screen.getByTestId('cancel-icon'));
    expect(mockOnCancelIconClickOfFlyout).toHaveBeenCalled();
  });

  it('renders table and custom actions', () => {
    render(
      <PermissionManagementApplicationsPermissionsFlyout
        toggleFlyout={true}
        roleDetails={mockRoleDetails}
        onCancelIconClickOfFlyout={mockOnCancelIconClickOfFlyout}
      />
    );
    expect(screen.getByTestId('table')).toBeInTheDocument();
    // Custom actions: Add Tool, Edit
    expect(screen.getByText('Add Tool')).toBeInTheDocument();
    expect(screen.getByText('Edit')).toBeInTheDocument();
  });
});
