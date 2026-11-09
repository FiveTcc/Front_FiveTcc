import { Outlet } from 'react-router-dom'
import Sidebar from './Sidebar'

// Mantém o menu lateral fixo e renderiza a página atual na área principal.
export default function Layout() {
  return (
    <div className="shell">
      <Sidebar />
      <main className="shell__content">
        <Outlet />
      </main>
    </div>
  )
}
