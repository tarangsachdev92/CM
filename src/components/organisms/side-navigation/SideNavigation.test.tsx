// SideNavigation.test.tsx
import { shallow } from 'enzyme';
import toJson from 'enzyme-to-json';
import { Provider } from 'react-redux';
import configureStore from 'redux-mock-store';
import SideNavigation from './SideNavigation';

jest.mock('react-router-dom', () => ({
  ...jest.requireActual('react-router-dom'),
  useNavigate: () => jest.fn(),
  useLocation: () => ({ pathname: '/' }),
}));

const mockStore = configureStore([]);
const store = mockStore({
  profilePicture: { imageUrl: '' },
  // add other slices as needed for your selectors
});

describe('<SideNavigation />', () => {
    it('renders side navigation', () => {
        const wrapper = shallow(
          <Provider store={store}>
            <SideNavigation />
          </Provider>
        );
        expect(toJson(wrapper)).toMatchSnapshot();
    });
});
