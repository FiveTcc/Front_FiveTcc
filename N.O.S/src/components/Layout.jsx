import { Outlet } from 'react-router-dom'
import Sidebar from './Sidebar'

export default function Layout() {
  return (
    <div className="estrutura">
      <Sidebar />
      <main className="estrutura__conteudo">
        <Outlet />
      </main>
    </div>
  )
}
