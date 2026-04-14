import { useEffect, useState, useCallback } from 'react'
import { comissoesApi, vendedoresApi, coordenadoresApi } from '../services/api'
import { useAuth } from '../hooks/useAuth'
import PageHeader from '../components/PageHeader'
import DataTable from '../components/DataTable'
import Modal from '../components/Modal'
import { formatCurrency, formatDate, formatDateTime, getStatusBadgeClass, getStatusLabel } from '../lib/utils'
import toast from 'react-hot-toast'
import { FileDown } from 'lucide-react'
import type { ParcelaComissao, Vendedor, Coordenador } from '../types'

const STATUS_OPTIONS = [
  { value: '', label: 'Todos os status' },
  { value: 'pendente', label: 'Pendente' },
  { value: 'pago', label: 'Pago' },
  { value: 'vencido', label: 'Vencido' },
]

const STATUS_BANCO_BADGE: Record<string, string> = {
  ok: 'badge-success',
  inadimplente: 'badge-error',
}

export default function ComissoesPage() {
  const { user } = useAuth()
  const canEdit = user?.perfil === 'dev' || user?.perfil === 'supervisor' || user?.perfil === 'coordenador'
  const [parcelas, setParcelas] = useState<ParcelaComissao[]>([])
  const [loading, setLoading] = useState(true)
  const [selected, setSelected] = useState<ParcelaComissao | null>(null)
  const [alterandoStatus, setAlterandoStatus] = useState(false)
  const [novoStatus, setNovoStatus] = useState('')
  const [novoStatusBanco, setNovoStatusBanco] = useState('')
  const [observacao, setObservacao] = useState('')
  const [vendedores, setVendedores] = useState<Vendedor[]>([])
  const [coordenadores, setCoordenadores] = useState<Coordenador[]>([])
  const [filtros, setFiltros] = useState({ vendedor: '', coordenador: '', status: '', data_inicio: '', data_fim: '' })

  const fetchParcelas = useCallback(async (params?: Record<string, string>) => {
    setLoading(true)
    try {
      const f = params || filtros
      const activeFilters = Object.fromEntries(Object.entries(f).filter(([, v]) => v !== ''))
      const res = await comissoesApi.list(activeFilters)
      setParcelas(res.data.results || res.data)
    } catch {
      toast.error('Erro ao carregar comissões')
    } finally {
      setLoading(false)
    }
  }, [filtros])

  useEffect(() => {
    if (user?.perfil === 'dev' || user?.perfil === 'supervisor') {
      Promise.all([vendedoresApi.list(), coordenadoresApi.list()])
        .then(([v, c]) => {
          setVendedores(v.data.results || v.data)
          setCoordenadores(c.data.results || c.data)
        })
    } else if (user?.perfil === 'coordenador') {
      vendedoresApi.list().then((v) => setVendedores(v.data.results || v.data))
    }
    fetchParcelas()
  }, [])

  const handleFiltrar = () => fetchParcelas(filtros)

  const openSelected = (p: ParcelaComissao) => {
    setSelected(p)
    setNovoStatus(p.status)
    setNovoStatusBanco(p.status_contrato_banco)
    setObservacao('')
  }

  const handleAlterarStatus = async () => {
    if (!selected || !novoStatus) return
    setAlterandoStatus(true)
    try {
      await comissoesApi.alterarStatus(selected.id, novoStatus, observacao, novoStatusBanco || undefined)
      toast.success('Status atualizado!')
      setSelected(null)
      setNovoStatus('')
      setNovoStatusBanco('')
      setObservacao('')
      fetchParcelas()
    } catch {
      toast.error('Erro ao alterar status')
    } finally {
      setAlterandoStatus(false)
    }
  }

  const handleRecibo = async (parcela: ParcelaComissao) => {
    try {
      const res = await comissoesApi.recibo(parcela.id)
      const url = window.URL.createObjectURL(new Blob([res.data], { type: 'application/pdf' }))
      const a = document.createElement('a')
      a.href = url
      a.download = `recibo-${parcela.venda_contrato}-p${parcela.numero_parcela}.pdf`
      a.click()
      window.URL.revokeObjectURL(url)
    } catch {
      toast.error('Erro ao gerar recibo')
    }
  }

  const columns = [
    { key: 'venda_contrato', header: 'Contrato' },
    { key: 'cliente_nome', header: 'Cliente' },
    { key: 'perfil_comissao_display', header: 'Perfil Comissão' },
    { key: 'vendedor_nome', header: 'Vendedor' },
    ...(user?.perfil !== 'vendedor' ? [{ key: 'coordenador_nome', header: 'Coordenador' }] : []),
    { key: 'numero_parcela', header: 'Parcela' },
    { key: 'data_vencimento', header: 'Vencimento', render: (row: ParcelaComissao) => formatDate(row.data_vencimento) },
    { key: 'valor', header: 'Valor', render: (row: ParcelaComissao) => formatCurrency(row.valor) },
    {
      key: 'status', header: 'Status',
      render: (row: ParcelaComissao) => <span className={getStatusBadgeClass(row.status)}>{getStatusLabel(row.status)}</span>
    },
    {
      key: 'status_contrato_banco', header: 'Contrato Banco',
      render: (row: ParcelaComissao) => (
        <span className={`badge ${STATUS_BANCO_BADGE[row.status_contrato_banco] || 'badge-secondary'}`}>
          {row.status_contrato_banco === 'ok' ? 'OK' : 'Inadimplente'}
        </span>
      )
    },
  ]

  return (
    <div className="space-y-6">
      <PageHeader
        title="Comissões"
        subtitle="Gestão de parcelas de comissão"
      />

      <div className="card p-4">
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
          {(user?.perfil === 'dev' || user?.perfil === 'supervisor') && (
            <select value={filtros.coordenador} onChange={e => setFiltros(f => ({ ...f, coordenador: e.target.value }))} className="input">
              <option value="">Todos coordenadores</option>
              {coordenadores.map(c => <option key={c.id} value={c.id}>{c.nome}</option>)}
            </select>
          )}
          {user?.perfil !== 'vendedor' && (
            <select value={filtros.vendedor} onChange={e => setFiltros(f => ({ ...f, vendedor: e.target.value }))} className="input">
              <option value="">Todos vendedores</option>
              {vendedores.map(v => <option key={v.id} value={v.id}>{v.nome}</option>)}
            </select>
          )}
          <select value={filtros.status} onChange={e => setFiltros(f => ({ ...f, status: e.target.value }))} className="input">
            {STATUS_OPTIONS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
          </select>
          <input type="date" value={filtros.data_inicio} onChange={e => setFiltros(f => ({ ...f, data_inicio: e.target.value }))} className="input" />
          <input type="date" value={filtros.data_fim} onChange={e => setFiltros(f => ({ ...f, data_fim: e.target.value }))} className="input" />
          <button onClick={handleFiltrar} className="btn-primary">Filtrar</button>
        </div>
      </div>

      <DataTable
        columns={columns}
        data={parcelas}
        keyField="id"
        loading={loading}
        searchable
        searchFields={['venda_contrato', 'vendedor_nome', 'cliente_nome']}
        emptyMessage="Nenhuma parcela encontrada"
        actions={(row) => (
          <div className="flex gap-1">
            {canEdit && (
              <button onClick={() => openSelected(row)} className="btn-secondary py-1.5 px-3 text-xs">
                Editar
              </button>
            )}
            {row.status === 'pago' && (
              <button onClick={() => handleRecibo(row)} className="btn-secondary py-1.5 px-3 text-xs" title="Emitir Recibo">
                <FileDown className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
        )}
      />

      <Modal open={!!selected} onClose={() => setSelected(null)} title="Alterar Status da Parcela" size="md">
        {selected && (
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-3 text-sm">
              <div><p className="text-gray-500">Contrato</p><p className="font-medium">{selected.venda_contrato}</p></div>
              <div><p className="text-gray-500">Parcela</p><p className="font-medium">{selected.numero_parcela}</p></div>
              <div><p className="text-gray-500">Vencimento</p><p className="font-medium">{formatDate(selected.data_vencimento)}</p></div>
              <div><p className="text-gray-500">Valor</p><p className="font-medium text-emerald-600">{formatCurrency(selected.valor)}</p></div>
            </div>

            <div>
              <label className="label">Status da Comissão</label>
              <select value={novoStatus} onChange={e => setNovoStatus(e.target.value)} className="input">
                <option value="pendente">Pendente</option>
                <option value="pago">Pago</option>
                <option value="vencido">Vencido</option>
              </select>
            </div>

            <div>
              <label className="label">Status Contrato Banco</label>
              <select value={novoStatusBanco} onChange={e => setNovoStatusBanco(e.target.value)} className="input">
                <option value="ok">OK</option>
                <option value="inadimplente">Inadimplente</option>
              </select>
            </div>

            <div>
              <label className="label">Observação</label>
              <textarea value={observacao} onChange={e => setObservacao(e.target.value)} rows={2} className="input" placeholder="Opcional..." />
            </div>

            {selected.logs && selected.logs.length > 0 && (
              <div>
                <p className="label mb-2">Histórico</p>
                <div className="space-y-1 max-h-32 overflow-y-auto">
                  {selected.logs.map(log => (
                    <div key={log.id} className="text-xs text-gray-500 flex gap-2">
                      <span>{formatDateTime(log.data_hora)}</span>
                      <span className="font-medium">{log.status_anterior} → {log.status_novo}</span>
                      {log.observacao && <span>— {log.observacao}</span>}
                    </div>
                  ))}
                </div>
              </div>
            )}

            <div className="flex justify-end gap-3 pt-2">
              <button onClick={() => setSelected(null)} className="btn-secondary">Cancelar</button>
              <button onClick={handleAlterarStatus} disabled={alterandoStatus} className="btn-primary">
                {alterandoStatus ? 'Salvando...' : 'Confirmar'}
              </button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  )
}
