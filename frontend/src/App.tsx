import { BrowserRouter, Routes, Route, Navigate, useLocation } from 'react-router-dom'
import { Toaster } from 'react-hot-toast'
import { AuthContext, useAuthProvider } from './hooks/useAuth'
import Layout from './components/Layout'
import LandingPage from './pages/Landing'
import LoginPage from './pages/Login'
import DashboardPage from './pages/Dashboard'
import VendasPage from './pages/Vendas'
import NovaVendaPage from './pages/NovaVenda'
import ComissoesPage from './pages/Comissoes'
import RelatoriosPage from './pages/Relatorios'
import ClientesPage from './pages/Clientes'
import EmpresaPage from './pages/Empresa'
import LicencasPage from './pages/Licencas'
import BackupsPage from './pages/Backups'
import CoordenadoresPage from './pages/cadastros/Coordenadores'
import VendedoresPage from './pages/cadastros/Vendedores'
import SupervisoresPage from './pages/cadastros/Supervisores'
import ConsorciosPage from './pages/cadastros/Consorcios'
import AssembleiasPage from './pages/cadastros/Assembleias'
import FaixasPage from './pages/cadastros/Faixas'
import UsuariosPage from './pages/cadastros/Usuarios'
import CobansPage from './pages/cadastros/Cobans'
import TiposBemPage from './pages/cadastros/TiposBem'

function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const token = localStorage.getItem('access_token')
  if (!token) return <Navigate to="/login" replace />
  return <>{children}</>
}

function AppRoutes() {
  const authValue = useAuthProvider()
  const location = useLocation()
  const isPainel = location.pathname.startsWith('/painel')

  return (
    <AuthContext.Provider value={authValue}>
      <Toaster
        position="top-left"
        containerStyle={{
          top: 16,
          left: isPainel ? 'max(16px, 220px)' : 16,
        }}
        toastOptions={{ duration: 4000 }}
      />
      <Routes>
        <Route path="/" element={<LandingPage />} />
        <Route path="/login" element={<LoginPage />} />
        <Route
          path="/painel"
          element={
            <ProtectedRoute>
              <Layout />
            </ProtectedRoute>
          }
        >
          <Route index element={<Navigate to="/painel/dashboard" replace />} />
          <Route path="dashboard" element={<DashboardPage />} />
          <Route path="vendas" element={<VendasPage />} />
          <Route path="vendas/nova" element={<NovaVendaPage />} />
          <Route path="comissoes" element={<ComissoesPage />} />
          <Route path="relatorios" element={<RelatoriosPage />} />
          <Route path="clientes" element={<ClientesPage />} />
          <Route path="empresa" element={<EmpresaPage />} />
          <Route path="backups" element={<BackupsPage />} />
          <Route path="licencas" element={<LicencasPage />} />
          <Route path="cadastros/supervisores" element={<SupervisoresPage />} />
          <Route path="cadastros/coordenadores" element={<CoordenadoresPage />} />
          <Route path="cadastros/vendedores" element={<VendedoresPage />} />
          <Route path="cadastros/consorcios" element={<ConsorciosPage />} />
          <Route path="cadastros/assembleias" element={<AssembleiasPage />} />
          <Route path="cadastros/cobans" element={<CobansPage />} />
          <Route path="cadastros/tipos-bem" element={<TiposBemPage />} />
          <Route path="cadastros/faixas" element={<FaixasPage />} />
          <Route path="cadastros/usuarios" element={<UsuariosPage />} />
        </Route>
        <Route path="/dashboard" element={<Navigate to="/painel/dashboard" replace />} />
        <Route path="/vendas" element={<Navigate to="/painel/vendas" replace />} />
        <Route path="/vendas/nova" element={<Navigate to="/painel/vendas/nova" replace />} />
        <Route path="/comissoes" element={<Navigate to="/painel/comissoes" replace />} />
        <Route path="/relatorios" element={<Navigate to="/painel/relatorios" replace />} />
        <Route path="/clientes" element={<Navigate to="/painel/clientes" replace />} />
        <Route path="/empresa" element={<Navigate to="/painel/empresa" replace />} />
        <Route path="/backups" element={<Navigate to="/painel/backups" replace />} />
        <Route path="/licencas" element={<Navigate to="/painel/licencas" replace />} />
        <Route path="/cadastros/supervisores" element={<Navigate to="/painel/cadastros/supervisores" replace />} />
        <Route path="/cadastros/coordenadores" element={<Navigate to="/painel/cadastros/coordenadores" replace />} />
        <Route path="/cadastros/vendedores" element={<Navigate to="/painel/cadastros/vendedores" replace />} />
        <Route path="/cadastros/consorcios" element={<Navigate to="/painel/cadastros/consorcios" replace />} />
        <Route path="/cadastros/assembleias" element={<Navigate to="/painel/cadastros/assembleias" replace />} />
        <Route path="/cadastros/cobans" element={<Navigate to="/painel/cadastros/cobans" replace />} />
        <Route path="/cadastros/tipos-bem" element={<Navigate to="/painel/cadastros/tipos-bem" replace />} />
        <Route path="/cadastros/faixas" element={<Navigate to="/painel/cadastros/faixas" replace />} />
        <Route path="/cadastros/usuarios" element={<Navigate to="/painel/cadastros/usuarios" replace />} />
        <Route path="*" element={<Navigate to="/" replace />} />
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
