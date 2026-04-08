import { useCallback, useEffect, useMemo, useState } from 'react'
import { TrendingUp, DollarSign, CheckCircle, AlertCircle, Award, Star } from 'lucide-react'
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Legend,
  LineChart,
  Line,
} from 'recharts'
import toast from 'react-hot-toast'

import { dashboardsApi } from '../services/api'
import { useAuth } from '../hooks/useAuth'
import StatCard from '../components/StatCard'
import PageHeader from '../components/PageHeader'
import { formatCurrency } from '../lib/utils'
import type { DashboardAdmin, DashboardCoordenador, DashboardVendedor } from '../types'

type DashData = DashboardAdmin | DashboardCoordenador | DashboardVendedor | null

const PIE_COLORS = { pendente: '#f59e0b', pago: '#10b981', vencido: '#ef4444' }
const CHART_COLOR = '#1B4F8C'
const PRODUCT_LINE_COLORS = ['#1B4F8C', '#10b981', '#f59e0b', '#ef4444', '#7c3aed', '#0891b2', '#ea580c']

function DateFilter({
  value,
  onChange,
}: {
  value: { inicio: string; fim: string }
  onChange: (v: { inicio: string; fim: string }) => void
}) {
  return (
    <div className="flex gap-2 items-center">
      <input
        type="date"
        value={value.inicio}
        onChange={(e) => onChange({ ...value, inicio: e.target.value })}
        className="input w-40 text-sm"
      />
      <span className="text-gray-400 text-sm">até</span>
      <input
        type="date"
        value={value.fim}
        onChange={(e) => onChange({ ...value, fim: e.target.value })}
        className="input w-40 text-sm"
      />
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
  }, [periodo])

  useEffect(() => {
    fetchData()
    const interval = setInterval(fetchData, 30000)
    return () => clearInterval(interval)
  }, [fetchData, user?.perfil])

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

  const rankingVendasChartData = (adminData?.ranking_vendedores || []).map((item) => ({
    vendedor: item.vendedor__nome,
    total: item.total_vendas,
    qtd: item.qtd_vendas,
  }))

  const vendasPorProduto = (adminData?.vendas_por_tipo || []).map((item) => ({
    produto: item.tipo_bem__nome,
    total: item.total,
    qtd: item.qtd,
  }))

  const vendasPorConsorcio = (adminData?.vendas_por_consorcio || []).map((item) => ({
    consorcio: item.consorcio__nome,
    total: item.total,
    qtd: item.qtd,
  }))

  const vendasMensalPorProdutoPivot = useMemo(() => {
    const rows = (adminData?.vendas_mensal_por_produto || []).slice()
    if (!rows.length) return { data: [] as Record<string, unknown>[], produtos: [] as string[] }

    const produtoSet = new Set<string>()
    const byMonth = new Map<string, Record<string, unknown>>()

    rows.forEach((row) => {
      const mesIso = row.mes || ''
      if (!mesIso) return
      produtoSet.add(row.produto)
      if (!byMonth.has(mesIso)) {
        byMonth.set(mesIso, {
          mesIso,
          mesLabel: new Date(mesIso).toLocaleDateString('pt-BR', { month: 'short', year: '2-digit' }),
        })
      }
      const current = byMonth.get(mesIso) as Record<string, unknown>
      current[row.produto] = row.total
    })

    const produtos = Array.from(produtoSet)
    const dataPivot = Array.from(byMonth.values())
      .sort((a, b) => String(a.mesIso).localeCompare(String(b.mesIso)))
      .map((entry) => {
        const normalized = { ...entry }
        produtos.forEach((produto) => {
          if (normalized[produto] === undefined) normalized[produto] = 0
        })
        return normalized
      })

    return { data: dataPivot, produtos }
  }, [adminData?.vendas_mensal_por_produto])

  return (
    <div className="space-y-6">
      <PageHeader
        title="Dashboard"
        subtitle={`Bem-vindo, ${user?.nome}!`}
        actions={<DateFilter value={periodo} onChange={setPeriodo} />}
      />

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard title="Total Vendido" value={formatCurrency(data?.total_vendido || 0)} icon={TrendingUp} color="blue" />
        <StatCard title="Total Comissões" value={formatCurrency(data?.total_comissoes || 0)} icon={DollarSign} color="purple" />
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

      {adminData?.total_contemplados !== undefined && (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <StatCard title="Valor Total Contemplado" value={formatCurrency(adminData.total_contemplados || 0)} icon={Star} color="green" />
          <StatCard title="Consórcios Contemplados" value={`${adminData.qtd_contemplados || 0} contratos`} icon={Award} color="purple" />
        </div>
      )}

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        {mesChartData.length > 0 && (
          <div className="card p-6 xl:col-span-2">
            <h3 className="text-base font-semibold text-gray-900 mb-4">Vendas por Mês</h3>
            <ResponsiveContainer width="100%" height={260}>
              <BarChart data={mesChartData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                <XAxis dataKey="mes" tick={{ fontSize: 12 }} />
                <YAxis tickFormatter={(v) => `R$${(Number(v) / 1000).toFixed(0)}k`} tick={{ fontSize: 12 }} />
                <Tooltip formatter={(v: number) => [formatCurrency(v), 'Total']} />
                <Bar dataKey="total" fill={CHART_COLOR} radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        )}

        {statusData.length > 0 && (
          <div className="card p-6">
            <h3 className="text-base font-semibold text-gray-900 mb-4">Status das Comissões</h3>
            <ResponsiveContainer width="100%" height={260}>
              <PieChart>
                <Pie
                  data={statusData}
                  cx="50%"
                  cy="50%"
                  innerRadius={55}
                  outerRadius={90}
                  dataKey="value"
                  label={({ name, percent }) => `${name} ${((percent || 0) * 100).toFixed(0)}%`}
                  labelLine={false}
                  fontSize={11}
                >
                  {statusData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.fill} />
                  ))}
                </Pie>
                <Tooltip formatter={(v: number) => formatCurrency(v)} />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          </div>
        )}
      </div>

      {rankingVendasChartData.length > 0 && (
        <div className="card p-6">
          <h3 className="text-base font-semibold text-gray-900 mb-4">Ranking de Vendas por Vendedor</h3>
          <ResponsiveContainer width="100%" height={320}>
            <BarChart data={rankingVendasChartData.slice(0, 10)} layout="vertical" margin={{ left: 20, right: 20 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
              <XAxis type="number" tickFormatter={(v) => `R$${(Number(v) / 1000).toFixed(0)}k`} tick={{ fontSize: 12 }} />
              <YAxis dataKey="vendedor" type="category" width={180} tick={{ fontSize: 12 }} />
              <Tooltip formatter={(v: number) => [formatCurrency(v), 'Total vendido']} />
              <Bar dataKey="total" fill="#2563eb" radius={[0, 6, 6, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}

      {vendasMensalPorProdutoPivot.data.length > 0 && (
        <div className="card p-6">
          <h3 className="text-base font-semibold text-gray-900 mb-4">Vendas Mensais por Produto ao Longo do Ano</h3>
          <ResponsiveContainer width="100%" height={340}>
            <LineChart data={vendasMensalPorProdutoPivot.data}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
              <XAxis dataKey="mesLabel" tick={{ fontSize: 12 }} />
              <YAxis tickFormatter={(v) => `R$${(Number(v) / 1000).toFixed(0)}k`} tick={{ fontSize: 12 }} />
              <Tooltip formatter={(v: number) => formatCurrency(v)} />
              <Legend />
              {vendasMensalPorProdutoPivot.produtos.map((produto, index) => (
                <Line
                  key={produto}
                  type="monotone"
                  dataKey={produto}
                  stroke={PRODUCT_LINE_COLORS[index % PRODUCT_LINE_COLORS.length]}
                  strokeWidth={2}
                  dot={{ r: 2 }}
                  activeDot={{ r: 4 }}
                />
              ))}
            </LineChart>
          </ResponsiveContainer>
        </div>
      )}

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
        {vendasPorProduto.length > 0 && (
          <div className="card p-6">
            <h3 className="text-base font-semibold text-gray-900 mb-4">Vendas por Produto</h3>
            <ResponsiveContainer width="100%" height={280}>
              <BarChart data={vendasPorProduto}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                <XAxis dataKey="produto" tick={{ fontSize: 12 }} />
                <YAxis tickFormatter={(v) => `R$${(Number(v) / 1000).toFixed(0)}k`} tick={{ fontSize: 12 }} />
                <Tooltip formatter={(v: number) => [formatCurrency(v), 'Total']} />
                <Bar dataKey="total" fill="#0d9488" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        )}

        {adminData?.vendas_por_coban?.length > 0 && (
          <div className="card p-6">
            <h3 className="text-base font-semibold text-gray-900 mb-4">Vendas por COBAN</h3>
            <ResponsiveContainer width="100%" height={280}>
              <BarChart data={adminData.vendas_por_coban} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                <XAxis type="number" tickFormatter={(v) => `R$${(Number(v) / 1000).toFixed(0)}k`} tick={{ fontSize: 12 }} />
                <YAxis dataKey="coban__sigla" type="category" tick={{ fontSize: 12 }} width={60} />
                <Tooltip formatter={(v: number) => [formatCurrency(v), 'Total']} />
                <Bar dataKey="total" fill="#2E86AB" radius={[0, 4, 4, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        )}
      </div>

      {vendasPorConsorcio.length > 0 && (
        <div className="card p-6">
          <h3 className="text-base font-semibold text-gray-900 mb-4">Vendas por Consórcio</h3>
          <ResponsiveContainer width="100%" height={320}>
            <BarChart data={vendasPorConsorcio.slice(0, 12)} layout="vertical">
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
              <XAxis type="number" tickFormatter={(v) => `R$${(Number(v) / 1000).toFixed(0)}k`} tick={{ fontSize: 12 }} />
              <YAxis dataKey="consorcio" type="category" width={220} tick={{ fontSize: 12 }} />
              <Tooltip formatter={(v: number) => [formatCurrency(v), 'Total']} />
              <Bar dataKey="total" fill="#7c3aed" radius={[0, 6, 6, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}
    </div>
  )
}
