'use client';

import React, { useState } from 'react';
import { X, Send, CheckCircle2, Mail, ChevronDown } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

interface PartnershipFormProps {
  isOpen: boolean;
  onClose: () => void;
  theme: 'dark' | 'light';
}

export default function PartnershipForm({ isOpen, onClose, theme }: PartnershipFormProps) {
  const [status, setStatus] = useState<'idle' | 'submitting' | 'success' | 'error'>('idle');

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setStatus('submitting');
    
    const form = e.currentTarget;
    const formData = new FormData(form);

    try {
      const response = await fetch('https://formspree.io/f/mbdabwpa', {
        method: 'POST',
        body: formData,
        headers: {
          'Accept': 'application/json'
        }
      });

      if (response.ok) {
        setStatus('success');
        form.reset();
      } else {
        setStatus('error');
      }
    } catch (err) {
      setStatus('error');
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="absolute inset-0 bg-black/60 backdrop-blur-sm"
          />
          
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            className={`relative w-full max-w-md overflow-hidden rounded-3xl border ${
              theme === 'dark' 
                ? 'bg-zinc-900 border-zinc-800 shadow-2xl shadow-emerald-500/10' 
                : 'bg-white border-[#E0E0E0] shadow-[0_2px_4px_rgba(0,0,0,0.05)]'
            }`}
          >
            {/* Header */}
            <div className={`flex items-center justify-between p-6 border-b ${theme === 'dark' ? 'border-zinc-800' : 'border-[#E0E0E0]'}`}>
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-emerald-500/10 flex items-center justify-center">
                  <Mail className="w-5 h-5 text-emerald-500" />
                </div>
                <div>
                  <h2 className={`text-lg font-bold tracking-[0.05em] ${theme === 'dark' ? 'text-white' : 'text-[#222222]'}`}>CONTACT DEVELOPER</h2>
                  <p className={`text-xs ${theme === 'dark' ? 'text-zinc-500' : 'text-[#444444]'}`}>Send an inquiry or feedback</p>
                </div>
              </div>
              <button
                onClick={onClose}
                className={`p-2 rounded-lg transition-colors ${
                  theme === 'dark' ? 'hover:bg-zinc-800 text-zinc-400' : 'hover:bg-zinc-100 text-[#444444]'
                }`}
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Content */}
            <div className="p-6">
              {status === 'success' ? (
                <div className="py-8 text-center space-y-4">
                  <div className="w-16 h-16 bg-emerald-500/10 rounded-full flex items-center justify-center mx-auto">
                    <CheckCircle2 className="w-8 h-8 text-emerald-500" />
                  </div>
                  <div className="space-y-2">
                    <h3 className={`text-xl font-bold tracking-[0.05em] ${theme === 'dark' ? 'text-white' : 'text-[#222222]'}`}>MESSAGE SENT</h3>
                    <p className={`text-sm ${theme === 'dark' ? 'text-zinc-500' : 'text-[#444444]'}`}>We will review your message and get back to you soon.</p>
                  </div>
                  <button
                    onClick={onClose}
                    className="w-full py-3 bg-emerald-500 hover:bg-emerald-400 text-zinc-950 rounded-xl font-bold tracking-[0.05em] transition-colors shadow-[0_2px_4px_rgba(0,0,0,0.05)]"
                  >
                    CLOSE
                  </button>
                </div>
              ) : (
                <form onSubmit={handleSubmit} className="space-y-5">
                  <div className="space-y-1.5">
                    <label className={`text-xs font-bold uppercase tracking-[0.05em] ml-1 ${theme === 'dark' ? 'text-zinc-500' : 'text-[#222222]'}`}>Inquiry Type</label>
                    <div className="relative">
                      <select
                        required
                        name="inquiryType"
                        className={`w-full px-4 py-3 rounded-xl border outline-none transition-all appearance-none ${
                          theme === 'dark' 
                            ? 'bg-zinc-950 border-zinc-800 focus:border-emerald-500/50 text-white' 
                            : 'bg-white border-[#E0E0E0] focus:border-emerald-500/50 text-[#444444] shadow-[0_2px_4px_rgba(0,0,0,0.05)]'
                        }`}
                        defaultValue=""
                      >
                        <option value="" disabled>Select inquiry type</option>
                        <option value="Service Inquiry">Service Inquiry</option>
                        <option value="Bug Report">Bug Report</option>
                        <option value="Business Partnership">Business Partnership</option>
                        <option value="Feedback/Support">Feedback/Support</option>
                      </select>
                      <ChevronDown className={`absolute right-4 top-1/2 -translate-y-1/2 w-4 h-4 pointer-events-none ${theme === 'dark' ? 'text-zinc-500' : 'text-[#444444]'}`} />
                    </div>
                  </div>

                  <div className="space-y-1.5">
                    <label className={`text-xs font-bold uppercase tracking-[0.05em] ml-1 ${theme === 'dark' ? 'text-zinc-500' : 'text-[#222222]'}`}>Name / Organization</label>
                    <input
                      required
                      name="name"
                      type="text"
                      placeholder="John Doe / Acme Corp"
                      className={`w-full px-4 py-3 rounded-xl border outline-none transition-all ${
                        theme === 'dark' 
                          ? 'bg-zinc-950 border-zinc-800 focus:border-emerald-500/50 text-white' 
                          : 'bg-white border-[#E0E0E0] focus:border-emerald-500/50 text-[#444444] shadow-[0_2px_4px_rgba(0,0,0,0.05)]'
                      }`}
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className={`text-xs font-bold uppercase tracking-[0.05em] ml-1 ${theme === 'dark' ? 'text-zinc-500' : 'text-[#222222]'}`}>Contact (Email/Phone)</label>
                    <input
                      required
                      name="email"
                      type="text"
                      placeholder="example@email.com"
                      className={`w-full px-4 py-3 rounded-xl border outline-none transition-all ${
                        theme === 'dark' 
                          ? 'bg-zinc-950 border-zinc-800 focus:border-emerald-500/50 text-white' 
                          : 'bg-white border-[#E0E0E0] focus:border-emerald-500/50 text-[#444444] shadow-[0_2px_4px_rgba(0,0,0,0.05)]'
                      }`}
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className={`text-xs font-bold uppercase tracking-[0.05em] ml-1 ${theme === 'dark' ? 'text-zinc-500' : 'text-[#222222]'}`}>Message</label>
                    <textarea
                      required
                      name="message"
                      rows={4}
                      placeholder="Please enter your message or inquiry here."
                      className={`w-full px-4 py-3 rounded-xl border outline-none transition-all resize-none ${
                        theme === 'dark' 
                          ? 'bg-zinc-950 border-zinc-800 focus:border-emerald-500/50 text-white' 
                          : 'bg-white border-[#E0E0E0] focus:border-emerald-500/50 text-[#444444] shadow-[0_2px_4px_rgba(0,0,0,0.05)]'
                      }`}
                    />
                  </div>

                  {status === 'error' && (
                    <p className="text-xs text-red-500 text-center font-bold tracking-wide">An error occurred. Please try again later.</p>
                  )}

                  <button
                    type="submit"
                    disabled={status === 'submitting'}
                    className={`w-full py-4 bg-emerald-500 hover:bg-emerald-400 disabled:bg-emerald-500/50 text-zinc-950 rounded-xl font-bold tracking-[0.05em] transition-all flex items-center justify-center gap-2 shadow-[0_2px_4px_rgba(0,0,0,0.05)]`}
                  >
                    {status === 'submitting' ? (
                      <div className="w-5 h-5 border-2 border-zinc-950/30 border-t-zinc-950 rounded-full animate-spin" />
                    ) : (
                      <>
                        <Send className="w-4 h-4" />
                        SEND MESSAGE
                      </>
                    )}
                  </button>
                </form>
              )}
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
