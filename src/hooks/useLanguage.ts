import { useState, useEffect } from 'react';

export type Language = 'en' | 'zh-TW' | 'zh-CN' | 'ja' | 'ko' | 'es';

export interface LanguageOption {
  code: Language;
  name: string;
  flag: string;
}

export const LANGUAGE_OPTIONS: LanguageOption[] = [
  { code: 'en', name: 'English', flag: '🇺🇸' },
  { code: 'zh-TW', name: '繁體中文', flag: '🇹🇼' },
  { code: 'zh-CN', name: '简体中文', flag: '🇨🇳' },
  { code: 'ja', name: '日本語', flag: '🇯🇵' },
  { code: 'ko', name: '한국어', flag: '🇰🇷' },
  { code: 'es', name: 'Español', flag: '🇪🇸' }
];

export const useLanguage = () => {
  const [language, setLanguage] = useState<Language>(() => {
    // 檢查 localStorage 中的語言設定
    const savedLanguage = localStorage.getItem('twin3-language') as Language;
    if (savedLanguage && LANGUAGE_OPTIONS.some(opt => opt.code === savedLanguage)) {
      return savedLanguage;
    }
    
    // 檢查瀏覽器語言偏好
    const browserLang = navigator.language.toLowerCase();
    if (browserLang.startsWith('zh-tw') || browserLang.startsWith('zh-hant')) {
      return 'zh-TW';
    } else if (browserLang.startsWith('zh-cn') || browserLang.startsWith('zh-hans') || browserLang.startsWith('zh')) {
      return 'zh-CN';
    } else if (browserLang.startsWith('ja')) {
      return 'ja';
    } else if (browserLang.startsWith('ko')) {
      return 'ko';
    } else if (browserLang.startsWith('es')) {
      return 'es';
    }
    
    return 'en'; // 默認英文
  });

  useEffect(() => {
    // 儲存到 localStorage
    localStorage.setItem('twin3-language', language);
    
    // 更新 document 的 lang 屬性
    document.documentElement.lang = language;
    
    // 觸發自定義事件通知其他組件語言已變更
    window.dispatchEvent(new CustomEvent('languageChanged', { detail: language }));
  }, [language]);

  const changeLanguage = (newLanguage: Language) => {
    setLanguage(newLanguage);
  };

  return { language, changeLanguage };
};