import { useEffect, useState } from 'react'
import { Plus, Pencil, Trash2 } from 'lucide-react'
import { consorciosApi, cobansApi, tiposBemApi } from '../../services/api'
import PageHeader from '../../components/PageHeader'
import DataTable from '../../components/DataTable'
import Modal from '../../components/Modal'
import { useForm } from 'react-hook-form'
import { formatDate } from '../../lib/utils'
import toast from 'react-hot-toast'
import type { Consorcio, COBAN, TipoBem } from '../../types'

interface FormData { nome: string; coban: number; tipo_bem: number; vigencia_inicio: string; vigencia_fim: string; qtd_parcelas: number; ativo: boolean }

export default function ConsorciosPage() {
  const [items, setItems] = useState<Consorcio[]>([])
  const [cobans, setCobans] = useState<COBAN[]>([])
  const [tiposBem, setTiposBem] = useState<TipoBem[]>([])
  const [loading, setLoading] = useState(true)
  const [modalOpen, setModalOpen] = useState(false)
  const [editing, setEditing] = useState<Consorcio | null>(null)
  const [saving, setSaving] = useState(false)
  const { register, handleSubmit, reset, formState: { errors } } = useForm<FormData>()

  const fetch = async () => {
    setLoading(true)
    try {
      const [c, cb, t] = await Promise.all([consorciosApi.list(), cobansApi.list(), tiposBemApi.list()])
      setItems(c.data.results || c.data)
      setCobans(cb.data.results || cb.data)
      setTiposBem(t.data.results || t.data)
    } catch { toast.error('Erro ao carregar') }
    finally { setLoading(false) }
  }

  useEffect(() => { fetch() }, [])

  const openCreate = () => { setEditing(null); reset({ ativo: true, qtd_parcelas: 3 }); setModalOpen(true) }
  const openEdit = (item: Consorcio) => { setEditing(item); reset({ ...item, coban: item.coban, tipo_bem: item.tipo_bem }); setModalOpen(true) }

  const onSubmit = async (data: FormData) => {
    setSaving(true)
    try {
      if (editing) { await consorciosApi.update(editing.id, data); toast.success('Consórcio atualizado!') }
      else { await consorciosApi.create(data); toast.success('Consórcio criado!') }
      setModalOpen(false)
      fetch()
    } catch (err: unknown) {
      const error = err as { response?: { data?: Record<string, string[]> } }
      const msg = Object.values(error?.response?.data || {}).flat()[0] || 'Erro ao salvar'
      toast.error(String(msg))
    } finally { setSaving(false) }
  }

  const handleDelete = async (item: Consorcio) => {
    if (!confirm(`Remover ${item.nome}?`)) return
    try { await consorciosApi.remove(item.id); toast.success('Removido!'); fetch() }
    catch { toast.error('Erro ao remover') }
  }

  const columns = [
    { key: 'nome', header: 'Nome' },
    { key: 'coban_sigla', header: 'COBAN' },
    { key: 'tipo_bem_nome', header: 'Tipo de Bem' },
    { key: 'vigencia_inicio', header: 'Início Vigência', render: (row: Consorcio) => formatDate(row.vigencia_inicio) },
    { key: 'vigencia_fim', header: 'Fim Vigência', render: (row: Consorcio) => formatDate(row.vigencia_fim) },
    { key: 'qtd_parcelas', header: 'Parcelas' },
    { key: 'ativo', header: 'Status', render: (row: Consorcio) => <span className={row.ativo ? 'badge-ativa' : 'badge-cancelada'}>{row.ativo ? 'Ativo' : 'Inativo'}</span> },
  ]

  return (
    <div className="space-y-6">
      <PageHeader title="Consórcios" subtitle="Gestão de consórcios disponíveis" actions={<button onClick={openCreate} className="btn-primary"><Plus className="w-4 h-4" />Novo Consórcio</button>} />
      <DataTable columns={columns} data={items} keyField="id" loading={loading} searchable searchFields={['nome', 'coban_sigla', 'tipo_bem_nome']} emptyMessage="Nenhum consórcio cadastrado"
        actions={(row) => (
          <div className="flex gap-2 justify-end">
            <button onClick={() => openEdit(row)} className="btn-secondary py-1.5 px-2.5 text-xs"><Pencil className="w-3.5 h-3.5" /></button>
            <button onClick={() => handleDelete(row)} className="btn-danger py-1.5 px-2.5 text-xs"><Trash2 className="w-3.5 h-3.5" /></button>
          </div>
        )}
      />
      <Modal open={modalOpen} onClose={() => setModalOpen(false)} title={editing ? 'Editar Consórcio' : 'Novo Consórcio'} size="lg">
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div><label className="label">Nome *</label><input {...register('nome', { required: true })} className="input" />{errors.nome && <p className="text-red-500 text-xs mt-1">Obrigatório</p>}</div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="label">COBAN *</label>
              <select {...register('coban', { required: true })} className="input">
                <option value="">Selecione</option>
                {cobans.map((c) => <option key={c.id} value={c.id}>{c.sigla}</option>)}
              </select>
            </div>
            <div>
              <label className="label">Tipo de Bem *</label>
              <select {...register('tipo_bem', { required: true })} className="input">
                <option value="">Selecione</option>
                {tiposBem.map((t) => <option key={t.id} value={t.id}>{t.nome_display}</option>)}
              </select>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div><label className="label">Início Vigência *</label><input type="date" {...register('vigencia_inicio', { required: true })} className="input" /></div>
            <div><label className="label">Fim Vigência *</label><input type="date" {...register('vigencia_fim', { required: true })} className="input" /></div>
          </div>
          <div><label className="label">Quantidade de Parcelas *</label><input type="number" min="1" {...register('qtd_parcelas', { required: true, min: 1 })} className="input" /></div>
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
