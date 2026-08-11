import { render } from '@testing-library/react';
import '@testing-library/jest-dom';
import ProtectedRoute from './ProtectedRoute';

jest.mock('react-redux', () => ({
  useSelector: jest.fn()
}));
jest.mock('react-router-dom', () => ({
  Navigate: jest.fn(({ to }) => <div data-testid="navigate">Navigate to {to}</div>)
}));

import { useSelector } from 'react-redux';

const DummyComponent = () => <div data-testid="dummy">Protected Content</div>;

describe('ProtectedRoute', () => {
  afterEach(() => {
    jest.clearAllMocks();
  });

  it('renders children when isAdmin is true', () => {
    (useSelector as unknown as jest.Mock).mockImplementation(() => true);
    const { getByTestId } = render(
      <ProtectedRoute>
        <DummyComponent />
      </ProtectedRoute>
    );
    expect(getByTestId('dummy')).toBeInTheDocument();
  });

  it('redirects to /home when isAdmin is false', () => {
    (useSelector as unknown as jest.Mock).mockImplementation(() => false);
    const { getByTestId } = render(
      <ProtectedRoute>
        <DummyComponent />
      </ProtectedRoute>
    );
    expect(getByTestId('navigate')).toHaveTextContent('Navigate to /home');
  });
});
