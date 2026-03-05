import { useState, useRef, useEffect } from 'react';
import { Globe, ChevronDown } from 'lucide-react';
import { useTheme } from '../contexts/ThemeContext';
import { useLanguage } from '../contexts/LanguageContext';

export const LanguageSwitcher = () => {
  const { currentLang, currentLanguage, changeLanguage, languages } = useLanguage();
  const { theme } = useTheme();
  const [open, setOpen] = useState(false);
  const ref = useRef(null);

  useEffect(() => {
    const handleClick = (e) => {
      if (ref.current && !ref.current.contains(e.target)) setOpen(false);
    };
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, []);

  return (
    <div className="fixed top-[60px] right-4 z-50" ref={ref} data-testid="language-switcher">
      <button
        onClick={() => setOpen(!open)}
        className="flex items-center gap-1.5 px-3 py-1.5 rounded-full glass-strong shadow-lg text-sm font-semibold transition-all hover:shadow-xl"
        style={{ color: theme.primaryColor }}
        data-testid="language-switcher-button"
      >
        <Globe className="w-3.5 h-3.5" />
        <span>{currentLanguage.flag}</span>
        <ChevronDown className={`w-3 h-3 transition-transform ${open ? 'rotate-180' : ''}`} />
      </button>
      {open && (
        <div className="absolute top-full right-0 mt-2 glass-strong rounded-xl shadow-2xl overflow-hidden min-w-[160px] animate-fade-in-up">
          {languages.map((lang) => (
            <button
              key={lang.code}
              onClick={() => { changeLanguage(lang.code); setOpen(false); }}
              className="w-full px-4 py-2.5 text-left text-sm hover:bg-white/50 transition-colors flex items-center justify-between"
              style={currentLang === lang.code ? { backgroundColor: `${theme.primaryColor}12`, color: theme.primaryColor, fontWeight: 600 } : {}}
              data-testid={`lang-${lang.code}`}
            >
              <span>{lang.nativeName}</span>
              <span className="text-xs opacity-50">{lang.flag}</span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
};
