'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/utils/supabase/client'

export default function LoginPage() {
    const router = useRouter()
    const [email, setEmail] = useState('')
    const [password, setPassword] = useState('')
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState<string | null>(null)

    const handleLogin = async (e: React.FormEvent) => {
        e.preventDefault()
        setLoading(true)
        setError(null)

        const supabase = createClient()
        const { error } = await supabase.auth.signInWithPassword({
            email,
            password,
        })

        if (error) {
            console.error('Login error:', error)
            setError(error.message)
            setLoading(false)
        } else {
            router.push('/')
            router.refresh()
        }
    }

    return (
        <div className="min-h-screen flex items-center justify-center bg-[#050F0A] p-4 relative overflow-hidden">
            <div className="absolute inset-0 pointer-events-none opacity-[0.03]" style={{ backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noiseFilter'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.65' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noiseFilter)'/%3E%3C/svg%3E")` }}></div>
            <div className="w-full max-w-md space-y-10 relative z-10 glass-panel p-12 rounded-sm shadow-[0_0_50px_rgba(26,60,52,0.5)]">
                {/* Logo */}
                <div className="text-center space-y-6">
                    <div className="w-16 h-16 mx-auto rounded-full border border-[#D4AF37] flex items-center justify-center shadow-[0_0_20px_rgba(212,175,55,0.3)] bg-[#0A1914]">
                        <span className="text-3xl font-serif font-bold text-[#D4AF37]">S</span>
                    </div>
                    <div className="space-y-2">
                        <h1 className="text-2xl font-serif font-bold text-[#F5F5F0] tracking-widest uppercase">
                            Shaista
                        </h1>
                        <p className="text-[#A0A5A0] text-xs uppercase tracking-[0.2em]">
                            GLM Based Intelligence
                        </p>
                    </div>
                </div>

                {/* Form */}
                <div className="space-y-8">
                    <form onSubmit={handleLogin} className="space-y-6">
                        <div className="space-y-2">
                            <label htmlFor="email" className="block text-xs font-bold text-[#D4AF37] uppercase tracking-widest ml-1">
                                Email
                            </label>
                            <input
                                type="email"
                                id="email"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                suppressHydrationWarning
                                placeholder="name@example.com"
                                className="w-full px-4 py-3 bg-[#0A1914]/50 border-b border-[#A0A5A0]/30 focus:border-[#D4AF37] focus:outline-none placeholder-[#A0A5A0]/30 text-[#F5F5F0] transition-colors"
                            />
                        </div>
                        <div className="space-y-2">
                            <label htmlFor="password" className="block text-xs font-bold text-[#D4AF37] uppercase tracking-widest ml-1">
                                Password
                            </label>
                            <input
                                type="password"
                                id="password"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                placeholder="••••••••"
                                className="w-full px-4 py-3 bg-[#0A1914]/50 border-b border-[#A0A5A0]/30 focus:border-[#D4AF37] focus:outline-none placeholder-[#A0A5A0]/30 text-[#F5F5F0] transition-colors"
                            />
                        </div>

                        {error && (
                            <div className="text-red-400 text-xs text-center border border-red-500/20 bg-red-500/10 p-2 rounded-sm">
                                {error}
                            </div>
                        )}

                        <button
                            type="submit"
                            disabled={loading}
                            className="w-full py-4 mt-4 bg-[#1A3C34] text-[#F5F5F0] font-serif font-bold tracking-widest hover:bg-[#D4AF37] hover:text-[#050F0A] transition-all duration-300 border border-[#D4AF37]/20 hover:border-[#D4AF37] disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            {loading ? 'AUTHENTICATING...' : 'ACCESS ACCOUNT'}
                        </button>
                    </form>

                    <div className="relative py-2">
                        <div className="absolute inset-0 flex items-center">
                            <div className="w-full border-t border-[#A0A5A0]/20"></div>
                        </div>
                        <div className="relative flex justify-center text-xs">
                            <span className="px-4 bg-[#0A1914] text-[#A0A5A0] uppercase tracking-widest">or</span>
                        </div>
                    </div>

                    <a href="/" className="block w-full py-3 text-center border border-[#A0A5A0]/30 text-[#A0A5A0] hover:text-[#D4AF37] hover:border-[#D4AF37] transition-all uppercase tracking-widest text-xs font-medium">
                        Explore as Guest
                    </a>
                </div>

                <p className="text-center text-[#A0A5A0] text-xs tracking-wide">
                    New to Shaista?{' '}
                    <a href="/signup" className="text-[#D4AF37] hover:underline underline-offset-4 decoration-[#D4AF37]/50">
                        Apply for Access
                    </a>
                </p>
            </div>
        </div>
    )
}
