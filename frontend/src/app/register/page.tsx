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

export default function RegisterPage() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPass, setShowPass] = useState(false);
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();
  const router = useRouter();

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const data = await apiFetch<{ token: string }>(
        "/api/auth/register",
        { method: "POST", body: { name, email, password } }
      );
      login(data, data.token);
      toast.success("Account created!");
      router.push("/dashboard");
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Registration failed";
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  };


  return (
    <div className="min-h-screen bg-[#080b14] flex items-center justify-center relative overflow-hidden p-6">
      <div className="absolute inset-0 bg-grid opacity-100 pointer-events-none" />
      <div className="absolute bottom-0 left-0 w-[600px] h-[500px] bg-violet-600/10 rounded-full blur-[130px] pointer-events-none" />
      <div className="absolute top-0 right-0 w-[400px] h-[300px] bg-cyan-600/8 rounded-full blur-[100px] pointer-events-none" />

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="w-full max-w-md relative z-10"
      >
        <Link href="/" className="inline-flex items-center gap-2 text-sm text-gray-500 hover:text-gray-300 mb-8 transition-colors">
          <ArrowLeft className="w-4 h-4" /> Back to home
        </Link>

        <div className="flex items-center gap-3 mb-8">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-violet-600 to-indigo-600 flex items-center justify-center shadow-lg shadow-violet-500/30">
            <Zap className="w-5 h-5 text-white" />
          </div>
          <span className="text-white font-bold text-lg">SmartVenue<span className="text-violet-400"> AI</span></span>
        </div>

        <h1 className="text-3xl font-black text-white mb-2">Create an account</h1>
        <p className="text-gray-500 mb-8">Get access to the real-time crowd intelligence platform</p>

        <form onSubmit={handleRegister} className="space-y-5">
          <div className="space-y-2">
            <Label className="text-gray-400 text-sm font-medium">Full name</Label>
            <Input
              type="text"
              required
              value={name}
              onChange={e => setName(e.target.value)}
              placeholder="Jane Smith"
              className="h-12 bg-white/4 border-white/8 text-white placeholder:text-gray-600 rounded-xl focus:border-violet-500/50 transition-colors"
            />
          </div>
          <div className="space-y-2">
            <Label className="text-gray-400 text-sm font-medium">Email address</Label>
            <Input
              type="email"
              required
              value={email}
              onChange={e => setEmail(e.target.value)}
              placeholder="you@example.com"
              className="h-12 bg-white/4 border-white/8 text-white placeholder:text-gray-600 rounded-xl focus:border-violet-500/50 transition-colors"
            />
          </div>
          <div className="space-y-2">
            <Label className="text-gray-400 text-sm font-medium">Password</Label>
            <div className="relative">
              <Input
                type={showPass ? "text" : "password"}
                required
                minLength={6}
                value={password}
                onChange={e => setPassword(e.target.value)}
                placeholder="At least 6 characters"
                className="h-12 bg-white/4 border-white/8 text-white placeholder:text-gray-600 rounded-xl focus:border-violet-500/50 transition-colors pr-12"
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
            {loading ? <><Loader2 className="w-4 h-4 animate-spin" /> Creating account...</> : "Create Account"}
          </button>
        </form>

        <p className="mt-6 text-center text-sm text-gray-600">
          Already have an account? <Link href="/login" className="text-violet-400 hover:text-violet-300 font-medium transition-colors">Sign in</Link>
        </p>
      </motion.div>
    </div>
  );
}
