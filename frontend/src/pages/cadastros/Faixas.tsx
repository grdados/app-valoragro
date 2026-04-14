import { useEffect, useState } from 'react'
import { Plus, Pencil, Trash2 } from 'lucide-react'
import { faixasApi, consorciosApi } from '../../services/api'
import PageHeader from '../../components/PageHeader'
import DataTable from '../../components/DataTable'
import Modal from '../../components/Modal'
import { Controller, useForm } from 'react-hook-form'
import { formatCurrency, formatCurrencyInput, parseCurrencyInput } from '../../lib/utils'
import toast from 'react-hot-toast'
import type { FaixaComissao, Consorcio } from '../../types'

interface FormData {
  consorcio: number
  perfil: 'vendedor' | 'coordenador' | 'supervisor'
  valor_min: string
  valor_max: string
  percentual_total: number
  qtd_parcelas: number
  ativo: boolean
}

const PERFIS: Array<{ value: FormData['perfil']; label: string }> = [
  { value: 'vendedor', label: 'Vendedor' },
  { value: 'coordenador', label: 'Coordenador' },
  { value: 'supervisor', label: 'Supervisor' },
]

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
    control,
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
    reset({
      ativo: true,
      perfil: 'vendedor',
      qtd_parcelas: 1,
      valor_min: '',
      valor_max: '',
    })
    setModalOpen(true)
  }

  const openEdit = (item: FaixaComissao) => {
    setEditing(item)
    reset({
      consorcio: item.consorcio,
      perfil: item.perfil,
      valor_min: formatCurrencyInput(item.valor_min),
      valor_max: formatCurrencyInput(item.valor_max),
      percentual_total: item.percentual_total,
      qtd_parcelas: item.qtd_parcelas,
      ativo: item.ativo,
    })
    setModalOpen(true)
  }

  const onSubmit = async (data: FormData) => {
    setSaving(true)
    try {
      const valorMin = parseCurrencyInput(data.valor_min)
      const valorMax = parseCurrencyInput(data.valor_max)

      if (!Number.isFinite(valorMin) || !Number.isFinite(valorMax)) {
        toast.error('Informe valores válidos para mínimo e máximo.')
        setSaving(false)
        return
      }

      const payload = {
        consorcio: data.consorcio,
        perfil: data.perfil,
        valor_min: valorMin,
        valor_max: valorMax,
        percentual_total: data.percentual_total,
        qtd_parcelas: data.qtd_parcelas,
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
    { key: 'perfil_display', header: 'Perfil', render: (row: FaixaComissao) => row.perfil_display },
    { key: 'valor_min', header: 'Valor Mínimo', render: (row: FaixaComissao) => formatCurrency(row.valor_min) },
    { key: 'valor_max', header: 'Valor Máximo', render: (row: FaixaComissao) => formatCurrency(row.valor_max) },
    { key: 'percentual_total', header: 'Percentual (%)', render: (row: FaixaComissao) => `${Number(row.percentual_total).toFixed(4)}%` },
    { key: 'qtd_parcelas', header: 'Parcelas', render: (row: FaixaComissao) => row.qtd_parcelas },
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

          <div>
            <label className="label">Perfil *</label>
            <select {...register('perfil', { required: true })} className="input">
              {PERFIS.map((p) => (
                <option key={p.value} value={p.value}>
                  {p.label}
                </option>
              ))}
            </select>
            {errors.perfil && <p className="text-red-500 text-xs mt-1">Obrigatório</p>}
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="label">Valor Mínimo (R$) *</label>
              <Controller
                name="valor_min"
                control={control}
                rules={{ required: true }}
                render={({ field }) => (
                  <input
                    type="text"
                    inputMode="numeric"
                    className="input"
                    placeholder="0,00"
                    value={field.value || ''}
                    onChange={(e) => field.onChange(formatCurrencyInput(e.target.value))}
                  />
                )}
              />
              {errors.valor_min && <p className="text-red-500 text-xs mt-1">Obrigatório</p>}
            </div>
            <div>
              <label className="label">Valor Máximo (R$) *</label>
              <Controller
                name="valor_max"
                control={control}
                rules={{ required: true }}
                render={({ field }) => (
                  <input
                    type="text"
                    inputMode="numeric"
                    className="input"
                    placeholder="0,00"
                    value={field.value || ''}
                    onChange={(e) => field.onChange(formatCurrencyInput(e.target.value))}
                  />
                )}
              />
              {errors.valor_max && <p className="text-red-500 text-xs mt-1">Obrigatório</p>}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="label">Percentual Total (%) *</label>
              <input
                type="number"
                step="0.0001"
                min="0.0001"
                {...register('percentual_total', { required: true, valueAsNumber: true })}
                className="input"
                placeholder="Ex.: 0.8000"
              />
            </div>
            <div>
              <label className="label">Quantidade de Parcelas *</label>
              <input type="number" min="1" {...register('qtd_parcelas', { required: true, min: 1, valueAsNumber: true })} className="input" />
            </div>
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

