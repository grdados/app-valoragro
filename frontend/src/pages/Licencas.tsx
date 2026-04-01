import { useEffect, useState } from 'react'
import { useForm } from 'react-hook-form'
import { Plus, Pencil, CheckCircle, XCircle, AlertCircle, X } from 'lucide-react'
import toast from 'react-hot-toast'
import { licencasApi } from '../services/api'
import PageHeader from '../components/PageHeader'
import { formatCurrency, formatDate } from '../lib/utils'
import type { Licenca, PagamentoLicenca } from '../types'

const STATUS_BADGE: Record<string, string> = {
  ativa: 'badge-success',
  suspensa: 'badge-warning',
  cancelada: 'badge-error',
}

export default function LicencasPage() {
  const [licencas, setLicencas] = useState<Licenca[]>([])
  const [loading, setLoading] = useState(true)
  const [showModal, setShowModal] = useState(false)
  const [showPagModal, setShowPagModal] = useState(false)
  const [editing, setEditing] = useState<Licenca | null>(null)
  const [selectedLicenca, setSelectedLicenca] = useState<Licenca | null>(null)
  const { register, handleSubmit, reset, formState: { isSubmitting } } = useForm<Licenca>()
  const pagForm = useForm<PagamentoLicenca>()

  const load = async () => {
    setLoading(true)
    try {
      const res = await licencasApi.list()
      setLicencas(res.data.results || res.data)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { load() }, [])

  const openCreate = () => { setEditing(null); reset({}); setShowModal(true) }
  const openEdit = (l: Licenca) => { setEditing(l); reset(l); setShowModal(true) }
  const openPagamento = (l: Licenca) => { setSelectedLicenca(l); pagForm.reset({ licenca: l.id, valor: l.valor_mensalidade }); setShowPagModal(true) }

  const onSubmit = async (data: Licenca) => {
    try {
      if (editing) {
        await licencasApi.update(editing.id, data as unknown as Record<string, unknown>)
        toast.success('Licença atualizada!')
      } else {
        await licencasApi.create(data as unknown as Record<string, unknown>)
        toast.success('Licença criada!')
      }
      setShowModal(false)
      load()
    } catch {
      toast.error('Erro ao salvar licença')
    }
  }

  const onPagSubmit = async (data: PagamentoLicenca) => {
    try {
      await licencasApi.createPagamento(data as unknown as Record<string, unknown>)
      toast.success('Pagamento registrado!')
      setShowPagModal(false)
      load()
    } catch {
      toast.error('Erro ao registrar pagamento')
    }
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Controle de Licenças"
        subtitle="Gerenciamento de mensalidades por empresa"
        actions={
          <button onClick={openCreate} className="btn-primary">
            <Plus className="w-4 h-4" /> Nova Licença
          </button>
        }
      />

      <div className="grid grid-cols-1 gap-4">
        {loading ? (
          <div className="card p-8 text-center text-gray-400">Carregando...</div>
        ) : licencas.length === 0 ? (
          <div className="card p-8 text-center text-gray-400">Nenhuma licença cadastrada</div>
        ) : licencas.map(l => (
          <div key={l.id} className="card p-5">
            <div className="flex items-start justify-between gap-4">
              <div>
                <div className="flex items-center gap-3">
                  <h3 className="font-semibold text-gray-900 text-lg">{l.nome_empresa}</h3>
                  <span className={`badge ${STATUS_BADGE[l.status] || 'badge-secondary'}`}>{l.status_display}</span>
                </div>
                <div className="mt-1 text-sm text-gray-500 space-y-0.5">
                  <p>CNPJ: {l.cnpj || '—'} | {l.email_contato}</p>
                  <p>Plano: {l.plano} | Mensalidade: {formatCurrency(l.valor_mensalidade)}</p>
                  <p>Vigência: {formatDate(l.data_inicio)} → {formatDate(l.data_expiracao)}</p>
                </div>
              </div>
              <div className="flex gap-2 shrink-0">
                <button onClick={() => openPagamento(l)} className="btn-secondary text-sm">+ Pagamento</button>
                <button onClick={() => openEdit(l)} className="p-1.5 rounded hover:bg-blue-50 text-blue-600">
                  <Pencil className="w-4 h-4" />
                </button>
              </div>
            </div>

            {l.pagamentos && l.pagamentos.length > 0 && (
              <div className="mt-4 overflow-x-auto">
                <table className="w-full text-xs">
                  <thead className="table-header">
                    <tr>
                      <th className="px-3 py-2 text-left">Competência</th>
                      <th className="px-3 py-2 text-left">Vencimento</th>
                      <th className="px-3 py-2 text-left">Pagamento</th>
                      <th className="px-3 py-2 text-right">Valor</th>
                      <th className="px-3 py-2 text-center">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {l.pagamentos.slice(0, 6).map(p => (
                      <tr key={p.id} className="table-row-hover">
                        <td className="px-3 py-1.5">{p.competencia}</td>
                        <td className="px-3 py-1.5">{formatDate(p.data_vencimento)}</td>
                        <td className="px-3 py-1.5">{p.data_pagamento ? formatDate(p.data_pagamento) : '—'}</td>
                        <td className="px-3 py-1.5 text-right">{formatCurrency(p.valor)}</td>
                        <td className="px-3 py-1.5 text-center">
                          {p.status === 'pago' && <CheckCircle className="w-4 h-4 text-emerald-500 inline" />}
                          {p.status === 'vencido' && <XCircle className="w-4 h-4 text-red-500 inline" />}
                          {p.status === 'pendente' && <AlertCircle className="w-4 h-4 text-yellow-500 inline" />}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        ))}
      </div>

      {showModal && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-lg">
            <div className="flex items-center justify-between px-6 py-4 border-b">
              <h2 className="text-lg font-semibold">{editing ? 'Editar Licença' : 'Nova Licença'}</h2>
              <button onClick={() => setShowModal(false)}><X className="w-5 h-5" /></button>
            </div>
            <form onSubmit={handleSubmit(onSubmit)} className="p-6 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="col-span-2">
                  <label className="label">Nome da Empresa *</label>
                  <input {...register('nome_empresa', { required: true })} className="input" />
                </div>
                <div>
                  <label className="label">CNPJ</label>
                  <input {...register('cnpj')} className="input" />
                </div>
                <div>
                  <label className="label">E-mail *</label>
                  <input type="email" {...register('email_contato', { required: true })} className="input" />
                </div>
                <div>
                  <label className="label">Plano</label>
                  <select {...register('plano')} className="input">
                    <option value="mensal">Mensal</option>
                    <option value="trimestral">Trimestral</option>
                    <option value="semestral">Semestral</option>
                    <option value="anual">Anual</option>
                  </select>
                </div>
                <div>
                  <label className="label">Mensalidade (R$)</label>
                  <input type="number" step="0.01" {...register('valor_mensalidade', { valueAsNumber: true })} className="input" />
                </div>
                <div>
                  <label className="label">Status</label>
                  <select {...register('status')} className="input">
                    <option value="ativa">Ativa</option>
                    <option value="suspensa">Suspensa</option>
                    <option value="cancelada">Cancelada</option>
                  </select>
                </div>
                <div>
                  <label className="label">Início</label>
                  <input type="date" {...register('data_inicio')} className="input" />
                </div>
                <div>
                  <label className="label">Expiração</label>
                  <input type="date" {...register('data_expiracao')} className="input" />
                </div>
                <div className="col-span-2">
                  <label className="label">Observações</label>
                  <textarea {...register('observacoes')} rows={2} className="input" />
                </div>
              </div>
              <div className="flex justify-end gap-3">
                <button type="button" onClick={() => setShowModal(false)} className="btn-secondary">Cancelar</button>
                <button type="submit" disabled={isSubmitting} className="btn-primary">Salvar</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {showPagModal && selectedLicenca && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-sm">
            <div className="flex items-center justify-between px-6 py-4 border-b">
              <h2 className="text-lg font-semibold">Registrar Pagamento</h2>
              <button onClick={() => setShowPagModal(false)}><X className="w-5 h-5" /></button>
            </div>
            <form onSubmit={pagForm.handleSubmit(onPagSubmit)} className="p-6 space-y-4">
              <input type="hidden" {...pagForm.register('licenca', { valueAsNumber: true })} />
              <div>
                <label className="label">Competência (ex: 2024-03)</label>
                <input {...pagForm.register('competencia', { required: true })} className="input" placeholder="2024-03" />
              </div>
              <div>
                <label className="label">Vencimento</label>
                <input type="date" {...pagForm.register('data_vencimento', { required: true })} className="input" />
              </div>
              <div>
                <label className="label">Data de Pagamento</label>
                <input type="date" {...pagForm.register('data_pagamento')} className="input" />
              </div>
              <div>
                <label className="label">Valor (R$)</label>
                <input type="number" step="0.01" {...pagForm.register('valor', { required: true, valueAsNumber: true })} className="input" />
              </div>
              <div>
                <label className="label">Status</label>
                <select {...pagForm.register('status')} className="input">
                  <option value="pago">Pago</option>
                  <option value="pendente">Pendente</option>
                  <option value="vencido">Vencido</option>
                </select>
              </div>
              <div className="flex justify-end gap-3">
                <button type="button" onClick={() => setShowPagModal(false)} className="btn-secondary">Cancelar</button>
                <button type="submit" className="btn-primary">Salvar</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
