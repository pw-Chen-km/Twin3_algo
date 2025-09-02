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
    <div className="bg-black text-green-400 rounded-lg border-2 border-gray-600 p-4 h-[calc(50vh-60px)] font-mono text-sm overflow-auto shadow-lg">
      {/* Terminal Header */}
      <div className="text-green-300 mb-4 border-b border-green-600 pb-2">
        <div className="flex items-center space-x-2">
          <span className="text-green-500">●</span>
          <span>twin3 Algorithm Engine [ACTIVE]</span>
        </div>
        <div className="text-green-600 text-xs mt-1">
          Process: MSMM → ULTU → Matrix Update | Status: {isProcessing ? 'RUNNING' : 'IDLE'}
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
                  {status === 'active' ? '[RUNNING]' :
                   status === 'complete' ? '[COMPLETE]' :
                   '[PENDING]'}
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
                          ├─ Meta-Tags Extracted: {results.metaTags.length}
                        </div>
                        <div className="text-green-500 ml-2">
                          └─ Tags: {results.metaTags.slice(0, 3).join(', ')}
                          {results.metaTags.length > 3 && ` +${results.metaTags.length - 3} more`}
                        </div>
                        {results.matchedDimensions && (
                          <div className="text-yellow-400 ml-2">
                          └─ Matched Dimensions: {results.matchedDimensions.length}
                          </div>
                        )}
                      </div>
                    )}

                    {step.id === 'ultu' && results.updates && (
                      <div className="space-y-1">
                        <div className="text-cyan-400">
                          ├─ Dimensions Updated: {Object.keys(results.updates).length}
                        </div>
                        {Object.entries(results.updates).slice(0, 3).map(([dimId, score]: [string, any], idx: number) => (
                          <div key={dimId} className="text-green-500 ml-2">
                            ├─ {dimId}: {score}/255
                          </div>
                        ))}
                        {Object.keys(results.updates).length > 3 && (
                          <div className="text-green-600 ml-2">
                            └─ +{Object.keys(results.updates).length - 3} more updates
                          </div>
                        )}
                      </div>
                    )}
    </div>
  );
};

                    {step.id === 'complete' && results.totalUpdates && (
                      <div className="space-y-1">
                        <div className="text-cyan-400">
                          ├─ Matrix Update Complete
                        </div>
                        <div className="text-green-500 ml-2">
                          └─ Total Updates: {results.totalUpdates} dimensions
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
              ▶ Processing user content with AI models...
            </motion.span>
          </motion.div>
        )}
      </div>
export default AlgorithmSteps;