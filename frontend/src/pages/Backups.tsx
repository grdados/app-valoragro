import { useEffect, useMemo, useState } from 'react'
import { Clock3, Download, HardDriveUpload, RefreshCw, Save, ShieldAlert } from 'lucide-react'
import toast from 'react-hot-toast'

import PageHeader from '../components/PageHeader'
import { useAuth } from '../hooks/useAuth'
import { backupsApi } from '../services/api'
import type { BackupArquivo, BackupSettings, PaginatedResponse } from '../types'

const defaultConfig: BackupSettings = {
  ativo: false,
  hora_execucao: '02:00',
  manter_dias: 15,
  ultima_execucao: null,
  proxima_execucao: null,
  atualizado_em: null,
}

function getApiErrorMessage(error: unknown, fallback: string) {
  const err = error as {
    response?: {
      data?: { detail?: string } | string
      status?: number
    }
    message?: string
  }
  if (typeof err?.response?.data === 'string') return err.response.data
  if (typeof err?.response?.data?.detail === 'string') return err.response.data.detail
  if (typeof err?.message === 'string' && err.message.trim()) return err.message
  return fallback
}

function formatBytes(bytes: number) {
  if (!bytes) return '0 B'
  const units = ['B', 'KB', 'MB', 'GB']
  let value = bytes
  let index = 0
  while (value >= 1024 && index < units.length - 1) {
    value /= 1024
    index += 1
  }
  return `${value.toFixed(index === 0 ? 0 : 1)} ${units[index]}`
}

function formatDateTime(value?: string | null) {
  if (!value) return '-'
  return new Date(value).toLocaleString('pt-BR')
}

export default function BackupsPage() {
  const { isSupervisorOrAbove } = useAuth()
  const [config, setConfig] = useState<BackupSettings>(defaultConfig)
  const [items, setItems] = useState<BackupArquivo[]>([])
  const [loading, setLoading] = useState(true)
  const [savingConfig, setSavingConfig] = useState(false)
  const [runningNow, setRunningNow] = useState(false)
  const [restoring, setRestoring] = useState(false)
  const [uploadFile, setUploadFile] = useState<File | null>(null)

  const hasUpload = useMemo(() => Boolean(uploadFile), [uploadFile])

  const fetchAll = async () => {
    setLoading(true)
    try {
      const [configRes, listRes] = await Promise.all([
        backupsApi.getConfiguracao(),
        backupsApi.list(),
      ])
      const listData = listRes.data as PaginatedResponse<BackupArquivo> | BackupArquivo[]
      setConfig(configRes.data || defaultConfig)
      setItems(Array.isArray(listData) ? listData : listData.results || [])
    } catch (error) {
      toast.error(getApiErrorMessage(error, 'Erro ao carregar configurações de backup.'))
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchAll()
  }, [])

  const handleSaveConfig = async () => {
    setSavingConfig(true)
    try {
      await backupsApi.salvarConfiguracao({
        ativo: config.ativo,
        hora_execucao: config.hora_execucao,
        manter_dias: Number(config.manter_dias) || 15,
      })
      toast.success('Configuração de backup atualizada.')
      await fetchAll()
    } catch (error) {
      toast.error(getApiErrorMessage(error, 'Erro ao salvar configuração de backup.'))
    } finally {
      setSavingConfig(false)
    }
  }

  const handleRunNow = async () => {
    setRunningNow(true)
    try {
      await backupsApi.gerarAgora()
      toast.success('Backup gerado com sucesso.')
      await fetchAll()
    } catch (error) {
      toast.error(getApiErrorMessage(error, 'Não foi possível gerar o backup agora.'))
    } finally {
      setRunningNow(false)
    }
  }

  const handleDownload = async (backup: BackupArquivo) => {
    try {
      const response = await backupsApi.download(backup.id)
      const blob = new Blob([response.data], { type: 'application/zip' })
      const url = window.URL.createObjectURL(blob)
      const anchor = document.createElement('a')
      anchor.href = url
      anchor.download = backup.nome_arquivo || `backup_${backup.id}.zip`
      document.body.appendChild(anchor)
      anchor.click()
      anchor.remove()
      window.URL.revokeObjectURL(url)
    } catch {
      toast.error('Erro ao baixar backup.')
    }
  }

  const handleRestoreById = async (backup: BackupArquivo) => {
    const ok = window.confirm(
      `Restaurar o backup "${backup.nome_arquivo}"?\n\nEsta ação substitui os dados atuais.`
    )
    if (!ok) return
    setRestoring(true)
    try {
      await backupsApi.restaurarPorId(backup.id)
      toast.success('Backup restaurado com sucesso.')
      await fetchAll()
    } catch (error) {
      toast.error(getApiErrorMessage(error, 'Erro ao restaurar backup selecionado.'))
    } finally {
      setRestoring(false)
    }
  }

  const handleRestoreUpload = async () => {
    if (!uploadFile) {
      toast.error('Selecione um arquivo .zip primeiro.')
      return
    }
    const ok = window.confirm(
      'Restaurar a partir do arquivo enviado?\n\nEsta ação substitui os dados atuais.'
    )
    if (!ok) return

    setRestoring(true)
    try {
      await backupsApi.restaurarUpload(uploadFile)
      toast.success('Backup restaurado com sucesso pelo upload.')
      setUploadFile(null)
      await fetchAll()
    } catch (error) {
      toast.error(getApiErrorMessage(error, 'Erro ao restaurar backup por upload.'))
    } finally {
      setRestoring(false)
    }
  }

  if (!isSupervisorOrAbove()) {
    return (
      <div className="card p-6">
        <h2 className="text-lg font-semibold text-gray-900">Acesso restrito</h2>
        <p className="text-sm text-gray-600 mt-2">
          Somente Supervisor ou Desenvolvedor pode gerenciar backups.
        </p>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Backups"
        subtitle="Gerar, baixar, restaurar e agendar backup diário"
        actions={
          <button className="btn-primary" onClick={handleRunNow} disabled={runningNow}>
            <RefreshCw className={`w-4 h-4 ${runningNow ? 'animate-spin' : ''}`} />
            {runningNow ? 'Gerando...' : 'Gerar Backup Agora'}
          </button>
        }
      />

      <div className="card p-5 space-y-4">
        <h3 className="text-base font-semibold text-gray-900 flex items-center gap-2">
          <Clock3 className="w-4 h-4 text-[#1B4F8C]" />
          Agendamento Diário
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <label className="flex items-center gap-2 text-sm text-gray-700">
            <input
              type="checkbox"
              className="w-4 h-4"
              checked={config.ativo}
              onChange={(e) => setConfig((prev) => ({ ...prev, ativo: e.target.checked }))}
            />
            Ativar agendamento
          </label>
          <div>
            <label className="label">Horário (24h)</label>
            <input
              type="time"
              className="input"
              value={(config.hora_execucao || '02:00').slice(0, 5)}
              onChange={(e) => setConfig((prev) => ({ ...prev, hora_execucao: e.target.value }))}
            />
          </div>
          <div>
            <label className="label">Retenção (dias)</label>
            <input
              type="number"
              min={1}
              max={365}
              className="input"
              value={config.manter_dias}
              onChange={(e) =>
                setConfig((prev) => ({ ...prev, manter_dias: Number(e.target.value || 15) }))
              }
            />
          </div>
          <div className="flex items-end">
            <button className="btn-primary w-full" onClick={handleSaveConfig} disabled={savingConfig}>
              <Save className="w-4 h-4" />
              {savingConfig ? 'Salvando...' : 'Salvar Configuração'}
            </button>
          </div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm text-gray-600">
          <p>Última execução: <strong>{formatDateTime(config.ultima_execucao)}</strong></p>
          <p>Próxima execução: <strong>{formatDateTime(config.proxima_execucao)}</strong></p>
        </div>
      </div>

      <div className="card p-5 space-y-4">
        <h3 className="text-base font-semibold text-gray-900 flex items-center gap-2">
          <HardDriveUpload className="w-4 h-4 text-[#1B4F8C]" />
          Restauração por Arquivo
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-[1fr_auto] gap-3">
          <input
            type="file"
            accept=".zip"
            className="input"
            onChange={(e) => setUploadFile(e.target.files?.[0] || null)}
          />
          <button className="btn-danger" onClick={handleRestoreUpload} disabled={restoring || !hasUpload}>
            {restoring ? 'Restaurando...' : 'Restaurar Upload'}
          </button>
        </div>
        <p className="text-xs text-amber-700 bg-amber-50 border border-amber-200 rounded-lg p-2 flex items-start gap-2">
          <ShieldAlert className="w-4 h-4 mt-0.5 flex-shrink-0" />
          Restaurar backup substitui os dados atuais do sistema e os arquivos de mídia (exceto a pasta de backups).
        </p>
      </div>

      <div className="card overflow-hidden">
        <div className="px-5 py-4 border-b border-gray-200">
          <h3 className="text-base font-semibold text-gray-900">Histórico de Backups</h3>
        </div>
        <div className="overflow-x-auto">
          <table className="min-w-full">
            <thead className="table-header">
              <tr>
                <th className="px-4 py-3 text-left">Arquivo</th>
                <th className="px-4 py-3 text-left">Origem</th>
                <th className="px-4 py-3 text-left">Tamanho</th>
                <th className="px-4 py-3 text-left">Criado em</th>
                <th className="px-4 py-3 text-left">Restaurado em</th>
                <th className="px-4 py-3 text-right">Ações</th>
              </tr>
            </thead>
            <tbody>
              {!loading && items.length === 0 && (
                <tr>
                  <td className="px-4 py-6 text-sm text-gray-500" colSpan={6}>
                    Nenhum backup encontrado.
                  </td>
                </tr>
              )}
              {items.map((item) => (
                <tr key={item.id} className="border-b border-gray-100 table-row-hover">
                  <td className="px-4 py-3 text-sm text-gray-800">{item.nome_arquivo}</td>
                  <td className="px-4 py-3 text-sm text-gray-700">{item.origem_display}</td>
                  <td className="px-4 py-3 text-sm text-gray-700">{formatBytes(item.tamanho_bytes)}</td>
                  <td className="px-4 py-3 text-sm text-gray-700">{formatDateTime(item.criado_em)}</td>
                  <td className="px-4 py-3 text-sm text-gray-700">{formatDateTime(item.restaurado_em)}</td>
                  <td className="px-4 py-3">
                    <div className="flex justify-end gap-2">
                      <button className="btn-secondary py-1.5 px-2.5 text-xs" onClick={() => handleDownload(item)}>
                        <Download className="w-3.5 h-3.5" />
                      </button>
                      <button
                        className="btn-danger py-1.5 px-2.5 text-xs"
                        onClick={() => handleRestoreById(item)}
                        disabled={restoring}
                      >
                        Restaurar
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
              {loading && (
                <tr>
                  <td className="px-4 py-6 text-sm text-gray-500" colSpan={6}>
                    Carregando backups...
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
