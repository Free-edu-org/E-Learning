/**
 * Mock data generator for StudentProgressView
 * TODO: Replace with real API calls when backends endpoints are available:
 * - GET /api/v1/student/achievements
 * - GET /api/v1/student/progress (for progress chart)
 */

export interface ProgressChartPoint {
  date: string;
  progress: number;
}

export interface Achievement {
  id: string;
  label: string;
  description: string;
  icon: string;
  color: "warning" | "success" | "info" | "primary";
  unlocked: boolean;
  unlockedAt?: string;
}

/**
 * Generates mock progress chart data
 * Simulates a student's progress over time
 */
export function generateProgressChartData(): ProgressChartPoint[] {
  const today = new Date();
  const data: ProgressChartPoint[] = [];

  for (let i = 20; i >= 0; i--) {
    const date = new Date(today);
    date.setDate(date.getDate() - i);

    const baseProgress = (20 - i) * 3 + Math.random() * 10;
    const progress = Math.min(Math.max(baseProgress, 0), 100);

    data.push({
      date: date.toLocaleDateString("pl-PL", {
        month: "numeric",
        day: "numeric",
      }),
      progress: Math.round(progress),
    });
  }

  return data;
}

/**
 * Generates mock achievements/badges data
 * TODO: Replace with real endpoint GET /api/v1/student/achievements
 */
export function generateAchievements(): Achievement[] {
  return [
    {
      id: "first_lesson",
      label: "Pierwsza lekcja",
      description: "Ukończyłeś swoją pierwszą lekcję",
      icon: "🏆",
      color: "warning",
      unlocked: true,
      unlockedAt: "2026-01-15T10:00:00",
    },
    {
      id: "perfect_score",
      label: "80% w lekcji",
      description: "Osiągnąłeś przynajmniej 80% w dowolnej lekcji",
      icon: "⭐",
      color: "success",
      unlocked: true,
      unlockedAt: "2026-01-20T14:30:00",
    },
    {
      id: "streak_5",
      label: "5 lekcji z rzędu",
      description: "Ukończyłeś 5 lekcji bez przerwy",
      icon: "🔥",
      color: "info",
      unlocked: true,
      unlockedAt: "2026-01-25T16:45:00",
    },
    {
      id: "perfect_result",
      label: "100% wynik",
      description: "Osiągnąłeś maksymalny wynik w lekcji",
      icon: "💯",
      color: "primary",
      unlocked: false,
    },
  ];
}
