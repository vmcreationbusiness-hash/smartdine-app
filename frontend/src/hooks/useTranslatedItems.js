import { useState, useEffect, useRef } from 'react';
import { translateMenuItem } from '../utils/translationService';

// Hook to get menu items translated to current language
// Translates in background, shows original first, replaces with translated
export const useTranslatedItems = (items, currentLang) => {
  const [translatedItems, setTranslatedItems] = useState(items);
  const langRef = useRef(currentLang);
  const abortRef = useRef(false);

  useEffect(() => {
    setTranslatedItems(items); // Show original immediately
    if (!items.length || currentLang === 'en') {
      setTranslatedItems(items);
      return;
    }

    langRef.current = currentLang;
    abortRef.current = false;

    const translateAll = async () => {
      const results = await Promise.all(
        items.map(item => translateMenuItem(item, currentLang))
      );

      // Only update if language hasn't changed during translation
      if (!abortRef.current && langRef.current === currentLang) {
        setTranslatedItems(
          items.map((item, i) => ({
            ...item,
            _displayName: results[i].name,
            _displayDescription: results[i].description,
          }))
        );
      }
    };

    translateAll();

    return () => { abortRef.current = true; };
  }, [items, currentLang]);

  return translatedItems;
};
