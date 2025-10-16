import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Search, Zap, Database, CheckCircle, Clock, Tag, Calculator, TrendingUp, Brain, Activity, Cpu } from 'lucide-react';
import { useLanguage } from '../hooks/useLanguage';
import { useTranslation } from '../utils/translations';

interface AlgorithmStepsProps {
  currentStep: string;
  results: any;
  isProcessing: boolean;
}

const AlgorithmSteps: React.FC<AlgorithmStepsProps> = ({ currentStep, results, isProcessing }) => {
  const { language } = useLanguage();
  const t = useTranslation(language);

  const steps = [
    {
      id: 'msmm',
      name: t.algorithm.msmm,
      icon: Search,
      description: t.algorithm.msmmDesc,
      color: 'bg-blue-500',
      details: language === 'en' ? 'AI analyzes text and image content, extracts key concept tags' :
               language === 'zh-CN' ? 'AI分析文字和图片内容，提取关键概念标签' :
               language === 'ja' ? 'AIがテキストと画像コンテンツを分析し、キーコンセプトタグを抽出' :
               language === 'ko' ? 'AI가 텍스트와 이미지 콘텐츠를 분석하여 핵심 개념 태그를 추출' :
               language === 'es' ? 'La IA analiza contenido de texto e imagen, extrae etiquetas de conceptos clave' :
               'AI分析文字和圖片內容，提取關鍵概念標籤'
    },
    {
      id: 'ultu',
      name: t.algorithm.ultu,
      icon: Zap,
      description: t.algorithm.ultuDesc,
      color: 'bg-green-500',
      details: language === 'en' ? 'AI scoring based on dimension definitions, applies intelligent smoothing strategies' :
               language === 'zh-CN' ? '基于维度定义进行AI评分，应用智能平滑策略' :
               language === 'ja' ? '次元定義に基づくAIスコアリング、インテリジェント平滑化戦略を適用' :
               language === 'ko' ? '차원 정의를 기반으로 한 AI 점수, 지능형 평활화 전략 적용' :
               language === 'es' ? 'Puntuación de IA basada en definiciones de dimensiones, aplica estrategias de suavizado inteligente' :
               '基於維度定義進行AI評分，應用智能平滑策略'
    },
    {
      id: 'complete',
      name: t.algorithm.matrixUpdate,
      icon: Database,
      description: t.algorithm.matrixDesc,
      color: 'bg-purple-500',
      details: language === 'en' ? 'Updates user\'s 256-dimension feature matrix' :
               language === 'zh-CN' ? '更新用户的256维度特征矩阵' :
               language === 'ja' ? 'ユーザーの256次元特徴マトリックスを更新' :
               language === 'ko' ? '사용자의 256차원 특성 매트릭스 업데이트' :
               language === 'es' ? 'Actualiza la matriz de características de 256 dimensiones del usuario' :
               '更新用戶的256維度特徵矩陣'
    }
  ];

  const getStepStatus = (stepId: string) => {
    if (!isProcessing) return 'idle';
    if (currentStep === stepId) return 'active';
    if (steps.findIndex(s => s.id === stepId) < steps.findIndex(s => s.id === currentStep)) return 'complete';
    return 'pending';
  };

  return (
    <div className="bg-black text-green-400 rounded-lg border-2 border-gray-600 p-4 h-[calc(50vh-60px)] font-mono text-sm overflow-auto shadow-lg">
      {/* Terminal Header */}
      <div className="text-green-300 mb-4 border-b border-green-600 pb-2">
        <div className="flex items-center space-x-2">
          <span className="text-green-500">●</span>
          <span>{t.algorithm.title}</span>
        </div>
        <div className="text-green-600 text-xs mt-1">
          Process: MSMM → ULTU → Matrix Update | {t.algorithm.status}: {isProcessing ? 'RUNNING' : 'IDLE'}
        </div>
      </div>

      {/* Terminal Content */}
      <div className="space-y-3">
        {steps.map((step, index) => {
          const status = getStepStatus(step.id);
          
          return (
            <div key={step.id} className="space-y-1">
              {/* Step Header */}
              <div className="flex items-center space-x-2">
                <span className={`${
                  status === 'active' ? 'text-yellow-400' :
                  status === 'complete' ? 'text-green-400' :
                  'text-gray-500'
                }`}>
                  {status === 'active' ? t.algorithm.running :
                   status === 'complete' ? t.algorithm.complete :
                   t.algorithm.pending}
                </span>
                <span className="text-green-300">{step.name}</span>
                {status === 'active' && (
                  <motion.span
                    animate={{ opacity: [0.5, 1, 0.5] }}
                    transition={{ duration: 1, repeat: Infinity }}
                    className="text-yellow-400"
                  >
                    ●●●
                  </motion.span>
                )}
              </div>
              
              {/* Step Details */}
              <div className="text-green-600 text-xs ml-4">
                └─ {step.description}
              </div>
              
              {/* Step Results */}
              <AnimatePresence>
                {results && currentStep === step.id && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    exit={{ opacity: 0, height: 0 }}
                    className="ml-4 text-xs space-y-1"
                  >
                    {step.id === 'msmm' && results.metaTags && (
                      <div className="space-y-1">
                        <div className="text-cyan-400">
                          ├─ {t.algorithm.extractedTags}: {results.metaTags.length}
                        </div>
                        <div className="text-green-500 ml-2">
                          └─ Tags: {results.metaTags.slice(0, 3).join(', ')}
                          {results.metaTags.length > 3 && ` +${results.metaTags.length - 3} ${t.common.more}`}
                        </div>
                        {results.matchedDimensions && (
                          <div className="text-yellow-400 ml-2">
                          └─ {t.algorithm.matchedDimensions}: {results.matchedDimensions.length}
                          </div>
                        )}
                      </div>
                    )}

                    {step.id === 'ultu' && results.updates && (
                      <div className="space-y-1">
                        <div className="text-cyan-400">
                          ├─ {t.algorithm.dimensionsUpdated}: {Object.keys(results.updates).length}
                        </div>
                        {Object.entries(results.updates).slice(0, 3).map(([dimId, score]: [string, any], idx: number) => (
                          <div key={dimId} className="text-green-500 ml-2">
                            ├─ {dimId}: {score}/255
                          </div>
                        ))}
                        {Object.keys(results.updates).length > 3 && (
                          <div className="text-green-600 ml-2">
                            └─ +{Object.keys(results.updates).length - 3} {t.common.more} {t.common.updates}
                          </div>
                        )}
                      </div>
                    )}

                    {step.id === 'complete' && results.totalUpdates && (
                      <div className="space-y-1">
                        <div className="text-cyan-400">
                          ├─ {t.algorithm.matrixUpdate} {t.algorithm.complete}
                        </div>
                        <div className="text-green-500 ml-2">
                          └─ {t.matrix.totalUpdates}: {results.totalUpdates} {t.performance.dimensions}
                        </div>
                      </div>
                    )}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          );
        })}
      </div>

      {/* Terminal Footer */}
      <div className="mt-4 pt-2 border-t border-green-600 text-green-600 text-xs">
        <div className="flex justify-between">
          <span>twin3@algorithm:~$</span>
          <span>{new Date().toLocaleTimeString()}</span>
        </div>
        {isProcessing && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="mt-2 text-yellow-400"
          >
            <motion.span
              animate={{ opacity: [1, 0.3, 1] }}
              transition={{ duration: 1, repeat: Infinity }}
            >
              {t.algorithm.processingContent}
            </motion.span>
          </motion.div>
        )}
      </div>
    </div>
  );
};

export default AlgorithmSteps;