'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/utils/supabase/client'

export default function SignupPage() {
    const router = useRouter()
    const [email, setEmail] = useState('')
    const [password, setPassword] = useState('')
    const [name, setName] = useState('')
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState<string | null>(null)

    const handleSignup = async (e: React.FormEvent) => {
        e.preventDefault()
        setLoading(true)
        setError(null)

        const supabase = createClient()
        const { error } = await supabase.auth.signUp({
            email,
            password,
            options: {
                data: {
                    full_name: name,
                },
            },
        })

        if (error) {
            setError(error.message)
            setLoading(false)
        } else {
            // Check if email confirmation is required (Supabase default)
            // For now, redirect to login with a message, or home if auto-confirm is on.
            // Assuming default Supabase behavior often requires email confirmation.
            // But for local dev/testing, maybe not. Let's try redirecting to dashboard.
            router.push('/')
            router.refresh()
        }
    }

    return (
        <div className="min-h-screen flex items-center justify-center bg-[#050F0A] p-4 relative overflow-hidden">
            <div className="absolute inset-0 pointer-events-none opacity-[0.03]" style={{ backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noiseFilter'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.65' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noiseFilter)'/%3E%3C/svg%3E")` }}></div>
            <div className="w-full max-w-md space-y-6 md:space-y-10 relative z-10 glass-panel p-6 md:p-12 rounded-sm shadow-[0_0_50px_rgba(26,60,52,0.5)]">
                {/* Logo */}
                <div className="text-center space-y-4 md:space-y-6">
                    <div className="w-12 h-12 md:w-16 md:h-16 mx-auto rounded-full border border-[#D4AF37] flex items-center justify-center shadow-[0_0_20px_rgba(212,175,55,0.3)] bg-[#0A1914]">
                        <span className="text-2xl md:text-3xl font-serif font-bold text-[#D4AF37]">S</span>
                    </div>
                    <div className="space-y-2">
                        <h1 className="text-xl md:text-2xl font-serif font-bold text-[#F5F5F0] tracking-widest uppercase">
                            Join Shaista
                        </h1>
                        <p className="text-[#A0A5A0] text-[10px] md:text-xs uppercase tracking-[0.2em]">
                            Create Your Account
                        </p>
                    </div>
                </div>

                {/* Form */}
                <div className="space-y-6 md:space-y-8">
                    <form onSubmit={handleSignup} className="space-y-4 md:space-y-6">
                        <div className="space-y-2">
                            <label htmlFor="name" className="block text-[10px] md:text-xs font-bold text-[#D4AF37] uppercase tracking-widest ml-1">
                                Full Name
                            </label>
                            <input
                                type="text"
                                id="name"
                                value={name}
                                onChange={(e) => setName(e.target.value)}
                                placeholder="John Doe"
                                className="w-full px-4 py-2.5 md:py-3 bg-[#0A1914]/50 border-b border-[#A0A5A0]/30 focus:border-[#D4AF37] focus:outline-none placeholder-[#A0A5A0]/30 text-[#F5F5F0] transition-colors"
                            />
                        </div>
                        <div className="space-y-2">
                            <label htmlFor="email" className="block text-[10px] md:text-xs font-bold text-[#D4AF37] uppercase tracking-widest ml-1">
                                Email
                            </label>
                            <input
                                type="email"
                                id="email"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                suppressHydrationWarning
                                placeholder="name@example.com"
                                className="w-full px-4 py-2.5 md:py-3 bg-[#0A1914]/50 border-b border-[#A0A5A0]/30 focus:border-[#D4AF37] focus:outline-none placeholder-[#A0A5A0]/30 text-[#F5F5F0] transition-colors"
                            />
                        </div>
                        <div className="space-y-2">
                            <label htmlFor="password" className="block text-[10px] md:text-xs font-bold text-[#D4AF37] uppercase tracking-widest ml-1">
                                Password
                            </label>
                            <input
                                type="password"
                                id="password"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                placeholder="••••••••"
                                className="w-full px-4 py-2.5 md:py-3 bg-[#0A1914]/50 border-b border-[#A0A5A0]/30 focus:border-[#D4AF37] focus:outline-none placeholder-[#A0A5A0]/30 text-[#F5F5F0] transition-colors"
                            />
                        </div>

                        {error && (
                            <div className="text-red-400 text-[10px] md:text-xs text-center border border-red-500/20 bg-red-500/10 p-2 rounded-sm">
                                {error}
                            </div>
                        )}

                        <button
                            type="submit"
                            disabled={loading}
                            className="w-full py-3 md:py-4 mt-2 md:mt-4 bg-[#1A3C34] text-[#F5F5F0] font-serif font-bold tracking-widest hover:bg-[#D4AF37] hover:text-[#050F0A] transition-all duration-300 border border-[#D4AF37]/20 hover:border-[#D4AF37] disabled:opacity-50 disabled:cursor-not-allowed text-xs md:text-base"
                        >
                            {loading ? 'PROCESSING...' : 'REQUEST ACCESS'}
                        </button>
                    </form>

                    <p className="text-center text-[#A0A5A0] text-[10px] md:text-xs tracking-wide">
                        Already a member?{' '}
                        <a href="/login" className="text-[#D4AF37] hover:underline underline-offset-4 decoration-[#D4AF37]/50">
                            Sign In
                        </a>
                    </p>
                </div>
            </div>
        </div>
    )
}
