export type UserRole = 'teacher' | 'student';

export interface User {
  id: string;
  name: string;
  role: UserRole;
  avatar?: string;
  nickname?: string;
  email?: string;
  isArchived?: boolean;
  groupIds?: string[];
}

export type TaskType = 'word-order' | 'fill-gap' | 'multiple-choice';

export interface Task {
  id: string;
  type: TaskType;
  question: string;
  correctAnswer: string | string[];
  options?: string[];
  words?: string[];
}

export interface Lesson {
  id: string;
  title: string;
  topic: string;
  grammarRules: string;
  tasks: Task[];
  teacherId: string;
  createdAt: Date;
  isActive: boolean;
  groupIds?: string[];
}

export interface Group {
  id: string;
  name: string;
  description?: string;
  teacherId: string;
  studentIds: string[];
  createdAt: Date;
}

export interface StudentAnswer {
  taskId: string;
  answer: string | string[];
  isCorrect: boolean;
}

export interface LessonResult {
  lessonId: string;
  studentId: string;
  answers: StudentAnswer[];
  score: number;
  maxScore: number;
  percentage: number;
  completedAt: Date;
}
