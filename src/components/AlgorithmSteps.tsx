import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Search, Zap, Database, CheckCircle, Clock, Tag, Calculator, TrendingUp, Brain, Activity, Cpu } from 'lucide-react';

interface AlgorithmStepsProps {
  currentStep: string;
  results: any;
  isProcessing: boolean;
}

const AlgorithmSteps: React.FC<AlgorithmStepsProps> = ({ currentStep, results, isProcessing }) => {
  const steps = [
    {
      id: 'msmm',
      name: 'MSMM 語意匹配',
      icon: Search,
      description: 'Gemini 2.5 Flash 提取Meta-Tags',
      color: 'bg-blue-500',
      details: 'AI分析文字和圖片內容，提取關鍵概念標籤'
    },
    {
      id: 'ultu',
      name: 'ULTU 動態評分',
      icon: Zap,
      description: '精確評分與分數平滑',
      color: 'bg-green-500',
      details: '基於維度定義進行AI評分，應用智能平滑策略'
    },
    {
      id: 'complete',
      name: '矩陣更新',
      icon: Database,
      description: 'Twin Matrix狀態更新',
      color: 'bg-purple-500',
      details: '更新用戶的256維度特徵矩陣'
    }
  ];

  const getStepStatus = (stepId: string) => {
    if (!isProcessing) return 'idle';
    if (currentStep === stepId) return 'active';
    if (steps.findIndex(s => s.id === stepId) < steps.findIndex(s => s.id === currentStep)) return 'complete';
    return 'pending';
  };

  return (
    <div className="bg-white rounded-lg border border-gray-200 p-4 h-[calc(50vh-60px)] shadow-sm">
      <h3 className="text-lg font-semibold mb-4 flex items-center">
        <Brain className="w-5 h-5 mr-2 text-blue-600 dark:text-blue-400" />
        twin3 演算法引擎
      </h3>

      <div className="space-y-4 h-[calc(100%-60px)] overflow-y-auto">
        {steps.map((step, index) => {
          const Icon = step.icon;
          const status = getStepStatus(step.id);
          
          return (
            <motion.div
              key={step.id}
              className={`p-4 rounded-lg border-2 transition-all duration-500 shadow-sm ${
                status === 'active' ? 'border-blue-500 bg-blue-50 shadow-lg shadow-blue-200/50' :
                status === 'complete' ? 'border-green-500 bg-green-50' :
                'border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800'
              }`}
              animate={{
                scale: status === 'active' ? 1.05 : 1,
                opacity: status === 'pending' ? 0.6 : 1,
                y: status === 'active' ? -2 : 0
              }}
              transition={{ duration: 0.3, ease: "easeOut" }}
            >
              <div className="flex items-start space-x-4">
                <div className={`p-2 rounded-full ${
                  status === 'active' ? 'bg-blue-600 text-white' :
                  status === 'complete' ? 'bg-green-500 text-white' :
                  'bg-gray-200 dark:bg-gray-700 text-gray-600 dark:text-gray-300'
                }`}>
                  {status === 'complete' ? (
                    <motion.div
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      transition={{ type: "spring", stiffness: 500, damping: 30 }}
                    >
                      <CheckCircle className="w-5 h-5" />
                    </motion.div>
                  ) : (
                    <Icon className={`w-5 h-5 ${status === 'active' ? 'animate-spin' : ''}`} />
                  )}
                </div>
                
                <div className="flex-1">
                  <h4 className="font-semibold text-base">{step.name}</h4>
                  <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">{step.description}</p>
                  <p className="text-xs text-gray-500 dark:text-gray-500">{step.details}</p>
                </div>
                
                {status === 'active' && (
                  <motion.div
                    animate={{ 
                      scale: [1, 1.2, 1],
                      opacity: [0.5, 1, 0.5]
                    }}
                    transition={{ 
                      duration: 1.5, 
                      repeat: Infinity,
                      ease: "easeInOut"
                    }}
                    className="w-3 h-8 bg-gradient-to-t from-blue-600 to-blue-400 rounded-full"
                  />
                )}
              </div>

              {/* 步驟結果顯示 */}
              <AnimatePresence>
                {results && currentStep === step.id && (
                  <motion.div
                    initial={{ opacity: 0, height: 0, y: -10 }}
                    animate={{ opacity: 1, height: 'auto', y: 0 }}
                    exit={{ opacity: 0, height: 0, y: -10 }}
                    transition={{ duration: 0.4, ease: "easeOut" }}
                    className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-700"
                  >
                    {step.id === 'msmm' && results.metaTags && (
                      <div className="space-y-3">
                        <div className="text-sm font-semibold text-blue-600 flex items-center">
                          <Tag className="w-4 h-4 mr-2" />
                          提取的Meta-Tags
                        </div>
                        <div className="flex flex-wrap gap-2">
                          {results.metaTags.map((tag: string, index: number) => (
                            <motion.span
                              key={tag}
                              initial={{ opacity: 0, scale: 0.5, y: 10 }}
                              animate={{ opacity: 1, scale: 1 }}
                              transition={{ 
                                delay: index * 0.15,
                                type: "spring",
                                stiffness: 300,
                                damping: 20
                              }}
                              className="px-3 py-1.5 bg-blue-100 text-blue-700 text-sm rounded-full flex items-center border border-blue-300"
                            >
                              <Tag className="w-3 h-3 mr-1" />
                              {tag}
                            </motion.span>
                          ))}
                        </div>
                        {results.matchedDimensions && (
                          <div className="text-sm text-green-400 font-medium">
                            ✅ 匹配到 {results.matchedDimensions.length} 個維度
                          </div>
                        )}
                      </div>
                    )}

                    {step.id === 'ultu' && results.updates && (
                      <div className="space-y-3">
                        <div className="text-sm font-semibold text-green-600 flex items-center">
                          <Zap className="w-4 h-4 mr-2" />
                          評分更新結果
                        </div>
                        <div className="space-y-2">
                          {Object.entries(results.updates).slice(0, 3).map(([dimId, score]: [string, any], index: number) => (
                            <motion.div 
                              key={dimId} 
                              initial={{ opacity: 0, x: -20 }}
                              animate={{ opacity: 1, x: 0 }}
                              transition={{ delay: index * 0.1 }}
                              className="flex items-center justify-between p-2 bg-green-50 rounded border border-green-200"
                            >
                              <span className="font-mono text-sm text-green-700">{dimId}</span>
                              <motion.span 
                                initial={{ scale: 0.8 }}
                                animate={{ scale: 1 }}
                                transition={{ delay: index * 0.1 + 0.2, type: "spring" }}
                                className="font-bold text-green-600 text-lg"
                              >
                                {score}
                              </motion.span>
                            </motion.div>
                          ))}
                        </div>
                        {Object.keys(results.updates).length > 3 && (
                          <div className="text-sm text-gray-500 text-center">
                            +{Object.keys(results.updates).length - 3} 個維度更新
                          </div>
                        )}
                      </div>
                    )}

                    {step.id === 'complete' && results.totalUpdates && (
                      <div className="space-y-2">
                        <div className="flex items-center space-x-2 text-purple-600 text-sm font-semibold">
                          <Database className="w-4 h-4" />
                          <span>矩陣更新完成</span>
                        </div>
                        <div className="bg-purple-50 border border-purple-200 rounded p-3">
                          <div className="flex items-center justify-between">
                            <span className="text-sm text-purple-700">總計更新維度</span>
                            <motion.span 
                              initial={{ scale: 0 }}
                              animate={{ scale: 1 }}
                              transition={{ type: "spring", stiffness: 400 }}
                              className="text-xl font-bold text-purple-600"
                            >
                              {results.totalUpdates}
                            </motion.span>
                          </div>
                        </div>
                      </div>
                    )}
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.div>
          );
        })}
      </div>

      {/* 即時狀態指示器 */}
      {isProcessing && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1 }}
          className="mt-4 p-4 bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 border border-blue-200 dark:border-blue-700 rounded-lg"
        >
          <div className="flex items-center space-x-2">
            <motion.div
              animate={{ rotate: 360 }}
              transition={{ duration: 1.5, repeat: Infinity, ease: "linear" }}
              className="w-5 h-5 border-2 border-blue-500 border-t-transparent rounded-full"
            />
            <span className="text-sm font-medium text-blue-700 dark:text-blue-300">🧠 twin3 AI演算法運行中...</span>
            <motion.div
              animate={{ opacity: [0.5, 1, 0.5] }}
              transition={{ duration: 2, repeat: Infinity }}
              className="flex space-x-1"
            >
              <div className="w-1 h-1 bg-blue-500 rounded-full"></div>
              <div className="w-1 h-1 bg-blue-500 rounded-full"></div>
              <div className="w-1 h-1 bg-blue-500 rounded-full"></div>
            </motion.div>
          </div>
        </motion.div>
      )}
    </div>
  );
};

export default AlgorithmSteps;