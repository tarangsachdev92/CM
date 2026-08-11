import { shallow } from 'enzyme';
import CustomTextEditor from './TextEditor';

describe('CustomTextEditor', () => {
  const mockOnChange = jest.fn();
  const defaultValue = 'Initial value';

  it('renders the TextEditor component', () => {
    const wrapper = shallow(
      <CustomTextEditor value={defaultValue} onChange={mockOnChange} />
    );
    expect(wrapper.find('TextEditor').exists()).toBe(true);
  });

  it('passes the correct props to TextEditor', () => {
    const wrapper = shallow(
      <CustomTextEditor value={defaultValue} onChange={mockOnChange} />
    );
    const textEditor = wrapper.find('TextEditor');
    expect(textEditor.prop('editorId')).toBe('TextEditor');
    expect(textEditor.prop('defaultValue')).toBe(defaultValue);
    expect(textEditor.prop('placeholder')).toBe('Start typing...');
  });

  it('calls onChange when editor value changes', () => {
    const wrapper = shallow(
      <CustomTextEditor value={defaultValue} onChange={mockOnChange} />
    );
    const newValue = 'Updated value';
    const textEditor = wrapper.find('TextEditor');
    const onChange = textEditor.prop('onChange');
    if (onChange) {
      // Pass a mock FormEvent with required properties
      const mockFormEvent = {
        target: { value: newValue },
        nativeEvent: {},
        currentTarget: { value: newValue },
        bubbles: true,
        cancelable: true,
        defaultPrevented: false,
        eventPhase: 2,
        isTrusted: true,
        preventDefault: jest.fn(),
        stopPropagation: jest.fn(),
        type: 'change',
        timeStamp: Date.now(),
      } as unknown as React.FormEvent;
      onChange(mockFormEvent);
      expect(mockOnChange).toHaveBeenCalled();
    }
  });
});
