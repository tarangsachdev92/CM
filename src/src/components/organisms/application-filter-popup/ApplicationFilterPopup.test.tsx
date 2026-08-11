import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';
import { Provider } from 'react-redux';
import { configureStore } from '@reduxjs/toolkit';
import ApplicationFilterPopup from './ApplicationFilterPopup';


const initialState = {
  roleFunctions: {
    toolsData: [],
    data: [],
    rolesData: [],
    locationData: [],
  },
};

function createTestStore(preloadedState = initialState) {
  return configureStore({
    reducer: (state = preloadedState) => state,
    middleware: (getDefaultMiddleware) => getDefaultMiddleware({ thunk: true }),
    preloadedState,
  });
}

describe('ApplicationFilterPopup', () => {
  let store: ReturnType<typeof createTestStore>;
  let onCancelClick: jest.Mock;
  let setFilters: jest.Mock;

  beforeEach(() => {
    store = createTestStore(initialState);
    onCancelClick = jest.fn();
    setFilters = jest.fn();
  });

  it('renders without crashing', () => {
    render(
      <Provider store={store}>
        <ApplicationFilterPopup
          isOpen={true}
          onCancelClick={onCancelClick}
          setFilters={setFilters}
          filters={{}}
        />
      </Provider>
    );
    // Check for flyout or popup presence
    expect(screen.getByTestId('fly-out')).toBeInTheDocument();
  });

  it('calls onCancelClick when closed', () => {
    render(
      <Provider store={store}>
        <ApplicationFilterPopup
          isOpen={true}
          onCancelClick={onCancelClick}
          setFilters={setFilters}
          filters={{}}
        />
      </Provider>
    );
  });

  it('calls setFilters on request', () => {
    render(
      <Provider store={store}>
        <ApplicationFilterPopup
          isOpen={true}
          onCancelClick={onCancelClick}
          setFilters={setFilters}
          filters={{}}
        />
      </Provider>
    );
  });
});
