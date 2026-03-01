'use client';

import React from 'react';

interface AdBannerProps {
  theme: 'dark' | 'light';
  label?: string;
}

export default function AdBanner({ theme, label = "Advertisement" }: AdBannerProps) {
  return (
    <div className="w-full max-w-4xl mx-auto px-6 py-4">
      <div className={`relative w-full h-[100px] sm:h-[120px] rounded-2xl border border-dashed flex flex-col items-center justify-center transition-all overflow-hidden ${
        theme === 'dark' 
          ? 'bg-zinc-900/30 border-zinc-800 text-zinc-600' 
          : 'bg-zinc-100/50 border-zinc-200 text-zinc-400'
      }`}>
        {/* Placeholder Content */}
        <div className="absolute top-2 left-3 text-[8px] font-bold uppercase tracking-[0.2em] opacity-50">
          {label}
        </div>
        
        <div className="flex flex-col items-center gap-1">
          <div className={`text-[10px] font-bold uppercase tracking-widest ${theme === 'dark' ? 'text-zinc-700' : 'text-zinc-300'}`}>
            AdSense Banner Area
          </div>
          <div className={`text-[8px] italic ${theme === 'dark' ? 'text-zinc-800' : 'text-zinc-200'}`}>
            (Replace this with your AdSense code)
          </div>
        </div>

        {/* Decorative elements to make it look like a real ad slot */}
        <div className={`absolute bottom-0 right-0 w-16 h-16 border-t border-l border-dashed rounded-tl-2xl opacity-20 ${theme === 'dark' ? 'border-zinc-700' : 'border-zinc-300'}`} />
      </div>
    </div>
  );
}
