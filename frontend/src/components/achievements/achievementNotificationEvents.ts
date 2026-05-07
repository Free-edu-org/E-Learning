const achievementNotificationEventTarget = new EventTarget();
const achievementNotificationHostEventTarget = new EventTarget();

const ACHIEVEMENT_REFRESH_EVENT = "student-achievements:refresh";
const ACHIEVEMENT_HOST_CHANGE_EVENT = "student-achievements:host-change";

let activeAchievementNotificationHostId: symbol | null = null;

export function requestAchievementNotificationsRefresh() {
  achievementNotificationEventTarget.dispatchEvent(
    new Event(ACHIEVEMENT_REFRESH_EVENT),
  );
}

export function subscribeToAchievementNotificationsRefresh(
  listener: () => void,
) {
  achievementNotificationEventTarget.addEventListener(
    ACHIEVEMENT_REFRESH_EVENT,
    listener,
  );

  return () => {
    achievementNotificationEventTarget.removeEventListener(
      ACHIEVEMENT_REFRESH_EVENT,
      listener,
    );
  };
}

function emitAchievementNotificationHostChange() {
  achievementNotificationHostEventTarget.dispatchEvent(
    new Event(ACHIEVEMENT_HOST_CHANGE_EVENT),
  );
}

export function ensureAchievementNotificationHost(hostId: symbol) {
  if (activeAchievementNotificationHostId === null) {
    activeAchievementNotificationHostId = hostId;
    emitAchievementNotificationHostChange();
  }

  return activeAchievementNotificationHostId === hostId;
}

export function releaseAchievementNotificationHost(hostId: symbol) {
  if (activeAchievementNotificationHostId !== hostId) {
    return;
  }

  activeAchievementNotificationHostId = null;
  emitAchievementNotificationHostChange();
}

export function subscribeToAchievementNotificationHostChanges(
  listener: () => void,
) {
  achievementNotificationHostEventTarget.addEventListener(
    ACHIEVEMENT_HOST_CHANGE_EVENT,
    listener,
  );

  return () => {
    achievementNotificationHostEventTarget.removeEventListener(
      ACHIEVEMENT_HOST_CHANGE_EVENT,
      listener,
    );
  };
}
