import { useEffect, useMemo, useState } from 'react'
import type { ReactNode } from 'react'
import { AuthContext, type Session } from './context'

const SESSION_KEY = 'elp-session'

const readStoredSession = (): Session | null => {
  if (typeof window === 'undefined') {
    return null
  }

  const stored = window.localStorage.getItem(SESSION_KEY)
  if (!stored) {
    return null
  }

  try {
    const parsed = JSON.parse(stored)
    if (
      typeof parsed === 'object' &&
      parsed !== null &&
      typeof parsed.userId === 'number' &&
      typeof parsed.email === 'string' &&
      (parsed.role === 'student' || parsed.role === 'admin')
    ) {
      return parsed
    }
  } catch {
    // ignore invalid JSON
  }

  return null
}

const persistSession = (value: Session | null) => {
  if (typeof window === 'undefined') {
    return
  }

  if (value) {
    window.localStorage.setItem(SESSION_KEY, JSON.stringify(value))
  } else {
    window.localStorage.removeItem(SESSION_KEY)
  }
}

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [session, setSession] = useState<Session | null>(() => readStoredSession())

  useEffect(() => {
    persistSession(session)
  }, [session])

  const loginAsStudent = (email?: string) => {
    setSession({
      userId: 1001,
      email: email ?? 'student@example.com',
      role: 'student',
    })
  }

  const loginAsTeacher = (email?: string) => {
    setSession({
      userId: 9001,
      email: email ?? 'teacher@example.com',
      role: 'admin',
    })
  }

  const logout = () => setSession(null)

  const value = useMemo(
    () => ({
      session,
      loginAsStudent,
      loginAsTeacher,
      logout,
    }),
    [session],
  )

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}
