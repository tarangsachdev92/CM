import { shallow } from 'enzyme';
import ProfileSectionCard from './ProfileSectionCard';

describe('ProfileSectionCard', () => {
  const mockOnClick = jest.fn();
  const defaultProps = {
    icon: <span className="test-icon">Icon</span>,
    text: 'Section Text',
    onClick: mockOnClick,
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders icon and text', () => {
    const wrapper = shallow(<ProfileSectionCard {...defaultProps} />);
    expect(wrapper.find('.profile-section-icon').containsMatchingElement(defaultProps.icon)).toBe(true);
    expect(wrapper.find('.profile-section-text').text()).toBe('Section Text');
  });

  it('calls onClick when clicked', () => {
    const wrapper = shallow(<ProfileSectionCard {...defaultProps} />);
    wrapper.simulate('click');
    expect(mockOnClick).toHaveBeenCalled();
  });
});
