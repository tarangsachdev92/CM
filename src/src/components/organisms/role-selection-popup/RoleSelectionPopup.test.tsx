import { mount } from 'enzyme';
import toJson from 'enzyme-to-json';
import RoleSelectionPopup from './RoleSelectionPopup';
import { Provider } from 'react-redux';
import { store } from '../../../store';

jest.mock('../../../services/users', () => ({
    createPrimaryRole: jest.fn().mockReturnValue({
        statusCode: 200,
        data: null,
        message: 'Role Request Submitted Successfully',
    }),
}));

jest.mock('react-redux', () => ({
    ...jest.requireActual('react-redux'),
    useSelector: jest.fn().mockReturnValue({
        data: [
            {
                functionId: 1,
                functionName: 'Productions',
            },
            {
                functionId: 2,
                functionName: 'Research & Development',
            },
        ],
        subFunctionData: [
            {
                subFunctionId: 1,
                subFunctionName: 'Manufacturing',
                functionId: 1,
            },
            {
                subFunctionId: 2,
                subFunctionName: 'Research & Development',
                functionId: 1,
            },
        ],
        locationData: [
            {
                regionId: 5,
                regionName: 'APAC',
                geographyTypeId: 1,
                clusters: [
                    {
                        clusterId: 10,
                        clusterName: 'PACIFIC',
                        geographyTypeId: 2,
                        markets: [
                            {
                                marketId: 19,
                                marketName: 'Australia',
                                geographyTypeId: 3,
                                sites: [
                                    {
                                        siteId: 32,
                                        siteName: 'Australia Site1',
                                        geographyTypeId: 4,
                                    },
                                ],
                            },
                            {
                                marketId: 20,
                                marketName: 'Fiji',
                                geographyTypeId: 3,
                                sites: [
                                    {
                                        siteId: 33,
                                        siteName: 'Fiji Site1',
                                        geographyTypeId: 4,
                                    },
                                ],
                            },
                        ],
                    },
                ],
            },
        ],
        locationRolesData: [
            {
                roleId: 1,
                roleName: 'End To End Supply Planner',
            },
        ],   
        primaryRoleData: {  
            roleId: 1,
            latestRoleId: null,
            roleName: "Admin",
            roleType: "Manager",
            function: "Production",
            functionId: 1,
            subFunction: "Manufacturing",
            subFunctionId: 1,
            region: "APAC",
            regionId: 5,
            cluster: "PACIFIC",
            clusterId: 10,
            market: "Australia",
            marketId: 19,
            site: "Australia Site1",
            siteId: 32,
        }
    }),
    useDispatch: () => jest.fn(),
}));

describe('<RoleSelectionPopup />', () => {
    let wrapper: any;
    const cancelMockFun = jest.fn();

    beforeEach(() => {
        wrapper = mount(
            <Provider store={store}>
                <RoleSelectionPopup
                    isOpen={true}
                    isPrimaryRoleAdded={false}
                    onCancelClick={() => cancelMockFun()}
                    isAddingSecondaryRole={false}
                />
            </Provider>,
        );
    });

    afterEach(() => {
        jest.clearAllMocks();
    });

    it('renders role selection popup', () => {
        expect(toJson(wrapper)).toMatchSnapshot();
    });

    it('cancel button clickable', () => {
        const button = wrapper
            .find('button')
            .findWhere((node: any) => node.text() === 'Cancel')
            .first();
        button.simulate('click');
        expect(cancelMockFun).toHaveBeenCalled();
    });

    test('Success toast should be closabel', () => {
        const toastButton = wrapper
            .find('Toast')
            .findWhere((node: any) => node.props().type === 'Success')
            .first();
        toastButton.props().onCloseToast();
        expect(toastButton.props().toggle).toBe(false);
    });

    test('Error toast should be closabel', () => {
        const toastButton = wrapper
            .find('Toast')
            .findWhere((node: any) => node.props().type === 'Error')
            .first();
        toastButton.props().onCloseToast();
        expect(toastButton.props().toggle).toBe(false);
    });
});
