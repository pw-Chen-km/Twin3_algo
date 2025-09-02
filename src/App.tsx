import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useTheme } from './hooks/useTheme';
import { useLanguage } from './hooks/useLanguage';
import { useTranslation } from './utils/translations';
import Header from './components/Header';
import ConversationPanel from './components/ConversationPanel';
import ProcessingPipeline from './components/ProcessingPipeline';
import MatrixVisualization from './components/MatrixVisualization';
import ActivityFeed from './components/ActivityFeed';
import PerformanceDashboard from './components/PerformanceDashboard';
import AlgorithmSteps from './components/AlgorithmSteps';
import { ProcessingState, UserContent, MatrixUpdate, DimensionHistory } from './types';
import { processContentWithTwin3Algorithm } from './utils/twin3Processor';
import { aiResponseService, AIResponse } from './utils/aiResponseService';

interface Message {
  id: string;
  type: 'user' | 'ai' | 'system';
  content: string;
  image?: File | string;
  timestamp: string;
  aiResponse?: AIResponse;
  matrixUpdates?: Record<string, number>;
  processingTime?: number;
}

function App() {
  const { theme } = useTheme();
  const { language } = useLanguage();
  const t = useTranslation(language);
  const [selectedUser, setSelectedUser] = useState<number>(1);
  const [processingState, setProcessingState] = useState<ProcessingState>('idle');
  const [currentContent, setCurrentContent] = useState<UserContent | null>(null);
  const [matrixData, setMatrixData] = useState<Record<string, number>>({});
  const [dimensionHistory, setDimensionHistory] = useState<Record<string, DimensionHistory>>({});
  const [activityLog, setActivityLog] = useState<any[]>([]);
  const [isAutoProcess, setIsAutoProcess] = useState(true);
  const [processingSpeed, setProcessingSpeed] = useState(1);
  const [currentAlgorithmStep, setCurrentAlgorithmStep] = useState<string>('');
  const [algorithmResults, setAlgorithmResults] = useState<any>(null);
  const [messages, setMessages] = useState<Message[]>([
    {
      id: 'welcome',
      type: 'system',
      content: language === 'en' ? 'Welcome to twin3 intelligent analysis system! Share your experiences and AI will provide personalized insights.' :
               language === 'zh-CN' ? '欢迎使用 twin3 智能分析系统！请分享您的体验，AI 将为您提供个性化洞察。' :
               language === 'ja' ? 'twin3 インテリジェント分析システムへようこそ！あなたの体験をシェアしてください。AIがパーソナライズされた洞察を提供します。' :
               language === 'ko' ? 'twin3 지능형 분석 시스템에 오신 것을 환영합니다! 경험을 공유하시면 AI가 개인화된 통찰을 제공합니다.' :
               language === 'es' ? '¡Bienvenido al sistema de análisis inteligente twin3! Comparte tus experiencias y la IA te proporcionará perspectivas personalizadas.' :
               '歡迎使用 twin3 智能分析系統！請分享您的體驗，AI 將為您提供個人化洞察。',
      timestamp: new Date().toISOString()
    }
  ]);

  const handleContentSubmit = async (content: UserContent) => {
    if (processingState === 'processing') return;
    
    // Add user message
    const userMessage: Message = {
      id: `user-${Date.now()}`,
      type: 'user',
      content: content.text,
      image: content.image,
      timestamp: new Date().toISOString()
    };
    setMessages(prev => [...prev, userMessage]);
    
    setCurrentContent(content);
    setProcessingState('processing');
    setCurrentAlgorithmStep('msmm');
    setAlgorithmResults(null);
    
    try {
      // Process with real Twin3 algorithm
      const result = await processContentWithTwin3Algorithm(
        content, 
        processingSpeed, 
        matrixData,
        (step: string, data: any) => {
          setCurrentAlgorithmStep(step);
          setAlgorithmResults(data);
        }
      );
      
      // Generate AI response
      try {
        console.log('🤖 開始生成AI回應...');
        const response = await aiResponseService.generateResponse(content, result.metaTags);
        console.log('✅ AI回應生成完成:', response);
        
        // Add AI response message
        const aiMessage: Message = {
          id: `ai-${Date.now()}`,
          type: 'ai',
          content: response.message,
          timestamp: new Date().toISOString(),
          aiResponse: response,
          matrixUpdates: result.matrixUpdates,
          processingTime: result.processingTime
        };
        setMessages(prev => [...prev, aiMessage]);
        
      } catch (error) {
        console.error('❌ AI回應生成失敗:', error);
        
        // Add fallback AI response
        const fallbackMessage: Message = {
          id: `ai-fallback-${Date.now()}`,
          type: 'ai',
          content: "感謝您分享這個體驗！系統已成功分析並更新您的Twin Matrix。",
          timestamp: new Date().toISOString(),
          aiResponse: {
            message: "感謝您分享這個體驗！系統已成功分析並更新您的Twin Matrix。",
            insights: ["您的行為模式已被記錄和分析"],
            recommendations: ["繼續保持積極的生活態度", "記錄更多有意義的體驗"],
            emotionalTone: "正面積極",
            analysisConfidence: 0.8
          },
          matrixUpdates: result.matrixUpdates,
          processingTime: result.processingTime
        };
        setMessages(prev => [...prev, fallbackMessage]);
      }
      
      // Update matrix data and track changes
      const previousMatrix = { ...matrixData };
      const newMatrixData = {
        ...previousMatrix,
        ...result.matrixUpdates
      };
      setMatrixData(newMatrixData);
      
      // Update dimension history with calculation details
      setDimensionHistory(prev => {
        const newHistory = { ...prev };
        Object.entries(result.matrixUpdates).forEach(([dimId, newScore]) => {
          const previousScore = previousMatrix[dimId] || 128;
          const change = newScore - previousScore;
          
          if (!newHistory[dimId]) {
            newHistory[dimId] = {
              updates: [],
              totalUpdates: 0,
              firstSeen: new Date().toISOString(),
              lastUpdated: new Date().toISOString()
            };
          }
          
          newHistory[dimId].updates.push({
            timestamp: new Date().toISOString(),
            previousScore,
            newScore,
            change,
            content: content.text,
            hasImage: !!content.image,
            calculationDetails: result.calculationDetails?.[dimId] || null
          });
          
          newHistory[dimId].totalUpdates += 1;
          newHistory[dimId].lastUpdated = new Date().toISOString();
          
          // Keep only last 20 updates per dimension
          if (newHistory[dimId].updates.length > 20) {
            newHistory[dimId].updates = newHistory[dimId].updates.slice(-20);
          }
        });
        return newHistory;
      });
      
      // Add to activity log
      setActivityLog(prev => [
        {
          id: Date.now(),
          timestamp: new Date().toISOString(),
          content: content.text,
          image: content.image,
          updates: result.matrixUpdates,
          metaTags: result.metaTags,
          processingTime: result.processingTime,
          algorithmSteps: result.algorithmSteps,
          changes: Object.entries(result.matrixUpdates).map(([dimId, newScore]) => ({
            dimensionId: dimId,
            previousScore: previousMatrix[dimId] || 0,
            newScore,
            change: newScore - (previousMatrix[dimId] || 0)
          }))
        },
        ...prev.slice(0, 49) // Keep last 50 entries
      ]);
      
      setProcessingState('complete');
      
      // Auto-reset after showing results
      setTimeout(() => {
        setProcessingState('idle');
        setCurrentContent(null);
        setCurrentAlgorithmStep('');
        setAlgorithmResults(null);
      }, 1500);
      
    } catch (error) {
      console.error('Processing error:', error);
      setProcessingState('error');
      
      // Add error message
      const errorMessage: Message = {
        id: `error-${Date.now()}`,
        type: 'system',
        content: language === 'en' ? 'An error occurred during processing, please try again later.' :
                 language === 'zh-CN' ? '处理过程中发生错误，请稍后再试。' :
                 language === 'ja' ? '処理中にエラーが発生しました。後でもう一度お試しください。' :
                 language === 'ko' ? '처리 중 오류가 발생했습니다. 나중에 다시 시도해주세요.' :
                 language === 'es' ? 'Ocurrió un error durante el procesamiento, por favor inténtalo de nuevo más tarde.' :
                 '處理過程中發生錯誤，請稍後再試。',
        timestamp: new Date().toISOString()
      };
      setMessages(prev => [...prev, errorMessage]);
      
      setTimeout(() => setProcessingState('idle'), 3000);
    }
  };

  const handleUserChange = (userId: number) => {
    setSelectedUser(userId);
    // In a real app, this would load the user's matrix state
    setMatrixData({});
    setDimensionHistory({});
    setActivityLog([]);
    setMessages([
      {
        id: `welcome-${userId}`,
        type: 'system',
        content: language === 'en' ? `Switched to User ${userId}. Welcome to twin3 intelligent analysis system!` :
                 language === 'zh-CN' ? `已切换到用户 ${userId}。欢迎使用 twin3 智能分析系统！` :
                 language === 'ja' ? `ユーザー ${userId} に切り替えました。twin3 インテリジェント分析システムへようこそ！` :
                 language === 'ko' ? `사용자 ${userId}로 전환했습니다. twin3 지능형 분석 시스템에 오신 것을 환영합니다!` :
                 language === 'es' ? `Cambiado al Usuario ${userId}. ¡Bienvenido al sistema de análisis inteligente twin3!` :
                 `已切換到用戶 ${userId}。歡迎使用 twin3 智能分析系統！`,
        timestamp: new Date().toISOString()
      }
    ]);
  };

  return (
    <div className={`min-h-screen transition-colors duration-300 ${
      theme === 'dark' 
        ? 'bg-gray-900 text-gray-100' 
        : 'bg-white text-gray-900'
    }`}>
      <Header 
        selectedUser={selectedUser}
        onUserChange={handleUserChange}
        processingState={processingState}
      />
      
      <div className="container mx-auto px-4 py-6">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 h-[calc(100vh-120px)]">
          {/* Left Panel - Input & Controls */}
          <div className="lg:col-span-5 space-y-4">
            <ConversationPanel
              messages={messages}
              onContentSubmit={handleContentSubmit}
              isProcessing={processingState === 'processing'}
              processingState={processingState}
            />
          </div>
          
          {/* Main Visualization Area */}
          <div className="lg:col-span-4 space-y-4">
            <MatrixVisualization
              matrixData={matrixData}
              processingState={processingState}
              dimensionHistory={dimensionHistory}
            />
          </div>
          
          {/* Right Panel - Activity & Performance */}
          <div className="lg:col-span-3 space-y-4">
            <AlgorithmSteps
              currentStep={currentAlgorithmStep}
              results={algorithmResults}
              isProcessing={processingState === 'processing'}
            />
            
            <ActivityFeed
              activities={activityLog}
              processingState={processingState}
            />
          </div>
        </div>
      </div>
    </div>
  );
}

export default App;