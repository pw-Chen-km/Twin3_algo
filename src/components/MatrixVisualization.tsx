import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Grid, Filter, TrendingUp, TrendingDown, Minus, Info, X, Calculator, Brain, Zap, Clock, BarChart3 } from 'lucide-react';
import { ProcessingState, DimensionHistory } from '../types';

interface MatrixVisualizationProps {
  matrixData: Record<string, number>;
  processingState: ProcessingState;
  dimensionHistory: Record<string, DimensionHistory>;
}

const MatrixVisualization: React.FC<MatrixVisualizationProps> = ({ matrixData, processingState, dimensionHistory }) => {
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [selectedDimension, setSelectedDimension] = useState<string | null>(null);
  const [showDetailModal, setShowDetailModal] = useState<string | null>(null);

  // Mock dimension names mapping (in real app this would come from metadata)
  // 使用真實Twin3維度定義
  const TWIN3_METADATA = {
    '0008': { name: 'Dietary Habits', definition: '個人飲食習慣和營養選擇的傾向', meta_tags: ['食物', '營養', '健康', '飲食', '料理'] },
    '0067': { name: 'Spiritual Awareness', definition: '對精神層面和內在成長的關注程度', meta_tags: ['精神', '內在', '成長', '覺察', '靈性'] },
    '006C': { name: 'Emotional Intelligence', definition: '理解和管理自己及他人情緒的能力', meta_tags: ['情緒', '理解', '同理心', '溝通', '感受'] },
    '0071': { name: 'Social Achievements', definition: '在社會環境中的成就和認可程度', meta_tags: ['成就', '成功', '認可', '表現', '完成'] },
    '0048': { name: 'Leadership Ability', definition: '領導他人和組織團隊的能力', meta_tags: ['領導', '指導', '管理', '組織', '帶領'] },
    '0040': { name: 'Social Relationships', definition: '建立和維持人際關係的能力', meta_tags: ['朋友', '關係', '社交', '互動', '連結'] },
    '0099': { name: 'Learning Orientation', definition: '對學習新知識和技能的積極程度', meta_tags: ['學習', '知識', '技能', '成長', '教育'] },
    '0156': { name: 'Creative Expression', definition: '創意表達和藝術創作的能力', meta_tags: ['創意', '創作', '藝術', '表達', '想像'] },
    'SP088': { name: 'Social Responsibility', definition: '對社會責任和環境保護的關注程度', meta_tags: ['責任', '環保', '社會', '永續', '公益'] },
    '0010': { name: 'Physical Fitness', definition: '身體健康和體能狀況', meta_tags: ['健身', '運動', '體能', '健康', '鍛鍊'] },
    '0081': { name: 'Technology Adoption', definition: '對新技術的接受和應用能力', meta_tags: ['科技', '技術', '數位', '創新', '應用'] },
    '0032': { name: 'Emotional Stability', definition: '情緒管理和心理穩定性', meta_tags: ['情緒', '穩定', '平衡', '調節', '心理'] }
  };
  const categories = {
    physical: { name: 'Physical', color: 'bg-red-500', attributes: ['0010', '0012', '0016', '0019', '0021', '0033', '0034', '0035'] },
    social: { name: 'Social', color: 'bg-green-500', attributes: ['0040', '0041', '0047', '004C', '004D', '0054', '0060', '006E', '0071', '0048'] },
    digital: { name: 'Digital', color: 'bg-blue-500', attributes: ['0081', '0088', '0093', '0094', '0096', '00B6', '00BC', '00BF'] },
    spiritual: { name: 'Spiritual', color: 'bg-purple-500', attributes: ['0067', '0069', '006C', '006D', '0070', '0099', '0156', 'SP088'] }
  };

  const getScoreColor = (score: number) => {
    if (score >= 200) return 'bg-green-400';
    if (score >= 150) return 'bg-yellow-400';
    if (score >= 100) return 'bg-orange-400';
    if (score >= 50) return 'bg-red-400';
    return 'bg-gray-400';
  };

  const getScoreIntensity = (score: number) => {
    return Math.max(0.1, score / 255);
  };

  const filteredData = useMemo(() => {
    if (selectedCategory === 'all') return matrixData;
    
    const categoryAttrs = categories[selectedCategory as keyof typeof categories]?.attributes || [];
    return Object.fromEntries(
      Object.entries(matrixData).filter(([attrId]) => 
        categoryAttrs.some(catAttr => attrId.includes(catAttr))
      )
    );
  }, [matrixData, selectedCategory]);

  const getChangeIcon = (attrId: string) => {
    const history = dimensionHistory[attrId];
    if (!history || history.updates.length === 0) return <Minus className="w-3 h-3 text-gray-400" />;
    
    const lastUpdate = history.updates[history.updates.length - 1];
    if (lastUpdate.change > 0) return <TrendingUp className="w-3 h-3 text-green-400" />;
    if (lastUpdate.change < 0) return <TrendingDown className="w-3 h-3 text-red-400" />;
    return <Minus className="w-3 h-3 text-gray-400" />;
  };
  
  const getLatestChange = (attrId: string): number => {
    const history = dimensionHistory[attrId];
    if (!history || history.updates.length === 0) return 0;
    return history.updates[history.updates.length - 1].change;
  };

  const getDimensionName = (attrId: string) => {
    return TWIN3_METADATA[attrId]?.name || `Dimension ${attrId}`;
  };

  return (
    <div className="bg-card rounded-lg border border-border p-6">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold flex items-center">
          <Grid className="w-5 h-5 mr-2 text-primary" />
          Twin Matrix Visualization
        </h3>
        
        <div className="flex items-center space-x-2">
          <select
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
            className="bg-secondary text-secondary-foreground px-3 py-1 rounded-md border border-border text-sm"
          >
            <option value="all">All Dimensions</option>
            {Object.entries(categories).map(([key, cat]) => (
              <option key={key} value={key}>{cat.name}</option>
            ))}
          </select>
          
          <button
            onClick={() => setViewMode(viewMode === 'grid' ? 'list' : 'grid')}
            className="p-2 bg-secondary hover:bg-secondary/80 rounded-md border border-border"
          >
            <Filter className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Algorithm Results Summary */}
      {Object.keys(matrixData).length > 0 && (
        <div className="mb-4 p-4 bg-primary/10 border border-primary/20 rounded-lg">
          <h4 className="text-sm font-semibold mb-2 flex items-center text-primary">
            <Info className="w-4 h-4 mr-2" />
            演算法計算結果 (Algorithm Results)
          </h4>
          <div className="grid grid-cols-2 gap-4 text-xs">
            <div>
              <div className="text-muted-foreground">共更新維度: <span className="font-bold text-foreground">{Object.keys(matrixData).length}</span></div>
              <div className="text-muted-foreground">最高分數: <span className="font-bold text-green-400">{Math.max(...Object.values(matrixData))}</span></div>
            </div>
            <div>
              <div className="text-muted-foreground">平均分數: <span className="font-bold text-foreground">{Math.round(Object.values(matrixData).reduce((a, b) => a + b, 0) / Object.keys(matrixData).length)}</span></div>
              <div className="text-muted-foreground">總更新次數: <span className="font-bold text-primary">{Object.values(dimensionHistory).reduce((sum, hist) => sum + hist.totalUpdates, 0)}</span></div>
            </div>
          </div>
        </div>
      )}
      
      {/* Category Legend */}
      <div className="flex flex-wrap gap-2 mb-4">
        {Object.entries(categories).map(([key, cat]) => (
          <div key={key} className="flex items-center space-x-1">
            <div className={`w-3 h-3 rounded-full ${cat.color}`}></div>
            <span className="text-xs text-muted-foreground">{cat.name}</span>
          </div>
        ))}
      </div>

      {viewMode === 'grid' ? (
        /* Grid View */
        <div className="grid grid-cols-4 gap-3">
          {Object.entries(filteredData).map(([attrId, score]) => {
            const category = Object.entries(categories).find(([_, cat]) => 
              cat.attributes.some(catAttr => attrId.includes(catAttr))
            );
            const categoryColor = category?.[1].color || 'bg-gray-500';
            const dimensionName = getDimensionName(attrId);
            const latestChange = getLatestChange(attrId);
            const history = dimensionHistory[attrId];
            
            return (
              <motion.div
                key={attrId}
                className={`matrix-cell rounded-lg border-2 border-border/30 relative group cursor-pointer p-4 ${categoryColor} hover:border-white/50 hover:shadow-lg hover:shadow-primary/20 transition-all duration-300 transform hover:-translate-y-1`}
                style={{ 
                  opacity: getScoreIntensity(score),
                }}
                whileHover={{ 
                  scale: 1.08, 
                  zIndex: 10,
                  boxShadow: "0 10px 25px rgba(59, 130, 246, 0.3)"
                }}
                whileTap={{ scale: 0.98 }}
                onClick={() => setShowDetailModal(attrId)}
                animate={processingState === 'processing' ? { 
                  scale: [1, 1.05, 1],
                  opacity: [getScoreIntensity(score), 0.8, getScoreIntensity(score)]
                } : {}}
                transition={{ duration: 0.3 }}
              >
                <div className="text-center relative">
                  {/* Clickable indicator */}
                  <div className="absolute -top-2 -right-2 w-4 h-4 bg-white/20 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                    <div className="w-2 h-2 bg-white rounded-full animate-pulse"></div>
                  </div>
                  
                  <div className="text-lg font-bold text-white drop-shadow-sm mb-1">
                    {score}
                  </div>
                  {/* 顯示變化 */}
                  {latestChange !== 0 && (
                    <div className={`text-xs font-bold mb-1 px-2 py-0.5 rounded-full bg-white/20 ${latestChange > 0 ? 'text-green-200' : 'text-red-200'}`}>
                      {latestChange > 0 ? '+' : ''}{latestChange}
                    </div>
                  )}
                  <div className="text-xs text-white/90 font-medium mb-1">
                    {attrId}
                  </div>
                  <div className="text-xs text-white/80 leading-tight font-medium">
                    {dimensionName}
                  </div>
                  
                  {/* Click hint */}
                  <div className="absolute inset-0 bg-white/10 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                    <div className="text-xs text-white/90 font-medium bg-black/30 px-2 py-1 rounded">
                      點擊查看詳情
                    </div>
                  </div>
                </div>
                
                {/* Update Count Badge */}
                <div className="absolute top-1 right-1">
                  {history && history.totalUpdates > 0 && (
                    <div className="bg-white/30 text-white text-xs px-2 py-0.5 rounded-full font-bold border border-white/20">
                      {history.totalUpdates}
                    </div>
                  )}
                </div>
                
                {/* Processing glow effect */}
                {processingState === 'processing' && (
                  <div className="absolute inset-0 rounded-lg bg-gradient-to-r from-transparent via-white/20 to-transparent animate-pulse"></div>
                )}
              </motion.div>
            );
          })}
        </div>
      ) : (
        /* List View */
        <div className="space-y-2 max-h-96 overflow-y-auto">
          {Object.entries(filteredData)
            .sort(([,a], [,b]) => b - a)
            .map(([attrId, score]) => {
              const category = Object.entries(categories).find(([_, cat]) => 
                cat.attributes.some(catAttr => attrId.includes(catAttr))
              );
              const dimensionName = getDimensionName(attrId);
              const latestChange = getLatestChange(attrId);
              const history = dimensionHistory[attrId];
              
              return (
                <motion.div
                  key={attrId}
                  className="flex items-center justify-between p-3 bg-secondary rounded-lg border border-border cursor-pointer hover:bg-secondary/80"
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.3 }}
                  onClick={() => setShowDetailModal(attrId)}
                >
                  <div className="flex items-center space-x-3">
                    <div className={`w-3 h-3 rounded-full ${category?.[1].color || 'bg-gray-500'}`}></div>
                    <div>
                      <div className="font-mono text-sm font-semibold">{attrId}</div>
                      <div className="text-xs text-muted-foreground">{dimensionName}</div>
                      {history && (
                        <div className="text-xs text-muted-foreground">
                          更新 {history.totalUpdates} 次
                        </div>
                      )}
                    </div>
                    {getChangeIcon(attrId)}
                  </div>
                  
                  <div className="flex items-center space-x-2">
                    <div className="w-24 h-2 bg-muted rounded-full overflow-hidden">
                      <motion.div
                        className={`h-full ${getScoreColor(score)}`}
                        initial={{ width: 0 }}
                        animate={{ width: `${(score / 255) * 100}%` }}
                        transition={{ duration: 0.5 }}
                      />
                    </div>
                    <div className="text-right">
                      <div className="font-mono text-sm font-bold">{score}</div>
                      {latestChange !== 0 && (
                        <div className={`text-xs font-bold ${latestChange > 0 ? 'text-green-400' : 'text-red-400'}`}>
                          {latestChange > 0 ? '+' : ''}{latestChange}
                        </div>
                      )}
                      <div className="text-xs text-muted-foreground">/255</div>
                    </div>
                  </div>
                </motion.div>
              );
            })}
        </div>
      )}

      {/* Detailed Dimension Modal */}
      <AnimatePresence>
        {showDetailModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4"
            onClick={() => setShowDetailModal(null)}
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              className="bg-card border border-border rounded-lg p-6 max-w-4xl w-full max-h-[90vh] overflow-y-auto"
              onClick={(e) => e.stopPropagation()}
            >
              {(() => {
                const score = matrixData[showDetailModal];
                const dimensionName = getDimensionName(showDetailModal);
                const dimension = TWIN3_METADATA[showDetailModal];
                const history = dimensionHistory[showDetailModal];
                const latestUpdate = history?.updates[history.updates.length - 1];
                
                return (
                  <>
                    {/* Header */}
                    <div className="flex items-center justify-between mb-6">
                      <div>
                        <h3 className="text-xl font-bold">{dimensionName}</h3>
                        <p className="text-muted-foreground font-mono">{showDetailModal}</p>
                        {history && (
                          <p className="text-sm text-muted-foreground">
                            總更新次數: {history.totalUpdates} | 最後更新: {new Date(history.lastUpdated).toLocaleString()}
                          </p>
                        )}
                      </div>
                      <button
                        onClick={() => setShowDetailModal(null)}
                        className="p-2 hover:bg-secondary rounded-lg transition-colors"
                      >
                        <X className="w-5 h-5" />
                      </button>
                    </div>

                    {/* Score Display */}
                    <div className="grid grid-cols-4 gap-4 mb-6">
                      <div className="bg-primary/10 p-4 rounded-lg text-center">
                        <div className="text-2xl font-bold text-primary">{score}</div>
                        <div className="text-sm text-muted-foreground">當前分數</div>
                      </div>
                      <div className="bg-secondary p-4 rounded-lg text-center">
                        <div className="text-2xl font-bold font-mono">0x{score.toString(16).toUpperCase().padStart(2, '0')}</div>
                        <div className="text-sm text-muted-foreground">HEX值</div>
                      </div>
                      <div className="bg-accent/10 p-4 rounded-lg text-center">
                        <div className="text-2xl font-bold">{Math.round((score/255)*100)}%</div>
                        <div className="text-sm text-muted-foreground">相對強度</div>
                      </div>
                      <div className={`p-4 rounded-lg text-center ${latestUpdate?.change > 0 ? 'bg-green-500/10' : latestUpdate?.change < 0 ? 'bg-red-500/10' : 'bg-gray-500/10'}`}>
                        <div className={`text-2xl font-bold ${latestUpdate?.change > 0 ? 'text-green-400' : latestUpdate?.change < 0 ? 'text-red-400' : 'text-gray-400'}`}>
                          {latestUpdate?.change > 0 ? '+' : ''}{latestUpdate?.change || 0}
                        </div>
                        <div className="text-sm text-muted-foreground">最新變化</div>
                      </div>
                    </div>

                    {/* Latest Calculation Process */}
                    {latestUpdate?.calculationDetails && (
                      <div className="space-y-4 mb-6">
                        <h4 className="text-lg font-semibold flex items-center">
                          <Calculator className="w-5 h-5 mr-2 text-primary" />
                          最新計算過程 (Twin3演算法)
                        </h4>
                        
                        {/* ULTU Formula */}
                        <div className="bg-accent/10 p-4 rounded-lg">
                          <h5 className="font-semibold mb-2 flex items-center">
                            <Zap className="w-4 h-4 mr-2" />
                            Twin3 ULTU 分數平滑公式
                          </h5>
                          <div className="font-mono text-sm bg-background p-3 rounded border mb-2">
                            新分數 = α × Gemini評分 + (1-α) × 前次分數 (α={latestUpdate.calculationDetails.smoothingFactor})
                          </div>
                          <div className="font-mono text-sm bg-primary/10 p-3 rounded border">
                            {latestUpdate.newScore} = {latestUpdate.calculationDetails.smoothingFactor} × {latestUpdate.calculationDetails.geminiRawScore} + {1-latestUpdate.calculationDetails.smoothingFactor} × {latestUpdate.calculationDetails.previousScore}
                          </div>
                          <div className="text-xs text-muted-foreground mt-2">
                            更新策略: {latestUpdate.calculationDetails.strategy} | 第 {latestUpdate.calculationDetails.updateCount} 次更新
                          </div>
                        </div>

                        {/* Calculation Steps */}
                        <div className="space-y-3">
                          <div className="flex items-center space-x-4 p-3 bg-secondary rounded-lg">
                            <div className="w-8 h-8 bg-blue-500 text-white rounded-full flex items-center justify-center text-sm font-bold">1</div>
                            <div className="flex-1">
                              <div className="font-medium">MSMM 語意匹配</div>
                              <div className="text-sm text-muted-foreground">
                                語意相似度: {(latestUpdate.calculationDetails.msmmSimilarity * 100).toFixed(1)}% | 
                                匹配標籤: {latestUpdate.calculationDetails.matchedMetaTags.join(', ') || '無'}
                              </div>
                            </div>
                            <div className="text-sm font-bold text-blue-400">
                              {(latestUpdate.calculationDetails.msmmSimilarity * 100).toFixed(1)}%
                            </div>
                          </div>
                          
                          <div className="flex items-center space-x-4 p-3 bg-secondary rounded-lg">
                            <div className="w-8 h-8 bg-green-500 text-white rounded-full flex items-center justify-center text-sm font-bold">2</div>
                            <div className="flex-1">
                              <div className="font-medium">Gemini 2.5 Flash AI 評分</div>
                              <div className="text-sm text-muted-foreground">
                                AI原始評分: {latestUpdate.calculationDetails.geminiRawScore}/255 | 基準分數: 128
                              </div>
                            </div>
                            <div className="text-lg font-bold text-green-400">{latestUpdate.calculationDetails.geminiRawScore}</div>
                          </div>
                          
                          <div className="flex items-center space-x-4 p-3 bg-secondary rounded-lg">
                            <div className="w-8 h-8 bg-purple-500 text-white rounded-full flex items-center justify-center text-sm font-bold">3</div>
                            <div className="flex-1">
                              <div className="font-medium">ULTU 分數平滑</div>
                              <div className="text-sm text-muted-foreground">
                                策略: {latestUpdate.calculationDetails.strategy} | α = {latestUpdate.calculationDetails.smoothingFactor} | 前次: {latestUpdate.calculationDetails.previousScore}
                              </div>
                            </div>
                            <div className="text-lg font-bold text-primary">{latestUpdate.newScore}</div>
                          </div>
                        </div>

                        {/* Relevance Factors */}
                        {latestUpdate.calculationDetails.relevanceFactors.length > 0 && (
                          <div className="bg-muted/50 p-4 rounded-lg">
                            <h5 className="font-semibold mb-3 flex items-center">
                              <Calculator className="w-4 h-4 mr-2" />
                              Gemini AI 評分因子分析
                            </h5>
                            <div className="space-y-2">
                              {latestUpdate.calculationDetails.relevanceFactors.map((factor, index) => (
                                <div key={index} className="flex items-center justify-between p-2 bg-background rounded">
                                  <div>
                                    <div className="font-medium text-sm">{factor.factor}</div>
                                    <div className="text-xs text-muted-foreground">{factor.description}</div>
                                  </div>
                                  <div className="text-sm font-bold text-primary">+{factor.contribution}</div>
                                </div>
                              ))}
                            </div>
                            <div className="mt-3 pt-3 border-t border-border/50">
                              <div className="text-xs text-muted-foreground">
                                總加分: +{latestUpdate.calculationDetails.relevanceFactors.reduce((sum, f) => sum + f.contribution, 0)} 
                                | 最終Gemini評分: {latestUpdate.calculationDetails.geminiRawScore}/255
                              </div>
                            </div>
                          </div>
                        )}
                      </div>
                    )}

                    {/* Update History */}
                    {history && history.updates.length > 0 && (
                      <div className="space-y-4">
                        <h4 className="text-lg font-semibold flex items-center">
                          <Clock className="w-5 h-5 mr-2 text-primary" />
                          更新歷史記錄
                        </h4>
                        
                        <div className="max-h-64 overflow-y-auto space-y-2">
                          {history.updates.slice().reverse().map((update, index) => (
                            <div key={index} className="p-3 bg-secondary rounded-lg border border-border">
                              <div className="flex items-center justify-between mb-2">
                                <span className="text-xs text-muted-foreground">
                                  {new Date(update.timestamp).toLocaleString()}
                                </span>
                                <div className="flex items-center space-x-2">
                                  <span className="text-sm font-mono">{update.previousScore} → {update.newScore}</span>
                                  <span className={`text-sm font-bold ${update.change > 0 ? 'text-green-400' : update.change < 0 ? 'text-red-400' : 'text-gray-400'}`}>
                                    {update.change > 0 ? '+' : ''}{update.change}
                                  </span>
                                </div>
                              </div>
                              <p className="text-xs text-muted-foreground line-clamp-2">{update.content}</p>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Dimension Definition */}
                    {dimension && (
                      <div className="bg-muted/50 p-4 rounded-lg mb-4">
                        <h5 className="font-semibold mb-2">維度定義</h5>
                        <p className="text-sm text-muted-foreground mb-2">{dimension.definition}</p>
                        <div className="text-xs text-muted-foreground">
                          <strong>評分規則:</strong> {dimension.encoding_rules}
                        </div>
                        <div className="mt-2">
                          <strong className="text-xs">Meta-Tags:</strong>
                          <div className="flex flex-wrap gap-1 mt-1">
                            {dimension.meta_tags.map((tag, index) => (
                              <span key={index} className="px-2 py-1 bg-primary/20 text-primary text-xs rounded-full">
                                {tag}
                              </span>
                            ))}
                          </div>
                        </div>
                      </div>
                    )}
                  </>
                );
              })()}
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Processing Overlay */}
      <AnimatePresence>
        {processingState === 'processing' && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 bg-background/80 backdrop-blur-sm rounded-lg flex items-center justify-center"
          >
            <div className="text-center">
              <motion.div
                animate={{ rotate: 360 }}
                transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
                className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full mx-auto mb-2"
              />
              <p className="text-sm text-muted-foreground">Updating Matrix...</p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default MatrixVisualization;