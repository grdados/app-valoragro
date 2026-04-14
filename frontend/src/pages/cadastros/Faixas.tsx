import { useEffect, useState } from 'react'
import { Plus, Pencil, Trash2 } from 'lucide-react'
import { faixasApi, consorciosApi } from '../../services/api'
import PageHeader from '../../components/PageHeader'
import DataTable from '../../components/DataTable'
import Modal from '../../components/Modal'
import { useForm } from 'react-hook-form'
import { formatCurrency } from '../../lib/utils'
import toast from 'react-hot-toast'
import type { FaixaComissao, Consorcio } from '../../types'

interface FormData {
  consorcio: number
  valor_min: number
  valor_max: number
  percentuais_str: string
  percentuais_vendedor_str: string
  percentuais_coordenador_str: string
  percentuais_supervisor_str: string
  ativo: boolean
}

const parsePercentuais = (value: string) =>
  value
    .split(',')
    .map((p) => parseFloat(p.trim()))
    .filter((p) => !Number.isNaN(p))

export default function FaixasPage() {
  const [items, setItems] = useState<FaixaComissao[]>([])
  const [consorcios, setConsorcios] = useState<Consorcio[]>([])
  const [loading, setLoading] = useState(true)
  const [modalOpen, setModalOpen] = useState(false)
  const [editing, setEditing] = useState<FaixaComissao | null>(null)
  const [saving, setSaving] = useState(false)
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<FormData>()

  const fetch = async () => {
    setLoading(true)
    try {
      const [f, c] = await Promise.all([faixasApi.list(), consorciosApi.list()])
      setItems(f.data.results || f.data)
      setConsorcios(c.data.results || c.data)
    } catch {
      toast.error('Erro ao carregar')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetch()
  }, [])

  const openCreate = () => {
    setEditing(null)
    reset({ ativo: true })
    setModalOpen(true)
  }

  const openEdit = (item: FaixaComissao) => {
    setEditing(item)
    reset({
      ...item,
      percentuais_str: item.percentuais.join(', '),
      percentuais_vendedor_str: (item.percentuais_vendedor || []).join(', '),
      percentuais_coordenador_str: (item.percentuais_coordenador || []).join(', '),
      percentuais_supervisor_str: (item.percentuais_supervisor || []).join(', '),
    })
    setModalOpen(true)
  }

  const onSubmit = async (data: FormData) => {
    setSaving(true)
    try {
      const percentuais = parsePercentuais(data.percentuais_str)
      const percentuais_vendedor = parsePercentuais(data.percentuais_vendedor_str)
      const percentuais_coordenador = parsePercentuais(data.percentuais_coordenador_str)
      const percentuais_supervisor = parsePercentuais(data.percentuais_supervisor_str)

      const payload = {
        consorcio: data.consorcio,
        valor_min: data.valor_min,
        valor_max: data.valor_max,
        percentuais,
        percentuais_vendedor,
        percentuais_coordenador,
        percentuais_supervisor,
        ativo: data.ativo,
      }

      if (editing) {
        await faixasApi.update(editing.id, payload)
        toast.success('Faixa atualizada!')
      } else {
        await faixasApi.create(payload)
        toast.success('Faixa criada!')
      }
      setModalOpen(false)
      fetch()
    } catch (err: unknown) {
      const error = err as { response?: { data?: Record<string, string[] | string> } }
      const first = Object.values(error?.response?.data || {})[0]
      const msg = Array.isArray(first) ? first[0] : first || 'Erro ao salvar'
      toast.error(String(msg))
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async (item: FaixaComissao) => {
    if (!confirm('Remover esta faixa?')) return
    try {
      await faixasApi.remove(item.id)
      toast.success('Removida!')
      fetch()
    } catch {
      toast.error('Erro ao remover')
    }
  }

  const getConsorcioNome = (id: number) => consorcios.find((c) => c.id === id)?.nome || '-'

  const columns = [
    { key: 'consorcio', header: 'Consórcio', render: (row: FaixaComissao) => getConsorcioNome(row.consorcio) },
    { key: 'valor_min', header: 'Valor Mínimo', render: (row: FaixaComissao) => formatCurrency(row.valor_min) },
    { key: 'valor_max', header: 'Valor Máximo', render: (row: FaixaComissao) => formatCurrency(row.valor_max) },
    { key: 'percentuais_vendedor', header: 'Vendedor (%)', render: (row: FaixaComissao) => (row.percentuais_vendedor || []).join(', ') },
    { key: 'percentuais_coordenador', header: 'Coordenador (%)', render: (row: FaixaComissao) => (row.percentuais_coordenador || []).join(', ') },
    { key: 'percentuais_supervisor', header: 'Supervisor (%)', render: (row: FaixaComissao) => (row.percentuais_supervisor || []).join(', ') },
    {
      key: 'ativo',
      header: 'Status',
      render: (row: FaixaComissao) => (
        <span className={row.ativo ? 'badge-ativa' : 'badge-cancelada'}>{row.ativo ? 'Ativo' : 'Inativo'}</span>
      ),
    },
  ]

  return (
    <div className="space-y-6">
      <PageHeader
        title="Faixas de Comissão"
        subtitle="Configuração de percentuais por faixa de valor e perfil"
        actions={
          <button onClick={openCreate} className="btn-primary">
            <Plus className="w-4 h-4" />
            Nova Faixa
          </button>
        }
      />
      <DataTable
        columns={columns}
        data={items}
        keyField="id"
        loading={loading}
        emptyMessage="Nenhuma faixa cadastrada"
        actions={(row) => (
          <div className="flex gap-2 justify-end">
            <button onClick={() => openEdit(row)} className="btn-secondary py-1.5 px-2.5 text-xs">
              <Pencil className="w-3.5 h-3.5" />
            </button>
            <button onClick={() => handleDelete(row)} className="btn-danger py-1.5 px-2.5 text-xs">
              <Trash2 className="w-3.5 h-3.5" />
            </button>
          </div>
        )}
      />
      <Modal open={modalOpen} onClose={() => setModalOpen(false)} title={editing ? 'Editar Faixa' : 'Nova Faixa de Comissão'} size="lg">
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div>
            <label className="label">Consórcio *</label>
            <select {...register('consorcio', { required: true, valueAsNumber: true })} className="input">
              <option value="">Selecione</option>
              {consorcios.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.nome}
                </option>
              ))}
            </select>
            {errors.consorcio && <p className="text-red-500 text-xs mt-1">Obrigatório</p>}
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="label">Valor Mínimo (R$) *</label>
              <input type="number" step="0.01" {...register('valor_min', { required: true, valueAsNumber: true })} className="input" />
            </div>
            <div>
              <label className="label">Valor Máximo (R$) *</label>
              <input type="number" step="0.01" {...register('valor_max', { required: true, valueAsNumber: true })} className="input" />
            </div>
          </div>

          <div>
            <label className="label">Base de Parcelas (referência) *</label>
            <input {...register('percentuais_str', { required: true })} className="input" placeholder="Ex: 0.5, 0.5, 0.5" />
            <p className="text-xs text-gray-400 mt-1">Quantidade dessa lista define o total de parcelas.</p>
          </div>

          <div>
            <label className="label">Percentuais do Vendedor (%) *</label>
            <input {...register('percentuais_vendedor_str', { required: true })} className="input" placeholder="Ex: 0.3, 0.3, 0.3" />
          </div>
          <div>
            <label className="label">Percentuais do Coordenador (%) *</label>
            <input {...register('percentuais_coordenador_str', { required: true })} className="input" placeholder="Ex: 0.1, 0.1, 0.1" />
          </div>
          <div>
            <label className="label">Percentuais do Supervisor (%) *</label>
            <input {...register('percentuais_supervisor_str', { required: true })} className="input" placeholder="Ex: 0.05, 0.05, 0.05" />
          </div>

          <div className="flex items-center gap-2">
            <input type="checkbox" id="ativo" {...register('ativo')} className="w-4 h-4" />
            <label htmlFor="ativo" className="text-sm">Ativo</label>
          </div>
          <div className="flex justify-end gap-3 pt-2">
            <button type="button" onClick={() => setModalOpen(false)} className="btn-secondary">Cancelar</button>
            <button type="submit" disabled={saving} className="btn-primary">{saving ? 'Salvando...' : 'Salvar'}</button>
          </div>
        </form>
      </Modal>
    </div>
  )
}
