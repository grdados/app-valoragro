import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { Plus, Eye, Trash2 } from 'lucide-react'
import { vendasApi, comissoesApi } from '../services/api'
import { useAuth } from '../hooks/useAuth'
import PageHeader from '../components/PageHeader'
import DataTable from '../components/DataTable'
import Modal from '../components/Modal'
import { formatCurrency, formatDate, getStatusBadgeClass, getStatusLabel } from '../lib/utils'
import toast from 'react-hot-toast'
import type { Venda, ParcelaComissao } from '../types'

const STATUS_VENDA_BADGE: Record<string, string> = {
  a_contemplar: 'badge-warning',
  contemplado: 'badge-success',
  cancelada: 'badge-error',
}
const STATUS_VENDA_LABEL: Record<string, string> = {
  a_contemplar: 'A Contemplar',
  contemplado: 'Contemplado',
  cancelada: 'Cancelada',
}

export default function VendasPage() {
  const { user } = useAuth()
  const canEditStatus = user?.perfil === 'dev' || user?.perfil === 'supervisor' || user?.perfil === 'coordenador'
  const canDeleteVenda = user?.perfil === 'dev' || user?.perfil === 'supervisor'
  const [vendas, setVendas] = useState<Venda[]>([])
  const [loading, setLoading] = useState(true)
  const [selected, setSelected] = useState<Venda | null>(null)
  const [parcelas, setParcelas] = useState<ParcelaComissao[]>([])
  const [gerandoComissoes, setGerandoComissoes] = useState(false)
  const [alterandoStatus, setAlterandoStatus] = useState(false)
  const [vendaParaExcluir, setVendaParaExcluir] = useState<Venda | null>(null)
  const [comissoesPagas, setComissoesPagas] = useState(0)
  const [carregandoValidacaoExclusao, setCarregandoValidacaoExclusao] = useState(false)
  const [excluindoVenda, setExcluindoVenda] = useState(false)

  useEffect(() => { fetchVendas() }, [])

  const fetchVendas = async () => {
    try {
      const res = await vendasApi.list()
      setVendas(res.data.results || res.data)
    } catch {
      toast.error('Erro ao carregar vendas')
    } finally {
      setLoading(false)
    }
  }

  const openVenda = async (venda: Venda) => {
    setSelected(venda)
    try {
      const res = await comissoesApi.list({ venda: venda.id })
      setParcelas(res.data.results || res.data)
    } catch {
      setParcelas([])
    }
  }

  const handleGerarComissoes = async () => {
    if (!selected) return
    setGerandoComissoes(true)
    try {
      await comissoesApi.gerar(selected.id)
      const res = await comissoesApi.list({ venda: selected.id })
      setParcelas(res.data.results || res.data)
      toast.success('Comissões geradas com sucesso!')
      await fetchVendas()
    } catch (err: unknown) {
      const error = err as { response?: { data?: { detail?: string } } }
      toast.error(error?.response?.data?.detail || 'Erro ao gerar comissões')
    } finally {
      setGerandoComissoes(false)
    }
  }

  const handleAlterarStatus = async (novoStatus: string) => {
    if (!selected) return
    setAlterandoStatus(true)
    try {
      await vendasApi.alterarStatus(selected.id, novoStatus)
      toast.success('Status atualizado!')
      setSelected(prev => prev ? { ...prev, status: novoStatus as Venda['status'], status_display: STATUS_VENDA_LABEL[novoStatus] } : null)
      fetchVendas()
    } catch {
      toast.error('Erro ao alterar status')
    } finally {
      setAlterandoStatus(false)
    }
  }

  const handleSolicitarExclusao = async (venda: Venda) => {
    setVendaParaExcluir(venda)
    setCarregandoValidacaoExclusao(true)
    setComissoesPagas(0)
    try {
      const res = await comissoesApi.list({ venda: venda.id, status: 'pago' })
      const parcelasPagas = res.data.results || res.data || []
      setComissoesPagas(Array.isArray(parcelasPagas) ? parcelasPagas.length : 0)
    } catch {
      setComissoesPagas(0)
    } finally {
      setCarregandoValidacaoExclusao(false)
    }
  }

  const handleDeleteVenda = async () => {
    if (!vendaParaExcluir) return
    if (comissoesPagas > 0) {
      toast.error('Não é possível remover: há comissões pagas. Estorne os pagamentos antes de excluir.')
      return
    }
    setExcluindoVenda(true)
    try {
      await vendasApi.remove(vendaParaExcluir.id)
      toast.success('Venda removida com sucesso!')
      if (selected?.id === vendaParaExcluir.id) {
        setSelected(null)
        setParcelas([])
      }
      setVendaParaExcluir(null)
      await fetchVendas()
    } catch (err: unknown) {
      const error = err as { response?: { data?: { detail?: string } } }
      toast.error(error?.response?.data?.detail || 'Não foi possível remover a venda')
    } finally {
      setExcluindoVenda(false)
    }
  }

  const columns = [
    { key: 'numero_contrato', header: 'Contrato' },
    { key: 'data_venda', header: 'Data', render: (row: Venda) => formatDate(row.data_venda) },
    { key: 'cliente_nome', header: 'Cliente' },
    { key: 'vendedor_nome', header: 'Vendedor' },
    ...(user?.perfil !== 'vendedor' ? [{ key: 'coordenador_nome', header: 'Coordenador' }] : []),
    { key: 'coban_sigla', header: 'COBAN' },
    { key: 'valor_bem', header: 'Valor do Bem', render: (row: Venda) => formatCurrency(row.valor_bem) },
    { key: 'valor_total_comissao', header: 'Comissão Total', render: (row: Venda) => formatCurrency(row.valor_total_comissao) },
    {
      key: 'status', header: 'Status',
      render: (row: Venda) => (
        <span className={`badge ${STATUS_VENDA_BADGE[row.status] || 'badge-secondary'}`}>
          {STATUS_VENDA_LABEL[row.status] || row.status}
        </span>
      )
    },
  ]

  return (
    <div className="space-y-6">
      <PageHeader
        title="Vendas"
        subtitle="Gestão de Consórcios — contratos e contemplações"
        actions={
          <Link to="/vendas/nova" className="btn-primary">
            <Plus className="w-4 h-4" />
            Nova Venda
          </Link>
        }
      />

      <DataTable
        columns={columns}
        data={vendas}
        keyField="id"
        loading={loading}
        searchable
        searchFields={['numero_contrato', 'vendedor_nome', 'cliente_nome', 'consorcio_nome']}
        emptyMessage="Nenhuma venda encontrada"
        actions={(row) => (
          <div className="flex items-center gap-2 justify-end">
            {canDeleteVenda && (
              <button onClick={() => handleSolicitarExclusao(row)} className="btn-danger py-1.5 px-2.5 text-xs" title="Remover venda">
                <Trash2 className="w-3.5 h-3.5" />
              </button>
            )}
            <button onClick={() => openVenda(row)} className="btn-secondary py-1.5 px-3 text-xs">
              <Eye className="w-3.5 h-3.5" />
              Detalhes
            </button>
          </div>
        )}
      />

      <Modal open={!!selected} onClose={() => { setSelected(null); setParcelas([]) }} title={`Venda ${selected?.numero_contrato}`} size="xl">
        {selected && (
          <div className="space-y-6">
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div><p className="text-gray-500">Cliente</p><p className="font-medium">{selected.cliente_nome || '—'}</p></div>
              <div><p className="text-gray-500">Vendedor</p><p className="font-medium">{selected.vendedor_nome}</p></div>
              <div><p className="text-gray-500">Coordenador</p><p className="font-medium">{selected.coordenador_nome}</p></div>
              <div><p className="text-gray-500">Data da Venda</p><p className="font-medium">{formatDate(selected.data_venda)}</p></div>
              <div><p className="text-gray-500">COBAN</p><p className="font-medium">{selected.coban_sigla}</p></div>
              <div><p className="text-gray-500">Tipo de Bem</p><p className="font-medium">{selected.tipo_bem_nome}</p></div>
              <div><p className="text-gray-500">Consórcio</p><p className="font-medium">{selected.consorcio_nome}</p></div>
              <div><p className="text-gray-500">Valor do Bem</p><p className="font-medium text-[#1B4F8C]">{formatCurrency(selected.valor_bem)}</p></div>
              <div><p className="text-gray-500">Comissão Total</p><p className="font-medium text-emerald-600">{formatCurrency(selected.valor_total_comissao)}</p></div>
              <div>
                <p className="text-gray-500 mb-1">Status do Contrato</p>
                <div className="flex items-center gap-2">
                  <span className={`badge ${STATUS_VENDA_BADGE[selected.status] || 'badge-secondary'}`}>
                    {STATUS_VENDA_LABEL[selected.status] || selected.status}
                  </span>
                  {canEditStatus && (
                    <select
                      value={selected.status}
                      onChange={e => handleAlterarStatus(e.target.value)}
                      disabled={alterandoStatus}
                      className="input py-1 text-xs w-auto"
                    >
                      <option value="a_contemplar">A Contemplar</option>
                      <option value="contemplado">Contemplado</option>
                      <option value="cancelada">Cancelada</option>
                    </select>
                  )}
                </div>
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between mb-3">
                <h3 className="font-semibold text-gray-900">Parcelas de Comissão</h3>
                {parcelas.length === 0 && (
                  <button onClick={handleGerarComissoes} disabled={gerandoComissoes} className="btn-primary py-1.5 px-3 text-xs">
                    {gerandoComissoes ? 'Gerando...' : 'Gerar Comissões'}
                  </button>
                )}
              </div>
              {parcelas.length > 0 ? (
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead className="table-header">
                      <tr>
                        <th className="px-3 py-2 text-left">Parcela</th>
                        <th className="px-3 py-2 text-left">Vencimento</th>
                        <th className="px-3 py-2 text-right">Valor</th>
                        <th className="px-3 py-2 text-center">Status</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                      {parcelas.map((p) => (
                        <tr key={p.id} className="table-row-hover">
                          <td className="px-3 py-2">{p.numero_parcela}/{parcelas.length}</td>
                          <td className="px-3 py-2">{formatDate(p.data_vencimento)}</td>
                          <td className="px-3 py-2 text-right font-medium">{formatCurrency(p.valor)}</td>
                          <td className="px-3 py-2 text-center">
                            <span className={getStatusBadgeClass(p.status)}>{getStatusLabel(p.status)}</span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <p className="text-sm text-gray-400 text-center py-6">Nenhuma comissão gerada ainda.</p>
              )}
            </div>
          </div>
        )}
      </Modal>

      <Modal
        open={!!vendaParaExcluir}
        onClose={() => { if (!excluindoVenda) setVendaParaExcluir(null) }}
        title="Confirmar remoção de venda"
      >
        <div className="space-y-4 text-sm text-gray-700">
          <p>
            Você está removendo a venda <strong>{vendaParaExcluir?.numero_contrato}</strong>.
          </p>
          <div className="rounded-lg border border-amber-200 bg-amber-50 p-3">
            <p className="font-medium text-amber-800 mb-2">Impactos da remoção:</p>
            <ul className="list-disc pl-5 space-y-1 text-amber-800">
              <li>Todas as comissões vinculadas a esta venda serão removidas.</li>
              <li>Histórico e vínculo da venda com cliente/vendedor serão excluídos.</li>
              <li>A ação é irreversível sem restauração de backup.</li>
            </ul>
          </div>

          {carregandoValidacaoExclusao ? (
            <p className="text-gray-500">Validando comissões pagas...</p>
          ) : comissoesPagas > 0 ? (
            <div className="rounded-lg border border-red-200 bg-red-50 p-3 text-red-700">
              Não é possível remover esta venda porque existem <strong>{comissoesPagas}</strong> comissões pagas.
              Estorne os pagamentos para continuar.
            </div>
          ) : (
            <div className="rounded-lg border border-emerald-200 bg-emerald-50 p-3 text-emerald-700">
              Nenhuma comissão paga encontrada. A remoção está liberada.
            </div>
          )}

          <div className="flex justify-end gap-3 pt-2">
            <button
              type="button"
              onClick={() => setVendaParaExcluir(null)}
              className="btn-secondary"
              disabled={excluindoVenda}
            >
              Cancelar
            </button>
            <button
              type="button"
              onClick={handleDeleteVenda}
              className="btn-danger"
              disabled={carregandoValidacaoExclusao || comissoesPagas > 0 || excluindoVenda}
            >
              {excluindoVenda ? 'Removendo...' : 'Confirmar remoção'}
            </button>
          </div>
        </div>
      </Modal>
    </div>
  )
}
