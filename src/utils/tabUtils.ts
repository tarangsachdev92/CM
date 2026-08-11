export const tabFromType = (t?: string) => {
  const s = (t ?? '').toLowerCase();
  if (s.startsWith('alert')) return 'Alerts';
  if (s.startsWith('warning')) return 'Warnings';
  return 'Notifications';
};