import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Globe, ChevronDown } from 'lucide-react';
import { useLanguage, LANGUAGE_OPTIONS, Language } from '../hooks/useLanguage';

const LanguageSwitcher: React.FC = () => {
  const { language, changeLanguage } = useLanguage();
  const [isOpen, setIsOpen] = useState(false);

  const currentLanguage = LANGUAGE_OPTIONS.find(opt => opt.code === language);

  const handleLanguageChange = (newLanguage: Language) => {
    changeLanguage(newLanguage);
    setIsOpen(false);
  };

  return (
    <div className="relative">
      <motion.button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center space-x-2 px-3 py-2 bg-white dark:bg-gray-800 border-2 border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
        whileHover={{ scale: 1.02 }}
        whileTap={{ scale: 0.98 }}
      >
        <Globe className="w-4 h-4 text-gray-600 dark:text-gray-400" />
        <span className="text-lg">{currentLanguage?.flag}</span>
        <span className="text-sm font-medium text-gray-900 dark:text-gray-100">
          {currentLanguage?.name}
        </span>
        <ChevronDown className={`w-4 h-4 text-gray-600 dark:text-gray-400 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
      </motion.button>

      <AnimatePresence>
        {isOpen && (
          <>
            {/* Backdrop */}
            <div 
              className="fixed inset-0 z-40" 
              onClick={() => setIsOpen(false)}
            />
            
            {/* Dropdown */}
            <motion.div
              initial={{ opacity: 0, y: -10, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -10, scale: 0.95 }}
              transition={{ duration: 0.2 }}
              className="absolute top-full mt-2 right-0 bg-white dark:bg-gray-800 border-2 border-gray-300 dark:border-gray-600 rounded-lg shadow-xl z-50 min-w-[200px]"
            >
              <div className="py-2">
                {LANGUAGE_OPTIONS.map((option) => (
                  <motion.button
                    key={option.code}
                    onClick={() => handleLanguageChange(option.code)}
                    className={`w-full flex items-center space-x-3 px-4 py-2 text-left hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors ${
                      language === option.code ? 'bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400' : 'text-gray-900 dark:text-gray-100'
                    }`}
                    whileHover={{ x: 4 }}
                  >
                    <span className="text-lg">{option.flag}</span>
                    <span className="text-sm font-medium">{option.name}</span>
                    {language === option.code && (
                      <div className="ml-auto w-2 h-2 bg-blue-600 dark:bg-blue-400 rounded-full" />
                    )}
                  </motion.button>
                ))}
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
};

export default LanguageSwitcher;