import { createContext } from 'react'
import type { UserRole } from './types'

export type Session = {
  userId: number
  email: string
  role: UserRole
}

export type AuthContextValue = {
  session: Session | null
  loginAsStudent: (email?: string) => void
  loginAsTeacher: (email?: string) => void
  logout: () => void
}

export const AuthContext = createContext<AuthContextValue | undefined>(undefined)
