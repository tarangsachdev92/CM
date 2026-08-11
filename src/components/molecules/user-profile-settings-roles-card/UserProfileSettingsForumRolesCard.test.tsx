import { shallow } from 'enzyme';
import UserProfileSettingsForumRolesCard from './UserProfileSettingsForumRolesCard';
import { Icon } from 'konnect-react-components';
import type { IUserForumRoles } from '../../../types/response';

describe('UserProfileSettingsForumRolesCard', () => {
  const baseRoleData: IUserForumRoles = {
    collabType: 'Forum Member',
    forumName: 'Supply Chain Forum',
    geography: 'APAC',
  };

  it('renders without crashing', () => {
    const wrapper = shallow(
      <UserProfileSettingsForumRolesCard roleData={baseRoleData} />
    );
    expect(wrapper.exists()).toBe(true);
  });

  it('renders the correct icon', () => {
    const wrapper = shallow(
      <UserProfileSettingsForumRolesCard roleData={baseRoleData} />
    );
    const iconNode = wrapper.find(Icon);
    expect(iconNode.exists()).toBe(true);
    expect(iconNode.prop('name')).toBe('user-down-01');
    expect(iconNode.prop('color')).toBe('primary-green-500-color');
  });

  it('renders role name with collabType only', () => {
    const roleData: IUserForumRoles = {
      collabType: 'Forum Member',
      forumName: '',
      geography: '',
    };
    const wrapper = shallow(
      <UserProfileSettingsForumRolesCard roleData={roleData} />
    );
    expect(wrapper.find('.role-request-approved-text').text()).toBe('Forum Member');
  });

  it('renders role name with collabType and forumName', () => {
    const roleData: IUserForumRoles = {
      collabType: 'Forum Member',
      forumName: 'Supply Chain Forum',
      geography: '',
    };
    const wrapper = shallow(
      <UserProfileSettingsForumRolesCard roleData={roleData} />
    );
    expect(wrapper.find('.role-request-approved-text').text()).toBe('Forum Member | Supply Chain Forum');
  });

  it('renders role name with collabType, forumName, and geography', () => {
    const roleData: IUserForumRoles = {
      collabType: 'Forum Member',
      forumName: 'Supply Chain Forum',
      geography: 'APAC',
    };
    const wrapper = shallow(
      <UserProfileSettingsForumRolesCard roleData={roleData} />
    );
    expect(wrapper.find('.role-request-approved-text').text()).toBe('Forum Member | Supply Chain Forum, APAC');
  });
});
