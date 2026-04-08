import { useEffect, useState } from 'react'
import { Plus, Pencil, Trash2 } from 'lucide-react'
import { useForm } from 'react-hook-form'
import toast from 'react-hot-toast'

import { tiposBemApi } from '../../services/api'
import PageHeader from '../../components/PageHeader'
import DataTable from '../../components/DataTable'
import Modal from '../../components/Modal'
import type { TipoBem } from '../../types'

interface FormData {
  descricao: string
  ativo: boolean
}

export default function TiposBemPage() {
  const [items, setItems] = useState<TipoBem[]>([])
  const [loading, setLoading] = useState(true)
  const [modalOpen, setModalOpen] = useState(false)
  const [editing, setEditing] = useState<TipoBem | null>(null)
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
      const res = await tiposBemApi.list()
      setItems(res.data.results || res.data)
    } catch {
      toast.error('Erro ao carregar tipos de bem')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchData()
  }, [])

  const openCreate = () => {
    setEditing(null)
    reset({ descricao: '', ativo: true })
    setModalOpen(true)
  }

  const openEdit = (item: TipoBem) => {
    setEditing(item)
    reset({ descricao: item.descricao || '', ativo: item.ativo })
    setModalOpen(true)
  }

  const inferirNomePorDescricao = (descricao: string) => {
    const normalizada = descricao
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .toLowerCase()

    if (normalizada.includes('imov')) return 'imoveis'
    if (
      normalizada.includes('movel') ||
      normalizada.includes('carro') ||
      normalizada.includes('moto') ||
      normalizada.includes('veiculo')
    ) {
      return 'moveis'
    }
    return 'outros'
  }

  const onSubmit = async (data: FormData) => {
    setSaving(true)
    try {
      const descricao = (data.descricao || '').trim()

      const payload = {
        ...data,
        descricao,
        nome: editing?.nome || inferirNomePorDescricao(descricao),
      }

      if (editing) {
        await tiposBemApi.update(editing.id, payload)
        toast.success('Tipo de bem atualizado!')
      } else {
        await tiposBemApi.create(payload)
        toast.success('Tipo de bem criado!')
      }
      setModalOpen(false)
      fetchData()
    } catch (err: unknown) {
      const error = err as { response?: { data?: Record<string, string[]> } }
      const msg = Object.values(error?.response?.data || {}).flat()[0] || 'Erro ao salvar tipo de bem'
      toast.error(String(msg))
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async (item: TipoBem) => {
    if (!confirm(`Remover tipo de bem "${item.nome_display || item.nome}"?`)) return
    try {
      await tiposBemApi.remove(item.id)
      toast.success('Tipo de bem removido!')
      fetchData()
    } catch {
      toast.error('Erro ao remover tipo de bem')
    }
  }

  const columns = [
    { key: 'nome_display', header: 'Nome' },
    { key: 'descricao', header: 'Descrição' },
    {
      key: 'ativo',
      header: 'Status',
      render: (row: TipoBem) => (
        <span className={row.ativo ? 'badge-ativa' : 'badge-cancelada'}>
          {row.ativo ? 'Ativo' : 'Inativo'}
        </span>
      ),
    },
  ]

  return (
    <div className="space-y-6">
      <PageHeader
        title="Tipo de Bem"
        subtitle="Cadastro de tipos de bem para consórcios"
        actions={
          <button onClick={openCreate} className="btn-primary">
            <Plus className="w-4 h-4" />
            Novo Tipo de Bem
          </button>
        }
      />

      <DataTable
        columns={columns}
        data={items}
        keyField="id"
        loading={loading}
        searchable
        searchFields={['nome_display', 'descricao']}
        emptyMessage="Nenhum tipo de bem cadastrado"
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

      <Modal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        title={editing ? 'Editar Tipo de Bem' : 'Novo Tipo de Bem'}
      >
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div>
            <label className="label">Descrição *</label>
            <input {...register('descricao', { required: true })} className="input" />
            {errors.descricao && <p className="text-red-500 text-xs mt-1">Obrigatório</p>}
          </div>
          <div className="flex items-center gap-2">
            <input type="checkbox" id="ativo_tipo_bem" {...register('ativo')} className="w-4 h-4" />
            <label htmlFor="ativo_tipo_bem" className="text-sm">Ativo</label>
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
