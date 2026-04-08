import { useEffect, useState } from 'react'
import { Plus, Pencil, Trash2 } from 'lucide-react'
import { usuariosApi, vendedoresApi, coordenadoresApi, supervisoresApi } from '../../services/api'
import PageHeader from '../../components/PageHeader'
import DataTable from '../../components/DataTable'
import Modal from '../../components/Modal'
import { useForm } from 'react-hook-form'
import toast from 'react-hot-toast'
import { useAuth } from '../../hooks/useAuth'
import type { Coordenador, Vendedor, Supervisor } from '../../types'

interface SystemUser {
  id: number; username: string; email: string; first_name: string; last_name: string
  perfil: string; is_active: boolean; supervisor_ref: number | null; coordenador_ref: number | null; vendedor_ref: number | null
}
interface FormData {
  username: string; email: string; first_name: string; last_name: string; perfil: string
  password: string; is_active: boolean; supervisor_ref: number | null; coordenador_ref: number | null; vendedor_ref: number | null
}

export default function UsuariosPage() {
  const { isDev } = useAuth()
  const [items, setItems] = useState<SystemUser[]>([])
  const [coordenadores, setCoordenadores] = useState<Coordenador[]>([])
  const [vendedores, setVendedores] = useState<Vendedor[]>([])
  const [supervisores, setSupervisores] = useState<Supervisor[]>([])
  const [loading, setLoading] = useState(true)
  const [modalOpen, setModalOpen] = useState(false)
  const [editing, setEditing] = useState<SystemUser | null>(null)
  const [saving, setSaving] = useState(false)
  const { register, handleSubmit, watch, reset, formState: { errors } } = useForm<FormData>()
  const perfilWatch = watch('perfil')

  const fetchData = async () => {
    setLoading(true)
    try {
      const [u, c, v, s] = await Promise.all([usuariosApi.list(), coordenadoresApi.list(), vendedoresApi.list(), supervisoresApi.list()])
      setItems(u.data.results || u.data)
      setCoordenadores(c.data.results || c.data)
      setVendedores(v.data.results || v.data)
      setSupervisores(s.data.results || s.data)
    } catch { toast.error('Erro ao carregar usuários') }
    finally { setLoading(false) }
  }

  useEffect(() => { fetchData() }, [])

  const openCreate = () => { setEditing(null); reset({ is_active: true, perfil: 'vendedor' }); setModalOpen(true) }
  const openEdit = (item: SystemUser) => { setEditing(item); reset({ ...item, password: '' }); setModalOpen(true) }

  const onSubmit = async (data: FormData) => {
    setSaving(true)
    try {
      if (data.perfil === 'supervisor' && !data.supervisor_ref) {
        toast.error('Selecione o supervisor vinculado para este usuÃ¡rio.')
        return
      }
      if (data.perfil === 'coordenador' && !data.coordenador_ref) {
        toast.error('Selecione o coordenador vinculado para este usuÃ¡rio.')
        return
      }

      const payload: Record<string, unknown> = { ...data }
      if (!data.password) delete payload.password
      if (data.perfil !== 'supervisor') payload.supervisor_ref = null
      if (data.perfil !== 'coordenador') payload.coordenador_ref = null
      if (data.perfil !== 'vendedor') payload.vendedor_ref = null
      if (editing) { await usuariosApi.update(editing.id, payload); toast.success('Usuário atualizado!') }
      else { await usuariosApi.create(payload); toast.success('Usuário criado!') }
      setModalOpen(false)
      fetchData()
    } catch (err: unknown) {
      const error = err as { response?: { data?: Record<string, string[]> } }
      const msg = Object.values(error?.response?.data || {}).flat()[0] || 'Erro ao salvar'
      toast.error(String(msg))
    } finally { setSaving(false) }
  }

  const handleDelete = async (item: SystemUser) => {
    if (!confirm(`Remover usuário ${item.username}?`)) return
    try { await usuariosApi.remove(item.id); toast.success('Removido!'); fetchData() }
    catch { toast.error('Erro ao remover') }
  }

  const canManageUser = (target: SystemUser) => {
    if (isDev()) return true
    return target.perfil !== 'dev'
  }

  const perfilLabels: Record<string, string> = {
    dev: 'Desenvolvedor', supervisor: 'Supervisor', coordenador: 'Coordenador', vendedor: 'Vendedor',
  }

  const columns = [
    { key: 'username', header: 'Usuário' },
    { key: 'first_name', header: 'Nome', render: (row: SystemUser) => `${row.first_name} ${row.last_name}`.trim() },
    { key: 'email', header: 'Email' },
    { key: 'perfil', header: 'Perfil', render: (row: SystemUser) => <span className="badge-ativa">{perfilLabels[row.perfil] || row.perfil}</span> },
    { key: 'is_active', header: 'Status', render: (row: SystemUser) => <span className={row.is_active ? 'badge-ativa' : 'badge-cancelada'}>{row.is_active ? 'Ativo' : 'Inativo'}</span> },
  ]

  return (
    <div className="space-y-6">
      <PageHeader title="Usuários do Sistema" subtitle="Gestão de acessos e perfis" actions={<button onClick={openCreate} className="btn-primary"><Plus className="w-4 h-4" />Novo Usuário</button>} />
      <DataTable columns={columns} data={items} keyField="id" loading={loading} searchable searchFields={['username', 'email']} emptyMessage="Nenhum usuário cadastrado"
        actions={(row) => (
          <div className="flex gap-2 justify-end">
            {canManageUser(row) && <button onClick={() => openEdit(row)} className="btn-secondary py-1.5 px-2.5 text-xs"><Pencil className="w-3.5 h-3.5" /></button>}
            {isDev() && <button onClick={() => handleDelete(row)} className="btn-danger py-1.5 px-2.5 text-xs"><Trash2 className="w-3.5 h-3.5" /></button>}
          </div>
        )}
      />
      <Modal open={modalOpen} onClose={() => setModalOpen(false)} title={editing ? 'Editar Usuário' : 'Novo Usuário'} size="lg">
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div><label className="label">Primeiro Nome *</label><input {...register('first_name', { required: true })} className="input" /></div>
            <div><label className="label">Sobrenome</label><input {...register('last_name')} className="input" /></div>
          </div>
          <div><label className="label">Usuário *</label><input {...register('username', { required: true })} className="input" />{errors.username && <p className="text-red-500 text-xs mt-1">Obrigatório</p>}</div>
          <div><label className="label">Email</label><input type="email" {...register('email')} className="input" /></div>
          <div>
            <label className="label">Senha {editing ? '(deixe em branco para não alterar)' : '*'}</label>
            <input type="password" {...register('password', { required: !editing })} className="input" />
            {errors.password && <p className="text-red-500 text-xs mt-1">Obrigatório para novos usuários</p>}
          </div>
          <div>
            <label className="label">Perfil *</label>
            <select {...register('perfil', { required: true })} className="input">
              {isDev() && <option value="dev">Desenvolvedor</option>}
              <option value="supervisor">Supervisor</option>
              <option value="coordenador">Coordenador</option>
              <option value="vendedor">Vendedor</option>
            </select>
          </div>
          {perfilWatch === 'supervisor' && (
            <div>
              <label className="label">Vincular ao Supervisor *</label>
              <select {...register('supervisor_ref', { required: true })} className="input">
                <option value="">Nenhum</option>
                {supervisores.map((s) => <option key={s.id} value={s.id}>{s.nome}</option>)}
              </select>
              {errors.supervisor_ref && <p className="text-red-500 text-xs mt-1">ObrigatÃ³rio</p>}
            </div>
          )}
          {perfilWatch === 'coordenador' && (
            <div>
              <label className="label">Vincular ao Cadastro de Coordenador *</label>
              <select {...register('coordenador_ref', { required: true })} className="input">
                <option value="">Nenhum</option>
                {coordenadores.map((c) => <option key={c.id} value={c.id}>{c.nome}</option>)}
              </select>
              {errors.coordenador_ref && <p className="text-red-500 text-xs mt-1">ObrigatÃ³rio</p>}
            </div>
          )}
          {perfilWatch === 'vendedor' && (
            <div>
              <label className="label">Vincular ao Vendedor</label>
              <select {...register('vendedor_ref')} className="input">
                <option value="">Nenhum</option>
                {vendedores.map((v) => <option key={v.id} value={v.id}>{v.nome}</option>)}
              </select>
            </div>
          )}
          <div className="flex items-center gap-2"><input type="checkbox" id="is_active" {...register('is_active')} className="w-4 h-4" /><label htmlFor="is_active" className="text-sm">Usuário ativo</label></div>
          <div className="flex justify-end gap-3 pt-2">
            <button type="button" onClick={() => setModalOpen(false)} className="btn-secondary">Cancelar</button>
            <button type="submit" disabled={saving} className="btn-primary">{saving ? 'Salvando...' : 'Salvar'}</button>
          </div>
        </form>
      </Modal>
    </div>
  )
}
