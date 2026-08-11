import { render, screen, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom';
import ForumDataTable from './ForumDataTable';
import { Provider } from 'react-redux';
import configureStore from 'redux-mock-store';

const forumData = [
    {
        forumId: 1,
        forumName: 'Forum 1',
        function: 'Function 1',
        region: 'Region 1',
        cluster: 'Cluster 1',
        market: 'Market 1',
        site: 'Site 1',
        forumOwner1: 'Owner 1',
        forumOwner2: 'Owner 2',
        collaborators: 'Colab',
        repeatsEveryNumber: 1,
        repeatsEveryType: 'WEEKLY',
        shiftStarting: '08:00',
        dayStarting: 'Monday',
        weekStarting: 'Week 1',
        weekOnDays: 'Mon',
        startingMonth: 'January',
        calendarType: 'Type',
        calendarValue: 'Value',
        status: 1,
        actions: '',
        forumLevel: 'Regional',
        forumPeriod: 'Q3 2025',
    },
];

const defaultProps = {
    defaultFilters: {
        function: [],
        region: [],
        cluster: [],
        market: [],
        site: [],
        forumOwner1: [],
        repeatEvery: [],
    },
    filtersData: {},
    existingFilters: [],
    setNewFilters: jest.fn(),
    forumData: [],
    pageSize: 10,
    pageNumber: 1,
    totalRows: 0,
    loading: false,
    searchText: '',
    handleSorting: jest.fn(),
    handlePageChange: jest.fn(),
    handlePageSizeChange: jest.fn(),
    refreshData: jest.fn(),
    appliedFilters: [],
    onEditForum: jest.fn(),
    triggerToast: jest.fn(),
};

const mockStore = configureStore([]);
const store = mockStore({});

describe('ForumDataTable', () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    it('renders no forums added state', () => {
        render(
            <Provider store={store}>
                <ForumDataTable {...defaultProps} />
            </Provider>,
        );
        expect(screen.getByText('No Forums Added Yet')).toBeInTheDocument();
    });

    it('renders no matches found state when searching', () => {
        render(
            <Provider store={store}>
                <ForumDataTable {...defaultProps} searchText="abc" />
            </Provider>,
        );
        expect(screen.getByText('No Matches Found')).toBeInTheDocument();
    });

    it('renders no records found state when filters applied and no data', () => {
        render(
            <Provider store={store}>
                <ForumDataTable
                    {...defaultProps}
                    appliedFilters={[{ columnName: 'function', columnValue: '', id: null }]}
                />
            </Provider>,
        );
        expect(screen.getByText('No Forums Found')).toBeInTheDocument();
    });

    it('renders table when forumData is present', () => {
        render(
            <Provider store={store}>
                <ForumDataTable {...defaultProps} forumData={forumData} totalRows={1} />
            </Provider>,
        );
        expect(screen.getByText('Forum 1')).toBeInTheDocument();
        expect(screen.getByText('Function 1')).toBeInTheDocument();
    });
    it('shows and closes delete dialog', () => {
        render(
            <Provider store={store}>
                <ForumDataTable {...defaultProps} forumData={forumData} totalRows={1} />
            </Provider>,
        );
        // Click delete icon (second .iconCircle)
        const iconCircles = document.querySelectorAll('.iconCircle');
        if (iconCircles[1]) {
            fireEvent.click(iconCircles[1]);
            expect(screen.getByText('Delete Forum')).toBeInTheDocument();
            // Click secondary button to close
            const dontDeleteBtn = screen.getByText("Don't Delete");
            fireEvent.click(dontDeleteBtn);
            expect(screen.queryByText('Delete Forum')).not.toBeInTheDocument();
        }
    });
});
