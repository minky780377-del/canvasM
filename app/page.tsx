'use client';

import React, { useState } from 'react';
import { Volume2, Bell, Mail, Youtube, MapPin, Search, Calendar, Newspaper, Image as ImageIcon, Video, Languages, FileSpreadsheet, FileText, User, Triangle, Store, Sparkles, Sun, Moon } from 'lucide-react';
import Link from 'next/link';

const Logo = ({ className }: { className?: string }) => (
  <div className={className}>
    <svg viewBox="0 0 100 100" className="w-full h-full" fill="none" xmlns="http://www.w3.org/2000/svg">
      <rect x="8" y="8" width="84" height="84" stroke="currentColor" strokeWidth="6" />
      <path d="M8 92L38 45L52 68L78 32L92 92H8Z" fill="currentColor" />
    </svg>
  </div>
);

interface AppIconProps {
  icon: React.ReactNode;
  label: string;
  href?: string;
  color?: string;
  bgColor?: string;
  isComingSoon?: boolean;
  theme: 'light' | 'dark';
}

const AppIcon = ({ icon, label, href, color, bgColor, isComingSoon, theme }: AppIconProps) => {
  const content = (
    <div className="flex flex-col items-center gap-2 group cursor-pointer">
      <div className={`
        w-16 h-16 sm:w-20 sm:h-20 rounded-2xl flex items-center justify-center transition-all duration-300 
        ${theme === 'dark' 
          ? 'bg-zinc-800 border-zinc-700 hover:bg-zinc-700 hover:border-emerald-500/40 shadow-[0_10px_30px_rgba(0,0,0,0.3)]' 
          : `${bgColor || 'bg-white'} shadow-[0_12px_30px_rgba(0,0,0,0.12)] border-zinc-200 hover:shadow-2xl hover:border-emerald-500/30`} 
        ${href ? 'hover:-translate-y-1.5 active:scale-95' : 'opacity-50'} 
        border-2
      `}>
        <div className={color || (theme === 'dark' ? 'text-zinc-300' : 'text-zinc-600')}>
          {React.cloneElement(icon as React.ReactElement<any>, { size: 32 })}
        </div>
      </div>
      <span className={`
        text-[10px] sm:text-[11px] font-black uppercase tracking-[0.15em] transition-colors text-center px-1 truncate w-full font-display
        ${theme === 'dark' ? 'text-white drop-shadow-sm group-hover:text-emerald-400' : 'text-zinc-900 group-hover:text-emerald-600'}
      `}>
        {label}
      </span>
      {isComingSoon && (
        <span className="absolute -top-1 -right-1 bg-zinc-200 text-zinc-500 text-[8px] px-1.5 py-0.5 rounded-full font-bold">SOON</span>
      )}
    </div>
  );

  if (href) {
    const isExternal = href.startsWith('http');
    return (
      <Link 
        href={href} 
        target={isExternal ? "_blank" : undefined}
        rel={isExternal ? "noopener noreferrer" : undefined}
      >
        {content}
      </Link>
    );
  }

  return <div className="relative">{content}</div>;
};

export default function LauncherPage() {
  const [theme, setTheme] = useState<'light' | 'dark'>('light');

  return (
    <div className={`min-h-screen transition-colors duration-500 ${theme === 'dark' ? 'bg-zinc-950' : 'bg-[#F8F9FA]'} p-6 sm:p-12`}>
      <div className="max-w-xl mx-auto space-y-12">
        {/* Header */}
        <header className="flex flex-col items-center gap-6">
          <div className="flex items-start gap-4">
            <div className={`w-14 h-14 sm:w-16 sm:h-16 rounded-2xl flex items-center justify-center p-2.5 sm:p-3 ${theme === 'dark' ? 'bg-zinc-900 text-emerald-400 border-zinc-800' : 'bg-white text-emerald-500 shadow-[0_4px_12px_rgba(0,0,0,0.05)] border-[#E0E0E0]'} border`}>
              <Logo className="w-full h-full" />
            </div>
            <div className="flex flex-col pt-[13px] sm:pt-[15px]">
              <h1 className={`text-2xl sm:text-4xl font-extrabold tracking-[0.05em] sm:tracking-[0.1em] font-display uppercase leading-none ${theme === 'dark' ? 'text-white' : 'text-zinc-900'}`}>
                canvasM <span className="text-emerald-500/80">HUB</span>
              </h1>
              <p className="text-[10px] text-zinc-500 font-mono uppercase tracking-[0.2em] mt-1">Central Hub Launcher</p>
            </div>
          </div>
          
          <button
            onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
            className={`p-3 rounded-xl transition-all ${theme === 'dark' ? 'bg-zinc-900 text-zinc-400 hover:text-zinc-200 border border-zinc-800' : 'bg-white text-zinc-500 hover:text-zinc-800 shadow-md border border-zinc-200'}`}
          >
            {theme === 'dark' ? <Sun size={20} /> : <Moon size={20} />}
          </button>
        </header>

        {/* App Grid */}
        <div className={`grid grid-cols-3 sm:grid-cols-3 gap-y-12 gap-x-4 sm:gap-x-8 p-8 sm:p-12 rounded-[40px] ${theme === 'dark' ? 'bg-zinc-900/50 border-zinc-800' : 'bg-white/90 border-white shadow-2xl backdrop-blur-md'} border`}>
          {/* Main Apps */}
          <AppIcon 
            icon={<Volume2 />} 
            label="TTS 스튜디오" 
            href="/tts" 
            color="text-emerald-500" 
            bgColor="bg-emerald-50"
            theme={theme}
          />
          <AppIcon 
            icon={<Bell />} 
            label="AI 알람" 
            href="/alarm" 
            color="text-amber-500" 
            bgColor="bg-amber-50"
            theme={theme}
          />
          <AppIcon 
            icon={<Sparkles />} 
            label="Gemini" 
            href="https://gemini.google.com"
            color="text-indigo-500" 
            bgColor="bg-indigo-50"
            theme={theme}
          />

          {/* Secondary Apps */}
          <AppIcon 
            icon={<Mail />} 
            label="Gmail" 
            href="https://mail.google.com"
            color="text-red-500" 
            theme={theme}
          />
          <AppIcon 
            icon={<Youtube />} 
            label="YouTube" 
            href="https://youtube.com"
            color="text-red-600" 
            theme={theme}
          />
          <AppIcon 
            icon={<MapPin />} 
            label="지도" 
            href="https://maps.google.com"
            color="text-emerald-600" 
            theme={theme}
          />

          <AppIcon 
            icon={<Search />} 
            label="검색" 
            href="https://google.com"
            color="text-blue-500" 
            theme={theme}
          />
          <AppIcon 
            icon={<Calendar />} 
            label="달력" 
            href="https://calendar.google.com"
            color="text-blue-600" 
            theme={theme}
          />
          <AppIcon 
            icon={<Newspaper />} 
            label="뉴스" 
            href="https://news.google.com"
            color="text-zinc-700" 
            theme={theme}
          />

          <div className={`col-span-3 h-px ${theme === 'dark' ? 'bg-zinc-800' : 'bg-zinc-100'} my-2`} />

          <AppIcon 
            icon={<ImageIcon />} 
            label="사진" 
            href="https://photos.google.com"
            color="text-amber-400" 
            theme={theme}
          />
          <AppIcon 
            icon={<Video />} 
            label="Meet" 
            href="https://meet.google.com"
            color="text-emerald-500" 
            theme={theme}
          />
          <AppIcon 
            icon={<Languages />} 
            label="번역" 
            href="https://translate.google.com"
            color="text-blue-500" 
            theme={theme}
          />

          <AppIcon 
            icon={<FileSpreadsheet />} 
            label="Sheets" 
            href="https://docs.google.com/spreadsheets"
            color="text-emerald-600" 
            theme={theme}
          />
          <AppIcon 
            icon={<FileText />} 
            label="Docs" 
            href="https://docs.google.com/document"
            color="text-blue-600" 
            theme={theme}
          />
          <AppIcon 
            icon={<Store />} 
            label="비즈니스" 
            href="https://business.google.com"
            color="text-blue-700" 
            theme={theme}
          />
        </div>

        {/* Footer */}
        <footer className="text-center">
          <p className="text-[10px] font-mono text-zinc-400 uppercase tracking-widest">
            © 2026 canvasM Ecosystem
          </p>
        </footer>
      </div>
    </div>
  );
}
