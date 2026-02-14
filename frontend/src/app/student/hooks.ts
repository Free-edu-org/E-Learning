import { useQuery } from '@tanstack/react-query'
import { getStudentLessonProgress, getStudentLessons } from './client'

export const studentLessonsQuery = ['student', 'lessons'] as const
export const studentProgressQuery = ['student', 'lessons-progress'] as const

export const useStudentLessons = () => {
  return useQuery({
    queryKey: studentLessonsQuery,
    queryFn: getStudentLessons,
  })
}

export const useStudentLessonProgress = () => {
  return useQuery({
    queryKey: studentProgressQuery,
    queryFn: getStudentLessonProgress,
  })
}
