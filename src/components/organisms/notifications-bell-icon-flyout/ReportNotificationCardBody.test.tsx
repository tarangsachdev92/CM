import "@testing-library/jest-dom";
import { render, screen } from "@testing-library/react";
import ReportNotificationCardBody from "./ReportNotificationCardBody";
import { NOTIFICATION_TRIGGER_TYPE } from "../../../utils/constants";

describe("ReportNotificationCardBody", () => {
  const reportName = "Sales Report";
  const roleType = "Admin";

  it("renders REPORT_ACCESS_ADDED notification", () => {
    render(
      <ReportNotificationCardBody
        type={NOTIFICATION_TRIGGER_TYPE.REPORT_ACCESS_ADDED}
        reportName={reportName}
        roleType={roleType}
      />
    );
    expect(screen.getByText(/has been added to your primary role/i)).toBeInTheDocument();
    expect(screen.getByText(reportName)).toBeInTheDocument();
    expect(screen.getByText(roleType)).toBeInTheDocument();
  });

  it("renders REPORT_ACCESS_REMOVED notification", () => {
    render(
      <ReportNotificationCardBody
        type={NOTIFICATION_TRIGGER_TYPE.REPORT_ACCESS_REMOVED}
        reportName={reportName}
        roleType={roleType}
      />
    );
    expect(screen.getByText(/has been removed from your primary role/i)).toBeInTheDocument();
    expect(screen.getByText(reportName)).toBeInTheDocument();
    expect(screen.getByText(roleType)).toBeInTheDocument();
  });

  it("renders REPORT_PERMISSION_ADDED notification", () => {
    render(
      <ReportNotificationCardBody
        type={NOTIFICATION_TRIGGER_TYPE.REPORT_PERMISSION_ADDED}
        reportName={reportName}
        roleType={roleType}
      />
    );
    expect(screen.getByText(/A new permission for report/i)).toBeInTheDocument();
    expect(screen.getByText(reportName)).toBeInTheDocument();
    expect(screen.getByText(roleType)).toBeInTheDocument();
  });

  it("renders REPORT_PERMISSION_REMOVED notification", () => {
    render(
      <ReportNotificationCardBody
        type={NOTIFICATION_TRIGGER_TYPE.REPORT_PERMISSION_REMOVED}
        reportName={reportName}
        roleType={roleType}
      />
    );
    expect(screen.getByText(/has been removed from your role/i)).toBeInTheDocument();
    expect(screen.getByText(reportName)).toBeInTheDocument();
    expect(screen.getByText(roleType)).toBeInTheDocument();
  });

  it("renders REPORT_UPDATE notification", () => {
    render(
      <ReportNotificationCardBody
        type={NOTIFICATION_TRIGGER_TYPE.REPORT_UPDATE}
        reportName={reportName}
        roleType={roleType}
      />
    );
    expect(screen.getByText(/A new version of/i)).toBeInTheDocument();
    expect(screen.getByText(reportName)).toBeInTheDocument();
  });

  it("renders REPORT_UNAVALIABLE notification", () => {
    render(
      <ReportNotificationCardBody
        type={NOTIFICATION_TRIGGER_TYPE.REPORT_UNAVALIABLE}
        reportName={reportName}
        roleType={roleType}
      />
    );
    expect(screen.getByText(/has been removed by admin/i)).toBeInTheDocument();
    expect(screen.getByText(reportName)).toBeInTheDocument();
  });

  it("renders default notification for unknown type", () => {
    render(
      <ReportNotificationCardBody
        // @ts-expect-error: purposely passing invalid type
        type={"UNKNOWN_TYPE"}
        reportName={reportName}
        roleType={roleType}
      />
    );
    expect(screen.getByText(/You have a new notification/i)).toBeInTheDocument();
  });
});
