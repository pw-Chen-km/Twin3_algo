import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Search, Zap, Database, CheckCircle, Clock, Tag, Calculator, TrendingUp } from 'lucide-react';

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
      color: 'bg-blue-500'
    },
    {
      id: 'ultu',
      name: 'ULTU 動態評分',
      icon: Zap,
      description: '精確評分與分數平滑',
      color: 'bg-green-500'
    },
    {
      id: 'complete',
      name: '矩陣更新',
      icon: Database,
      description: 'Twin Matrix狀態更新',
      color: 'bg-purple-500'
    }
  ];

  const getStepStatus = (stepId: string) => {
    if (!isProcessing) return 'idle';
    if (currentStep === stepId) return 'active';
    if (steps.findIndex(s => s.id === stepId) < steps.findIndex(s => s.id === currentStep)) return 'complete';
    return 'pending';
  };

  return (
    <div className="bg-card rounded-lg border border-border p-4">
      <h3 className="text-lg font-semibold mb-4 flex items-center">
        <Calculator className="w-5 h-5 mr-2 text-primary" />
        Twin3 演算法步驟
      </h3>

      <div className="space-y-3">
        {steps.map((step, index) => {
          const Icon = step.icon;
          const status = getStepStatus(step.id);
          
          return (
            <motion.div
              key={step.id}
              className={`p-3 rounded-lg border transition-all ${
                status === 'active' ? 'border-primary bg-primary/10' :
                status === 'complete' ? 'border-green-500 bg-green-500/10' :
                'border-border bg-secondary/50'
              }`}
              animate={{
                scale: status === 'active' ? 1.02 : 1,
                opacity: status === 'pending' ? 0.6 : 1
              }}
            >
              <div className="flex items-center space-x-3">
                <div className={`p-2 rounded-full ${
                  status === 'active' ? 'bg-primary text-primary-foreground' :
                  status === 'complete' ? 'bg-green-500 text-white' :
                  'bg-muted text-muted-foreground'
                }`}>
                  {status === 'complete' ? (
                    <CheckCircle className="w-4 h-4" />
                  ) : (
                    <Icon className={`w-4 h-4 ${status === 'active' ? 'animate-pulse' : ''}`} />
                  )}
                </div>
                
                <div className="flex-1">
                  <h4 className="font-medium text-sm">{step.name}</h4>
                  <p className="text-xs text-muted-foreground">{step.description}</p>
                </div>
                
                {status === 'active' && (
                  <div className="w-2 h-6 bg-primary rounded-full animate-pulse"></div>
                )}
              </div>

              {/* 步驟結果顯示 */}
              <AnimatePresence>
                {results && currentStep === step.id && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    exit={{ opacity: 0, height: 0 }}
                    className="mt-3 pt-3 border-t border-border/50"
                  >
                    {step.id === 'msmm' && results.metaTags && (
                      <div className="space-y-2">
                        <div className="text-xs font-medium text-primary">提取的Meta-Tags:</div>
                        <div className="flex flex-wrap gap-1">
                          {results.metaTags.map((tag: string, index: number) => (
                            <motion.span
                              key={tag}
                              initial={{ opacity: 0, scale: 0.8 }}
                              animate={{ opacity: 1, scale: 1 }}
                              transition={{ delay: index * 0.1 }}
                              className="px-2 py-1 bg-blue-500/20 text-blue-400 text-xs rounded-full flex items-center"
                            >
                              <Tag className="w-2 h-2 mr-1" />
                              {tag}
                            </motion.span>
                          ))}
                        </div>
                        {results.matchedDimensions && (
                          <div className="text-xs text-muted-foreground">
                            匹配到 {results.matchedDimensions.length} 個維度
                          </div>
                        )}
                      </div>
                    )}

                    {step.id === 'ultu' && results.updates && (
                      <div className="space-y-2">
                        <div className="text-xs font-medium text-green-400">評分更新:</div>
                        {Object.entries(results.updates).slice(0, 3).map(([dimId, score]: [string, any]) => (
                          <div key={dimId} className="flex items-center justify-between text-xs">
                            <span className="font-mono">{dimId}</span>
                            <span className="font-bold text-green-400">{score}</span>
                          </div>
                        ))}
                        {Object.keys(results.updates).length > 3 && (
                          <div className="text-xs text-muted-foreground">
                            +{Object.keys(results.updates).length - 3} 個維度
                          </div>
                        )}
                      </div>
                    )}

                    {step.id === 'complete' && results.totalUpdates && (
                      <div className="text-xs">
                        <div className="flex items-center space-x-2 text-purple-400">
                          <TrendingUp className="w-3 h-3" />
                          <span>總計更新 {results.totalUpdates} 個維度</span>
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
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="mt-4 p-3 bg-primary/10 border border-primary/20 rounded-lg"
        >
          <div className="flex items-center space-x-2">
            <motion.div
              animate={{ rotate: 360 }}
              transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
              className="w-4 h-4 border-2 border-primary border-t-transparent rounded-full"
            />
            <span className="text-sm text-primary">Twin3演算法運行中...</span>
          </div>
        </motion.div>
      )}

      {!isProcessing && !results && (
        <div className="mt-4 text-center py-4 text-muted-foreground">
          <Clock className="w-6 h-6 mx-auto mb-2 opacity-50" />
          <p className="text-xs">等待內容輸入</p>
        </div>
      )}
    </div>
  );
};

export default AlgorithmSteps;