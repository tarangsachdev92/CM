import { shallow } from 'enzyme';
import MyDashboard, { MyDashboardFirstTimeLogin } from './MyDashboard';
import { Label } from '../../atoms';
import configureStore from 'redux-mock-store';
import { Provider } from 'react-redux';

describe('MyDashboard Component', () => {
    const mockStore = configureStore([]);
    const store = mockStore({ userRole: { primary: { isAnyADGroupRequested: false } } });

    let wrapper: ReturnType<typeof shallow>;

    beforeEach(() => {
        wrapper = shallow(
            <Provider store={store}>
                <MyDashboard />
            </Provider>
        );
    });

    it('should render without crashing', () => {
        expect(wrapper.exists()).toBe(true);
    });
});

describe('MyDashboardFirstTimeLogin Component', () => {
    let wrapper: ReturnType<typeof shallow>;

    beforeEach(() => {
        wrapper = shallow(<MyDashboardFirstTimeLogin />);
    });

    it('should render without crashing', () => {
        expect(wrapper.exists()).toBe(true);
    });

    it('should render a Label with the correct content', () => {
        const label = wrapper.find(Label);
        expect(label.exists()).toBe(true);
        expect(label.prop('type')).toBe('body3');

        const contentText = wrapper.find('.card-children-content-text').text();
        expect(contentText).toContain('Go to');
        expect(contentText).toContain(
            'Add primary & secondary roles, to start tracking KPI’s relevant to your role',
        );
    });

    it('should render a hyperlink with correct attributes and text', () => {
        const anchor = wrapper.find('.card-children-content-text-anchor');
        expect(anchor.exists()).toBe(true);
        expect(anchor.prop('to')).toBe('/user-profile-settings');
        expect(anchor.text()).toBe('User Role Settings');
    });
});
