import { shallow } from 'enzyme';
import ProfileCard from './ProfileCard';

const defaultProps = {
  title: 'John Doe',
  primaryRole: 'Admin',
  secondaryRoles: ['Editor', 'Viewer'],
  level: 'Senior',
  function: 'IT',
  location: 'New York',
  language: 'English',
};

describe('ProfileCard', () => {
  it('renders without crashing', () => {
    const wrapper = shallow(<ProfileCard {...defaultProps} />);
    expect(wrapper.exists()).toBe(true);
    expect(wrapper.find('.profile-card-title').text()).toBe('John Doe');
  });

  it('renders primary role', () => {
    const wrapper = shallow(<ProfileCard {...defaultProps} />);
    expect(wrapper.find('.primary-role-text').text()).toContain('Admin');
  });

  it('renders secondary roles with count', () => {
    const wrapper = shallow(<ProfileCard {...defaultProps} />);
    expect(wrapper.find('.secondary-role .truncate-text').text()).toBe('Editor');
    expect(wrapper.find('.secondary-role-count').text()).toContain('+1');
  });

  it('renders N/A for empty secondary roles', () => {
    const props = { ...defaultProps, secondaryRoles: [] };
    const wrapper = shallow(<ProfileCard {...props} />);
    expect(wrapper.find('.profile-detail-subtitle').at(1).text()).toBe('N/A');
  });

  it('renders level, function, location, and language', () => {
    const wrapper = shallow(<ProfileCard {...defaultProps} />);
    expect(wrapper.find('.profile-detail-subtitle').at(2).text()).toBe('Senior');
    expect(wrapper.find('.profile-detail-subtitle').at(3).text()).toBe('IT');
    expect(wrapper.find('.profile-detail-subtitle').at(4).text()).toContain('New York');
    expect(wrapper.find('.profile-detail-subtitle').at(5).text()).toContain('English');
  });
});
