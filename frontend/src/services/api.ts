import axios from 'axios'

type ApiPayload = unknown

export const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || '/api',
  headers: { 'Content-Type': 'application/json' },
})

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('access_token')
  if (token) {
    config.headers.Authorization = `Bearer ${token}`
  }
  return config
})

api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const original = error.config
    if (error.response?.status === 401 && !original._retry) {
      original._retry = true
      const refresh = localStorage.getItem('refresh_token')
      if (refresh) {
        try {
          const { data } = await axios.post('/api/auth/refresh/', { refresh })
          localStorage.setItem('access_token', data.access)
          api.defaults.headers.common.Authorization = `Bearer ${data.access}`
          return api(original)
        } catch {
          localStorage.clear()
          window.location.href = '/login'
        }
      }
    }
    return Promise.reject(error)
  }
)

export const authApi = {
  login: (username: string, password: string) =>
    api.post('/auth/login/', { username, password }),
}

export const supervisoresApi = {
  list: (params?: Record<string, unknown>) => api.get('/supervisores/', { params }),
  create: (data: ApiPayload) => api.post('/supervisores/', data),
  update: (id: number, data: ApiPayload) => api.put(`/supervisores/${id}/`, data),
  remove: (id: number) => api.delete(`/supervisores/${id}/`),
}

export const usuariosApi = {
  list: () => api.get('/usuarios/'),
  create: (data: ApiPayload) => api.post('/usuarios/', data),
  update: (id: number, data: ApiPayload) => api.put(`/usuarios/${id}/`, data),
  remove: (id: number) => api.delete(`/usuarios/${id}/`),
}

export const clientesApi = {
  list: (params?: Record<string, unknown>) => api.get('/clientes/', { params }),
  get: (id: number) => api.get(`/clientes/${id}/`),
  create: (data: ApiPayload) => api.post('/clientes/', data),
  update: (id: number, data: ApiPayload) => api.put(`/clientes/${id}/`, data),
  patch: (id: number, data: ApiPayload) => api.patch(`/clientes/${id}/`, data),
  remove: (id: number) => api.delete(`/clientes/${id}/`),
}

export const coordenadoresApi = {
  list: (params?: Record<string, unknown>) => api.get('/coordenadores/', { params }),
  create: (data: ApiPayload) => api.post('/coordenadores/', data),
  update: (id: number, data: ApiPayload) => api.put(`/coordenadores/${id}/`, data),
  remove: (id: number) => api.delete(`/coordenadores/${id}/`),
}

export const vendedoresApi = {
  list: (params?: Record<string, unknown>) => api.get('/vendedores/', { params }),
  create: (data: ApiPayload) => api.post('/vendedores/', data),
  update: (id: number, data: ApiPayload) => api.put(`/vendedores/${id}/`, data),
  remove: (id: number) => api.delete(`/vendedores/${id}/`),
  uploadFoto: (id: number, foto: File) => {
    const token = localStorage.getItem('access_token')
    const formData = new FormData()
    formData.append('foto', foto)

    const envApiRaw = String(import.meta.env.VITE_API_URL || '').trim()
    const envApi = envApiRaw.replace(/\/+$/, '')
    const roots = new Set<string>()
    if (envApi) {
      roots.add(envApi)
      if (envApi.endsWith('/api')) roots.add(envApi.slice(0, -4) + '/api')
      else roots.add(`${envApi}/api`)
    }
    roots.add('/api')

    const urls: string[] = []
    for (const root of roots) {
      urls.push(`${root}/vendedores/${id}/upload-foto/`)
      urls.push(`${root}/vendedores/${id}/upload_foto/`)
    }

    const headers: Record<string, string> = { 'Content-Type': 'multipart/form-data' }
    if (token) headers.Authorization = `Bearer ${token}`

    const tryUpload = async (index: number): Promise<unknown> => {
      const url = urls[index]
      try {
        return await axios.post(url, formData, { headers })
      } catch (err: unknown) {
        const status = (err as { response?: { status?: number } })?.response?.status
        if (status === 404 && index < urls.length - 1) return tryUpload(index + 1)
        throw err
      }
    }

    return tryUpload(0)
  },
}

export const publicApi = {
  listVendedores: () => api.get('/public/vendedores/'),
  getEmpresa: async () => {
    // Tenta primeiro via cliente padrao (baseURL + token/interceptors)
    try {
      return await api.get('/public/empresa/')
    } catch {}
    try {
      return await api.get('/empresa/')
    } catch {}

    const envApiRaw = String(import.meta.env.VITE_API_URL || '').trim()
    const envApi = envApiRaw.replace(/\/+$/, '')
    const roots = new Set<string>()
    if (envApi) {
      roots.add(envApi)
      if (envApi.endsWith('/api')) roots.add(envApi.slice(0, -4) + '/api')
      else roots.add(`${envApi}/api`)
    }
    roots.add('/api')

    const urls: string[] = []
    for (const root of roots) {
      urls.push(`${root}/public/empresa/`)
      urls.push(`${root}/empresa/`)
    }

    let lastError: unknown = null
    const token = localStorage.getItem('access_token')
    for (const url of urls) {
      try {
        return await axios.get(url, {
          headers: token ? { Authorization: `Bearer ${token}` } : undefined,
        })
      } catch (err: unknown) {
        lastError = err
      }
    }
    throw lastError
  },
}

export const tiposBemApi = {
  list: () => api.get('/tipos-bem/'),
  create: (data: ApiPayload) => api.post('/tipos-bem/', data),
  update: (id: number, data: ApiPayload) => api.put(`/tipos-bem/${id}/`, data),
  remove: (id: number) => api.delete(`/tipos-bem/${id}/`),
}

export const cobansApi = {
  list: () => api.get('/cobans/'),
  create: (data: ApiPayload) => api.post('/cobans/', data),
  update: (id: number, data: ApiPayload) => api.put(`/cobans/${id}/`, data),
  remove: (id: number) => api.delete(`/cobans/${id}/`),
}

export const consorciosApi = {
  list: (params?: Record<string, unknown>) => api.get('/consorcios/', { params }),
  create: (data: ApiPayload) => api.post('/consorcios/', data),
  update: (id: number, data: ApiPayload) => api.put(`/consorcios/${id}/`, data),
  remove: (id: number) => api.delete(`/consorcios/${id}/`),
}

export const faixasApi = {
  list: () => api.get('/faixas-comissao/'),
  create: (data: ApiPayload) => api.post('/faixas-comissao/', data),
  update: (id: number, data: ApiPayload) => api.put(`/faixas-comissao/${id}/`, data),
  remove: (id: number) => api.delete(`/faixas-comissao/${id}/`),
}

export const faixasVendedorApi = {
  list: () => api.get('/faixas-comissao-vendedor/'),
  create: (data: ApiPayload) => api.post('/faixas-comissao-vendedor/', data),
  update: (id: number, data: ApiPayload) => api.put(`/faixas-comissao-vendedor/${id}/`, data),
  remove: (id: number) => api.delete(`/faixas-comissao-vendedor/${id}/`),
}

export const faixasCoordenadorApi = {
  list: () => api.get('/faixas-comissao-coordenador/'),
  create: (data: ApiPayload) => api.post('/faixas-comissao-coordenador/', data),
  update: (id: number, data: ApiPayload) => api.put(`/faixas-comissao-coordenador/${id}/`, data),
  remove: (id: number) => api.delete(`/faixas-comissao-coordenador/${id}/`),
}

export const assembleiasApi = {
  list: () => api.get('/assembleias/'),
  create: (data: ApiPayload) => api.post('/assembleias/', data),
  update: (id: number, data: ApiPayload) => api.put(`/assembleias/${id}/`, data),
  remove: (id: number) => api.delete(`/assembleias/${id}/`),
}

export const vendasApi = {
  list: (params?: Record<string, unknown>) => api.get('/vendas/', { params }),
  get: (id: number) => api.get(`/vendas/${id}/`),
  create: (data: ApiPayload) => api.post('/vendas/', data),
  update: (id: number, data: ApiPayload) => api.put(`/vendas/${id}/`, data),
  remove: (id: number) => api.delete(`/vendas/${id}/`),
  preview: (data: Record<string, unknown>) => api.post('/vendas/preview/', data),
  alterarStatus: (id: number, status: string) => api.patch(`/vendas/${id}/status/`, { status }),
}

export const comissoesApi = {
  list: (params?: Record<string, unknown>) => api.get('/comissoes/', { params }),
  gerar: (venda_id: number) => api.post('/comissoes/gerar/', { venda_id }),
  alterarStatus: (id: number, status: string, observacao?: string, status_contrato_banco?: string) =>
    api.patch(`/comissoes/${id}/status/`, { status, observacao, status_contrato_banco }),
  recibo: (id: number) => api.get(`/comissoes/${id}/recibo/`, { responseType: 'blob' }),
}

export const dashboardsApi = {
  admin: (params?: Record<string, unknown>) => api.get('/dashboards/admin/', { params }),
  coordenador: (params?: Record<string, unknown>) => api.get('/dashboards/coordenador/', { params }),
  vendedor: (params?: Record<string, unknown>) => api.get('/dashboards/vendedor/', { params }),
}

export const relatoriosApi = {
  download: (params: Record<string, unknown>) => api.get('/relatorios/comissoes/', {
    params,
    responseType: 'blob',
  }),
}

export const empresaApi = {
  get: () => api.get('/empresa/'),
  update: (data: ApiPayload) => api.patch('/empresa/', data),
  save: (data: ApiPayload) => api.put('/empresa/', data),
}

export const licencasApi = {
  list: () => api.get('/dev/licencas/'),
  create: (data: ApiPayload) => api.post('/dev/licencas/', data),
  update: (id: number, data: ApiPayload) => api.put(`/dev/licencas/${id}/`, data),
  remove: (id: number) => api.delete(`/dev/licencas/${id}/`),
  listPagamentos: (params?: Record<string, unknown>) => api.get('/dev/licencas-pagamentos/', { params }),
  createPagamento: (data: ApiPayload) => api.post('/dev/licencas-pagamentos/', data),
  updatePagamento: (id: number, data: ApiPayload) => api.patch(`/dev/licencas-pagamentos/${id}/`, data),
  gerarFaturas: (id: number, meses: number) => api.post(`/dev/licencas/${id}/gerar-faturas/`, { meses }),
}

export const backupsApi = {
  list: (params?: Record<string, unknown>) => api.get('/backups/', { params }),
  getConfiguracao: () => api.get('/backups/configuracao/'),
  salvarConfiguracao: (data: ApiPayload) => api.put('/backups/configuracao/', data),
  gerarAgora: () => api.post('/backups/gerar/'),
  processarAgendados: () => api.post('/backups/processar-agendados/'),
  restaurarPorId: (backup_id: number) => api.post('/backups/restaurar/', { backup_id }),
  restaurarUpload: (arquivo: File) => {
    const formData = new FormData()
    formData.append('arquivo', arquivo)
    return api.post('/backups/restaurar/', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    })
  },
  download: (id: number) => api.get(`/backups/${id}/download/`, { responseType: 'blob' }),
}
