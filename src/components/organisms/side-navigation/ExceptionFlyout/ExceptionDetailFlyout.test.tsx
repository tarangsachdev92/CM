import '@testing-library/jest-dom';
import { render, screen, fireEvent } from '@testing-library/react';
import ExceptionDetailFlyout from './ExceptionDetailFlyout';

// Mock Flyout from konnect-react-components
jest.mock('konnect-react-components', () => ({
  Flyout: ({ heading, cancelIconClick, onBackDropClick, content }: any) => (
    <div data-testid="flyout">
      <div data-testid="heading">{heading}</div>
      <button data-testid="cancel" onClick={cancelIconClick}>Cancel</button>
      <button data-testid="backdrop" onClick={onBackDropClick}>Backdrop</button>
      {content}
    </div>
  ),
}));

const mockException = {
   id: 1,
  title: 'Test Exception',
  priority: 'High',
  exceptionId: 1,
    riskDescription: "Brief description of issue and potential impact will come here. This will be truncated after 2 lines as shown here so that has to be truncated in after two lines",
  actionStatus: [],
  decisionStatus: 'Open',
  probability: 0,
  category: '',
};

describe('ExceptionDetailFlyout', () => {
  it('renders the flyout when given an exception', () => {
    render(<ExceptionDetailFlyout exception={mockException} onClose={jest.fn()} />);
    expect(screen.getByTestId('flyout')).toBeInTheDocument();
  });

  it('displays the exception title as heading', () => {
    render(<ExceptionDetailFlyout exception={mockException} onClose={jest.fn()} />);
    expect(screen.getByTestId('heading')).toHaveTextContent('Test Exception');
  });
  
  it('calls onClose when cancel icon is clicked', () => {
    const onClose = jest.fn();
    render(<ExceptionDetailFlyout exception={mockException} onClose={onClose} />);
    fireEvent.click(screen.getByTestId('cancel'));
    expect(onClose).toHaveBeenCalled();
  });

  it('calls onClose when backdrop is clicked', () => {
    const onClose = jest.fn();
    render(<ExceptionDetailFlyout exception={mockException} onClose={onClose} />);
    fireEvent.click(screen.getByTestId('backdrop'));
    expect(onClose).toHaveBeenCalled();
  });
});
