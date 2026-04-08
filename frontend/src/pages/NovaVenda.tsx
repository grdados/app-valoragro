import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { ArrowLeft, Search, ChevronRight } from 'lucide-react'
import toast from 'react-hot-toast'
import { vendasApi, vendedoresApi, cobansApi, tiposBemApi, comissoesApi, clientesApi } from '../services/api'
import { useAuth } from '../hooks/useAuth'
import PageHeader from '../components/PageHeader'
import { formatCurrency, formatDate } from '../lib/utils'
import type { Vendedor, COBAN, TipoBem, ConsorcioDisponivel, PlanoParcelaPreview, Cliente } from '../types'

interface FormData {
  data_venda: string
  numero_contrato: string
  cliente: number
  vendedor: number
  coban: number
  tipo_bem: number
  valor_bem: number
}

export default function NovaVendaPage() {
  const navigate = useNavigate()
  const { user } = useAuth()
  const { register, handleSubmit, watch, getValues, formState: { errors } } = useForm<FormData>()

  const [vendedores, setVendedores] = useState<Vendedor[]>([])
  const [cobans, setCobans] = useState<COBAN[]>([])
  const [tiposBem, setTiposBem] = useState<TipoBem[]>([])
  const [clientes, setClientes] = useState<Cliente[]>([])
  const [consorcios, setConsorcios] = useState<ConsorcioDisponivel[]>([])
  const [selectedConsorcio, setSelectedConsorcio] = useState<number | null>(null)
  const [plano, setPlano] = useState<PlanoParcelaPreview[]>([])
  const [totalComissao, setTotalComissao] = useState<number>(0)
  const [previewing, setPreviewing] = useState(false)
  const [saving, setSaving] = useState(false)
  const [step, setStep] = useState<1 | 2 | 3>(1)

  const watchedStep = watch('data_venda')

  const showWarningToast = (message: string) => {
    toast(message, {
      icon: '⚠️',
      style: {
        background: '#fff8db',
        color: '#7a5400',
        border: '1px solid #f7d774',
      },
    })
  }

  useEffect(() => {
    Promise.all([
      vendedoresApi.list({ ativo: true }),
      cobansApi.list(),
      tiposBemApi.list(),
      clientesApi.list({ ativo: true }),
    ]).then(([v, c, t, cl]) => {
      setVendedores(v.data.results || v.data)
      setCobans(c.data.results || c.data)
      setTiposBem(t.data.results || t.data)
      setClientes(cl.data.results || cl.data)
    })
  }, [])

  const handlePreview = async () => {
    const [data_venda, coban_id, tipo_bem_id, valor_bem] = getValues(['data_venda', 'coban', 'tipo_bem', 'valor_bem'])
    if (!data_venda || !coban_id || !tipo_bem_id || !valor_bem) {
      toast.error('Preencha todos os campos para buscar consÃ³rcios')
      return
    }
    const cobanObj = cobans.find(c => c.id === Number(coban_id))
    const tipoBemObj = tiposBem.find(t => t.id === Number(tipo_bem_id))
    if (!cobanObj || !tipoBemObj) {
      toast.error('COBAN ou Tipo de Bem invÃ¡lido')
      return
    }
    setPreviewing(true)
    try {
      const res = await vendasApi.preview({ data_venda, coban: cobanObj.sigla, tipo_bem: tipoBemObj.nome, valor_bem: Number(valor_bem) })
      setConsorcios(res.data.consorcios_disponiveis)
      setSelectedConsorcio(null)
      setPlano([])
      setStep(2)
      if (res.data.consorcios_disponiveis.length === 0) {
        toast.error('Nenhum consÃ³rcio disponÃ­vel para os parÃ¢metros informados')
      }
    } catch (err: unknown) {
      const error = err as { response?: { data?: Record<string, string[]> } }
      const msg = Object.values(error?.response?.data || {}).flat()[0] || 'Erro ao buscar consórcios'
      const message = String(msg)
      if (message.includes('sem faixa de comiss')) {
        showWarningToast(message)
      } else {
        toast.error(message)
      }
    } finally {
      setPreviewing(false)
    }
  }

  const handleSelectConsorcio = async (consorcioId: number) => {
    setSelectedConsorcio(consorcioId)
    const [data_venda, coban_id, tipo_bem_id, valor_bem] = getValues(['data_venda', 'coban', 'tipo_bem', 'valor_bem'])
    const cobanObj = cobans.find(c => c.id === Number(coban_id))
    const tipoBemObj = tiposBem.find(t => t.id === Number(tipo_bem_id))
    if (!cobanObj || !tipoBemObj) return
    try {
      const res = await vendasApi.preview({ data_venda, coban: cobanObj.sigla, tipo_bem: tipoBemObj.nome, valor_bem: Number(valor_bem), consorcio_id: consorcioId })
      if (res.data.parcelas) {
        setPlano(res.data.parcelas)
        setTotalComissao(res.data.valor_total_comissao || 0)
        setStep(3)
      }
    } catch {
      toast.error('Erro ao calcular plano de parcelas')
    }
  }

  const onSubmit = async (data: FormData) => {
    if (!selectedConsorcio) {
      toast.error('Selecione um consÃ³rcio')
      return
    }
    setSaving(true)
    try {
      const vendaRes = await vendasApi.create({
        ...data,
        valor_bem: Number(data.valor_bem),
        consorcio: selectedConsorcio,
      })
      await comissoesApi.gerar(vendaRes.data.id)
      toast.success('Venda registrada e comissÃµes geradas!')
      navigate('/painel/vendas')
    } catch (err: unknown) {
      const error = err as { response?: { data?: Record<string, string[]> } }
      const msgs = Object.entries(error?.response?.data || {}).map(([k, v]) => `${k}: ${v}`).join('; ')
      toast.error(msgs || 'Erro ao salvar venda')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      <PageHeader
        title="Nova Venda"
        subtitle="Registre uma nova venda de consÃ³rcio"
        actions={
          <button onClick={() => navigate('/painel/vendas')} className="btn-secondary">
            <ArrowLeft className="w-4 h-4" />
            Voltar
          </button>
        }
      />

      <div className="flex items-center gap-2 mb-4 text-sm">
        {[{ n: 1, label: 'Dados da Venda' }, { n: 2, label: 'Selecionar ConsÃ³rcio' }, { n: 3, label: 'Confirmar' }].map((s, i) => (
          <div key={s.n} className="flex items-center gap-2">
            <div className={`flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-medium ${step >= s.n ? 'bg-[#1B4F8C] text-white' : 'bg-gray-100 text-gray-400'}`}>
              <span>{s.n}</span>
              <span className="hidden sm:inline">{s.label}</span>
            </div>
            {i < 2 && <ChevronRight className="w-4 h-4 text-gray-300" />}
          </div>
        ))}
      </div>

      <form onSubmit={handleSubmit(onSubmit)}>
        <div className="card p-6 space-y-5">
          <h2 className="text-base font-semibold text-gray-900">Dados da Venda</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="label">Data da Venda *</label>
              <input type="date" {...register('data_venda', { required: true })} className="input" />
              {errors.data_venda && <p className="text-red-500 text-xs mt-1">Campo obrigatÃ³rio</p>}
            </div>
            <div>
              <label className="label">NÃºmero do Contrato *</label>
              <input {...register('numero_contrato', { required: true })} className="input" placeholder="Ex: CTR-2024-001" />
              {errors.numero_contrato && <p className="text-red-500 text-xs mt-1">Campo obrigatÃ³rio</p>}
            </div>
            <div>
              <label className="label">Cliente</label>
              <select {...register('cliente', { valueAsNumber: true })} className="input">
                <option value="">Selecione o cliente (opcional)</option>
                {clientes.map((c) => (
                  <option key={c.id} value={c.id}>{c.nome} â€” {c.cpf}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="label">Vendedor *</label>
              <select {...register('vendedor', { required: true, valueAsNumber: true })} className="input">
                <option value="">Selecione o vendedor</option>
                {vendedores.map((v) => (
                  <option key={v.id} value={v.id}>{v.nome}</option>
                ))}
              </select>
              {errors.vendedor && <p className="text-red-500 text-xs mt-1">Campo obrigatÃ³rio</p>}
            </div>
            <div>
              <label className="label">COBAN *</label>
              <select {...register('coban', { required: true, valueAsNumber: true })} className="input">
                <option value="">Selecione o COBAN</option>
                {cobans.filter(c => c.ativo).map((c) => (
                  <option key={c.id} value={c.id}>{c.sigla} â€” {c.descricao}</option>
                ))}
              </select>
              {errors.coban && <p className="text-red-500 text-xs mt-1">Campo obrigatÃ³rio</p>}
            </div>
            <div>
              <label className="label">Tipo do Bem *</label>
              <select {...register('tipo_bem', { required: true, valueAsNumber: true })} className="input">
                <option value="">Selecione o tipo</option>
                {tiposBem.filter(t => t.ativo).map((t) => (
                  <option key={t.id} value={t.id}>{t.descricao?.trim() || t.nome_display}</option>
                ))}
              </select>
              {errors.tipo_bem && <p className="text-red-500 text-xs mt-1">Campo obrigatÃ³rio</p>}
            </div>
            <div>
              <label className="label">Valor do Bem (R$) *</label>
              <input type="number" step="0.01" min="0" {...register('valor_bem', { required: true, min: 1 })} className="input" placeholder="0,00" />
              {errors.valor_bem && <p className="text-red-500 text-xs mt-1">Campo obrigatÃ³rio</p>}
            </div>
          </div>

          <div className="flex justify-end pt-2">
            <button type="button" onClick={handlePreview} disabled={previewing} className="btn-primary">
              <Search className="w-4 h-4" />
              {previewing ? 'Buscando...' : 'Buscar ConsÃ³rcios'}
            </button>
          </div>
        </div>

        {consorcios.length > 0 && (
          <div className="card p-6 space-y-4 mt-4">
            <h2 className="text-base font-semibold text-gray-900">Selecione o ConsÃ³rcio</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {consorcios.map((c) => (
                <button
                  key={c.id}
                  type="button"
                  onClick={() => handleSelectConsorcio(c.id)}
                  className={`p-4 rounded-xl border-2 text-left transition-all ${selectedConsorcio === c.id ? 'border-[#1B4F8C] bg-blue-50' : 'border-gray-200 hover:border-blue-300'}`}
                >
                  <p className="font-medium text-gray-900">{c.nome}</p>
                  <p className="text-xs text-gray-500 mt-1">{c.qtd_parcelas} parcelas de comissÃ£o</p>
                </button>
              ))}
            </div>
          </div>
        )}

        {plano.length > 0 && (
          <div className="card p-6 space-y-4 mt-4">
            <div className="flex items-center justify-between">
              <h2 className="text-base font-semibold text-gray-900">Plano de ComissÃµes</h2>
              <div className="text-right">
                <p className="text-xs text-gray-500">Total de ComissÃµes</p>
                <p className="text-lg font-bold text-emerald-600">{formatCurrency(totalComissao)}</p>
              </div>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="table-header">
                  <tr>
                    <th className="px-4 py-2 text-left">Parcela</th>
                    <th className="px-4 py-2 text-left">Vencimento</th>
                    <th className="px-4 py-2 text-right">Percentual</th>
                    <th className="px-4 py-2 text-right">Valor ComissÃ£o</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {plano.map((p) => (
                    <tr key={p.numero_parcela} className="table-row-hover">
                      <td className="px-4 py-2">{p.numero_parcela}/{plano.length}</td>
                      <td className="px-4 py-2">{formatDate(p.data_vencimento)}</td>
                      <td className="px-4 py-2 text-right">{p.percentual}%</td>
                      <td className="px-4 py-2 text-right font-medium text-emerald-700">{formatCurrency(p.valor)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div className="flex justify-end pt-2">
              <button type="submit" disabled={saving} className="btn-success px-6">
                {saving ? 'Salvando...' : 'Confirmar e Gerar ComissÃµes'}
              </button>
            </div>
          </div>
        )}
      </form>
    </div>
  )
}

