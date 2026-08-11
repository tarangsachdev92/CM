import { shallow } from 'enzyme';
import EllipsisWithTooltip from './EllipsisWithTooltip';

// Basic props
const text = 'This is a long text';

describe('EllipsisWithTooltip', () => {
    it('should render without crashing', () => {
        const wrapper = shallow(<EllipsisWithTooltip text={text} />);
        expect(wrapper.exists()).toBe(true);
    });

    it('should render the text', () => {
        const wrapper = shallow(<EllipsisWithTooltip text={text} />);
        expect(wrapper.find('div').text()).toBe(text);
    });

    it('should call onClick when clicked', () => {
        const onClick = jest.fn();
        const wrapper = shallow(<EllipsisWithTooltip text={text} onClick={onClick} />);
        wrapper.find('div').simulate('click');
        expect(onClick).toHaveBeenCalled();
    });

    it('should have the correct class names', () => {
        const wrapper = shallow(<EllipsisWithTooltip text={text} />);
        const divNode = wrapper.find('div');
        expect(divNode.hasClass('role')).toBe(true);
        expect(divNode.hasClass('roleText')).toBe(true);
    });

    it('should pass the text as tooltip title', () => {
        const wrapper = shallow(<EllipsisWithTooltip text={text} />);
        const tooltip = wrapper.find('Tooltip');
        expect(tooltip.prop('title')).toBe(text);
    });
});
