import '@testing-library/jest-dom';
import { render, screen } from '@testing-library/react';
import ApplicationNotificationCardBody from './ApplicationNotificationCardBody';
import { NOTIFICATION_TRIGGER_TYPE } from '../../../utils/constants';

describe('ApplicationNotificationCardBody', () => {
  const appName = 'TestApp';
  const roleType = 'Admin';

  it('renders Application_ACCESS_ADDED notification', () => {
    render(
      <ApplicationNotificationCardBody
        type={NOTIFICATION_TRIGGER_TYPE.Application_ACCESS_ADDED}
        appName={appName}
        roleType={roleType}
      />
    );
    expect(screen.getByText(/has been added to your primary role/i)).toBeInTheDocument();
    expect(screen.getByText(appName)).toBeInTheDocument();
    expect(screen.getByText(roleType)).toBeInTheDocument();
  });

  it('renders Application_ACCESS_REMOVED notification', () => {
    render(
      <ApplicationNotificationCardBody
        type={NOTIFICATION_TRIGGER_TYPE.Application_ACCESS_REMOVED}
        appName={appName}
        roleType={roleType}
      />
    );
    expect(screen.getByText(/has been removed from your primary role/i)).toBeInTheDocument();
  });

  it('renders APPLICATION_PERMISSION_ADD notification', () => {
    render(
      <ApplicationNotificationCardBody
        type={NOTIFICATION_TRIGGER_TYPE.APPLICATION_PERMISSION_ADD}
        appName={appName}
        roleType={roleType}
      />
    );
    expect(screen.getByText(/A new permission for application/i)).toBeInTheDocument();
  });

  it('renders APPLICATION_PERMISSION_REMOVE notification', () => {
    render(
      <ApplicationNotificationCardBody
        type={NOTIFICATION_TRIGGER_TYPE.APPLICATION_PERMISSION_REMOVE}
        appName={appName}
        roleType={roleType}
      />
    );
    expect(screen.getByText(/A permission for application/i)).toBeInTheDocument();
  });

  it('renders APPLICATION_UPDATE notification', () => {
    render(
      <ApplicationNotificationCardBody
        type={NOTIFICATION_TRIGGER_TYPE.APPLICATION_UPDATE}
        appName={appName}
        roleType={roleType}
      />
    );
    expect(screen.getByText(/A new version of/i)).toBeInTheDocument();
  });

  it('renders APPLICATION_UNAVALIABLE notification', () => {
    render(
      <ApplicationNotificationCardBody
        type={NOTIFICATION_TRIGGER_TYPE.APPLICATION_UNAVALIABLE}
        appName={appName}
        roleType={roleType}
      />
    );
    expect(screen.getByText(/has been removed by admin/i)).toBeInTheDocument();
  });

  it('renders APPLICATION_PERMISSION_UPDATE notification', () => {
    render(
      <ApplicationNotificationCardBody
        type={NOTIFICATION_TRIGGER_TYPE.APPLICATION_PERMISSION_UPDATE}
        appName={appName}
        roleType={roleType}
      />
    );
    expect(screen.getByText(/Your permission for application/i)).toBeInTheDocument();
  });

  it('renders default notification for unknown type', () => {
    render(
      <ApplicationNotificationCardBody
        // @ts-expect-error - empty string is not a valid NOTIFICATION_TRIGGER_TYPE
        type={''}  
        appName={appName}
        roleType={roleType}
      />
    );
    expect(screen.getByText(/You have a new notification/i)).toBeInTheDocument();
  });
});
