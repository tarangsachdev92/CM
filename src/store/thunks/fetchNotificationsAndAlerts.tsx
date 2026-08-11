import { createAsyncThunk } from '@reduxjs/toolkit';
import { getAPI, postAPI } from '../../services/api';
import type{ ApiResponseHelper } from '../../types/response';

const fetchNotificationsAndAlerts = createAsyncThunk(
    'role/fetchNotificationsAndAlerts',
    async () => {
        const response = await getAPI('api/notification/user-rules');
        return response.data.data;
    },
);

const fetchUserNotifications = createAsyncThunk('role/fetchUserNotifications', async (showUnreadOnly:boolean) => {
    const response = await getAPI(`api/notification/user-notifications?showUnreadOnly=${showUnreadOnly??false}`);
    return response.data.data;
});

const disableNotification = createAsyncThunk<
  boolean,
  boolean,
  { rejectValue: string }
>(
  "notification/disable",
  async (isNotificationDisable, { rejectWithValue }) => {
    try {
      const response = await postAPI(
        `api/notification/silent-notification?notifcationStatus=${isNotificationDisable}`,null
      );
      const result: ApiResponseHelper<string> = await response.data;

      if (result.statusCode !== 200) {
        return rejectWithValue(
          result.message || "Failed to save notification"
        );
      }

      return isNotificationDisable;
    } catch (error: any) {
      return rejectWithValue(
        error.response?.data?.message || "Failed to save notification"
      );
    }
  }
);

const fetchNotificationTotalCount = createAsyncThunk(
  'notification/fetchNotificationTotalCount',
  async () => {
    const response = await getAPI('api/notification/user-notification-count');
    return response.data.data;
  }
);

const fetchDisableNotification = createAsyncThunk<
  boolean,
  void,
  { rejectValue: string }
>(
  "notification/fetchDisableNotification",
  async (_, { rejectWithValue }) => {
    try {
      const response = await getAPI(
        "api/notification/notification-status-by-user"
      );

      const result: ApiResponseHelper<boolean> = response.data;

      if (result.statusCode !== 200) {
        return rejectWithValue(
          result.message || "Failed to fetch notification status"
        );
      }

      return result.data; 
    } catch (error: any) {
      return rejectWithValue(
        error.response?.data?.message || "Failed to fetch notification status"
      );
    }
  }
);

export { fetchNotificationsAndAlerts, fetchUserNotifications, disableNotification, fetchDisableNotification , fetchNotificationTotalCount};
