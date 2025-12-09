'use client'

import { useState } from 'react';
import { signIn } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { Eye, EyeOff } from 'lucide-react';

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    const res = await signIn('credentials', {
      redirect: false,
      email,
      password,
    });
    setLoading(false);
    if (res && !res.error) {
      router.push('/');
    } else {
      setError('Credenciais inválidas.');
    }
  };

  return (
    <div className="min-h-screen bg-black text-white flex items-center justify-center px-4">
      <div className="w-full max-w-sm rounded-xl border border-neon-cyan/40 bg-[#0b1120]/90 p-6 glow">
        <div className="mb-4 text-center">
          <div className="text-2xl font-bold tracking-wider">BetAI Predictor</div>
          <div className="mt-1 text-xs text-cyan-300">Acesso Controlado</div>
        </div>
        <form onSubmit={onSubmit} className="space-y-3">
          <div>
            <label className="block text-xs text-cyan-300 mb-1">Email</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full rounded-md border border-neon-cyan/50 bg-black/60 px-3 py-2 text-sm outline-none focus:border-neon-cyan focus:ring-0"
              placeholder="Digite seu email"
              required
            />
          </div>
          <div>
            <label className="block text-xs text-cyan-300 mb-1">Senha</label>
            <div className="relative">
              <input
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full rounded-md border border-electric-purple/50 bg-black/60 px-3 pr-10 py-2 text-sm outline-none focus:border-electric-purple focus:ring-0"
                placeholder="••••••••"
                required
              />
              <button
                type="button"
                onClick={() => setShowPassword((v) => !v)}
                aria-label={showPassword ? 'Ocultar senha' : 'Mostrar senha'}
                className="absolute right-2 top-1/2 -translate-y-1/2 rounded-md border border-electric-purple/40 bg-black/40 p-1 text-electric-purple hover:bg-black/60"
              >
                {showPassword ? (
                  <EyeOff className="h-4 w-4" />
                ) : (
                  <Eye className="h-4 w-4" />
                )}
              </button>
            </div>
          </div>
          {error ? (
            <div className="rounded-md border border-red-500/40 bg-red-900/30 px-3 py-2 text-xs text-red-300">{error}</div>
          ) : null}
          <button
            type="submit"
            disabled={loading}
            className="mt-2 w-full rounded-md border border-neon-cyan/60 bg-black/60 px-3 py-2 text-sm font-medium text-neon-cyan shadow-[0_0_16px_rgba(0,243,255,0.5)] hover:bg-black/80 disabled:opacity-60"
          >
            {loading ? 'Acessando…' : 'Acessar Sistema'}
          </button>
        </form>
      </div>
    </div>
  );
}