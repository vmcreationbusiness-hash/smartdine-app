// On-the-fly translation using Google Translate (unofficial free endpoint)
// Caches in localStorage to avoid repeated calls

const CACHE_PREFIX = 'smartdine_tx2_';

// Google Translate language codes
const LANG_MAP = {
  hi: 'hi',  // Hindi
  kn: 'kn',  // Kannada
  te: 'te',  // Telugu
  ta: 'ta',  // Tamil
  ml: 'ml',  // Malayalam
};

const getCacheKey = (text, lang) => {
  try { return CACHE_PREFIX + lang + '_' + btoa(unescape(encodeURIComponent(text))).slice(0, 50); }
  catch { return CACHE_PREFIX + lang + '_' + text.slice(0, 30); }
};

const getCached = (text, lang) => {
  try { return localStorage.getItem(getCacheKey(text, lang)); } catch { return null; }
};

const setCache = (text, lang, translated) => {
  try { localStorage.setItem(getCacheKey(text, lang), translated); } catch {}
};

export const translateText = async (text, targetLang) => {
  if (!text || !text.trim() || targetLang === 'en') return text;

  const cached = getCached(text, targetLang);
  if (cached) return cached;

  const gl = LANG_MAP[targetLang] || targetLang;

  try {
    // Google Translate unofficial endpoint — works without API key
    const url = `https://translate.googleapis.com/translate_a/single?client=gtx&sl=en&tl=${gl}&dt=t&q=${encodeURIComponent(text)}`;
    const res = await fetch(url, { signal: AbortSignal.timeout(5000) });
    const data = await res.json();
    // Response format: [[[translated, original, ...], ...], ...]
    const translated = data?.[0]?.map(chunk => chunk?.[0]).filter(Boolean).join('');
    if (translated && translated.trim()) {
      setCache(text, targetLang, translated);
      return translated;
    }
  } catch (e) {
    console.warn('Translation failed:', e);
  }

  return text; // fallback to original
};

export const translateBatch = async (texts, targetLang) => {
  if (targetLang === 'en') return texts;
  return Promise.all(texts.map(t => translateText(t, targetLang)));
};

export const translateMenuItem = async (item, targetLang) => {
  if (targetLang === 'en') return { name: item.name, description: item.description };

  // Use DB translations if available
  if (item.translations?.[targetLang]?.name &&
      item.translations[targetLang].name !== item.name) {
    return {
      name: item.translations[targetLang].name,
      description: item.translations[targetLang].description || item.description,
    };
  }

  // Translate on-the-fly via Google Translate
  const [name, description] = await Promise.all([
    translateText(item.name, targetLang),
    translateText(item.description || '', targetLang),
  ]);
  return { name, description };
};
