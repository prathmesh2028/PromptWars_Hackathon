"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useAuth } from "@/context/AuthContext";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import Link from "next/link";
import { ArrowLeft, Eye, EyeOff, Loader2, Zap } from "lucide-react";
import { apiFetch } from "@/lib/api";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPass, setShowPass] = useState(false);
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();
  const router = useRouter();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const data = await apiFetch<{ id: string; name: string; email: string; isAdmin: boolean; token: string }>(
        "/api/auth/login",
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ email, password })
        }
      );
      login(data, data.token);
      toast.success("Welcome back!");
      router.push(data.isAdmin ? "/admin" : "/dashboard");
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Invalid credentials";
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#080b14] flex relative overflow-hidden">
      <div className="absolute inset-0 bg-grid opacity-100 pointer-events-none" />
      <div className="absolute top-0 left-0 w-[600px] h-[600px] bg-violet-600/10 rounded-full blur-[120px] pointer-events-none" />
      <div className="absolute bottom-0 right-0 w-[400px] h-[400px] bg-cyan-600/8 rounded-full blur-[100px] pointer-events-none" />

      {/* Left Panel */}
      <div className="hidden lg:flex flex-col justify-between w-1/2 p-12 relative z-10 border-r border-white/5">
        <Link href="/" className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-violet-600 to-indigo-600 flex items-center justify-center shadow-lg shadow-violet-500/30">
            <Zap className="w-5 h-5 text-white" />
          </div>
          <span className="text-white font-bold text-xl">
            SmartVenue<span className="text-violet-400"> AI</span>
          </span>
        </Link>

        <div>
          <h2 className="text-5xl font-black text-white leading-tight mb-5">
            Real-time crowd<br />
            <span className="gradient-text">intelligence.</span>
          </h2>
          <p className="text-gray-500 text-lg leading-relaxed max-w-sm">
            Monitor density, predict queues, and route attendees — all powered by real-time AI simulation.
          </p>

          <div className="mt-10 space-y-4">
            {["Live sector heatmaps", "AI queue prediction", "Emergency broadcasts"].map(f => (
              <div key={f} className="flex items-center gap-3 text-gray-400">
                <span className="w-5 h-5 rounded-full bg-violet-500/20 border border-violet-500/30 flex items-center justify-center flex-shrink-0">
                  <span className="w-1.5 h-1.5 rounded-full bg-violet-400" />
                </span>
                {f}
              </div>
            ))}
          </div>
        </div>

        <p className="text-gray-700 text-sm">&copy; {new Date().getFullYear()} SmartVenue AI</p>
      </div>

      {/* Right Panel */}
      <div className="flex-1 flex items-center justify-center p-8 relative z-10">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="w-full max-w-md"
        >
          <Link href="/" className="inline-flex items-center gap-2 text-sm text-gray-500 hover:text-gray-300 mb-8 transition-colors">
            <ArrowLeft className="w-4 h-4" /> Back to home
          </Link>

          <div className="mb-8">
            <h1 className="text-3xl font-black text-white mb-2">
              Welcome back
            </h1>
            <p className="text-gray-500">
              Sign in to access your SmartVenue dashboard
            </p>
          </div>

          <form onSubmit={handleLogin} className="space-y-5">
            <div className="space-y-2">
              <Label className="text-gray-400 text-sm font-medium">Email address</Label>
              <Input
                type="email"
                required
                value={email}
                onChange={e => setEmail(e.target.value)}
                placeholder="admin@smartvenue.ai"
                className="h-12 bg-white/4 border-white/8 text-white placeholder:text-gray-600 rounded-xl focus:border-violet-500/50 focus:bg-white/6 transition-colors"
              />
            </div>
            <div className="space-y-2">
              <Label className="text-gray-400 text-sm font-medium">Password</Label>
              <div className="relative">
                <Input
                  type={showPass ? "text" : "password"}
                  required
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  className="h-12 bg-white/4 border-white/8 text-white rounded-xl focus:border-violet-500/50 focus:bg-white/6 transition-colors pr-12"
                />
                <button
                  type="button"
                  onClick={() => setShowPass(v => !v)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-300 transition-colors"
                >
                  {showPass ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="btn-glow w-full h-12 rounded-xl text-white font-semibold flex items-center justify-center gap-2 disabled:opacity-60 disabled:cursor-not-allowed disabled:transform-none mt-6"
            >
              {loading ? <><Loader2 className="w-4 h-4 animate-spin" /> Signing in...</> : "Sign in to Dashboard"}
            </button>
          </form>

          <div className="mt-8 p-4 rounded-xl bg-white/3 border border-white/6 text-sm space-y-1.5">
            <p className="text-gray-500 font-medium text-xs uppercase tracking-wider mb-2">Demo Credentials</p>
            <div className="flex justify-between text-gray-400">
              <span>Admin</span><span className="font-mono text-violet-300">admin@smartvenue.ai / password123</span>
            </div>
            <div className="flex justify-between text-gray-400">
              <span>User</span><span className="font-mono text-cyan-300">john@example.com / password123</span>
            </div>
          </div>

          <p className="mt-6 text-center text-sm text-gray-600">
            No account? <Link href="/register" className="text-violet-400 hover:text-violet-300 font-medium transition-colors">Create one free</Link>
          </p>
        </motion.div>
      </div>
    </div>
  );
}