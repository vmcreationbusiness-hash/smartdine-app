// On-the-fly translation service using MyMemory (free, no API key)
// Caches translations in localStorage to avoid repeated API calls

const CACHE_PREFIX = 'smartdine_tx_';
const LANG_MAP = {
  hi: 'hi-IN',
  kn: 'kn-IN',
  te: 'te-IN',
  ta: 'ta-IN',
  ml: 'ml-IN',
};

const getCacheKey = (text, lang) => CACHE_PREFIX + lang + '_' + btoa(encodeURIComponent(text)).slice(0, 40);

const getCached = (text, lang) => {
  try { return localStorage.getItem(getCacheKey(text, lang)); } catch { return null; }
};

const setCache = (text, lang, translated) => {
  try { localStorage.setItem(getCacheKey(text, lang), translated); } catch {}
};

// Translate a single text
export const translateText = async (text, targetLang) => {
  if (!text || targetLang === 'en') return text;

  // Check cache first
  const cached = getCached(text, targetLang);
  if (cached) return cached;

  const myMemoryLang = LANG_MAP[targetLang] || targetLang;
  try {
    const res = await fetch(
      `https://api.mymemory.translated.net/get?q=${encodeURIComponent(text)}&langpair=en|${myMemoryLang}`,
      { signal: AbortSignal.timeout(4000) }
    );
    const data = await res.json();
    const translated = data?.responseData?.translatedText;
    if (translated && translated.toLowerCase() !== text.toLowerCase() && !translated.includes('MYMEMORY')) {
      setCache(text, targetLang, translated);
      return translated;
    }
  } catch {}
  return text; // fallback to original
};

// Translate multiple texts at once
export const translateBatch = async (texts, targetLang) => {
  if (targetLang === 'en') return texts;
  return Promise.all(texts.map(t => translateText(t, targetLang)));
};

// Hook: translate a menu item's name and description
export const translateMenuItem = async (item, targetLang) => {
  if (targetLang === 'en') return { name: item.name, description: item.description };

  // Check if DB already has translation
  if (item.translations?.[targetLang]?.name) {
    return {
      name: item.translations[targetLang].name,
      description: item.translations[targetLang].description || item.description,
    };
  }

  // Translate on-the-fly
  const [name, description] = await translateBatch(
    [item.name, item.description || ''],
    targetLang
  );
  return { name, description };
};
