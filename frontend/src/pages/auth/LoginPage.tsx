import { useState } from 'react'
import type { FormEvent } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '@/app/auth/useAuth'
import styles from './LoginPage.module.css'

const LoginPage = () => {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const { loginAsStudent, loginAsTeacher } = useAuth()
  const navigate = useNavigate()

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
  }

  const handleStudent = () => {
    loginAsStudent(email || 'uczen@english.app')
    navigate('/student', { replace: true })
  }

  const handleTeacher = () => {
    loginAsTeacher(email || 'nauczyciel@english.app')
    navigate('/teacher', { replace: true })
  }

  return (
    <section className={styles.card} aria-label="login card">
      <h1 className={styles.title}>English Learning Platform</h1>
      <p className={styles.subtitle}>Zaloguj się, aby kontynuować</p>
      <form className={styles.form} onSubmit={handleSubmit}>
        <label className={styles.field}>
          Email
          <input
            className={styles.input}
            type="email"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            placeholder="email@example.com"
          />
        </label>
        <label className={styles.field}>
          Hasło
          <input
            className={styles.input}
            type="password"
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            placeholder="Twoje hasło"
          />
        </label>
        <div className={styles.actions}>
          <button type="button" className={styles.demoButton} onClick={handleStudent}>
            Zaloguj jako uczeń
          </button>
          <button type="button" className={styles.secondaryButton} onClick={handleTeacher}>
            Zaloguj jako nauczyciel
          </button>
        </div>
      </form>
    </section>
  )
}

export default LoginPage
