'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { ArrowLeft, Shield, Sun, Moon } from 'lucide-react';

export default function PrivacyPolicy() {
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
            <span className="font-bold font-display uppercase tracking-widest text-sm">Back to Studio</span>
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
          <h1 className={`text-3xl sm:text-4xl font-black tracking-tighter font-display uppercase ${theme === 'dark' ? 'text-white' : 'text-[#222222]'}`}>Privacy Policy</h1>
          <p className="text-zinc-500 text-sm">Last Updated: February 28, 2026</p>
        </section>

        <div className={`prose prose-sm max-w-none ${theme === 'dark' ? 'prose-invert' : ''} space-y-8`}>
          <section className="space-y-4">
            <h2 className={`text-xl font-bold uppercase tracking-wider ${theme === 'dark' ? 'text-emerald-400' : 'text-emerald-600'}`}>1. Introduction</h2>
            <p className="leading-relaxed">
              Welcome to <strong>canvasM TTS Studio</strong>. We value your privacy and are committed to protecting your personal data. This Privacy Policy explains how we collect, use, and safeguard your information when you use our Text-to-Speech service.
            </p>
          </section>

          <section className="space-y-4">
            <h2 className={`text-xl font-bold uppercase tracking-wider ${theme === 'dark' ? 'text-emerald-400' : 'text-emerald-600'}`}>2. Information We Collect</h2>
            <div className="space-y-2">
              <h3 className="font-bold">A. Personal Information</h3>
              <p>We do not require user registration. However, if you contact us via the "Contact Developer" form, we collect your name, email address, and the content of your message to respond to your inquiry.</p>
              
              <h3 className="font-bold">B. Usage Data</h3>
              <p>We may collect non-identifiable information about how you interact with our site, such as browser type, device type, and pages visited, to improve our service.</p>
              
              <h3 className="font-bold">C. API Keys</h3>
              <p>Your Gemini API Key is stored exclusively in your browser&apos;s <strong>Local Storage</strong>. It is never sent to or stored on our servers.</p>
            </div>
          </section>

          <section className="space-y-4">
            <h2 className={`text-xl font-bold uppercase tracking-wider ${theme === 'dark' ? 'text-emerald-400' : 'text-emerald-600'}`}>3. How We Use Your Information</h2>
            <ul className="list-disc pl-5 space-y-2">
              <li>To provide and maintain our TTS service.</li>
              <li>To respond to your feedback or support requests.</li>
              <li>To monitor usage patterns and improve user experience.</li>
              <li>To comply with legal obligations.</li>
            </ul>
          </section>

          <section className="space-y-4">
            <h2 className={`text-xl font-bold uppercase tracking-wider ${theme === 'dark' ? 'text-emerald-400' : 'text-emerald-600'}`}>4. Third-Party Services</h2>
            <p>We use the following third-party services:</p>
            <ul className="list-disc pl-5 space-y-2">
              <li><strong>Google Gemini API:</strong> To process text and generate audio. Please refer to Google&apos;s Privacy Policy for their data handling practices.</li>
              <li><strong>Formspree:</strong> To handle "Contact Developer" form submissions.</li>
              <li><strong>Google AdSense:</strong> We may display advertisements. Google uses cookies to serve ads based on a user&apos;s prior visits to your website or other websites.</li>
            </ul>
          </section>

          <section className="space-y-4">
            <h2 className={`text-xl font-bold uppercase tracking-wider ${theme === 'dark' ? 'text-emerald-400' : 'text-emerald-600'}`}>5. Cookies</h2>
            <p>
              We use cookies to enhance your experience and for advertising purposes. You can choose to disable cookies through your browser settings, but some parts of the site may not function correctly.
            </p>
          </section>

          <section className="space-y-4">
            <h2 className={`text-xl font-bold uppercase tracking-wider ${theme === 'dark' ? 'text-emerald-400' : 'text-emerald-600'}`}>6. Contact Us</h2>
            <p>
              If you have any questions about this Privacy Policy, please contact us through the "Contact Developer" button on the main page.
            </p>
          </section>
        </div>

        <footer className={`pt-12 border-t ${theme === 'dark' ? 'border-zinc-800' : 'border-[#E0E0E0]'} text-center`}>
          <p className="text-zinc-600 text-[10px] font-mono uppercase tracking-widest">
            canvasM TTS Studio • Privacy First
          </p>
        </footer>
      </div>
    </div>
  );
}
