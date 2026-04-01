import { useState, useEffect, createContext, useContext } from 'react'
import { authApi } from '../services/api'
import type { User } from '../types'

interface AuthContextType {
  user: User | null
  loading: boolean
  login: (username: string, password: string) => Promise<void>
  logout: () => void
  isDev: () => boolean
  isSupervisor: () => boolean
  isSupervisorOrAbove: () => boolean
  isAdmin: () => boolean
  isCoordenador: () => boolean
  isVendedor: () => boolean
}

export const AuthContext = createContext<AuthContextType>({} as AuthContextType)

export function useAuthProvider(): AuthContextType {
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const stored = localStorage.getItem('user_data')
    if (stored) {
      try {
        setUser(JSON.parse(stored))
      } catch {
        localStorage.clear()
      }
    }
    setLoading(false)
  }, [])

  const login = async (username: string, password: string) => {
    const { data } = await authApi.login(username, password)
    const userData: User = data
    localStorage.setItem('access_token', data.access)
    localStorage.setItem('refresh_token', data.refresh)
    localStorage.setItem('user_data', JSON.stringify(userData))
    setUser(userData)
  }

  const logout = () => {
    localStorage.clear()
    setUser(null)
  }

  const isDev = () => user?.perfil === 'dev'
  const isSupervisor = () => user?.perfil === 'supervisor'
  const isSupervisorOrAbove = () => user?.perfil === 'dev' || user?.perfil === 'supervisor'
  const isAdmin = () => isDev()
  const isCoordenador = () => user?.perfil === 'coordenador'
  const isVendedor = () => user?.perfil === 'vendedor'

  return { user, loading, login, logout, isDev, isSupervisor, isSupervisorOrAbove, isAdmin, isCoordenador, isVendedor }
}

export function useAuth() {
  return useContext(AuthContext)
}
