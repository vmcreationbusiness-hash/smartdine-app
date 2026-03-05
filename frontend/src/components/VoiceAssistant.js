import { useState, useEffect, useRef, useCallback } from 'react';
import { Mic, MicOff, X } from 'lucide-react';
import { toast } from 'sonner';
import { useLanguage } from '../contexts/LanguageContext';

// Commands in all supported languages
const COMMANDS = {
  add: {
    en: ['add', 'i want', 'give me', 'order', 'get me', 'one', 'i need'],
    hi: ['जोड़ो', 'दो', 'चाहिए', 'लाओ', 'मुझे'],
    kn: ['ಸೇರಿಸಿ', 'ಕೊಡಿ', 'ಬೇಕು', 'ತನ್ನಿ'],
    te: ['జోడించు', 'ఇవ్వు', 'కావాలి', 'తీసుకో'],
    ta: ['சேர்', 'கொடு', 'வேண்டும்', 'எடு'],
    ml: ['ചേർക്കൂ', 'തരൂ', 'വേണം', 'കൊണ്ടുവരൂ'],
  },
  remove: {
    en: ['remove', 'delete', 'cancel', 'take out', 'no', 'dont want'],
    hi: ['हटाओ', 'हटाएं', 'निकालो', 'नहीं चाहिए'],
    kn: ['ತೆಗೆಯಿರಿ', 'ಬೇಡ', 'ಹಟಾಯಿಸಿ'],
    te: ['తొలగించు', 'వద్దు', 'తీసివేయి'],
    ta: ['நீக்கு', 'வேண்டாம்', 'கன்சல்'],
    ml: ['നീക്കൂ', 'വേണ്ട', 'കളയൂ'],
  },
  cart: {
    en: ['cart', 'my order', 'what did i order', 'show cart', 'my items'],
    hi: ['कार्ट', 'मेरा ऑर्डर', 'क्या है'],
    kn: ['ಕಾರ್ಟ್', 'ನನ್ನ ಆರ್ಡರ್'],
    te: ['కార్ట్', 'నా ఆర్డర్'],
    ta: ['கார்ட்', 'என் ஆர்டர்'],
    ml: ['കാർട്ട്', 'എന്റെ ഓർഡർ'],
  },
  clear: {
    en: ['clear cart', 'empty cart', 'remove all', 'start over', 'clear all'],
    hi: ['सब हटाओ', 'खाली करो', 'सब निकालो'],
    kn: ['ಎಲ್ಲ ತೆಗೆಯಿರಿ', 'ಖಾಲಿ ಮಾಡಿ'],
    te: ['అన్నీ తొలగించు', 'ఖాళీ చేయి'],
    ta: ['எல்லாம் நீக்கு', 'காலி செய்'],
    ml: ['എല്ലാം നീക്കൂ', 'ഒഴിപ്പിക്കൂ'],
  },
  place: {
    en: ['place order', 'confirm order', 'submit', 'done ordering', 'order now'],
    hi: ['ऑर्डर करो', 'ऑर्डर दो', 'कन्फर्म'],
    kn: ['ಆರ್ಡರ್ ಮಾಡಿ', 'ಕನ್ಫರ್ಮ್'],
    te: ['ఆర్డర్ చేయి', 'కన్ఫర్మ్'],
    ta: ['ஆர்டர் கொடு', 'கன்ஃபர்ம்'],
    ml: ['ഓർഡർ ചെയ്യൂ', 'കൺഫേം'],
  },
  help: {
    en: ['help', 'what can you do', 'commands', 'how to use'],
    hi: ['मदद', 'सहायता', 'क्या कर सकते हो'],
    kn: ['ಸಹಾಯ', 'ಏನು ಮಾಡಬಹುದು'],
    te: ['సహాయం', 'ఏమి చేయగలవు'],
    ta: ['உதவி', 'என்ன செய்யலாம்'],
    ml: ['സഹായം', 'എന്ത് ചെയ്യാം'],
  },
};

// Speak response back to user
const speak = (text, langCode = 'en') => {
  if (!window.speechSynthesis) return;
  window.speechSynthesis.cancel();
  const utter = new SpeechSynthesisUtterance(text);
  utter.lang = langCode + '-IN';
  utter.rate = 1.0;
  utter.pitch = 1.0;
  utter.volume = 1.0;
  window.speechSynthesis.speak(utter);
};

const matchesCommand = (transcript, commandList) => {
  const lower = transcript.toLowerCase();
  return commandList.some(cmd => lower.includes(cmd.toLowerCase()));
};

const findMenuItem = (transcript, menuItems, currentLang) => {
  const lower = transcript.toLowerCase();
  let best = null;
  let bestScore = 0;

  for (const item of menuItems) {
    const names = [
      item.name,
      item.translations?.[currentLang]?.name || '',
    ].filter(Boolean);

    for (const name of names) {
      const nameLower = name.toLowerCase();
      // Exact match
      if (lower.includes(nameLower)) {
        const score = nameLower.length;
        if (score > bestScore) { bestScore = score; best = item; }
      }
      // Word match
      const words = nameLower.split(/\s+/);
      const matchedWords = words.filter(w => w.length > 2 && lower.includes(w));
      const score = matchedWords.length / words.length * nameLower.length;
      if (score > bestScore) { bestScore = score; best = item; }
    }
  }

  return bestScore > 0 ? best : null;
};

export const VoiceAssistant = ({ menuItems = [], cart = [], onAddToCart, onRemoveFromCart, onClearCart, onPlaceOrder, getItemName }) => {
  const [isListening, setIsListening] = useState(false);
  const [isEnabled, setIsEnabled] = useState(false);
  const [transcript, setTranscript] = useState('');
  const [lastCommand, setLastCommand] = useState('');
  const recognitionRef = useRef(null);
  const { currentLang, currentLanguage } = useLanguage();

  const processCommand = useCallback((text) => {
    if (!text.trim()) return;
    setTranscript(text);
    setLastCommand(text);

    const lang = currentLang;
    const addCmds = [...COMMANDS.add.en, ...(COMMANDS.add[lang] || [])];
    const removeCmds = [...COMMANDS.remove.en, ...(COMMANDS.remove[lang] || [])];
    const cartCmds = [...COMMANDS.cart.en, ...(COMMANDS.cart[lang] || [])];
    const clearCmds = [...COMMANDS.clear.en, ...(COMMANDS.clear[lang] || [])];
    const placeCmds = [...COMMANDS.place.en, ...(COMMANDS.place[lang] || [])];
    const helpCmds = [...COMMANDS.help.en, ...(COMMANDS.help[lang] || [])];

    // HELP
    if (matchesCommand(text, helpCmds)) {
      const msg = 'You can say: Add item name, Remove item name, Show cart, Clear cart, or Place order';
      toast.info('💬 ' + msg);
      speak(msg, lang);
      return;
    }

    // SHOW CART
    if (matchesCommand(text, cartCmds)) {
      if (cart.length === 0) {
        const msg = 'Your cart is empty';
        toast.info('🛒 ' + msg);
        speak(msg, lang);
      } else {
        const items = cart.map(i => `${getItemName(i)} x${i.quantity}`).join(', ');
        const msg = `Your cart has: ${items}`;
        toast.info('🛒 ' + msg);
        speak(msg, lang);
      }
      return;
    }

    // CLEAR CART
    if (matchesCommand(text, clearCmds)) {
      onClearCart();
      const msg = 'Cart cleared';
      toast.success('🗑️ ' + msg);
      speak(msg, lang);
      return;
    }

    // PLACE ORDER
    if (matchesCommand(text, placeCmds)) {
      if (cart.length === 0) {
        const msg = 'Your cart is empty. Please add items first.';
        toast.error(msg);
        speak(msg, lang);
      } else {
        onPlaceOrder();
        speak('Placing your order now', lang);
      }
      return;
    }

    // REMOVE ITEM
    if (matchesCommand(text, removeCmds)) {
      const item = findMenuItem(text, cart, lang);
      if (item) {
        onRemoveFromCart(item._id);
        const msg = `Removed ${getItemName(item)} from cart`;
        toast.success('✅ ' + msg);
        speak(msg, lang);
      } else {
        const msg = 'Item not found in cart';
        toast.error(msg);
        speak(msg, lang);
      }
      return;
    }

    // ADD ITEM
    if (matchesCommand(text, addCmds)) {
      const item = findMenuItem(text, menuItems, lang);
      if (item) {
        onAddToCart(item);
        const msg = `Added ${getItemName(item)} to your cart`;
        toast.success('🎤 ' + msg);
        speak(msg, lang);
      } else {
        const msg = 'Sorry, I could not find that item on the menu';
        toast.error(msg);
        speak(msg, lang);
      }
      return;
    }

    // Try to find item anyway (no command word needed)
    const item = findMenuItem(text, menuItems, lang);
    if (item) {
      onAddToCart(item);
      const msg = `Added ${getItemName(item)} to your cart`;
      toast.success('🎤 ' + msg);
      speak(msg, lang);
    } else {
      const msg = `I heard "${text}" but could not find a matching item`;
      toast.warning(msg);
      speak("Sorry, I did not understand. Please try again.", lang);
    }
  }, [currentLang, menuItems, cart, onAddToCart, onRemoveFromCart, onClearCart, onPlaceOrder, getItemName]);

  const startListening = useCallback(() => {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognition) {
      toast.error('Voice recognition not supported in this browser. Please use Chrome.');
      return;
    }

    const recognition = new SpeechRecognition();
    recognitionRef.current = recognition;

    recognition.lang = currentLanguage.speechCode;
    recognition.continuous = true;        // Keep listening
    recognition.interimResults = true;    // Show interim results
    recognition.maxAlternatives = 3;

    // Noise cancellation settings
    recognition.grammars = null;

    recognition.onstart = () => {
      setIsListening(true);
    };

    recognition.onresult = (event) => {
      let finalText = '';
      let interimText = '';

      for (let i = event.resultIndex; i < event.results.length; i++) {
        if (event.results[i].isFinal) {
          finalText += event.results[i][0].transcript;
        } else {
          interimText += event.results[i][0].transcript;
        }
      }

      if (interimText) setTranscript(interimText);
      if (finalText.trim()) {
        setTranscript(finalText);
        processCommand(finalText.trim());
      }
    };

    recognition.onerror = (event) => {
      if (event.error === 'no-speech') {
        // Just restart — no-speech in noisy env is normal
        if (isEnabled) {
          setTimeout(() => {
            if (recognitionRef.current && isEnabled) {
              try { recognition.start(); } catch {}
            }
          }, 100);
        }
        return;
      }
      if (event.error === 'not-allowed') {
        toast.error('Microphone access denied');
        setIsEnabled(false);
        setIsListening(false);
      }
    };

    recognition.onend = () => {
      // Auto-restart if still enabled (continuous listening)
      setIsListening(false);
      if (isEnabled) {
        setTimeout(() => {
          if (isEnabled) {
            try { recognition.start(); setIsListening(true); } catch {}
          }
        }, 200);
      }
    };

    try {
      recognition.start();
    } catch (e) {
      console.error('Recognition start error:', e);
    }
  }, [currentLanguage, processCommand, isEnabled]);

  const stopListening = useCallback(() => {
    if (recognitionRef.current) {
      recognitionRef.current.onend = null;
      recognitionRef.current.stop();
      recognitionRef.current = null;
    }
    window.speechSynthesis?.cancel();
    setIsListening(false);
    setTranscript('');
  }, []);

  // Start/stop based on isEnabled
  useEffect(() => {
    if (isEnabled) {
      speak('Voice assistant activated. What would you like to order?', currentLang);
      setTimeout(() => startListening(), 1500);
      toast.success('🎤 Voice assistant ON — always listening!', { duration: 3000 });
    } else {
      stopListening();
      if (isEnabled === false && recognitionRef.current === null) {
        // was just turned off
      }
    }
    return () => stopListening();
  }, [isEnabled]); // eslint-disable-line

  // Restart when language changes
  useEffect(() => {
    if (isEnabled) {
      stopListening();
      setTimeout(() => startListening(), 300);
    }
  }, [currentLang]); // eslint-disable-line

  const toggleAssistant = () => {
    if (isEnabled) {
      setIsEnabled(false);
      toast.info('🎤 Voice assistant OFF');
      speak('Voice assistant deactivated', currentLang);
    } else {
      setIsEnabled(true);
    }
  };

  return (
    <div className="fixed bottom-24 right-4 z-40 flex flex-col items-end gap-2">
      {/* Transcript bubble */}
      {isEnabled && transcript && (
        <div className="bg-black/80 text-white text-xs px-3 py-2 rounded-xl max-w-[200px] text-right animate-fade-in-up">
          "{transcript}"
        </div>
      )}

      {/* Status indicator */}
      {isEnabled && (
        <div className="flex items-center gap-1.5 bg-black/70 text-white text-xs px-3 py-1.5 rounded-full">
          <span className={`w-2 h-2 rounded-full ${isListening ? 'bg-red-400 animate-pulse' : 'bg-yellow-400'}`} />
          <span>{isListening ? 'Listening...' : 'Starting...'}</span>
        </div>
      )}

      {/* Main button */}
      <button
        onClick={toggleAssistant}
        className="relative w-14 h-14 rounded-full shadow-2xl flex items-center justify-center transition-all duration-300 hover:scale-110 active:scale-95"
        style={{
          background: isEnabled
            ? 'linear-gradient(135deg, #ef4444, #dc2626)'
            : 'linear-gradient(135deg, #1a1a2e, #16213e)',
        }}
        title={isEnabled ? 'Tap to turn off voice assistant' : 'Tap to activate voice assistant'}
      >
        {/* Pulse rings when listening */}
        {isEnabled && isListening && (
          <>
            <span className="absolute inset-0 rounded-full animate-ping opacity-20 bg-red-400" />
            <span className="absolute inset-[-6px] rounded-full animate-ping opacity-10 bg-red-400" style={{ animationDelay: '0.3s' }} />
          </>
        )}

        {isEnabled ? (
          <Mic className="w-6 h-6 text-white" />
        ) : (
          <Mic className="w-6 h-6 text-white opacity-70" />
        )}
      </button>

      {/* Label */}
      <span className="text-[10px] text-gray-500 font-medium">
        {isEnabled ? 'Voice ON' : 'Voice'}
      </span>
    </div>
  );
};

export default VoiceAssistant;
