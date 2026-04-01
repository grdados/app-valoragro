import { useAuth } from './useAuth'

export function usePermission() {
  const { user, isDev, isSupervisor, isSupervisorOrAbove, isAdmin, isCoordenador, isVendedor } = useAuth()

  const canEdit = () => isSupervisorOrAbove()
  const canViewAll = () => isSupervisorOrAbove()
  const canViewTeam = () => isSupervisorOrAbove() || isCoordenador()
  const canCreate = () => isSupervisorOrAbove() || isCoordenador() || isVendedor()

  return { canEdit, canViewAll, canViewTeam, canCreate, isDev, isSupervisor, isSupervisorOrAbove, isAdmin, isCoordenador, isVendedor, user }
}
