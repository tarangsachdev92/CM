import { shallow } from 'enzyme';
import AdminConsole from './AdminConsole';
import { Card } from 'konnect-react-components';

describe('AdminConsole Component', () => {
    let wrapper: ReturnType<typeof shallow>;

    beforeEach(() => {
        wrapper = shallow(<AdminConsole />);
    });

    it('should render without crashing', () => {
        expect(wrapper).toBeTruthy();
    });

    it('should render the Admin Console header', () => {
        const header = wrapper.find('.admin-console-header-title');
        expect(header.text()).toEqual('Admin Hub');
    });

    it('should render the description below the header', () => {
        const description = wrapper.find('.admin-console-header-description');
        expect(description.text()).toEqual(
            'Customize settings, track performance, manage workflows, and more from multiple apps with one hub',
        );
    });

    it('should render the Configuration section text', () => {
        const configurationSection = wrapper.find('.card-section').at(0);
        const configurationTitle = configurationSection.find('.card-section-title');
        expect(configurationTitle.text()).toEqual('Configuration');
    });

    it('should render the Configuration section with a title and cards', () => {
        const configurationSection = wrapper.find('.card-section').at(0);
        const configurationTitle = configurationSection.find('.card-section-title');
        expect(configurationTitle.text()).toEqual('Configuration');
    });

    it('should render the home section text', () => {
        const configurationSection = wrapper.find('.card-section').at(1);
        const configurationTitle = configurationSection.find('.card-section-title');
        expect(configurationTitle.text()).toEqual('Home Page');
    });

    it('should render all Home Page cards', () => {
        const homePageCards = wrapper.find('.card-section').at(1).find(Card);
        expect(homePageCards).toHaveLength(1);
        expect(homePageCards.at(0).prop('title')).toEqual('Announcements');
    });

    it('should render the help & support section text', () => {
        const configurationSection = wrapper.find('.card-section').at(2);
        const configurationTitle = configurationSection.find('.card-section-title');
        expect(configurationTitle.text()).toEqual('Help & Support');
    });

    it('should render all Help & Support cards', () => {
        const helpAndSupportCards = wrapper.find('.card-section').at(2).find(Card);
        expect(helpAndSupportCards).toHaveLength(2);
        expect(helpAndSupportCards.at(0).prop('title')).toEqual('FAQs');
        expect(helpAndSupportCards.at(1).prop('title')).toEqual('Documentation');
    });

    it('should render the correct description for Workflow Management card', () => {
        const workflowManagementCard = wrapper
            .find(Card)
            .findWhere(node => node.prop('title') === 'Workflow Management');
        expect(workflowManagementCard.prop('description')).toEqual(
            'Streamline processes and boost productivity',
        );
    });
});
