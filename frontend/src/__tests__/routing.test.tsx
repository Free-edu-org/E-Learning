import { beforeEach, test } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter } from 'react-router-dom'
import App from '@/App'

beforeEach(() => {
  window.localStorage.clear()
})

test('login as student redirects to student dashboard', async () => {
  const user = userEvent.setup()

  render(
    <MemoryRouter initialEntries={['/login']}>
      <App />
    </MemoryRouter>,
  )

  await user.click(screen.getByRole('button', { name: /uczeń/i }))

  await screen.findByRole('heading', { name: /panel ucznia/i })
})

test('visiting student page without session redirects to login', async () => {
  render(
    <MemoryRouter initialEntries={['/student']}>
      <App />
    </MemoryRouter>,
  )

  await screen.findByRole('heading', { name: /english learning platform/i })
})
