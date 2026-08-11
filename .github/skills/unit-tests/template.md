# RTL test template

Copy, delete what you don't need. Keep each mock factory limited to what the component
under test actually imports.

```tsx
import '@testing-library/jest-dom';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { Provider } from 'react-redux';
import configureStore from 'redux-mock-store';
import PersonaMappingTable from './PersonaMappingTable';

jest.mock('konnect-react-components', () => ({
    Table: ({ data, onRowClick }: any) => (
        <div data-testid="table">
            {data?.map((row: any, i: number) => (
                <button key={i} onClick={() => onRowClick?.(row.id)}>{row.personaName}</button>
            ))}
        </div>
    ),
    AnimatedLoaders: () => <div data-testid="loader" />,
}));

jest.mock('../../atoms', () => ({
    Label: ({ children }: any) => <span>{children}</span>,
    EmptyStateOfComponent: ({ emptyStateTitle }: any) => (
        <div data-testid="empty-state">{emptyStateTitle}</div>
    ),
}));

jest.mock('react-i18next', () => ({ useTranslation: () => ({ t: (k: string) => k }) }));

// jest-setup.js mocks react-router-dom down to useNavigate ONLY — re-declare
// everything this component uses, or Link/Navigate are undefined at render.
jest.mock('react-router-dom', () => ({
    useNavigate: () => jest.fn(),
    Link: ({ to, children }: any) => <a href={to}>{children}</a>,
}));

jest.mock('../../../store/thunks/fetchForumPersonaMappings', () => ({
    fetchForumPersonaMappings: () => ({ type: 'MOCK_FETCH' }),
}));

const mockStore = configureStore([]);
const stateWith = (o = {}) => ({
    forumPersonaMappings: { data: [], loading: false, error: null, ...o },
});
const renderWith = (state: any) =>
    render(
        <Provider store={mockStore(state)}>
            <PersonaMappingTable forumId={1} />
        </Provider>,
    );

describe('PersonaMappingTable', () => {
    afterEach(() => jest.clearAllMocks());

    it('shows the loader while fetching', () => {
        renderWith(stateWith({ loading: true }));
        expect(screen.getByTestId('loader')).toBeInTheDocument();
    });

    it('shows the error message when the fetch fails', () => {
        renderWith(stateWith({ error: 'Unable to load' }));
        expect(screen.getByTestId('empty-state')).toHaveTextContent('Unable to load');
    });

    it('shows the empty state when there are no mappings', () => {
        renderWith(stateWith());
        expect(screen.getByTestId('empty-state')).toBeInTheDocument();
    });

    it('renders a row per mapping', () => {
        renderWith(stateWith({ data: [{ id: 1, personaName: 'Planner' }] }));
        expect(screen.getByText('Planner')).toBeInTheDocument();
    });

    it('dispatches the fetch thunk on mount', () => {
        const store = mockStore(stateWith());
        render(
            <Provider store={store}>
                <PersonaMappingTable forumId={1} />
            </Provider>,
        );
        expect(store.getActions()).toContainEqual({ type: 'MOCK_FETCH' });
    });

    it('calls onRowSelect when a row is clicked', async () => {
        const onRowSelect = jest.fn();
        render(
            <Provider store={mockStore(stateWith({ data: [{ id: 7, personaName: 'Planner' }] }))}>
                <PersonaMappingTable forumId={1} onRowSelect={onRowSelect} />
            </Provider>,
        );
        fireEvent.click(screen.getByText('Planner'));
        await waitFor(() => expect(onRowSelect).toHaveBeenCalledWith(7));
    });
});
```

No `import React` (`jest-setup.js` sets `global.React`). No `toMatchSnapshot()`.
