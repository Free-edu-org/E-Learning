import { useEffect, useRef, useState, useCallback } from "react";
import { Alert } from "@mui/material";
import { AchievementUnlockDialog } from "./AchievementUnlockDialog";
import { AchievementNotificationToast } from "./AchievementNotificationToast";
import { useStudentAchievements } from "./useStudentAchievements";
import {
  ensureAchievementNotificationHost,
  releaseAchievementNotificationHost,
  subscribeToAchievementNotificationHostChanges,
} from "./achievementNotificationEvents";

type StudentAchievementNotificationsProps = {
  autoFetch?: boolean;
  showFetchErrorAlert?: boolean;
};

export function StudentAchievementNotifications({
  autoFetch = true,
  showFetchErrorAlert = true,
}: StudentAchievementNotificationsProps) {
  const hostIdRef = useRef(Symbol("student-achievement-notification-host"));
  const [isActiveHost, setIsActiveHost] = useState(false);

  // New state for Toast -> Modal flow
  const [showToast, setShowToast] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const lastAchievementIdRef = useRef<number | null>(null);

  useEffect(() => {
    const hostId = hostIdRef.current;

    const syncActiveHost = () => {
      setIsActiveHost(ensureAchievementNotificationHost(hostId));
    };

    syncActiveHost();
    const unsubscribe =
      subscribeToAchievementNotificationHostChanges(syncActiveHost);

    return () => {
      unsubscribe();
      releaseAchievementNotificationHost(hostId);
    };
  }, []);

  const {
    achievementsError,
    currentNotification,
    notificationQueueLength,
    notificationIndex,
    hasPendingNotifications,
    markingNotificationsSeen,
    notificationError,
    advanceNotification,
    closeNotification,
  } = useStudentAchievements({ autoFetch, enabled: isActiveHost });

  // Watch for new notifications
  useEffect(() => {
    if (hasPendingNotifications && currentNotification) {
      // Only show toast if it's a new achievement in the queue
      if (lastAchievementIdRef.current !== currentNotification.id) {
        lastAchievementIdRef.current = currentNotification.id;
        setShowToast(true);
        setShowModal(false);
      }
    } else {
      setShowToast(false);
      setShowModal(false);
      lastAchievementIdRef.current = null;
    }
  }, [hasPendingNotifications, currentNotification]);

  const handleToastClick = useCallback(() => {
    setShowToast(false);
    setShowModal(true);
  }, []);

  const handleToastClose = useCallback(
    (_?: React.SyntheticEvent | Event, reason?: string) => {
      if (reason === "clickaway") return;

      setShowToast(false);
      // If we didn't open the modal, we still need to advance/mark as seen
      // but only if the modal isn't already open
      if (!showModal) {
        advanceNotification();
      }
    },
    [showModal, advanceNotification],
  );

  const handleModalClose = useCallback(() => {
    setShowModal(false);
    closeNotification();
  }, [closeNotification]);

  const handleModalAdvance = useCallback(() => {
    // This will trigger the next notification in the queue
    advanceNotification();
  }, [advanceNotification]);

  if (!isActiveHost) {
    return null;
  }

  return (
    <>
      {showFetchErrorAlert && achievementsError && (
        <Alert severity="warning" sx={{ mb: 3, borderRadius: 2 }}>
          {achievementsError}
        </Alert>
      )}

      {notificationError && !hasPendingNotifications && (
        <Alert severity="warning" sx={{ mb: 3, borderRadius: 2 }}>
          {notificationError}
        </Alert>
      )}

      {/* Achievement Toast */}
      <AchievementNotificationToast
        achievement={currentNotification}
        open={showToast}
        onClose={handleToastClose}
        onClick={handleToastClick}
      />

      {/* Achievement Detail Modal */}
      <AchievementUnlockDialog
        achievement={currentNotification}
        currentIndex={notificationIndex}
        total={notificationQueueLength}
        open={showModal}
        processing={markingNotificationsSeen}
        error={notificationError}
        onAdvance={handleModalAdvance}
        onClose={handleModalClose}
      />
    </>
  );
}
