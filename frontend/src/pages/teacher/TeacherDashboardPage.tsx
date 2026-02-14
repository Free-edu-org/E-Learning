import { useAuth } from '@/app/auth/useAuth'
import styles from './TeacherDashboardPage.module.css'

const TeacherDashboardPage = () => {
  const { session, logout } = useAuth()

  if (!session) {
    return null
  }

  const roleLabel = session.role === 'admin' ? 'Nauczyciel' : 'Uczeń'

  return (
    <article className={styles.card}>
      <h2 className={styles.heading}>Panel nauczyciela</h2>
      <p>
        Zalogowano jako <span className={styles.email}>{session.email}</span>
      </p>
      <p>Twoja rola: {roleLabel}</p>
      <button type="button" className={styles.logoutButton} onClick={logout}>
        Wyloguj się
      </button>
    </article>
  )
}

export default TeacherDashboardPage
