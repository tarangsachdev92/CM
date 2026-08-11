// import React from 'react';
import { Provider } from 'react-redux';
import configureStore from 'redux-mock-store';
import { mount } from 'enzyme';
import NotificationCard from './NotificationCard';
import * as alertnotificationRules from '../../../services/alertnotificationRules';
// import { AppDispatch } from '../../../store';

const mockStore = configureStore([]);
const mockDispatch = jest.fn();

jest.mock('react-redux', () => ({
    ...jest.requireActual('react-redux'),
    useDispatch: () => mockDispatch,
    useSelector: jest.fn(fn => fn({ notificationsAndAlerts: { expandedNotificationIds: [] } })),
}));

jest.spyOn(alertnotificationRules, 'notificationMarkAsRead').mockResolvedValue({});

describe('NotificationCard', () => {
    const defaultProps = {
        profileImageUrl: 'test-url',
        activityType: false,
        titleText: 'Test Title',
        subtitleText: 'Test Subtitle',
        bodyElement: <div>Body Content</div>,
        fromUser: 'John Doe',
        showIcon: true,
        showBorderToBody: true,
        icon: <span>Icon</span>,
        type: 'Notification',
        id: 1,
        removeNotificationCard: jest.fn(),
        showToast: jest.fn(),
        isGenericNotification: false,
    };

    let store: ReturnType<typeof mockStore>;
    beforeEach(() => {
        store = mockStore({ notificationsAndAlerts: { expandedNotificationIds: [] } });
        jest.clearAllMocks();
    });

    it('renders with all props', () => {
        const wrapper = mount(
            <Provider store={store}>
                <NotificationCard {...defaultProps} />
            </Provider>
        );
        expect(wrapper.text()).toContain('Test Title');
        expect(wrapper.text()).toContain('Test Subtitle');
        // Should render icon, not avatar, when showIcon is true and icon is provided
        expect(wrapper.find('.notification-card-Notification-icon').exists()).toBe(true);
        expect(wrapper.find('.notification-card-avatar').exists()).toBe(false);
    });

    it('renders username initials if no profile image or icon', () => {
        const props = { ...defaultProps, profileImageUrl: undefined, showIcon: false };
        const wrapper = mount(
            <Provider store={store}>
                <NotificationCard {...props} />
            </Provider>
        );
        expect(wrapper.find('.username-initials-small').text()).toBe('JD');
    });

    it('toggles expand/collapse and shows body content', () => {
        // Mock useSelector to return expandedNotificationIds with id 1
        jest.spyOn(jest.requireMock('react-redux'), 'useSelector').mockImplementation(((fn: (state: any) => any) => fn({ notificationsAndAlerts: { expandedNotificationIds: [1] } })) as any);
        const wrapper = mount(
            <Provider store={store}>
                <NotificationCard {...defaultProps} />
            </Provider>
        );
        expect(wrapper.find('.notification-card-body').exists()).toBe(true);
        expect(wrapper.text()).toContain('Body Content');
        // Restore useSelector mock for other tests
        jest.spyOn(jest.requireMock('react-redux'), 'useSelector').mockImplementation(((fn: (state: any) => any) => fn({ notificationsAndAlerts: { expandedNotificationIds: [] } })) as any);
    });

    it('calls removeNotificationCard when close icon is clicked', () => {
        const wrapper = mount(
            <Provider store={store}>
                <NotificationCard {...defaultProps} />
            </Provider>
        );
        wrapper.find('.iso-card-close-icon').at(0).simulate('click');
        expect(defaultProps.removeNotificationCard).toHaveBeenCalledWith(1);
    });

    it('calls markNotificationAsRead and dispatches Redux on card click', async () => {
        const wrapper = mount(
            <Provider store={store}>
                <NotificationCard {...defaultProps} />
            </Provider>
        );
        await wrapper.find('.notification-card-container').at(0).simulate('click');
        expect(alertnotificationRules.notificationMarkAsRead).toHaveBeenCalledWith(
            1,
            'Notification',
            false
        );
        expect(mockDispatch).toHaveBeenCalled();
    });

    it('handles showBorderToBody prop', () => {
        // Mock useSelector to return expandedNotificationIds with id 1
        jest.spyOn(jest.requireMock('react-redux'), 'useSelector').mockImplementation(((fn: (state: any) => any) => fn({ notificationsAndAlerts: { expandedNotificationIds: [1] } })) as any);
        const props = { ...defaultProps, showBorderToBody: true };
        const wrapper = mount(
            <Provider store={store}>
                <NotificationCard {...props} />
            </Provider>
        );
        expect(wrapper.find('.notification-card-body').exists()).toBe(true);
        // Restore useSelector mock for other tests
        jest.spyOn(jest.requireMock('react-redux'), 'useSelector').mockImplementation(((fn: (state: any) => any) => fn({ notificationsAndAlerts: { expandedNotificationIds: [] } })) as any);
    });
});
