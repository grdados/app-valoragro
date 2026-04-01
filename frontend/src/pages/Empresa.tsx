import { useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { Building2 } from 'lucide-react'
import toast from 'react-hot-toast'
import { empresaApi } from '../services/api'
import PageHeader from '../components/PageHeader'
import type { DadosEmpresa } from '../types'

export default function EmpresaPage() {
  const { register, handleSubmit, reset, formState: { isSubmitting } } = useForm<DadosEmpresa>()

  useEffect(() => {
    empresaApi.get().then(res => {
      if (res.data && res.data.id) reset(res.data)
    }).catch(() => {})
  }, [])

  const onSubmit = async (data: DadosEmpresa) => {
    try {
      await empresaApi.save(data as unknown as Record<string, unknown>)
      toast.success('Dados da empresa salvos!')
    } catch {
      toast.error('Erro ao salvar dados da empresa')
    }
  }

  return (
    <div className="space-y-6 max-w-3xl mx-auto">
      <PageHeader
        title="Dados da Empresa"
        subtitle="Informações usadas em relatórios e recibos"
        actions={<Building2 className="w-6 h-6 text-[#1B4F8C]" />}
      />

      <div className="card p-6">
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="sm:col-span-2">
              <label className="label">Nome da Empresa *</label>
              <input {...register('nome', { required: true })} className="input" />
            </div>
            <div>
              <label className="label">CNPJ</label>
              <input {...register('cnpj')} className="input" placeholder="00.000.000/0000-00" />
            </div>
            <div>
              <label className="label">Telefone</label>
              <input {...register('telefone')} className="input" />
            </div>
            <div className="sm:col-span-2">
              <label className="label">Endereço</label>
              <input {...register('endereco')} className="input" />
            </div>
            <div>
              <label className="label">Cidade</label>
              <input {...register('cidade')} className="input" />
            </div>
            <div>
              <label className="label">UF</label>
              <input {...register('uf')} className="input" maxLength={2} />
            </div>
            <div>
              <label className="label">CEP</label>
              <input {...register('cep')} className="input" />
            </div>
            <div>
              <label className="label">E-mail</label>
              <input type="email" {...register('email')} className="input" />
            </div>
            <div>
              <label className="label">Site</label>
              <input {...register('site')} className="input" />
            </div>
            <div>
              <label className="label">Responsável</label>
              <input {...register('responsavel')} className="input" />
            </div>
            <div className="sm:col-span-2">
              <label className="label">URL do Logotipo</label>
              <input {...register('logo')} className="input" placeholder="https://... URL da imagem do logotipo" />
            </div>
            <div className="sm:col-span-2">
              <label className="label">Slogan</label>
              <input {...register('slogan')} className="input" placeholder="Ex: Sua conquista começa aqui!" />
            </div>
            <div className="sm:col-span-2">
              <label className="label">Texto do Rodapé nos Recibos</label>
              <textarea {...register('texto_recibo')} rows={3} className="input" placeholder="Ex: Declaro que recebi o valor acima referente à comissão..." />
            </div>
          </div>
          <div className="flex justify-end">
            <button type="submit" disabled={isSubmitting} className="btn-primary px-8">
              {isSubmitting ? 'Salvando...' : 'Salvar Dados'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
