import { mount } from 'enzyme';
import AppliedFilters, { FilterType } from './AppliedFilters';

const mockOnReset = jest.fn();
const mockSetNewFilters = jest.fn();
const mockOnClose = jest.fn();

const filters: FilterType[] = [
  {
    id: 'status',
    title: 'Status',
    selectedFilters: [{ label: 'Active', value: 'active' }],
    defaultFilters: [{ label: 'Active', value: 'active' }, { label: 'Inactive', value: 'inactive' }],
    onClose: mockOnClose,
  },
];

const defaultFilters = {
  status: [
    { label: 'Active', value: 'active' },
    { label: 'Inactive', value: 'inactive' },
  ],
};

const existingFilters = filters;

describe('AppliedFilters', () => {
  it('renders without crashing', () => {
    const wrapper = mount(
      <AppliedFilters
        onReset={mockOnReset}
        filters={filters}
        setNewFilters={mockSetNewFilters}
        existingFilters={existingFilters}
        defaultFilters={defaultFilters}
      />
    );
    expect(wrapper.exists()).toBe(true);
  });

  it('renders filter label', () => {
    const wrapper = mount(
      <AppliedFilters
        onReset={mockOnReset}
        filters={filters}
        setNewFilters={mockSetNewFilters}
        existingFilters={existingFilters}
        defaultFilters={defaultFilters}
      />
    );
    expect(wrapper.text()).toContain('Applied Filters :');
  });

  // ...existing code...

  it('calls setNewFilters when TagSelector onApply is triggered', () => {
    const wrapper = mount(
      <AppliedFilters
        onReset={mockOnReset}
        filters={filters}
        setNewFilters={mockSetNewFilters}
        existingFilters={existingFilters}
        defaultFilters={defaultFilters}
      />
    );
    // Simulate TagSelector confirmSelection.onApply
    const tagSelector = wrapper.find('TagSelector');
    (tagSelector.prop('confirmSelection') as { onApply: (v: unknown[]) => void }).onApply([{ label: 'Inactive', value: 'inactive' }]);
    expect(mockSetNewFilters).toHaveBeenCalledWith(
      'status',
      'Status',
      [{ label: 'Inactive', value: 'inactive' }],
      existingFilters,
      defaultFilters
    );
  });

  it('calls filter onClose when filterChipProps.onClose is triggered', () => {
    const wrapper = mount(
      <AppliedFilters
        onReset={mockOnReset}
        filters={filters}
        setNewFilters={mockSetNewFilters}
        existingFilters={existingFilters}
        defaultFilters={defaultFilters}
      />
    );
    const tagSelector = wrapper.find('TagSelector');
    (tagSelector.prop('filterChipProps') as { onClose: () => void }).onClose();
    expect(mockOnClose).toHaveBeenCalledWith('status', filters);
  });
});
