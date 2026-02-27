'use client';

import React, { useState, useRef } from 'react';
import { GoogleGenAI, Modality } from '@google/genai';
import { Download, Loader2, Settings, Volume2, ChevronDown, ChevronUp, Square, Key, X, Sun, Moon, HelpCircle } from 'lucide-react';
import Link from 'next/link';

const VOICES = ['Puck', 'Charon', 'Kore', 'Fenrir', 'Zephyr'];

const createWavBlob = (base64: string, sampleRate: number = 24000) => {
  const cleanBase64 = base64.replace(/\s/g, '').replace(/-/g, '+').replace(/_/g, '/');
  const paddedBase64 = cleanBase64.padEnd(cleanBase64.length + (4 - cleanBase64.length % 4) % 4, '=');
  const binaryString = atob(paddedBase64);
  const len = binaryString.length;
  const bytes = new Uint8Array(len);
  for (let i = 0; i < len; i++) {
    bytes[i] = binaryString.charCodeAt(i);
  }

  const numChannels = 1;
  const bitsPerSample = 16;
  const byteRate = (sampleRate * numChannels * bitsPerSample) / 8;
  const blockAlign = (numChannels * bitsPerSample) / 8;
  const dataSize = bytes.length;
  const buffer = new ArrayBuffer(44 + dataSize);
  const view = new DataView(buffer);

  const writeString = (view: DataView, offset: number, string: string) => {
    for (let i = 0; i < string.length; i++) {
      view.setUint8(offset + i, string.charCodeAt(i));
    }
  };

  writeString(view, 0, 'RIFF');
  view.setUint32(4, 36 + dataSize, true);
  writeString(view, 8, 'WAVE');
  writeString(view, 12, 'fmt ');
  view.setUint32(16, 16, true);
  view.setUint16(20, 1, true);
  view.setUint16(22, numChannels, true);
  view.setUint32(24, sampleRate, true);
  view.setUint32(28, byteRate, true);
  view.setUint16(32, blockAlign, true);
  view.setUint16(34, bitsPerSample, true);
  writeString(view, 36, 'data');
  view.setUint32(40, dataSize, true);

  const pcmView = new Uint8Array(buffer, 44);
  pcmView.set(bytes);

  return new Blob([buffer], { type: 'audio/wav' });
};

const Logo = ({ className }: { className?: string }) => (
  <div className={className}>
    <svg viewBox="0 0 100 100" className="w-full h-full" fill="none" xmlns="http://www.w3.org/2000/svg">
      <rect x="8" y="8" width="84" height="84" stroke="currentColor" strokeWidth="6" />
      <path d="M8 92L38 45L52 68L78 32L92 92H8Z" fill="currentColor" />
    </svg>
  </div>
);

export default function VoiceActorApp() {
  const [text, setText] = useState('');
  const [tone, setTone] = useState('');
  const [voice, setVoice] = useState('Kore');
  const [isGenerating, setIsGenerating] = useState(false);
  const [audioData, setAudioData] = useState<{ url: string, mimeType: string, blob: Blob } | null>(null);
  const [error, setError] = useState('');
  const [status, setStatus] = useState('');
  const [isTesting, setIsTesting] = useState(false);
  const [isTestingAlt, setIsTestingAlt] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const [showDiagnostics, setShowDiagnostics] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [selectedText, setSelectedText] = useState('');
  const [floatingPos, setFloatingPos] = useState({ top: 0, left: 0 });
  const [showFloating, setShowFloating] = useState(false);
  const [apiKey, setApiKey] = useState('');
  const [showKeyModal, setShowKeyModal] = useState(false);
  const [tempKey, setTempKey] = useState('');
  const [theme, setTheme] = useState<'dark' | 'light'>('dark');
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const audioRef = useRef<HTMLAudioElement>(null);
  const selectionTimerRef = useRef<NodeJS.Timeout | null>(null);
  const abortControllerRef = useRef<AbortController | null>(null);

  // Handle audio playback when audioData changes
  React.useEffect(() => {
    if (audioData?.url && audioRef.current) {
      audioRef.current.volume = 1.0;
      audioRef.current.muted = false; // Ensure it's not muted
      audioRef.current.load();
      const playPromise = audioRef.current.play();
      if (playPromise !== undefined) {
        playPromise.catch(err => {
          console.error("Auto-play failed:", err);
        });
      }
    }
  }, [audioData]);

  // Load API Key from LocalStorage on mount
  React.useEffect(() => {
    const savedKey = localStorage.getItem('gemini_api_key');
    if (savedKey) {
      setApiKey(savedKey);
    }
  }, []);

  // Cleanup timer on unmount
  React.useEffect(() => {
    return () => {
      if (selectionTimerRef.current) {
        clearTimeout(selectionTimerRef.current);
      }
    };
  }, []);

  const playAltTestSound = async () => {
    setIsTestingAlt(true);
    try {
      const AudioContextClass = (window.AudioContext || (window as any).webkitAudioContext);
      const context = new AudioContextClass();
      
      if (context.state === 'suspended') {
        await context.resume();
      }

      const response = await fetch("https://actions.google.com/sounds/v1/alarms/beep_short.ogg");
      const arrayBuffer = await response.arrayBuffer();
      const audioBuffer = await context.decodeAudioData(arrayBuffer);
      
      const source = context.createBufferSource();
      const gain = context.createGain();
      
      source.buffer = audioBuffer;
      // Double the volume (2.0 gain)
      gain.gain.setValueAtTime(2.0, context.currentTime);
      
      source.connect(gain);
      gain.connect(context.destination);
      
      source.start();
      
      setTimeout(() => {
        setIsTestingAlt(false);
        context.close();
      }, 1500);
    } catch (err) {
      console.error("Alt test failed:", err);
      setIsTestingAlt(false);
      setError("오디오 재생에 실패했습니다. 브라우저 설정을 확인해 주세요.");
    }
  };

  const playTestSound = async () => {
    setIsTesting(true);
    try {
      const AudioContextClass = (window.AudioContext || (window as any).webkitAudioContext);
      const context = new AudioContextClass();
      
      if (context.state === 'suspended') {
        await context.resume();
      }

      // Create a "Windows-like" startup chime (C Major 7th chord)
      const frequencies = [261.63, 329.63, 392.00, 523.25]; // C4, E4, G4, C5
      const now = context.currentTime;
      
      frequencies.forEach((freq, index) => {
        const osc = context.createOscillator();
        const gain = context.createGain();
        
        osc.type = 'sine';
        osc.frequency.setValueAtTime(freq, now + (index * 0.1));
        
        // Doubled volume (0.6 per note)
        gain.gain.setValueAtTime(0, now + (index * 0.1));
        gain.gain.linearRampToValueAtTime(0.6, now + (index * 0.1) + 0.1);
        gain.gain.exponentialRampToValueAtTime(0.0001, now + 2);
        
        osc.connect(gain);
        gain.connect(context.destination);
        
        osc.start(now + (index * 0.1));
        osc.stop(now + 2.5);
      });
      
      setTimeout(() => {
        setIsTesting(false);
        context.close();
      }, 2500);
    } catch (err) {
      console.error("Test sound failed:", err);
      setIsTesting(false);
    }
  };

  const playAudio = () => {
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.currentTime = 0;
      audioRef.current.load();
      const playPromise = audioRef.current.play();
      if (playPromise !== undefined) {
        playPromise.catch(err => {
          console.error("Manual playback failed:", err);
          setError("재생에 실패했습니다. 브라우저의 소리 설정을 확인하거나 페이지를 새로고침해 주세요.");
        });
      }
    }
  };

  // Handle text selection
  const handleSelect = (e: React.SyntheticEvent<HTMLTextAreaElement>) => {
    const target = e.currentTarget;
    let start = target.selectionStart;
    let end = target.selectionEnd;

    // Clear existing timer
    if (selectionTimerRef.current) {
      clearTimeout(selectionTimerRef.current);
      selectionTimerRef.current = null;
    }

    if (start !== end) {
      // Limit selection to 1500 characters
      if (end - start > 1500) {
        end = start + 1500;
        target.setSelectionRange(start, end);
      }

      const selection = target.value.substring(start, end);
      setSelectedText(selection);

      // Calculate position for floating button
      const rect = target.getBoundingClientRect();
      
      setFloatingPos({
        top: rect.top + window.scrollY - 40,
        left: rect.left + window.scrollX + (rect.width / 2) - 60
      });
      setShowFloating(true);

      // Start 5s timer to hide button and clear selection
      selectionTimerRef.current = setTimeout(() => {
        setShowFloating(false);
        if (textareaRef.current) {
          textareaRef.current.setSelectionRange(0, 0);
          textareaRef.current.blur();
        }
      }, 5000);
    } else {
      setShowFloating(false);
    }
  };

  // Handle generation for specific text
  const handleGenerateSpecific = async (overrideText?: string) => {
    // Clear timer if button clicked
    if (selectionTimerRef.current) {
      clearTimeout(selectionTimerRef.current);
      selectionTimerRef.current = null;
    }

    const textToUse = overrideText || text;
    if (!textToUse.trim()) {
      setError('Please enter some text to read.');
      return;
    }
    
    const finalApiKey = apiKey || process.env.NEXT_PUBLIC_GEMINI_API_KEY;
    if (!finalApiKey) {
      setShowKeyModal(true);
      return;
    }

    setError('');
    setStatus('Generating audio data...');
    setIsGenerating(true);
    setAudioData(null);
    setShowFloating(false);

    // Create a new AbortController for this request
    const controller = new AbortController();
    abortControllerRef.current = controller;

    try {
      const ai = new GoogleGenAI({ apiKey: finalApiKey });
      
      const promptText = `[STUDIO MODE: HIGH-FIDELITY TTS]
Role: Professional Voice Actor / High-End Speech Synthesis Engine.
Task: Generate a pristine, artifact-free audio recording of the provided script.

CRITICAL RULES:
1. READ THE SCRIPT EXACTLY. Do not add any commentary, greetings, or extra words.
2. CONSISTENCY: Maintain 100% consistent vocal energy, volume, and clarity from the first word to the very last.
3. NO DRIFT: Prevent any robotic tone or digital distortion, especially towards the end of longer scripts.
4. TONE REFLECTION: Deeply embody the requested Tone/Mood with professional nuance.
5. FRESH START: Treat this as a standalone, high-priority studio session.

TONE/MOOD: ${tone || 'Natural and professional'}
VOICE: ${voice}

SCRIPT:
${textToUse}`;

      const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash-preview-tts',
        contents: [{ parts: [{ text: promptText }] }],
        config: {
          responseModalities: [Modality.AUDIO],
          speechConfig: {
            voiceConfig: {
              prebuiltVoiceConfig: { voiceName: voice },
            },
          },
        },
      });

      // Check if the request was cancelled
      if (controller.signal.aborted) {
        console.log("Generation aborted by user.");
        return;
      }

      const part = response.candidates?.[0]?.content?.parts?.[0];
      if (part?.inlineData?.data) {
        const rawMimeType = part.inlineData.mimeType || '';
        console.log(`Received audio: mimeType="${rawMimeType}"`);

        let finalMimeType = rawMimeType;
        let blob: Blob;
        
        const isRawPcm = !rawMimeType || 
                         rawMimeType === 'audio/pcm' || 
                         rawMimeType.includes('pcm') || 
                         !rawMimeType.includes('/');

        if (isRawPcm) {
          blob = createWavBlob(part.inlineData.data, 24000);
          finalMimeType = 'audio/wav';
        } else {
          const cleanBase64 = part.inlineData.data.replace(/\s/g, '').replace(/-/g, '+').replace(/_/g, '/');
          const paddedBase64 = cleanBase64.padEnd(cleanBase64.length + (4 - cleanBase64.length % 4) % 4, '=');
          const binaryString = atob(paddedBase64);
          const bytes = new Uint8Array(binaryString.length);
          for (let i = 0; i < binaryString.length; i++) {
            bytes[i] = binaryString.charCodeAt(i);
          }
          blob = new Blob([bytes], { type: rawMimeType });
        }
        
        const url = URL.createObjectURL(blob);
        
        // Revoke old URL if it exists
        if (audioData?.url) {
          URL.revokeObjectURL(audioData.url);
        }

        setAudioData({ url, mimeType: finalMimeType, blob });
        setStatus(`Audio generated: ${finalMimeType}`);
      } else {
        throw new Error('No audio data received from the model.');
      }
    } catch (err: any) {
      console.error(err);
      setError(err.message || 'An error occurred during generation.');
    } finally {
      setIsGenerating(false);
    }
  };

  const stopAudio = () => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
      abortControllerRef.current = null;
    }
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.currentTime = 0;
    }
    setIsPlaying(false);
    setIsGenerating(false);
    setStatus('Stopped.');
  };

  // Handle generation for the main text
  const handleGenerate = () => handleGenerateSpecific();

  const handleSaveKey = () => {
    if (tempKey.trim()) {
      localStorage.setItem('gemini_api_key', tempKey.trim());
      setApiKey(tempKey.trim());
      setShowKeyModal(false);
      setTempKey('');
    }
  };

  const handleDeleteKey = () => {
    localStorage.removeItem('gemini_api_key');
    setApiKey('');
    setShowKeyModal(false);
    setTempKey('');
  };

  const handleDownloadWav = () => {
    if (!audioData) return;
    
    const a = document.createElement('a');
    a.href = audioData.url;
    a.download = `voice_over_${Date.now()}.wav`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    setStatus('WAV exported successfully.');
  };

  return (
    <div 
      className={`min-h-screen transition-colors duration-300 ${theme === 'dark' ? 'bg-zinc-950 text-zinc-100' : 'bg-zinc-50 text-zinc-900'} p-6 selection:bg-zinc-800`}
      onDragStart={(e) => e.preventDefault()}
    >
      <div className="max-w-5xl mx-auto space-y-8">
        <header className={`flex items-start justify-between border-b ${theme === 'dark' ? 'border-zinc-800' : 'border-zinc-200'} pb-4 pt-4`}>
          <div className="flex items-start gap-4">
            <div className={`w-14 h-14 rounded-2xl ${theme === 'dark' ? 'bg-zinc-900 border-zinc-800' : 'bg-white border-zinc-200'} border flex items-center justify-center shadow-inner p-2.5`}>
              <Logo className="w-full h-full text-emerald-400" />
            </div>
            <div className="flex flex-col justify-center pt-3.5">
              <h1 className="text-3xl font-extrabold tracking-[0.15em] font-display uppercase leading-none mr-[-0.15em]">CANVASM TTS STUDIO</h1>
            </div>
          </div>
          <div className="flex flex-col items-end gap-4">
            <div className="flex items-center gap-3">
              <Link
                href="/tutorial"
                className={`p-3 rounded-xl border transition-all ${
                  theme === 'dark' 
                    ? 'bg-zinc-900 border-zinc-800 text-zinc-400 hover:text-zinc-200 hover:border-zinc-700' 
                    : 'bg-white border-zinc-200 text-zinc-500 hover:text-zinc-900 hover:border-zinc-300'
                }`}
                title="Tutorial"
              >
                <HelpCircle className="w-6 h-6" />
              </Link>

              <button
                onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
                className={`p-3 rounded-xl border transition-all ${
                  theme === 'dark' 
                    ? 'bg-zinc-900 border-zinc-800 text-zinc-400 hover:text-zinc-200 hover:border-zinc-700' 
                    : 'bg-white border-zinc-200 text-zinc-500 hover:text-zinc-900 hover:border-zinc-300'
                }`}
                title={theme === 'dark' ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
              >
                {theme === 'dark' ? <Sun className="w-6 h-6" /> : <Moon className="w-6 h-6" />}
              </button>

              <button
                onClick={() => {
                  setTempKey(apiKey);
                  setShowKeyModal(true);
                }}
                className={`p-3 rounded-xl border transition-all relative group ${
                  apiKey 
                    ? 'bg-emerald-500/10 border-emerald-500/50 text-emerald-500 shadow-[0_0_15px_rgba(16,185,129,0.1)]' 
                    : theme === 'dark' ? 'bg-zinc-900 border-zinc-800 text-zinc-400 hover:text-zinc-200 hover:border-zinc-700' : 'bg-white border-zinc-200 text-zinc-500 hover:text-zinc-900 hover:border-zinc-300'
                }`}
                title={apiKey ? "API Key is active." : "Please enter your API Key."}
              >
                <Key className="w-6 h-6" />
                {/* Tooltip */}
                <div className={`absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-2 py-1 ${theme === 'dark' ? 'bg-zinc-800 text-zinc-200 border-zinc-700' : 'bg-white text-zinc-800 border-zinc-200'} text-[10px] rounded opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none whitespace-nowrap border`}>
                  {apiKey ? "API Key is active." : "Please enter your API Key."}
                </div>
              </button>

              <button 
                onClick={() => setShowSettings(!showSettings)}
                className={`p-3 rounded-xl border transition-all ${
                  showSettings 
                    ? 'bg-emerald-500/10 border-emerald-500/50 text-emerald-400 shadow-[0_0_15px_rgba(16,185,129,0.1)]' 
                    : theme === 'dark' ? 'bg-zinc-900 border-zinc-800 text-zinc-400 hover:text-zinc-200 hover:border-zinc-700' : 'bg-white border-zinc-200 text-zinc-500 hover:text-zinc-900 hover:border-zinc-300'
                }`}
                title="Voice Settings"
              >
                <Settings className={`w-6 h-6 ${showSettings ? 'animate-spin-slow' : ''}`} />
              </button>
            </div>
            <div className="opacity-80 text-right space-y-0.5 mt-auto">
              <p className="text-[10px] text-zinc-500 font-mono leading-tight uppercase tracking-wider">App Engine: gemini-3.1-flash-preview</p>
              <p className="text-[10px] text-emerald-500/80 font-mono leading-tight uppercase tracking-wider">S Engine: gemini-2.5-flash-preview-tts</p>
            </div>
          </div>
        </header>

        {/* API Key Modal */}
        {showKeyModal && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
            <div className={`${theme === 'dark' ? 'bg-zinc-900 border-zinc-800' : 'bg-white border-zinc-200'} border w-full max-w-md rounded-2xl p-6 shadow-2xl space-y-6 animate-in zoom-in-95 duration-200`}>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-emerald-500/10 rounded-lg">
                    <Key className="w-5 h-5 text-emerald-400" />
                  </div>
                  <h3 className={`font-bold font-display uppercase tracking-widest text-sm ${theme === 'dark' ? 'text-zinc-100' : 'text-zinc-900'}`}>API Key Management</h3>
                </div>
                <button 
                  onClick={() => setShowKeyModal(false)}
                  className={`p-2 ${theme === 'dark' ? 'hover:bg-zinc-800 text-zinc-500' : 'hover:bg-zinc-100 text-zinc-400'} rounded-lg transition-colors`}
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="space-y-4">
                <p className="text-xs text-zinc-400 leading-relaxed">
                  Please enter your Gemini API Key. It will be stored safely in your browser&apos;s local storage.
                </p>
                
                <div className="space-y-2">
                  <label className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest font-display">Your API Key</label>
                  <input
                    type="password"
                    value={tempKey}
                    onChange={(e) => setTempKey(e.target.value)}
                    placeholder="Enter your API key here..."
                    className={`w-full ${theme === 'dark' ? 'bg-zinc-950 border-zinc-800 text-zinc-200' : 'bg-zinc-50 border-zinc-200 text-zinc-900'} border rounded-xl px-4 py-3 text-sm placeholder:text-zinc-600 focus:outline-none focus:border-emerald-500/50 transition-colors`}
                  />
                </div>
              </div>

              <div className="flex gap-3 pt-2">
                <button
                  onClick={handleSaveKey}
                  className="flex-1 bg-emerald-500 hover:bg-emerald-400 text-zinc-950 font-bold py-3 rounded-xl transition-all text-xs uppercase tracking-widest"
                >
                  Save Key
                </button>
                {apiKey && (
                  <button
                    onClick={handleDeleteKey}
                    className={`px-4 ${theme === 'dark' ? 'bg-zinc-800 border-zinc-700 text-zinc-400' : 'bg-zinc-100 border-zinc-200 text-zinc-500'} hover:bg-red-900/30 hover:text-red-400 hover:border-red-900/50 font-bold py-3 rounded-xl transition-all text-xs uppercase tracking-widest border`}
                  >
                    Delete
                  </button>
                )}
              </div>
            </div>
          </div>
        )}

        {showSettings && (
          <div className={`${theme === 'dark' ? 'bg-zinc-900/50 border-zinc-800' : 'bg-white border-zinc-200'} border rounded-2xl p-6 animate-in fade-in slide-in-from-top-4 duration-300`}>
            <div className="max-w-3xl mx-auto space-y-8">
              <div className={`flex items-center gap-3 ${theme === 'dark' ? 'text-zinc-100 border-zinc-800/50' : 'text-zinc-900 border-zinc-200'} pb-4 border-b`}>
                <Settings className="w-5 h-5 text-zinc-400" />
                <h2 className="font-bold font-display uppercase tracking-widest text-sm">Voice Settings</h2>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <p className="text-[10px] font-bold text-zinc-500 uppercase tracking-[0.2em] font-display">Audio Diagnostics</p>
                  </div>
                  
                  <div className="space-y-4">
                    <div className="space-y-2">
                      <button
                        onClick={playTestSound}
                        disabled={isTesting}
                        className={`w-full py-2.5 px-4 ${theme === 'dark' ? 'bg-zinc-800 border-zinc-700 text-zinc-300 hover:bg-zinc-700' : 'bg-zinc-100 border-zinc-200 text-zinc-600 hover:bg-zinc-200'} rounded-xl text-xs font-medium transition-colors flex items-center justify-center gap-2 border`}
                      >
                        {isTesting ? "Playing..." : "🔊 Test 1 (Web Audio)"}
                      </button>
                      <button
                        onClick={playAltTestSound}
                        disabled={isTestingAlt}
                        className={`w-full py-2.5 px-4 ${theme === 'dark' ? 'bg-zinc-800 border-zinc-700 text-zinc-300 hover:bg-zinc-700' : 'bg-zinc-100 border-zinc-200 text-zinc-600 hover:bg-zinc-200'} rounded-xl text-xs font-medium transition-colors flex items-center justify-center gap-2 border`}
                      >
                        {isTestingAlt ? "Playing..." : "🔔 Test 2 (External Audio)"}
                      </button>
                    </div>
                  </div>
                </div>

                <div className="space-y-4">
                  <p className="text-[10px] font-bold text-emerald-400/70 uppercase tracking-[0.2em] font-display">Troubleshooting</p>
                  <ul className="text-[11px] text-zinc-500 space-y-2 list-disc pl-3 leading-relaxed">
                    <li>Check if the <strong className="text-zinc-400">speaker icon</strong> at the top of the browser tab is muted.</li>
                    <li>Ensure your device&apos;s <strong className="text-zinc-400">system volume</strong> is turned on.</li>
                    <li>Click the <strong className="text-zinc-400">lock icon</strong> on the left of the address bar to ensure sound permissions are &apos;Allow&apos;.</li>
                    <li>Check if you are connected to Bluetooth earphones or other output devices.</li>
                    <li>If you hear noise in editing tools like Premiere Pro, try applying a <strong className="text-emerald-400">De-noise</strong> effect.</li>
                  </ul>
                </div>
              </div>
            </div>
          </div>
        )}

        <main className="space-y-8">
          <div className="space-y-6">
              <div className="relative space-y-4">
                <div className="flex justify-end items-center gap-4">
                  <div className="flex items-center gap-2 w-full max-w-md">
                    <input
                      type="text"
                      value={tone}
                      onChange={(e) => setTone(e.target.value)}
                      placeholder="TONE & MOOD"
                      className="w-full bg-zinc-900/80 border border-zinc-800 rounded-xl px-4 py-2 text-[10px] font-bold font-display uppercase tracking-[0.1em] text-zinc-200 placeholder:text-zinc-600 focus:outline-none focus:border-emerald-500/50 transition-colors"
                    />
                  </div>
                  <div className="flex items-center gap-4 shrink-0">
                    {text.length >= 1500 && (
                      <span className="text-[10px] text-amber-500 font-bold animate-pulse">
                        MAX LIMIT REACHED (1500 chars)
                      </span>
                    )}
                    <span className={`text-[10px] font-bold font-display uppercase tracking-wider ${text.length >= 1500 ? 'text-amber-500' : 'text-zinc-600'}`}>
                      {text.length} / 1500 chars
                    </span>
                  </div>
                </div>

                <div className="flex gap-4">
                  {/* Left Sidebar for Voices */}
                  <div className="hidden sm:flex flex-col gap-2 w-28 shrink-0">
                    <label className="text-[10px] font-bold text-zinc-500 uppercase tracking-[0.2em] font-display mb-1 text-center">Voices</label>
                    {VOICES.map((v) => (
                      <button
                        key={v}
                        onClick={() => setVoice(v)}
                        className={`px-3 py-3 rounded-xl text-[11px] font-bold font-display transition-all text-center uppercase tracking-wider ${
                          voice === v 
                            ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 shadow-[0_0_15px_rgba(16,185,129,0.1)]' 
                            : theme === 'dark' ? 'bg-zinc-950 border-zinc-800 text-zinc-400 hover:text-zinc-200 hover:border-zinc-700' : 'bg-white border-zinc-200 text-zinc-500 hover:text-zinc-900 hover:border-zinc-300'
                        }`}
                      >
                        {v}
                      </button>
                    ))}

                    <div className={`pt-4 mt-2 border-t ${theme === 'dark' ? 'border-zinc-800/50' : 'border-zinc-200'} space-y-2`}>
                      <button
                        onClick={handleGenerate}
                        disabled={isGenerating || !text.trim()}
                        className="w-full flex flex-col items-center justify-center gap-1 bg-zinc-900 hover:bg-zinc-800 text-emerald-400 font-bold py-2 px-1 rounded-xl transition-all disabled:opacity-50 disabled:cursor-not-allowed border border-zinc-800 shadow-lg group"
                      >
                        <div className="w-7 h-7 rounded-full bg-white/5 flex items-center justify-center group-hover:scale-110 transition-transform">
                          {isGenerating ? (
                            <Loader2 className="w-3.5 h-3.5 animate-spin text-emerald-400" />
                          ) : (
                            <Volume2 className="w-3.5 h-3.5 text-emerald-400" />
                          )}
                        </div>
                        <span className="text-[8px] font-bold font-display uppercase tracking-[0.2em]">
                          {isGenerating ? "Wait..." : "Generate"}
                        </span>
                      </button>

                      <button
                        onClick={stopAudio}
                        disabled={!isPlaying && !isGenerating}
                        className="w-full flex flex-col items-center justify-center gap-1 bg-zinc-900 hover:bg-zinc-800 text-red-500 font-bold py-2 px-1 rounded-xl transition-all disabled:opacity-30 disabled:cursor-not-allowed border border-zinc-800 shadow-lg group"
                      >
                        <div className="w-7 h-7 rounded-full bg-white/5 flex items-center justify-center group-hover:scale-110 transition-transform">
                          <Square className="w-3.5 h-3.5 fill-current text-red-500" />
                        </div>
                        <span className="text-[8px] font-bold font-display uppercase tracking-[0.2em]">Stop</span>
                      </button>
                    </div>
                  </div>

                  <div className="flex-1 relative space-y-2">
                    <div className="flex items-center justify-between">
                      <label className="text-[10px] font-bold text-zinc-500 uppercase tracking-[0.2em] font-display block">Script</label>
                      <button 
                        onClick={() => {
                          setText('');
                          setAudioData(null);
                          setStatus('Editor cleared.');
                        }}
                        className="text-[9px] font-bold text-zinc-500 hover:text-red-400 uppercase tracking-widest transition-colors flex items-center gap-1"
                      >
                        <X className="w-3 h-3" />
                        Clear All
                      </button>
                    </div>
                    <textarea
                      ref={textareaRef}
                      value={text}
                      onChange={(e) => setText(e.target.value.slice(0, 1500))}
                      onSelect={handleSelect}
                      maxLength={1500}
                      placeholder="Enter the text to be read here..."
                      className={`w-full h-[400px] ${theme === 'dark' ? 'bg-zinc-900/50 border-zinc-800 text-zinc-200' : 'bg-white border-zinc-200 text-zinc-900'} border rounded-2xl p-6 placeholder:text-zinc-600 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500/50 resize-none transition-all text-lg leading-relaxed`}
                    />

                    {/* Mobile Voice Selection and Generate Button */}
                    <div className="sm:hidden flex flex-col gap-4 mt-4">
                      <div className="flex gap-2 overflow-x-auto pb-2">
                        {VOICES.map((v) => (
                          <button
                            key={v}
                            onClick={() => setVoice(v)}
                            className={`px-4 py-2 rounded-xl text-xs font-medium transition-all whitespace-nowrap border text-center ${
                              voice === v 
                                ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30' 
                                : 'bg-zinc-900 border-zinc-800 text-zinc-400'
                            }`}
                          >
                            {v}
                          </button>
                        ))}
                      </div>
                      <button
                        onClick={handleGenerate}
                        disabled={isGenerating || !text.trim()}
                        className="w-full flex items-center justify-center gap-3 bg-zinc-900 hover:bg-zinc-800 text-emerald-400 font-bold py-2 rounded-xl transition-all disabled:opacity-50 border border-zinc-800 shadow-lg"
                      >
                        {isGenerating ? (
                          <Loader2 className="w-4 h-4 animate-spin text-emerald-400" />
                        ) : (
                          <Volume2 className="w-4 h-4 text-emerald-400" />
                        )}
                        <span className="text-xs uppercase tracking-widest">{isGenerating ? "Generating..." : "Generate Voice"}</span>
                      </button>
                      <button
                        onClick={stopAudio}
                        disabled={!isPlaying && !isGenerating}
                        className="w-full flex items-center justify-center gap-3 bg-zinc-900 hover:bg-zinc-800 text-red-500 font-bold py-2 rounded-xl transition-all disabled:opacity-30 border border-zinc-800 shadow-lg"
                      >
                        <Square className="w-4 h-4 fill-current text-red-500" />
                        <span className="text-xs uppercase tracking-widest">Stop</span>
                      </button>
                    </div>

                    {showFloating && (
                      <div 
                        className="fixed z-50 animate-in fade-in zoom-in duration-200"
                        style={{ top: floatingPos.top, left: floatingPos.left }}
                      >
                        <button
                          onClick={() => handleGenerateSpecific(selectedText)}
                          className="bg-emerald-500 hover:bg-emerald-400 text-zinc-950 text-xs font-bold px-4 py-2 rounded-full shadow-lg shadow-emerald-500/20 flex items-center gap-2 whitespace-nowrap"
                        >
                          <Volume2 className="w-3 h-3" />
                          Generate TTS for selection ({selectedText.length} chars)
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              </div>

            {status && !error && (
              <div className="flex flex-col gap-1 px-2">
                <p className="text-xs text-zinc-500 font-mono">{status}</p>
                {status.includes('successfully') && (
                  <p className="text-[10px] text-zinc-600 italic">※ If you don&apos;t hear any sound, please check your device volume and browser mute status.</p>
                )}
              </div>
            )}
            
            {error && (
              <div className="bg-red-950/30 border border-red-900/50 text-red-400 p-4 rounded-xl text-sm flex items-center gap-3">
                <div className="w-1.5 h-1.5 rounded-full bg-red-500" />
                {error}
              </div>
            )}

            {audioData && (
              <div className={`${theme === 'dark' ? 'bg-zinc-900 border-zinc-800' : 'bg-white border-zinc-200'} border rounded-2xl p-6 flex flex-col space-y-4 animate-in fade-in slide-in-from-bottom-4 duration-500`}>
                <div className="flex items-center justify-between w-full">
                  <span className="text-xs font-semibold text-emerald-400 uppercase tracking-widest flex items-center gap-2">
                    <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                    Audio Ready
                  </span>
                  <span className="text-xs text-zinc-500 font-mono">{audioData.mimeType}</span>
                </div>
                
                <div className="flex flex-col sm:flex-row items-center gap-4 w-full">
                  <div className={`relative w-full h-10 ${theme === 'dark' ? 'bg-zinc-950 border-zinc-800' : 'bg-zinc-50 border-zinc-200'} rounded-lg border flex items-center px-4 overflow-hidden`}>
                    {isPlaying && (
                      <div className="absolute inset-0 flex items-center justify-around px-4 opacity-20 pointer-events-none">
                        {[...Array(12)].map((_, i) => (
                          <div 
                            key={i} 
                            className="w-1 bg-emerald-500 rounded-full animate-bounce" 
                            style={{ 
                              height: `${Math.random() * 60 + 20}%`,
                              animationDelay: `${i * 0.1}s`,
                              animationDuration: '0.6s'
                            }} 
                          />
                        ))}
                      </div>
                    )}
                    <audio 
                      key={audioData.url}
                      ref={audioRef} 
                      src={audioData.url} 
                      onPlay={() => setIsPlaying(true)}
                      onPause={() => setIsPlaying(false)}
                      onEnded={() => setIsPlaying(false)}
                      onError={(e) => {
                        console.error("Audio element error:", e);
                        const code = e.currentTarget.error?.code;
                        const msg = e.currentTarget.error?.message;
                        setError(`Audio load failed (Code: ${code}, Msg: ${msg || 'Unknown'}). Please try again.`);
                      }}
                      controls 
                      className="w-full h-8 accent-emerald-500 relative z-10"
                    />
                  </div>
                  <div className="flex gap-2 w-full sm:w-auto">
                    <button
                      onClick={playAudio}
                      className="flex-1 sm:flex-none flex items-center justify-center gap-2 px-6 py-3 bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 rounded-xl transition-colors text-sm font-semibold"
                    >
                      <Volume2 className="w-4 h-4" />
                      Play
                    </button>
                    <button
                      onClick={handleDownloadWav}
                      className={`flex-1 sm:flex-none flex items-center justify-center gap-2 px-6 py-3 ${theme === 'dark' ? 'bg-zinc-800 border-zinc-700 text-zinc-300 hover:bg-zinc-700' : 'bg-zinc-100 border-zinc-200 text-zinc-600 hover:bg-zinc-200'} border rounded-xl transition-colors text-sm font-semibold`}
                    >
                      <Download className="w-4 h-4" />
                      WAV
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        </main>
      </div>
    </div>
  );
}
