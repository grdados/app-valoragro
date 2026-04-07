import { Link } from 'react-router-dom'
import { BarChart3, CheckCircle2, ShieldCheck, Wrench } from 'lucide-react'

const planos = [
  {
    nome: 'Mensal',
    resumo: '4 horas/mês de suporte técnico',
    preco: 'R$ 480/mês',
  },
  {
    nome: 'Semestral',
    resumo: '24 horas de suporte (6 meses)',
    preco: 'R$ 2.760',
  },
  {
    nome: 'Anual',
    resumo: '48 horas de suporte (12 meses)',
    preco: 'R$ 5.280',
  },
]

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-[#12345A] via-[#1B4F8C] to-[#0f172a] text-white">
      <div className="mx-auto max-w-6xl px-6 py-10">
        <header className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-xl bg-white/95 flex items-center justify-center">
              <BarChart3 className="w-6 h-6 text-[#1B4F8C]" />
            </div>
            <div>
              <p className="font-bold leading-none">Valor Agro</p>
              <p className="text-xs text-blue-100">Gestão de Consórcios BB</p>
            </div>
          </div>
          <Link to="/login" className="btn-primary bg-white text-[#1B4F8C] hover:bg-blue-50">
            Entrar no Painel
          </Link>
        </header>

        <section className="mt-12 grid gap-8 lg:grid-cols-2 items-center">
          <div>
            <h1 className="text-4xl font-extrabold leading-tight">
              Gestão de vendas de consórcios BB para Pessoa Física e Jurídica
            </h1>
            <p className="mt-4 text-blue-100 text-lg">
              Plataforma simples para acompanhar vendas, comissões e cadastros, com suporte técnico especializado
              para manter o sistema estável e evoluindo.
            </p>
            <div className="mt-6 flex flex-wrap gap-3">
              <span className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/10 border border-white/20 text-sm">
                <CheckCircle2 className="w-4 h-4" /> Pessoa Física
              </span>
              <span className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/10 border border-white/20 text-sm">
                <CheckCircle2 className="w-4 h-4" /> Pessoa Jurídica
              </span>
              <span className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/10 border border-white/20 text-sm">
                <ShieldCheck className="w-4 h-4" /> Controle de Comissões
              </span>
            </div>
          </div>
          <div className="bg-white/10 border border-white/20 rounded-2xl p-6 backdrop-blur-sm">
            <p className="text-sm uppercase tracking-wide text-blue-100">Licença de Suporte do Desenvolvedor</p>
            <h2 className="mt-2 text-2xl font-bold">MVP de suporte técnico e correções</h2>
            <p className="mt-3 text-blue-100">
              Base de cobrança: R$ 120/h com mínimo de 4 horas por ciclo (R$ 480).
            </p>
            <ul className="mt-4 space-y-2 text-sm text-blue-50">
              <li className="flex items-center gap-2">
                <Wrench className="w-4 h-4" /> Correções de bugs e manutenção contínua
              </li>
              <li className="flex items-center gap-2">
                <Wrench className="w-4 h-4" /> Ajustes e pequenas melhorias evolutivas
              </li>
              <li className="flex items-center gap-2">
                <Wrench className="w-4 h-4" /> Atendimento recorrente com previsibilidade
              </li>
            </ul>
          </div>
        </section>

        <section className="mt-10 grid gap-4 md:grid-cols-3">
          {planos.map((plano) => (
            <div key={plano.nome} className="bg-white rounded-2xl p-5 text-gray-900 shadow-sm">
              <p className="text-sm font-semibold text-[#1B4F8C]">{plano.nome}</p>
              <p className="mt-2 text-xl font-bold">{plano.preco}</p>
              <p className="mt-1 text-sm text-gray-600">{plano.resumo}</p>
            </div>
          ))}
        </section>
      </div>
    </div>
  )
}
