import reducer, {
    appendToWidgetOrder,
    removeFromWidgetOrder,
} from './performanceWidgetsByTabSlice';
import { fetchTabWidgetsState, saveTabWidgetsState } from '../thunks/performanceWidgetsByTab';

const getTabState = (state: ReturnType<typeof reducer>, tabId: string) => {
    const tabState = state.byTab[tabId];
    expect(tabState).toBeDefined();
    return tabState!;
};

describe('performanceWidgetsByTabSlice', () => {
    it('keeps unique widget-order tokens when appending, including Highlight Summary duplicates', () => {
        const state = reducer(
            undefined,
            appendToWidgetOrder({
                tabId: 'tab-1',
                items: ['highlight-summary', 'single-kpi:otif', 'highlight-summary@2'],
            }),
        );

        expect(getTabState(state, 'tab-1').widgetOrder).toEqual([
            'highlight-summary',
            'single-kpi:otif',
            'highlight-summary@2',
        ]);
    });

    it('removes only the requested Highlight Summary token when deleting a duplicate', () => {
        const stateWithDuplicates = {
            byTab: {
                'tab-1': {
                    widgetOrder: ['highlight-summary', 'highlight-summary@2', 'single-kpi:otif'],
                },
            },
            isFetching: false,
            isSaving: false,
            error: null,
        };

        const nextState = reducer(
            stateWithDuplicates,
            removeFromWidgetOrder({ tabId: 'tab-1', items: ['highlight-summary@2'] }),
        );

        expect(getTabState(nextState, 'tab-1').widgetOrder).toEqual([
            'highlight-summary',
            'single-kpi:otif',
        ]);
    });

    it('deduplicates exact duplicates while preserving different Highlight Summary tokens on fetch/save fulfillment', () => {
        const fetchedState = reducer(
            undefined,
            fetchTabWidgetsState.fulfilled(
                {
                    tabId: 'tab-1',
                    data: {
                        widgetOrder: [
                            'highlight-summary@3',
                            'single-kpi:otif',
                            'highlight-summary',
                            'highlight-summary@3',
                        ],
                    },
                },
                'request-1',
                { tabId: 'tab-1' },
            ),
        );

        expect(getTabState(fetchedState, 'tab-1').widgetOrder).toEqual([
            'highlight-summary@3',
            'single-kpi:otif',
            'highlight-summary',
        ]);

        const savedState = reducer(
            fetchedState,
            saveTabWidgetsState.fulfilled(
                {
                    tabId: 'tab-1',
                    data: {
                        widgetOrder: [
                            'single-kpi:otif',
                            'highlight-summary@7',
                            'highlight-summary',
                            'highlight-summary@7',
                        ],
                    },
                },
                'request-2',
                {
                    tabId: 'tab-1',
                    data: {
                        widgetOrder: [
                            'single-kpi:otif',
                            'highlight-summary@7',
                            'highlight-summary',
                            'highlight-summary@7',
                        ],
                    },
                },
            ),
        );

        expect(getTabState(savedState, 'tab-1').widgetOrder).toEqual([
            'single-kpi:otif',
            'highlight-summary@7',
            'highlight-summary',
        ]);
    });
});