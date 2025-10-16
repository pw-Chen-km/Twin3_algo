import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { MessageCircle, Brain, Lightbulb, Heart, TrendingUp, Sparkles } from 'lucide-react';
import { AIResponse } from '../utils/aiResponseService';

interface AIResponsePanelProps {
  response: AIResponse | null;
  isGenerating: boolean;
}

const AIResponsePanel: React.FC<AIResponsePanelProps> = ({ response, isGenerating }) => {
  return (
    <div className="bg-card rounded-lg border border-border p-4">
      <h3 className="text-lg font-semibold mb-4 flex items-center">
        <Brain className="w-5 h-5 mr-2 text-primary" />
        AI 智能回應
      </h3>

      <AnimatePresence mode="wait">
        {isGenerating && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="text-center py-8"
          >
            <motion.div
              animate={{ rotate: 360 }}
              transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
              className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full mx-auto mb-3"
            />
            <p className="text-sm text-primary">AI 正在分析您的內容...</p>
            <p className="text-xs text-muted-foreground mt-1">使用 Gemini 2.0 Flash 進行深度理解</p>
          </motion.div>
        )}

        {response && !isGenerating && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="space-y-4"
          >
            {/* AI Message */}
            <div className="bg-primary/10 border border-primary/20 rounded-lg p-4">
              <div className="flex items-start space-x-3">
                <div className="w-8 h-8 bg-primary text-primary-foreground rounded-full flex items-center justify-center flex-shrink-0">
                  <MessageCircle className="w-4 h-4" />
                </div>
                <div className="flex-1">
                  <p className="text-sm leading-relaxed">{response.message}</p>
                  <div className="flex items-center space-x-2 mt-2">
                    <Heart className="w-3 h-3 text-red-400" />
                    <span className="text-xs text-muted-foreground">情緒狀態: {response.emotionalTone}</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Insights */}
            {response.insights.length > 0 && (
              <div className="space-y-2">
                <h4 className="text-sm font-semibold flex items-center">
                  <Sparkles className="w-4 h-4 mr-2 text-yellow-400" />
                  行為洞察
                </h4>
                {response.insights.map((insight, index) => (
                  <motion.div
                    key={index}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: index * 0.1 }}
                    className="bg-yellow-500/10 border border-yellow-500/20 rounded-lg p-3"
                  >
                    <p className="text-sm text-yellow-100">{insight}</p>
                  </motion.div>
                ))}
              </div>
            )}

            {/* Recommendations */}
            {response.recommendations.length > 0 && (
              <div className="space-y-2">
                <h4 className="text-sm font-semibold flex items-center">
                  <Lightbulb className="w-4 h-4 mr-2 text-green-400" />
                  成長建議
                </h4>
                {response.recommendations.map((recommendation, index) => (
                  <motion.div
                    key={index}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: index * 0.1 + 0.2 }}
                    className="bg-green-500/10 border border-green-500/20 rounded-lg p-3"
                  >
                    <div className="flex items-start space-x-2">
                      <span className="text-green-400 font-bold text-xs mt-0.5">{index + 1}.</span>
                      <p className="text-sm text-green-100 flex-1">{recommendation}</p>
                    </div>
                  </motion.div>
                ))}
              </div>
            )}

            {/* Analysis Confidence */}
            <div className="bg-secondary/50 rounded-lg p-3">
              <div className="flex items-center justify-between">
                <span className="text-xs text-muted-foreground">分析信心度</span>
                <span className="text-xs font-bold text-primary">
                  {Math.round(response.analysisConfidence * 100)}%
                </span>
              </div>
              <div className="w-full bg-muted rounded-full h-1.5 mt-2">
                <motion.div
                  initial={{ width: 0 }}
                  animate={{ width: `${response.analysisConfidence * 100}%` }}
                  transition={{ duration: 1, ease: "easeOut" }}
                  className="bg-primary h-1.5 rounded-full"
                />
              </div>
            </div>
          </motion.div>
        )}

        {!response && !isGenerating && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="text-center py-8 text-muted-foreground"
          >
            <Brain className="w-8 h-8 mx-auto mb-2 opacity-50" />
            <p className="text-sm">等待內容輸入</p>
            <p className="text-xs">AI 將分析您的體驗並提供個人化洞察</p>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default AIResponsePanel;