export type LessonDto = {
  id: number
  title: string
  theme: string
  isActive: boolean
}

export type LessonProgressDto = {
  lessonId: number
  isCompleted: boolean
  scorePercent: number | null
}
