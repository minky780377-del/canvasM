'use client';

import React, { useState, useEffect, useRef } from 'react';
import { 
  Volume2, Bell, Mail, Youtube, MapPin, Search, Calendar, Newspaper, 
  Image as ImageIcon, Video, Languages, FileSpreadsheet, FileText, 
  User, Triangle, Store, Sparkles, Sun, Moon, Subtitles, Phone, 
  MessageCircle, Plus, Trash2, X, ExternalLink, GripVertical, ZoomIn
} from 'lucide-react';
import Link from 'next/link';
import { motion, AnimatePresence, Reorder, useDragControls } from 'motion/react';

const Logo = ({ className }: { className?: string }) => (
  <div className={className}>
    <svg viewBox="0 0 100 100" className="w-full h-full" fill="none" xmlns="http://www.w3.org/2000/svg">
      <rect x="8" y="8" width="84" height="84" stroke="currentColor" strokeWidth="6" />
      <path d="M8 92L38 45L52 68L78 32L92 92H8Z" fill="currentColor" />
    </svg>
  </div>
);

const ICON_MAP: Record<string, React.ReactNode> = {
  Volume2: <Volume2 />,
  Bell: <Bell />,
  Subtitles: <Subtitles />,
  Sparkles: <Sparkles />,
  Phone: <Phone />,
  MessageCircle: <MessageCircle />,
  Mail: <Mail />,
  Youtube: <Youtube />,
  MapPin: <MapPin />,
  Search: <Search />,
  Calendar: <Calendar />,
  Newspaper: <Newspaper />,
  ImageIcon: <ImageIcon />,
  Video: <Video />,
  Languages: <Languages />,
  FileSpreadsheet: <FileSpreadsheet />,
  FileText: <FileText />,
  Store: <Store />,
  Plus: <Plus />,
  Trash2: <Trash2 />,
  X: <X />,
  ZoomIn: <ZoomIn />
};

interface AppData {
  id: string;
  icon: string;
  label: string;
  href: string;
  color: string;
  bgColor?: string;
  isProtected?: boolean;
}

const INITIAL_APPS: AppData[] = [
  { id: 'tts', icon: 'Volume2', label: 'TTS 스튜디오', href: '/tts', color: 'text-emerald-500', bgColor: 'bg-emerald-50', isProtected: true },
  { id: 'alarm', icon: 'Bell', label: 'AI 알람', href: '/alarm', color: 'text-amber-500', bgColor: 'bg-amber-50', isProtected: true },
  { id: 'vision', icon: 'ZoomIn', label: 'Vision 스튜디오', href: '/vision', color: 'text-blue-500', bgColor: 'bg-blue-50', isProtected: true },
  { id: 'srt', icon: 'Subtitles', label: 'SRT 스튜디오', href: '/srt', color: 'text-rose-500', bgColor: 'bg-rose-50', isProtected: true },
  { id: 'gemini', icon: 'Sparkles', label: 'Gemini', href: 'https://gemini.google.com', color: 'text-indigo-500', bgColor: 'bg-indigo-50' },
  { id: 'call', icon: 'Phone', label: '전화 걸기', href: 'tel:010-0000-0000', color: 'text-emerald-500', bgColor: 'bg-emerald-50' },
  { id: 'kakao', icon: 'MessageCircle', label: '카카오톡', href: 'intent:#Intent;action=android.intent.action.MAIN;category=android.intent.category.LAUNCHER;package=com.kakao.talk;end', color: 'text-[#3A1D1D]', bgColor: 'bg-[#FEE500]' },
  { id: 'gmail', icon: 'Mail', label: 'Gmail', href: 'https://mail.google.com', color: 'text-red-500' },
  { id: 'youtube', icon: 'Youtube', label: 'YouTube', href: 'https://youtube.com', color: 'text-red-600' },
  { id: 'maps', icon: 'MapPin', label: '지도', href: 'https://maps.google.com', color: 'text-emerald-600' },
  { id: 'search', icon: 'Search', label: '검색', href: 'https://google.com', color: 'text-blue-500' },
  { id: 'calendar', icon: 'Calendar', label: '달력', href: 'https://calendar.google.com', color: 'text-blue-600' },
  { id: 'news', icon: 'Newspaper', label: '뉴스', href: 'https://news.google.com', color: 'text-zinc-700' },
  { id: 'photos', icon: 'ImageIcon', label: '사진', href: 'https://photos.google.com', color: 'text-amber-400' },
  { id: 'meet', icon: 'Video', label: 'Meet', href: 'https://meet.google.com', color: 'text-emerald-500' },
  { id: 'translate', icon: 'Languages', label: '번역', href: 'https://translate.google.com', color: 'text-blue-500' },
  { id: 'sheets', icon: 'FileSpreadsheet', label: 'Sheets', href: 'https://docs.google.com/spreadsheets', color: 'text-emerald-600' },
  { id: 'docs', icon: 'FileText', label: 'Docs', href: 'https://docs.google.com/document', color: 'text-blue-600' },
  { id: 'business', icon: 'Store', label: '비즈니스', href: 'https://business.google.com', color: 'text-blue-700' },
];

interface AppIconProps {
  app: AppData;
  theme: 'light' | 'dark';
  isEditing: boolean;
  onDelete?: (id: string) => void;
  onDragStart?: () => void;
  onDragEnd?: (info: any) => void;
}

const AppIcon = ({ app, theme, isEditing, onDelete, onDragStart, onDragEnd }: AppIconProps) => {
  const controls = useDragControls();
  const longPressTimer = useRef<NodeJS.Timeout | null>(null);

  const handlePointerDown = (e: React.PointerEvent) => {
    if (isEditing) return;
    // Start a timer for long press
    longPressTimer.current = setTimeout(() => {
      onDragStart?.(); // This will trigger isEditing in the parent
    }, 500);
  };

  const handlePointerUp = () => {
    if (longPressTimer.current) {
      clearTimeout(longPressTimer.current);
    }
  };

  const handlePointerMove = () => {
    // If they move too much, it's a scroll, not a long press
    if (longPressTimer.current) {
      clearTimeout(longPressTimer.current);
    }
  };

  const handleContextMenu = (e: React.MouseEvent) => {
    e.preventDefault();
  };

  const content = (
    <motion.div 
      className="flex flex-col items-center gap-2 group cursor-pointer relative select-none"
      animate={isEditing && !app.isProtected ? { 
        rotate: [0, -1, 1, -1, 0],
        x: [0, -1, 1, -1, 0]
      } : {}}
      transition={isEditing && !app.isProtected ? { 
        repeat: Infinity, 
        duration: 0.4,
        ease: "easeInOut"
      } : {}}
      onContextMenu={handleContextMenu}
    >
      <div className={`
        w-16 h-16 sm:w-20 sm:h-20 rounded-2xl flex items-center justify-center transition-all duration-300 
        ${theme === 'dark' 
          ? 'bg-zinc-800 border-zinc-700 hover:bg-zinc-700 hover:border-emerald-500/40 shadow-[0_10px_30px_rgba(0,0,0,0.3)]' 
          : `${app.bgColor || 'bg-white'} shadow-[0_12px_30px_rgba(0,0,0,0.12)] border-zinc-200 hover:shadow-2xl hover:border-emerald-500/30`} 
        ${app.href ? 'hover:-translate-y-1.5 active:scale-95' : 'opacity-50'} 
        border-2 relative
      `}>
        <div className={app.color || (theme === 'dark' ? 'text-zinc-300' : 'text-zinc-600')}>
          {React.cloneElement((ICON_MAP[app.icon] || <Sparkles />) as React.ReactElement<any>, { size: 32 })}
        </div>
        
        {isEditing && !app.isProtected && (
          <button
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              onDelete?.(app.id);
            }}
            className="absolute -top-2 -right-2 w-6 h-6 bg-red-500 text-white rounded-full flex items-center justify-center shadow-lg hover:bg-red-600 transition-colors z-10"
          >
            <X size={14} strokeWidth={3} />
          </button>
        )}

        {isEditing && (
          <div className="absolute bottom-1 right-1 text-zinc-400 opacity-50">
            <GripVertical size={14} />
          </div>
        )}
      </div>
      <span className={`
        text-[10px] sm:text-[11px] font-black uppercase tracking-[0.15em] transition-colors text-center px-1 truncate w-full font-display
        ${theme === 'dark' ? 'text-white drop-shadow-sm group-hover:text-emerald-400' : 'text-zinc-900 group-hover:text-emerald-600'}
      `}>
        {app.label}
      </span>
    </motion.div>
  );

  if (app.href && !isEditing) {
    const isInternal = app.href.startsWith('/');
    const isExternal = app.href.startsWith('http');
    
    if (isInternal) {
      return (
        <Link 
          href={app.href} 
          onPointerDown={handlePointerDown}
          onPointerUp={handlePointerUp}
          onPointerMove={handlePointerMove}
          onContextMenu={handleContextMenu}
        >
          {content}
        </Link>
      );
    }

    return (
      <a 
        href={app.href} 
        target={isExternal ? "_blank" : undefined}
        rel={isExternal ? "noopener noreferrer" : undefined}
        onPointerDown={handlePointerDown}
        onPointerUp={handlePointerUp}
        onPointerMove={handlePointerMove}
        onContextMenu={handleContextMenu}
      >
        {content}
      </a>
    );
  }

  return (
    <div 
      className="relative select-none"
      onPointerDown={handlePointerDown}
      onPointerUp={handlePointerUp}
      onPointerMove={handlePointerMove}
      onContextMenu={handleContextMenu}
    >
      {content}
    </div>
  );
};

export default function LauncherPage() {
  const [theme, setTheme] = useState<'light' | 'dark'>('light');
  const [apps, setApps] = useState<AppData[]>([]);
  const [isEditing, setIsEditing] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const [showAddModal, setShowAddModal] = useState(false);
  const [newApp, setNewApp] = useState({ label: '', href: '' });
  const trashRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const savedApps = localStorage.getItem('launcher_apps');
    if (savedApps) {
      let parsedApps = JSON.parse(savedApps);
      // Migration: Update KakaoTalk URL to app scheme if it's the old one
      parsedApps = parsedApps.map((app: AppData) => {
        const targetIntent = 'intent:#Intent;action=android.intent.action.MAIN;category=android.intent.category.LAUNCHER;package=com.kakao.talk;end';
        if (app.id === 'kakao' && (app.href === 'https://pf.kakao.com' || app.href === 'kakaotalk://' || app.href.includes('com.kakao.talk'))) {
          return { ...app, href: targetIntent };
        }
        return app;
      });
      setApps(parsedApps);
    } else {
      setApps(INITIAL_APPS);
    }
  }, []);

  const saveApps = (newApps: AppData[]) => {
    setApps(newApps);
    localStorage.setItem('launcher_apps', JSON.stringify(newApps));
  };

  const handleReorder = (newOrder: AppData[]) => {
    // Ensure protected apps stay at the front and cannot be moved
    const protectedApps = INITIAL_APPS.filter(a => a.isProtected);
    const otherApps = newOrder.filter(a => !a.isProtected);
    
    // Maintain the original order of protected apps just in case
    const finalOrder = [...protectedApps, ...otherApps];
    saveApps(finalOrder);
  };

  const deleteApp = (id: string) => {
    const newApps = apps.filter(app => app.id !== id || app.isProtected);
    saveApps(newApps);
  };

  const addApp = () => {
    if (!newApp.label || !newApp.href) return;
    const app: AppData = {
      id: Math.random().toString(36).substr(2, 9),
      icon: 'ExternalLink',
      label: newApp.label,
      href: newApp.href.startsWith('http') ? newApp.href : `https://${newApp.href}`,
      color: 'text-zinc-600'
    };
    saveApps([...apps, app]);
    setNewApp({ label: '', href: '' });
    setShowAddModal(false);
  };

  const handleDragEnd = (event: any, info: any, app: AppData) => {
    setIsDragging(false);
    if (app.isProtected) return;

    if (trashRef.current) {
      const trashRect = trashRef.current.getBoundingClientRect();
      const { x, y } = info.point;
      if (
        x >= trashRect.left &&
        x <= trashRect.right &&
        y >= trashRect.top &&
        y <= trashRect.bottom
      ) {
        deleteApp(app.id);
      }
    }
  };

  return (
    <div className={`min-h-screen transition-colors duration-500 ${theme === 'dark' ? 'bg-zinc-950' : 'bg-[#F8F9FA]'} p-6 sm:p-12 overflow-x-hidden`}>
      <div className="max-w-xl mx-auto space-y-12">
        {/* Header */}
        <header className="flex flex-col items-center gap-6">
          <div className="flex items-start gap-4">
            <div className={`w-14 h-14 sm:w-16 sm:h-16 rounded-2xl flex items-center justify-center p-2.5 sm:p-3 ${theme === 'dark' ? 'bg-zinc-900 text-emerald-400 border-zinc-800' : 'bg-white text-emerald-500 shadow-[0_4px_12_rgba(0,0,0,0.05)] border-[#E0E0E0]'} border`}>
              <Logo className="w-full h-full" />
            </div>
            <div className="flex flex-col pt-[13px] sm:pt-[15px]">
              <h1 className={`text-2xl sm:text-4xl font-extrabold tracking-[0.05em] sm:tracking-[0.1em] font-display uppercase leading-none ${theme === 'dark' ? 'text-white' : 'text-zinc-900'}`}>
                canvasM <span className="text-emerald-500/80">HUB</span>
              </h1>
              <p className="text-[10px] text-zinc-500 font-mono uppercase tracking-[0.2em] mt-1">Central Hub Launcher</p>
            </div>
          </div>
          
          <div className="flex items-center gap-3">
            <button
              onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
              className={`p-3 rounded-xl transition-all ${theme === 'dark' ? 'bg-zinc-900 text-zinc-400 hover:text-zinc-200 border border-zinc-800' : 'bg-white text-zinc-500 hover:text-zinc-800 shadow-md border border-zinc-200'}`}
              title="테마 변경"
            >
              {theme === 'dark' ? <Sun size={20} /> : <Moon size={20} />}
            </button>
            <button
              onClick={() => setIsEditing(!isEditing)}
              className={`px-4 py-2 rounded-xl font-bold text-xs uppercase tracking-widest transition-all ${
                isEditing 
                  ? 'bg-emerald-500 text-white shadow-lg shadow-emerald-500/30' 
                  : theme === 'dark' ? 'bg-zinc-900 text-zinc-400 border border-zinc-800' : 'bg-white text-zinc-500 border border-zinc-200'
              }`}
            >
              {isEditing ? '완료' : '편집'}
            </button>
          </div>
        </header>

        {/* App Grid */}
        <div className={`relative rounded-[40px] ${theme === 'dark' ? 'bg-zinc-900/50 border-zinc-800' : 'bg-white/90 border-white shadow-2xl backdrop-blur-md'} border p-8 sm:p-12`}>
          <Reorder.Group 
            axis="y" 
            values={apps} 
            onReorder={handleReorder}
            className="grid grid-cols-3 gap-y-12 gap-x-4 sm:gap-x-8"
          >
            {apps.map((app) => (
              <Reorder.Item 
                key={app.id} 
                value={app}
                dragListener={isEditing && !app.isProtected}
                onDragStart={() => setIsDragging(true)}
                onDragEnd={(e, info) => handleDragEnd(e, info, app)}
                className={`touch-none ${app.isProtected ? 'cursor-default' : 'cursor-grab active:cursor-grabbing'}`}
              >
                <AppIcon 
                  app={app} 
                  theme={theme} 
                  isEditing={isEditing}
                  onDelete={deleteApp}
                  onDragStart={() => setIsEditing(true)}
                />
              </Reorder.Item>
            ))}
            
            {isEditing && (
              <motion.div 
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                className="flex flex-col items-center gap-2 group cursor-pointer"
                onClick={() => setShowAddModal(true)}
              >
                <div className={`
                  w-16 h-16 sm:w-20 sm:h-20 rounded-2xl flex items-center justify-center transition-all duration-300 
                  ${theme === 'dark' 
                    ? 'bg-zinc-800 border-zinc-700 text-zinc-500 border-dashed' 
                    : 'bg-zinc-50 border-zinc-200 text-zinc-400 border-dashed'} 
                  border-2 hover:border-emerald-500/50 hover:text-emerald-500
                `}>
                  <Plus size={32} />
                </div>
                <span className={`text-[10px] sm:text-[11px] font-black uppercase tracking-[0.15em] ${theme === 'dark' ? 'text-zinc-500' : 'text-zinc-400'}`}>
                  추가
                </span>
              </motion.div>
            )}
          </Reorder.Group>
        </div>

        {/* Trash Can Overlay */}
        <AnimatePresence>
          {isDragging && (
            <motion.div
              initial={{ y: 100, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ y: 100, opacity: 0 }}
              className="fixed bottom-12 left-1/2 -translate-x-1/2 z-50"
            >
              <div 
                ref={trashRef}
                className="bg-red-500 text-white p-6 rounded-full shadow-2xl flex items-center justify-center gap-3 border-4 border-white/20 backdrop-blur-md"
              >
                <Trash2 size={32} />
                <span className="font-black uppercase tracking-widest text-sm pr-2">삭제하려면 여기로</span>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Add App Modal */}
        <AnimatePresence>
          {showAddModal && (
            <div className="fixed inset-0 z-[100] flex items-center justify-center p-6">
              <motion.div 
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                onClick={() => setShowAddModal(false)}
                className="absolute inset-0 bg-black/60 backdrop-blur-sm"
              />
              <motion.div 
                initial={{ scale: 0.9, opacity: 0, y: 20 }}
                animate={{ scale: 1, opacity: 1, y: 0 }}
                exit={{ scale: 0.9, opacity: 0, y: 20 }}
                className={`relative w-full max-w-sm rounded-3xl p-8 shadow-2xl ${theme === 'dark' ? 'bg-zinc-900 border-zinc-800' : 'bg-white border-zinc-100'} border`}
              >
                <h2 className={`text-xl font-black mb-6 tracking-tight ${theme === 'dark' ? 'text-white' : 'text-zinc-900'}`}>앱 추가</h2>
                <div className="space-y-4">
                  <div className={`p-4 rounded-2xl mb-2 text-[11px] leading-relaxed ${theme === 'dark' ? 'bg-zinc-800/50 text-zinc-400' : 'bg-zinc-50 text-zinc-500'}`}>
                    <p className="font-bold mb-1 text-emerald-500">💡 팁: 앱 바로 실행하기</p>
                    <p>인터넷 주소 대신 아래 형식을 입력하면 폰에 설치된 앱이 바로 열립니다.</p>
                    <ul className="mt-2 space-y-1 font-mono opacity-80">
                      <li>• 카카오톡: <span className="text-blue-400">kakaotalk://</span></li>
                      <li>• 인스타그램: <span className="text-pink-400">instagram://</span></li>
                      <li>• 페이스북: <span className="text-blue-500">fb://</span></li>
                    </ul>
                  </div>
                  <div>
                    <label className="text-[10px] font-bold uppercase tracking-widest text-zinc-500 mb-1.5 block">이름</label>
                    <input 
                      type="text" 
                      value={newApp.label}
                      onChange={(e) => setNewApp({ ...newApp, label: e.target.value })}
                      placeholder="예: 네이버"
                      className={`w-full px-4 py-3 rounded-xl border outline-none transition-all ${theme === 'dark' ? 'bg-zinc-800 border-zinc-700 text-white focus:border-emerald-500' : 'bg-zinc-50 border-zinc-200 focus:border-emerald-500'}`}
                    />
                  </div>
                  <div>
                    <label className="text-[10px] font-bold uppercase tracking-widest text-zinc-500 mb-1.5 block">URL</label>
                    <input 
                      type="text" 
                      value={newApp.href}
                      onChange={(e) => setNewApp({ ...newApp, href: e.target.value })}
                      placeholder="naver.com"
                      className={`w-full px-4 py-3 rounded-xl border outline-none transition-all ${theme === 'dark' ? 'bg-zinc-800 border-zinc-700 text-white focus:border-emerald-500' : 'bg-zinc-50 border-zinc-200 focus:border-emerald-500'}`}
                    />
                  </div>
                  <div className="flex gap-3 pt-4">
                    <button 
                      onClick={() => setShowAddModal(false)}
                      className={`flex-1 py-3 rounded-xl font-bold text-sm ${theme === 'dark' ? 'bg-zinc-800 text-zinc-400' : 'bg-zinc-100 text-zinc-500'}`}
                    >
                      취소
                    </button>
                    <button 
                      onClick={addApp}
                      className="flex-1 py-3 rounded-xl font-bold text-sm bg-emerald-500 text-white shadow-lg shadow-emerald-500/20"
                    >
                      추가하기
                    </button>
                  </div>
                </div>
              </motion.div>
            </div>
          )}
        </AnimatePresence>

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
