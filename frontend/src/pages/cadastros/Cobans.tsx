import { useEffect, useState } from 'react'
import { Plus, Pencil, Trash2 } from 'lucide-react'
import { useForm } from 'react-hook-form'
import toast from 'react-hot-toast'

import { cobansApi } from '../../services/api'
import PageHeader from '../../components/PageHeader'
import DataTable from '../../components/DataTable'
import Modal from '../../components/Modal'
import type { COBAN } from '../../types'

interface FormData {
  sigla: string
  descricao: string
  ativo: boolean
}

export default function CobansPage() {
  const [items, setItems] = useState<COBAN[]>([])
  const [loading, setLoading] = useState(true)
  const [modalOpen, setModalOpen] = useState(false)
  const [editing, setEditing] = useState<COBAN | null>(null)
  const [saving, setSaving] = useState(false)
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<FormData>()

  const fetchData = async () => {
    setLoading(true)
    try {
      const res = await cobansApi.list()
      setItems(res.data.results || res.data)
    } catch {
      toast.error('Erro ao carregar COBAN')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchData()
  }, [])

  const openCreate = () => {
    setEditing(null)
    reset({ ativo: true })
    setModalOpen(true)
  }

  const openEdit = (item: COBAN) => {
    setEditing(item)
    reset(item)
    setModalOpen(true)
  }

  const onSubmit = async (data: FormData) => {
    setSaving(true)
    try {
      if (editing) {
        await cobansApi.update(editing.id, data)
        toast.success('COBAN atualizado!')
      } else {
        await cobansApi.create(data)
        toast.success('COBAN criado!')
      }
      setModalOpen(false)
      fetchData()
    } catch (err: unknown) {
      const error = err as { response?: { data?: Record<string, string[]> } }
      const msg = Object.values(error?.response?.data || {}).flat()[0] || 'Erro ao salvar COBAN'
      toast.error(String(msg))
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async (item: COBAN) => {
    if (!confirm(`Remover COBAN ${item.sigla}?`)) return
    try {
      await cobansApi.remove(item.id)
      toast.success('COBAN removido!')
      fetchData()
    } catch {
      toast.error('Erro ao remover COBAN')
    }
  }

  const columns = [
    { key: 'sigla', header: 'Sigla' },
    { key: 'descricao', header: 'Descrição' },
    {
      key: 'ativo',
      header: 'Status',
      render: (row: COBAN) => (
        <span className={row.ativo ? 'badge-ativa' : 'badge-cancelada'}>
          {row.ativo ? 'Ativo' : 'Inativo'}
        </span>
      ),
    },
  ]

  return (
    <div className="space-y-6">
      <PageHeader
        title="COBAN"
        subtitle="Cadastro de COBAN para uso em consórcios"
        actions={
          <button onClick={openCreate} className="btn-primary">
            <Plus className="w-4 h-4" />
            Novo COBAN
          </button>
        }
      />

      <DataTable
        columns={columns}
        data={items}
        keyField="id"
        loading={loading}
        searchable
        searchFields={['sigla', 'descricao']}
        emptyMessage="Nenhum COBAN cadastrado"
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

      <Modal open={modalOpen} onClose={() => setModalOpen(false)} title={editing ? 'Editar COBAN' : 'Novo COBAN'}>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div>
            <label className="label">Sigla *</label>
            <input {...register('sigla', { required: true })} className="input" placeholder="Ex: 1200" />
            {errors.sigla && <p className="text-red-500 text-xs mt-1">Obrigatório</p>}
          </div>
          <div>
            <label className="label">Descrição *</label>
            <input {...register('descricao', { required: true })} className="input" />
            {errors.descricao && <p className="text-red-500 text-xs mt-1">Obrigatório</p>}
          </div>
          <div className="flex items-center gap-2">
            <input type="checkbox" id="ativo_coban" {...register('ativo')} className="w-4 h-4" />
            <label htmlFor="ativo_coban" className="text-sm">Ativo</label>
          </div>
          <div className="flex justify-end gap-3 pt-2">
            <button type="button" onClick={() => setModalOpen(false)} className="btn-secondary">Cancelar</button>
            <button type="submit" disabled={saving} className="btn-primary">
              {saving ? 'Salvando...' : 'Salvar'}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  )
}
