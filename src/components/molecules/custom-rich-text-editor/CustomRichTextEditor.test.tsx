import { mount } from 'enzyme';
import CustomRichTextEditor from './CustomRichTextEditor';
import ReactQuill from 'react-quill';

describe('CustomRichTextEditor', () => {
  it('renders without crashing', () => {
    const handleChange = jest.fn();
    const wrapper = mount(
      <CustomRichTextEditor CurrentValue={''} handleChange={handleChange} />
    );
    expect(wrapper.exists()).toBe(true);
    // Should render one ReactQuill component
    expect(wrapper.find(ReactQuill).length).toBe(1);
    // Should have the quillEditor class on ReactQuill
    expect(wrapper.find(ReactQuill).at(0).props().className).toBe('quillEditor');
  });

  it('renders with initial value', () => {
    const handleChange = jest.fn();
    const initialValue = '<p>Hello World</p>';
    const wrapper = mount(
      <CustomRichTextEditor CurrentValue={initialValue} handleChange={handleChange} />
    );
    // Only check the ReactQuill component's value prop
    expect(wrapper.find(ReactQuill).at(0).props().value).toBe(initialValue);
  });
});
