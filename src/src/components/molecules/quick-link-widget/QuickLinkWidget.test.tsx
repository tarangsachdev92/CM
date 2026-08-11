import { shallow } from 'enzyme';
import QuickLinkWidget from './QuickLinkWidget';
import { Card, Label } from '../../atoms';
import { Link } from 'react-router';

describe('QuickLinkWidget Component', () => {
    let wrapper: ReturnType<typeof shallow>;

    beforeEach(() => {
        wrapper = shallow(<QuickLinkWidget />);
    });

    it('should render without crashing', () => {
        expect(wrapper.exists()).toBe(true);
    });

    it('should render the Card component with the correct title', () => {
        const card = wrapper.find(Card);
        expect(card.exists()).toBe(true);
        expect(card.prop('title')).toBe('QUICK LINKS');
        expect(card.prop('style')).toEqual({ height: '124px' });
    });

    it('should render the Settings icon and label correctly', () => {
        const settingsCol = wrapper.find('.quick-link-widget-card-children-col').first();
        expect(settingsCol.find(Link).prop('to')).toBe('/user-profile-settings');
        expect(settingsCol.find(Label).dive().text()).toBe('Settings');
    });

    it('should match the snapshot', () => {
        expect(wrapper).toMatchSnapshot();
    });
});
