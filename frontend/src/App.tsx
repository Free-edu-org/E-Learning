import { QueryClientProvider } from '@tanstack/react-query'
import AppRouter from '@/app/router'
import { AuthProvider } from '@/app/auth/AuthProvider'
import MainLayout from '@/components/layout/MainLayout'
import { queryClient } from '@/app/query/client'

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <MainLayout>
          <AppRouter />
        </MainLayout>
      </AuthProvider>
    </QueryClientProvider>
  )
}

export default App
