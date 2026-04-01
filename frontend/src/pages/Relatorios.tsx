import { useState, useEffect } from 'react'
import { Download, FileSpreadsheet, FileText } from 'lucide-react'
import { relatoriosApi, vendedoresApi, coordenadoresApi, clientesApi } from '../services/api'
import { useAuth } from '../hooks/useAuth'
import PageHeader from '../components/PageHeader'
import { downloadBlob } from '../lib/utils'
import toast from 'react-hot-toast'
import type { Vendedor, Coordenador, Cliente } from '../types'

const TIPOS = [
  { value: 'aberto', label: 'Comissões em Aberto', desc: 'Parcelas com status Pendente' },
  { value: 'atraso', label: 'Comissões em Atraso', desc: 'Parcelas com status Vencido' },
  { value: 'pagas', label: 'Comissões Pagas', desc: 'Parcelas com status Pago' },
  { value: 'extrato_vendedor', label: 'Extrato por Vendedor', desc: 'Parcelas agrupadas por vendedor' },
  { value: 'extrato_coordenador', label: 'Extrato por Coordenador', desc: 'Parcelas agrupadas por coordenador' },
  { value: 'por_cliente', label: 'Comissões por Cliente', desc: 'Parcelas filtradas por cliente ou CPF' },
  { value: 'fechamento_contrato', label: 'Fechamento por Contrato', desc: 'Resumo de comissões por contrato' },
  { value: 'contemplados', label: 'Contratos Contemplados', desc: 'Contratos com status Contemplado' },
  { value: 'a_contemplar', label: 'Contratos a Contemplar', desc: 'Contratos com status A Contemplar' },
]

export default function RelatoriosPage() {
  const { user } = useAuth()
  const [tipo, setTipo] = useState('aberto')
  const [formato, setFormato] = useState<'excel' | 'pdf'>('excel')
  const [vendedor, setVendedor] = useState('')
  const [coordenador, setCoordenador] = useState('')
  const [clienteId, setClienteId] = useState('')
  const [cpfCliente, setCpfCliente] = useState('')
  const [contrato, setContrato] = useState('')
  const [dataInicio, setDataInicio] = useState('')
  const [dataFim, setDataFim] = useState('')
  const [loading, setLoading] = useState(false)
  const [vendedores, setVendedores] = useState<Vendedor[]>([])
  const [coordenadores, setCoordenadores] = useState<Coordenador[]>([])
  const [clientes, setClientes] = useState<Cliente[]>([])

  useEffect(() => {
    const promises: Promise<unknown>[] = [clientesApi.list({ ativo: true })]
    if (user?.perfil === 'admin') {
      promises.push(vendedoresApi.list(), coordenadoresApi.list())
    } else if (user?.perfil === 'coordenador') {
      promises.push(vendedoresApi.list())
    }
    Promise.all(promises).then(([cl, v, c]) => {
      setClientes((cl as { data: { results?: Cliente[] } & Cliente[] }).data.results || (cl as { data: Cliente[] }).data)
      if (v) setVendedores((v as { data: { results?: Vendedor[] } & Vendedor[] }).data.results || (v as { data: Vendedor[] }).data)
      if (c) setCoordenadores((c as { data: { results?: Coordenador[] } & Coordenador[] }).data.results || (c as { data: Coordenador[] }).data)
    })
  }, [user?.perfil])

  const handleDownload = async () => {
    setLoading(true)
    try {
      const params: Record<string, string> = { tipo, formato }
      if (vendedor) params.vendedor = vendedor
      if (coordenador) params.coordenador = coordenador
      if (clienteId) params.cliente = clienteId
      if (cpfCliente) params.cpf_cliente = cpfCliente
      if (contrato) params.contrato = contrato
      if (dataInicio) params.data_inicio = dataInicio
      if (dataFim) params.data_fim = dataFim

      const res = await relatoriosApi.download(params)
      const ext = formato === 'pdf' ? 'pdf' : 'xlsx'
      const tipoLabel = TIPOS.find((t) => t.value === tipo)?.label || 'relatorio'
      downloadBlob(res.data, `${tipoLabel.toLowerCase().replace(/ /g, '_')}.${ext}`)
      toast.success('Relatório gerado com sucesso!')
    } catch {
      toast.error('Erro ao gerar relatório')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="space-y-6 max-w-3xl">
      <PageHeader title="Relatórios" subtitle="Exporte relatórios de comissões em Excel ou PDF" />

      <div className="card p-6 space-y-6">
        <div>
          <label className="label">Tipo de Relatório</label>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mt-2">
            {TIPOS.map((t) => (
              <button
                key={t.value}
                type="button"
                onClick={() => setTipo(t.value)}
                className={`p-4 rounded-xl border-2 text-left transition-all ${tipo === t.value ? 'border-[#1B4F8C] bg-blue-50' : 'border-gray-200 hover:border-blue-300'}`}
              >
                <p className={`text-sm font-medium ${tipo === t.value ? 'text-[#1B4F8C]' : 'text-gray-900'}`}>{t.label}</p>
                <p className="text-xs text-gray-500 mt-0.5">{t.desc}</p>
              </button>
            ))}
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {user?.perfil !== 'vendedor' && (
            <div>
              <label className="label">Vendedor</label>
              <select value={vendedor} onChange={(e) => setVendedor(e.target.value)} className="input">
                <option value="">Todos</option>
                {vendedores.map((v) => <option key={v.id} value={v.id}>{v.nome}</option>)}
              </select>
            </div>
          )}
          {user?.perfil === 'admin' && (
            <div>
              <label className="label">Coordenador</label>
              <select value={coordenador} onChange={(e) => setCoordenador(e.target.value)} className="input">
                <option value="">Todos</option>
                {coordenadores.map((c) => <option key={c.id} value={c.id}>{c.nome}</option>)}
              </select>
            </div>
          )}
          <div>
            <label className="label">Cliente</label>
            <select value={clienteId} onChange={(e) => setClienteId(e.target.value)} className="input">
              <option value="">Todos</option>
              {clientes.map((c) => <option key={c.id} value={c.id}>{c.nome} — {c.cpf}</option>)}
            </select>
          </div>
          <div>
            <label className="label">CPF do Cliente</label>
            <input value={cpfCliente} onChange={(e) => setCpfCliente(e.target.value)} className="input" placeholder="000.000.000-00" />
          </div>
          <div>
            <label className="label">Contrato</label>
            <input value={contrato} onChange={(e) => setContrato(e.target.value)} className="input" placeholder="Número do contrato" />
          </div>
          <div>
            <label className="label">Data Início</label>
            <input type="date" value={dataInicio} onChange={(e) => setDataInicio(e.target.value)} className="input" />
          </div>
          <div>
            <label className="label">Data Fim</label>
            <input type="date" value={dataFim} onChange={(e) => setDataFim(e.target.value)} className="input" />
          </div>
        </div>

        <div>
          <label className="label">Formato</label>
          <div className="flex gap-3">
            <button
              type="button"
              onClick={() => setFormato('excel')}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-lg border-2 text-sm font-medium transition-all ${formato === 'excel' ? 'border-emerald-500 bg-emerald-50 text-emerald-700' : 'border-gray-200 hover:border-gray-300'}`}
            >
              <FileSpreadsheet className="w-4 h-4" />
              Excel (.xlsx)
            </button>
            <button
              type="button"
              onClick={() => setFormato('pdf')}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-lg border-2 text-sm font-medium transition-all ${formato === 'pdf' ? 'border-red-500 bg-red-50 text-red-700' : 'border-gray-200 hover:border-gray-300'}`}
            >
              <FileText className="w-4 h-4" />
              PDF (.pdf)
            </button>
          </div>
        </div>

        <div className="flex justify-end border-t pt-4">
          <button onClick={handleDownload} disabled={loading} className="btn-primary px-8">
            <Download className="w-4 h-4" />
            {loading ? 'Gerando...' : 'Exportar Relatório'}
          </button>
        </div>
      </div>
    </div>
  )
}
