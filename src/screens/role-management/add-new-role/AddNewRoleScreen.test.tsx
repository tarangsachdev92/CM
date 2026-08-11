import { store } from '../../../store';
import { Provider } from 'react-redux';
import { shallow } from 'enzyme';
import toJson from 'enzyme-to-json';
import AddNewRoleScreen from './AddNewRoleScreen';



describe('<GeneralInformationForm />', () => {
    let wrapper: ReturnType<typeof shallow>;

    beforeEach(() => {
        wrapper = shallow(
            <Provider store={store}>
                <AddNewRoleScreen />
            </Provider>,
        );
    });

    it('renders general information form in add new role screen correctly', () => {
        expect(toJson(wrapper)).toMatchSnapshot();
    });

    it('should render without errors', () => {
        expect(wrapper.exists()).toBeTruthy();
    });
});
