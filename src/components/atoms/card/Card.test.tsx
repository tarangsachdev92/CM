import { shallow } from 'enzyme';
import Card from './Card';

describe('Card Component', () => {
    const title = 'Card Title';
    const label = 'Card Label';
    const children = <p>Card Content</p>;
    const style = { backgroundColor: 'blue' };

    it('should render without crashing', () => {
        const wrapper = shallow(<Card title={title} />);
        expect(wrapper.exists()).toBe(true);
    });

    it('should render the title correctly', () => {
        const wrapper = shallow(<Card title={title} />);
        const titleElement = wrapper.find('.card-title');
        expect(titleElement.text()).toBe(title);
    });

    it('should render the label if provided', () => {
        const wrapper = shallow(<Card title={title} label={label} />);
        const labelElement = wrapper.find('.card-label');
        expect(labelElement.exists()).toBe(true);
        expect(labelElement.text()).toBe(label);
    });

    it('should not render the label if not provided', () => {
        const wrapper = shallow(<Card title={title} />);
        const labelElement = wrapper.find('.card-label');
        expect(labelElement.exists()).toBe(false);
    });

    it('should render children correctly', () => {
        const wrapper = shallow(<Card title={title}>{children}</Card>);
        expect(wrapper.contains(children)).toBe(true);
    });

    it('should apply the custom styles when provided', () => {
        const wrapper = shallow(<Card title={title} style={style} />);
        expect(wrapper.prop('style')).toEqual(style);
    });

    it('should match the snapshot', () => {
        const wrapper = shallow(
            <Card title={title} label={label} style={style}>
                {children}
            </Card>,
        );
        expect(wrapper).toMatchSnapshot();
    });
});
