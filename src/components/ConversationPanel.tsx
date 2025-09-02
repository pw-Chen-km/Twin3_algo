import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Send, Image, Video, Brain, User, Bot, Clock, Heart, Lightbulb, TrendingUp, Calculator } from 'lucide-react';
import { UserContent, AIResponse, ProcessingState } from '../types';

interface Message {
  id: string;
  type: 'user' | 'ai' | 'system';
  content: string;
  image?: File | string;
  timestamp: string;
  aiResponse?: AIResponse;
  matrixUpdates?: Record<string, number>;
  processingTime?: number;
  isTyping?: boolean;
}

interface ConversationPanelProps {
  messages: Message[];
  onContentSubmit: (content: UserContent) => void;
  isProcessing: boolean;
  processingState: ProcessingState;
}

const ConversationPanel: React.FC<ConversationPanelProps> = ({
  messages,
  onContentSubmit,
  isProcessing,
  processingState
}) => {
  const [inputText, setInputText] = useState('');
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [filePreview, setFilePreview] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputText.trim() || isProcessing) return;

    onContentSubmit({
      text: inputText.trim(),
      image: selectedFile || undefined
    });

    // Clear form
    setInputText('');
    setSelectedFile(null);
    setFilePreview(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setSelectedFile(file);
      const reader = new FileReader();
      reader.onload = (e) => {
        setFilePreview(e.target?.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const removeFile = () => {
    setSelectedFile(null);
    setFilePreview(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const formatTime = (timestamp: string) => {
    return new Date(timestamp).toLocaleTimeString('zh-TW', { 
      hour: '2-digit', 
      minute: '2-digit' 
    });
  };

  const getFileIcon = (file: File) => {
    if (file.type.startsWith('video/')) {
      return <Video className="w-4 h-4" />;
    }
    return <Image className="w-4 h-4" />;
  };

  return (
    <div className="bg-card rounded-lg border border-border flex flex-col h-[calc(100vh-180px)]">
      {/* Header */}
      <div className="p-4 border-b border-border">
        <h3 className="text-lg font-semibold flex items-center">
          <Brain className="w-5 h-5 mr-2 text-blue-600 dark:text-blue-400" />
          twin3 智能對話
        </h3>
        <p className="text-sm text-gray-600 dark:text-gray-400">與AI助理對話，即時分析您的生活體驗</p>
      </div>

      {/* Messages Area */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4 conversation-scroll">
        <AnimatePresence>
          {messages.map((message) => (
            <motion.div
              key={message.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className={`flex ${message.type === 'user' ? 'justify-end' : 'justify-start'}`}
            >
              <div className={`max-w-[80%] ${message.type === 'user' ? 'order-2' : 'order-1'}`}>
                {/* Message Bubble */}
                <div className={`rounded-2xl px-4 py-3 ${
                  message.type === 'user' 
                    ? 'bg-blue-600 text-white ml-4' 
                    : message.type === 'ai'
                    ? 'bg-gray-100 dark:bg-gray-800 text-gray-900 dark:text-gray-100 mr-4'
                    : 'bg-gray-50 dark:bg-gray-900 text-gray-700 dark:text-gray-300 mx-4 text-center'
                }`}>
                  {/* User Message */}
                  {message.type === 'user' && (
                    <div>
                      <p className="text-sm leading-relaxed">{message.content}</p>
                      {message.image && (
                        <div className="mt-2">
                          {message.image instanceof File ? (
                            <div className="bg-white/10 rounded-lg p-2 flex items-center space-x-2">
                              {getFileIcon(message.image)}
                              <span className="text-xs">{message.image.name}</span>
                              <span className="text-xs opacity-70">
                                {(message.image.size / 1024 / 1024).toFixed(1)}MB
                              </span>
                            </div>
                          ) : (
                            <img 
                              src={message.image} 
                              alt="User upload" 
                              className="max-w-full h-32 object-cover rounded-lg"
                            />
                          )}
                        </div>
                      )}
                    </div>
                  )}

                  {/* AI Response */}
                  {message.type === 'ai' && (
                    <div className="space-y-3">
                      {/* Main AI Message */}
                      <div className="flex items-start space-x-2">
                        <Bot className="w-4 h-4 mt-0.5 text-blue-600 dark:text-blue-400 flex-shrink-0" />
                        <p className="text-sm leading-relaxed">{message.content}</p>
                      </div>

                      {/* AI Response Details */}
                      {message.aiResponse && (
                        <div className="space-y-2 border-t border-gray-200 dark:border-gray-700 pt-3">
                          {/* Emotional Tone */}
                          <div className="flex items-center space-x-2 text-xs">
                            <Heart className="w-3 h-3 text-red-400" />
                            <span className="text-gray-600 dark:text-gray-400">情緒狀態:</span>
                            <span className="text-gray-900 dark:text-gray-100 font-medium">{message.aiResponse.emotionalTone}</span>
                          </div>

                          {/* Insights */}
                          {message.aiResponse.insights.length > 0 && (
                            <div className="space-y-1">
                              <div className="flex items-center space-x-1 text-xs text-yellow-600 dark:text-yellow-400">
                                <Lightbulb className="w-3 h-3" />
                                <span>行為洞察</span>
                              </div>
                              {message.aiResponse.insights.map((insight, index) => (
                                <div key={index} className="text-xs text-yellow-800 dark:text-yellow-200 bg-yellow-100 dark:bg-yellow-900/30 rounded px-2 py-1">
                                  {insight}
                                </div>
                              ))}
                            </div>
                          )}

                          {/* Recommendations */}
                          {/* Matrix Updates Summary */}
                          {message.matrixUpdates && Object.keys(message.matrixUpdates).length > 0 && (
                            <div className="bg-blue-100 dark:bg-blue-900/30 rounded-lg p-2">
                              <div className="flex items-center space-x-1 text-xs text-blue-700 dark:text-blue-300 mb-1">
                                <Calculator className="w-3 h-3" />
                                <span>Twin Matrix 更新</span>
                              </div>
                              <div className="text-xs text-blue-600 dark:text-blue-400">
                                更新了 {Object.keys(message.matrixUpdates).length} 個維度
                                {message.processingTime && (
                                  <span className="ml-2">• 處理時間: {message.processingTime}ms</span>
                                )}
                              </div>
                            </div>
                          )}

                          {/* Confidence */}
                          <div className="flex items-center justify-between text-xs">
                            <span className="text-gray-600 dark:text-gray-400">分析信心度</span>
                            <span className="font-bold text-blue-600 dark:text-blue-400">
                              {Math.round(message.aiResponse.analysisConfidence * 100)}%
                            </span>
                          </div>
                        </div>
                      )}
                    </div>
                  )}

                  {/* System Message */}
                  {message.type === 'system' && (
                    <div className="flex items-center space-x-2">
                      <Brain className="w-4 h-4 text-gray-600 dark:text-gray-400" />
                      <span className="text-sm">{message.content}</span>
                    </div>
                  )}
                </div>

                {/* Avatar and Timestamp */}
                <div className={`flex items-center space-x-2 mt-1 ${
                  message.type === 'user' ? 'justify-end' : 'justify-start'
                }`}>
                  {message.type !== 'user' && (
                    <div className="w-6 h-6 bg-blue-600 dark:bg-blue-500 rounded-full flex items-center justify-center">
                      <Bot className="w-3 h-3 text-white" />
                    </div>
                  )}
                  <span className="text-xs text-muted-foreground">
                    {formatTime(message.timestamp)}
                  </span>
                  {message.type === 'user' && (
                    <div className="w-6 h-6 bg-gray-200 dark:bg-gray-700 rounded-full flex items-center justify-center">
                      <User className="w-3 h-3 text-gray-700 dark:text-gray-300" />
                    </div>
                  )}
                </div>
              </div>
            </motion.div>
          ))}
        </AnimatePresence>

        {/* Typing Indicator */}
        {isProcessing && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex justify-start"
          >
            <div className="bg-gray-100 dark:bg-gray-800 text-gray-900 dark:text-gray-100 rounded-2xl px-4 py-3 mr-4">
              <div className="flex items-center space-x-2">
                <Bot className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                <div className="flex space-x-1">
                  <motion.div
                    animate={{ scale: [1, 1.2, 1] }}
                    transition={{ duration: 0.6, repeat: Infinity, delay: 0 }}
                    className="w-2 h-2 bg-blue-600 dark:bg-blue-400 rounded-full"
                  />
                  <motion.div
                    animate={{ scale: [1, 1.2, 1] }}
                    transition={{ duration: 0.6, repeat: Infinity, delay: 0.2 }}
                    className="w-2 h-2 bg-blue-600 dark:bg-blue-400 rounded-full"
                  />
                  <motion.div
                    animate={{ scale: [1, 1.2, 1] }}
                    transition={{ duration: 0.6, repeat: Infinity, delay: 0.4 }}
                    className="w-2 h-2 bg-blue-600 dark:bg-blue-400 rounded-full"
                  />
                </div>
                <span className="text-sm text-gray-600 dark:text-gray-400">AI 正在分析...</span>
              </div>
            </div>
          </motion.div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Input Area */}
      <div className="p-4 border-t border-border">
        <form onSubmit={handleSubmit} className="space-y-3">
          {/* File Preview */}
          {filePreview && (
            <div className="relative inline-block">
              <div className="relative bg-secondary rounded-lg p-2 border border-border">
                {selectedFile?.type.startsWith('video/') ? (
                  <div className="flex items-center space-x-2">
                    <Video className="w-4 h-4 text-primary" />
                    <span className="text-sm">{selectedFile.name}</span>
                    <span className="text-xs text-muted-foreground">
                      {(selectedFile.size / 1024 / 1024).toFixed(1)}MB
                    </span>
                  </div>
                ) : (
                  <img 
                    src={filePreview} 
                    alt="Preview" 
                    className="max-w-20 h-16 object-cover rounded"
                  />
                )}
                <button
                  type="button"
                  onClick={removeFile}
                  className="absolute -top-2 -right-2 bg-destructive text-destructive-foreground rounded-full w-5 h-5 flex items-center justify-center text-xs hover:bg-destructive/80"
                >
                  ×
                </button>
              </div>
            </div>
          )}

          {/* Input Row */}
          <div className="flex items-end space-x-2">
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*,video/*"
              onChange={handleFileSelect}
              className="hidden"
            />
            
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="p-3 bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 rounded-lg border border-gray-300 dark:border-gray-600 transition-colors flex-shrink-0"
              disabled={isProcessing}
            >
              <Image className="w-6 h-6 text-gray-700 dark:text-gray-300" />
            </button>

            <div className="flex-1 relative">
              <textarea
                value={inputText}
                onChange={(e) => setInputText(e.target.value)}
                placeholder="描述您的體驗或活動... 例如：我今天帶領學弟妹完成了一篇論文"
                className="w-full px-3 py-2 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg resize-none focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm text-gray-900 dark:text-gray-100 transition-colors"
                rows={2}
                disabled={isProcessing}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault();
                    handleSubmit(e);
                  }
                }}
              />
              <div className="absolute bottom-1 right-1 text-xs text-gray-500 dark:text-gray-400">
                {inputText.length}/500
              </div>
            </div>

            <button
              type="submit"
              disabled={!inputText.trim() || isProcessing}
              className="p-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all transform hover:scale-105 active:scale-95 flex-shrink-0"
            >
              <Send className="w-4 h-4" />
            </button>
          </div>
        </form>

        {/* Quick Examples */}
        <div className="mt-3 flex flex-wrap gap-2">
          {[
            "我今天學習了新技能",
            "參加了環保活動",
            "和朋友聚餐慶祝"
          ].map((example, index) => (
            <button
              key={index}
              onClick={() => setInputText(example)}
              className="text-xs px-2 py-1 bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 rounded-full border border-gray-300 dark:border-gray-600 transition-colors text-gray-700 dark:text-gray-300"
              disabled={isProcessing}
            >
              {example}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
};

export default ConversationPanel;