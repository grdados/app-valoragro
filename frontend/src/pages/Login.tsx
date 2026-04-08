import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { Eye, EyeOff, Lock, User } from 'lucide-react'
import toast from 'react-hot-toast'
import { useAuth } from '../hooks/useAuth'

interface LoginForm {
  username: string
  password: string
}

const LOGO_URL = '/brand/logo-valor-agro.jpg'

export default function LoginPage() {
  const [showPassword, setShowPassword] = useState(false)
  const [loading, setLoading] = useState(false)
  const { login } = useAuth()
  const navigate = useNavigate()
  const { register, handleSubmit, formState: { errors } } = useForm<LoginForm>()

  const onSubmit = async (data: LoginForm) => {
    setLoading(true)
    try {
      await login(data.username, data.password)
      toast.success('Bem-vindo!')
      navigate('/painel/dashboard')
    } catch (err: unknown) {
      const error = err as { response?: { data?: { detail?: string } } }
      toast.error(error?.response?.data?.detail || 'Credenciais inválidas')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="relative min-h-screen overflow-hidden bg-[radial-gradient(circle_at_12%_18%,#173321_0%,#060906_45%,#040605_100%)] flex items-center justify-center p-4">
      <div className="pointer-events-none absolute -top-24 -left-14 h-64 w-64 rounded-full bg-[#66e24d]/20 blur-3xl" />
      <div className="pointer-events-none absolute -bottom-24 -right-16 h-72 w-72 rounded-full bg-[#2cbf45]/20 blur-3xl" />

      <div className="w-full max-w-md">
        <div className="text-center mb-7">
          <Link to="/" className="inline-flex flex-col items-center gap-3">
            <img
              src={LOGO_URL}
              alt="Valor Agro"
              className="h-16 w-auto rounded-lg object-contain shadow-lg ring-1 ring-white/20 transition-transform duration-300 hover:scale-[1.03]"
            />
            <p className="text-sm text-[#b6d8b8] hover:text-white transition-colors">
              Voltar para a landing page
            </p>
          </Link>
        </div>

        <div className="rounded-2xl border border-white/15 bg-white/[0.08] p-8 shadow-2xl backdrop-blur-md">
          <h2 className="mb-6 text-2xl font-semibold text-white">Entrar no sistema</h2>

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
            <div>
              <label className="mb-1 block text-sm font-medium text-[#d5e8d2]">Usuário</label>
              <div className="group relative">
                <User className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-[#8bb890] transition-colors group-focus-within:text-[#66e24d]" />
                <input
                  {...register('username', { required: 'Usuário obrigatório' })}
                  className="w-full rounded-lg border border-white/20 bg-black/20 px-3 py-2 pl-10 text-sm text-white placeholder-[#9ab19e] shadow-sm transition-all duration-200 focus:border-[#66e24d] focus:outline-none focus:ring-2 focus:ring-[#66e24d]/40"
                  placeholder="Digite seu usuário"
                  autoComplete="username"
                />
              </div>
              {errors.username && <p className="mt-1 text-xs text-red-300">{errors.username.message}</p>}
            </div>

            <div>
              <label className="mb-1 block text-sm font-medium text-[#d5e8d2]">Senha</label>
              <div className="group relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-[#8bb890] transition-colors group-focus-within:text-[#66e24d]" />
                <input
                  {...register('password', { required: 'Senha obrigatória' })}
                  type={showPassword ? 'text' : 'password'}
                  className="w-full rounded-lg border border-white/20 bg-black/20 px-3 py-2 pl-10 pr-10 text-sm text-white placeholder-[#9ab19e] shadow-sm transition-all duration-200 focus:border-[#66e24d] focus:outline-none focus:ring-2 focus:ring-[#66e24d]/40"
                  placeholder="Digite sua senha"
                  autoComplete="current-password"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-[#9ab19e] transition-colors hover:text-[#66e24d]"
                >
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
              {errors.password && <p className="mt-1 text-xs text-red-300">{errors.password.message}</p>}
            </div>

            <button
              type="submit"
              disabled={loading}
              className="inline-flex w-full items-center justify-center gap-2 rounded-lg bg-[#66e24d] px-4 py-3 text-base font-semibold text-[#081109] transition-all duration-200 hover:bg-[#7bea63] hover:shadow-[0_0_0_4px_rgba(102,226,77,0.2)] focus:outline-none focus:ring-2 focus:ring-[#66e24d]/50 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {loading ? (
                <span className="flex items-center gap-2">
                  <svg className="h-4 w-4 animate-spin" viewBox="0 0 24 24" fill="none">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                  </svg>
                  Entrando...
                </span>
              ) : 'Entrar'}
            </button>
          </form>
        </div>
      </div>
    </div>
  )
}
