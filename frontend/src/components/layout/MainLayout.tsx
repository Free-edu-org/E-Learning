import { useEffect, useState } from 'react'
import type { ReactNode } from 'react'
import styles from './MainLayout.module.css'

type Theme = 'light' | 'dark'
const STORAGE_KEY = 'elp-theme'

const readInitialTheme = (): Theme => {
  if (typeof window === 'undefined') {
    return 'light'
  }

  const stored = window.localStorage.getItem(STORAGE_KEY)
  return stored === 'dark' ? 'dark' : 'light'
}

const MainLayout = ({ children }: { children: ReactNode }) => {
  const [theme, setTheme] = useState<Theme>(() => readInitialTheme())

  useEffect(() => {
    if (typeof document !== 'undefined') {
      document.documentElement.setAttribute('data-theme', theme)
    }
    if (typeof window !== 'undefined') {
      window.localStorage.setItem(STORAGE_KEY, theme)
    }
  }, [theme])

  const nextTheme = theme === 'light' ? 'dark' : 'light'
  const label =
    theme === 'light' ? 'Przełącz na tryb ciemny' : 'Przełącz na tryb jasny'

  const icon =
    theme === 'light' ? (
      <svg
        width="20"
        height="20"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.6"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <circle cx="12" cy="12" r="5" />
        <path d="M12 1v2" />
        <path d="M12 21v2" />
        <path d="M4.22 4.22l1.42 1.42" />
        <path d="M18.36 18.36l1.42 1.42" />
        <path d="M1 12h2" />
        <path d="M21 12h2" />
        <path d="M4.22 19.78l1.42-1.42" />
        <path d="M18.36 5.64l1.42-1.42" />
      </svg>
    ) : (
      <svg
        width="20"
        height="20"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.6"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <path d="M21 12.79A9 9 0 0 1 11.21 3 7 7 0 1 0 21 12.79z" />
      </svg>
    )

  return (
    <div className={styles.page}>
      <header className={styles.header}>
        <span className={styles.brand}>English Learning Platform</span>
        <button
          type="button"
          className={styles.themeButton}
          onClick={() => setTheme(nextTheme)}
          aria-label={label}
        >
          {icon}
        </button>
      </header>
      <main className={styles.main}>{children}</main>
    </div>
  )
}

export default MainLayout
