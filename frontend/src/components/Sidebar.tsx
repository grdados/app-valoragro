import { NavLink } from 'react-router-dom'
import {
  LayoutDashboard, ShoppingCart, DollarSign, FileText,
  Users, Building2, Package, Calendar, BarChart3,
  ChevronLeft, ChevronRight, Settings, UserCheck, Layers,
  UserCircle, Key, Shield
} from 'lucide-react'
import { useAuth } from '../hooks/useAuth'
import { cn } from '../lib/utils'

interface SidebarProps {
  open: boolean
  onToggle: () => void
}

interface NavItem {
  to: string
  icon: React.ElementType
  label: string
}

const mainNav: NavItem[] = [
  { to: '/dashboard', icon: LayoutDashboard, label: 'Dashboard' },
  { to: '/vendas', icon: ShoppingCart, label: 'Vendas' },
  { to: '/comissoes', icon: DollarSign, label: 'Comissões' },
  { to: '/relatorios', icon: FileText, label: 'Relatórios' },
  { to: '/clientes', icon: UserCircle, label: 'Clientes' },
]

const supervisorNav: NavItem[] = [
  { to: '/cadastros/supervisores', icon: Shield, label: 'Supervisores' },
  { to: '/cadastros/coordenadores', icon: UserCheck, label: 'Coordenadores' },
  { to: '/cadastros/vendedores', icon: Users, label: 'Vendedores' },
  { to: '/cadastros/consorcios', icon: Building2, label: 'Consórcios' },
  { to: '/cadastros/assembleias', icon: Calendar, label: 'Assembleias' },
  { to: '/cadastros/faixas', icon: Layers, label: 'Faixas de Comissão' },
  { to: '/empresa', icon: Package, label: 'Dados da Empresa' },
  { to: '/cadastros/usuarios', icon: Settings, label: 'Usuários' },
]

const coordenadorNav: NavItem[] = [
  { to: '/cadastros/vendedores', icon: Users, label: 'Vendedores' },
]

const devOnlyNav: NavItem[] = [
  { to: '/licencas', icon: Key, label: 'Licenças' },
]

const supervisorInfoNav: NavItem[] = [
  { to: '/licencas', icon: Key, label: 'Licença' },
]

export default function Sidebar({ open, onToggle }: SidebarProps) {
  const { user, isDev, isSupervisorOrAbove, isCoordenador } = useAuth()

  return (
    <aside
      className={cn(
        'relative flex flex-col bg-[#1B4F8C] text-white transition-all duration-300 ease-in-out',
        open ? 'w-64' : 'w-16'
      )}
    >
      <div className="flex items-center justify-between p-4 border-b border-blue-700">
        {open && (
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-white rounded-lg flex items-center justify-center">
              <BarChart3 className="w-5 h-5 text-[#1B4F8C]" />
            </div>
            <div>
              <p className="text-sm font-bold leading-none">Valor Agro</p>
              <p className="text-xs text-blue-200 leading-none mt-0.5">Gestão de Consórcios</p>
            </div>
          </div>
        )}
        {!open && (
          <div className="w-8 h-8 bg-white rounded-lg flex items-center justify-center mx-auto">
            <BarChart3 className="w-5 h-5 text-[#1B4F8C]" />
          </div>
        )}
        <button
          onClick={onToggle}
          className="ml-auto p-1 rounded-lg hover:bg-blue-700 transition-colors"
        >
          {open ? <ChevronLeft className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
        </button>
      </div>

      <nav className="flex-1 p-3 space-y-1 overflow-y-auto">
        {mainNav.map((item) => (
          <SidebarItem key={item.to} item={item} open={open} />
        ))}

        {isSupervisorOrAbove() && (
          <>
            {open && (
              <p className="px-3 pt-4 pb-1 text-xs font-semibold uppercase tracking-wider text-blue-300">
                Cadastros
              </p>
            )}
            {!open && <div className="border-t border-blue-700 my-2" />}
            {supervisorNav.map((item) => (
              <SidebarItem key={item.to} item={item} open={open} />
            ))}
          </>
        )}

        {isCoordenador() && (
          <>
            {open && (
              <p className="px-3 pt-4 pb-1 text-xs font-semibold uppercase tracking-wider text-blue-300">
                Equipe
              </p>
            )}
            {!open && <div className="border-t border-blue-700 my-2" />}
            {coordenadorNav.map((item) => (
              <SidebarItem key={item.to} item={item} open={open} />
            ))}
          </>
        )}

        {isDev() && (
          <>
            {open && (
              <p className="px-3 pt-4 pb-1 text-xs font-semibold uppercase tracking-wider text-blue-300">
                Desenvolvedor
              </p>
            )}
            {!open && <div className="border-t border-blue-700 my-2" />}
            {devOnlyNav.map((item) => (
              <SidebarItem key={item.to} item={item} open={open} />
            ))}
          </>
        )}

        {user?.perfil === 'supervisor' && (
          <>
            {open && (
              <p className="px-3 pt-4 pb-1 text-xs font-semibold uppercase tracking-wider text-blue-300">
                Sistema
              </p>
            )}
            {!open && <div className="border-t border-blue-700 my-2" />}
            {supervisorInfoNav.map((item) => (
              <SidebarItem key={item.to} item={item} open={open} />
            ))}
          </>
        )}
      </nav>

      {open && (
        <div className="p-4 border-t border-blue-700">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-full bg-blue-500 flex items-center justify-center text-sm font-bold">
              {user?.nome?.charAt(0)?.toUpperCase() || 'U'}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium truncate">{user?.nome}</p>
              <p className="text-xs text-blue-300 capitalize">{user?.perfil}</p>
            </div>
          </div>
        </div>
      )}
    </aside>
  )
}

function SidebarItem({ item, open }: { item: NavItem; open: boolean }) {
  const Icon = item.icon
  return (
    <NavLink
      to={item.to}
      className={({ isActive }) =>
        cn(
          'flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all',
          isActive
            ? 'bg-white text-[#1B4F8C] shadow-sm'
            : 'text-blue-100 hover:bg-blue-700 hover:text-white'
        )
      }
      title={!open ? item.label : undefined}
    >
      <Icon className="w-5 h-5 flex-shrink-0" />
      {open && <span className="truncate">{item.label}</span>}
    </NavLink>
  )
}
