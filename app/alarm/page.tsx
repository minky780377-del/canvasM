'use client';

import React, { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { ArrowLeft, Clock, Mic, Volume2, Sun, Moon, Battery, Wifi, Settings, Bell, StopCircle, Play } from 'lucide-react';
import { GoogleGenAI, Modality } from '@google/genai';

// --- Utility: Create WAV Blob ---
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

export default function AlarmPage() {
  // --- State ---
  const [currentTime, setCurrentTime] = useState<Date | null>(null); // Start null to avoid hydration mismatch
  const [alarmTime, setAlarmTime] = useState('07:00');
  const [isAlarmSet, setIsAlarmSet] = useState(false);
  const [isRinging, setIsRinging] = useState(false);
  const [transcript, setTranscript] = useState('');
  const [aiResponse, setAiResponse] = useState('');
  const [isListening, setIsListening] = useState(false);
  const [theme, setTheme] = useState<'dark' | 'light'>('dark');
  const [batteryLevel, setBatteryLevel] = useState<number | null>(null);
  const [conversationHistory, setConversationHistory] = useState<{role: string, text: string}[]>([]);
  const [wakeLock, setWakeLock] = useState<any>(null);
  const [youtubeQuery, setYoutubeQuery] = useState('');
  
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const recognitionRef = useRef<any>(null);
  const isProcessingRef = useRef(false);
  const audioContextRef = useRef<AudioContext | null>(null);
  const oscillatorRef = useRef<OscillatorNode | null>(null);
  const gainNodeRef = useRef<GainNode | null>(null);
  const alarmTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const silenceTimeoutRef = useRef<NodeJS.Timeout | null>(null); // Force silence timeout
  const isRingingRef = useRef(false);
  const currentSourceRef = useRef<AudioBufferSourceNode | null>(null);
  
  // --- Effects ---

  // Sync isRinging state to ref for use in closures
  useEffect(() => {
    isRingingRef.current = isRinging;
  }, [isRinging]);

  // Initialize
  useEffect(() => {
    setCurrentTime(new Date());

    if ('getBattery' in navigator) {
      (navigator as any).getBattery().then((battery: any) => {
        setBatteryLevel(Math.floor(battery.level * 100));
        battery.addEventListener('levelchange', () => {
          setBatteryLevel(Math.floor(battery.level * 100));
        });
      });
    }
  }, []);

  // Clock & Alarm Check
  useEffect(() => {
    const timer = setInterval(() => {
      const now = new Date();
      setCurrentTime(now);

      if (isAlarmSet && !isRinging) {
        const currentHours = now.getHours().toString().padStart(2, '0');
        const currentMinutes = now.getMinutes().toString().padStart(2, '0');
        const currentTimeStr = `${currentHours}:${currentMinutes}`;
        
        if (currentTimeStr === alarmTime && now.getSeconds() === 0) {
          triggerAlarm();
        }
      }
    }, 1000);

    return () => clearInterval(timer);
  }, [isAlarmSet, isRinging, alarmTime]);

  // --- Logic Functions (Hoisted) ---

  // Helper: Play Audio Buffer using Web Audio API (More robust than <audio> tag)
  async function playAudioBuffer(blob: Blob) {
    if (!audioContextRef.current) return;
    const ctx = audioContextRef.current;
    
    try {
      const arrayBuffer = await blob.arrayBuffer();
      const audioBuffer = await ctx.decodeAudioData(arrayBuffer);
      
      const source = ctx.createBufferSource();
      source.buffer = audioBuffer;
      source.connect(ctx.destination);
      currentSourceRef.current = source;
      source.start(0);
      
      source.onended = () => {
        currentSourceRef.current = null;
        isProcessingRef.current = false; // Reset processing flag
        scheduleNextNag();
      };
    } catch (e) {
      console.error("Web Audio Playback Failed", e);
      // Fallback to SpeechSynthesis if blob fails
      const reader = new FileReader();
      reader.onload = () => {
        const text = "오류가 발생했습니다."; // Fallback text
        const utterance = new SpeechSynthesisUtterance(text);
        utterance.lang = 'ko-KR';
        utterance.onend = () => {
             isProcessingRef.current = false;
             scheduleNextNag();
        };
        window.speechSynthesis.speak(utterance);
      };
      reader.readAsText(blob);
    }
  }

  // Helper: Generate TTS Blob
  async function generateTTSBlob(text: string): Promise<Blob | null> {
    try {
      const finalApiKey = process.env.NEXT_PUBLIC_GEMINI_API_KEY;
      if (!finalApiKey) {
        console.error("API Key is missing.");
        return null;
      }
      const ai = new GoogleGenAI({ apiKey: finalApiKey });
      const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash-preview-tts',
        contents: [{ parts: [{ text }] }],
        config: {
          responseModalities: [Modality.AUDIO],
          speechConfig: {
            voiceConfig: {
              prebuiltVoiceConfig: { voiceName: 'Kore' },
            },
          },
        },
      });

      const part = response.candidates?.[0]?.content?.parts?.[0];
      if (part?.inlineData?.data) {
        return createWavBlob(part.inlineData.data);
      }
    } catch (error) {
      console.error("TTS Generation Error:", error);
    }
    return null;
  }

  async function requestWakeLock() {
    try {
      if ('wakeLock' in navigator) {
        const lock = await (navigator as any).wakeLock.request('screen');
        setWakeLock(lock);
      }
    } catch (err) {
      // Suppress known permission error
      // console.warn('Wake Lock API failed, using video fallback:', err);
    }
    
    // Always try video fallback for robustness
    if (videoRef.current) {
      videoRef.current.play().catch(() => {
          // Suppress video play error
      });
    }
  }

  async function releaseWakeLock() {
    if (wakeLock) {
      await wakeLock.release();
      setWakeLock(null);
    }
    if (videoRef.current) {
      videoRef.current.pause();
    }
  }

  async function handleSetAlarm() {
    const finalApiKey = process.env.NEXT_PUBLIC_GEMINI_API_KEY;
    if (!finalApiKey) {
      alert('API Key is missing.');
      return;
    }
    await requestWakeLock();
    setIsAlarmSet(true);
    // Request mic permission
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      stream.getTracks().forEach(track => track.stop());
    } catch (e) {
      console.error("Mic permission denied", e);
      alert("Microphone permission is required.");
    }

    // Initialize AudioContext
    try {
      const AudioContext = window.AudioContext || (window as any).webkitAudioContext;
      const ctx = new AudioContext();
      audioContextRef.current = ctx;
      // Resume context (needed for mobile browsers)
      if (ctx.state === 'suspended') {
        await ctx.resume();
      }
      
      // Create a silent buffer to keep the audio context active
      const buffer = ctx.createBuffer(1, 1, 22050);
      const source = ctx.createBufferSource();
      source.buffer = buffer;
      source.connect(ctx.destination);
      source.start(0);
    } catch (e) {
      console.error("AudioContext init failed", e);
    }
  }

  function handleStopAlarm() {
    setIsAlarmSet(false);
    setIsRinging(false);
    releaseWakeLock();
    
    // Stop Alarm Sound
    stopAlarmSound();
    
    // Stop any playing audio
    if (currentSourceRef.current) {
        try { currentSourceRef.current.stop(); } catch(e) {}
        currentSourceRef.current = null;
    }
    window.speechSynthesis.cancel();

    if (alarmTimeoutRef.current) {
      clearTimeout(alarmTimeoutRef.current);
      alarmTimeoutRef.current = null;
    }
    if (silenceTimeoutRef.current) {
      clearTimeout(silenceTimeoutRef.current);
      silenceTimeoutRef.current = null;
    }

    if (recognitionRef.current) {
      recognitionRef.current.stop();
    }
    isProcessingRef.current = false; // Reset processing flag
    setConversationHistory([]);
    setTranscript('');
    setAiResponse('');
    setYoutubeQuery('');
  }

  async function triggerAlarm() {
    setIsRinging(true);
    
    // 1. Play Alarm Sound (Beep) for 10 seconds
    playAlarmSound();

    // 2. Pre-fetch the initial greeting TTS *while* the beep is playing
    // This hides the latency.
    const initialText = "일어날 시간이야.";
    const preFetchPromise = generateTTSBlob(initialText);

    // 3. After 10 seconds, stop alarm and play the pre-fetched audio
    alarmTimeoutRef.current = setTimeout(async () => {
      stopAlarmSound();
      
      setConversationHistory([{ role: 'model', text: initialText }]);
      setAiResponse(initialText);

      const blob = await preFetchPromise;
      if (blob) {
        playAudioBuffer(blob);
      } else {
        // Fallback if TTS failed
        const utterance = new SpeechSynthesisUtterance(initialText);
        utterance.lang = 'ko-KR';
        utterance.onend = () => scheduleNextNag();
        window.speechSynthesis.speak(utterance);
      }
    }, 10000); // 10 seconds
  }

  function playAlarmSound() {
    try {
      if (!audioContextRef.current) return;
      
      const ctx = audioContextRef.current;
      const oscillator = ctx.createOscillator();
      const gainNode = ctx.createGain();

      oscillator.type = 'square';
      oscillator.frequency.setValueAtTime(880, ctx.currentTime); // A5
      
      // Beep pattern: High volume then silence repeatedly
      const now = ctx.currentTime;
      for (let i = 0; i < 20; i++) { 
        gainNode.gain.setValueAtTime(0.1, now + i * 0.5);
        gainNode.gain.setValueAtTime(0, now + i * 0.5 + 0.2);
      }

      oscillator.connect(gainNode);
      gainNode.connect(ctx.destination);
      
      oscillator.start();
      
      oscillatorRef.current = oscillator;
      gainNodeRef.current = gainNode;
    } catch (e) {
      console.error("Alarm sound failed", e);
    }
  }

  function stopAlarmSound() {
    try {
      if (oscillatorRef.current) {
        oscillatorRef.current.stop();
        oscillatorRef.current.disconnect();
        oscillatorRef.current = null;
      }
      if (gainNodeRef.current) {
        gainNodeRef.current.disconnect();
        gainNodeRef.current = null;
      }
    } catch (e) {
      console.error("Stop alarm failed", e);
    }
  }

  async function speakText(text: string) {
    setAiResponse(text);
    const blob = await generateTTSBlob(text);
    if (blob) {
      playAudioBuffer(blob);
    } else {
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.lang = 'ko-KR';
      utterance.onend = () => startListening();
      window.speechSynthesis.speak(utterance);
    }
  }

  function startListening() {
    if (!('webkitSpeechRecognition' in window) && !('SpeechRecognition' in window)) {
      alert("Speech recognition not supported.");
      return;
    }

    // If already listening or processing, don't start
    if (isListening || isProcessingRef.current) return;

    try {
      const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
      const recognition = new SpeechRecognition();
      recognitionRef.current = recognition;

      recognition.lang = 'ko-KR';
      recognition.continuous = false;
      recognition.interimResults = false;

      setIsListening(true);
      isProcessingRef.current = false;

      // Force silence timeout (2s) - Aggressive
      if (silenceTimeoutRef.current) clearTimeout(silenceTimeoutRef.current);
      silenceTimeoutRef.current = setTimeout(() => {
        if (isRinging && !isProcessingRef.current) {
          console.log("Silence timeout (2s) - Aborting recognition");
          recognition.abort(); // Abort is faster than stop
          triggerNagging(); // Immediately trigger nagging
        }
      }, 2000);

      recognition.onresult = (event: any) => {
        if (silenceTimeoutRef.current) clearTimeout(silenceTimeoutRef.current);
        
        const text = event.results[0][0].transcript;
        setTranscript(text);
        isProcessingRef.current = true; 
        handleUserResponse(text);
      };

      recognition.onerror = (event: any) => {
        // Ignore 'no-speech' and 'aborted' errors as they are expected
        if (event.error !== 'no-speech' && event.error !== 'aborted') {
             console.error("Speech error", event.error);
        }
        
        if (silenceTimeoutRef.current) clearTimeout(silenceTimeoutRef.current);
        setIsListening(false);
        
        // If error (no speech), trigger nagging immediately
        if (isRinging && !isProcessingRef.current) {
             triggerNagging();
        }
      };

      recognition.onend = () => {
        if (silenceTimeoutRef.current) clearTimeout(silenceTimeoutRef.current);
        setIsListening(false);
        
        // If ended without result (silence), trigger nagging immediately
        if (isRinging && !isProcessingRef.current) {
            triggerNagging();
        }
      };

      recognition.start();
    } catch (e) {
      console.error("Start listening failed", e);
      if (silenceTimeoutRef.current) clearTimeout(silenceTimeoutRef.current);
      setIsListening(false);
      
      // Fallback: If mic fails (e.g. no permission/gesture), continue the loop
      if (isRinging && !isProcessingRef.current) {
          console.warn("Mic failed, falling back to nagging loop");
          setTimeout(() => triggerNagging(), 1000);
      }
    }
  }

  // Handle silence: Removed (logic moved to onend/onerror)
  // Pre-defined nagging phrases for instant response
  const NAGGING_PHRASES = [
    "자니? 대답 좀 해.",
    "얼른 일어나.",
    "오늘 날씨 진짜 좋아.",
    "기분 좋게 시작하자!",
    "눈 떠. 늦겠어.",
    "일어나라고 했잖아.",
    "계속 잘 거야?",
    "빨리 일어나.",
    "아침 먹어야지.",
    "지각하고 싶어?",
    "세수하러 가자.",
    "물 한 잔 마셔.",
    "스트레칭 좀 해.",
    "이불 밖은 위험하지 않아.",
    "햇살이 좋아.",
    "일어나서 창문 좀 열어.",
    "오늘 할 일 많잖아.",
    "지금 안 일어나면 후회해.",
    "침대가 그렇게 좋아?",
    "하나 둘 셋 하면 일어나는 거야.",
    "2 더하기 3은 뭐야?",
    "5 곱하기 2는?",
    "10 빼기 3은?",
    "3 곱하기 3은?",
    "1 더하기 1은?",
    "정신 차려. 4 더하기 4는?"
  ];

  // AI speaks without user input (Nagging) - Optimized for speed
  async function triggerNagging() {
    if (!isRingingRef.current) return;

    isProcessingRef.current = true;
    try {
      // Pick a random phrase locally to save API latency
      const aiText = NAGGING_PHRASES[Math.floor(Math.random() * NAGGING_PHRASES.length)];
      
      // Generate audio
      // We still use Gemini TTS for quality, but we skipped the text generation step
      const blob = await generateTTSBlob(aiText);
      
      // Update UI
      setConversationHistory(prev => [...prev, { role: 'model', text: aiText }]);
      setAiResponse(aiText);
      
      // Play
      if (blob) {
        playAudioBuffer(blob);
      } else {
        const utterance = new SpeechSynthesisUtterance(aiText);
        utterance.lang = 'ko-KR';
        utterance.onend = () => {
             isProcessingRef.current = false;
             scheduleNextNag();
        };
        window.speechSynthesis.speak(utterance);
      }

    } catch (e) {
      console.error("Nagging failed", e);
      isProcessingRef.current = false; // Ensure reset on error
      scheduleNextNag();
    }
  }

  function scheduleNextNag() {
    if (!isRingingRef.current) return;
    
    if (silenceTimeoutRef.current) clearTimeout(silenceTimeoutRef.current);
    
    silenceTimeoutRef.current = setTimeout(() => {
        if (isRingingRef.current) {
            triggerNagging();
        }
    }, 2000);
  }

  async function handleUserResponse(userText: string) {
    // Update history
    const newHistory = [...conversationHistory, { role: 'user', text: userText }];
    setConversationHistory(newHistory); 
    setAiResponse("..."); // Show thinking state

    try {
      const finalApiKey = process.env.NEXT_PUBLIC_GEMINI_API_KEY;
      if (!finalApiKey) {
        setAiResponse("API Key is missing.");
        return;
      }
      const ai = new GoogleGenAI({ apiKey: finalApiKey });
      
      const historyText = newHistory.map(h => `${h.role === 'user' ? 'User' : 'AI'}: ${h.text}`).join('\n');

      const systemInstruction = `
        You are a sassy, quick-witted wake-up assistant.
        Current Time: ${new Date().toLocaleTimeString()}
        
        [CONVERSATION HISTORY]
        ${historyText}
        
        [RULES]
        1. Answer in Korean.
        2. Max 20 characters. Short, punchy, casual (Banmal).
        3. STYLE: Tsundere (Cold but caring). React to user's input first, then ask a question.
        4. GOAL: WAKE USER UP. Don't just chat. Check if they are awake. If they seem sleepy, scold them.
        5. TOPICS DISTRIBUTION (Randomly pick one):
           - Math Calculation (Simple addition/multiplication) - 40% chance (PRIORITY)
           - Schedule Inquiry ("What's your plan today?") - 10% chance
           - Outfit Suggestion ("It's cold, wear padding.") - 10% chance
           - Breakfast Menu ("What are you eating?") - 10% chance
           - Weather Comment ("Sun is nice today.") - 10% chance
           - Encouragement ("Start happily!") - 10% chance
           - Wake up command ("Get up now!") - 10% chance
        6. TIKI-TAKA: If user asks a question, answer it briefly, then counter-attack with a question.
        7. MUSIC: If user asks for music/song/youtube, append "[PLAY: search_term]" at the end of response.
        
        [EXAMPLES]
        User: "졸려" -> AI: "눈 떠. 2 더하기 5는 뭐야?"
        User: "날씨 어때?" -> AI: "추워. 패딩 입어. 3 곱하기 3은?"
        User: "아이유 노래 틀어줘" -> AI: "알겠어. 잠 좀 깨. [PLAY: 아이유 노래]"
        User: "몇 시야?" -> AI: "7시. 10 빼기 2는?"
      `;

      const response = await ai.models.generateContent({
        model: 'gemini-3.1-pro-preview',
        contents: [
            { role: 'user', parts: [{ text: systemInstruction }] }
        ]
      });

      let aiText = response.text || "";
      
      // Check for YouTube command
      const playMatch = aiText.match(/\[PLAY: (.*?)\]/);
      if (playMatch) {
        const query = playMatch[1];
        setYoutubeQuery(query); // Trigger YouTube player
        aiText = aiText.replace(/\[PLAY: .*?\]/, '').trim(); // Remove command from spoken text
        stopAlarmSound();
      }
      
      // Generate audio FIRST
      const blob = await generateTTSBlob(aiText);

      // THEN update UI (Sync text with audio)
      setConversationHistory(prev => [...prev, { role: 'model', text: aiText }]);
      setAiResponse(aiText);
      
      // THEN play
      if (blob) {
        playAudioBuffer(blob);
      } else {
        const utterance = new SpeechSynthesisUtterance(aiText);
        utterance.lang = 'ko-KR';
        utterance.onend = () => {
             isProcessingRef.current = false;
             startListening();
        };
        window.speechSynthesis.speak(utterance);
      }

    } catch (error) {
      console.error("AI Logic Error:", error);
      // Fallback text
      const errorText = "오류가 났어. 다시 말해봐.";
      setAiResponse(errorText);
      const utterance = new SpeechSynthesisUtterance(errorText);
      utterance.lang = 'ko-KR';
      utterance.onend = () => {
           isProcessingRef.current = false;
           startListening();
      };
      window.speechSynthesis.speak(utterance);
    } finally {
        // isProcessingRef.current is reset in speakText's onended or error handler
        // But since we inlined speakText logic, we rely on playAudioBuffer's onended
    }
  }

  // --- Render ---
  if (!currentTime) return null; // Hydration fix

  return (
    <div className={`min-h-screen transition-colors duration-300 ${isAlarmSet ? 'bg-black text-emerald-500' : (theme === 'dark' ? 'bg-zinc-950 text-zinc-100' : 'bg-[#F8F9FA] text-[#444444]')} flex flex-col relative overflow-hidden`}>
      
      {/* Silent video for Wake Lock fallback - Must be visible (opacity 0) to work in some browsers */}
      <video 
        ref={videoRef} 
        className="opacity-0 absolute top-0 left-0 w-1 h-1 pointer-events-none" 
        playsInline 
        muted 
        loop 
        autoPlay
      >
        <source src="data:video/webm;base64,GkXfo0AgQoaBAUL3gQFC8oEEQvOBCEKCQAR3ZWJtQoeBAkKFgQIYU4BnQI0VSalmQCgq17FAAw9CQE2AQAZ3aGFtbXlXQUAGd2hhbW15RIlACECPQAAAAAAAFlSua0AxrkAu44FCPA==" type="video/webm" />
        <source src="data:video/mp4;base64,AAAAIGZ0eXBpc29tAAACAGlzb21pc28yYXZjMW1wNDEAAAAIZnJlZQAAAAhmZGF0AAAAAA==" type="video/mp4" />
      </video>

      {/* Header */}
      {!isAlarmSet && (
        <header className="p-6 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-3 group">
            <div className={`w-10 h-10 rounded-xl flex items-center justify-center p-2 transition-colors ${theme === 'dark' ? 'bg-zinc-900 text-emerald-400 border-zinc-800 group-hover:border-emerald-500/50' : 'bg-white text-emerald-500 shadow-sm border-zinc-200 group-hover:border-emerald-500/50'} border`}>
              <Logo className="w-full h-full" />
            </div>
            <div className="flex flex-col">
              <span className={`text-sm font-bold font-display uppercase tracking-widest ${theme === 'dark' ? 'text-zinc-100' : 'text-zinc-800'}`}>canvasM</span>
              <span className="text-[10px] font-bold text-emerald-500 uppercase tracking-widest leading-none">Alarm</span>
            </div>
          </Link>
          <button onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')} className={`p-2 rounded-full transition-colors ${theme === 'dark' ? 'hover:bg-zinc-800/50 text-zinc-400' : 'hover:bg-zinc-100 text-zinc-500'}`}>
            {theme === 'dark' ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
          </button>
        </header>
      )}

      {/* Main Content */}
      <main className="flex-1 flex flex-col items-center justify-center p-6 relative z-10">
        
        {/* Clock */}
        <div className={`text-center space-y-2 transition-all duration-1000 ${isAlarmSet ? (isRinging ? 'scale-100 opacity-20 blur-sm' : 'scale-125 sm:scale-150') : ''}`}>
          <div className="text-[15vw] sm:text-[12rem] font-black font-mono leading-none tracking-tighter tabular-nums">
            {currentTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: false })}
          </div>
          <div className="text-xl sm:text-3xl font-mono opacity-50 uppercase tracking-[0.5em]">
            {currentTime.toLocaleDateString([], { weekday: 'long', month: 'short', day: 'numeric' })}
          </div>
        </div>

        {/* Setup */}
        {!isAlarmSet && (
          <div className="mt-12 w-full max-w-md space-y-8 animate-in fade-in slide-in-from-bottom-8 duration-700">
            <div className={`border p-8 rounded-3xl backdrop-blur-sm ${theme === 'dark' ? 'bg-zinc-900/50 border-zinc-800' : 'bg-white border-zinc-200 shadow-lg'}`}>
              <label className="block text-xs font-bold uppercase tracking-widest text-zinc-500 mb-4">Set Wake Up Time</label>
              <div className="flex items-center justify-center gap-4">
                <input 
                  type="time" 
                  value={alarmTime}
                  onChange={(e) => setAlarmTime(e.target.value)}
                  className={`bg-transparent text-4xl sm:text-5xl font-black font-mono text-center focus:outline-none w-full appearance-none ${theme === 'dark' ? 'text-white color-scheme-dark' : 'text-zinc-900'}`}
                />
              </div>
            </div>

            <button 
              onClick={handleSetAlarm}
              className="w-full py-6 bg-emerald-500 hover:bg-emerald-400 text-zinc-950 rounded-2xl font-black text-xl uppercase tracking-widest transition-all hover:scale-105 shadow-[0_0_40px_rgba(16,185,129,0.3)] flex items-center justify-center gap-3"
            >
              <Bell className="w-6 h-6" />
              Start Sleep Mode
            </button>

            <p className="text-center text-xs text-zinc-500 leading-relaxed max-w-xs mx-auto">
              * Screen will stay on. Please plug in your charger.<br/>
              * AI will wake you up with a conversation.
            </p>
          </div>
        )}

        {/* Bedside Mode */}
        {isAlarmSet && (
          <div className="absolute bottom-8 left-0 right-0 flex flex-col items-center gap-8 animate-in fade-in duration-1000 delay-500">
            <div className={`flex items-center gap-6 text-emerald-500/50 text-sm font-mono transition-opacity duration-500 ${isRinging ? 'opacity-0' : 'opacity-100'}`}>
              <div className="flex items-center gap-2">
                <Battery className="w-4 h-4" />
                <span>{batteryLevel !== null ? `${batteryLevel}%` : '--%'}</span>
              </div>
              <div className="flex items-center gap-2">
                <Wifi className="w-4 h-4" />
                <span>Online</span>
              </div>
              <div className="flex items-center gap-2">
                <Bell className="w-4 h-4" />
                <span>{alarmTime}</span>
              </div>
            </div>

            {!isRinging ? (
              <button 
                onClick={handleStopAlarm}
                className="px-8 py-3 rounded-full border border-zinc-800 text-zinc-600 hover:text-zinc-400 hover:border-zinc-600 transition-colors text-xs font-bold uppercase tracking-widest"
              >
                Cancel Alarm
              </button>
            ) : (
              <div className="flex flex-col items-center gap-4 w-full max-w-md px-6">
                {/* Visualizer */}
                <div className="flex items-center justify-center gap-1 h-16">
                   {[...Array(5)].map((_, i) => (
                     <div key={i} className="w-3 bg-emerald-500 rounded-full animate-bounce" style={{ height: '100%', animationDelay: `${i * 0.1}s` }} />
                   ))}
                </div>

                {/* YouTube Player */}
                {youtubeQuery && (
                  <div className="w-full aspect-video rounded-xl overflow-hidden shadow-lg border border-zinc-800">
                    <iframe 
                      width="100%" 
                      height="100%" 
                      src={`https://www.youtube.com/embed?listType=search&list=${encodeURIComponent(youtubeQuery)}&autoplay=1`} 
                      title="YouTube video player" 
                      frameBorder="0" 
                      allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" 
                      allowFullScreen
                    ></iframe>
                  </div>
                )}

                {/* Mic Status */}
                <div className={`flex items-center justify-center w-12 h-12 rounded-full transition-all duration-300 ${isListening ? 'bg-red-500/20 text-red-500 scale-110' : 'bg-zinc-800/50 text-zinc-600'}`}>
                  <Mic className={`w-6 h-6 ${isListening ? 'animate-pulse' : ''}`} />
                </div>

                <button 
                  onClick={handleStopAlarm}
                  className="mt-8 w-full py-4 bg-red-500/10 hover:bg-red-500/20 text-red-500 border border-red-500/50 rounded-xl font-bold uppercase tracking-widest transition-all"
                >
                  I'm Awake (Stop)
                </button>
              </div>
            )}
          </div>
        )}
      </main>
    </div>
  );
}
