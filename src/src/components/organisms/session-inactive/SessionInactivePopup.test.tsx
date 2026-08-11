import '@testing-library/jest-dom';
import { render, screen, act } from '@testing-library/react';
import SessionInactivePopup from './SessionInactivePopup';
import { Provider } from 'react-redux';
import configureStore from 'redux-mock-store';

// Mock MSAL
jest.mock('@azure/msal-react', () => ({
  useMsal: () => ({
    instance: {
      getAllAccounts: jest.fn(() => [{ username: 'test' }]),
      acquireTokenSilent: jest.fn(() => Promise.resolve()),
      loginRedirect: jest.fn(),
    },
  }),
}));

// Mock Redux store
const mockStore = configureStore([]);
const store = mockStore({});

// Mock window.location.reload
Object.defineProperty(window, 'location', {
  value: { reload: jest.fn() },
  writable: true,
});

describe('SessionInactivePopup', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    jest.useFakeTimers();
  });
  afterEach(() => {
    jest.runOnlyPendingTimers();
    jest.useRealTimers();
  });

  it('renders without crashing and dialog is initially closed', () => {
    render(
      <Provider store={store}>
        <SessionInactivePopup />
      </Provider>
    );
    expect(screen.queryByText('Session Inactive')).not.toBeInTheDocument();
  });

  it('shows the inactive session dialog when idle is triggered', () => {
    render(
      <Provider store={store}>
        <SessionInactivePopup />
      </Provider>
    );
    act(() => {
      // Simulate idle
      jest.advanceTimersByTime(50 * 60 * 1000);
    });
    expect(screen.getByText('Session Inactive')).toBeInTheDocument();
    expect(screen.getByText('Continue')).toBeInTheDocument();
  });

  it('shows the logged out dialog when countdown reaches zero', () => {
    render(
      <Provider store={store}>
        <SessionInactivePopup />
      </Provider>
    );
    act(() => {
      // Simulate idle
      jest.advanceTimersByTime(50 * 60 * 1000);
    });
    act(() => {
      // Simulate countdown to zero
      jest.advanceTimersByTime(10 * 60 * 1000);
    });
    expect(screen.getByText("You've Been Logged Out")).toBeInTheDocument();
    expect(screen.getByText('Login')).toBeInTheDocument();
    expect(screen.getByText(/Your session has expired/i)).toBeInTheDocument();
  });

  it('displays correct remaining time and warning color', () => {
    render(
      <Provider store={store}>
        <SessionInactivePopup />
      </Provider>
    );
    act(() => {
      jest.advanceTimersByTime(50 * 60 * 1000);
    });
    expect(screen.getByText(/Remaining time:/i)).toBeInTheDocument();
    // Should show warning color when countdown <= 120
    act(() => {
      jest.advanceTimersByTime((10 * 60 - 120) * 1000);
    });
    const timeSpan = screen.getByText(/02:00/);
    expect(timeSpan).toHaveStyle('color: #F42F2F');
  });
});
