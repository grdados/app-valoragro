import { useEffect, useState } from 'react'
import { useForm } from 'react-hook-form'
import { Plus, Search, Pencil, Trash2, X } from 'lucide-react'
import toast from 'react-hot-toast'
import { clientesApi } from '../services/api'
import { useAuth } from '../hooks/useAuth'
import PageHeader from '../components/PageHeader'
import type { Cliente } from '../types'

const UF_LIST = ['AC','AL','AM','AP','BA','CE','DF','ES','GO','MA','MG','MS','MT','PA','PB','PE','PI','PR','RJ','RN','RO','RR','RS','SC','SE','SP','TO']

export default function ClientesPage() {
  const { user } = useAuth()
  const isAdmin = user?.perfil === 'admin'
  const [clientes, setClientes] = useState<Cliente[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [showModal, setShowModal] = useState(false)
  const [editing, setEditing] = useState<Cliente | null>(null)
  const { register, handleSubmit, reset, formState: { errors, isSubmitting } } = useForm<Cliente>()

  const load = async () => {
    setLoading(true)
    try {
      const res = await clientesApi.list({ search })
      setClientes(res.data.results || res.data)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { load() }, [search])

  const openCreate = () => { setEditing(null); reset({}); setShowModal(true) }
  const openEdit = (c: Cliente) => { setEditing(c); reset(c); setShowModal(true) }

  const onSubmit = async (data: Cliente) => {
    try {
      if (editing) {
        await clientesApi.update(editing.id, data as unknown as Record<string, unknown>)
        toast.success('Cliente atualizado!')
      } else {
        await clientesApi.create(data as unknown as Record<string, unknown>)
        toast.success('Cliente cadastrado!')
      }
      setShowModal(false)
      load()
    } catch (err: unknown) {
      const e = err as { response?: { data?: Record<string, string[]> } }
      const msg = Object.entries(e?.response?.data || {}).map(([k, v]) => `${k}: ${v}`).join('; ')
      toast.error(msg || 'Erro ao salvar cliente')
    }
  }

  const handleDelete = async (id: number) => {
    if (!confirm('Excluir cliente?')) return
    try {
      await clientesApi.remove(id)
      toast.success('Cliente removido!')
      load()
    } catch {
      toast.error('Erro ao remover cliente')
    }
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Clientes"
        subtitle="Gerenciar cadastro de clientes"
        actions={
          <button onClick={openCreate} className="btn-primary">
            <Plus className="w-4 h-4" /> Novo Cliente
          </button>
        }
      />

      <div className="card p-4">
        <div className="flex gap-3 mb-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-2.5 w-4 h-4 text-gray-400" />
            <input
              className="input pl-9"
              placeholder="Buscar por nome ou CPF..."
              value={search}
              onChange={e => setSearch(e.target.value)}
            />
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="table-header">
              <tr>
                <th className="px-4 py-3 text-left">Nome</th>
                <th className="px-4 py-3 text-left">CPF</th>
                <th className="px-4 py-3 text-left">Celular</th>
                <th className="px-4 py-3 text-left">E-mail</th>
                <th className="px-4 py-3 text-left">Profissão</th>
                <th className="px-4 py-3 text-center">Status</th>
                <th className="px-4 py-3 text-center">Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {loading ? (
                <tr><td colSpan={7} className="px-4 py-8 text-center text-gray-400">Carregando...</td></tr>
              ) : clientes.length === 0 ? (
                <tr><td colSpan={7} className="px-4 py-8 text-center text-gray-400">Nenhum cliente encontrado</td></tr>
              ) : clientes.map(c => (
                <tr key={c.id} className="table-row-hover">
                  <td className="px-4 py-3 font-medium">{c.nome}</td>
                  <td className="px-4 py-3">{c.cpf}</td>
                  <td className="px-4 py-3">{c.celular}</td>
                  <td className="px-4 py-3">{c.email}</td>
                  <td className="px-4 py-3">{c.profissao}</td>
                  <td className="px-4 py-3 text-center">
                    <span className={`badge ${c.ativo ? 'badge-success' : 'badge-error'}`}>
                      {c.ativo ? 'Ativo' : 'Inativo'}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex justify-center gap-2">
                      <button onClick={() => openEdit(c)} className="p-1.5 rounded hover:bg-blue-50 text-blue-600" title="Editar">
                        <Pencil className="w-4 h-4" />
                      </button>
                      {isAdmin && (
                        <button onClick={() => handleDelete(c.id)} className="p-1.5 rounded hover:bg-red-50 text-red-500" title="Excluir">
                          <Trash2 className="w-4 h-4" />
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {showModal && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-start justify-center overflow-y-auto py-8 px-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-3xl">
            <div className="flex items-center justify-between px-6 py-4 border-b">
              <h2 className="text-lg font-semibold text-gray-900">{editing ? 'Editar Cliente' : 'Novo Cliente'}</h2>
              <button onClick={() => setShowModal(false)} className="p-1 rounded hover:bg-gray-100"><X className="w-5 h-5" /></button>
            </div>
            <form onSubmit={handleSubmit(onSubmit)} className="p-6 space-y-5">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="sm:col-span-2">
                  <label className="label">Nome *</label>
                  <input {...register('nome', { required: true })} className="input" />
                  {errors.nome && <p className="text-red-500 text-xs mt-1">Obrigatório</p>}
                </div>
                <div>
                  <label className="label">CPF *</label>
                  <input {...register('cpf', { required: true })} className="input" placeholder="000.000.000-00" />
                  {errors.cpf && <p className="text-red-500 text-xs mt-1">Obrigatório</p>}
                </div>
                <div>
                  <label className="label">Identidade</label>
                  <input {...register('identidade')} className="input" />
                </div>
                <div>
                  <label className="label">Órgão Emissor</label>
                  <input {...register('orgao_emissor')} className="input" placeholder="SSP/SP" />
                </div>
                <div>
                  <label className="label">Data de Nascimento</label>
                  <input type="date" {...register('data_nascimento')} className="input" />
                </div>
                <div>
                  <label className="label">Sexo</label>
                  <select {...register('sexo')} className="input">
                    <option value="">Selecione</option>
                    <option value="M">Masculino</option>
                    <option value="F">Feminino</option>
                    <option value="O">Outro</option>
                  </select>
                </div>
                <div>
                  <label className="label">Estado Civil</label>
                  <select {...register('estado_civil')} className="input">
                    <option value="">Selecione</option>
                    <option value="solteiro">Solteiro(a)</option>
                    <option value="casado">Casado(a)</option>
                    <option value="divorciado">Divorciado(a)</option>
                    <option value="viuvo">Viúvo(a)</option>
                    <option value="uniao_estavel">União Estável</option>
                  </select>
                </div>
                <div>
                  <label className="label">Nacionalidade</label>
                  <input {...register('nacionalidade')} className="input" />
                </div>
                <div>
                  <label className="label">UF</label>
                  <select {...register('uf')} className="input">
                    <option value="">Selecione</option>
                    {UF_LIST.map(u => <option key={u} value={u}>{u}</option>)}
                  </select>
                </div>
                <div>
                  <label className="label">Naturalidade</label>
                  <input {...register('naturalidade')} className="input" />
                </div>
                <div>
                  <label className="label">Celular</label>
                  <input {...register('celular')} className="input" placeholder="(00) 00000-0000" />
                </div>
                <div>
                  <label className="label">E-mail</label>
                  <input type="email" {...register('email')} className="input" />
                </div>
                <div>
                  <label className="label">Escolaridade</label>
                  <select {...register('escolaridade')} className="input">
                    <option value="">Selecione</option>
                    <option value="fundamental">Ensino Fundamental</option>
                    <option value="medio">Ensino Médio</option>
                    <option value="superior">Ensino Superior</option>
                    <option value="pos">Pós-Graduação</option>
                  </select>
                </div>
                <div>
                  <label className="label">Profissão</label>
                  <input {...register('profissao')} className="input" />
                </div>
                <div className="sm:col-span-2">
                  <label className="label">Endereço</label>
                  <input {...register('endereco')} className="input" />
                </div>
                <div>
                  <label className="label">Número</label>
                  <input {...register('numero')} className="input" />
                </div>
                <div>
                  <label className="label">Empresa</label>
                  <input {...register('empresa')} className="input" />
                </div>
                <div>
                  <label className="label">Data de Admissão</label>
                  <input type="date" {...register('data_admissao')} className="input" />
                </div>
                <div>
                  <label className="label">Renda (R$)</label>
                  <input type="number" step="0.01" {...register('renda', { valueAsNumber: true })} className="input" />
                </div>
                <div>
                  <label className="label">Conta Bancária</label>
                  <input {...register('conta_bancaria')} className="input" />
                </div>
                <div>
                  <label className="label">Agência</label>
                  <input {...register('agencia')} className="input" />
                </div>
                {editing && (
                  <div className="flex items-center gap-2 sm:col-span-2">
                    <input type="checkbox" id="ativo" {...register('ativo')} className="w-4 h-4" />
                    <label htmlFor="ativo" className="text-sm text-gray-700">Ativo</label>
                  </div>
                )}
              </div>
              <div className="flex justify-end gap-3 pt-2">
                <button type="button" onClick={() => setShowModal(false)} className="btn-secondary">Cancelar</button>
                <button type="submit" disabled={isSubmitting} className="btn-primary">
                  {isSubmitting ? 'Salvando...' : 'Salvar'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
