import type { LessonDto, LessonProgressDto } from './types'

const mockedLessons: LessonDto[] = [
  { id: 101, title: 'Present Simple', theme: 'Czas teraźniejszy', isActive: true },
  { id: 102, title: 'Past Simple', theme: 'Czas przeszły', isActive: true },
  { id: 103, title: 'Future Forms', theme: 'Planowanie wakacji', isActive: true },
  { id: 104, title: 'Listening Basics', theme: 'Słuchanie', isActive: false },
  { id: 105, title: 'Pronunciation Tips', theme: 'Wymowa', isActive: true },
]

const mockedProgress: LessonProgressDto[] = [
  { lessonId: 101, isCompleted: true, scorePercent: 88 },
  { lessonId: 102, isCompleted: false, scorePercent: null },
  { lessonId: 103, isCompleted: true, scorePercent: 73 },
  { lessonId: 105, isCompleted: false, scorePercent: null },
]

const delay = (ms: number) => new Promise<void>((resolve) => setTimeout(resolve, ms))

export const getStudentLessons = async (): Promise<LessonDto[]> => {
  await delay(100)
  return mockedLessons
}

export const getStudentLessonProgress = async (): Promise<LessonProgressDto[]> => {
  await delay(60)
  return mockedProgress
}
