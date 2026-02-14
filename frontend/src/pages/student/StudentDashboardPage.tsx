import { useMemo } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '@/app/auth/useAuth'
import {
  useStudentLessonProgress,
  useStudentLessons,
} from '@/app/student/hooks'
import styles from './StudentDashboardPage.module.css'

type LessonWithProgress = {
  id: number
  title: string
  theme: string
  isActive: boolean
  progress?: {
    isCompleted: boolean
    scorePercent: number | null
  }
}

const usernameFromSession = (email: string) => {
  const name = email.split('@')[0]
  return name.charAt(0).toUpperCase() + name.slice(1)
}

const StudentDashboardPage = () => {
  const { session, logout } = useAuth()
  const navigate = useNavigate()

  const lessonsQuery = useStudentLessons()
  const progressQuery = useStudentLessonProgress()

  const lessonsWithProgress = useMemo<LessonWithProgress[]>(() => {
    const lessons = lessonsQuery.data ?? []
    const progressMap = new Map(
      (progressQuery.data ?? []).map((item) => [item.lessonId, item]),
    )

    return lessons.map((lesson) => ({
      ...lesson,
      progress: progressMap.get(lesson.id),
    }))
  }, [lessonsQuery.data, progressQuery.data])

  const activeLessons = useMemo(
    () =>
      lessonsWithProgress.filter((lesson) => lesson.isActive),
    [lessonsWithProgress],
  )

  const sortedLessons = useMemo(() => {
    return [...activeLessons].sort((a, b) => {
      const aCompleted = a.progress?.isCompleted ?? false
      const bCompleted = b.progress?.isCompleted ?? false

      if (aCompleted !== bCompleted) {
        return aCompleted ? 1 : -1
      }

      const titleCompare = a.title.localeCompare(b.title)
      if (titleCompare !== 0) {
        return titleCompare
      }

      return a.id - b.id
    })
  }, [activeLessons])

  const completedLessons = sortedLessons.filter(
    (lesson) => lesson.progress?.isCompleted,
  )

  const averageScore = completedLessons.length
    ? Math.round(
        completedLessons.reduce(
          (acc, lesson) => acc + (lesson.progress?.scorePercent ?? 0),
          0,
        ) / completedLessons.length,
      )
    : 0

  const totalActive = activeLessons.length
  const completedActive = completedLessons.length
  const isLoading = lessonsQuery.isLoading || progressQuery.isLoading
  const hasError = lessonsQuery.error || progressQuery.error

  const handleLogout = () => {
    logout()
    navigate('/login', { replace: true })
  }

  if (!session) {
    return null
  }

  const username = usernameFromSession(session.email)

  return (
    <section className={styles.page}>
      <header className={styles.topBar}>
        <div className={styles.greetingRow}>
          <div className={styles.avatar}>🧠</div>
          <div className={styles.greetingText}>
            <p className={styles.greetingTitle}>Witaj, {username}!</p>
            <p className={styles.greetingSubtitle}>Gotowy na naukę?</p>
          </div>
          <button
            type="button"
            className={styles.settingsButton}
            aria-label="Otwórz ustawienia"
          >
            <svg
              width="18"
              height="18"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.7"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <circle cx="12" cy="12" r="3" />
              <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09a1.65 1.65 0 0 0-1-1.51 1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09a1.65 1.65 0 0 0 1.51-1 1.65 1.65 0 0 0-.33-1.82l-.06-.06A2 2 0 0 1 6.17 4.1l.06.06a1.65 1.65 0 0 0 1.82.33h.09a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09c0 .7.34 1.33.9 1.51.5.16 1.04.05 1.47-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82v.09a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09c-.7 0-1.33.34-1.51.9z" />
            </svg>
          </button>
        </div>
        <button type="button" className={styles.logoutButton} onClick={handleLogout}>
          <svg
            width="18"
            height="18"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.7"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="M16 17l5-5-5-5" />
            <path d="M21 12H9" />
            <path d="M9 5H5a2 2 0 0 0-2 2v10a2 2 0 0 0 2 2h4" />
          </svg>
          Wyloguj
        </button>
      </header>

      <section className={styles.panelHeader}>
        <h2 className={styles.panelHeading}>Panel ucznia</h2>
        <p className={styles.panelSubheading}>
          Zobacz podsumowanie postępów i nowe lekcje dostępne dla Ciebie.
        </p>
      </section>

      <div className={styles.statRow}>
        <div className={styles.statCard}>
          <span className={styles.statTitle}>Ukończone lekcje</span>
          <span className={styles.statValue}>
            {completedActive} / {totalActive}
          </span>
          <span className={styles.statMeta}>Tylko aktywne lekcje</span>
        </div>
        <div className={styles.statCard}>
          <span className={styles.statTitle}>Średni wynik</span>
          <span className={styles.statValue}>{averageScore}%</span>
          <span className={styles.statMeta}>
            {completedActive ? 'Ostatnie ukończone lekcje' : 'Brak ukończonych lekcji'}
          </span>
        </div>
        <div className={styles.statCard}>
          <span className={styles.statTitle}>Twoje postępy</span>
          <span className={styles.statValue}>Zobacz szczegóły</span>
          <Link to="/student/progress" className={styles.progressLink}>
            Przejdź do postępów →
          </Link>
        </div>
      </div>

      <div className={styles.banner}>
        <p className={styles.bannerText}>Keep learning, keep growing!</p>
        <p className={styles.bannerMeta}>- Pani Anna 🌱</p>
      </div>

      <section className={styles.lessonsSection}>
        <div className={styles.lessonsHeader}>
          <h2 className={styles.lessonsTitle}>Dostępne lekcje</h2>
        </div>

        {isLoading && <div className={styles.stateMessage}>Ładowanie lekcji…</div>}
        {hasError && (
          <div className={styles.stateMessage}>Nie udało się pobrać lekcji. Spróbuj ponownie.</div>
        )}
        {!isLoading && !hasError && sortedLessons.length === 0 && (
          <div className={styles.stateMessage}>Brak aktywnych lekcji na dziś.</div>
        )}

        <div className={styles.lessonsGrid} aria-live="polite">
          {!isLoading &&
            !hasError &&
            sortedLessons.map((lesson) => {
              const isCompleted = lesson.progress?.isCompleted
              const score = lesson.progress?.scorePercent
              return (
                <article key={lesson.id} className={styles.lessonCard}>
                  <div className={styles.lessonIcon}>
                    <svg
                      width="22"
                      height="22"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="1.8"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    >
                      <path d="M4 19h16V5H4z" />
                      <path d="M4 10h16" />
                    </svg>
                  </div>
                  <div>
                    <h3 className={styles.lessonTitle}>{lesson.title}</h3>
                    <p className={styles.lessonTheme}>{lesson.theme}</p>
                  </div>
                  {isCompleted ? (
                    <>
                      <span className={styles.statusChip}>Ukończono</span>
                      <div className={styles.lessonMeta}>
                        <span className={styles.secondaryTag}>
                          Wynik: {score ?? 0}%
                        </span>
                        <span className={styles.badge}>Aktywna</span>
                      </div>
                    </>
                  ) : (
                    <div className={styles.lessonActions}>
                      <button type="button" className={styles.primaryButton}>
                        Rozpocznij lekcję
                      </button>
                      <span className={styles.badge}>Aktywna</span>
                    </div>
                  )}
                </article>
              )
            })}
        </div>
      </section>
    </section>
  )
}

export default StudentDashboardPage
