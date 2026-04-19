import React, { createContext, useContext, useState, useMemo } from 'react';
import translations from './index.js';

const I18nContext = createContext({ locale: 'de', t: (k) => k, setLocale: () => {} });

export function LanguageProvider({ defaultLocale = 'de', children }) {
  const [locale, setLocale] = useState(defaultLocale);

  const t = useMemo(() => {
    return (key, vars = {}) => {
      const parts = key.split('.');
      let s = translations[locale];
      for (const p of parts) {
        if (!s) break;
        s = s[p];
      }
      if (typeof s !== 'string') return key;
      return s.replace(/\{([^}]+)\}/g, (_, name) => (vars[name] != null ? String(vars[name]) : `{${name}}`));
    };
  }, [locale]);

  return (
    <I18nContext.Provider value={{ locale, t, setLocale }}>
      {children}
    </I18nContext.Provider>
  );
}

export function useTranslation() {
  return useContext(I18nContext);
}

export default I18nContext;

