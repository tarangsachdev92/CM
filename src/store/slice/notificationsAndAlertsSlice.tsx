import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import {
    fetchNotificationsAndAlerts,
    fetchUserNotifications,
    disableNotification,
    fetchDisableNotification,
    fetchNotificationTotalCount
} from '../thunks/fetchNotificationsAndAlerts';
import { INotificationsAndAlerts, IUserNotificationsAlertsWarnings } from '../../types/response';

interface INotificationsAndAlertsInitialState {
    data: INotificationsAndAlerts[];
    userNotifications: IUserNotificationsAlertsWarnings;
    isLoading: boolean;
    error: {} | null;
     expandedNotificationIds: number[]; 
    isDisableNotification: boolean | null;
    notificationTotalCount: number;
}

const initialState: INotificationsAndAlertsInitialState = {
    data: [
        {
            ruleCount: 0,
            ruleType: 'KPI',
            ruleTypeId: 1,
            kpiRule: null,
            otherTypeRule: null,
        },
    ],
    userNotifications: {
        totalUnread: 0,
        notifications: [],
        notificationUnreadCount: 0,
        warnings: [],
        warningUnreadCount: 0,
        alerts: [],
        alertUnreadCount: 0,
    },
    isLoading: false,
    error: null,
    expandedNotificationIds: [],
    isDisableNotification: null,
    notificationTotalCount: 0,
};

const NotificationsAndAlertsSlice = createSlice({
    name: 'NotificationsAndAlertsSlice',
    initialState,
        reducers: {
        addExpandedNotificationId(state, action: PayloadAction<number>) {
            if (!state.expandedNotificationIds.includes(action.payload)) {
                state.expandedNotificationIds.push(action.payload);
            }
        },
        removeExpandedNotificationId(state, action: PayloadAction<number>) {
            state.expandedNotificationIds = state.expandedNotificationIds.filter(id => id !== action.payload);
        },
        clearAllExpandedNotificationIds(state) {
            state.expandedNotificationIds = [];
        },
    },
    extraReducers(builder) {
        // fetchNotificationsAndAlerts
        builder.addCase(fetchNotificationsAndAlerts.pending, state => {
            state.isLoading = true;
        });
        builder.addCase(fetchNotificationsAndAlerts.fulfilled, (state, action) => {
            state.isLoading = false;
            state.data = action.payload;
        });
        builder.addCase(fetchNotificationsAndAlerts.rejected, (state, action) => {
            state.isLoading = false;
            state.error = action.error;
        });

        // fetchUserNotifications
        builder.addCase(fetchUserNotifications.pending, state => {
            state.isLoading = true;
        });
        builder.addCase(fetchUserNotifications.fulfilled, (state, action) => {
            state.isLoading = false;
            state.userNotifications = action.payload;
        });
        builder.addCase(fetchUserNotifications.rejected, (state, action) => {
            state.isLoading = false;
            state.error = action.error;
        });

        builder
        .addCase(disableNotification.pending, (state) => {
            state.error = null;
        })
        .addCase(disableNotification.fulfilled, (state,action) => {
            state.isLoading = false;
            state.isDisableNotification = action.payload;
        })
        .addCase(disableNotification.rejected, (state, action) => {
            state.isLoading = false;
            state.error = action.payload || action.error;
        })

        .addCase(fetchDisableNotification.pending, (state) => {
            state.error = null;
        })
        .addCase(fetchDisableNotification.fulfilled, (state, action) => {
            state.isLoading = false;
            state.isDisableNotification = action.payload;
        })
        .addCase(fetchDisableNotification.rejected, (state, action) => {
            state.isLoading = false;
            state.error = action.payload || action.error;
        });
        builder.addCase(fetchNotificationTotalCount.fulfilled, (state, action) => {
        state.notificationTotalCount = action.payload;
        });
    },
});

export const {
    addExpandedNotificationId,
    removeExpandedNotificationId,
    clearAllExpandedNotificationIds,
} = NotificationsAndAlertsSlice.actions;

export default NotificationsAndAlertsSlice.reducer;