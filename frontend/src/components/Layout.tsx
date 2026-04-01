import { Outlet } from 'react-router-dom'
import Sidebar from './Sidebar'
import Header from './Header'
import { useState, useEffect } from 'react'
import { useAuth } from '../hooks/useAuth'
import { licencasApi } from '../services/api'
import toast from 'react-hot-toast'

export default function Layout() {
  const [sidebarOpen, setSidebarOpen] = useState(true)
  const { user, isSupervisor } = useAuth()

  useEffect(() => {
    if (!isSupervisor()) return
    licencasApi.list().then(res => {
      const licencas = res.data.results || res.data
      if (!licencas.length) return
      const licenca = licencas[0]
      if (!licenca.data_expiracao) return
      const expira = new Date(licenca.data_expiracao)
      const hoje = new Date()
      hoje.setHours(0, 0, 0, 0)
      const diff = Math.ceil((expira.getTime() - hoje.getTime()) / (1000 * 60 * 60 * 24))
      if (diff <= 5 && diff >= 0) {
        toast(`⚠️ Sua licença vence em ${diff} dia(s)! Entre em contato para renovar.`, {
          duration: 10000,
          style: { background: '#FEF3C7', color: '#92400E', border: '1px solid #F59E0B' },
          icon: '⚠️',
        })
      } else if (diff < 0) {
        toast('🔴 Sua licença está VENCIDA! Contacte o suporte imediatamente.', {
          duration: 15000,
          style: { background: '#FEE2E2', color: '#991B1B', border: '1px solid #EF4444' },
        })
      }
    }).catch(() => {})
  }, [user?.user_id])

  return (
    <div className="flex h-screen bg-gray-50 overflow-hidden">
      <Sidebar open={sidebarOpen} onToggle={() => setSidebarOpen(!sidebarOpen)} />
      <div className="flex flex-col flex-1 overflow-hidden">
        <Header onMenuClick={() => setSidebarOpen(!sidebarOpen)} />
        <main className="flex-1 overflow-auto p-6">
          <Outlet />
        </main>
      </div>
    </div>
  )
}
