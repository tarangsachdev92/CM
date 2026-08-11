import { shallow } from 'enzyme';
import RoleManagementTitle from './RoleManagementTitle';
import { Tab } from 'konnect-react-components';
import toJson from 'enzyme-to-json';

describe('<RoleManagementTitle />', () => {
    let wrapper: ReturnType<typeof shallow>;

    beforeEach(() => {
        wrapper = shallow(<RoleManagementTitle />);
    });

    it('should render the component correctly', () => {
        expect(wrapper.exists()).toBe(true);
    });

    it('should render title and description', () => {
        const title = wrapper.find('.role-management-heading').text();
        expect(title).toBe('Role Management');

        const description = wrapper.find('.role-management-description').text();
        expect(description).toBe('Control access for all roles here');
    });

    it('should render correct number of tabs', () => {
        const tabs = wrapper.find(Tab);
        expect(tabs).toHaveLength(1);
        const tabItems = tabs.props().items;
        expect(tabItems.length).toBe(2);
        expect(tabItems[0]?.label).toBe('Role Management');
        expect(tabItems[1]?.label).toBe('User Management');
    });

    it('should role management title section', () => {
        expect(toJson(wrapper)).toMatchSnapshot();
    });

    it('should be able to click on add role button', () => {
        const button: any = wrapper.find('#role-management-add-role-button');
        const result = button.props().onClick();
        wrapper.update();
        expect(result).toBe(true);
    });
});
