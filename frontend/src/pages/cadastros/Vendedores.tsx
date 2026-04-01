import { useEffect, useState } from 'react'
import { Plus, Pencil, Trash2 } from 'lucide-react'
import { vendedoresApi, coordenadoresApi } from '../../services/api'
import PageHeader from '../../components/PageHeader'
import DataTable from '../../components/DataTable'
import Modal from '../../components/Modal'
import { useForm } from 'react-hook-form'
import { formatDate } from '../../lib/utils'
import toast from 'react-hot-toast'
import { useAuth } from '../../hooks/useAuth'
import type { Vendedor, Coordenador } from '../../types'

const UF_LIST = ['AC','AL','AM','AP','BA','CE','DF','ES','GO','MA','MG','MS','MT','PA','PB','PE','PI','PR','RJ','RN','RO','RR','RS','SC','SE','SP','TO']

interface FormData {
  coordenador: number
  nome: string
  cpf: string
  email: string
  telefone: string
  foto: string
  cidade: string
  uf: string
  ativo: boolean
}

export default function VendedoresPage() {
  const { user, isCoordenador } = useAuth()
  const [items, setItems] = useState<Vendedor[]>([])
  const [coordenadores, setCoordenadores] = useState<Coordenador[]>([])
  const [loading, setLoading] = useState(true)
  const [modalOpen, setModalOpen] = useState(false)
  const [editing, setEditing] = useState<Vendedor | null>(null)
  const [saving, setSaving] = useState(false)
  const { register, handleSubmit, reset, formState: { errors } } = useForm<FormData>()

  const fetchData = async () => {
    setLoading(true)
    try {
      const [vRes, cRes] = await Promise.allSettled([vendedoresApi.list(), coordenadoresApi.list()])
      if (vRes.status === 'fulfilled') setItems(vRes.value.data.results || vRes.value.data)
      else toast.error('Erro ao carregar vendedores')
      if (cRes.status === 'fulfilled') setCoordenadores(cRes.value.data.results || cRes.value.data)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { fetchData() }, [])

  const openCreate = () => {
    setEditing(null)
    // Pre-fill coordenador for coordenador user
    const defaultCoord = isCoordenador() && coordenadores.length > 0 ? coordenadores[0].id : undefined
    reset({ ativo: true, coordenador: defaultCoord })
    setModalOpen(true)
  }

  const openEdit = (item: Vendedor) => { setEditing(item); reset(item); setModalOpen(true) }

  const onSubmit = async (data: FormData) => {
    setSaving(true)
    // If coordenador user and no coordenador selected, use their own
    if (isCoordenador() && !data.coordenador && coordenadores.length > 0) {
      data.coordenador = coordenadores[0].id
    }
    try {
      if (editing) { await vendedoresApi.update(editing.id, data); toast.success('Vendedor atualizado!') }
      else { await vendedoresApi.create(data); toast.success('Vendedor criado!') }
      setModalOpen(false)
      fetchData()
    } catch (err: unknown) {
      const error = err as { response?: { data?: Record<string, string[]> } }
      const msg = Object.values(error?.response?.data || {}).flat()[0] || 'Erro ao salvar'
      toast.error(String(msg))
    } finally { setSaving(false) }
  }

  const handleDelete = async (item: Vendedor) => {
    if (!confirm(`Remover ${item.nome}?`)) return
    try { await vendedoresApi.remove(item.id); toast.success('Removido!'); fetchData() }
    catch { toast.error('Erro ao remover') }
  }

  const columns = [
    {
      key: 'foto', header: 'Foto', render: (row: Vendedor) => (
        <img src={row.foto || '/media/vendedores/default.png'} alt={row.nome}
          className="w-8 h-8 rounded-full object-cover bg-gray-200"
          onError={(e) => { (e.target as HTMLImageElement).src = 'https://ui-avatars.com/api/?name=' + encodeURIComponent(row.nome) + '&background=1B4F8C&color=fff&size=32' }}
        />
      ),
    },
    { key: 'nome', header: 'Nome' },
    { key: 'cpf', header: 'CPF' },
    { key: 'email', header: 'Email' },
    { key: 'coordenador_nome', header: 'Coordenador' },
    { key: 'cidade', header: 'Cidade', render: (row: Vendedor) => row.cidade ? `${row.cidade}${row.uf ? ' / ' + row.uf : ''}` : '—' },
    { key: 'ativo', header: 'Status', render: (row: Vendedor) => <span className={row.ativo ? 'badge-ativa' : 'badge-cancelada'}>{row.ativo ? 'Ativo' : 'Inativo'}</span> },
    { key: 'criado_em', header: 'Cadastro', render: (row: Vendedor) => formatDate(row.criado_em) },
  ]

  const isCoord = isCoordenador()
  const myCoord = coordenadores[0]

  return (
    <div className="space-y-6">
      <PageHeader
        title="Vendedores"
        subtitle="Gestão de vendedores"
        actions={<button onClick={openCreate} className="btn-primary"><Plus className="w-4 h-4" />Novo Vendedor</button>}
      />
      <DataTable
        columns={columns} data={items} keyField="id" loading={loading}
        searchable searchFields={['nome', 'email', 'cpf', 'coordenador_nome']}
        emptyMessage="Nenhum vendedor cadastrado"
        actions={(row) => (
          <div className="flex gap-2 justify-end">
            <button onClick={() => openEdit(row)} className="btn-secondary py-1.5 px-2.5 text-xs"><Pencil className="w-3.5 h-3.5" /></button>
            <button onClick={() => handleDelete(row)} className="btn-danger py-1.5 px-2.5 text-xs"><Trash2 className="w-3.5 h-3.5" /></button>
          </div>
        )}
      />
      <Modal open={modalOpen} onClose={() => setModalOpen(false)} title={editing ? 'Editar Vendedor' : 'Novo Vendedor'} size="lg">
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="col-span-2">
              <label className="label">Nome *</label>
              <input {...register('nome', { required: true })} className="input" />
              {errors.nome && <p className="text-red-500 text-xs mt-1">Obrigatório</p>}
            </div>
            <div>
              <label className="label">CPF *</label>
              <input {...register('cpf', { required: true })} className="input" />
              {errors.cpf && <p className="text-red-500 text-xs mt-1">Obrigatório</p>}
            </div>
            <div>
              <label className="label">Telefone</label>
              <input {...register('telefone')} className="input" />
            </div>
            <div className="col-span-2">
              <label className="label">Email *</label>
              <input type="email" {...register('email', { required: true })} className="input" />
              {errors.email && <p className="text-red-500 text-xs mt-1">Obrigatório</p>}
            </div>

            {isCoord ? (
              <div className="col-span-2">
                <label className="label">Coordenador</label>
                <input
                  className="input bg-gray-50 text-gray-600"
                  value={myCoord?.nome || user?.nome || '—'}
                  readOnly
                />
                <input type="hidden" {...register('coordenador')} value={myCoord?.id || ''} />
              </div>
            ) : (
              <div className="col-span-2">
                <label className="label">Coordenador *</label>
                <select {...register('coordenador', { required: true })} className="input">
                  <option value="">Selecione</option>
                  {coordenadores.map((c) => <option key={c.id} value={c.id}>{c.nome}</option>)}
                </select>
                {errors.coordenador && <p className="text-red-500 text-xs mt-1">Obrigatório</p>}
              </div>
            )}

            <div>
              <label className="label">Cidade</label>
              <input {...register('cidade')} className="input" />
            </div>
            <div>
              <label className="label">UF</label>
              <select {...register('uf')} className="input">
                <option value="">Selecione</option>
                {UF_LIST.map((uf) => <option key={uf} value={uf}>{uf}</option>)}
              </select>
            </div>
            <div className="col-span-2">
              <label className="label">URL da Foto</label>
              <input {...register('foto')} className="input" placeholder="https://... ou deixe em branco para foto padrão" />
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
