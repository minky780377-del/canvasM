'use client';

import React, { useState, useRef, useEffect } from 'react';
import { 
  ArrowLeft, 
  Upload, 
  FileText, 
  Download, 
  Save, 
  Clock, 
  Info,
  Check,
  AlertCircle,
  Loader2,
  Plus,
  Trash2,
  Play,
  HelpCircle,
  X,
  ChevronRight,
  Settings2,
  Sun,
  Moon
} from 'lucide-react';
import Link from 'next/link';
import { motion, AnimatePresence } from 'motion/react';

// Dynamic imports for browser-only libraries
let pdfjsLib: any = null;
let mammoth: any = null;

const Logo = ({ className }: { className?: string }) => (
  <div className={className}>
    <svg viewBox="0 0 100 100" className="w-full h-full" fill="none" xmlns="http://www.w3.org/2000/svg">
      <rect x="8" y="8" width="84" height="84" stroke="currentColor" strokeWidth="6" />
      <path d="M8 92L38 45L52 68L78 32L92 92H8Z" fill="currentColor" />
    </svg>
  </div>
);

interface SubtitleBlock {
  id: string;
  startTime: string;
  endTime: string;
  text: string;
}

export default function SRTPage() {
  const [rawText, setRawText] = useState('');
  const [blocks, setBlocks] = useState<SubtitleBlock[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [status, setStatus] = useState<{ type: 'success' | 'error', message: string } | null>(null);
  const [showTutorial, setShowTutorial] = useState(false);
  const [activeTab, setActiveTab] = useState<'editor' | 'blocks'>('editor');
  const [theme, setTheme] = useState<'light' | 'dark'>('light');
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Initialize libraries on the client side
  const initLibs = async () => {
    if (!pdfjsLib) {
      pdfjsLib = await import('pdfjs-dist');
      pdfjsLib.GlobalWorkerOptions.workerSrc = `//cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjsLib.version}/pdf.worker.min.js`;
    }
    if (!mammoth) {
      mammoth = await import('mammoth');
    }
  };

  const showStatus = (type: 'success' | 'error', message: string) => {
    setStatus({ type, message });
    setTimeout(() => setStatus(null), 3000);
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsLoading(true);
    const fileType = file.name.split('.').pop()?.toLowerCase();

    try {
      await initLibs();

      let extractedText = '';
      if (fileType === 'txt') {
        extractedText = await file.text();
      } else if (fileType === 'pdf') {
        const arrayBuffer = await file.arrayBuffer();
        const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;
        let fullText = '';
        for (let i = 1; i <= pdf.numPages; i++) {
          const page = await pdf.getPage(i);
          const textContent = await page.getTextContent();
          const pageText = textContent.items.map((item: any) => (item as any).str).join(' ');
          fullText += pageText + '\n';
        }
        extractedText = fullText;
      } else if (fileType === 'docx' || fileType === 'doc') {
        const arrayBuffer = await file.arrayBuffer();
        const result = await mammoth.extractRawText({ arrayBuffer });
        extractedText = result.value;
      } else if (fileType === 'epub') {
        const content = await file.text();
        extractedText = content.replace(/<[^>]*>?/gm, '');
      } else {
        showStatus('error', '지원하지 않는 파일 형식입니다.');
        return;
      }

      setRawText(extractedText);
      showStatus('success', `${fileType?.toUpperCase()} 파일을 성공적으로 불러왔습니다.`);
      setActiveTab('editor');
    } catch (error) {
      console.error('File processing error:', error);
      showStatus('error', '파일을 처리하는 중 오류가 발생했습니다.');
    } finally {
      setIsLoading(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const formatTime = (seconds: number) => {
    const date = new Date(0);
    date.setSeconds(seconds);
    const hh = date.getUTCHours().toString().padStart(2, '0');
    const mm = date.getUTCMinutes().toString().padStart(2, '0');
    const ss = date.getUTCSeconds().toString().padStart(2, '0');
    const ms = Math.floor((seconds % 1) * 1000).toString().padStart(3, '0');
    return `${hh}:${mm}:${ss},${ms}`;
  };

  const generateBlocks = () => {
    if (!rawText.trim()) {
      showStatus('error', '텍스트가 비어 있습니다.');
      return;
    }

    const lines = rawText.split('\n').filter(line => line.trim() !== '');
    const newBlocks: SubtitleBlock[] = lines.map((line, index) => {
      const startTime = index * 3.5;
      const endTime = startTime + 3;
      return {
        id: Math.random().toString(36).substr(2, 9),
        startTime: formatTime(startTime),
        endTime: formatTime(endTime),
        text: line.trim()
      };
    });

    setBlocks(newBlocks);
    setActiveTab('blocks');
    showStatus('success', '자막 블록이 생성되었습니다. 이제 시간을 수정할 수 있습니다.');
  };

  const updateBlock = (id: string, field: keyof SubtitleBlock, value: string) => {
    setBlocks(prev => prev.map(block => 
      block.id === id ? { ...block, [field]: value } : block
    ));
  };

  const deleteBlock = (id: string) => {
    setBlocks(prev => prev.filter(block => block.id !== id));
  };

  const addBlock = (index: number) => {
    const newBlock: SubtitleBlock = {
      id: Math.random().toString(36).substr(2, 9),
      startTime: '00:00:00,000',
      endTime: '00:00:03,000',
      text: ''
    };
    const newBlocks = [...blocks];
    newBlocks.splice(index + 1, 0, newBlock);
    setBlocks(newBlocks);
  };

  const exportToSRT = () => {
    if (blocks.length === 0) {
      showStatus('error', '내보낼 자막 블록이 없습니다.');
      return;
    }

    let srtContent = '';
    blocks.forEach((block, index) => {
      srtContent += `${index + 1}\n`;
      srtContent += `${block.startTime.replace('.', ',')} --> ${block.endTime.replace('.', ',')}\n`;
      srtContent += `${block.text}\n\n`;
    });

    const blob = new Blob([srtContent], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'subtitle.srt';
    link.click();
    URL.revokeObjectURL(url);
    showStatus('success', 'SRT 파일 내보내기 완료!');
  };

  return (
    <div className={`min-h-screen transition-colors duration-300 ${theme === 'dark' ? 'bg-zinc-950 text-zinc-100' : 'bg-slate-50 text-zinc-900'} p-4 sm:p-6 font-sans`}>
      <div className="max-w-5xl mx-auto space-y-6 sm:space-y-10">
        {/* Header */}
        <header className={`flex flex-col sm:flex-row items-center justify-between border-b ${theme === 'dark' ? 'border-zinc-800' : 'border-zinc-200'} pb-4 sm:pb-4 pt-2 sm:pt-4 gap-3 sm:gap-4`}>
          <div className="flex items-start gap-1.5 sm:gap-2 w-full sm:w-auto justify-start">
            <Link href="/" className={`w-10 h-10 sm:w-14 sm:h-14 rounded-xl sm:rounded-2xl ${theme === 'dark' ? 'bg-zinc-900 border-zinc-800' : 'bg-white border-zinc-200 shadow-[0_4px_12px_rgba(0,0,0,0.08)]'} border flex items-center justify-center p-2 sm:p-2.5 shrink-0 -mt-1 sm:mt-0 hover:border-rose-500/50 transition-all active:scale-95`}>
              <Logo className="w-full h-full text-rose-500" />
            </Link>
            <div className="flex flex-col justify-start overflow-hidden pt-1 sm:pt-3.5">
              <div className="flex items-center gap-2">
                <h1 className={`text-xl sm:text-2xl md:text-3xl font-black tracking-tight font-display uppercase leading-none whitespace-nowrap ${theme === 'dark' ? 'text-white' : 'text-zinc-900'}`}>
                  canvasM <span className="text-rose-500">SRT PRO</span>
                </h1>
                <span className="bg-rose-100 text-rose-600 text-[8px] sm:text-[10px] font-black px-2 py-0.5 rounded-full uppercase shrink-0 shadow-sm border border-rose-200">Advanced</span>
              </div>
              <p className="text-[10px] sm:text-xs text-zinc-500 font-bold mt-1">정밀한 시간 조절이 가능한 자막 스튜디오</p>
            </div>
          </div>
          
          <div className="flex items-center gap-2 sm:gap-3 w-full sm:w-auto justify-end">
            <button
              onClick={() => setShowTutorial(true)}
              className={`p-2.5 rounded-xl border transition-all ${
                theme === 'dark' ? 'bg-zinc-900 border-zinc-800 text-zinc-400 hover:text-zinc-200 hover:border-zinc-700' : 'bg-white border-zinc-200 text-zinc-600 hover:text-zinc-900 hover:border-zinc-300 shadow-[0_4px_12px_rgba(0,0,0,0.05)] active:scale-95'
              }`}
              title="도움말"
            >
              <HelpCircle className="w-5 h-5" />
            </button>
            <button
              onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
              className={`p-2.5 rounded-xl border transition-all ${
                theme === 'dark' 
                  ? 'bg-zinc-900 border-zinc-800 text-zinc-400 hover:text-zinc-200 hover:border-zinc-700' 
                  : 'bg-white border-zinc-200 text-zinc-600 hover:text-zinc-900 hover:border-zinc-300 shadow-[0_4px_12px_rgba(0,0,0,0.05)] active:scale-95'
              }`}
              title={theme === 'dark' ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
            >
              {theme === 'dark' ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
            </button>
            <button
              onClick={() => fileInputRef.current?.click()}
              disabled={isLoading}
              className="flex items-center gap-2 px-4 py-2.5 bg-rose-500 text-white rounded-xl hover:bg-rose-600 transition-all shadow-[0_4px_14px_0_rgba(244,63,94,0.39)] hover:shadow-[0_6px_20px_rgba(244,63,94,0.23)] active:scale-95 disabled:opacity-50 font-bold text-sm"
            >
              {isLoading ? <Loader2 className="animate-spin" size={18} /> : <Upload size={18} />}
              <span>파일 불러오기</span>
            </button>
            <input
              type="file"
              ref={fileInputRef}
              onChange={handleFileUpload}
              accept=".txt,.pdf,.doc,.docx,.epub"
              className="hidden"
            />
          </div>
        </header>

        {/* Main Interface */}
        <div className={`${theme === 'dark' ? 'bg-zinc-900 border-zinc-800' : 'bg-white border-zinc-200'} rounded-[40px] shadow-[0_32px_64px_-12px_rgba(0,0,0,0.14)] overflow-hidden flex flex-col min-h-[700px] border`}>
          {/* Tabs */}
          <div className={`flex border-b ${theme === 'dark' ? 'border-zinc-800 bg-zinc-950/50' : 'border-zinc-200 bg-zinc-50/50'} p-2 gap-2`}>
            <button
              onClick={() => setActiveTab('editor')}
              className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-2xl text-sm font-bold transition-all ${
                activeTab === 'editor' 
                  ? theme === 'dark' ? 'bg-zinc-800 text-rose-400 shadow-sm' : 'bg-white text-rose-600 shadow-[0_4px_12px_rgba(0,0,0,0.08)] border border-zinc-100' 
                  : 'text-zinc-400 hover:text-zinc-600'
              }`}
            >
              <FileText size={16} />
              텍스트 에디터
            </button>
            <button
              onClick={() => setActiveTab('blocks')}
              className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-2xl text-sm font-bold transition-all ${
                activeTab === 'blocks' 
                  ? theme === 'dark' ? 'bg-zinc-800 text-rose-400 shadow-sm' : 'bg-white text-rose-600 shadow-[0_4px_12px_rgba(0,0,0,0.08)] border border-zinc-100' 
                  : 'text-zinc-400 hover:text-zinc-600'
              }`}
            >
              <Clock size={16} />
              자막 타임라인 ({blocks.length})
            </button>
          </div>

          {/* Content Area */}
          <div className="flex-1 flex flex-col relative">
            <AnimatePresence mode="wait">
              {activeTab === 'editor' ? (
                <motion.div
                  key="editor"
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 20 }}
                  className="flex-1 flex flex-col p-6 sm:p-10"
                >
                  <div className="flex items-center justify-between mb-6">
                    <h3 className={`text-lg font-black tracking-tight ${theme === 'dark' ? 'text-zinc-200' : 'text-zinc-900'}`}>원본 텍스트 편집</h3>
                    <button
                      onClick={generateBlocks}
                      className={`flex items-center gap-2 px-6 py-2.5 ${theme === 'dark' ? 'bg-zinc-100 text-zinc-900 hover:bg-white' : 'bg-zinc-900 text-white hover:bg-zinc-800 shadow-lg shadow-zinc-200'} rounded-2xl transition-all font-bold text-sm active:scale-95`}
                    >
                      <Settings2 size={16} />
                      자막 블록 생성하기
                    </button>
                  </div>
                  <textarea
                    value={rawText}
                    onChange={(e) => setRawText(e.target.value)}
                    placeholder="파일을 불러오거나 여기에 자막으로 만들 텍스트를 입력하세요. 줄바꿈을 기준으로 자막이 나뉩니다."
                    className={`flex-1 w-full text-lg leading-relaxed ${theme === 'dark' ? 'text-zinc-300 placeholder:text-zinc-700' : 'text-zinc-800 placeholder:text-zinc-300'} focus:outline-none resize-none font-serif bg-transparent`}
                  />
                </motion.div>
              ) : (
                <motion.div
                  key="blocks"
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  className="flex-1 flex flex-col"
                >
                  <div className={`p-6 border-b ${theme === 'dark' ? 'border-zinc-800 bg-zinc-900' : 'border-zinc-200 bg-white'} flex items-center justify-between sticky top-0 z-10`}>
                    <div className="flex items-center gap-4">
                      <h3 className={`text-lg font-black tracking-tight ${theme === 'dark' ? 'text-zinc-200' : 'text-zinc-900'}`}>자막 싱크 조절</h3>
                      <p className="text-xs text-zinc-400 font-mono">HH:MM:SS,mmm 형식 준수</p>
                    </div>
                    <button
                      onClick={exportToSRT}
                      className="flex items-center gap-2 px-6 py-2.5 bg-rose-500 text-white rounded-2xl hover:bg-rose-600 transition-all font-bold text-sm shadow-[0_4px_14px_0_rgba(244,63,94,0.39)] active:scale-95"
                    >
                      <Download size={16} />
                      SRT 파일 내보내기
                    </button>
                  </div>
                  
                  <div className={`flex-1 overflow-y-auto p-6 space-y-4 max-h-[600px] ${theme === 'dark' ? 'bg-zinc-950/30' : 'bg-zinc-50/50'}`}>
                    {blocks.length === 0 ? (
                      <div className="h-full flex flex-col items-center justify-center text-zinc-400 gap-4 py-20">
                        <AlertCircle size={48} strokeWidth={1} />
                        <p className="font-medium">생성된 자막 블록이 없습니다. 에디터에서 블록을 생성해 주세요.</p>
                      </div>
                    ) : (
                      blocks.map((block, index) => (
                        <motion.div
                          layout
                          key={block.id}
                          className={`${theme === 'dark' ? 'bg-zinc-900 border-zinc-800 shadow-[0_4px_20px_rgba(0,0,0,0.2)]' : 'bg-white border-zinc-200 shadow-[0_8px_30px_rgb(0,0,0,0.04)]'} p-5 rounded-3xl border hover:shadow-lg hover:border-rose-200 transition-all group`}
                        >
                          <div className="flex flex-col sm:flex-row gap-4 items-start">
                            <div className="flex items-center gap-2">
                              <span className={`w-8 h-8 rounded-full ${theme === 'dark' ? 'bg-zinc-800 text-zinc-500' : 'bg-rose-50 text-rose-500 border border-rose-100'} flex items-center justify-center text-xs font-black`}>
                                {index + 1}
                              </span>
                            </div>
                            
                            <div className="flex-1 space-y-3 w-full">
                              <div className="flex flex-wrap items-center gap-3">
                                <div className={`flex items-center gap-2 ${theme === 'dark' ? 'bg-zinc-950 border-zinc-800' : 'bg-zinc-50 border-zinc-200'} px-3 py-1.5 rounded-xl border shadow-inner`}>
                                  <Play size={12} className="text-rose-500" />
                                  <input
                                    type="text"
                                    value={block.startTime}
                                    onChange={(e) => updateBlock(block.id, 'startTime', e.target.value)}
                                    className={`bg-transparent text-xs font-mono font-black ${theme === 'dark' ? 'text-zinc-400' : 'text-zinc-900'} focus:outline-none w-24`}
                                  />
                                </div>
                                <ChevronRight size={14} className="text-zinc-300" />
                                <div className={`flex items-center gap-2 ${theme === 'dark' ? 'bg-zinc-950 border-zinc-800' : 'bg-zinc-50 border-zinc-200'} px-3 py-1.5 rounded-xl border shadow-inner`}>
                                  <Clock size={12} className="text-rose-500" />
                                  <input
                                    type="text"
                                    value={block.endTime}
                                    onChange={(e) => updateBlock(block.id, 'endTime', e.target.value)}
                                    className={`bg-transparent text-xs font-mono font-black ${theme === 'dark' ? 'text-zinc-400' : 'text-zinc-900'} focus:outline-none w-24`}
                                  />
                                </div>
                              </div>
                              
                              <textarea
                                value={block.text}
                                onChange={(e) => updateBlock(block.id, 'text', e.target.value)}
                                className={`w-full ${theme === 'dark' ? 'bg-zinc-950/50 text-zinc-300 focus:bg-zinc-950' : 'bg-zinc-50 text-zinc-900 focus:bg-white focus:shadow-md'} p-3 rounded-2xl text-sm focus:ring-4 focus:ring-rose-500/10 transition-all border border-transparent focus:border-rose-200 resize-none font-medium`}
                                rows={2}
                              />
                            </div>

                            <div className="flex sm:flex-col gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                              <button
                                onClick={() => addBlock(index)}
                                className={`p-2 ${theme === 'dark' ? 'text-zinc-500 hover:text-rose-400 hover:bg-rose-400/10' : 'text-zinc-400 hover:text-rose-500 hover:bg-rose-50'} rounded-xl transition-all`}
                                title="아래에 블록 추가"
                              >
                                <Plus size={18} />
                              </button>
                              <button
                                onClick={() => deleteBlock(block.id)}
                                className={`p-2 ${theme === 'dark' ? 'text-zinc-500 hover:text-rose-400 hover:bg-rose-400/10' : 'text-zinc-400 hover:text-rose-500 hover:bg-rose-50'} rounded-xl transition-all`}
                                title="삭제"
                              >
                                <Trash2 size={18} />
                              </button>
                            </div>
                          </div>
                        </motion.div>
                      ))
                    )}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>

        {/* Tutorial Modal */}
        <AnimatePresence>
          {showTutorial && (
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-zinc-900/60 backdrop-blur-sm">
              <motion.div
                initial={{ opacity: 0, scale: 0.95, y: 20 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95, y: 20 }}
                className={`${theme === 'dark' ? 'bg-zinc-900 border-zinc-800' : 'bg-white border-zinc-100'} w-full max-w-2xl rounded-[40px] shadow-2xl overflow-hidden flex flex-col max-h-[90vh] border`}
              >
                <div className={`p-8 border-b ${theme === 'dark' ? 'border-zinc-800 bg-zinc-950/50' : 'border-zinc-200 bg-zinc-50/50'} flex items-center justify-between`}>
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-2xl bg-rose-500 flex items-center justify-center text-white shadow-lg shadow-rose-200">
                      <HelpCircle size={24} />
                    </div>
                    <h2 className={`text-xl font-black ${theme === 'dark' ? 'text-white' : 'text-zinc-900'}`}>SRT 스튜디오 사용 가이드</h2>
                  </div>
                  <button onClick={() => setShowTutorial(false)} className={`p-2 ${theme === 'dark' ? 'hover:bg-zinc-800 text-zinc-500' : 'hover:bg-zinc-200 text-zinc-500'} rounded-full transition-colors`}>
                    <X size={20} />
                  </button>
                </div>

                <div className="flex-1 overflow-y-auto p-8 space-y-8">
                  <section className="space-y-4">
                    <div className="flex items-center gap-3 text-rose-600">
                      <span className="w-6 h-6 rounded-full bg-rose-100 flex items-center justify-center text-xs font-black">1</span>
                      <h3 className="font-black">파일 불러오기 및 텍스트 편집</h3>
                    </div>
                    <p className={`text-sm ${theme === 'dark' ? 'text-zinc-400' : 'text-zinc-700'} leading-relaxed pl-9 font-medium`}>
                      상단의 <strong className={theme === 'dark' ? 'text-zinc-200' : 'text-zinc-900'}>파일 불러오기</strong> 버튼을 눌러 PDF, DOCX, TXT, EPUB 파일을 업로드하세요. 
                      불러온 텍스트는 <strong>텍스트 에디터</strong> 탭에서 자유롭게 수정할 수 있습니다. 
                      자막은 <strong className={theme === 'dark' ? 'text-zinc-200' : 'text-zinc-900'}>줄바꿈(Enter)</strong>을 기준으로 나뉘므로, 한 화면에 보여주고 싶은 만큼 줄을 나누어 주세요.
                    </p>
                  </section>

                  <section className="space-y-4">
                    <div className="flex items-center gap-3 text-rose-600">
                      <span className="w-6 h-6 rounded-full bg-rose-100 flex items-center justify-center text-xs font-bold">2</span>
                      <h3 className="font-bold">자막 블록 생성 및 시간 조절</h3>
                    </div>
                    <p className={`text-sm ${theme === 'dark' ? 'text-zinc-400' : 'text-zinc-600'} leading-relaxed pl-9`}>
                      편집이 끝났다면 <strong className={theme === 'dark' ? 'text-zinc-200' : 'text-zinc-900'}>자막 블록 생성하기</strong> 버튼을 누르세요. 
                      <strong>자막 타임라인</strong> 탭으로 이동하면 각 줄이 하나의 블록으로 생성된 것을 볼 수 있습니다. 
                      여기서 시작 시간과 종료 시간을 <code className={`${theme === 'dark' ? 'bg-zinc-800 text-rose-400' : 'bg-zinc-100 text-rose-500'} px-1.5 py-0.5 rounded font-mono`}>00:00:00,000</code> 형식에 맞춰 직접 수정하세요.
                    </p>
                  </section>

                  <section className="space-y-4">
                    <div className="flex items-center gap-3 text-indigo-600">
                      <span className="w-6 h-6 rounded-full bg-indigo-100 flex items-center justify-center text-xs font-black">3</span>
                      <h3 className="font-black">SRT 파일 내보내기</h3>
                    </div>
                    <p className={`text-sm ${theme === 'dark' ? 'text-zinc-400' : 'text-zinc-700'} leading-relaxed pl-9 font-medium`}>
                      모든 싱크 조절이 완료되었다면 우측 상단의 <strong className={theme === 'dark' ? 'text-zinc-200' : 'text-zinc-900'}>SRT 파일 내보내기</strong> 버튼을 클릭하세요. 
                      표준 자막 규격인 .srt 파일이 즉시 다운로드됩니다. 이 파일은 유튜브, 프리미어 프로 등 대부분의 영상 편집기에서 바로 사용할 수 있습니다.
                    </p>
                  </section>

                  <div className={`${theme === 'dark' ? 'bg-amber-900/20 border-amber-900/30' : 'bg-amber-50 border-amber-100'} p-6 rounded-3xl border space-y-2`}>
                    <div className="flex items-center gap-2 text-amber-600 font-bold text-sm">
                      <Info size={16} />
                      싱크 조절 팁
                    </div>
                    <p className={`text-xs ${theme === 'dark' ? 'text-amber-500/80' : 'text-amber-600'} leading-relaxed`}>
                      시간 형식은 <strong>시:분:초,밀리초</strong>입니다. 쉼표(,) 뒤의 세 자리는 1000분의 1초를 의미합니다. 
                      블록 사이에는 약 0.1~0.5초의 간격을 두는 것이 시청자에게 가장 편안한 가독성을 제공합니다.
                    </p>
                  </div>
                </div>

                <div className={`p-6 ${theme === 'dark' ? 'bg-zinc-950/50 border-zinc-800' : 'bg-zinc-50 border-zinc-100'} border-t text-center`}>
                  <button
                    onClick={() => setShowTutorial(false)}
                    className={`px-12 py-3 ${theme === 'dark' ? 'bg-zinc-100 text-zinc-900 hover:bg-white' : 'bg-zinc-900 text-white hover:bg-zinc-800'} rounded-2xl font-bold transition-all`}
                  >
                    이해했습니다!
                  </button>
                </div>
              </motion.div>
            </div>
          )}
        </AnimatePresence>

        {/* Status Toast */}
        <AnimatePresence>
          {status && (
            <motion.div
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className={`fixed top-6 right-6 z-[60] flex items-center gap-2 px-4 py-3 rounded-2xl shadow-2xl border ${
                status.type === 'success' ? 'bg-rose-50 border-rose-100 text-rose-700' : 'bg-rose-50 border-rose-100 text-rose-700'
              }`}
            >
              {status.type === 'success' ? <Check size={18} /> : <AlertCircle size={18} />}
              <span className="text-sm font-black">{status.message}</span>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
