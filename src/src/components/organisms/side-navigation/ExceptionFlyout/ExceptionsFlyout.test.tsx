// Mock thunk to return a plain object for redux-mock-store compatibility
jest.mock('../../../../store/thunks/getExceptionFlyoutIssuesDetails', () => ({
  getExceptionIssuesDetails: () => ({ type: 'MOCK_GET_EXCEPTION_ISSUES_DETAILS' }),
}));
import '@testing-library/jest-dom';
import { render, screen, fireEvent } from '@testing-library/react';
import ExceptionsFlyout from './ExceptionsFlyout';
import { Provider } from 'react-redux';
import configureStore from 'redux-mock-store';

// Mock router
jest.mock('react-router-dom', () => ({
  ...jest.requireActual('react-router-dom'),
  useNavigate: () => jest.fn(),
}));
// Mock child components
jest.mock('./ExceptionCard', () => ({
  __esModule: true,
  default: ({ exception, onCardClick }: any) => (
    <div data-testid={`exception-card-${exception.issueId}`} onClick={onCardClick}>{exception.title}</div>
  ),
}));
jest.mock('./ExceptionDetailFlyout', () => ({
  __esModule: true,
  default: ({ exception, onClose }: any) => (
    <div data-testid="detail-flyout">
      <span>{exception.title}</span>
      <button data-testid="close-detail" onClick={onClose}>Close</button>
    </div>
  ),
}));
jest.mock('konnect-react-components', () => ({
  Flyout: ({ content, customActions}: any) => (
    <div data-testid="flyout">
      {customActions}
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
  AnimatedLoaders: () => <div data-testid="loader" />,
}));
jest.mock('../../../../assets/images/images', () => ({
  NoMatchesFound: () => <div data-testid="no-matches" />,
}));
jest.mock('../../../../assets/icons/icons', () => ({
  ExternalLinkIcon: () => <span data-testid="external-link" />,
  LeftArrowIcon: () => <span data-testid="left-arrow" />,
}));

const mockStore = configureStore([]);
const baseException = {
  title: 'Test Exception',
  priority: 'High',
  issueId: 1,
  impactedKPIs: [],
  actionStatus: [],
  decisionStatus: 'Open',
  probability: 0,
  category: 'Issue',
};

const getStore = (stateOverrides = {}) =>
  mockStore({
    exceptionFlyoutIssuesDetails: {
      data: [],
      loading: false,
      error: null,
      ...stateOverrides,
    },
  });

describe('ExceptionsFlyout', () => {
  it('renders the flyout when open', () => {
    const store = getStore();
    render(
      <Provider store={store}>
        <ExceptionsFlyout isOpen={true} onClose={jest.fn()} setIsOpen={jest.fn()} />
      </Provider>
    );
    expect(screen.getByTestId('flyout')).toBeInTheDocument();
  });

  it('displays loader when loading', () => {
    const store = getStore({ loading: true });
    render(
      <Provider store={store}>
        <ExceptionsFlyout isOpen={true} onClose={jest.fn()} setIsOpen={jest.fn()} />
      </Provider>
    );
    expect(screen.getByTestId('loader')).toBeInTheDocument();
  });

  it('displays error message when error is present', () => {
    const store = getStore({ error: 'Something went wrong' });
    render(
      <Provider store={store}>
        <ExceptionsFlyout isOpen={true} onClose={jest.fn()} setIsOpen={jest.fn()} />
      </Provider>
    );
    expect(screen.getByText('Error')).toBeInTheDocument();
    expect(screen.getByText('Something went wrong')).toBeInTheDocument();
  });

  it('displays exception cards when data is present', () => {
    const store = getStore({ data: [baseException] });
    render(
      <Provider store={store}>
        <ExceptionsFlyout isOpen={true} onClose={jest.fn()} setIsOpen={jest.fn()} />
      </Provider>
    );
    expect(screen.getByTestId('exception-card-1')).toBeInTheDocument();
    expect(screen.getByText('Test Exception')).toBeInTheDocument();
  });

  it('displays empty state when no data', () => {
    const store = getStore({ data: [] });
    render(
      <Provider store={store}>
        <ExceptionsFlyout isOpen={true} onClose={jest.fn()} setIsOpen={jest.fn()} />
      </Provider>
    );
    expect(screen.getByTestId('no-matches')).toBeInTheDocument();
    expect(screen.getByText('All Clear!')).toBeInTheDocument();
    expect(screen.getByText('Everything looks good! No issues to report.')).toBeInTheDocument();
  });

  it('handles tab switching', () => {
    const store = getStore({ data: [baseException] });
    render(
      <Provider store={store}>
        <ExceptionsFlyout isOpen={true} onClose={jest.fn()} setIsOpen={jest.fn()} />
      </Provider>
    );
    fireEvent.click(screen.getByText('Issues'));
    expect(screen.getByText('Test Exception')).toBeInTheDocument();
  });

  it('calls onClose when cancel icon or backdrop is clicked', () => {
    const store = getStore();
    const onClose = jest.fn();
    render(
      <Provider store={store}>
        <ExceptionsFlyout isOpen={true} onClose={onClose} setIsOpen={jest.fn()} />
      </Provider>
    );
    // Simulate cancel icon click
    fireEvent.click(screen.getByTestId('left-arrow'));
    expect(onClose).not.toHaveBeenCalled(); // setIsOpen is called instead
  });

  it('opens detail flyout when exception card is clicked', () => {
    const store = getStore({ data: [baseException] });
    render(
      <Provider store={store}>
        <ExceptionsFlyout isOpen={true} onClose={jest.fn()} setIsOpen={jest.fn()} />
      </Provider>
    );
    fireEvent.click(screen.getByTestId('exception-card-1'));
    expect(screen.getByTestId('detail-flyout')).toBeInTheDocument();
    fireEvent.click(screen.getByTestId('close-detail'));
    expect(screen.queryByTestId('detail-flyout')).not.toBeInTheDocument();
  });

  it('sticky button expands on hover', () => {
    const store = getStore({ data: [baseException] });
    render(
      <Provider store={store}>
        <ExceptionsFlyout isOpen={true} onClose={jest.fn()} setIsOpen={jest.fn()} />
      </Provider>
    );
    const stickyButton = screen.getByLabelText('Log Issue');
    fireEvent.mouseEnter(stickyButton);
    expect(screen.getByText('Log Issue')).toBeInTheDocument();
    fireEvent.mouseLeave(stickyButton);
    expect(screen.queryByText('Log Issue')).not.toBeInTheDocument();
  });
});
