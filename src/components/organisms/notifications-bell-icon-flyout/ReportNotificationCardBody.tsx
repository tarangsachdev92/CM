import React from "react";
import { NOTIFICATION_TRIGGER_TYPE } from "../../../utils/constants";

interface NotificationCardBodyProps {
  type: NOTIFICATION_TRIGGER_TYPE;
  reportName: string;
  roleType: string;
}

const ReportNotificationCardBody: React.FC<NotificationCardBodyProps> = ({
  type,
  reportName,
  roleType,
}) => {
  switch (type) {
    case NOTIFICATION_TRIGGER_TYPE.REPORT_ACCESS_ADDED:
      return (
        <div>
          The report <span className="bold-title">{reportName}</span> has been added to your primary role{" "}
          <span className="bold-title">{roleType}</span> access list. You can check the request for AD group access in your role settings.
        </div>
      );
    case NOTIFICATION_TRIGGER_TYPE.REPORT_ACCESS_REMOVED:
      return (
        <div>
          The report <span className="bold-title">{reportName}</span> has been removed from your primary role{" "}
          <span className="bold-title">{roleType}</span>’s access list.
        </div>
      );
    case NOTIFICATION_TRIGGER_TYPE.REPORT_PERMISSION_ADDED:
      return (
        <div>
          A new permission for report <span className="bold-title">{reportName}</span> has been added to your role{" "}
          <span className="bold-title">{roleType}</span>. You can check the linked permissions for the report under your role settings.
        </div>
      );
    case NOTIFICATION_TRIGGER_TYPE.REPORT_PERMISSION_REMOVED:
      return (
        <div>
          A permission for report <span className="bold-title">{reportName}</span> has been removed from your role{" "}
          <span className="bold-title">{roleType}</span>. You can check the linked permissions for the report under your role settings.
        </div>
      );
    case NOTIFICATION_TRIGGER_TYPE.REPORT_UPDATE:
      return (
        <div>
          A new version of <span className="bold-title">{reportName}</span> has been launched. Check out the latest updates.
        </div>
      );
    case NOTIFICATION_TRIGGER_TYPE.REPORT_UNAVALIABLE:
      return (
        <div>
          The report <span className="bold-title">{reportName}</span> has been removed by admin and is no longer accessible in Command Centre. For any queries, please contact your administrator.
        </div>
      );
    case NOTIFICATION_TRIGGER_TYPE.REPORT_PERMISSION_UPDATE:
      return (
        <div>
          Your permission for report <span className="bold-title">{reportName}</span> has been updated for your role
          <span className="bold-title">  {roleType}</span>. You can check the linked permissions for report under
          your role settings.        </div>
      );
    default:
      return <div>You have a new notification.</div>;
  }
};

export default ReportNotificationCardBody;
