import { useEffect, useState, useCallback } from 'react'
import { TrendingUp, DollarSign, Clock, CheckCircle, AlertCircle, Users, Award, Star } from 'lucide-react'
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, Legend
} from 'recharts'
import { dashboardsApi } from '../services/api'
import { useAuth } from '../hooks/useAuth'
import StatCard from '../components/StatCard'
import PageHeader from '../components/PageHeader'
import { formatCurrency, formatDate } from '../lib/utils'
import toast from 'react-hot-toast'
import type { DashboardAdmin, DashboardCoordenador, DashboardVendedor } from '../types'

type DashData = DashboardAdmin | DashboardCoordenador | DashboardVendedor | null

const PIE_COLORS = { pendente: '#f59e0b', pago: '#10b981', vencido: '#ef4444' }
const CHART_COLOR = '#1B4F8C'

function DateFilter({ value, onChange }: { value: { inicio: string; fim: string }; onChange: (v: { inicio: string; fim: string }) => void }) {
  return (
    <div className="flex gap-2 items-center">
      <input type="date" value={value.inicio} onChange={(e) => onChange({ ...value, inicio: e.target.value })} className="input w-40 text-sm" />
      <span className="text-gray-400 text-sm">até</span>
      <input type="date" value={value.fim} onChange={(e) => onChange({ ...value, fim: e.target.value })} className="input w-40 text-sm" />
    </div>
  )
}

export default function DashboardPage() {
  const { user } = useAuth()
  const [data, setData] = useState<DashData>(null)
  const [loading, setLoading] = useState(true)
  const today = new Date()
  const sixMonthsAgo = new Date(today.getFullYear(), today.getMonth() - 5, 1)
  const [periodo, setPeriodo] = useState({
    inicio: sixMonthsAgo.toISOString().slice(0, 10),
    fim: today.toISOString().slice(0, 10),
  })

  const fetchData = useCallback(async () => {
    setLoading(true)
    try {
      const params = { data_inicio: periodo.inicio, data_fim: periodo.fim }
      const res = await dashboardsApi.admin(params)
      setData(res.data)
    } catch {
      toast.error('Erro ao carregar dashboard')
    } finally {
      setLoading(false)
    }
  }, [user?.perfil, periodo])

  useEffect(() => {
    fetchData()
    const interval = setInterval(fetchData, 30000)
    return () => clearInterval(interval)
  }, [fetchData])

  if (loading && !data) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin w-8 h-8 border-4 border-[#1B4F8C] border-t-transparent rounded-full" />
      </div>
    )
  }

  const statusData = data?.comissoes_por_status
    ? Object.entries(data.comissoes_por_status).map(([k, v]) => ({
        name: k === 'pendente' ? 'Pendente' : k === 'pago' ? 'Pago' : 'Vencido',
        value: v.total,
        qtd: v.qtd,
        fill: PIE_COLORS[k as keyof typeof PIE_COLORS] || '#6b7280',
      }))
    : []

  const adminData = data as DashboardAdmin
  const vendMesData = (data as DashboardVendedor | DashboardAdmin)?.vendas_por_mes || []
  const mesChartData = vendMesData.map((m) => ({
    mes: m.mes ? new Date(m.mes).toLocaleDateString('pt-BR', { month: 'short', year: '2-digit' }) : '',
    total: m.total,
    qtd: m.qtd,
  }))

  return (
    <div className="space-y-6">
      <PageHeader
        title="Dashboard"
        subtitle={`Bem-vindo, ${user?.nome}!`}
        actions={<DateFilter value={periodo} onChange={setPeriodo} />}
      />

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title="Total Vendido"
          value={formatCurrency(data?.total_vendido || 0)}
          icon={TrendingUp}
          color="blue"
        />
        <StatCard
          title="Total Comissões"
          value={formatCurrency(data?.total_comissoes || 0)}
          icon={DollarSign}
          color="purple"
        />
        <StatCard
          title="Comissões Pagas"
          value={formatCurrency(data?.comissoes_por_status?.pago?.total || 0)}
          subtitle={`${data?.comissoes_por_status?.pago?.qtd || 0} parcelas`}
          icon={CheckCircle}
          color="green"
        />
        <StatCard
          title="Comissões Vencidas"
          value={formatCurrency(data?.comissoes_por_status?.vencido?.total || 0)}
          subtitle={`${data?.comissoes_por_status?.vencido?.qtd || 0} parcelas`}
          icon={AlertCircle}
          color="red"
        />
      </div>

      {(adminData?.total_contemplados !== undefined) && (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <StatCard
            title="Valor Total Contemplado"
            value={formatCurrency(adminData?.total_contemplados || 0)}
            icon={Star}
            color="green"
          />
          <StatCard
            title="Consórcios Contemplados"
            value={`${adminData?.qtd_contemplados || 0} contratos`}
            icon={Award}
            color="purple"
          />
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {mesChartData.length > 0 && (
          <div className="card p-6 lg:col-span-2">
            <h3 className="text-base font-semibold text-gray-900 mb-4">Vendas por Mês</h3>
            <ResponsiveContainer width="100%" height={250}>
              <BarChart data={mesChartData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                <XAxis dataKey="mes" tick={{ fontSize: 12 }} />
                <YAxis tickFormatter={(v) => `R$${(v / 1000).toFixed(0)}k`} tick={{ fontSize: 12 }} />
                <Tooltip formatter={(v: number) => [formatCurrency(v), 'Total']} />
                <Bar dataKey="total" fill={CHART_COLOR} radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        )}

        {statusData.length > 0 && (
          <div className="card p-6">
            <h3 className="text-base font-semibold text-gray-900 mb-4">Status das Comissões</h3>
            <ResponsiveContainer width="100%" height={250}>
              <PieChart>
                <Pie data={statusData} cx="50%" cy="50%" innerRadius={60} outerRadius={90} dataKey="value" label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`} labelLine={false} fontSize={11}>
                  {statusData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.fill} />
                  ))}
                </Pie>
                <Tooltip formatter={(v: number) => formatCurrency(v)} />
              </PieChart>
            </ResponsiveContainer>
          </div>
        )}
      </div>

      {adminData && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {adminData.vendas_por_coban?.length > 0 && (
            <div className="card p-6">
              <h3 className="text-base font-semibold text-gray-900 mb-4">Vendas por COBAN</h3>
              <ResponsiveContainer width="100%" height={200}>
                <BarChart data={adminData.vendas_por_coban} layout="vertical">
                  <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                  <XAxis type="number" tickFormatter={(v) => `R$${(v / 1000).toFixed(0)}k`} tick={{ fontSize: 12 }} />
                  <YAxis dataKey="coban__sigla" type="category" tick={{ fontSize: 12 }} width={50} />
                  <Tooltip formatter={(v: number) => [formatCurrency(v), 'Total']} />
                  <Bar dataKey="total" fill="#2E86AB" radius={[0, 4, 4, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          )}

          {adminData.ranking_vendedores?.length > 0 && (
            <div className="card p-6">
              <h3 className="text-base font-semibold text-gray-900 mb-4 flex items-center gap-2">
                <Award className="w-5 h-5 text-amber-500" />
                Ranking de Vendedores
              </h3>
              <div className="space-y-3">
                {adminData.ranking_vendedores.slice(0, 5).map((v, i) => (
                  <div key={v.vendedor__id} className="flex items-center gap-3">
                    <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold text-white ${i === 0 ? 'bg-amber-500' : i === 1 ? 'bg-gray-400' : i === 2 ? 'bg-orange-600' : 'bg-gray-300'}`}>
                      {i + 1}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-900 truncate">{v.vendedor__nome}</p>
                      <p className="text-xs text-gray-500">{v.qtd_vendas} vendas</p>
                    </div>
                    <p className="text-sm font-semibold text-[#1B4F8C]">{formatCurrency(v.total_vendas)}</p>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

    </div>
  )
}
