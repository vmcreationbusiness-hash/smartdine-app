import { useState, useRef, useEffect, useCallback } from 'react';
import { Mic, MicOff, Loader } from 'lucide-react';
import { toast } from 'sonner';
import { useLanguage } from '../contexts/LanguageContext';

// Language display names for toast messages
const LANG_NAMES = {
  en: 'English', hi: 'हिन्दी', kn: 'ಕನ್ನಡ', te: 'తెలుగు', ta: 'தமிழ்', ml: 'മലയാളം'
};

export const VoiceSearch = ({ onResult, menuItems = [] }) => {
  const [isListening, setIsListening] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [transcript, setTranscript] = useState('');
  const recognitionRef = useRef(null);
  const mediaRecorderRef = useRef(null);
  const audioChunksRef = useRef([]);
  const { currentLang, currentLanguage } = useLanguage();

  // Check if Web Speech API is available
  const hasWebSpeech = typeof window !== 'undefined' &&
    ('SpeechRecognition' in window || 'webkitSpeechRecognition' in window);

  // Check if Google Cloud STT key is configured
  const hasGoogleSTT = !!process.env.REACT_APP_GOOGLE_STT_KEY;

  // Find best matching menu item from transcript
  const findMenuMatch = useCallback((text, items) => {
    if (!text || !items.length) return null;
    const lower = text.toLowerCase().trim();

    // Try exact match first
    let match = items.find(item =>
      item.name.toLowerCase() === lower ||
      (item.translations?.[currentLang]?.name || '').toLowerCase() === lower
    );
    if (match) return match;

    // Try partial match
    match = items.find(item =>
      item.name.toLowerCase().includes(lower) ||
      lower.includes(item.name.toLowerCase()) ||
      (item.translations?.[currentLang]?.name || '').toLowerCase().includes(lower) ||
      lower.includes((item.translations?.[currentLang]?.name || '').toLowerCase())
    );
    if (match) return match;

    // Try word-by-word match
    const words = lower.split(/\s+/).filter(w => w.length > 2);
    for (const word of words) {
      match = items.find(item =>
        item.name.toLowerCase().includes(word) ||
        (item.translations?.[currentLang]?.name || '').toLowerCase().includes(word)
      );
      if (match) return match;
    }

    return null;
  }, [currentLang]);

  // Handle final transcript — find match and notify parent
  const handleTranscript = useCallback((text) => {
    setTranscript(text);
    const match = findMenuMatch(text, menuItems);
    if (match) {
      toast.success(`🎤 Found: "${match.name}"`, { duration: 2000 });
      onResult({ text, matchedItem: match });
    } else {
      toast.info(`🎤 Heard: "${text}" — searching...`, { duration: 2000 });
      onResult({ text, matchedItem: null });
    }
  }, [findMenuMatch, menuItems, onResult]);

  // Web Speech API approach (primary — works offline, free)
  const startWebSpeech = useCallback(() => {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    const recognition = new SpeechRecognition();
    recognitionRef.current = recognition;

    recognition.lang = currentLanguage.speechCode;
    recognition.continuous = false;
    recognition.interimResults = true;
    recognition.maxAlternatives = 3;

    recognition.onstart = () => {
      setIsListening(true);
      toast.info(`🎤 Listening in ${LANG_NAMES[currentLang]}...`, { duration: 2000 });
    };

    recognition.onresult = (event) => {
      let interimText = '';
      let finalText = '';

      for (let i = event.resultIndex; i < event.results.length; i++) {
        const result = event.results[i];
        if (result.isFinal) {
          finalText += result[0].transcript;
        } else {
          interimText += result[0].transcript;
        }
      }

      if (interimText) setTranscript(interimText);
      if (finalText) {
        setTranscript(finalText);
        handleTranscript(finalText.trim());
      }
    };

    recognition.onerror = (event) => {
      console.error('Speech recognition error:', event.error);
      setIsListening(false);
      setIsProcessing(false);
      if (event.error === 'not-allowed') {
        toast.error('Microphone access denied. Please allow microphone access.');
      } else if (event.error === 'no-speech') {
        toast.warning('No speech detected. Please try again.');
      } else if (hasGoogleSTT) {
        // Fallback to Google Cloud STT
        toast.info('Switching to Google STT...');
        startGoogleSTT();
      }
    };

    recognition.onend = () => {
      setIsListening(false);
      setIsProcessing(false);
    };

    recognition.start();
  }, [currentLang, currentLanguage, handleTranscript, hasGoogleSTT]);

  // Google Cloud STT approach (fallback — better accuracy for regional languages)
  const startGoogleSTT = useCallback(async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mediaRecorder = new MediaRecorder(stream, { mimeType: 'audio/webm' });
      mediaRecorderRef.current = mediaRecorder;
      audioChunksRef.current = [];

      mediaRecorder.ondataavailable = (e) => {
        if (e.data.size > 0) audioChunksRef.current.push(e.data);
      };

      mediaRecorder.onstop = async () => {
        setIsListening(false);
        setIsProcessing(true);
        stream.getTracks().forEach(track => track.stop());

        try {
          const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
          const reader = new FileReader();
          reader.readAsDataURL(audioBlob);
          reader.onloadend = async () => {
            const base64Audio = reader.result.split(',')[1];

            const response = await fetch(
              `https://speech.googleapis.com/v1/speech:recognize?key=${process.env.REACT_APP_GOOGLE_STT_KEY}`,
              {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                  config: {
                    encoding: 'WEBM_OPUS',
                    sampleRateHertz: 48000,
                    languageCode: currentLanguage.speechCode,
                    alternativeLanguageCodes: ['en-IN', 'hi-IN', 'kn-IN', 'te-IN', 'ta-IN', 'ml-IN'],
                    model: 'default',
                    enableAutomaticPunctuation: false,
                  },
                  audio: { content: base64Audio }
                })
              }
            );

            const data = await response.json();
            const text = data.results?.[0]?.alternatives?.[0]?.transcript || '';

            if (text) {
              handleTranscript(text);
            } else {
              toast.warning('Could not understand. Please try again.');
            }
          };
        } catch (error) {
          console.error('Google STT error:', error);
          toast.error('Voice recognition failed. Please type to search.');
        } finally {
          setIsProcessing(false);
        }
      };

      mediaRecorder.start();
      setIsListening(true);
      toast.info(`🎤 Listening in ${LANG_NAMES[currentLang]}...`, { duration: 2000 });

      // Auto-stop after 5 seconds
      setTimeout(() => {
        if (mediaRecorder.state === 'recording') {
          mediaRecorder.stop();
        }
      }, 5000);

    } catch (error) {
      console.error('Microphone error:', error);
      toast.error('Could not access microphone. Please check permissions.');
      setIsListening(false);
      setIsProcessing(false);
    }
  }, [currentLang, currentLanguage, handleTranscript]);

  const startListening = useCallback(() => {
    if (isListening || isProcessing) return;
    setTranscript('');

    // Use Web Speech API first (free, works offline)
    // Fall back to Google Cloud STT if not available or if Google key is set (better accuracy)
    if (hasWebSpeech && !hasGoogleSTT) {
      startWebSpeech();
    } else if (hasGoogleSTT) {
      startGoogleSTT();
    } else if (hasWebSpeech) {
      startWebSpeech();
    } else {
      toast.error('Voice recognition is not supported in this browser.');
    }
  }, [isListening, isProcessing, hasWebSpeech, hasGoogleSTT, startWebSpeech, startGoogleSTT]);

  const stopListening = useCallback(() => {
    if (recognitionRef.current) {
      recognitionRef.current.stop();
      recognitionRef.current = null;
    }
    if (mediaRecorderRef.current && mediaRecorderRef.current.state === 'recording') {
      mediaRecorderRef.current.stop();
    }
    setIsListening(false);
    setIsProcessing(false);
  }, []);

  // Cleanup on unmount
  useEffect(() => {
    return () => stopListening();
  }, [stopListening]);

  const getButtonColor = () => {
    if (isListening) return '#ef4444';
    if (isProcessing) return '#f59e0b';
    return '#6b7280';
  };

  const getButtonTitle = () => {
    if (isListening) return `Listening in ${LANG_NAMES[currentLang]}... (tap to stop)`;
    if (isProcessing) return 'Processing...';
    return `Tap to search by voice in ${LANG_NAMES[currentLang]}`;
  };

  return (
    <div className="flex items-center gap-2">
      <button
        onClick={isListening ? stopListening : startListening}
        disabled={isProcessing}
        title={getButtonTitle()}
        className="relative p-2 rounded-full transition-all duration-200 hover:scale-110 active:scale-95 disabled:opacity-50"
        style={{
          color: getButtonColor(),
          background: isListening ? '#fef2f2' : isProcessing ? '#fffbeb' : '#f3f4f6'
        }}
      >
        {isProcessing ? (
          <Loader className="w-5 h-5 animate-spin" />
        ) : isListening ? (
          <>
            <MicOff className="w-5 h-5" />
            {/* Pulse ring animation when listening */}
            <span className="absolute inset-0 rounded-full animate-ping opacity-30" style={{ background: '#ef4444' }} />
          </>
        ) : (
          <Mic className="w-5 h-5" />
        )}
      </button>
      {transcript && (
        <span className="text-xs text-gray-400 italic max-w-[120px] truncate">
          "{transcript}"
        </span>
      )}
    </div>
  );
};

export default VoiceSearch;
