import { fetchApi } from "./apiClient";

export interface StudentStats {
  totalLessons: number;
  completedLessons: number;
  inProgressLessons: number;
  averageScore: number;
  points: number;
}

export interface StudentAchievement {
  id: number;
  title: string;
  description: string;
  icon: string;
  color: string;
  unlocked: boolean;
  unlockedAt: string | null;
  newlyUnlocked: boolean;
}

export interface StudentProgressPoint {
  date: string;
  progress: number;
}

export interface StudentSkillStats {
  category: string;
  correct: number;
  wrong: number;
}

export interface StudentLessonGroup {
  publicId: string;
  name: string;
}

export interface StudentLessonAttachment {
  publicId: string;
  originalFileName: string;
  contentType: string;
  fileSize: number;
  createdAt: string;
}

export interface StudentLesson {
  publicId: string;
  title: string;
  theme: string;
  isActive: boolean;
  teacherPublicId: string;
  teacherName: string;
  teacherAvatarUrl?: string | null;
  createdAt: string;
  groups: StudentLessonGroup[];
  status: "NOT_STARTED" | "IN_PROGRESS" | "COMPLETED";
  score: number | null;
  maxScore: number | null;
  resultPercent: number | null;
  attachments: StudentLessonAttachment[];
}

export interface SubmitAnswerItem {
  taskPublicId: string;
  taskType: "choose" | "write" | "scatter" | "speak";
  answer: string;
}

export interface SubmitAnswersRequest {
  answers: SubmitAnswerItem[];
}

export interface SubmitAnswerDetail {
  taskPublicId: string;
  taskType: string;
  isCorrect: boolean;
  correctAnswer: string;
}

export interface SubmitAnswersResponse {
  score: number;
  maxScore: number;
  details: SubmitAnswerDetail[];
}

export interface TaskAttentionEventRequest {
  taskPublicId: string;
  taskType: "choose" | "write" | "scatter" | "speak";
}

export interface LessonResultTaskDetail {
  taskPublicId: string;
  taskType: "choose" | "write" | "scatter" | "speak";
  section: string | null;
  taskText: string;
  hint: string | null;
  userAnswer: string | null;
  correctAnswer: string | null;
  isCorrect: boolean;
  possibleAnswers: string | null;
  words: string | null;
  tabSwitchCount: number;
}

export interface LessonResultDetailsResponse {
  lessonPublicId: string;
  lessonTitle: string;
  userPublicId: string;
  username: string;
  score: number;
  maxScore: number;
  resultPercent: number;
  completedAt: string | null;
  tasks: LessonResultTaskDetail[];
}

export const studentService = {
  getStats: () => fetchApi<StudentStats>("/api/v1/student/stats"),
  getStudentAchievements: () =>
    fetchApi<StudentAchievement[]>("/api/v1/student/achievements"),
  getLessons: () => fetchApi<StudentLesson[]>("/api/v1/student/lessons"),
  getProgress: () =>
    fetchApi<StudentProgressPoint[]>("/api/v1/student/progress"),
  getSkills: () => fetchApi<StudentSkillStats[]>("/api/v1/student/skills"),
  getLessonResultDetails: (lessonPublicId: string) =>
    fetchApi<LessonResultDetailsResponse>(
      `/api/v1/student/lessons/${lessonPublicId}/result`,
    ),
  submitAnswers: (lessonPublicId: string, payload: SubmitAnswersRequest) =>
    fetchApi<SubmitAnswersResponse>(
      `/api/v1/lessons/${lessonPublicId}/submit`,
      {
        method: "POST",
        body: JSON.stringify(payload),
      },
    ),
  recordTaskTabSwitch: (
    lessonPublicId: string,
    payload: TaskAttentionEventRequest,
  ) =>
    fetchApi<void>(`/api/v1/lessons/${lessonPublicId}/tab-switches`, {
      method: "POST",
      body: JSON.stringify(payload),
    }),
};
