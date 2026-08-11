import { shallow } from 'enzyme';
import CustomSwitch from './CustomSwitch';

// Minimal props for required functionality
describe('CustomSwitch', () => {
    it('should render without crashing', () => {
        const wrapper = shallow(
            <CustomSwitch toggleSwitch={() => {}} isOn={false} type="users" />
        );
        expect(wrapper.exists()).toBe(true);
    });

    it('should display the count', () => {
        const wrapper = shallow(
            <CustomSwitch toggleSwitch={() => {}} isOn={false} type="users" count={5} />
        );
        expect(wrapper.find('.perm-counter').text()).toBe('5');
    });

    it('should call toggleSwitch when clicked', () => {
        const toggleSwitch = jest.fn();
        const wrapper = shallow(
            <CustomSwitch toggleSwitch={toggleSwitch} isOn={false} type="users" />
        );
        wrapper.simulate('click');
        expect(toggleSwitch).toHaveBeenCalled();
    });

    it('should render BlackTickMark when type is tick', () => {
        const wrapper = shallow(
            <CustomSwitch toggleSwitch={() => {}} isOn={false} type="tick" />
        );
        expect(wrapper.find('BlackTickMark').exists()).toBe(true);
    });

    it('should render UsersBlack when type is not tick', () => {
        const wrapper = shallow(
            <CustomSwitch toggleSwitch={() => {}} isOn={false} type="users" />
        );
        expect(wrapper.find('UsersBlack').exists()).toBe(true);
    });

    it('should apply switch-on class when isOn is true', () => {
        const wrapper = shallow(
            <CustomSwitch toggleSwitch={() => {}} isOn={true} type="users" />
        );
        expect(wrapper.find('.switch-on').exists()).toBe(true);
    });
});
