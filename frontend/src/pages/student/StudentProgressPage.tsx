import { Link } from 'react-router-dom'

const StudentProgressPage = () => {
  return (
    <section
      style={{
        maxWidth: '720px',
        margin: '0 auto',
        textAlign: 'center',
        padding: '2rem',
      }}
    >
      <h1>Twoje postępy</h1>
      <p>TODO: Szczegóły postępów</p>
      <Link to="/student">Powrót do panelu ucznia</Link>
    </section>
  )
}

export default StudentProgressPage
