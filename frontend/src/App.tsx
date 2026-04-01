import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { Toaster } from 'react-hot-toast'
import { AuthContext, useAuthProvider } from './hooks/useAuth'
import Layout from './components/Layout'
import LoginPage from './pages/Login'
import DashboardPage from './pages/Dashboard'
import VendasPage from './pages/Vendas'
import NovaVendaPage from './pages/NovaVenda'
import ComissoesPage from './pages/Comissoes'
import RelatoriosPage from './pages/Relatorios'
import ClientesPage from './pages/Clientes'
import EmpresaPage from './pages/Empresa'
import LicencasPage from './pages/Licencas'
import CoordenadoresPage from './pages/cadastros/Coordenadores'
import VendedoresPage from './pages/cadastros/Vendedores'
import SupervisoresPage from './pages/cadastros/Supervisores'
import ConsorciosPage from './pages/cadastros/Consorcios'
import AssembleiasPage from './pages/cadastros/Assembleias'
import FaixasPage from './pages/cadastros/Faixas'
import UsuariosPage from './pages/cadastros/Usuarios'

function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const token = localStorage.getItem('access_token')
  if (!token) return <Navigate to="/login" replace />
  return <>{children}</>
}

function AppRoutes() {
  const authValue = useAuthProvider()

  return (
    <AuthContext.Provider value={authValue}>
      <Toaster position="top-right" toastOptions={{ duration: 4000 }} />
      <Routes>
        <Route path="/login" element={<LoginPage />} />
        <Route
          path="/"
          element={
            <ProtectedRoute>
              <Layout />
            </ProtectedRoute>
          }
        >
          <Route index element={<Navigate to="/dashboard" replace />} />
          <Route path="dashboard" element={<DashboardPage />} />
          <Route path="vendas" element={<VendasPage />} />
          <Route path="vendas/nova" element={<NovaVendaPage />} />
          <Route path="comissoes" element={<ComissoesPage />} />
          <Route path="relatorios" element={<RelatoriosPage />} />
          <Route path="clientes" element={<ClientesPage />} />
          <Route path="empresa" element={<EmpresaPage />} />
          <Route path="licencas" element={<LicencasPage />} />
          <Route path="cadastros/supervisores" element={<SupervisoresPage />} />
          <Route path="cadastros/coordenadores" element={<CoordenadoresPage />} />
          <Route path="cadastros/vendedores" element={<VendedoresPage />} />
          <Route path="cadastros/consorcios" element={<ConsorciosPage />} />
          <Route path="cadastros/assembleias" element={<AssembleiasPage />} />
          <Route path="cadastros/faixas" element={<FaixasPage />} />
          <Route path="cadastros/usuarios" element={<UsuariosPage />} />
        </Route>
        <Route path="*" element={<Navigate to="/dashboard" replace />} />
      </Routes>
    </AuthContext.Provider>
  )
}

export default function App() {
  return (
    <BrowserRouter>
      <AppRoutes />
    </BrowserRouter>
  )
}
