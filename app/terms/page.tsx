'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { ArrowLeft, FileText, Sun, Moon } from 'lucide-react';

export default function TermsOfService() {
  const [theme, setTheme] = useState<'dark' | 'light'>('dark');

  return (
    <div className={`min-h-screen transition-colors duration-300 ${theme === 'dark' ? 'bg-zinc-950 text-zinc-100' : 'bg-[#F8F9FA] text-[#444444]'} p-6`}>
      <div className="max-w-4xl mx-auto space-y-10">
        <header className={`flex items-center justify-between border-b ${theme === 'dark' ? 'border-zinc-800' : 'border-[#E0E0E0]'} pb-6`}>
          <Link 
            href="/" 
            className="flex items-center gap-2 text-zinc-500 hover:text-emerald-400 transition-colors group"
          >
            <ArrowLeft className="w-5 h-5 group-hover:-translate-x-1 transition-transform" />
            <span className="font-bold font-display uppercase tracking-widest text-sm">Back to Home</span>
          </Link>
          
          <button
            onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
            className={`p-3 rounded-xl border transition-all ${
              theme === 'dark' 
                ? 'bg-zinc-900 border-zinc-800 text-zinc-400 hover:text-zinc-200 hover:border-zinc-700' 
                : 'bg-white border-[#E0E0E0] text-[#444444] hover:text-[#222222] hover:border-[#E0E0E0] shadow-[0_2px_4px_rgba(0,0,0,0.05)]'
            }`}
          >
            {theme === 'dark' ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
          </button>
        </header>

        <section className="space-y-4">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-[10px] font-bold uppercase tracking-widest">
            Legal
          </div>
          <h1 className={`text-3xl sm:text-4xl font-black tracking-tighter font-display uppercase ${theme === 'dark' ? 'text-white' : 'text-[#222222]'}`}>Terms of Service</h1>
          <p className="text-zinc-500 text-sm">Last Updated: February 28, 2026</p>
        </section>

        <div className={`prose prose-sm max-w-none ${theme === 'dark' ? 'prose-invert' : ''} space-y-8`}>
          <section className="space-y-4">
            <h2 className={`text-xl font-bold uppercase tracking-wider ${theme === 'dark' ? 'text-emerald-400' : 'text-emerald-600'}`}>1. Acceptance of Terms</h2>
            <p className="leading-relaxed">
              By accessing and using <strong>canvasM TTS Studio</strong>, you agree to be bound by these Terms of Service. If you do not agree to these terms, please do not use our service.
            </p>
          </section>

          <section className="space-y-4">
            <h2 className={`text-xl font-bold uppercase tracking-wider ${theme === 'dark' ? 'text-emerald-400' : 'text-emerald-600'}`}>2. Description of Service</h2>
            <p className="leading-relaxed">
              <strong>canvasM TTS Studio</strong> is a web-based Text-to-Speech tool that uses the Gemini API to generate audio from user-provided text. The service is provided "as is" and "as available."
            </p>
          </section>

          <section className="space-y-4">
            <h2 className={`text-xl font-bold uppercase tracking-wider ${theme === 'dark' ? 'text-emerald-400' : 'text-emerald-600'}`}>3. User Responsibilities</h2>
            <ul className="list-disc pl-5 space-y-2">
              <li>You are responsible for providing your own Gemini API Key.</li>
              <li>You agree not to use the service for any illegal or unauthorized purpose.</li>
              <li>You are solely responsible for the content you generate using our service.</li>
              <li>You must not attempt to disrupt or interfere with the service&apos;s operation.</li>
            </ul>
          </section>

          <section className="space-y-4">
            <h2 className={`text-xl font-bold uppercase tracking-wider ${theme === 'dark' ? 'text-emerald-400' : 'text-emerald-600'}`}>4. Intellectual Property</h2>
            <p className="leading-relaxed">
              The service, including its original content, features, and functionality, is and will remain the exclusive property of <strong>canvasM TTS Studio</strong> and its licensors.
            </p>
          </section>

          <section className="space-y-4">
            <h2 className={`text-xl font-bold uppercase tracking-wider ${theme === 'dark' ? 'text-emerald-400' : 'text-emerald-600'}`}>5. Limitation of Liability</h2>
            <p className="leading-relaxed">
              In no event shall <strong>canvasM TTS Studio</strong>, its developers, or its affiliates be liable for any indirect, incidental, special, consequential, or punitive damages, including without limitation, loss of profits, data, use, goodwill, or other intangible losses, resulting from your access to or use of the service.
            </p>
          </section>

          <section className="space-y-4">
            <h2 className={`text-xl font-bold uppercase tracking-wider ${theme === 'dark' ? 'text-emerald-400' : 'text-emerald-600'}`}>6. Changes to Terms</h2>
            <p className="leading-relaxed">
              We reserve the right, at our sole discretion, to modify or replace these Terms at any time. We will provide notice of any significant changes by updating the "Last Updated" date at the top of this page.
            </p>
          </section>

          <section className="space-y-4">
            <h2 className={`text-xl font-bold uppercase tracking-wider ${theme === 'dark' ? 'text-emerald-400' : 'text-emerald-600'}`}>7. Contact Us</h2>
            <p className="leading-relaxed">
              If you have any questions about these Terms, please contact us through the "Contact Developer" button on the main page.
            </p>
          </section>
        </div>

        <footer className={`pt-12 border-t ${theme === 'dark' ? 'border-zinc-800' : 'border-[#E0E0E0]'} text-center`}>
          <p className="text-zinc-600 text-[10px] font-mono uppercase tracking-widest">
            canvasM TTS Studio • Terms of Service
          </p>
        </footer>
      </div>
    </div>
  );
}
