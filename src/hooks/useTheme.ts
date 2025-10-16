import { useState, useEffect } from 'react';

export type Theme = 'light' | 'dark';

export const useTheme = () => {
  const [theme, setTheme] = useState<Theme>(() => {
    // 檢查 localStorage 中的主題設定
    const savedTheme = localStorage.getItem('twin3-theme') as Theme;
    if (savedTheme) {
      return savedTheme;
    }
    
    // 檢查系統偏好設定
    if (window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches) {
      return 'dark';
    }
    
    return 'light';
  });

  useEffect(() => {
    // 更新 document 的 class
    document.documentElement.classList.remove('light', 'dark');
    document.documentElement.classList.add(theme);
    
    // 儲存到 localStorage
    localStorage.setItem('twin3-theme', theme);
    
    // 更新 meta theme-color
    const metaThemeColor = document.querySelector('meta[name="theme-color"]');
    if (metaThemeColor) {
      metaThemeColor.setAttribute('content', theme === 'dark' ? '#0f172a' : '#ffffff');
    }
  }, [theme]);

  const toggleTheme = () => {
    setTheme(prev => prev === 'light' ? 'dark' : 'light');
  };

  return { theme, toggleTheme };
};