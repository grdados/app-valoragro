import { Menu, Bell, LogOut, User } from 'lucide-react'
import { useAuth } from '../hooks/useAuth'
import { useNavigate } from 'react-router-dom'
import toast from 'react-hot-toast'

interface HeaderProps {
  onMenuClick: () => void
}

const perfilLabels: Record<string, string> = {
  admin: 'Administrador',
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
    <header className="bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between shadow-sm">
      <button
        onClick={onMenuClick}
        className="p-2 rounded-lg hover:bg-gray-100 transition-colors lg:hidden"
      >
        <Menu className="w-5 h-5 text-gray-600" />
      </button>

      <div className="flex-1" />

      <div className="flex items-center gap-3">
        <div className="flex items-center gap-3 px-3 py-2 rounded-lg bg-gray-50 border border-gray-200">
          <div className="w-8 h-8 rounded-full bg-[#1B4F8C] flex items-center justify-center">
            <User className="w-4 h-4 text-white" />
          </div>
          <div className="hidden sm:block">
            <p className="text-sm font-medium text-gray-900">{user?.nome}</p>
            <p className="text-xs text-gray-500">{perfilLabels[user?.perfil || ''] || user?.perfil}</p>
          </div>
        </div>

        <button
          onClick={handleLogout}
          className="flex items-center gap-2 px-3 py-2 rounded-lg text-sm text-gray-600 hover:bg-red-50 hover:text-red-600 transition-colors border border-gray-200"
          title="Sair"
        >
          <LogOut className="w-4 h-4" />
          <span className="hidden sm:inline">Sair</span>
        </button>
      </div>
    </header>
  )
}
