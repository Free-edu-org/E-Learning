import { useContext } from 'react'
import { AuthContext } from './context'

export const useAuth = () => {
  const context = useContext(AuthContext)
  if (!context) {
    throw new Error('useAuth must be rendered inside AuthProvider')
  }

  return context
}
