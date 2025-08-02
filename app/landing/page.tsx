// In app/landing/page.tsx

'use client';

import Link from 'next/link';
import { FiArrowRight, FiBarChart2, FiCpu, FiZap } from 'react-icons/fi';

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-slate-900 text-white">
      {/* Header */}
      <header className="absolute top-0 left-0 w-full z-10 p-4 sm:p-6">
        <div className="container mx-auto flex justify-between items-center">
          <Link href="/landing" className="text-2xl font-bold">
            Arthaa<span className="text-emerald-400">.</span>
          </Link>
          <nav className="hidden sm:flex items-center gap-6 text-sm">
            <Link href="/builder" className="hover:text-emerald-400 transition-colors">Strategy Builder</Link>
            <Link href="/backtest" className="hover:text-emerald-400 transition-colors">Backtester</Link>
            <Link href="/account" className="hover:text-emerald-400 transition-colors">Account</Link>
          </nav>
        </div>
      </header>

      <main>
        {/* Hero Section */}
        <section className="relative h-screen flex items-center justify-center text-center overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-b from-slate-900 via-slate-900/80 to-slate-900 z-10"></div>
          <div className="absolute inset-0 bg-[url('/grid.svg')] bg-repeat opacity-5"></div>
          <div className="relative z-20 px-4">
            <h1 className="text-4xl sm:text-5xl md:text-6xl font-extrabold tracking-tight mb-4">
              Build, Test, and Automate <br /> Your Trading Ideas
            </h1>
            <p className="max-w-2xl mx-auto text-lg text-slate-300 mb-8">
              Move beyond guesswork. Use our powerful no-code tools to create data-driven trading strategies, validate them against historical data, and deploy them live.
            </p>
            <Link href="/builder" className="inline-flex items-center gap-2 bg-emerald-500 hover:bg-emerald-600 text-white font-semibold px-8 py-3 rounded-lg transition-transform hover:scale-105">
              Start Building for Free
              <FiArrowRight />
            </Link>
          </div>
        </section>

        {/* How It Works Section */}
        <section className="py-20 sm:py-32 bg-slate-900">
          <div className="container mx-auto px-4 text-center">
            <h2 className="text-3xl font-bold mb-4">Your Trading, Supercharged</h2>
            <p className="text-slate-400 max-w-2xl mx-auto mb-16">In three simple steps, transform your trading ideas into automated systems.</p>
            <div className="grid md:grid-cols-3 gap-8 sm:gap-12">
              {/* Step 1: Build */}
              <div className="bg-slate-800/50 p-8 rounded-xl border border-slate-700">
                <div className="mb-4 inline-block bg-emerald-500/10 p-3 rounded-full">
                  <FiCpu className="text-emerald-400" size={28} />
                </div>
                <h3 className="text-xl font-semibold mb-2">1. Build Visually</h3>
                <p className="text-slate-400">
                  Use our intuitive, no-code editor to craft complex strategies. Combine technical indicators like RSI, MACD, and Moving Averages with simple drag-and-drop logic.
                </p>
              </div>
              {/* Step 2: Backtest */}
              <div className="bg-slate-800/50 p-8 rounded-xl border border-slate-700">
                <div className="mb-4 inline-block bg-emerald-500/10 p-3 rounded-full">
                  <FiBarChart2 className="text-emerald-400" size={28} />
                </div>
                <h3 className="text-xl font-semibold mb-2">2. Backtest with Data</h3>
                <p className="text-slate-400">
                  Validate your ideas against years of historical market data. Our engine gives you a detailed performance report, including win rate and profitability.
                </p>
              </div>
              {/* Step 3: Automate */}
              <div className="bg-slate-800/50 p-8 rounded-xl border border-slate-700">
                <div className="mb-4 inline-block bg-emerald-500/10 p-3 rounded-full">
                  <FiZap className="text-emerald-400" size={28} />
                </div>
                <h3 className="text-xl font-semibold mb-2">3. Automate Live</h3>
                <p className="text-slate-400">
                  Connect your existing broker account (e.g., Alpaca, Zerodha) and let your proven strategies execute trades automatically in real-time.
                </p>
              </div>
            </div>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="py-8 bg-slate-800/50 border-t border-slate-800">
          <div className="container mx-auto px-4 text-center text-slate-400 text-sm">
              <p>&copy; {new Date().getFullYear()} Arthaa. All Rights Reserved.</p>
          </div>
      </footer>
    </div>
  );
}



