import { clsx, type ClassValue } from 'clsx'
import { twMerge } from 'tailwind-merge'
import { format, parseISO } from 'date-fns'
import { ptBR } from 'date-fns/locale'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function formatCurrency(value: number): string {
  return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value)
}

export function formatCurrencyInput(value: string | number): string {
  const digits = String(value ?? '').replace(/\D/g, '')
  if (!digits) return ''
  const numeric = Number(digits) / 100
  return numeric.toLocaleString('pt-BR', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })
}

export function parseCurrencyInput(value: string): number {
  const normalized = String(value || '')
    .replace(/\./g, '')
    .replace(',', '.')
    .trim()
  const parsed = Number(normalized)
  return Number.isFinite(parsed) ? parsed : NaN
}

export function formatDate(dateStr: string): string {
  if (!dateStr) return '-'
  try {
    return format(parseISO(dateStr), 'dd/MM/yyyy', { locale: ptBR })
  } catch {
    return dateStr
  }
}

export function formatDateTime(dateStr: string): string {
  if (!dateStr) return '-'
  try {
    return format(parseISO(dateStr), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })
  } catch {
    return dateStr
  }
}

export function formatCPF(cpf: string): string {
  return cpf.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, '$1.$2.$3-$4')
}

export function getStatusBadgeClass(status: string): string {
  const map: Record<string, string> = {
    pendente: 'badge-pendente',
    pago: 'badge-pago',
    vencido: 'badge-vencido',
    ativa: 'badge-ativa',
    cancelada: 'badge-cancelada',
  }
  return map[status] || 'badge-pendente'
}

export function getStatusLabel(status: string): string {
  const map: Record<string, string> = {
    pendente: 'Pendente',
    pago: 'Pago',
    vencido: 'Vencido',
    ativa: 'Ativa',
    cancelada: 'Cancelada',
  }
  return map[status] || status
}

export function downloadBlob(blob: Blob, filename: string) {
  const url = window.URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  document.body.appendChild(a)
  a.click()
  window.URL.revokeObjectURL(url)
  document.body.removeChild(a)
}
