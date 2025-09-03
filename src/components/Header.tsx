import React from 'react';
import { Brain, Users, Activity, AlertCircle, CheckCircle, Clock } from 'lucide-react';
import { ProcessingState } from '../types';
import ThemeToggle from './ThemeToggle';
import LanguageSwitcher from './LanguageSwitcher';
import { useLanguage } from '../hooks/useLanguage';
import { useTranslation } from '../utils/translations';

interface HeaderProps {
  selectedUser: number;
  onUserChange: (userId: number) => void;
  processingState: ProcessingState;
}

const Header: React.FC<HeaderProps> = ({ selectedUser, onUserChange, processingState }) => {
  const { language } = useLanguage();
  const t = useTranslation(language);

  const getStatusIcon = () => {
    switch (processingState) {
      case 'processing':
        return <Clock className="w-5 h-5 animate-spin text-blue-400" />;
      case 'complete':
        return <CheckCircle className="w-5 h-5 text-green-400" />;
      case 'error':
        return <AlertCircle className="w-5 h-5 text-red-400" />;
      default:
        return <Activity className="w-5 h-5 text-gray-400" />;
    }
  };

  const getStatusText = () => {
    switch (processingState) {
      case 'processing':
        return t.status.processing;
      case 'complete':
        return t.status.complete;
      case 'error':
        return t.status.error;
      default:
        return t.status.ready;
    }
  };

  return (
    <header className="bg-card border-b border-border">
      <div className="container mx-auto px-4 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <div className="flex items-center space-x-2">
              <Brain className="w-8 h-8 text-primary" />
              <div>
                <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">{t.title}</h1>
                <p className="text-sm text-muted-foreground">{t.subtitle}</p>
              </div>
            </div>
          </div>
          
          <div className="flex items-center space-x-6">
            <LanguageSwitcher />
            <ThemeToggle />
            
            <div className="flex items-center space-x-2">
              <Users className="w-4 h-4 text-muted-foreground" />
              <select
                value={selectedUser}
                onChange={(e) => onUserChange(Number(e.target.value))}
                className="bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 px-3 py-1 rounded-md border border-gray-300 dark:border-gray-600 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-colors"
              >
                <option value={1}>{t.common.user} 1</option>
                <option value={2}>{t.common.user} 2</option>
                <option value={3}>{t.common.user} 3</option>
                <option value={4}>{t.common.user} 4</option>
                <option value={5}>{t.common.user} 5</option>
              </select>
            </div>
            
            <div className="flex items-center space-x-2 px-3 py-1 bg-gray-100 dark:bg-gray-800 rounded-md border border-gray-300 dark:border-gray-600">
              {getStatusIcon()}
              <span className="text-sm font-medium text-gray-900 dark:text-gray-100">{getStatusText()}</span>
            </div>
          </div>
        </div>
      </div>
    </header>
  );
};

export default Header;