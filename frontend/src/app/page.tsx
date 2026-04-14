"use client";

import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Activity, ArrowRight, Brain, ChevronRight, Map, Navigation, ShieldAlert, Users, Zap } from "lucide-react";
import Link from "next/link";

const fadeUp = {
  initial: { opacity: 0, y: 30 },
  animate: { opacity: 1, y: 0 },
};

const stagger = {
  animate: { transition: { staggerChildren: 0.12 } },
};

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-[#080b14] flex flex-col relative overflow-hidden">
      {/* Background effects */}
      <div className="absolute inset-0 bg-grid opacity-100 pointer-events-none" />
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[600px] bg-violet-600/10 rounded-full blur-[120px] pointer-events-none" />
      <div className="absolute bottom-0 right-0 w-[500px] h-[400px] bg-cyan-500/8 rounded-full blur-[100px] pointer-events-none" />

      {/* Nav */}
      <nav className="relative z-20 flex items-center justify-between px-8 py-5 glass-dark border-b border-white/5">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-violet-600 to-indigo-600 flex items-center justify-center neon-purple">
            <Zap className="w-5 h-5 text-white" />
          </div>
          <span className="text-white font-bold text-lg tracking-tight">SmartVenue<span className="text-violet-400"> AI</span></span>
        </div>
        <div className="flex items-center gap-3">
          <Link href="/login">
            <Button variant="ghost" className="text-gray-400 hover:text-white text-sm">Sign In</Button>
          </Link>
          <Link href="/register">
            <Button className="btn-glow text-white text-sm px-5 h-9 rounded-xl">Get Started</Button>
          </Link>
        </div>
      </nav>

      {/* Hero */}
      <main className="flex-grow flex flex-col items-center justify-center px-6 py-20 relative z-10">
        <motion.div
          variants={stagger}
          initial="initial"
          animate="animate"
          className="text-center max-w-4xl mx-auto"
        >
          <motion.div variants={fadeUp} className="mb-8">
            <span className="inline-flex items-center gap-2 px-4 py-2 rounded-full text-xs font-medium text-violet-300 border border-violet-500/30 bg-violet-500/10">
              <span className="w-1.5 h-1.5 rounded-full bg-violet-400 animate-pulse" />
              Live Crowd Intelligence — Updated every 3 seconds
            </span>
          </motion.div>

          <motion.h1 variants={fadeUp} className="text-6xl md:text-8xl font-black tracking-tighter mb-6 text-white leading-none">
            Smarter Venues,<br />
            <span className="gradient-text">Zero Queues.</span>
          </motion.h1>

          <motion.p variants={fadeUp} className="text-gray-400 text-xl mb-12 max-w-2xl mx-auto leading-relaxed">
            SmartVenue AI uses real-time sensor fusion and predictive algorithms to eliminate crowd bottlenecks before they happen.
          </motion.p>

          <motion.div variants={fadeUp} className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link href="/login">
              <Button size="lg" className="btn-glow text-white h-13 px-8 rounded-2xl text-base font-semibold gap-2">
                Launch Dashboard <ArrowRight className="w-4 h-4" />
              </Button>
            </Link>
            <Link href="/register">
              <Button size="lg" variant="outline" className="glass border-white/10 text-white hover:bg-white/5 h-13 px-8 rounded-2xl text-base">
                Create Free Account
              </Button>
            </Link>
          </motion.div>
        </motion.div>

        {/* Stats Strip */}
        <motion.div
          initial={{ opacity: 0, y: 40 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6, duration: 0.7 }}
          className="mt-24 grid grid-cols-2 md:grid-cols-4 gap-6 w-full max-w-4xl"
        >
          {[
            { label: "Venues Connected", value: "2,400+", icon: <Map className="w-5 h-5" /> },
            { label: "Wait Time Reduced", value: "68%", icon: <Activity className="w-5 h-5" /> },
            { label: "Daily Visitors", value: "1.2M+", icon: <Users className="w-5 h-5" /> },
            { label: "Alerts Dispatched", value: "9,800+", icon: <ShieldAlert className="w-5 h-5" /> },
          ].map((stat) => (
            <div key={stat.label} className="glass-card stat-card p-6 rounded-2xl text-center">
              <div className="text-violet-400 flex justify-center mb-2">{stat.icon}</div>
              <div className="text-3xl font-black text-white mb-1">{stat.value}</div>
              <div className="text-xs text-gray-500 font-medium">{stat.label}</div>
            </div>
          ))}
        </motion.div>

        {/* Features */}
        <motion.div
          initial={{ opacity: 0, y: 50 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.9, duration: 0.7 }}
          className="mt-24 grid grid-cols-1 md:grid-cols-3 gap-6 w-full max-w-5xl"
        >
          {[
            {
              icon: <Map className="w-6 h-6 text-violet-400" />,
              title: "Real-Time Heatmap",
              description: "Visualize crowd density across all sectors with color-coded live map updates every 3 seconds.",
              color: "from-violet-500/10 to-violet-500/0",
              border: "border-violet-500/20",
            },
            {
              icon: <Brain className="w-6 h-6 text-cyan-400" />,
              title: "AI Queue Prediction",
              description: "Our algorithm analyzes density trends to forecast wait times with up to 94% accuracy.",
              color: "from-cyan-500/10 to-cyan-500/0",
              border: "border-cyan-500/20",
            },
            {
              icon: <Navigation className="w-6 h-6 text-emerald-400" />,
              title: "Smart Navigation",
              description: "Dynamically computed safe paths route attendees away from congested zones automatically.",
              color: "from-emerald-500/10 to-emerald-500/0",
              border: "border-emerald-500/20",
            },
          ].map((f) => (
            <div key={f.title} className={`glass-card stat-card group p-7 rounded-2xl border ${f.border} bg-gradient-to-b ${f.color}`}>
              <div className="p-3 bg-white/5 rounded-xl w-fit mb-5 group-hover:scale-110 transition-transform duration-300">
                {f.icon}
              </div>
              <h3 className="text-white font-bold text-lg mb-2">{f.title}</h3>
              <p className="text-gray-500 text-sm leading-relaxed">{f.description}</p>
              <div className="mt-5 flex items-center gap-1 text-xs text-gray-600 group-hover:text-violet-400 transition-colors font-medium">
                Learn more <ChevronRight className="w-3 h-3" />
              </div>
            </div>
          ))}
        </motion.div>
      </main>

      <footer className="relative z-10 py-8 text-center border-t border-white/5">
        <p className="text-gray-600 text-sm">
          &copy; {new Date().getFullYear()} SmartVenue AI. All rights reserved.
        </p>
      </footer>
    </div>
  );
}
