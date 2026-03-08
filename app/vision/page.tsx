'use client';

import React, { useState, useRef, useEffect } from 'react';
import { Camera, Volume2, Key, Sun, Moon, ArrowLeft, Image as ImageIcon, Loader2 } from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { TransformWrapper, TransformComponent } from 'react-zoom-pan-pinch';
import { GoogleGenAI } from '@google/genai';

const Logo = ({ className }: { className?: string }) => (
  <div className={className}>
    <svg viewBox="0 0 100 100" className="w-full h-full" fill="none" xmlns="http://www.w3.org/2000/svg">
      <rect x="8" y="8" width="84" height="84" stroke="currentColor" strokeWidth="6" />
      <path d="M8 92L38 45L52 68L78 32L92 92H8Z" fill="currentColor" />
    </svg>
  </div>
);

type ViewState = 'camera' | 'preview';

export default function VisionApp() {
  const router = useRouter();
  const [theme, setTheme] = useState<'dark' | 'light'>('dark');
  
  const [viewState, setViewState] = useState<ViewState>('camera');
  const [error, setError] = useState('');
  
  const [isPreparing, setIsPreparing] = useState(false);
  
  const [hasCamera, setHasCamera] = useState(true);
  const [capturedImage, setCapturedImage] = useState<string | null>(null);
  
  const [extractedText, setExtractedText] = useState<string | null>(null);
  const [isExtracting, setIsExtracting] = useState(false);
  const [extractionError, setExtractionError] = useState('');
  
  const [toastMessage, setToastMessage] = useState('');
  const [showToast, setShowToast] = useState(false);
  
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const transformWrapperRef = useRef<any>(null);
  const abortControllerRef = useRef<AbortController | null>(null);
  
  const [transformState, setTransformState] = useState({ scale: 1, positionX: 0, positionY: 0 });

  useEffect(() => {
    const savedTheme = localStorage.getItem('theme') as 'dark' | 'light' | null;
    if (savedTheme) setTheme(savedTheme);
    
    return () => {
      stopCamera();
    };
  }, []);

  useEffect(() => {
    if (viewState === 'camera') {
      startCamera();
    } else {
      stopCamera();
    }
  }, [viewState]);

  const startCamera = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ 
        video: { 
          facingMode: 'environment',
          width: { ideal: 1920 },
          height: { ideal: 1080 }
        } 
      });
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
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
      streamRef.current = null;
    }
  };

  const toggleTheme = () => {
    const newTheme = theme === 'dark' ? 'light' : 'dark';
    setTheme(newTheme);
    localStorage.setItem('theme', newTheme);
  };

  const getCapturedBase64 = (isHighRes = true) => {
    if (!videoRef.current || !canvasRef.current) return null;
    
    const video = videoRef.current;
    const canvas = canvasRef.current;
    
    const vw = video.videoWidth;
    const vh = video.videoHeight;
    const c = video.clientWidth;
    
    if (vw === 0 || vh === 0 || c === 0) return null;

    const scale_cover = Math.max(c / vw, c / vh);
    
    const vx = (c - vw * scale_cover) / 2;
    const vy = (c - vh * scale_cover) / 2;
    
    const { scale, positionX, positionY } = transformState;
    
    const vx_new = vx * scale + positionX;
    const vy_new = vy * scale + positionY;
    
    const sx = -vx_new / (scale_cover * scale);
    const sy = -vy_new / (scale_cover * scale);
    const sw = c / (scale_cover * scale);
    const sh = c / (scale_cover * scale);
    
    const targetSize = isHighRes ? Math.max(sw, sh) : Math.min(vw, vh, 1024);
    canvas.width = targetSize;
    canvas.height = targetSize;
    
    const ctx = canvas.getContext('2d');
    if (!ctx) return null;
    
    ctx.drawImage(video, sx, sy, sw, sh, 0, 0, targetSize, targetSize);
    
    return canvas.toDataURL('image/jpeg', isHighRes ? 1.0 : 0.6);
  };

  const compressImage = (base64Str: string, maxWidth = 1024, quality = 0.6): Promise<string> => {
    return new Promise((resolve) => {
      const img = new Image();
      img.src = base64Str;
      img.onload = () => {
        const canvas = document.createElement('canvas');
        let width = img.width;
        let height = img.height;

        if (width > height) {
          if (width > maxWidth) {
            height *= maxWidth / width;
            width = maxWidth;
          }
        } else {
          if (height > maxWidth) {
            width *= maxWidth / height;
            height = maxWidth;
          }
        }

        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        ctx?.drawImage(img, 0, 0, width, height);
        resolve(canvas.toDataURL('image/jpeg', quality));
      };
    });
  };

  const showToastMessage = (msg: string) => {
    setToastMessage(msg);
    setShowToast(true);
    setTimeout(() => {
      setShowToast(false);
    }, 2000);
  };

  const downloadImage = (base64Data: string) => {
    const date = new Date();
    const yyyy = date.getFullYear();
    const mm = String(date.getMonth() + 1).padStart(2, '0');
    const dd = String(date.getDate()).padStart(2, '0');
    const hh = String(date.getHours()).padStart(2, '0');
    const min = String(date.getMinutes()).padStart(2, '0');
    const ss = String(date.getSeconds()).padStart(2, '0');
    const filename = `Vision_${yyyy}${mm}${dd}_${hh}${min}${ss}.jpg`;

    const link = document.createElement('a');
    link.href = base64Data;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    showToastMessage("📸 갤러리(다운로드)에 안전하게 저장되었습니다.");
  };

  const extractTextFromImage = async (base64Image: string) => {
    const finalApiKey = localStorage.getItem('gemini_api_key');
    if (!finalApiKey) {
      setExtractionError('API Key가 필요합니다. 메인 화면에서 열쇠 아이콘을 눌러 API 키를 입력해주세요.');
      return;
    }

    setIsExtracting(true);
    setExtractionError('');
    setExtractedText(null);
    
    abortControllerRef.current = new AbortController();
    const signal = abortControllerRef.current.signal;

    try {
      const compressedBase64 = await compressImage(base64Image, 1024, 0.6);
      const base64Data = compressedBase64.split(',')[1] || compressedBase64;
      const mimeType = compressedBase64.includes(';') ? compressedBase64.split(';')[0].split(':')[1] : 'image/jpeg';
      
      const ai = new GoogleGenAI({ apiKey: finalApiKey });
      
      const response = await ai.models.generateContent({
        model: 'gemini-3-flash-preview',
        contents: [
          {
            parts: [
              {
                inlineData: {
                  data: base64Data,
                  mimeType: mimeType,
                }
              },
              {
                text: 'Extract all the text from this document/image. Return ONLY the extracted text, without any markdown formatting or additional comments. If it is Korean, keep it in Korean.'
              }
            ]
          }
        ]
      });

      if (signal.aborted) return;

      const text = response.text || '';
      if (text.trim()) {
         setExtractedText(text);
         setIsPreparing(true);
         sessionStorage.setItem('visionText', text);
         router.push('/tts');
      } else {
         setExtractionError('텍스트를 찾지 못했습니다. 글자가 잘 보이도록 초점을 맞춰 다시 촬영해 주세요.');
      }
    } catch (err: any) {
      if (signal.aborted || err.name === 'AbortError') {
        console.log('Extraction aborted by user');
        return;
      }
      console.error(err);
      setExtractionError(err.message || '텍스트 추출 중 오류가 발생했습니다.');
    } finally {
      if (!signal.aborted) {
        setIsExtracting(false);
      }
    }
  };

  const handleStopExtraction = () => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
      abortControllerRef.current = null;
    }
    setIsExtracting(false);
  };

  const captureImage = () => {
    const base64Data = getCapturedBase64(true);
    if (base64Data) {
      setCapturedImage(base64Data);
      setViewState('preview');
      if (transformWrapperRef.current) {
        transformWrapperRef.current.resetTransform();
      }
      setTransformState({ scale: 1, positionX: 0, positionY: 0 });
      downloadImage(base64Data);
    }
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      if (event.target?.result) {
        const base64Data = event.target.result as string;
        setCapturedImage(base64Data);
        setViewState('preview');
        if (transformWrapperRef.current) {
          transformWrapperRef.current.resetTransform();
        }
        setTransformState({ scale: 1, positionX: 0, positionY: 0 });
      }
    };
    reader.readAsDataURL(file);
    
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  return (
    <div className={`min-h-screen transition-colors duration-300 ${theme === 'dark' ? 'bg-zinc-950 text-zinc-100' : 'bg-[#F8F9FA] text-[#222222]'}`}>
      
      {/* Toast Notification */}
      <div className={`fixed top-4 left-1/2 -translate-x-1/2 z-50 transition-all duration-300 ${showToast ? 'opacity-100 translate-y-0' : 'opacity-0 -translate-y-4 pointer-events-none'}`}>
        <div className="bg-emerald-500 text-white px-6 py-3 rounded-full shadow-lg font-bold text-sm sm:text-base flex items-center gap-2">
          <span>📸</span>
          {toastMessage}
        </div>
      </div>

      <div className="max-w-4xl mx-auto p-4 sm:p-6 lg:p-8">
        
        {/* Header */}
        <header className="flex items-center justify-between mb-8 sm:mb-12">
          <div className="flex items-center gap-3 sm:gap-4">
            <Link href="/" className={`p-2.5 sm:p-3 rounded-xl transition-all shadow-lg ${theme === 'dark' ? 'bg-zinc-900 text-zinc-400 hover:text-zinc-100 shadow-black/50' : 'bg-white text-[#888888] hover:text-[#222222] shadow-zinc-200/50'}`} title="메인으로 돌아가기">
              <ArrowLeft className="w-5 h-5 sm:w-6 sm:h-6" />
            </Link>
            <div className="flex items-center gap-3 group">
              <div className={`w-10 h-10 sm:w-12 sm:h-12 rounded-2xl flex items-center justify-center transition-all duration-300 shadow-lg ${theme === 'dark' ? 'bg-zinc-900 shadow-black/50 group-hover:shadow-emerald-500/20' : 'bg-white shadow-zinc-200/50 group-hover:shadow-emerald-500/20'}`}>
                <Logo className={`w-6 h-6 sm:w-7 sm:h-7 ${theme === 'dark' ? 'text-zinc-100' : 'text-[#222222]'}`} />
              </div>
              <div className="mt-1.5 hidden sm:block">
                <h1 className="text-xl sm:text-2xl font-black tracking-tight font-display uppercase">
                  CANVASM <span className="text-emerald-500">VISION</span>
                </h1>
                <p className={`text-[10px] sm:text-xs font-bold uppercase tracking-[0.2em] font-display ${theme === 'dark' ? 'text-zinc-500' : 'text-[#888888]'}`}>
                  Smart Camera Reader
                </p>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2 sm:gap-3">
            <button
              onClick={toggleTheme}
              className={`p-2.5 sm:p-3 rounded-xl transition-all shadow-lg ${theme === 'dark' ? 'bg-zinc-900 text-zinc-400 hover:text-zinc-100 shadow-black/50' : 'bg-white text-[#888888] hover:text-[#222222] shadow-zinc-200/50'}`}
              title="Toggle Theme"
            >
              {theme === 'dark' ? <Sun className="w-4 h-4 sm:w-5 sm:h-5" /> : <Moon className="w-4 h-4 sm:w-5 sm:h-5" />}
            </button>
          </div>
        </header>

        <main className="space-y-6 sm:space-y-8">
          
          {/* Hidden File Input */}
          <input 
            type="file" 
            accept="image/*" 
            ref={fileInputRef} 
            onChange={handleFileUpload} 
            className="hidden" 
          />

          {/* Image/Camera Viewer (1:1 Aspect Ratio) */}
          <div className={`relative overflow-hidden rounded-3xl border-4 ${theme === 'dark' ? 'border-zinc-800 bg-black' : 'border-[#E0E0E0] bg-zinc-200'} shadow-2xl aspect-square flex items-center justify-center max-w-2xl mx-auto`}>
            
            <TransformWrapper
              ref={transformWrapperRef}
              initialScale={1}
              minScale={1}
              maxScale={5}
              centerOnInit
              onTransformed={(ref) => {
                setTransformState({
                  scale: ref.state.scale,
                  positionX: ref.state.positionX,
                  positionY: ref.state.positionY
                });
              }}
            >
              <TransformComponent wrapperClass="w-full h-full" contentClass="w-full h-full">
                {viewState === 'camera' && !hasCamera && (
                  <div className="absolute inset-0 flex flex-col items-center justify-center p-6 text-center">
                    <Camera className="w-16 h-16 text-zinc-500 mb-4" />
                    <p className="text-lg font-bold text-zinc-400">카메라를 사용할 수 없습니다.</p>
                    <p className="text-sm text-zinc-500 mt-2">브라우저 설정에서 카메라 접근 권한을 허용해주세요.</p>
                  </div>
                )}
                
                {viewState === 'preview' && capturedImage && (
                  <img 
                    src={capturedImage} 
                    alt="Captured" 
                    className="w-full h-full object-cover pointer-events-none"
                  />
                )}
                
                {viewState === 'camera' && (
                  <video 
                    ref={videoRef} 
                    autoPlay 
                    playsInline 
                    muted 
                    className="w-full h-full object-cover pointer-events-none"
                  />
                )}
              </TransformComponent>
            </TransformWrapper>
            
            {/* Hidden canvas for capturing frames */}
            <canvas ref={canvasRef} className="hidden" />
          </div>

          {/* Error Message */}
          {error && (
            <div className="max-w-2xl mx-auto p-4 rounded-xl bg-red-500/10 border border-red-500/20 text-red-500 text-center font-bold">
              {error}
            </div>
          )}

          {/* Bottom Action Buttons */}
          <div className="mt-8 max-w-2xl mx-auto">
            {viewState === 'camera' ? (
              <div className="flex gap-4">
                <button
                  onClick={captureImage}
                  className="flex-1 flex items-center justify-center gap-4 py-6 px-8 rounded-3xl transition-all shadow-xl bg-emerald-500 hover:bg-emerald-400 text-zinc-950"
                >
                  <Camera className="w-8 h-8" />
                  <span className="text-2xl sm:text-3xl font-black tracking-tight">촬영하기</span>
                </button>
                <button
                  onClick={() => fileInputRef.current?.click()}
                  className={`w-20 sm:w-24 flex flex-col items-center justify-center gap-2 rounded-3xl transition-all shadow-xl ${theme === 'dark' ? 'bg-zinc-800 hover:bg-zinc-700 text-white' : 'bg-white hover:bg-zinc-50 text-zinc-900 border border-zinc-200'}`}
                >
                  <ImageIcon className="w-6 h-6 sm:w-8 sm:h-8" />
                  <span className="text-xs font-bold">앨범</span>
                </button>
              </div>
            ) : (
              <div className="flex flex-col gap-4">
                {extractionError && (
                  <div className="text-red-500 text-center font-medium mb-2">
                    {extractionError}
                  </div>
                )}
                
                {isExtracting || isPreparing ? (
                  <div className="flex gap-4">
                    <button
                      onClick={handleStopExtraction}
                      disabled={isPreparing}
                      className="flex-1 flex items-center justify-center gap-2 py-6 px-4 rounded-3xl transition-all shadow-xl bg-red-500 hover:bg-red-400 text-white disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      <div className="w-5 h-5 rounded-sm bg-white" />
                      <span className="text-lg sm:text-xl font-bold">취소(STOP)</span>
                    </button>
                    <button
                      disabled
                      className="flex-[2] flex items-center justify-center gap-3 py-6 px-4 rounded-3xl transition-all shadow-xl bg-emerald-500/50 text-zinc-950 cursor-not-allowed"
                    >
                      <Loader2 className="w-6 h-6 animate-spin" />
                      <span className="text-xl sm:text-2xl font-black tracking-tight">
                        {isPreparing ? '준비 중...' : '분석 중...'}
                      </span>
                    </button>
                  </div>
                ) : (
                  <div className="flex gap-4">
                    <button
                      onClick={() => {
                        setViewState('camera');
                        setCapturedImage(null);
                        setExtractedText(null);
                        setExtractionError('');
                        if (transformWrapperRef.current) {
                          transformWrapperRef.current.resetTransform();
                        }
                        setTransformState({ scale: 1, positionX: 0, positionY: 0 });
                      }}
                      className={`flex-1 flex items-center justify-center gap-2 py-6 px-4 rounded-3xl transition-all shadow-xl ${theme === 'dark' ? 'bg-zinc-800 hover:bg-zinc-700 text-white' : 'bg-white hover:bg-zinc-50 text-zinc-900 border border-zinc-200'}`}
                    >
                      <Camera className="w-5 h-5" />
                      <span className="text-lg sm:text-xl font-bold">다시 찍기</span>
                    </button>
                    <button
                      onClick={() => {
                        if (capturedImage) extractTextFromImage(capturedImage);
                      }}
                      className="flex-[2] flex items-center justify-center gap-3 py-6 px-4 rounded-3xl transition-all shadow-xl bg-emerald-500 hover:bg-emerald-400 text-zinc-950"
                    >
                      <Volume2 className="w-6 h-6" />
                      <span className="text-xl sm:text-2xl font-black tracking-tight">소리로 듣기</span>
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>

        </main>
      </div>
    </div>
  );
}


