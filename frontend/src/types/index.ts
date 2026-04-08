export interface User {
  user_id: number
  username: string
  email: string
  nome: string
  perfil: 'admin' | 'dev' | 'supervisor' | 'coordenador' | 'vendedor'
  access: string
  refresh: string
}

export interface Cliente {
  id: number
  nome: string
  identidade: string
  cpf: string
  orgao_emissor: string
  data_nascimento: string | null
  nacionalidade: string
  uf: string
  naturalidade: string
  sexo: string
  estado_civil: string
  celular: string
  escolaridade: string
  profissao: string
  endereco: string
  numero: string
  empresa: string
  data_admissao: string | null
  renda: number | null
  email: string
  conta_bancaria: string
  agencia: string
  ativo: boolean
  criado_em: string
}

export interface Supervisor {
  id: number
  nome: string
  cpf: string
  email: string
  telefone: string
  ativo: boolean
  criado_em: string
  total_coordenadores: number
}

export interface Coordenador {
  id: number
  supervisor: number | null
  supervisor_nome: string
  nome: string
  cpf: string
  email: string
  telefone: string
  ativo: boolean
  criado_em: string
  total_vendedores: number
}

export interface Vendedor {
  id: number
  coordenador: number
  coordenador_nome: string
  nome: string
  cpf: string
  email: string
  telefone: string
  foto: string
  cidade: string
  uf: string
  ativo: boolean
  criado_em: string
}

export interface TipoBem {
  id: number
  nome: string
  nome_display: string
  descricao: string
  ativo: boolean
}

export interface COBAN {
  id: number
  sigla: string
  descricao: string
  ativo: boolean
}

export interface FaixaComissao {
  id: number
  consorcio: number
  valor_min: number
  valor_max: number
  percentuais: number[]
  ativo: boolean
}

export interface Assembleia {
  id: number
  consorcio: number
  consorcio_nome: string
  data_assembleia: string
  descricao: string
}

export interface Consorcio {
  id: number
  nome: string
  coban: number
  coban_sigla: string
  tipo_bem: number
  tipo_bem_nome: string
  vigencia_inicio: string
  vigencia_fim: string
  qtd_parcelas: number
  ativo: boolean
  criado_em: string
  faixas: FaixaComissao[]
  assembleias: Assembleia[]
}

export interface Venda {
  id: number
  data_venda: string
  numero_contrato: string
  cliente: number | null
  cliente_nome: string
  vendedor: number
  vendedor_nome: string
  coban: number
  coban_sigla: string
  tipo_bem: number
  tipo_bem_nome: string
  valor_bem: number
  consorcio: number
  consorcio_nome: string
  valor_total_comissao: number
  status: 'a_contemplar' | 'contemplado' | 'cancelada'
  status_display: string
  coordenador_nome: string
  criado_em: string
  atualizado_em: string
}

export interface LogAlteracao {
  id: number
  status_anterior: string
  status_novo: string
  observacao: string
  data_hora: string
  usuario_nome: string
}

export interface ParcelaComissao {
  id: number
  venda: number
  venda_contrato: string
  vendedor_nome: string
  coordenador_nome: string
  cliente_nome: string
  numero_parcela: number
  data_vencimento: string
  valor: number
  percentual: number
  status: 'pendente' | 'pago' | 'vencido'
  status_contrato_banco: 'ok' | 'inadimplente'
  data_pagamento: string | null
  criado_em: string
  atualizado_em: string
  logs: LogAlteracao[]
}

export interface VendaPreviewRequest {
  data_venda: string
  coban: string
  tipo_bem: string
  valor_bem: number
  consorcio_id?: number
}

export interface ConsorcioDisponivel {
  id: number
  nome: string
  qtd_parcelas: number
  faixa_id: number
  percentuais: number[]
}

export interface PlanoParcelaPreview {
  numero_parcela: number
  data_vencimento: string
  percentual: number
  valor: number
}

export interface VendaPreviewResponse {
  consorcios_disponiveis: ConsorcioDisponivel[]
  parcelas?: PlanoParcelaPreview[]
  valor_total_comissao?: number
  primeiro_vencimento?: string
}

export interface PaginatedResponse<T> {
  count: number
  next: string | null
  previous: string | null
  results: T[]
}

export interface DashboardAdmin {
  total_vendido: number
  total_comissoes: number
  total_contemplados: number
  qtd_contemplados: number
  comissoes_por_status: Record<string, { total: number; qtd: number }>
  ranking_vendedores: { vendedor__id: number; vendedor__nome: string; total_vendas: number; qtd_vendas: number }[]
  ranking_coordenadores: { vendedor__coordenador__id: number; vendedor__coordenador__nome: string; total_vendas: number; qtd_vendas: number }[]
  vendas_por_coban: { coban__sigla: string; total: number; qtd: number }[]
  vendas_por_tipo: { tipo_bem__nome: string; total: number; qtd: number }[]
  vendas_por_consorcio: { consorcio__nome: string; total: number; qtd: number }[]
  vendas_por_mes: { mes: string; total: number; qtd: number }[]
  vendas_mensal_por_produto: { mes: string; produto: string; total: number; qtd: number }[]
}

export interface DashboardCoordenador {
  total_vendido: number
  total_comissoes: number
  comissoes_por_status: Record<string, { total: number; qtd: number }>
  ranking_vendedores: { vendedor__id: number; vendedor__nome: string; total_vendas: number; qtd_vendas: number }[]
}

export interface DashboardVendedor {
  total_vendido: number
  total_comissoes: number
  comissoes_por_status: Record<string, { total: number; qtd: number }>
  vendas_por_mes: { mes: string; total: number; qtd: number }[]
}

export interface DadosEmpresa {
  id?: number
  nome: string
  cnpj: string
  endereco: string
  cidade: string
  uf: string
  cep: string
  telefone: string
  email: string
  site: string
  logo_url: string
  logo: string
  slogan: string
  responsavel: string
  texto_recibo: string
}

export interface Licenca {
  id: number
  nome_empresa: string
  cnpj: string
  email_contato: string
  telefone: string
  plano: string
  valor_mensalidade: number
  status: 'ativa' | 'suspensa' | 'cancelada'
  status_display: string
  data_inicio: string
  data_expiracao: string
  observacoes: string
  criado_em: string
  pagamentos: PagamentoLicenca[]
}

export interface PagamentoLicenca {
  id: number
  licenca: number
  competencia: string
  data_vencimento: string
  data_pagamento: string | null
  valor: number
  status: 'pago' | 'pendente' | 'vencido'
  observacao: string
}

export interface BackupSettings {
  ativo: boolean
  hora_execucao: string
  manter_dias: number
  ultima_execucao: string | null
  proxima_execucao: string | null
  atualizado_em: string | null
}

export interface BackupArquivo {
  id: number
  nome_arquivo: string
  arquivo: string
  download_url: string
  tamanho_bytes: number
  hash_sha256: string
  origem: 'manual' | 'agendado' | 'upload'
  origem_display: string
  observacao: string
  criado_por: number | null
  criado_por_nome: string
  restaurado_em: string | null
  restaurado_por: number | null
  restaurado_por_nome: string
  criado_em: string
}
