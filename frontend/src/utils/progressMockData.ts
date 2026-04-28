/**
 * Mock data generator for StudentProgressView
 * TODO: Replace with real API calls when backends endpoints are available:
 * - GET /api/v1/student/skills (break down by category)
 * - GET /api/v1/student/achievements
 * - GET /api/v1/student/progress (for progress chart)
 */

export interface ProgressChartPoint {
  date: string;
  progress: number;
}

export interface SkillData {
  category: string;
  // absolute count of correctly answered items in this category
  correct: number;
  // absolute count of incorrectly answered items in this category
  wrong: number;
}

export interface Achievement {
  id: string;
  label: string;
  description: string;
  icon: string; // icon name from MUI or emoji
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

    // Mock: irregular progress with some flat periods
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
 * Generates mock skills breakdown data
 * TODO: Integrate with backend when skill-per-category endpoint is ready
 */
export function generateSkillsData(): SkillData[] {
  // Return correct/wrong breakdown per category (sums don't have to be exactly 100,
  // but using percentages here for mock clarity)
  return [
    { category: "Wybór", correct: 6, wrong: 2 },
    { category: "Pisanie", correct: 1, wrong: 1 },
    { category: "Rozsypanka", correct: 1, wrong: 3 },
    { category: "Mówienie", correct: 2, wrong: 0},
  ];
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

