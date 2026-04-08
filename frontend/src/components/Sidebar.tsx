import { useEffect, useMemo, useState } from 'react'
import { NavLink, useLocation } from 'react-router-dom'
import {
  LayoutDashboard,
  ShoppingCart,
  DollarSign,
  FileText,
  Users,
  Building2,
  Package,
  Calendar,
  ChevronLeft,
  ChevronRight,
  Settings,
  UserCheck,
  Layers,
  UserCircle,
  Key,
  Shield,
  Database,
  Landmark,
  Boxes,
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
  { to: '/painel/dashboard', icon: LayoutDashboard, label: 'Dashboard' },
  { to: '/painel/vendas', icon: ShoppingCart, label: 'Vendas' },
  { to: '/painel/comissoes', icon: DollarSign, label: 'Comissões' },
  { to: '/painel/relatorios', icon: FileText, label: 'Relatórios' },
  { to: '/painel/clientes', icon: UserCircle, label: 'Clientes' },
]

const equipeNav: NavItem[] = [
  { to: '/painel/cadastros/supervisores', icon: Shield, label: 'Supervisores' },
  { to: '/painel/cadastros/coordenadores', icon: UserCheck, label: 'Coordenadores' },
  { to: '/painel/cadastros/vendedores', icon: Users, label: 'Vendedores' },
]

const geraisNav: NavItem[] = [
  { to: '/painel/cadastros/consorcios', icon: Building2, label: 'Consórcios' },
  { to: '/painel/cadastros/assembleias', icon: Calendar, label: 'Assembleias' },
  { to: '/painel/cadastros/cobans', icon: Landmark, label: 'COBAN' },
  { to: '/painel/cadastros/tipos-bem', icon: Boxes, label: 'Tipo de Bem' },
  { to: '/painel/cadastros/faixas', icon: Layers, label: 'Faixa da Comissão' },
]

const administrativoNav: NavItem[] = [
  { to: '/painel/empresa', icon: Package, label: 'Dados da Empresa' },
  { to: '/painel/cadastros/usuarios', icon: Settings, label: 'Usuários' },
  { to: '/painel/backups', icon: Database, label: 'Backups' },
]

const coordenadorNav: NavItem[] = [
  { to: '/painel/cadastros/vendedores', icon: Users, label: 'Vendedores' },
]

const devOnlyNav: NavItem[] = [
  { to: '/painel/licencas', icon: Key, label: 'Licenças' },
]

const supervisorInfoNav: NavItem[] = [
  { to: '/painel/licencas', icon: Key, label: 'Licença' },
]

export default function Sidebar({ open, onToggle }: SidebarProps) {
  const { user, isDev, isSupervisorOrAbove, isCoordenador } = useAuth()
  const location = useLocation()

  const [cadastrosOpen, setCadastrosOpen] = useState(true)
  const [geraisOpen, setGeraisOpen] = useState(true)
  const [administrativoOpen, setAdministrativoOpen] = useState(true)

  const isGeraisRoute = useMemo(
    () =>
      [
        '/painel/cadastros/consorcios',
        '/painel/cadastros/assembleias',
        '/painel/cadastros/cobans',
        '/painel/cadastros/tipos-bem',
        '/painel/cadastros/faixas',
      ].some((route) => location.pathname.startsWith(route)),
    [location.pathname]
  )

  const isAdministrativoRoute = useMemo(
    () =>
      ['/painel/empresa', '/painel/cadastros/usuarios', '/painel/backups'].some((route) =>
        location.pathname.startsWith(route)
      ),
    [location.pathname]
  )

  useEffect(() => {
    if (location.pathname.startsWith('/painel/cadastros/')) setCadastrosOpen(true)
    if (isGeraisRoute) setGeraisOpen(true)
    if (isAdministrativoRoute) setAdministrativoOpen(true)
  }, [location.pathname, isGeraisRoute, isAdministrativoRoute])

  return (
    <aside
      className={cn(
        'relative flex flex-col text-white transition-all duration-300 ease-in-out admin-gradient',
        open ? 'w-64' : 'w-16'
      )}
    >
      <div className="flex items-center justify-between p-4 border-b border-white/10">
        {open ? (
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg overflow-hidden ring-1 ring-white/20 shadow">
              <img src="/brand/icone.svg" alt="Ícone Valor Agro" className="w-full h-full object-cover" />
            </div>
            <div>
              <p className="text-sm font-bold leading-none">Valor Agro</p>
              <p className="text-xs text-[#b7cabd] leading-none mt-0.5">Gestão de Consórcios</p>
            </div>
          </div>
        ) : (
          <div className="w-8 h-8 rounded-lg overflow-hidden mx-auto ring-1 ring-white/20 shadow">
            <img src="/brand/icone.svg" alt="Ícone Valor Agro" className="w-full h-full object-cover" />
          </div>
        )}

        <button onClick={onToggle} className="ml-auto p-1 rounded-lg hover:bg-white/10 transition-colors">
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
              <button
                type="button"
                onClick={() => setCadastrosOpen((v) => !v)}
                className="w-full px-3 pt-4 pb-1 text-xs font-semibold uppercase tracking-wider text-[#b7cabd] flex items-center justify-between hover:text-white transition-colors"
              >
                <span>Cadastros</span>
                {cadastrosOpen ? <ChevronLeft className="w-3.5 h-3.5 rotate-[-90deg]" /> : <ChevronLeft className="w-3.5 h-3.5 rotate-180" />}
              </button>
            )}
            {!open && <div className="border-t border-white/10 my-2" />}

            {cadastrosOpen && (
              <>
                {equipeNav.map((item) => (
                  <SidebarItem key={item.to} item={item} open={open} />
                ))}

                {open && (
                  <button
                    type="button"
                    onClick={() => setGeraisOpen((v) => !v)}
                    className={cn(
                      'w-full mt-1 px-3 py-2 rounded-lg text-xs font-semibold uppercase tracking-wider flex items-center justify-between transition-colors',
                      isGeraisRoute ? 'bg-white/10 text-white' : 'text-[#b7cabd] hover:bg-white/5 hover:text-white'
                    )}
                  >
                    <span>Gerais</span>
                    {geraisOpen ? <ChevronLeft className="w-3.5 h-3.5 rotate-[-90deg]" /> : <ChevronLeft className="w-3.5 h-3.5 rotate-180" />}
                  </button>
                )}

                {geraisOpen && (
                  <div className={cn('space-y-1', open ? 'ml-3' : '')}>
                    {geraisNav.map((item) => (
                      <SidebarItem key={item.to} item={item} open={open} compact={open} />
                    ))}
                  </div>
                )}

                {open && (
                  <button
                    type="button"
                    onClick={() => setAdministrativoOpen((v) => !v)}
                    className={cn(
                      'w-full mt-1 px-3 py-2 rounded-lg text-xs font-semibold uppercase tracking-wider flex items-center justify-between transition-colors',
                      isAdministrativoRoute
                        ? 'bg-white/10 text-white'
                        : 'text-[#b7cabd] hover:bg-white/5 hover:text-white'
                    )}
                  >
                    <span>Administrativo</span>
                    {administrativoOpen ? <ChevronLeft className="w-3.5 h-3.5 rotate-[-90deg]" /> : <ChevronLeft className="w-3.5 h-3.5 rotate-180" />}
                  </button>
                )}

                {administrativoOpen && (
                  <div className={cn('space-y-1', open ? 'ml-3' : '')}>
                    {administrativoNav.map((item) => (
                      <SidebarItem key={item.to} item={item} open={open} compact={open} />
                    ))}
                  </div>
                )}
              </>
            )}
          </>
        )}

        {isCoordenador() && (
          <>
            {open && (
              <button
                type="button"
                onClick={() => setCadastrosOpen((v) => !v)}
                className="w-full px-3 pt-4 pb-1 text-xs font-semibold uppercase tracking-wider text-[#b7cabd] flex items-center justify-between hover:text-white transition-colors"
              >
                <span>Cadastros</span>
                {cadastrosOpen ? <ChevronLeft className="w-3.5 h-3.5 rotate-[-90deg]" /> : <ChevronLeft className="w-3.5 h-3.5 rotate-180" />}
              </button>
            )}
            {!open && <div className="border-t border-white/10 my-2" />}
            {cadastrosOpen &&
              coordenadorNav.map((item) => <SidebarItem key={item.to} item={item} open={open} />)}
          </>
        )}

        {isDev() && (
          <>
            {open && (
              <p className="px-3 pt-4 pb-1 text-xs font-semibold uppercase tracking-wider text-[#b7cabd]">
                Desenvolvedor
              </p>
            )}
            {!open && <div className="border-t border-white/10 my-2" />}
            {devOnlyNav.map((item) => (
              <SidebarItem key={item.to} item={item} open={open} />
            ))}
          </>
        )}

        {user?.perfil === 'supervisor' && (
          <>
            {open && (
              <p className="px-3 pt-4 pb-1 text-xs font-semibold uppercase tracking-wider text-[#b7cabd]">
                Sistema
              </p>
            )}
            {!open && <div className="border-t border-white/10 my-2" />}
            {supervisorInfoNav.map((item) => (
              <SidebarItem key={item.to} item={item} open={open} />
            ))}
          </>
        )}
      </nav>

      {open && (
        <div className="p-4 border-t border-white/10">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-full bg-[#66e24d] text-[#061007] flex items-center justify-center text-sm font-bold">
              {user?.nome?.charAt(0)?.toUpperCase() || 'U'}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium truncate">{user?.nome}</p>
              <p className="text-xs text-[#b7cabd] capitalize">{user?.perfil}</p>
            </div>
          </div>
        </div>
      )}
    </aside>
  )
}

function SidebarItem({
  item,
  open,
  compact = false,
}: {
  item: NavItem
  open: boolean
  compact?: boolean
}) {
  const Icon = item.icon
  return (
    <NavLink
      to={item.to}
      className={({ isActive }) =>
        cn(
          'flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all',
          compact && 'py-2 text-[13px]',
          isActive
            ? 'bg-[#66e24d] text-[#061007] shadow-sm'
            : 'text-[#e4ece7] hover:bg-white/10 hover:text-white'
        )
      }
      title={!open ? item.label : undefined}
    >
      <Icon className={cn('w-5 h-5 flex-shrink-0', compact && 'w-4 h-4')} />
      {open && <span className="truncate">{item.label}</span>}
    </NavLink>
  )
}
