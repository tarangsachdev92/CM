import React from 'react';
import { Provider } from 'react-redux';
import configureStore from 'redux-mock-store';
import { mount } from 'enzyme';
import DeleteFilterGroup from './DeleteFilterGroup';
import { Toast, Dialog } from 'konnect-react-components';

const mockStore = configureStore([]);
const store = mockStore({});

const defaultProps = {
  isOpen: true,
  onClose: jest.fn(),
  filterName: 'Test Filter',
  filterId: 1,
};

describe('<DeleteFilterGroup />', () => {
  let wrapper: ReturnType<typeof mount>;

  beforeEach(() => {
    wrapper = mount(
      <Provider store={store}>
        <DeleteFilterGroup {...defaultProps} />
      </Provider>
    );
  });

  it('renders Dialog with correct props', () => {
    const dialog = wrapper.find(Dialog);
    expect(dialog.exists()).toBe(true);
    expect(dialog.props().isOpen).toBe(true);
    expect(dialog.props().content).toContain(defaultProps.filterName);
    expect(dialog.props().primaryButtonText).toBe('Delete');
    expect(dialog.props().secondaryButtonText).toBe("Don't Delete");
  });

  it('calls onClose when secondary button is clicked', () => {
    const dialog = wrapper.find(Dialog);
    dialog.props().onSecondaryButtonClick();
    expect(defaultProps.onClose).toHaveBeenCalled();
  });

  it('shows Toast when toastConfig.visible is true', () => {
    // Re-mount with toastConfig.visible true using a custom wrapper
    const TestComponent = (props: typeof defaultProps) => {
      const [toastConfig, setToastConfig] = React.useState({
        visible: true,
        message: 'Deleted',
        type: 'Delete' as const,
      });
      return (
        <Provider store={store}>
          <DeleteFilterGroup {...props} />
          {toastConfig.visible && (
            <Toast
              distance="x5l"
              message={toastConfig.message}
              mode="Top Right"
              onCloseToast={() => setToastConfig({ ...toastConfig, visible: false })}
              toggle
              type={toastConfig.type}
              timer={3000}
              className=""
            />
          )}
        </Provider>
      );
    };
    const toastWrapper = mount(<TestComponent {...defaultProps} />);
    const toast = toastWrapper.find(Toast);
    expect(toast.exists()).toBe(true);
    expect(toast.props().message).toBe('Deleted');
    expect(toast.props().type).toBe('Delete');
  });

  it('does not render Toast when toastConfig.visible is false', () => {
    const toast = wrapper.find(Toast);
    expect(toast.exists()).toBe(false);
  });
});
