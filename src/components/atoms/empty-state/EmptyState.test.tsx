import { shallow } from 'enzyme';
import EmptyStateOfComponent from './EmptyState';

const DummyImage = () => <img src="dummy.png" alt="dummy" />;

describe('EmptyStateOfComponent', () => {
    const props = {
        emptyStateImage: <DummyImage />,
        emptyStateTitle: 'No Data Found',
        emptyStateMessage: 'Try adjusting your filters or check back later.',
    };

    it('should render without crashing', () => {
        const wrapper = shallow(<EmptyStateOfComponent {...props} />);
        expect(wrapper.exists()).toBe(true);
    });

    it('should render the image', () => {
        const wrapper = shallow(<EmptyStateOfComponent {...props} />);
        expect(wrapper.find(DummyImage).exists()).toBe(true);
    });

    it('should render the title', () => {
        const wrapper = shallow(<EmptyStateOfComponent {...props} />);
        expect(wrapper.find('.empty-state-typography-1').text()).toBe(props.emptyStateTitle);
    });

    it('should render the message', () => {
        const wrapper = shallow(<EmptyStateOfComponent {...props} />);
        expect(wrapper.find('.empty-state-typography-2').text()).toBe(props.emptyStateMessage);
    });

    it('should have the correct container class', () => {
        const wrapper = shallow(<EmptyStateOfComponent {...props} />);
        expect(wrapper.find('.empty-state-container').exists()).toBe(true);
    });
});
