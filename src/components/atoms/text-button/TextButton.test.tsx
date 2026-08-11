import { shallow } from 'enzyme';
import TextButton from './TextButton';

describe('TextButton', () => {
    it('should render without crashing', () => {
        const wrapper = shallow(<TextButton>Click Me</TextButton>);
        expect(wrapper.exists()).toBe(true);
    });

    it('should render children correctly', () => {
        const wrapper = shallow(<TextButton>Click Me</TextButton>);
        expect(wrapper.text()).toBe('Click Me');
    });

    it('should call onClick when clicked', () => {
        const onClick = jest.fn();
        const wrapper = shallow(<TextButton onClick={onClick}>Click Me</TextButton>);
        wrapper.find('button').simulate('click');
        expect(onClick).toHaveBeenCalled();
    });

    it('should be disabled when disabled prop is true', () => {
        const wrapper = shallow(<TextButton disabled>Click Me</TextButton>);
        expect(wrapper.find('button').prop('disabled')).toBe(true);
    });

    it('should have the correct class name', () => {
        const wrapper = shallow(<TextButton>Click Me</TextButton>);
        expect(wrapper.find('button').hasClass('text-button')).toBe(true);
    });
});
