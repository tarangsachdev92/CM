
import { useCallback, useEffect, useRef, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import type { RootState, AppDispatch } from '../store';
import {
  addExpandedNotificationId,
  removeExpandedNotificationId,
} from '../store/slice/notificationsAndAlertsSlice';
import { fetchNotificationTotalCount, fetchUserNotifications } from '../store';
import { keepNodeStationary } from './keepNodeStationary';

type UseExpandableCardOpts = {
  id: number;
  type?: string; // raw; we'll normalize
  isGenericNotification: boolean;
  markAsRead: (id: number, type: string, isGeneric: boolean) => Promise<unknown>;
  onExpanded?: () => void | Promise<void>;
  // scrolling/pinning
  scrollKey?: string;                  // e.g. "notificationScrollTop:Alerts"
  containerSelector?: string;          // default: '.notification-content-container'
  anchorRef: React.RefObject<HTMLElement>; // <-- ref to the card root element
  tabName?: 'Notifications' | 'Warnings' | 'Alerts'; // used for re-pin after refetch
  refreshOnMarkRead?: boolean;         // default true
};

function normalizeType(raw?: string): 'Notification' | 'Warning' | 'Alert' {
  const s = (raw ?? 'Notification').toLowerCase();
  if (s.startsWith('alert')) return 'Alert';
  if (s.startsWith('warning')) return 'Warning';
  return 'Notification';
}

export function useExpandableCard({
  id,
  type,
  isGenericNotification,
  markAsRead,
  onExpanded,
  scrollKey = 'notificationScrollTop:Notifications',
  containerSelector = '.notification-content-container',
  anchorRef,
  // tabName = 'Notifications',
  refreshOnMarkRead = true,
}: UseExpandableCardOpts) {
  const dispatch = useDispatch<AppDispatch>();
  const expandedIds = useSelector(
    (s: RootState) => s.notificationsAndAlerts.expandedNotificationIds
  );
  const isExpanded = expandedIds.includes(id);

  const [expanded, setExpanded] = useState(isExpanded);
  const [hasMarkedRead, setHasMarkedRead] = useState(false);
  const rePinNeededRef = useRef(false); // re-pin after refetch

  useEffect(() => setExpanded(isExpanded), [isExpanded]);

  const saveScroll = useCallback(() => {
    const el = document.querySelector(containerSelector) as HTMLDivElement | null;
    if (el) sessionStorage.setItem(scrollKey, String(el.scrollTop ?? 0));
  }, [scrollKey, containerSelector]);

  const markReadIfNeeded = useCallback(async () => {
    if (hasMarkedRead) return;
    const apiType = normalizeType(type);
    await markAsRead(id, apiType, isGenericNotification);
    setHasMarkedRead(true);
    if (refreshOnMarkRead) {
      rePinNeededRef.current = true; // we will re-pin after refetch completes
      await dispatch(fetchNotificationTotalCount());
      await dispatch(fetchUserNotifications(false));
    }
  }, [hasMarkedRead, id, type, isGenericNotification, markAsRead, refreshOnMarkRead, dispatch]);

  // Re-pin the same card after refetch if needed (same tab)
  useEffect(() => {
    if (!rePinNeededRef.current) return;
    rePinNeededRef.current = false;

    const container = document.querySelector(containerSelector) as HTMLElement | null;
    const node = anchorRef.current;
    if (!container || !node) return;

    // After new data renders, align the same element to the same viewport spot.
    // We just do a single-frame adjustment because the layout now includes "read" state.
    requestAnimationFrame(() => {
      const beforeTop = node.getBoundingClientRect().top;
      requestAnimationFrame(() => {
        const afterTop = node.getBoundingClientRect().top;
        const delta = afterTop - beforeTop;
        container.scrollTop -= delta;
      });
    });
  }, [expandedIds, containerSelector, anchorRef]); // runs when list re-renders

  const handleCardClick = useCallback(async () => {
    saveScroll();
    await markReadIfNeeded();
  }, [saveScroll, markReadIfNeeded]);

  const toggleExpand = useCallback(async (e?: React.MouseEvent) => {
    e?.stopPropagation();

    const container = document.querySelector(containerSelector) as HTMLElement | null;
    const node = anchorRef.current as HTMLElement | null;

    if (container && node) {
      // Pin during the expand/collapse mutation
      await keepNodeStationary(container, node, () => {
        if (isExpanded) {
          dispatch(removeExpandedNotificationId(id));
        } else {
          dispatch(addExpandedNotificationId(id));
        }
      });
    } else {
      // Fallback without pinning if refs missing
      if (isExpanded) {
        dispatch(removeExpandedNotificationId(id));
      } else {
        dispatch(addExpandedNotificationId(id));
      }
    }

    // On first expand, mark read + trigger refresh (which we will re-pin after)
    if (!isExpanded) {
      saveScroll();
      await markReadIfNeeded();
      await onExpanded?.();
    }
  }, [dispatch, id, isExpanded, anchorRef, containerSelector, saveScroll, markReadIfNeeded, onExpanded]);

  return { expanded, isExpanded, toggleExpand, handleCardClick };
}
