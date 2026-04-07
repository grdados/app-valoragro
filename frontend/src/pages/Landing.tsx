import { FormEvent, useEffect, useMemo, useRef, useState } from 'react'
import {
  BarChart3,
  Bike,
  Building2,
  Car,
  Handshake,
  Home,
  KeyRound,
  Mail,
  MapPin,
  Menu,
  MessageCircle,
  Phone,
  ShieldCheck,
  Truck,
  UserRound,
  Wrench,
  X,
} from 'lucide-react'
import toast from 'react-hot-toast'
import { Link } from 'react-router-dom'
import { publicApi } from '../services/api'

interface PublicVendedor {
  id: number
  nome: string
  email: string
  telefone: string
  foto: string
  cidade: string
  uf: string
}

type Segmento = 'pf' | 'pj'

interface LeadForm {
  nome: string
  telefone: string
  email: string
  tipoPessoa: Segmento
  interesse: string
  vendedorId: string
  mensagem: string
}

const MENU_ITEMS = [
  { id: 'inicio', label: 'Inicio' },
  { id: 'produtos', label: 'Produtos' },
  { id: 'especialista', label: 'Falar com Especialista' },
  { id: 'sobre', label: 'Sobre' },
  { id: 'localizacao', label: 'Localizacao' },
  { id: 'contato', label: 'Contato' },
  { id: 'desenvolvedor', label: 'Desenvolvedor' },
]

const PLANOS = [
  { nome: 'Mensal', valor: 'R$ 400,00', detalhe: 'Suporte recorrente para operacao continua.' },
  { nome: 'Semestral', valor: 'R$ 2.160,00', detalhe: 'Pacote para previsibilidade de 6 meses.' },
  { nome: 'Anual', valor: 'R$ 3.990,00', detalhe: 'Melhor custo para evolucao de longo prazo.' },
]

const PRODUTOS = [
  { nome: 'Imovel', descricao: 'Residencial, comercial e investimento.', icon: Home },
  { nome: 'Carro', descricao: 'Novos e seminovos com planejamento.', icon: Car },
  { nome: 'Moto', descricao: 'Mobilidade com parcelas planejadas.', icon: Bike },
  { nome: 'Caminhao', descricao: 'Renovacao de frota para empresas.', icon: Truck },
  { nome: 'Empresarial', descricao: 'Solucoes para capital e expansao.', icon: Building2 },
  { nome: 'Servicos', descricao: 'Projetos e despesas de alto valor.', icon: Handshake },
]

function normalizarTelefone(valor: string) {
  return valor.replace(/\D/g, '')
}

function abrirWhatsapp(telefone: string, mensagem: string) {
  const numero = normalizarTelefone(telefone)
  if (!numero) return false
  const url = `https://wa.me/55${numero}?text=${encodeURIComponent(mensagem)}`
  window.open(url, '_blank', 'noopener,noreferrer')
  return true
}

export default function LandingPage() {
  const [menuMobile, setMenuMobile] = useState(false)
  const [headerSolid, setHeaderSolid] = useState(false)
  const [vendedores, setVendedores] = useState<PublicVendedor[]>([])
  const [carregandoVendedores, setCarregandoVendedores] = useState(true)
  const contatoRef = useRef<HTMLElement | null>(null)
  const [lead, setLead] = useState<LeadForm>({
    nome: '',
    telefone: '',
    email: '',
    tipoPessoa: 'pf',
    interesse: 'Consorcio de imovel',
    vendedorId: '',
    mensagem: '',
  })

  useEffect(() => {
    const onScroll = () => setHeaderSolid(window.scrollY > 12)
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  useEffect(() => {
    publicApi
      .listVendedores()
      .then((res) => {
        const lista = res.data || []
        setVendedores(lista)
        setLead((prev) => ({
          ...prev,
          vendedorId: prev.vendedorId || (lista[0] ? String(lista[0].id) : ''),
        }))
      })
      .catch(() => {
        toast.error('Nao foi possivel carregar os especialistas no momento.')
      })
      .finally(() => setCarregandoVendedores(false))
  }, [])

  const vendedorSelecionado = useMemo(
    () => vendedores.find((v) => String(v.id) === lead.vendedorId) || null,
    [vendedores, lead.vendedorId]
  )

  const rolarPara = (id: string) => {
    const section = document.getElementById(id)
    if (!section) return
    section.scrollIntoView({ behavior: 'smooth', block: 'start' })
    setMenuMobile(false)
  }

  const irParaSimulacao = (tipo: Segmento) => {
    setLead((prev) => ({ ...prev, tipoPessoa: tipo }))
    contatoRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' })
  }

  const enviarContato = (e: FormEvent) => {
    e.preventDefault()
    if (!lead.nome || !lead.telefone || !lead.interesse || !lead.vendedorId) {
      toast.error('Preencha nome, telefone, interesse e especialista.')
      return
    }

    const especialista = vendedorSelecionado
    if (!especialista) {
      toast.error('Especialista nao encontrado.')
      return
    }

    const texto = [
      'Ola, quero simular um consorcio na Valor Agro.',
      `Nome: ${lead.nome}`,
      `Tipo de cliente: ${lead.tipoPessoa === 'pf' ? 'Pessoa Fisica' : 'Pessoa Juridica'}`,
      `Interesse: ${lead.interesse}`,
      `Telefone: ${lead.telefone}`,
      lead.email ? `Email: ${lead.email}` : null,
      lead.mensagem ? `Mensagem: ${lead.mensagem}` : null,
      `Especialista selecionado: ${especialista.nome}`,
    ]
      .filter(Boolean)
      .join('\n')

    const ok = abrirWhatsapp(especialista.telefone, texto)
    if (!ok) {
      toast.error('Telefone do especialista indisponivel para WhatsApp.')
      return
    }

    toast.success('Abrindo conversa com o especialista selecionado.')
  }

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900">
      <header
        className={`fixed top-0 z-50 w-full transition-all duration-300 ${
          headerSolid ? 'bg-white/95 shadow-sm backdrop-blur border-b border-slate-200' : 'bg-transparent'
        }`}
      >
        <div className="mx-auto max-w-7xl px-4 sm:px-6">
          <div className="h-16 flex items-center justify-between">
            <button onClick={() => rolarPara('inicio')} className="flex items-center gap-2">
              <div className="w-9 h-9 rounded-lg bg-[#1B4F8C] text-white flex items-center justify-center">
                <BarChart3 className="w-5 h-5" />
              </div>
              <div className="text-left">
                <p className="font-bold leading-none">Valor Agro</p>
                <p className="text-xs text-slate-500">Consorcios BB</p>
              </div>
            </button>

            <nav className="hidden lg:flex items-center gap-6">
              {MENU_ITEMS.map((item) => (
                <button
                  key={item.id}
                  onClick={() => rolarPara(item.id)}
                  className="text-sm font-medium text-slate-700 hover:text-[#1B4F8C] transition-colors"
                >
                  {item.label}
                </button>
              ))}
            </nav>

            <div className="flex items-center gap-2">
              <Link to="/login" className="btn-primary hidden sm:inline-flex">
                Entrar no Painel
              </Link>
              <button
                className="lg:hidden p-2 rounded-lg border border-slate-300 bg-white"
                onClick={() => setMenuMobile((v) => !v)}
                aria-label="Abrir menu"
              >
                {menuMobile ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
              </button>
            </div>
          </div>

          <div
            className={`lg:hidden overflow-hidden transition-all duration-300 ${
              menuMobile ? 'max-h-96 opacity-100 pb-4' : 'max-h-0 opacity-0'
            }`}
          >
            <div className="flex flex-col gap-2">
              {MENU_ITEMS.map((item) => (
                <button
                  key={item.id}
                  onClick={() => rolarPara(item.id)}
                  className="text-left px-3 py-2 rounded-lg hover:bg-slate-100"
                >
                  {item.label}
                </button>
              ))}
              <Link to="/login" className="btn-primary justify-center mt-1">
                Entrar no Painel
              </Link>
            </div>
          </div>
        </div>
      </header>

      <section
        id="inicio"
        className="pt-24 pb-14 bg-[radial-gradient(circle_at_20%_20%,#dbeafe,transparent_45%),radial-gradient(circle_at_80%_0%,#bfdbfe,transparent_35%),#f8fafc]"
      >
        <div className="mx-auto max-w-7xl px-4 sm:px-6">
          <div className="grid md:grid-cols-2 gap-6">
            <article className="card overflow-hidden border-0 shadow-xl bg-white">
              <img
                src="https://images.unsplash.com/photo-1560518883-ce09059eeffa?auto=format&fit=crop&w=1200&q=80"
                alt="Consorcio para pessoa fisica"
                className="h-56 w-full object-cover"
              />
              <div className="p-6">
                <span className="inline-flex items-center gap-2 rounded-full bg-blue-50 text-[#1B4F8C] px-3 py-1 text-xs font-semibold">
                  <UserRound className="w-4 h-4" /> Pessoa Fisica
                </span>
                <h1 className="mt-3 text-2xl font-extrabold leading-tight">
                  Planeje seu proximo consorcio com seguranca e suporte especializado.
                </h1>
                <p className="mt-2 text-slate-600">
                  Simule imovel, veiculo ou servico com acompanhamento de um especialista.
                </p>
                <button className="btn-primary mt-5" onClick={() => irParaSimulacao('pf')}>
                  Simular Agora
                </button>
              </div>
            </article>

            <article className="card overflow-hidden border-0 shadow-xl bg-white">
              <img
                src="https://images.unsplash.com/photo-1556761175-5973dc0f32e7?auto=format&fit=crop&w=1200&q=80"
                alt="Consorcio para pessoa juridica"
                className="h-56 w-full object-cover"
              />
              <div className="p-6">
                <span className="inline-flex items-center gap-2 rounded-full bg-emerald-50 text-emerald-700 px-3 py-1 text-xs font-semibold">
                  <Building2 className="w-4 h-4" /> Pessoa Juridica
                </span>
                <h2 className="mt-3 text-2xl font-extrabold leading-tight">
                  Solucoes para crescimento empresarial com previsibilidade financeira.
                </h2>
                <p className="mt-2 text-slate-600">
                  Estruture a renovacao de frota, bens e servicos com atendimento consultivo.
                </p>
                <button className="btn-success mt-5" onClick={() => irParaSimulacao('pj')}>
                  Simular Agora
                </button>
              </div>
            </article>
          </div>
        </div>
      </section>

      <section id="produtos" className="py-16 bg-white">
        <div className="mx-auto max-w-7xl px-4 sm:px-6">
          <div className="text-center max-w-2xl mx-auto">
            <h2 className="text-3xl font-extrabold">Produtos</h2>
            <p className="mt-2 text-slate-600">Escolha o tipo de consorcio alinhado ao seu objetivo.</p>
          </div>
          <div className="mt-8 grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {PRODUTOS.map((produto, idx) => {
              const Icon = produto.icon
              return (
                <article
                  key={produto.nome}
                  className="card p-5 transition-all duration-300 hover:-translate-y-1 hover:shadow-lg"
                  style={{ animationDelay: `${idx * 60}ms` }}
                >
                  <div className="w-11 h-11 rounded-lg bg-slate-100 text-[#1B4F8C] flex items-center justify-center">
                    <Icon className="w-5 h-5" />
                  </div>
                  <h3 className="mt-4 text-lg font-bold">{produto.nome}</h3>
                  <p className="mt-1 text-sm text-slate-600">{produto.descricao}</p>
                </article>
              )
            })}
          </div>
        </div>
      </section>

      <section id="especialista" className="py-16 bg-slate-100">
        <div className="mx-auto max-w-7xl px-4 sm:px-6">
          <div className="text-center max-w-2xl mx-auto">
            <h2 className="text-3xl font-extrabold">Falar com Especialista</h2>
            <p className="mt-2 text-slate-600">
              Time comercial com conhecimento de consorcios BB para apoiar PF e PJ.
            </p>
          </div>
          <div className="mt-8 grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {carregandoVendedores && (
              <div className="sm:col-span-2 lg:col-span-3 card p-8 text-center text-slate-500">
                Carregando especialistas...
              </div>
            )}
            {!carregandoVendedores && vendedores.length === 0 && (
              <div className="sm:col-span-2 lg:col-span-3 card p-8 text-center text-slate-500">
                Nenhum especialista disponivel no momento.
              </div>
            )}
            {vendedores.map((vendedor) => (
              <article key={vendedor.id} className="card overflow-hidden">
                <div className="h-44 bg-slate-200">
                  <img
                    src={vendedor.foto || 'https://images.unsplash.com/photo-1568602471122-7832951cc4c5?auto=format&fit=crop&w=900&q=80'}
                    alt={vendedor.nome}
                    className="w-full h-full object-cover"
                  />
                </div>
                <div className="p-5">
                  <h3 className="font-bold text-lg">{vendedor.nome}</h3>
                  <p className="text-sm text-slate-600">{vendedor.cidade || 'Cidade nao informada'}{vendedor.uf ? ` - ${vendedor.uf}` : ''}</p>
                  <div className="mt-4 flex flex-wrap gap-2">
                    <button
                      className="btn-success"
                      onClick={() =>
                        abrirWhatsapp(
                          vendedor.telefone,
                          `Ola ${vendedor.nome}, quero simular um consorcio pela landing da Valor Agro.`
                        )
                      }
                    >
                      <MessageCircle className="w-4 h-4" /> WhatsApp
                    </button>
                    <a href={`mailto:${vendedor.email}`} className="btn-secondary">
                      <Mail className="w-4 h-4" /> Email
                    </a>
                  </div>
                </div>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section id="sobre" className="py-16 bg-white">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 grid lg:grid-cols-2 gap-8 items-center">
          <div>
            <h2 className="text-3xl font-extrabold">Sobre a Valor Agro</h2>
            <p className="mt-3 text-slate-600">
              A Valor Agro integra tecnologia e atendimento humano para acelerar vendas de consorcios BB.
              Nosso foco e organizar operacao comercial, comissoes e acompanhamento de carteira em um unico painel.
            </p>
            <div className="mt-5 flex flex-wrap gap-2">
              <span className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-slate-100 text-sm">
                <ShieldCheck className="w-4 h-4 text-[#1B4F8C]" /> Processo estruturado
              </span>
              <span className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-slate-100 text-sm">
                <Handshake className="w-4 h-4 text-[#1B4F8C]" /> Atendimento consultivo
              </span>
              <span className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-slate-100 text-sm">
                <BarChart3 className="w-4 h-4 text-[#1B4F8C]" /> Gestao orientada a dados
              </span>
            </div>
          </div>
          <div className="card p-6 bg-[linear-gradient(135deg,#1B4F8C,#1d3461)] text-white border-0">
            <h3 className="text-xl font-bold">Compromisso</h3>
            <p className="mt-2 text-blue-100">
              Entregar suporte rapido, simulacoes assertivas e visao completa para sua equipe comercial.
            </p>
            <div className="mt-4 grid sm:grid-cols-3 gap-3 text-center">
              <div className="rounded-lg bg-white/10 p-3">
                <p className="text-2xl font-extrabold">PF</p>
                <p className="text-xs text-blue-100">Atendimento dedicado</p>
              </div>
              <div className="rounded-lg bg-white/10 p-3">
                <p className="text-2xl font-extrabold">PJ</p>
                <p className="text-xs text-blue-100">Solucoes empresariais</p>
              </div>
              <div className="rounded-lg bg-white/10 p-3">
                <p className="text-2xl font-extrabold">BB</p>
                <p className="text-xs text-blue-100">Consorcios e servicos</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section id="localizacao" className="py-16 bg-slate-100">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 grid lg:grid-cols-2 gap-6">
          <div className="card p-6">
            <h2 className="text-3xl font-extrabold">Localizacao</h2>
            <p className="mt-3 text-slate-600">
              Atendimento digital para todo Brasil com base de operacao em Mato Grosso.
            </p>
            <div className="mt-4 space-y-2 text-sm text-slate-700">
              <p className="flex items-center gap-2"><MapPin className="w-4 h-4 text-[#1B4F8C]" /> Cuiaba - MT</p>
              <p className="flex items-center gap-2"><Phone className="w-4 h-4 text-[#1B4F8C]" /> +55 (65) 0000-0000</p>
              <p className="flex items-center gap-2"><Mail className="w-4 h-4 text-[#1B4F8C]" /> contato@valoragro.com.br</p>
            </div>
          </div>
          <div className="card overflow-hidden min-h-[280px]">
            <iframe
              title="Mapa Valor Agro"
              src="https://maps.google.com/maps?q=Cuiaba%20MT&t=&z=12&ie=UTF8&iwloc=&output=embed"
              className="w-full h-full min-h-[280px]"
              loading="lazy"
            />
          </div>
        </div>
      </section>

      <section id="contato" ref={contatoRef} className="py-16 bg-white">
        <div className="mx-auto max-w-7xl px-4 sm:px-6">
          <div className="max-w-2xl">
            <h2 className="text-3xl font-extrabold">Contato e Simulacao</h2>
            <p className="mt-2 text-slate-600">
              Preencha os dados e fale direto com um vendedor cadastrado no sistema.
            </p>
          </div>

          <form onSubmit={enviarContato} className="card p-6 mt-6 grid md:grid-cols-2 gap-4">
            <div>
              <label className="label">Nome *</label>
              <input
                className="input"
                value={lead.nome}
                onChange={(e) => setLead((prev) => ({ ...prev, nome: e.target.value }))}
              />
            </div>
            <div>
              <label className="label">Telefone *</label>
              <input
                className="input"
                value={lead.telefone}
                onChange={(e) => setLead((prev) => ({ ...prev, telefone: e.target.value }))}
                placeholder="(65) 99999-9999"
              />
            </div>
            <div>
              <label className="label">Email</label>
              <input
                type="email"
                className="input"
                value={lead.email}
                onChange={(e) => setLead((prev) => ({ ...prev, email: e.target.value }))}
              />
            </div>
            <div>
              <label className="label">Tipo de cliente *</label>
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => setLead((prev) => ({ ...prev, tipoPessoa: 'pf' }))}
                  className={`btn ${lead.tipoPessoa === 'pf' ? 'bg-[#1B4F8C] text-white' : 'bg-white border border-slate-300'}`}
                >
                  Pessoa Fisica
                </button>
                <button
                  type="button"
                  onClick={() => setLead((prev) => ({ ...prev, tipoPessoa: 'pj' }))}
                  className={`btn ${lead.tipoPessoa === 'pj' ? 'bg-[#1B4F8C] text-white' : 'bg-white border border-slate-300'}`}
                >
                  Pessoa Juridica
                </button>
              </div>
            </div>
            <div>
              <label className="label">Interesse *</label>
              <select
                className="input"
                value={lead.interesse}
                onChange={(e) => setLead((prev) => ({ ...prev, interesse: e.target.value }))}
              >
                <option>Consorcio de imovel</option>
                <option>Consorcio de carro</option>
                <option>Consorcio de moto</option>
                <option>Consorcio empresarial</option>
                <option>Outros servicos</option>
              </select>
            </div>
            <div>
              <label className="label">Especialista *</label>
              <select
                className="input"
                value={lead.vendedorId}
                onChange={(e) => setLead((prev) => ({ ...prev, vendedorId: e.target.value }))}
                disabled={carregandoVendedores || vendedores.length === 0}
              >
                {vendedores.length === 0 && <option value="">Nenhum especialista disponivel</option>}
                {vendedores.map((vendedor) => (
                  <option key={vendedor.id} value={vendedor.id}>
                    {vendedor.nome} {vendedor.cidade ? `- ${vendedor.cidade}` : ''}
                  </option>
                ))}
              </select>
            </div>
            <div className="md:col-span-2">
              <label className="label">Mensagem</label>
              <textarea
                className="input min-h-[110px]"
                value={lead.mensagem}
                onChange={(e) => setLead((prev) => ({ ...prev, mensagem: e.target.value }))}
                placeholder="Conte o objetivo da simulacao e prazo desejado."
              />
            </div>
            <div className="md:col-span-2 flex flex-wrap gap-3">
              <button className="btn-primary" type="submit">
                <MessageCircle className="w-4 h-4" /> Simular Agora
              </button>
              <button type="button" className="btn-secondary" onClick={() => rolarPara('especialista')}>
                Ver especialistas
              </button>
            </div>
          </form>
        </div>
      </section>

      <section id="desenvolvedor" className="py-16 bg-slate-900 text-white">
        <div className="mx-auto max-w-7xl px-4 sm:px-6">
          <div className="max-w-3xl">
            <p className="inline-flex items-center gap-2 text-xs uppercase tracking-widest text-blue-200">
              <Wrench className="w-4 h-4" /> Sessao do Desenvolvedor
            </p>
            <h2 className="mt-3 text-3xl font-extrabold">Licenca de suporte tecnico e evolucao</h2>
            <p className="mt-3 text-slate-300">
              Escopo MVP: manutencao corretiva, suporte operacional e pequenas melhorias evolutivas.
            </p>
          </div>
          <div className="mt-6 grid md:grid-cols-3 gap-4">
            {PLANOS.map((plano) => (
              <article key={plano.nome} className="rounded-xl border border-white/15 bg-white/5 p-5">
                <p className="text-sm text-blue-200">{plano.nome}</p>
                <p className="mt-1 text-2xl font-bold">{plano.valor}</p>
                <p className="mt-2 text-sm text-slate-300">{plano.detalhe}</p>
              </article>
            ))}
          </div>
          <div className="mt-6 text-sm text-slate-300 flex items-center gap-2">
            <KeyRound className="w-4 h-4 text-blue-300" />
            Integracao de cobranca Asaas (PIX/Boleto) e liberacao automatica de licenca na proxima fase.
          </div>
        </div>
      </section>

      <footer id="rodape" className="bg-[#0b1220] text-slate-300">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 py-10 grid md:grid-cols-3 gap-6">
          <div>
            <p className="font-bold text-white">Valor Agro</p>
            <p className="text-sm mt-2">
              Plataforma para gestao de vendas e comissoes de consorcios BB, com atendimento para PF e PJ.
            </p>
          </div>
          <div>
            <p className="font-semibold text-white">Atalhos</p>
            <div className="mt-2 flex flex-col gap-1 text-sm">
              {MENU_ITEMS.map((item) => (
                <button key={item.id} onClick={() => rolarPara(item.id)} className="text-left hover:text-white">
                  {item.label}
                </button>
              ))}
            </div>
          </div>
          <div id="contato-final">
            <p className="font-semibold text-white">Contato</p>
            <p className="mt-2 text-sm flex items-center gap-2"><Phone className="w-4 h-4" /> +55 (65) 0000-0000</p>
            <p className="mt-1 text-sm flex items-center gap-2"><Mail className="w-4 h-4" /> contato@valoragro.com.br</p>
            <p className="mt-1 text-sm flex items-center gap-2"><MapPin className="w-4 h-4" /> Cuiaba - MT</p>
          </div>
        </div>
        <div className="border-t border-white/10 py-4 text-center text-xs text-slate-400">
          © {new Date().getFullYear()} Valor Agro. Todos os direitos reservados.
        </div>
      </footer>
    </div>
  )
}
