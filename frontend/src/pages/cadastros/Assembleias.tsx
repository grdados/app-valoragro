import { useEffect, useState } from 'react'
import { Plus, Pencil, Trash2 } from 'lucide-react'
import { assembleiasApi, consorciosApi } from '../../services/api'
import PageHeader from '../../components/PageHeader'
import DataTable from '../../components/DataTable'
import Modal from '../../components/Modal'
import { useForm } from 'react-hook-form'
import { formatDate } from '../../lib/utils'
import toast from 'react-hot-toast'
import type { Assembleia, Consorcio } from '../../types'

interface FormData { consorcio: number; data_assembleia: string; descricao: string }

export default function AssembleiasPage() {
  const [items, setItems] = useState<Assembleia[]>([])
  const [consorcios, setConsorcios] = useState<Consorcio[]>([])
  const [loading, setLoading] = useState(true)
  const [modalOpen, setModalOpen] = useState(false)
  const [editing, setEditing] = useState<Assembleia | null>(null)
  const [saving, setSaving] = useState(false)
  const { register, handleSubmit, reset, formState: { errors } } = useForm<FormData>()

  const fetch = async () => {
    setLoading(true)
    try {
      const [a, c] = await Promise.all([assembleiasApi.list(), consorciosApi.list()])
      setItems(a.data.results || a.data)
      setConsorcios(c.data.results || c.data)
    } catch { toast.error('Erro ao carregar') }
    finally { setLoading(false) }
  }

  useEffect(() => { fetch() }, [])

  const openCreate = () => { setEditing(null); reset(); setModalOpen(true) }
  const openEdit = (item: Assembleia) => { setEditing(item); reset(item); setModalOpen(true) }

  const onSubmit = async (data: FormData) => {
    setSaving(true)
    try {
      if (editing) { await assembleiasApi.update(editing.id, data); toast.success('Assembleia atualizada!') }
      else { await assembleiasApi.create(data); toast.success('Assembleia criada!') }
      setModalOpen(false)
      fetch()
    } catch { toast.error('Erro ao salvar') }
    finally { setSaving(false) }
  }

  const handleDelete = async (item: Assembleia) => {
    if (!confirm('Remover esta assembleia?')) return
    try { await assembleiasApi.remove(item.id); toast.success('Removida!'); fetch() }
    catch { toast.error('Erro ao remover') }
  }

  const columns = [
    { key: 'consorcio_nome', header: 'Consórcio' },
    { key: 'data_assembleia', header: 'Data', render: (row: Assembleia) => formatDate(row.data_assembleia) },
    { key: 'descricao', header: 'Descrição' },
  ]

  return (
    <div className="space-y-6">
      <PageHeader title="Assembleias" subtitle="Datas de assembleia dos consórcios" actions={<button onClick={openCreate} className="btn-primary"><Plus className="w-4 h-4" />Nova Assembleia</button>} />
      <DataTable columns={columns} data={items} keyField="id" loading={loading} emptyMessage="Nenhuma assembleia cadastrada"
        actions={(row) => (
          <div className="flex gap-2 justify-end">
            <button onClick={() => openEdit(row)} className="btn-secondary py-1.5 px-2.5 text-xs"><Pencil className="w-3.5 h-3.5" /></button>
            <button onClick={() => handleDelete(row)} className="btn-danger py-1.5 px-2.5 text-xs"><Trash2 className="w-3.5 h-3.5" /></button>
          </div>
        )}
      />
      <Modal open={modalOpen} onClose={() => setModalOpen(false)} title={editing ? 'Editar Assembleia' : 'Nova Assembleia'}>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div>
            <label className="label">Consórcio *</label>
            <select {...register('consorcio', { required: true })} className="input">
              <option value="">Selecione</option>
              {consorcios.map((c) => <option key={c.id} value={c.id}>{c.nome}</option>)}
            </select>
            {errors.consorcio && <p className="text-red-500 text-xs mt-1">Obrigatório</p>}
          </div>
          <div><label className="label">Data da Assembleia *</label><input type="date" {...register('data_assembleia', { required: true })} className="input" />{errors.data_assembleia && <p className="text-red-500 text-xs mt-1">Obrigatório</p>}</div>
          <div><label className="label">Descrição</label><input {...register('descricao')} className="input" /></div>
          <div className="flex justify-end gap-3 pt-2">
            <button type="button" onClick={() => setModalOpen(false)} className="btn-secondary">Cancelar</button>
            <button type="submit" disabled={saving} className="btn-primary">{saving ? 'Salvando...' : 'Salvar'}</button>
          </div>
        </form>
      </Modal>
    </div>
  )
}
