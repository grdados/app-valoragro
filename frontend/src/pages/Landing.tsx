import { FormEvent, MouseEvent, useEffect, useMemo, useRef, useState } from 'react'
import {
  BarChart3,
  Bike,
  Building2,
  Car,
  ChevronLeft,
  ChevronRight,
  Handshake,
  Home,
  Mail,
  MapPin,
  Menu,
  MessageCircle,
  Phone,
  ShieldCheck,
  Truck,
  UserRound,
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

interface HeroCard {
  titulo: string
  imagem: string
  top: string
  right: string
  width: string
  height: string
  depth: number
  rotate: number
}

const MENU_ITEMS = [
  { id: 'inicio', label: 'Inicio' },
  { id: 'produtos', label: 'Produtos' },
  { id: 'especialista', label: 'Falar com Especialista' },
  { id: 'sobre', label: 'Sobre' },
  { id: 'localizacao', label: 'Localizacao' },
  { id: 'contato', label: 'Contato' },
]

const PRODUTOS = [
  { nome: 'Imovel', descricao: 'Residencial, comercial e investimento.', icon: Home },
  { nome: 'Carro', descricao: 'Novos e seminovos com planejamento.', icon: Car },
  { nome: 'Moto', descricao: 'Mobilidade com parcelas planejadas.', icon: Bike },
  { nome: 'Caminhao', descricao: 'Renovacao de frota para empresas.', icon: Truck },
  { nome: 'Empresarial', descricao: 'Solucoes para capital e expansao.', icon: Building2 },
  { nome: 'Servicos', descricao: 'Projetos e despesas de alto valor.', icon: Handshake },
]

const HERO_SLIDES = [
  {
    id: 'pf',
    segmento: 'pf' as Segmento,
    titulo: 'Consorcio para Pessoa Fisica com planejamento e atendimento humano.',
    descricao: 'Organize sua conquista com simulacao orientada para imovel, carro, moto e servicos.',
    imagem: 'https://images.unsplash.com/photo-1560518883-ce09059eeffa?auto=format&fit=crop&w=1400&q=80',
    bg: 'from-black via-[#0b1a0f] to-[#143420]',
    badge: 'Pessoa Fisica',
    cards: [
      {
        titulo: 'Entrega de Carro',
        imagem: 'https://images.unsplash.com/photo-1609521263047-f8f205293f24?auto=format&fit=crop&w=900&q=80',
        top: '20%',
        right: '18%',
        width: '240px',
        height: '300px',
        depth: 0.5,
        rotate: -5,
      },
      {
        titulo: 'Entrega de Moto',
        imagem: 'https://images.unsplash.com/photo-1558981806-ec527fa84c39?auto=format&fit=crop&w=900&q=80',
        top: '50%',
        right: '30%',
        width: '155px',
        height: '205px',
        depth: 0.8,
        rotate: 7,
      },
      {
        titulo: 'Conquista da Casa',
        imagem: 'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?auto=format&fit=crop&w=900&q=80',
        top: '35%',
        right: '7%',
        width: '195px',
        height: '250px',
        depth: 1.1,
        rotate: 3,
      },
    ] as HeroCard[],
  },
  {
    id: 'pj',
    segmento: 'pj' as Segmento,
    titulo: 'Consorcio para Pessoa Juridica com foco em crescimento e previsibilidade.',
    descricao: 'Apoio comercial para renovacao de frota, ativos estrategicos e servicos empresariais.',
    imagem: 'https://images.unsplash.com/photo-1556761175-5973dc0f32e7?auto=format&fit=crop&w=1400&q=80',
    bg: 'from-black via-[#101910] to-[#1e4a2d]',
    badge: 'Pessoa Juridica',
    cards: [
      {
        titulo: 'Investimento',
        imagem: 'https://images.unsplash.com/photo-1559526324-4b87b5e36e44?auto=format&fit=crop&w=900&q=80',
        top: '20%',
        right: '19%',
        width: '238px',
        height: '300px',
        depth: 0.5,
        rotate: -6,
      },
      {
        titulo: 'Reforma',
        imagem: 'https://images.unsplash.com/photo-1504307651254-35680f356dfd?auto=format&fit=crop&w=900&q=80',
        top: '49%',
        right: '29%',
        width: '150px',
        height: '200px',
        depth: 0.85,
        rotate: 8,
      },
      {
        titulo: 'Frota Empresarial',
        imagem: 'https://images.unsplash.com/photo-1473448912268-2022ce9509d8?auto=format&fit=crop&w=900&q=80',
        top: '34%',
        right: '7%',
        width: '195px',
        height: '248px',
        depth: 1.1,
        rotate: 2,
      },
    ] as HeroCard[],
  },
]

const LOGO_URL = '/brand/logo-valor-agro.jpg'

function resolverFotoVendedor(foto?: string) {
  const fallback = 'https://images.unsplash.com/photo-1568602471122-7832951cc4c5?auto=format&fit=crop&w=900&q=80'
  if (!foto) return fallback

  const valor = foto.trim().replace(/\\/g, '/')
  if (!valor) return fallback
  if (/^https?:\/\//i.test(valor)) return valor

  if (valor.startsWith('/')) {
    const api = String(import.meta.env.VITE_API_URL || '').trim()
    const base = api ? api.replace(/\/api\/?$/i, '') : 'https://valoragro.onrender.com'
    return `${base}${valor}`
  }

  return valor
}

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
  const [secaoAtiva, setSecaoAtiva] = useState('inicio')
  const [vendedores, setVendedores] = useState<PublicVendedor[]>([])
  const [carregandoVendedores, setCarregandoVendedores] = useState(true)
  const [heroAtivo, setHeroAtivo] = useState(0)
  const [parallax, setParallax] = useState({ x: 0, y: 0 })
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
    const sections = MENU_ITEMS
      .map((item) => document.getElementById(item.id))
      .filter((node): node is HTMLElement => Boolean(node))

    if (!sections.length) return

    const observer = new IntersectionObserver(
      (entries) => {
        const visivel = entries
          .filter((entry) => entry.isIntersecting)
          .sort((a, b) => b.intersectionRatio - a.intersectionRatio)[0]
        if (visivel?.target?.id) setSecaoAtiva(visivel.target.id)
      },
      { rootMargin: '-35% 0px -50% 0px', threshold: [0.2, 0.4, 0.6] }
    )

    sections.forEach((section) => observer.observe(section))
    return () => observer.disconnect()
  }, [])

  useEffect(() => {
    const timer = window.setInterval(() => {
      setHeroAtivo((atual) => (atual + 1) % HERO_SLIDES.length)
    }, 6000)
    return () => window.clearInterval(timer)
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
    setSecaoAtiva(id)
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

  const proximoHero = () => {
    setHeroAtivo((atual) => (atual + 1) % HERO_SLIDES.length)
  }

  const anteriorHero = () => {
    setHeroAtivo((atual) => (atual - 1 + HERO_SLIDES.length) % HERO_SLIDES.length)
  }

  const onHeroMouseMove = (e: MouseEvent<HTMLElement>) => {
    const bounds = e.currentTarget.getBoundingClientRect()
    const x = (e.clientX - bounds.left) / bounds.width
    const y = (e.clientY - bounds.top) / bounds.height
    setParallax({ x: x * 2 - 1, y: y * 2 - 1 })
  }

  const onHeroMouseLeave = () => {
    setParallax({ x: 0, y: 0 })
  }

  return (
    <div className="min-h-screen bg-[#f4f8f2] text-slate-900">
      <header
        className={`fixed top-0 z-50 w-full transition-all duration-300 ${
          headerSolid ? 'bg-[#060a07]/95 shadow-sm backdrop-blur border-b border-white/10' : 'bg-transparent'
        }`}
      >
        <div className="mx-auto max-w-7xl px-4 sm:px-6">
          <div className="h-16 flex items-center justify-between">
            <button onClick={() => rolarPara('inicio')} className="flex items-center gap-2">
              <img
                src={LOGO_URL}
                alt="Valor Agro"
                className="h-10 w-auto rounded-md object-contain shadow-sm ring-1 ring-white/20"
              />
            </button>

            <nav className="hidden lg:flex items-center gap-2">
              {MENU_ITEMS.map((item) => (
                <button
                  key={item.id}
                  onClick={() => rolarPara(item.id)}
                  className={`relative px-3 py-2 rounded-md text-sm font-medium transition-all duration-300 ${
                    headerSolid
                      ? secaoAtiva === item.id
                        ? 'text-[#7BEA63] bg-[#132117]'
                        : 'text-slate-200 hover:text-[#7BEA63] hover:bg-white/10'
                      : secaoAtiva === item.id
                        ? 'text-white bg-[#7BEA63]/20'
                        : 'text-white/90 hover:text-white hover:bg-white/10'
                  } hover:-translate-y-0.5`}
                >
                  {item.label}
                  <span
                    className={`absolute left-3 right-3 -bottom-0.5 h-0.5 rounded-full transition-all duration-300 ${
                      secaoAtiva === item.id ? 'bg-current opacity-100' : 'opacity-0'
                    }`}
                  />
                </button>
              ))}
            </nav>

            <div className="flex items-center gap-2">
              <Link to="/login" className="btn hidden sm:inline-flex bg-[#66e24d] text-[#041109] hover:bg-[#7bea63] font-semibold">
                Entrar no Painel
              </Link>
              <button
                className="lg:hidden p-2 rounded-lg border border-white/20 bg-[#0f1a12] text-white"
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
                  className="text-left px-3 py-2 rounded-lg bg-white/5 text-white hover:bg-white/10"
                >
                  {item.label}
                </button>
              ))}
              <Link to="/login" className="btn justify-center mt-1 bg-[#66e24d] text-[#041109] hover:bg-[#7bea63] font-semibold">
                Entrar no Painel
              </Link>
            </div>
          </div>
        </div>
      </header>

      <section
        id="inicio"
        className="relative pt-24 pb-10 overflow-hidden min-h-[78vh] lg:min-h-[85vh]"
        onMouseMove={onHeroMouseMove}
        onMouseLeave={onHeroMouseLeave}
      >
        {HERO_SLIDES.map((slide, idx) => (
          <div
            key={slide.id}
            className={`absolute inset-0 transition-opacity duration-700 ${idx === heroAtivo ? 'opacity-100' : 'opacity-0'}`}
          >
            <img src={slide.imagem} alt={slide.badge} className="w-full h-full object-cover" />
            <div className={`absolute inset-0 bg-gradient-to-br ${slide.bg} mix-blend-multiply`} />
          </div>
        ))}
        <div className="absolute inset-0 bg-black/35" />

        <div className="absolute inset-0 hidden lg:block pointer-events-none">
          {HERO_SLIDES[heroAtivo].cards.map((card, idx) => {
            const tx = Math.round(parallax.x * 18 * card.depth)
            const ty = Math.round(parallax.y * 14 * card.depth)
            return (
              <article
                key={`${HERO_SLIDES[heroAtivo].id}-${card.titulo}`}
                className="absolute rounded-2xl overflow-hidden border border-white/25 shadow-2xl bg-black/20 backdrop-blur-sm"
                style={{
                  top: card.top,
                  right: card.right,
                  width: card.width,
                  height: card.height,
                  transform: `translate3d(${tx}px, ${ty}px, 0) rotate(${card.rotate}deg)`,
                  transition: 'transform 220ms ease-out, opacity 420ms ease',
                }}
              >
                <img src={card.imagem} alt={card.titulo} className="w-full h-full object-cover" />
                <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />
                <p className="absolute left-3 bottom-2 text-[11px] font-semibold tracking-wide text-white/95">
                  {card.titulo}
                </p>
              </article>
            )
          })}
        </div>

        <div className="relative mx-auto max-w-7xl px-4 sm:px-6 h-full min-h-[calc(78vh-5rem)] lg:min-h-[calc(85vh-5rem)] flex items-center">
          <div className="max-w-xl text-white py-10 text-left">
            <span className="inline-flex items-center gap-2 rounded-full bg-white/20 border border-white/40 px-3 py-1 text-xs font-semibold backdrop-blur-sm">
              <UserRound className="w-4 h-4" />
              {HERO_SLIDES[heroAtivo].badge}
            </span>
            <h1 className="mt-4 text-3xl lg:text-5xl font-extrabold leading-tight drop-shadow-sm">
              {HERO_SLIDES[heroAtivo].titulo}
            </h1>
            <p className="mt-4 text-base lg:text-lg text-slate-100 max-w-xl">
              {HERO_SLIDES[heroAtivo].descricao}
            </p>
            <button
              className="btn mt-6 bg-[#66e24d] text-[#041109] hover:bg-[#7bea63] font-semibold"
              onClick={() => irParaSimulacao(HERO_SLIDES[heroAtivo].segmento)}
            >
              Simular Agora
            </button>
          </div>
        </div>

        <div className="absolute inset-0 pointer-events-none">
          <div className="h-full px-4 sm:px-6 flex items-center justify-between">
            <button
              onClick={anteriorHero}
              className="pointer-events-auto p-2.5 rounded-full border border-white/50 text-white hover:bg-white/20 transition-colors"
              aria-label="Slide anterior"
            >
              <ChevronLeft className="w-5 h-5" />
            </button>
            <button
              onClick={proximoHero}
              className="pointer-events-auto p-2.5 rounded-full border border-white/50 text-white hover:bg-white/20 transition-colors"
              aria-label="Proximo slide"
            >
              <ChevronRight className="w-5 h-5" />
            </button>
          </div>
        </div>

        <div className="absolute bottom-8 left-0 right-0">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 flex items-center justify-start">
            <div className="flex items-center gap-2">
              {HERO_SLIDES.map((slide, idx) => (
                <button
                  key={slide.id}
                  onClick={() => setHeroAtivo(idx)}
                  className={`h-2.5 rounded-full transition-all ${
                    idx === heroAtivo ? 'w-10 bg-[#66e24d]' : 'w-2.5 bg-white/70'
                  }`}
                  aria-label={`Ir para slide ${idx + 1}`}
                />
              ))}
            </div>
          </div>
        </div>
      </section>


      <section id="produtos" className="py-16 bg-[#f8fbf7]">
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
                  <div className="w-11 h-11 rounded-lg bg-[#e9f9e3] text-[#1d7a34] flex items-center justify-center">
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

      <section id="especialista" className="py-16 bg-[#edf4eb]">
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
                    src={resolverFotoVendedor(vendedor.foto)}
                    alt={vendedor.nome}
                    className="w-full h-full object-cover"
                    onError={(e) => {
                      ;(e.currentTarget as HTMLImageElement).src =
                        `https://ui-avatars.com/api/?name=${encodeURIComponent(vendedor.nome)}&background=1f8c3b&color=fff&size=256`
                    }}
                  />
                </div>
                <div className="p-5">
                  <h3 className="font-bold text-lg">{vendedor.nome}</h3>
                  <p className="text-sm text-slate-600">{vendedor.cidade || 'Cidade nao informada'}{vendedor.uf ? ` - ${vendedor.uf}` : ''}</p>
                  <div className="mt-4 flex flex-wrap gap-2">
                    <button
                      className="btn bg-[#1f8c3b] text-white hover:bg-[#1a7531]"
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
                <ShieldCheck className="w-4 h-4 text-[#1f8c3b]" /> Processo estruturado
              </span>
              <span className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-slate-100 text-sm">
                <Handshake className="w-4 h-4 text-[#1f8c3b]" /> Atendimento consultivo
              </span>
              <span className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-slate-100 text-sm">
                <BarChart3 className="w-4 h-4 text-[#1f8c3b]" /> Gestao orientada a dados
              </span>
            </div>
          </div>
          <div className="card p-6 bg-[linear-gradient(135deg,#050806,#153121)] text-white border-0">
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

      <section id="localizacao" className="py-16 bg-[#edf4eb]">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 grid lg:grid-cols-2 gap-6">
          <div className="card p-6">
            <h2 className="text-3xl font-extrabold">Localizacao</h2>
            <p className="mt-3 text-slate-600">
              Atendimento digital para todo Brasil com base de operacao em Mato Grosso.
            </p>
            <div className="mt-4 space-y-2 text-sm text-slate-700">
              <p className="flex items-center gap-2"><MapPin className="w-4 h-4 text-[#1f8c3b]" /> Cuiaba - MT</p>
              <p className="flex items-center gap-2"><Phone className="w-4 h-4 text-[#1f8c3b]" /> +55 (65) 0000-0000</p>
              <p className="flex items-center gap-2"><Mail className="w-4 h-4 text-[#1f8c3b]" /> contato@valoragro.com.br</p>
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
                  className={`btn ${lead.tipoPessoa === 'pf' ? 'bg-[#1f8c3b] text-white' : 'bg-white border border-slate-300'}`}
                >
                  Pessoa Fisica
                </button>
                <button
                  type="button"
                  onClick={() => setLead((prev) => ({ ...prev, tipoPessoa: 'pj' }))}
                  className={`btn ${lead.tipoPessoa === 'pj' ? 'bg-[#1f8c3b] text-white' : 'bg-white border border-slate-300'}`}
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
              <button className="btn bg-[#1f8c3b] text-white hover:bg-[#1a7531]" type="submit">
                <MessageCircle className="w-4 h-4" /> Simular Agora
              </button>
              <button type="button" className="btn-secondary" onClick={() => rolarPara('especialista')}>
                Ver especialistas
              </button>
            </div>
          </form>
        </div>
      </section>

      <footer id="rodape" className="bg-[#050806] text-slate-300">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 py-10 grid md:grid-cols-3 gap-6">
          <div>
            <img src={LOGO_URL} alt="Valor Agro" className="h-12 w-auto rounded-md object-contain ring-1 ring-white/15" />
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
