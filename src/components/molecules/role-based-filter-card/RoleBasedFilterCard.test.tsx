import { shallow, mount } from 'enzyme';
import RoleBasedFilterCard from './RoleBasedFilterCard';
import { RoleBasedFilterRole } from '../../../types/response';

describe('RoleBasedFilterCard', () => {
    const mockHandleDetailsViewClicked = jest.fn();
    const mockHandleCheckboxChange = jest.fn();

    const baseRole: RoleBasedFilterRole = {
        roleId: 1,
        roleName: 'Admin',
        roleType: 'Primary',
        isOpen: true,
        region: ['Americas', 'EMEA'],
        cluster: ['Cluster1'],
        market: [],
        site: ['SiteA', 'SiteB', 'SiteC'],
        isFilterApplied: true,
        levelName: 'L3',
        subFunctionName: 'Operations',
        departmentName: 'Supply Chain',
        roleGeoName:'Chille'
    };

    it('renders empty state when roles is empty (default variant)', () => {
        const wrapper = mount(
            <RoleBasedFilterCard
                roles={[]}
                handleDetailsViewClicked={mockHandleDetailsViewClicked}
            />,
        );
        expect(wrapper.text()).toContain('No Roles Added');
        expect(wrapper.text()).toContain(
            'Geographical filters based on added roles will be visible here',
        );
    });

    it('renders loader in flyout variant when roles is empty', () => {
        const wrapper = shallow(
            <RoleBasedFilterCard
                roles={[]}
                handleDetailsViewClicked={mockHandleDetailsViewClicked}
                variant="flyout"
            />,
        );
        expect(wrapper.find('AnimatedLoaders').exists()).toBe(true);
    });

    it('renders role cards for each role', () => {
        const roles = [
            baseRole,
            { ...baseRole, roleId: 2, roleName: 'User', roleType: 'Secondary', isOpen: false },
        ];
        const wrapper = mount(
            <RoleBasedFilterCard
                roles={roles}
                handleDetailsViewClicked={mockHandleDetailsViewClicked}
                handleCheckboxChange={mockHandleCheckboxChange}
            />,
        );
        expect(wrapper.find('.fliter-group-wrapper').length).toBe(2);
        expect(wrapper.text()).toContain('Admin');
        expect(wrapper.text()).toContain('User');
    });

    it('renders correct chips for region, cluster, market, site', () => {
        const wrapper = mount(
            <RoleBasedFilterCard
                roles={[baseRole]}
                handleDetailsViewClicked={mockHandleDetailsViewClicked}
            />,
        );
        expect(wrapper.find('FilterChip[title="Region:"]').exists()).toBe(true);
        expect(wrapper.find('FilterChip[title="Cluster:"]').exists()).toBe(true);
        expect(wrapper.find('FilterChip[title="Site Code:"]').exists()).toBe(true);
        expect(wrapper.find('FilterChip[title="Market:"]').exists()).toBe(false);
    });

    it('calls handleDetailsViewClicked when role card is clicked', () => {
        const wrapper = mount(
            <RoleBasedFilterCard
                roles={[baseRole]}
                handleDetailsViewClicked={mockHandleDetailsViewClicked}
            />,
        );
        // Create a mock MouseEvent
        const mockMouseEvent = {
            stopPropagation: jest.fn(),
            preventDefault: jest.fn(),
            bubbles: true,
            cancelable: true,
            currentTarget: {},
            target: {},
            nativeEvent: {},
        } as unknown as React.MouseEvent;
        wrapper.find('ExpandableForm').at(0).prop('onClick')?.(mockMouseEvent);
        expect(mockHandleDetailsViewClicked).toHaveBeenCalled();
    });

    it('renders "Primary role" label for primary roles', () => {
        const wrapper = mount(
            <RoleBasedFilterCard
                roles={[baseRole]}
                handleDetailsViewClicked={mockHandleDetailsViewClicked}
            />,
        );
        expect(wrapper.text()).toContain('Primary role');
    });

    it('renders correct chevron icon based on isOpen', () => {
        const openRole = { ...baseRole, isOpen: true };
        const closedRole = { ...baseRole, isOpen: false };
        const wrapper = mount(
            <RoleBasedFilterCard
                roles={[openRole, closedRole]}
                handleDetailsViewClicked={mockHandleDetailsViewClicked}
            />,
        );
        // Should render chevron-up for open, chevron-down for closed
        expect(wrapper.find('Icon[name="chevron-up"]').exists()).toBe(true);
        expect(wrapper.find('Icon[name="chevron-down"]').exists()).toBe(true);
    });
});
