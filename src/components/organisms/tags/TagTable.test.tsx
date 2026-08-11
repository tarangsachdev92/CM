import '@testing-library/jest-dom';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import TagTable from './TagTable';
import { Provider } from 'react-redux';
import configureStore from 'redux-mock-store';

jest.mock('konnect-react-components', () => ({
  Toast: ({ message }: any) => <div data-testid="toast">{message}</div>,
  Table: ({ data }: any) => (
    <div data-testid="table">
      {data && data.map((row: any, i: number) => (
        <div key={i}>
          {row.tagCategoryName && <span>{row.tagCategoryName}</span>}
          {row.tagName && <span>{row.tagName}</span>}
          {row.tagName && (
            <>
              <span data-testid="icon-edit-01" />
              <span data-testid="icon-trash-01" />
            </>
          )}
        </div>
      ))}
    </div>
  ),
  FilterChip: ({ label }: any) => <div data-testid="filter-chip">{label}</div>,
  Counter: ({ value }: any) => <span data-testid="counter">{value}</span>,
  AnimatedLoaders: () => <div data-testid="loader" />,
  Icon: ({ name }: any) => <span data-testid={`icon-${name}`} />,
  SearchInput: ({ onChange, placeholder }: any) => (
    <input data-testid="search-input" placeholder={placeholder} onChange={e => onChange(e.target.value)} />
  ),
  Dialog: ({ isOpen, content, onPrimaryButtonClick, onSecondaryButtonClick }: any) => (
    isOpen ? <div data-testid="dialog">{content}<button onClick={onPrimaryButtonClick}>Delete</button><button onClick={onSecondaryButtonClick}>Don't Delete</button></div> : null
  ),
}));
jest.mock('../../atoms', () => ({
  EmptyStateOfComponent: ({ emptyStateTitle }: any) => <div data-testid="empty-state">{emptyStateTitle}</div>,
  Label: ({ children }: any) => <span>{children}</span>,
}));
jest.mock('../../../assets/images/images', () => ({
  RoleManagementEmptyState: () => <div data-testid="role-management-empty" />,
  SearchResultEmptyStateImage: () => <div data-testid="search-result-empty" />,
}));
jest.mock('../../../store/thunks/getTagDetails', () => ({
  getTagDetails: () => ({ type: 'MOCK_GET_TAG_DETAILS' }),
}));
jest.mock('../../../services/tags', () => ({
  searchTagService: jest.fn(() => Promise.resolve({ tagDetails: [], tagCategoryDetails: [] })),
  deleteTagsById: jest.fn(() => Promise.resolve({ statusCode: 200 })),
}));
jest.mock('../../../utils/helpers', () => ({
  getCurrentUserEmail: () => 'test@test.com',
  formatDueDate: (date: string) => `formatted-${date}`,
}));
jest.mock('../add-new-tag/AddNewTagFlyout', () => ({
  __esModule: true,
  default: (props: any) => props.isFlyoutOpen ? <div data-testid="add-tag-flyout" /> : null,
}));
jest.mock('../../../utils/validation', () => ({
  handleKeyDownValidation: jest.fn(),
}));
jest.mock('../../../utils/customHooks', () => ({
  useDebounce: (val: string) => val,
}));

const mockStore = configureStore([]);
const defaultState = {
  tagDetails: {
    data: {
      tagDetails: [
        { tagName: 'Tag1', instances: 2, updatedOn: '2025-07-31', tagId: 1, tagCategoryId: 10 },
      ],
      tagCategoryDetails: [
        { tagCategoryId: 10, tagCategoryName: 'Category1', actions: 1 },
      ],
    },
    loading: false,
  },
};

describe('TagTable', () => {
  it('renders no tags added empty state', () => {
    const store = mockStore({ tagDetails: { data: { tagDetails: [], tagCategoryDetails: [] }, loading: false } });
    render(
      <Provider store={store}>
        <TagTable refreshTags={false} newlyAddedTagCategoryId={null} setNewlyAddedTagCategoryId={jest.fn()} />
      </Provider>
    );
    expect(screen.getByText(/No Tags Added Yet/i)).toBeInTheDocument();
  });

  it('shows loader when loading', () => {
    const store = mockStore({ tagDetails: { data: { tagDetails: [], tagCategoryDetails: [] }, loading: true } });
    render(
      <Provider store={store}>
        <TagTable refreshTags={false} newlyAddedTagCategoryId={null} setNewlyAddedTagCategoryId={jest.fn()} />
      </Provider>
    );
    expect(screen.getByTestId('loader')).toBeInTheDocument();
  });

  it('shows search empty state when no results', async () => {
    const store = mockStore(defaultState);
    render(
      <Provider store={store}>
        <TagTable refreshTags={false} newlyAddedTagCategoryId={null} setNewlyAddedTagCategoryId={jest.fn()} />
      </Provider>
    );
    fireEvent.change(screen.getByTestId('search-input'), { target: { value: 'NoMatch' } });
    await waitFor(() => {
      expect(screen.getByText(/No Matches Found/i)).toBeInTheDocument();
    });
  });
});
