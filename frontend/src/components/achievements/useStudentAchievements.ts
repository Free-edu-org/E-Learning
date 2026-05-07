import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { studentService, type StudentAchievement } from "@/api/studentService";
import { getErrorMessage } from "@/utils/dashboardUtils";
import { subscribeToAchievementNotificationsRefresh } from "./achievementNotificationEvents";

function dedupeById(achievements: StudentAchievement[]): StudentAchievement[] {
  const deduped = new Map<number, StudentAchievement>();

  achievements.forEach((achievement) => {
    deduped.set(achievement.id, achievement);
  });

  return Array.from(deduped.values());
}

type UseStudentAchievementsOptions = {
  autoFetch?: boolean;
  enabled?: boolean;
};

export function useStudentAchievements(
  options: UseStudentAchievementsOptions = {},
) {
  const autoFetch = options.autoFetch ?? true;
  const enabled = options.enabled ?? true;
  const isMountedRef = useRef(true);
  const fetchRequestIdRef = useRef(0);
  const markingNotificationsSeenRef = useRef(false);

  const [achievements, setAchievements] = useState<StudentAchievement[]>([]);
  const [achievementsLoading, setAchievementsLoading] = useState(autoFetch);
  const [achievementsError, setAchievementsError] = useState<string | null>(
    null,
  );
  const [notificationQueue, setNotificationQueue] = useState<
    StudentAchievement[]
  >([]);
  const [notificationIndex, setNotificationIndex] = useState(0);
  const [markingNotificationsSeen, setMarkingNotificationsSeen] =
    useState(false);
  const [notificationError, setNotificationError] = useState<string | null>(
    null,
  );

  const mergeNotificationQueue = useCallback(
    (newlyUnlockedAchievements: StudentAchievement[]) => {
      if (newlyUnlockedAchievements.length === 0) {
        return;
      }

      setNotificationQueue((currentQueue) => {
        const merged = new Map<number, StudentAchievement>();

        currentQueue.forEach((achievement) => {
          merged.set(achievement.id, achievement);
        });

        newlyUnlockedAchievements.forEach((achievement) => {
          merged.set(achievement.id, achievement);
        });

        return Array.from(merged.values());
      });
    },
    [],
  );

  const refreshAchievements = useCallback(
    async (options?: { silent?: boolean }) => {
      const requestId = ++fetchRequestIdRef.current;
      const silent = options?.silent ?? false;

      if (!silent && isMountedRef.current) {
        setAchievementsLoading(true);
      }

      try {
        const nextAchievements = await studentService.getStudentAchievements();

        if (!isMountedRef.current || requestId !== fetchRequestIdRef.current) {
          return;
        }

        setAchievements(nextAchievements);
        setAchievementsError(null);

        mergeNotificationQueue(
          dedupeById(
            nextAchievements.filter((achievement) => achievement.newlyUnlocked),
          ),
        );
      } catch (err: unknown) {
        if (!isMountedRef.current || requestId !== fetchRequestIdRef.current) {
          return;
        }

        setAchievementsError(
          getErrorMessage(err, "Nie udało się pobrać listy achievementów."),
        );
      } finally {
        if (
          !silent &&
          isMountedRef.current &&
          requestId === fetchRequestIdRef.current
        ) {
          setAchievementsLoading(false);
        }
      }
    },
    [mergeNotificationQueue],
  );

  useEffect(() => {
    isMountedRef.current = true;

    if (!enabled) {
      return () => {
        isMountedRef.current = false;
      };
    }

    if (autoFetch) {
      void refreshAchievements();
    }

    const unsubscribe = subscribeToAchievementNotificationsRefresh(() => {
      void refreshAchievements({ silent: true });
    });

    return () => {
      unsubscribe();
      isMountedRef.current = false;
    };
  }, [autoFetch, enabled, refreshAchievements]);

  const currentNotification = notificationQueue[notificationIndex] ?? null;

  const markNotificationsSeen = useCallback(async () => {
    if (markingNotificationsSeenRef.current || notificationQueue.length === 0) {
      return;
    }

    const queuedIds = Array.from(
      new Set(notificationQueue.map((achievement) => achievement.id)),
    );

    markingNotificationsSeenRef.current = true;
    setMarkingNotificationsSeen(true);
    setNotificationError(null);

    try {
      await studentService.markAchievementNotificationsSeen();

      if (!isMountedRef.current) {
        return;
      }

      setAchievements((currentAchievements) =>
        currentAchievements.map((achievement) =>
          queuedIds.includes(achievement.id)
            ? { ...achievement, newlyUnlocked: false }
            : achievement,
        ),
      );
      setNotificationQueue([]);
      setNotificationIndex(0);
    } catch (err: unknown) {
      if (!isMountedRef.current) {
        return;
      }

      setNotificationError(
        getErrorMessage(
          err,
          "Nie udało się zapisać tego komunikatu. Spróbuj ponownie.",
        ),
      );
    } finally {
      markingNotificationsSeenRef.current = false;
      if (isMountedRef.current) {
        setMarkingNotificationsSeen(false);
      }
    }
  }, [notificationQueue]);

  const advanceNotification = useCallback(() => {
    if (markingNotificationsSeen || notificationQueue.length === 0) {
      return;
    }

    setNotificationError(null);

    if (notificationIndex < notificationQueue.length - 1) {
      setNotificationIndex((currentIndex) => currentIndex + 1);
      return;
    }

    void markNotificationsSeen();
  }, [
    markingNotificationsSeen,
    markNotificationsSeen,
    notificationIndex,
    notificationQueue.length,
  ]);

  const closeNotification = useCallback(() => {
    advanceNotification();
  }, [advanceNotification]);

  const hasPendingNotifications = useMemo(
    () => currentNotification != null,
    [currentNotification],
  );

  return {
    achievements,
    achievementsLoading,
    achievementsError,
    refreshAchievements,
    currentNotification,
    notificationQueueLength: notificationQueue.length,
    notificationIndex,
    hasPendingNotifications,
    markingNotificationsSeen,
    notificationError,
    advanceNotification,
    closeNotification,
  };
}
