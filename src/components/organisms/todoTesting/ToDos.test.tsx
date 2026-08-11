import { shallow } from 'enzyme';
import { Provider } from 'react-redux';
import configureStore from 'redux-mock-store';
import ToDos, { ToDoFirstTimeLogin } from './ToDos';
import { logError } from '../../../utils/helpers';

const mockStore = configureStore([]);
const store = mockStore({
    userRole: { primary: { isAnyADGroupRequested: false } },
    // add other slices as needed
});

describe('ToDos Component', () => {
    let wrapper: ReturnType<typeof shallow>;

    beforeEach(() => {
        wrapper = shallow(
            <Provider store={store}>
                <ToDos />
            </Provider>,
        );
    });

    it('should render without crashing', () => {
        expect(wrapper.exists()).toBe(true);
    });
});

describe('ToDoFirstTimeLogin Component', () => {
    let wrapper: ReturnType<typeof shallow>;
    const mockFun = jest.fn();

    beforeEach(() => {
        wrapper = shallow(<ToDoFirstTimeLogin />);
    });

    it('should render without crashing', () => {
        expect(wrapper.exists()).toBe(true);
    });

    it('user role settings button is clickable', () => {
        const buttonWrapper = shallow(
            <button
                type="button"
                onClick={() => mockFun(true)}
                className={'card-children-content-text-anchor'}
            >
                User Role Settings
            </button>,
        );
        logError('button', buttonWrapper.debug());
        buttonWrapper.simulate('click');
        expect(mockFun).toHaveBeenCalled();
    });
});
