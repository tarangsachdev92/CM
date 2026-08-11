import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import NotificationsBellIconFlyout from './NotificationsBellIconFlyout';
import '@testing-library/jest-dom';

const mockOnClickHandler = jest.fn();

jest.mock('react-redux', () => ({
  useDispatch: () => jest.fn(),
  useSelector: jest.fn(fn => fn({
    notificationsAndAlerts: {
      userNotifications: {
        notifications: [],
        notificationUnreadCount: 0,
        warnings: [],
        alerts: [],
      },
      isLoading: false,
    },
  })),
}));
jest.mock('react-router-dom', () => ({ useNavigate: () => jest.fn() }));
jest.mock('../../../store', () => ({ fetchUserNotifications: jest.fn() }));
jest.mock('../../../utils/customHooks', () => ({ useIsGuestUser: () => false }));
jest.mock('konnect-react-components', () => ({
  Flyout: ({ content, cancelIconClick }: any) => (
    <div data-testid="flyout">
      <button data-testid="cancel-icon" onClick={cancelIconClick}>Cancel</button>
      {content}
    </div>
  ),
  Tab: ({ items, onClick }: any) => (
    <div data-testid="tab">
      {items.map((item: any) => (
        <button key={item.label} onClick={() => onClick(item)}>{item.label}</button>
      ))}
    </div>
  ),
  Toast: ({ toggle, message, onCloseToast }: any) => (
    toggle ? <div data-testid="toast">{message}<button onClick={onCloseToast}>Close</button></div> : null
  ),
  Icon: () => <span data-testid="icon" />,
  InputField: () => <input data-testid="input-field" />,
  Skeleton: () => <div data-testid="skeleton" />,
}));
jest.mock('../../../assets/images/images', () => ({
  NotificationsEmptyStateImage: () => <div data-testid="notifications-empty-image" />,
  WarningsEmptyStateImage: () => <div data-testid="warnings-empty-image" />,
  AlertsEmptyStateImage: () => <div data-testid="alerts-empty-image" />,
}));
jest.mock('./ApplicationNotificationCardBody', () => () => <div data-testid="application-notification-card-body" />);
jest.mock('./ReportNotificationCardBody', () => () => <div data-testid="report-notification-card-body" />);

// Basic smoke test and empty state rendering

describe('NotificationsBellIconFlyout', () => {
  it('renders flyout and empty notifications state', () => {
    render(
      <NotificationsBellIconFlyout
        isFlyoutOpen={true}
        onClickHandlerForFlyoutCancelIcon={mockOnClickHandler}
      />
    );
    expect(screen.getByTestId('flyout')).toBeInTheDocument();
    expect(screen.getByText('No new Notifications')).toBeInTheDocument();
    expect(screen.getByText('You don’t have any notifications at the moment.')).toBeInTheDocument();
    expect(screen.getByTestId('notifications-empty-image')).toBeInTheDocument();
  });

  it('calls cancel icon handler when cancel button is clicked', () => {
    render(
      <NotificationsBellIconFlyout
        isFlyoutOpen={true}
        onClickHandlerForFlyoutCancelIcon={mockOnClickHandler}
      />
    );
    fireEvent.click(screen.getByTestId('cancel-icon'));
    expect(mockOnClickHandler).toHaveBeenCalled();
  });

  it('renders tab and switches tab on click', () => {
    render(
      <NotificationsBellIconFlyout
        isFlyoutOpen={true}
        onClickHandlerForFlyoutCancelIcon={mockOnClickHandler}
      />
    );
    expect(screen.getByTestId('tab')).toBeInTheDocument();
    fireEvent.click(screen.getByText('Notifications'));
    expect(screen.getByText('No new Notifications')).toBeInTheDocument();
  });

  it('shows toast when showSuccessToast is set', () => {
    // Patch useState to simulate toast
    (jest.spyOn(React, 'useState').mockImplementation as any)((init: any) => [
      init === '' ? 'Success!' : init,
      jest.fn(),
    ]);
    render(
      <NotificationsBellIconFlyout
        isFlyoutOpen={true}
        onClickHandlerForFlyoutCancelIcon={mockOnClickHandler}
      />
    );
    expect(screen.getByTestId('toast')).toBeInTheDocument();
    expect(screen.getByText('Success!')).toBeInTheDocument();
    (React.useState as any).mockRestore?.();
  });
});
