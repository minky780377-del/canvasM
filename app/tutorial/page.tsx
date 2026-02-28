'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { ArrowLeft, Play, Settings, Key, Volume2, Download, Sun, Moon, MousePointer2, Mail } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

export default function TutorialPage() {
  const [theme, setTheme] = useState<'dark' | 'light'>('dark');
  const [activeStep, setActiveStep] = useState<number | null>(null);

  const steps = [
    {
      id: 1,
      title: "1. Set your API Key",
      icon: <Key className="w-6 h-6" />,
      color: "bg-emerald-500/10 text-emerald-400",
      summary: "Click the key icon in the header to enter your Gemini API Key.",
      details: "Your API key is essential for connecting to the Gemini engines. We store it locally in your browser's storage, meaning it never touches our servers. You can update or delete it at any time by clicking the same icon. Look for the green glow to know you're connected."
    },
    {
      id: 2,
      title: "2. Configure Voice",
      icon: <Settings className="w-6 h-6" />,
      color: "bg-blue-500/10 text-blue-400",
      summary: "Use the settings panel to adjust the tone and mood.",
      details: "Select from our curated professional voices (Puck, Charon, Kore, Fenrir, Zephyr) in the sidebar. Use the 'Tone & Mood' field to give specific emotional instructions like 'Calm and soothing' or 'Excited and energetic'. Our 2.5 Flash engine is optimized to follow these nuances."
    },
    {
      id: 3,
      title: "3. Generate & Preview",
      icon: <Volume2 className="w-6 h-6" />,
      color: "bg-purple-500/10 text-purple-400",
      summary: "Type your text and hit Generate to hear the magic.",
      details: "You can generate audio for your entire script (up to 1500 characters) or use our 'Selection Mode'. Simply highlight a specific part of your text with your mouse, and a floating button will appear, allowing you to generate audio for just that segment. Perfect for fine-tuning specific sentences."
    },
    {
      id: 4,
      title: "4. Export WAV",
      icon: <Download className="w-6 h-6" />,
      color: "bg-amber-500/10 text-amber-400",
      summary: "Download your high-quality 44.1kHz WAV file.",
      details: "Once you're happy with the result, click the WAV button to download the audio. We provide high-fidelity 44.1kHz output, suitable for professional video editing, podcasts, or presentations. Each download is named with a timestamp for easy organization."
    },
    {
      id: 5,
      title: "5. Contact Developer",
      icon: <Mail className="w-6 h-6" />,
      color: "bg-pink-500/10 text-pink-400",
      summary: "Have feedback or need assistance? Reach out to us directly.",
      details: "저희 서비스 이용 중 불편한 점이 있으시거나, 개발자에게 전하실 소중한 의견이 있다면 언제든 상단의 메일 아이콘을 통해 연락 주시기 바랍니다. 보내주신 메시지는 개발팀에서 직접 검토하며, 더 나은 서비스를 만드는 데 큰 힘이 됩니다. 비즈니스 제휴나 기술적 문의 또한 환영합니다."
    }
  ];

  return (
    <div className={`min-h-screen transition-colors duration-300 ${theme === 'dark' ? 'bg-zinc-950 text-zinc-100' : 'bg-zinc-50 text-zinc-900'} p-6`}>
      <div className="max-w-4xl mx-auto space-y-12">
        <header className="flex items-center justify-between border-b border-zinc-800 pb-6">
          <Link 
            href="/" 
            className="flex items-center gap-2 text-zinc-500 hover:text-emerald-400 transition-colors group"
          >
            <ArrowLeft className="w-5 h-5 group-hover:-translate-x-1 transition-transform" />
            <span className="font-bold font-display uppercase tracking-widest text-sm">Back to Studio</span>
          </Link>
          
          <button
            onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
            className={`p-3 rounded-xl border transition-all ${
              theme === 'dark' 
                ? 'bg-zinc-900 border-zinc-800 text-zinc-400 hover:text-zinc-200 hover:border-zinc-700' 
                : 'bg-white border-zinc-200 text-zinc-500 hover:text-zinc-900 hover:border-zinc-300'
            }`}
          >
            {theme === 'dark' ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
          </button>
        </header>

        <section className="space-y-6">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-[10px] font-bold uppercase tracking-widest">
            Interactive Guide
          </div>
          <h1 className="text-4xl font-black tracking-tighter font-display uppercase">Mastering the Studio</h1>
          <p className="text-zinc-500 text-lg max-w-2xl leading-relaxed">
            CANVASM TTS STUDIO combines the intelligence of Gemini 3.1 with the specialized audio capabilities of 2.5. 
            Click on any step below to see detailed instructions.
          </p>
        </section>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {steps.map((step) => (
            <button
              key={step.id}
              onClick={() => setActiveStep(activeStep === step.id ? null : step.id)}
              className={`p-8 rounded-3xl border transition-all text-left group relative overflow-hidden ${
                activeStep === step.id
                  ? theme === 'dark' ? 'bg-zinc-900 border-emerald-500/50 ring-1 ring-emerald-500/20' : 'bg-white border-emerald-500/50 ring-1 ring-emerald-500/20'
                  : theme === 'dark' ? 'bg-zinc-900/50 border-zinc-800 hover:border-zinc-700' : 'bg-white border-zinc-200 hover:border-zinc-300'
              }`}
            >
              <div className="relative z-10 space-y-4">
                <div className={`w-12 h-12 rounded-2xl ${step.color} flex items-center justify-center transition-transform group-hover:scale-110`}>
                  {step.icon}
                </div>
                <div className="space-y-2">
                  <h3 className="text-xl font-bold font-display uppercase tracking-wider">{step.title}</h3>
                  <p className="text-zinc-500 text-sm leading-relaxed">{step.summary}</p>
                </div>

                <AnimatePresence>
                  {activeStep === step.id && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: 'auto', opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      className="overflow-hidden"
                    >
                      <div className={`pt-4 mt-4 border-t ${theme === 'dark' ? 'border-zinc-800' : 'border-zinc-100'} text-sm text-zinc-400 leading-relaxed italic`}>
                        {step.details}
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
              
              {activeStep !== step.id && (
                <div className="absolute bottom-4 right-6 text-[10px] font-bold text-zinc-600 uppercase tracking-widest opacity-0 group-hover:opacity-100 transition-opacity">
                  Click to expand
                </div>
              )}
            </button>
          ))}
        </div>

        <div className={`p-8 rounded-3xl border ${theme === 'dark' ? 'bg-emerald-500/5 border-emerald-500/20' : 'bg-emerald-50 border-emerald-200'} flex flex-col md:flex-row items-center gap-6`}>
          <div className="w-16 h-16 rounded-full bg-emerald-500/10 flex items-center justify-center text-emerald-400 shrink-0">
            <MousePointer2 className="w-8 h-8" />
          </div>
          <div className="space-y-2">
            <h4 className="text-lg font-bold font-display uppercase tracking-wider text-emerald-500">Pro Tip: Selection Mode</h4>
            <p className="text-zinc-500 text-sm leading-relaxed">
              Don&apos;t want to generate the whole script? Highlight any text within the editor to instantly see the 
              <span className="text-emerald-400 font-bold mx-1 uppercase tracking-widest text-[10px]">Generate Specific</span> 
              button. This saves time and allows you to focus on the perfect delivery for key phrases.
            </p>
          </div>
        </div>

        <footer className="pt-12 border-t border-zinc-800 text-center">
          <p className="text-zinc-600 text-xs font-mono uppercase tracking-widest">
            Global Ready • High Fidelity • Privacy First
          </p>
        </footer>
      </div>
    </div>
  );
}
