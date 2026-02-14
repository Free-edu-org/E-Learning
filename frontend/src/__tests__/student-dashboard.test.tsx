import {beforeEach, describe, expect, test, vi} from 'vitest'
import {render, screen} from '@testing-library/react'
import {MemoryRouter} from 'react-router-dom'
import StudentDashboardPage from '@/pages/student/StudentDashboardPage'
import {AuthProvider} from '@/app/auth/AuthProvider'
import * as studentHooks from '@/app/student/hooks'
import type {UseQueryResult} from '@tanstack/react-query'

const lessonsSpy = vi.spyOn(studentHooks, 'useStudentLessons')
const progressSpy = vi.spyOn(studentHooks, 'useStudentLessonProgress')

const renderDashboard = () =>
    render(
        <AuthProvider>
            <MemoryRouter>
                <StudentDashboardPage/>
            </MemoryRouter>
        </AuthProvider>,
    )

beforeEach(() => {
    window.localStorage.clear()
    lessonsSpy.mockReset()
    progressSpy.mockReset()
})

const createSuccessQuery = <T, >(data: T): UseQueryResult<T> => {
    return {
        data,
        dataUpdatedAt: Date.now(),
        error: null,
        errorUpdateCount: 0,
        failureCount: 0,
        failureReason: null,
        fetchFailureCount: 0,
        fetchStatus: 'idle',
        isActive: true,
        isError: false,
        isFetched: true,
        isFetchedAfterMount: true,
        isFetching: false,
        isFetchingNextPage: false,
        isIdle: false,
        isInitialLoading: false,
        isLoading: false,
        isLoadingError: false,
        isPlaceholderData: false,
        isPreviousData: false,
        isRefetchError: false,
        isRefetching: false,
        isStale: false,
        isSuccess: true,
        isPaused: false,
        isPending: false,
        isRefetchingSlowly: false,
        status: 'success',
        errorUpdatedAt: Date.now(),
        remove: vi.fn(),
    } as unknown as UseQueryResult<T>
}

const stubLessonQuery = (
    lessons: ReturnType<typeof studentHooks.useStudentLessons>,
    progress: ReturnType<typeof studentHooks.useStudentLessonProgress>,
) => {
    lessonsSpy.mockReturnValue(lessons)
    progressSpy.mockReturnValue(progress)
}

describe('StudentDashboardPage', () => {
    test('renders greeting with username', () => {
        window.localStorage.setItem(
            'elp-session',
            JSON.stringify({userId: 1, email: 'student@example.com', role: 'student'}),
        )

        stubLessonQuery(
            createSuccessQuery([]),
            createSuccessQuery([]),
        )

        renderDashboard()

        expect(screen.getByText(/Witaj, Student!/i)).toBeInTheDocument()
        expect(screen.getByText(/Gotowy na naukę\?/i)).toBeInTheDocument()
    })

    test('does not render inactive lessons', () => {
        window.localStorage.setItem(
            'elp-session',
            JSON.stringify({userId: 2, email: 'anna@example.com', role: 'student'}),
        )

        stubLessonQuery(
            createSuccessQuery([
                {id: 1, title: 'Active Lesson', theme: 'Grammar', isActive: true},
                {id: 2, title: 'Inactive Lesson', theme: 'Vocabulary', isActive: false},
            ]),
            createSuccessQuery([
                {lessonId: 1, isCompleted: false, scorePercent: null},
                {lessonId: 2, isCompleted: true, scorePercent: 90},
            ]),
        )

        renderDashboard()

        expect(screen.getByText('Active Lesson')).toBeInTheDocument()
        expect(screen.queryByText('Inactive Lesson')).not.toBeInTheDocument()
    })

    test('sorts not-completed lessons before completed ones', () => {
        window.localStorage.setItem(
            'elp-session',
            JSON.stringify({userId: 3, email: 'piotr@example.com', role: 'student'}),
        )

        stubLessonQuery(
            createSuccessQuery([
                {id: 10, title: 'Alpha Lesson', theme: 'Theme', isActive: true},
                {id: 11, title: 'Beta Lesson', theme: 'Theme', isActive: true},
            ]),
            createSuccessQuery([
                {lessonId: 10, isCompleted: true, scorePercent: 80},
                {lessonId: 11, isCompleted: false, scorePercent: null},
            ]),
        )

        renderDashboard()

        const titles = screen.getAllByRole('heading', {level: 3}).map((node) => node.textContent)
        expect(titles[0]).toBe('Beta Lesson')
        expect(titles[1]).toBe('Alpha Lesson')
    })
})
