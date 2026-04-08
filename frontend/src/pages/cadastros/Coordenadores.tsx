import { useEffect, useState } from 'react'
import { Plus, Pencil, Trash2 } from 'lucide-react'
import { coordenadoresApi, supervisoresApi } from '../../services/api'
import PageHeader from '../../components/PageHeader'
import DataTable from '../../components/DataTable'
import Modal from '../../components/Modal'
import { useForm } from 'react-hook-form'
import { formatDate } from '../../lib/utils'
import toast from 'react-hot-toast'
import type { Coordenador, Supervisor } from '../../types'

interface FormData { supervisor: number | null; nome: string; cpf: string; email: string; telefone: string; ativo: boolean }

export default function CoordenadoresPage() {
  const [items, setItems] = useState<Coordenador[]>([])
  const [supervisores, setSupervisores] = useState<Supervisor[]>([])
  const [loading, setLoading] = useState(true)
  const [modalOpen, setModalOpen] = useState(false)
  const [editing, setEditing] = useState<Coordenador | null>(null)
  const [saving, setSaving] = useState(false)
  const { register, handleSubmit, reset, formState: { errors } } = useForm<FormData>()

  const fetchData = async () => {
    setLoading(true)
    try {
      const [c, s] = await Promise.all([coordenadoresApi.list(), supervisoresApi.list()])
      setItems(c.data.results || c.data)
      setSupervisores(s.data.results || s.data)
    } catch { toast.error('Erro ao carregar coordenadores') }
    finally { setLoading(false) }
  }

  useEffect(() => { fetchData() }, [])

  const openCreate = () => { setEditing(null); reset({ ativo: true, supervisor: null }); setModalOpen(true) }
  const openEdit = (item: Coordenador) => { setEditing(item); reset(item); setModalOpen(true) }

  const onSubmit = async (data: FormData) => {
    setSaving(true)
    try {
      if (editing) { await coordenadoresApi.update(editing.id, data); toast.success('Coordenador atualizado!') }
      else { await coordenadoresApi.create(data); toast.success('Coordenador criado!') }
      setModalOpen(false)
      fetchData()
    } catch (err: unknown) {
      const error = err as { response?: { data?: Record<string, string[]> } }
      const msg = Object.values(error?.response?.data || {}).flat()[0] || 'Erro ao salvar'
      toast.error(String(msg))
    } finally { setSaving(false) }
  }

  const handleDelete = async (item: Coordenador) => {
    if (!confirm(`Remover ${item.nome}?`)) return
    try { await coordenadoresApi.remove(item.id); toast.success('Removido!'); fetchData() }
    catch { toast.error('Erro ao remover') }
  }

  const columns = [
    { key: 'nome', header: 'Nome' },
    { key: 'cpf', header: 'CPF' },
    { key: 'email', header: 'Email' },
    { key: 'supervisor_nome', header: 'Supervisor' },
    { key: 'total_vendedores', header: 'Vendedores' },
    { key: 'ativo', header: 'Status', render: (row: Coordenador) => <span className={row.ativo ? 'badge-ativa' : 'badge-cancelada'}>{row.ativo ? 'Ativo' : 'Inativo'}</span> },
    { key: 'criado_em', header: 'Cadastro', render: (row: Coordenador) => formatDate(row.criado_em) },
  ]

  return (
    <div className="space-y-6">
      <PageHeader title="Coordenadores" subtitle="Gestão de coordenadores de vendas" actions={<button onClick={openCreate} className="btn-primary"><Plus className="w-4 h-4" />Novo Coordenador</button>} />
      <DataTable columns={columns} data={items} keyField="id" loading={loading} searchable searchFields={['nome', 'email', 'cpf']} emptyMessage="Nenhum coordenador cadastrado"
        actions={(row) => (
          <div className="flex gap-2 justify-end">
            <button onClick={() => openEdit(row)} className="btn-secondary py-1.5 px-2.5 text-xs"><Pencil className="w-3.5 h-3.5" /></button>
            <button onClick={() => handleDelete(row)} className="btn-danger py-1.5 px-2.5 text-xs"><Trash2 className="w-3.5 h-3.5" /></button>
          </div>
        )}
      />
      <Modal open={modalOpen} onClose={() => setModalOpen(false)} title={editing ? 'Editar Coordenador' : 'Novo Coordenador'}>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div>
            <label className="label">Supervisor *</label>
            <select {...register('supervisor', { required: true })} className="input">
              <option value="">Selecione um supervisor</option>
              {supervisores.map((s) => <option key={s.id} value={s.id}>{s.nome}</option>)}
            </select>
            {errors.supervisor && <p className="text-red-500 text-xs mt-1">ObrigatÃ³rio</p>}
          </div>
          <div><label className="label">Nome *</label><input {...register('nome', { required: true })} className="input" />{errors.nome && <p className="text-red-500 text-xs mt-1">Obrigatório</p>}</div>
          <div><label className="label">CPF *</label><input {...register('cpf', { required: true })} className="input" placeholder="000.000.000-00" />{errors.cpf && <p className="text-red-500 text-xs mt-1">Obrigatório</p>}</div>
          <div><label className="label">Email *</label><input type="email" {...register('email', { required: true })} className="input" />{errors.email && <p className="text-red-500 text-xs mt-1">Obrigatório</p>}</div>
          <div><label className="label">Telefone</label><input {...register('telefone')} className="input" placeholder="(11) 99999-0000" /></div>
          <div className="flex items-center gap-2"><input type="checkbox" id="ativo" {...register('ativo')} className="w-4 h-4" /><label htmlFor="ativo" className="text-sm">Ativo</label></div>
          <div className="flex justify-end gap-3 pt-2">
            <button type="button" onClick={() => setModalOpen(false)} className="btn-secondary">Cancelar</button>
            <button type="submit" disabled={saving} className="btn-primary">{saving ? 'Salvando...' : 'Salvar'}</button>
          </div>
        </form>
      </Modal>
    </div>
  )
}
