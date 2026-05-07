import { useEffect, useRef, useState } from "react";
import { Alert } from "@mui/material";
import { AchievementUnlockDialog } from "@/components/achievements/AchievementUnlockDialog";
import { useStudentAchievements } from "@/components/achievements/useStudentAchievements";
import {
  ensureAchievementNotificationHost,
  releaseAchievementNotificationHost,
  subscribeToAchievementNotificationHostChanges,
} from "@/components/achievements/achievementNotificationEvents";

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

      <AchievementUnlockDialog
        achievement={currentNotification}
        currentIndex={notificationIndex}
        total={notificationQueueLength}
        open={hasPendingNotifications}
        processing={markingNotificationsSeen}
        error={notificationError}
        onAdvance={advanceNotification}
        onClose={closeNotification}
      />
    </>
  );
}
