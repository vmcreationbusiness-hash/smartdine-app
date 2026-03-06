import { useState, useEffect, useRef, useCallback } from 'react';
import { Mic } from 'lucide-react';
import { toast } from 'sonner';
import { useLanguage } from '../contexts/LanguageContext';

const speak = (text, lang = 'en') => {
  if (!window.speechSynthesis) return;
  window.speechSynthesis.cancel();
  const u = new SpeechSynthesisUtterance(text);
  u.lang = lang + '-IN';
  u.rate = 1.0;
  window.speechSynthesis.speak(u);
};

const findMenuItem = (transcript, items, lang) => {
  const lower = transcript.toLowerCase();
  let best = null;
  let bestScore = 0;
  for (const item of items) {
    const names = [item.name, item.translations?.[lang]?.name || ''].filter(Boolean);
    for (const name of names) {
      const nl = name.toLowerCase();
      if (lower.includes(nl) && nl.length > bestScore) {
        bestScore = nl.length;
        best = item;
      }
      const words = nl.split(/\s+/).filter(w => w.length > 2);
      const matched = words.filter(w => lower.includes(w));
      const score = words.length > 0 ? (matched.length / words.length) * nl.length : 0;
      if (score > bestScore) { bestScore = score; best = item; }
    }
  }
  return bestScore > 1 ? best : null;
};

const ADD_WORDS = ['add', 'want', 'give', 'order', 'get', 'need', 'bring', 'जोड़', 'दो', 'चाहिए', 'ಸೇರಿಸಿ', 'ಕೊಡಿ', 'ಬೇಕು', 'జోడించు', 'ఇవ్వు', 'కావాలి', 'சேர்', 'கொடு', 'வேண்டும்', 'ചേർക്കൂ', 'തരൂ', 'വേണം'];
const REMOVE_WORDS = ['remove', 'delete', 'cancel', 'no', 'हटाओ', 'निकालो', 'ತೆಗೆ', 'ಬೇಡ', 'తొలగించు', 'వద్దు', 'நீக்கு', 'வேண்டாம்', 'നീക്കൂ', 'വേണ്ട'];
const CART_WORDS = ['cart', 'my order', 'what did i', 'कार्ट', 'ಕಾರ್ಟ್', 'కార్ట్', 'கார்ட்', 'കാർട്ട്'];
const CLEAR_WORDS = ['clear', 'empty cart', 'remove all', 'start over', 'सब हटाओ', 'ಎಲ್ಲ ತೆಗೆ', 'అన్నీ తొలగించు', 'எல்லாம் நீக்கு', 'എല്ലാം നീക്കൂ'];
const PLACE_WORDS = ['place order', 'confirm', 'submit', 'done', 'order now', 'ऑर्डर करो', 'ಆರ್ಡರ್ ಮಾಡಿ', 'ఆర్డర్ చేయి', 'ஆர்டர் கொடு', 'ഓർഡർ ചെയ്യൂ'];
const HELP_WORDS = ['help', 'मदद', 'ಸಹಾಯ', 'సహాయం', 'உதவி', 'സഹായം'];

const matchesAny = (text, words) => words.some(w => text.toLowerCase().includes(w.toLowerCase()));

export const VoiceAssistant = ({ menuItems = [], cart = [], onAddToCart, onRemoveFromCart, onClearCart, onPlaceOrder, getItemName }) => {
  const [isEnabled, setIsEnabled] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [transcript, setTranscript] = useState('');
  const enabledRef = useRef(false); // use ref to avoid stale closure
  const recognitionRef = useRef(null);
  const { currentLang, currentLanguage } = useLanguage();

  const processCommand = useCallback((text) => {
    if (!text.trim()) return;
    setTranscript(text);
    const lang = currentLang;

    if (matchesAny(text, HELP_WORDS)) {
      const msg = 'Say: add item name, remove item name, show cart, clear cart, or place order';
      toast.info('💬 ' + msg);
      speak(msg, lang);
      return;
    }
    if (matchesAny(text, CART_WORDS)) {
      if (cart.length === 0) { speak('Your cart is empty', lang); toast.info('🛒 Cart is empty'); }
      else {
        const msg = 'Your cart has: ' + cart.map(i => getItemName(i) + ' x' + i.quantity).join(', ');
        speak(msg, lang); toast.info('🛒 ' + msg);
      }
      return;
    }
    if (matchesAny(text, CLEAR_WORDS)) {
      onClearCart(); speak('Cart cleared', lang); toast.success('🗑️ Cart cleared');
      return;
    }
    if (matchesAny(text, PLACE_WORDS)) {
      if (cart.length === 0) { speak('Your cart is empty. Please add items first.', lang); toast.error('Cart is empty'); }
      else { onPlaceOrder(); speak('Placing your order now', lang); }
      return;
    }
    if (matchesAny(text, REMOVE_WORDS)) {
      const item = findMenuItem(text, cart, lang);
      if (item) { onRemoveFromCart(item._id); speak('Removed ' + getItemName(item), lang); toast.success('✅ Removed ' + getItemName(item)); }
      else { speak('Item not found in cart', lang); toast.error('Item not found in cart'); }
      return;
    }
    // Default: try to add item (with or without "add" keyword)
    const item = findMenuItem(text, menuItems, lang);
    if (item) {
      onAddToCart(item);
      speak('Added ' + getItemName(item) + ' to your cart', lang);
      toast.success('🎤 Added ' + getItemName(item) + ' to cart!');
    } else if (matchesAny(text, ADD_WORDS)) {
      speak('Sorry, I could not find that item', lang);
      toast.error('Item not found: ' + text);
    } else {
      speak('Sorry, I did not understand. Try saying add followed by an item name.', lang);
      toast.warning('Not understood: ' + text);
    }
  }, [currentLang, menuItems, cart, onAddToCart, onRemoveFromCart, onClearCart, onPlaceOrder, getItemName]);

  const stopRecognition = useCallback(() => {
    if (recognitionRef.current) {
      recognitionRef.current.onend = null;
      recognitionRef.current.onerror = null;
      try { recognitionRef.current.stop(); } catch {}
      recognitionRef.current = null;
    }
    setIsListening(false);
    setTranscript('');
  }, []);

  const startRecognition = useCallback(() => {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognition) { toast.error('Voice not supported. Please use Chrome.'); return; }

    stopRecognition();

    const recognition = new SpeechRecognition();
    recognitionRef.current = recognition;
    recognition.lang = currentLanguage?.speechCode || 'en-IN';
    recognition.continuous = true;
    recognition.interimResults = true;
    recognition.maxAlternatives = 1;

    recognition.onstart = () => setIsListening(true);

    recognition.onresult = (event) => {
      let finalText = '';
      let interimText = '';
      for (let i = event.resultIndex; i < event.results.length; i++) {
        if (event.results[i].isFinal) finalText += event.results[i][0].transcript;
        else interimText += event.results[i][0].transcript;
      }
      if (interimText) setTranscript(interimText);
      if (finalText.trim()) { setTranscript(finalText); processCommand(finalText.trim()); }
    };

    recognition.onerror = (event) => {
      if (event.error === 'no-speech') {
        // Restart silently on no-speech
        if (enabledRef.current) setTimeout(() => { if (enabledRef.current) startRecognition(); }, 300);
        return;
      }
      if (event.error === 'not-allowed') { toast.error('Microphone access denied'); setIsEnabled(false); enabledRef.current = false; }
    };

    recognition.onend = () => {
      setIsListening(false);
      // Auto-restart if still enabled
      if (enabledRef.current) setTimeout(() => { if (enabledRef.current) startRecognition(); }, 300);
    };

    try { recognition.start(); } catch (e) { console.error(e); }
  }, [currentLanguage, processCommand, stopRecognition]);

  // Toggle on/off
  const toggle = () => {
    if (isEnabled) {
      enabledRef.current = false;
      setIsEnabled(false);
      stopRecognition();
      window.speechSynthesis?.cancel();
      toast.info('🎤 Voice assistant OFF');
    } else {
      enabledRef.current = true;
      setIsEnabled(true);
      toast.success('🎤 Voice assistant ON — always listening!', { duration: 3000 });
      speak('Voice assistant activated. What would you like to order?', currentLang);
      setTimeout(() => startRecognition(), 1500);
    }
  };

  // Restart on language change
  useEffect(() => {
    if (isEnabled) { stopRecognition(); setTimeout(() => startRecognition(), 300); }
  }, [currentLang]); // eslint-disable-line

  // Cleanup on unmount
  useEffect(() => () => { enabledRef.current = false; stopRecognition(); }, []); // eslint-disable-line

  return (
    <div className="fixed bottom-24 right-4 z-40 flex flex-col items-end gap-2">
      {isEnabled && transcript && (
        <div className="bg-black/80 text-white text-xs px-3 py-2 rounded-xl max-w-[200px] text-right">
          "{transcript}"
        </div>
      )}
      {isEnabled && (
        <div className="flex items-center gap-1.5 bg-black/70 text-white text-xs px-3 py-1.5 rounded-full">
          <span className={'w-2 h-2 rounded-full ' + (isListening ? 'bg-red-400 animate-pulse' : 'bg-yellow-400')} />
          <span>{isListening ? 'Listening...' : 'Starting...'}</span>
        </div>
      )}
      <button
        onClick={toggle}
        className="relative w-14 h-14 rounded-full shadow-2xl flex items-center justify-center transition-all duration-300 hover:scale-110 active:scale-95"
        style={{ background: isEnabled ? 'linear-gradient(135deg, #ef4444, #dc2626)' : 'linear-gradient(135deg, #1a1a2e, #16213e)' }}
        title={isEnabled ? 'Tap to turn OFF voice assistant' : 'Tap to activate voice assistant'}
      >
        {isEnabled && isListening && (
          <>
            <span className="absolute inset-0 rounded-full animate-ping opacity-20 bg-red-400" />
            <span className="absolute inset-[-6px] rounded-full animate-ping opacity-10 bg-red-400" style={{ animationDelay: '0.3s' }} />
          </>
        )}
        <Mic className="w-6 h-6 text-white" style={{ opacity: isEnabled ? 1 : 0.7 }} />
      </button>
      <span className="text-[10px] text-gray-500 font-medium">{isEnabled ? 'Voice ON' : 'Voice'}</span>
    </div>
  );
};

export default VoiceAssistant;
