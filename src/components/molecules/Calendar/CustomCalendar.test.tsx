import { mount } from 'enzyme';
import CustomCalendar from './CustomCalendar';
import { Calendar, IconButton as KonnectButton } from 'konnect-react-components';
import { act } from 'react-dom/test-utils';

describe('CustomCalendar', () => {
  it('renders without crashing', () => {
    const onDateSelect = jest.fn();
    const wrapper = mount(<CustomCalendar onDateSelect={onDateSelect} />);
    expect(wrapper.exists()).toBe(true);
    expect(wrapper.find('.right-top-calendar').length).toBe(1);
    expect(wrapper.find('.button-calendar').length).toBe(1);
    expect(wrapper.find('Calendar').length).toBe(1);
  });

  it('opens calendar when button is clicked', () => {
    const onDateSelect = jest.fn();
    const wrapper = mount(<CustomCalendar onDateSelect={onDateSelect} />);
    act(() => {
      const button = wrapper.find(KonnectButton).at(0);
      const btnProps = button.props() as { onClick?: (e?: any) => void };
      if (btnProps.onClick) btnProps.onClick({});
    });
    wrapper.update();
    // Calendar should now be open (showPicker true)
    const calendar = wrapper.find(Calendar).at(0);
    const calProps = calendar.props() as any;
    expect(calProps.showPicker).toBe(true);
    // Also check rendered DOM for calendar open state
    expect(wrapper.find('.content-calendar-body').length).toBe(1);
  });

  it('calls onDateSelect when a weekday is selected', () => {
    const onDateSelect = jest.fn();
    const wrapper = mount(<CustomCalendar onDateSelect={onDateSelect} />);
    // Open calendar
    const button = wrapper.find(KonnectButton).at(0);
    const btnProps = button.props() as { onClick?: (e?: any) => void };
    if (btnProps.onClick) btnProps.onClick({});
    wrapper.update();
    // Simulate selecting a weekday (e.g., 2025-07-30 is Wednesday)
    const calendar = wrapper.find(Calendar).at(0);
    const calProps = calendar.props() as { onDateSelect?: (date: string) => void, showPicker?: boolean };
    if (calProps.onDateSelect) calProps.onDateSelect('2025-07-30');
    expect(onDateSelect).toHaveBeenCalledWith('2025-07-30');
    // Calendar should close
    expect(calProps.showPicker).toBe(false);
  });

  it('does not close calendar when a weekend is selected', () => {
    const onDateSelect = jest.fn();
    const wrapper = mount(<CustomCalendar onDateSelect={onDateSelect} />);
    act(() => {
      const button = wrapper.find(KonnectButton).at(0);
      const btnProps = button.props() as { onClick?: (e?: any) => void };
      if (btnProps.onClick) btnProps.onClick({});
    });
    wrapper.update();
    // Simulate selecting a weekend (e.g., 2025-08-02 is Saturday)
    act(() => {
      const calendar = wrapper.find(Calendar).at(0);
      const calProps = calendar.props() as { onDateSelect?: (date: string) => void, showPicker?: boolean };
      if (calProps.onDateSelect) calProps.onDateSelect('2025-08-02');
    });
    wrapper.update();
    expect(onDateSelect).not.toHaveBeenCalled();
    // Calendar should remain open
    const calendar = wrapper.find(Calendar).at(0);
    const calProps = calendar.props() as { showPicker?: boolean };
    expect(calProps.showPicker).toBe(true);
    expect(wrapper.find('.content-calendar-body').length).toBe(1);
  });
});
