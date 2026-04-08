import { Menu, LogOut, User } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import toast from 'react-hot-toast'

import { useAuth } from '../hooks/useAuth'

interface HeaderProps {
  onMenuClick: () => void
}

const perfilLabels: Record<string, string> = {
  admin: 'Administrador',
  dev: 'Desenvolvedor',
  supervisor: 'Supervisor',
  coordenador: 'Coordenador',
  vendedor: 'Vendedor',
}

export default function Header({ onMenuClick }: HeaderProps) {
  const { user, logout } = useAuth()
  const navigate = useNavigate()

  const handleLogout = () => {
    logout()
    toast.success('Sessão encerrada')
    navigate('/login')
  }

  return (
    <header className="bg-white border-b border-[#d8e5db] px-6 py-4 flex items-center justify-between shadow-sm">
      <button
        onClick={onMenuClick}
        className="p-2 rounded-lg hover:bg-[#eff7ec] transition-colors lg:hidden"
      >
        <Menu className="w-5 h-5 text-[#1f2c24]" />
      </button>

      <div className="flex-1" />

      <div className="flex items-center gap-3">
        <div className="flex items-center gap-3 px-3 py-2 rounded-lg bg-[#f3f9f1] border border-[#d8e5db]">
          <div className="w-8 h-8 rounded-full bg-[#66e24d] flex items-center justify-center">
            <User className="w-4 h-4 text-[#071108]" />
          </div>
          <div className="hidden sm:block">
            <p className="text-sm font-medium text-gray-900">{user?.nome}</p>
            <p className="text-xs text-gray-500">{perfilLabels[user?.perfil || ''] || user?.perfil}</p>
          </div>
        </div>

        <button
          onClick={handleLogout}
          className="flex items-center gap-2 px-3 py-2 rounded-lg text-sm text-gray-700 hover:bg-red-50 hover:text-red-600 transition-colors border border-[#d8e5db]"
          title="Sair"
        >
          <LogOut className="w-4 h-4" />
          <span className="hidden sm:inline">Sair</span>
        </button>
      </div>
    </header>
  )
}
