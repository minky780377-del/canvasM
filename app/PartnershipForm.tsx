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
            className={`relative w-[90vw] max-w-[280px] sm:max-w-[340px] md:max-w-md overflow-hidden rounded-2xl md:rounded-3xl border ${
              theme === 'dark' 
                ? 'bg-zinc-900 border-zinc-800 shadow-2xl shadow-emerald-500/10' 
                : 'bg-white border-[#E0E0E0] shadow-[0_2px_4px_rgba(0,0,0,0.05)]'
            }`}
          >
            {/* Header */}
            <div className={`flex items-center justify-between p-3 sm:p-4 md:p-6 border-b ${theme === 'dark' ? 'border-zinc-800' : 'border-[#E0E0E0]'}`}>
              <div className="flex items-center gap-2 md:gap-3">
                <div className="w-7 h-7 sm:w-8 sm:h-8 md:w-10 md:h-10 rounded-lg md:rounded-xl bg-emerald-500/10 flex items-center justify-center">
                  <Mail className="w-3.5 h-3.5 sm:w-4 sm:h-4 md:w-5 md:h-5 text-emerald-500" />
                </div>
                <div>
                  <h2 className={`text-sm sm:text-base md:text-lg font-bold tracking-[0.05em] ${theme === 'dark' ? 'text-white' : 'text-[#222222]'}`}>CONTACT DEVELOPER</h2>
                  <p className={`text-[9px] sm:text-[10px] md:text-xs ${theme === 'dark' ? 'text-zinc-500' : 'text-[#444444]'}`}>Send an inquiry or feedback</p>
                </div>
              </div>
              <button
                onClick={onClose}
                className={`p-1.5 md:p-2 rounded-lg transition-colors ${
                  theme === 'dark' ? 'hover:bg-zinc-800 text-zinc-400' : 'hover:bg-zinc-100 text-[#444444]'
                }`}
              >
                <X className="w-4 h-4 md:w-5 md:h-5" />
              </button>
            </div>

            {/* Content */}
            <div className="p-3 sm:p-4 md:p-6">
              {status === 'success' ? (
                <div className="py-4 sm:py-6 md:py-8 text-center space-y-3 md:space-y-4">
                  <div className="w-10 h-10 sm:w-12 sm:h-12 md:w-16 md:h-16 bg-emerald-500/10 rounded-full flex items-center justify-center mx-auto">
                    <CheckCircle2 className="w-5 h-5 sm:w-6 sm:h-6 md:w-8 md:h-8 text-emerald-500" />
                  </div>
                  <div className="space-y-1 md:space-y-2">
                    <h3 className={`text-base sm:text-lg md:text-xl font-bold tracking-[0.05em] ${theme === 'dark' ? 'text-white' : 'text-[#222222]'}`}>MESSAGE SENT</h3>
                    <p className={`text-[10px] sm:text-xs md:text-sm ${theme === 'dark' ? 'text-zinc-500' : 'text-[#444444]'}`}>We will review your message and get back to you soon.</p>
                  </div>
                  <button
                    onClick={onClose}
                    className="w-full py-2 sm:py-2.5 md:py-3 text-[11px] sm:text-xs md:text-sm bg-emerald-500 hover:bg-emerald-400 text-zinc-950 rounded-lg md:rounded-xl font-bold tracking-[0.05em] transition-colors shadow-[0_2px_4px_rgba(0,0,0,0.05)]"
                  >
                    CLOSE
                  </button>
                </div>
              ) : (
                <form onSubmit={handleSubmit} className="space-y-3 sm:space-y-4 md:space-y-5">
                  <div className="space-y-1 md:space-y-1.5">
                    <label className={`text-[9px] sm:text-[10px] md:text-xs font-bold uppercase tracking-[0.05em] ml-1 ${theme === 'dark' ? 'text-zinc-500' : 'text-[#222222]'}`}>Inquiry Type</label>
                    <div className="relative">
                      <select
                        required
                        name="inquiryType"
                        className={`w-full px-2.5 py-2 sm:px-3 sm:py-2.5 md:px-4 md:py-3 text-[11px] sm:text-xs md:text-sm rounded-lg md:rounded-xl border outline-none transition-all appearance-none ${
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
                      <ChevronDown className={`absolute right-3 md:right-4 top-1/2 -translate-y-1/2 w-3 h-3 md:w-4 md:h-4 pointer-events-none ${theme === 'dark' ? 'text-zinc-500' : 'text-[#444444]'}`} />
                    </div>
                  </div>

                  <div className="space-y-1 md:space-y-1.5">
                    <label className={`text-[9px] sm:text-[10px] md:text-xs font-bold uppercase tracking-[0.05em] ml-1 ${theme === 'dark' ? 'text-zinc-500' : 'text-[#222222]'}`}>Name / Organization</label>
                    <input
                      required
                      name="name"
                      type="text"
                      placeholder="John Doe / Acme Corp"
                      className={`w-full px-2.5 py-2 sm:px-3 sm:py-2.5 md:px-4 md:py-3 text-[11px] sm:text-xs md:text-sm rounded-lg md:rounded-xl border outline-none transition-all ${
                        theme === 'dark' 
                          ? 'bg-zinc-950 border-zinc-800 focus:border-emerald-500/50 text-white' 
                          : 'bg-white border-[#E0E0E0] focus:border-emerald-500/50 text-[#444444] shadow-[0_2px_4px_rgba(0,0,0,0.05)]'
                      }`}
                    />
                  </div>

                  <div className="space-y-1 md:space-y-1.5">
                    <label className={`text-[9px] sm:text-[10px] md:text-xs font-bold uppercase tracking-[0.05em] ml-1 ${theme === 'dark' ? 'text-zinc-500' : 'text-[#222222]'}`}>Contact (Email/Phone)</label>
                    <input
                      required
                      name="email"
                      type="text"
                      placeholder="example@email.com"
                      className={`w-full px-2.5 py-2 sm:px-3 sm:py-2.5 md:px-4 md:py-3 text-[11px] sm:text-xs md:text-sm rounded-lg md:rounded-xl border outline-none transition-all ${
                        theme === 'dark' 
                          ? 'bg-zinc-950 border-zinc-800 focus:border-emerald-500/50 text-white' 
                          : 'bg-white border-[#E0E0E0] focus:border-emerald-500/50 text-[#444444] shadow-[0_2px_4px_rgba(0,0,0,0.05)]'
                      }`}
                    />
                  </div>

                  <div className="space-y-1 md:space-y-1.5">
                    <label className={`text-[9px] sm:text-[10px] md:text-xs font-bold uppercase tracking-[0.05em] ml-1 ${theme === 'dark' ? 'text-zinc-500' : 'text-[#222222]'}`}>Message</label>
                    <textarea
                      required
                      name="message"
                      rows={3}
                      placeholder="Please enter your message or inquiry here."
                      className={`w-full px-2.5 py-2 sm:px-3 sm:py-2.5 md:px-4 md:py-3 text-[11px] sm:text-xs md:text-sm rounded-lg md:rounded-xl border outline-none transition-all resize-none md:rows-4 ${
                        theme === 'dark' 
                          ? 'bg-zinc-950 border-zinc-800 focus:border-emerald-500/50 text-white' 
                          : 'bg-white border-[#E0E0E0] focus:border-emerald-500/50 text-[#444444] shadow-[0_2px_4px_rgba(0,0,0,0.05)]'
                      }`}
                    />
                  </div>

                  {status === 'error' && (
                    <p className="text-[9px] sm:text-[10px] md:text-xs text-red-500 text-center font-bold tracking-wide">An error occurred. Please try again later.</p>
                  )}

                  <button
                    type="submit"
                    disabled={status === 'submitting'}
                    className={`w-full py-2.5 sm:py-3 md:py-4 text-[11px] sm:text-xs md:text-sm bg-emerald-500 hover:bg-emerald-400 disabled:bg-emerald-500/50 text-zinc-950 rounded-lg md:rounded-xl font-bold tracking-[0.05em] transition-all flex items-center justify-center gap-1.5 md:gap-2 shadow-[0_2px_4px_rgba(0,0,0,0.05)]`}
                  >
                    {status === 'submitting' ? (
                      <div className="w-4 h-4 md:w-5 md:h-5 border-2 border-zinc-950/30 border-t-zinc-950 rounded-full animate-spin" />
                    ) : (
                      <>
                        <Send className="w-3 h-3 md:w-4 md:h-4" />
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
