import React from "react";
import { NOTIFICATION_TRIGGER_TYPE } from "../../../utils/constants";

interface NotificationCardBodyProps {
  type: NOTIFICATION_TRIGGER_TYPE;
  appName: string;
  roleType: string;
}

const ApplicationNotificationCardBody: React.FC<NotificationCardBodyProps> = ({
  type,
  appName,
  roleType,
}) => {
  switch (type) {
    case NOTIFICATION_TRIGGER_TYPE.Application_ACCESS_ADDED:
      return (
        <div>
          The application <span className="bold-title">{appName}</span> has been added to your primary role{" "}
          <span className="bold-title">{roleType}</span> access list. You can check the request for AD group access in your role settings.
        </div>
      );
    case NOTIFICATION_TRIGGER_TYPE.Application_ACCESS_REMOVED:
      return (
        <div>
          The application <span className="bold-title">{appName}</span> has been removed from your primary role{" "}
          <span className="bold-title">{roleType}</span>’s access list.
        </div>
      );
    case NOTIFICATION_TRIGGER_TYPE.APPLICATION_PERMISSION_ADD:
      return (
        <div>
          A new permission for application <span className="bold-title">{appName}</span> has been added to your role{" "}
          <span className="bold-title">{roleType}</span>. You can check the linked permissions for the application under your role settings.
        </div>
      );
    case NOTIFICATION_TRIGGER_TYPE.APPLICATION_PERMISSION_REMOVE:
      return (
        <div>
          A permission for application <span className="bold-title">{appName}</span> has been removed from your role{" "}
          <span className="bold-title">{roleType}</span>. You can check the linked permissions for the application under your role settings.
        </div>
      );
    case NOTIFICATION_TRIGGER_TYPE.APPLICATION_UPDATE:
      return (
        <div>
          A new version of <span className="bold-title">{appName}</span> has been launched. Check out the latest updates.
        </div>
      );
    case NOTIFICATION_TRIGGER_TYPE.APPLICATION_UNAVALIABLE:
      return (
        <div>
          The application <span className="bold-title">{appName}</span> has been removed by admin and is no longer accessible in Command Centre. For any queries, please contact your administrator.
        </div>
      );

    case NOTIFICATION_TRIGGER_TYPE.APPLICATION_PERMISSION_UPDATE:
      return (
        <div>
          <div>
            Your permission for application <span className="bold-title">{appName}</span> has been updated for your role
            <span className="bold-title">{roleType}</span>. You can check the linked permissions for application under
            your role settings.
          </div>        </div>
      );
    default:
      return <div>You have a new notification.</div>;
  }
};

export default ApplicationNotificationCardBody;
