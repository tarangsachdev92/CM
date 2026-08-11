import { mount } from 'enzyme';
import FilterGroupFlyout from './FilterGroupFlyout';
import { Flyout, DropDown, InputField} from 'konnect-react-components';

const mockDropdowns = {
  financialCycle: [{ label: 'FY24', value: 'FY24' }],
  geography: [{ label: 'US', value: 'US' }],
  product: [{ label: 'Soap', value: 'Soap' }],
  customer: [{ label: 'Walmart', value: 'Walmart' }],
};

const mockSelected = {
  financialCycle: [{ label: 'FY24', value: 'FY24' }],
  geography: [],
  product: [],
  customer: [],
};

const mockDropdownConfig = [
  {
    label: 'Test',
    isDisabled: false,
    options: [{ label: 'A', value: 'A' }],
    selectedOptions: [],
    setSelected: jest.fn(),
  },
];

const defaultProps = {
  isOpen: true,
  isEditMode: false,
  filterGroupName: 'Test Group',
  dropdowns: mockDropdowns,
  selected: mockSelected,
  onReset: jest.fn(),
  onClose: jest.fn(),
  onSave: jest.fn(),
  onFilterGroupNameChange: jest.fn(),
  renderDropdowns: jest.fn(() => <div>Dropdowns</div>),
  openFilterSections: { geography: true, product: false, customer: false },
  toggleFilterSection: jest.fn(),
  geographyDropdowns: mockDropdownConfig,
  productHierarchyDropdowns: mockDropdownConfig,
  customerHierarchyDropdowns: mockDropdownConfig,
  mode: 'add',
  onBackDropClickForFlyout: jest.fn(),
  selectedFinancialCycle: [{ label: 'FY24', value: 'FY24' }],
  setSelectedFinancialCycle: jest.fn(),
};

describe('<FilterGroupFlyout />', () => {
  let wrapper: ReturnType<typeof mount>;

  beforeEach(() => {
    wrapper = mount(<FilterGroupFlyout {...defaultProps} />);
  });

  it('renders Flyout with correct heading for add mode', () => {
    const flyout = wrapper.find(Flyout).at(0);
    expect(flyout.exists()).toBe(true);
    expect(flyout.props().heading).toBe('Add New Filter Group');
  });

  it('renders InputField for filter group name', () => {
    const input = wrapper.find(InputField).at(0);
    expect(input.exists()).toBe(true);
    expect(input.props().label).toBe('Filter Group Name');
    expect(input.props().value).toBe('Test Group');
  });

  it('renders DropDown for financial cycle', () => {
    const dropdown = wrapper.find(DropDown).at(0);
    expect(dropdown.exists()).toBe(true);
    expect(dropdown.props().dropdown.label).toBe('Financial Cycle');
  });

  it('calls onClose when cancel icon is clicked', () => {
    const flyout = wrapper.find(Flyout).at(0);
    flyout.props().cancelIconClick();
    expect(defaultProps.onClose).toHaveBeenCalled();
  });
});
