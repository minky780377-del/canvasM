'use client';

import React, { useState, useRef, useEffect, useCallback } from 'react';
import { GoogleGenAI, Modality } from '@google/genai';
import { Camera, ZoomIn, ZoomOut, Volume2, Loader2, Key, X, Sun, Moon, HelpCircle, Mail, Play, Square } from 'lucide-react';
import Link from 'next/link';

const Logo = ({ className }: { className?: string }) => (
  <div className={className}>
    <svg viewBox="0 0 100 100" className="w-full h-full" fill="none" xmlns="http://www.w3.org/2000/svg">
      <rect x="8" y="8" width="84" height="84" stroke="currentColor" strokeWidth="6" />
      <path d="M8 92L38 45L52 68L78 32L92 92H8Z" fill="currentColor" />
    </svg>
  </div>
);

export default function VisionApp() {
  const [theme, setTheme] = useState<'dark' | 'light'>('dark');
  const [apiKey, setApiKey] = useState('');
  const [showKeyModal, setShowKeyModal] = useState(false);
  const [tempKey, setTempKey] = useState('');
  
  const [isProcessing, setIsProcessing] = useState(false);
  const [extractedText, setExtractedText] = useState('');
  const [status, setStatus] = useState('');
  const [error, setError] = useState('');
  
  const [zoom, setZoom] = useState(1);
  const [maxZoom, setMaxZoom] = useState(3);
  const [hasCamera, setHasCamera] = useState(true);
  
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  
  // TTS State
  const [isPlaying, setIsPlaying] = useState(false);
  const synthRef = useRef<SpeechSynthesis | null>(null);

  useEffect(() => {
    const savedKey = localStorage.getItem('gemini_api_key');
    if (savedKey) setApiKey(savedKey);
    
    const savedTheme = localStorage.getItem('theme') as 'dark' | 'light' | null;
    if (savedTheme) setTheme(savedTheme);
    
    if (typeof window !== 'undefined') {
      synthRef.current = window.speechSynthesis;
    }
    
    startCamera();
    
    return () => {
      stopCamera();
      if (synthRef.current) {
        synthRef.current.cancel();
      }
    };
  }, []);

  const startCamera = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ 
        video: { facingMode: 'environment' } 
      });
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
      }
      
      // Check for zoom support
      const track = stream.getVideoTracks()[0];
      const capabilities = track.getCapabilities();
      if (capabilities && 'zoom' in capabilities) {
        const zoomCap = (capabilities as any).zoom;
        setMaxZoom(zoomCap.max || 3);
      }
      setHasCamera(true);
      setError('');
    } catch (err) {
      console.error("Camera access error:", err);
      setHasCamera(false);
      setError("카메라 접근 권한이 없거나 카메라를 찾을 수 없습니다.");
    }
  };

  const stopCamera = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
    }
  };

  const handleZoomChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newZoom = parseFloat(e.target.value);
    setZoom(newZoom);
    
    if (streamRef.current) {
      const track = streamRef.current.getVideoTracks()[0];
      const capabilities = track.getCapabilities();
      if (capabilities && 'zoom' in capabilities) {
        try {
          track.applyConstraints({ advanced: [{ zoom: newZoom }] as any });
        } catch (err) {
          console.error("Zoom constraint error:", err);
        }
      }
    }
  };

  const handleSaveKey = () => {
    if (tempKey.trim()) {
      setApiKey(tempKey.trim());
      localStorage.setItem('gemini_api_key', tempKey.trim());
      setShowKeyModal(false);
      setTempKey('');
    }
  };

  const handleDeleteKey = () => {
    setApiKey('');
    localStorage.removeItem('gemini_api_key');
    setShowKeyModal(false);
  };

  const toggleTheme = () => {
    const newTheme = theme === 'dark' ? 'light' : 'dark';
    setTheme(newTheme);
    localStorage.setItem('theme', newTheme);
  };

  const captureAndRead = async () => {
    if (!videoRef.current || !canvasRef.current) return;
    
    const keyToUse = apiKey || process.env.NEXT_PUBLIC_GEMINI_API_KEY;
    if (!keyToUse) {
      setShowKeyModal(true);
      return;
    }

    setIsProcessing(true);
    setStatus('화면을 캡처하고 있습니다...');
    setError('');
    setExtractedText('');
    
    if (synthRef.current) {
      synthRef.current.cancel();
      setIsPlaying(false);
    }

    try {
      const video = videoRef.current;
      const canvas = canvasRef.current;
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      
      const ctx = canvas.getContext('2d');
      if (!ctx) throw new Error("Canvas context not found");
      
      // Draw video frame to canvas
      ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
      
      // Get base64 image
      const base64Image = canvas.toDataURL('image/jpeg', 0.8).split(',')[1];
      
      setStatus('텍스트를 추출하고 있습니다...');
      
      const ai = new GoogleGenAI({ apiKey: keyToUse });
      const response = await ai.models.generateContent({
        model: 'gemini-3.1-flash-preview',
        contents: {
          parts: [
            { inlineData: { data: base64Image, mimeType: 'image/jpeg' } },
            { text: 'Extract all the text from this image. Return ONLY the text, no markdown, no explanations. If there is no text, return "텍스트를 찾을 수 없습니다."' }
          ]
        }
      });
      
      const text = response.text || '';
      setExtractedText(text);
      
      if (text && text !== "텍스트를 찾을 수 없습니다.") {
        setStatus('텍스트를 읽고 있습니다...');
        readText(text);
      } else {
        setStatus('추출된 텍스트가 없습니다.');
        setIsProcessing(false);
      }
      
    } catch (err: any) {
      console.error("OCR Error:", err);
      setError(err.message || "텍스트 추출 중 오류가 발생했습니다.");
      setIsProcessing(false);
    }
  };

  const readText = (textToRead: string) => {
    if (!synthRef.current) {
      setIsProcessing(false);
      return;
    }
    
    const utterance = new SpeechSynthesisUtterance(textToRead);
    utterance.lang = 'ko-KR';
    utterance.rate = 0.9; // Slightly slower for better readability
    
    utterance.onstart = () => {
      setIsPlaying(true);
      setIsProcessing(false);
      setStatus('읽는 중...');
    };
    
    utterance.onend = () => {
      setIsPlaying(false);
      setStatus('읽기 완료');
    };
    
    utterance.onerror = () => {
      setIsPlaying(false);
      setIsProcessing(false);
      setError('음성 출력 중 오류가 발생했습니다.');
    };
    
    synthRef.current.speak(utterance);
  };

  const stopReading = () => {
    if (synthRef.current) {
      synthRef.current.cancel();
      setIsPlaying(false);
      setStatus('읽기 중지됨');
    }
  };

  return (
    <div className={`min-h-screen transition-colors duration-300 ${theme === 'dark' ? 'bg-zinc-950 text-zinc-100' : 'bg-[#F8F9FA] text-[#222222]'}`}>
      <div className="max-w-4xl mx-auto p-4 sm:p-6 lg:p-8">
        
        {/* Header */}
        <header className="flex items-center justify-between mb-8 sm:mb-12">
          <Link href="/" className="flex items-center gap-3 group">
            <div className={`w-10 h-10 sm:w-12 sm:h-12 rounded-2xl flex items-center justify-center transition-all duration-300 shadow-lg ${theme === 'dark' ? 'bg-zinc-900 shadow-black/50 group-hover:shadow-emerald-500/20' : 'bg-white shadow-zinc-200/50 group-hover:shadow-emerald-500/20'}`}>
              <Logo className={`w-6 h-6 sm:w-7 sm:h-7 ${theme === 'dark' ? 'text-zinc-100' : 'text-[#222222]'}`} />
            </div>
            <div className="mt-1.5">
              <h1 className="text-xl sm:text-2xl font-black tracking-tight font-display uppercase">
                CANVASM <span className="text-emerald-500">VISION</span>
              </h1>
              <p className={`text-[10px] sm:text-xs font-bold uppercase tracking-[0.2em] font-display ${theme === 'dark' ? 'text-zinc-500' : 'text-[#888888]'}`}>
                Smart Camera Reader
              </p>
            </div>
          </Link>

          <div className="flex items-center gap-2 sm:gap-3">
            <button
              onClick={toggleTheme}
              className={`p-2.5 sm:p-3 rounded-xl transition-all shadow-lg ${theme === 'dark' ? 'bg-zinc-900 text-zinc-400 hover:text-zinc-100 shadow-black/50' : 'bg-white text-[#888888] hover:text-[#222222] shadow-zinc-200/50'}`}
              title="Toggle Theme"
            >
              {theme === 'dark' ? <Sun className="w-4 h-4 sm:w-5 sm:h-5" /> : <Moon className="w-4 h-4 sm:w-5 sm:h-5" />}
            </button>
            <button
              onClick={() => setShowKeyModal(!showKeyModal)}
              className={`p-2.5 sm:p-3 rounded-xl transition-all shadow-lg ${theme === 'dark' ? 'bg-zinc-900 text-zinc-400 hover:text-zinc-100 shadow-black/50' : 'bg-white text-[#888888] hover:text-[#222222] shadow-zinc-200/50'} ${apiKey ? 'text-emerald-500' : ''}`}
              title="API Key Settings"
            >
              <Key className="w-4 h-4 sm:w-5 sm:h-5" />
            </button>
          </div>
        </header>

        {/* API Key Modal */}
        {showKeyModal && (
          <div className={`mb-8 ${theme === 'dark' ? 'bg-zinc-900/50 border-zinc-800' : 'bg-white border-[#E0E0E0] shadow-[0_2px_4px_rgba(0,0,0,0.05)]'} border rounded-2xl p-6 animate-in fade-in slide-in-from-top-4 duration-300`}>
            <div className="max-w-md mx-auto space-y-6">
              <div className={`flex items-center gap-3 ${theme === 'dark' ? 'text-zinc-100 border-zinc-800/50' : 'text-[#222222] border-[#E0E0E0]'} pb-4 border-b`}>
                <Key className="w-5 h-5 text-emerald-500" />
                <h2 className="font-bold font-display uppercase tracking-widest text-sm">API Key Settings</h2>
              </div>
              <div className="space-y-4">
                <p className={`text-xs leading-relaxed ${theme === 'dark' ? 'text-zinc-400' : 'text-[#444444]'}`}>
                  Please enter your Gemini API Key. It will be stored safely in your browser's local storage.
                </p>
                <div className="space-y-2">
                  <label className={`text-[10px] font-bold uppercase tracking-widest font-display ${theme === 'dark' ? 'text-zinc-500' : 'text-[#222222]'}`}>Your API Key</label>
                  <input
                    type="password"
                    value={tempKey}
                    onChange={(e) => setTempKey(e.target.value)}
                    placeholder="Enter your API key here..."
                    className={`w-full ${theme === 'dark' ? 'bg-zinc-950 border-zinc-800 text-zinc-200' : 'bg-white border-[#E0E0E0] text-[#444444] shadow-[0_2px_4px_rgba(0,0,0,0.05)]'} border rounded-xl px-4 py-3 text-sm placeholder:text-zinc-600 focus:outline-none focus:border-emerald-500/50 transition-colors`}
                  />
                </div>
              </div>
              <div className="flex gap-3 pt-2">
                <button
                  onClick={handleSaveKey}
                  className="flex-1 bg-emerald-500 hover:bg-emerald-400 text-zinc-950 font-bold py-3 rounded-xl transition-all text-xs uppercase tracking-widest shadow-[0_2px_4px_rgba(0,0,0,0.05)]"
                >
                  Save Key
                </button>
                {apiKey && (
                  <button
                    onClick={handleDeleteKey}
                    className={`px-4 ${theme === 'dark' ? 'bg-zinc-800 border-zinc-700 text-zinc-400' : 'bg-white border-[#E0E0E0] text-[#444444] shadow-[0_2px_4px_rgba(0,0,0,0.05)]'} hover:bg-red-900/30 hover:text-red-400 hover:border-red-900/50 font-bold py-3 rounded-xl transition-all text-xs uppercase tracking-widest border`}
                  >
                    Delete
                  </button>
                )}
              </div>
            </div>
          </div>
        )}

        <main className="space-y-6 sm:space-y-8">
          
          {/* Camera Viewer */}
          <div className={`relative overflow-hidden rounded-3xl border-4 ${theme === 'dark' ? 'border-zinc-800 bg-black' : 'border-[#E0E0E0] bg-zinc-200'} shadow-2xl aspect-[3/4] sm:aspect-video flex items-center justify-center`}>
            {!hasCamera && (
              <div className="absolute inset-0 flex flex-col items-center justify-center p-6 text-center">
                <Camera className="w-16 h-16 text-zinc-500 mb-4" />
                <p className="text-lg font-bold text-zinc-400">카메라를 사용할 수 없습니다.</p>
                <p className="text-sm text-zinc-500 mt-2">브라우저 설정에서 카메라 접근 권한을 허용해주세요.</p>
              </div>
            )}
            
            <video 
              ref={videoRef} 
              autoPlay 
              playsInline 
              muted 
              className="w-full h-full object-cover"
              style={{ transform: `scale(${zoom})`, transformOrigin: 'center center', transition: 'transform 0.2s ease-out' }}
            />
            
            {/* Hidden canvas for capturing frames */}
            <canvas ref={canvasRef} className="hidden" />
            
            {/* Status Overlay */}
            {(isProcessing || status) && (
              <div className="absolute top-4 left-1/2 -translate-x-1/2 bg-black/70 backdrop-blur-md text-white px-6 py-3 rounded-full flex items-center gap-3 shadow-xl z-10">
                {isProcessing && <Loader2 className="w-5 h-5 animate-spin text-emerald-400" />}
                <span className="font-bold text-sm sm:text-base">{status}</span>
              </div>
            )}
          </div>

          {/* Zoom Controls */}
          <div className={`p-6 rounded-3xl ${theme === 'dark' ? 'bg-zinc-900/50 border-zinc-800' : 'bg-white border-[#E0E0E0] shadow-lg'} border flex items-center gap-4`}>
            <ZoomOut className={`w-6 h-6 shrink-0 ${theme === 'dark' ? 'text-zinc-400' : 'text-zinc-500'}`} />
            <input 
              type="range" 
              min="1" 
              max={maxZoom} 
              step="0.1" 
              value={zoom} 
              onChange={handleZoomChange}
              className="w-full h-3 bg-zinc-200 rounded-lg appearance-none cursor-pointer accent-emerald-500"
            />
            <ZoomIn className={`w-6 h-6 shrink-0 ${theme === 'dark' ? 'text-zinc-400' : 'text-zinc-500'}`} />
          </div>

          {/* Error Message */}
          {error && (
            <div className="p-4 rounded-xl bg-red-500/10 border border-red-500/20 text-red-500 text-center font-bold">
              {error}
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex flex-col sm:flex-row gap-4">
            <button
              onClick={captureAndRead}
              disabled={isProcessing || !hasCamera}
              className={`flex-1 flex items-center justify-center gap-4 py-6 px-8 rounded-3xl transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-xl group ${
                theme === 'dark'
                  ? 'bg-emerald-500 hover:bg-emerald-400 text-zinc-950'
                  : 'bg-emerald-500 hover:bg-emerald-400 text-zinc-950'
              }`}
            >
              <div className="w-12 h-12 rounded-full bg-black/10 flex items-center justify-center group-hover:scale-110 transition-transform">
                {isProcessing ? (
                  <Loader2 className="w-6 h-6 animate-spin text-zinc-950" />
                ) : (
                  <Volume2 className="w-6 h-6 text-zinc-950" />
                )}
              </div>
              <span className="text-2xl sm:text-3xl font-black tracking-tight">
                {isProcessing ? "처리 중..." : "글자 읽기"}
              </span>
            </button>

            {isPlaying && (
              <button
                onClick={stopReading}
                className={`sm:w-32 flex flex-col items-center justify-center gap-2 py-4 px-6 rounded-3xl transition-all border-2 shadow-xl group bg-transparent border-red-500 text-red-500 hover:bg-red-500/10`}
              >
                <div className="w-10 h-10 rounded-full bg-red-500/10 flex items-center justify-center group-hover:scale-110 transition-transform">
                  <Square className="w-5 h-5 fill-current text-red-500" />
                </div>
                <span className="text-sm font-bold uppercase tracking-widest">정지</span>
              </button>
            )}
          </div>

          {/* Extracted Text Display (Optional, for verification) */}
          {extractedText && (
            <div className={`p-6 rounded-3xl ${theme === 'dark' ? 'bg-zinc-900/50 border-zinc-800' : 'bg-white border-[#E0E0E0] shadow-lg'} border space-y-4`}>
              <h3 className={`text-sm font-bold uppercase tracking-widest ${theme === 'dark' ? 'text-zinc-500' : 'text-zinc-400'}`}>추출된 텍스트</h3>
              <p className={`text-lg sm:text-xl leading-relaxed font-medium ${theme === 'dark' ? 'text-zinc-200' : 'text-[#222222]'}`}>
                {extractedText}
              </p>
            </div>
          )}

        </main>
      </div>
    </div>
  );
}
