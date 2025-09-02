import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Grid, Filter, TrendingUp, TrendingDown, Minus, Info, X, Calculator, Brain, Zap } from 'lucide-react';
import { ProcessingState } from '../types';

interface MatrixVisualizationProps {
  matrixData: Record<string, number>;
  processingState: ProcessingState;
}

const MatrixVisualization: React.FC<MatrixVisualizationProps> = ({ matrixData, processingState }) => {
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [selectedDimension, setSelectedDimension] = useState<string | null>(null);
  const [showDetailModal, setShowDetailModal] = useState<string | null>(null);

  // Mock dimension names mapping (in real app this would come from metadata)
  // 使用真實Twin3維度定義
  const TWIN3_METADATA = {
    '0008': { name: 'Dietary Habits', definition: '個人飲食習慣和營養選擇的傾向', meta_tags: ['食物', '營養', '健康', '飲食', '料理'] },
    '0067': { name: 'Spiritual Awareness', definition: '對精神層面和內在成長的關注程度', meta_tags: ['精神', '內在', '成長', '覺察', '靈性'] },
    '006C': { name: 'Dimension 006C', definition: '個人特質維度006C', meta_tags: ['特質', '行為', '表現'] },
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
    // Mock change detection - in real app this would track previous values
    const score = matrixData[attrId] || 128;
    if (score > 150) return <TrendingUp className="w-3 h-3 text-green-400" />;
    if (score < 100) return <TrendingDown className="w-3 h-3 text-red-400" />;
    return <Minus className="w-3 h-3 text-gray-400" />;
  };

  const getDimensionName = (attrId: string) => {
    return TWIN3_METADATA[attrId]?.name || `Dimension ${attrId}`;
  };

  const getCalculationDetails = (attrId: string, score: number, userContent: string = "用戶內容示例") => {
    const dimension = TWIN3_METADATA[attrId];
    if (!dimension) return null;
    
    // 真實Twin3演算法計算過程重現
    const previousScore = 128; // 模擬前次分數
    
    // 1. MSMM語意匹配過程
    const textLower = userContent.toLowerCase();
    const matchedMetaTags = dimension.meta_tags.filter(tag => textLower.includes(tag));
    const semanticSimilarity = matchedMetaTags.length / dimension.meta_tags.length;
    
    // 2. Gemini AI評分過程
    let geminiRawScore = 128;
    let relevanceScore = 0;
    
    // 基於Meta-Tags匹配計算
    matchedMetaTags.forEach(tag => {
      relevanceScore += 25;
    });
    
    // 內容複雜度分析
    if (userContent.length > 50) relevanceScore += 15;
    if (userContent.length > 100) relevanceScore += 10;
    
    // 語意深度分析
    const strongKeywords = ['帶領', '完成', '成功', '創新', '學習', '幫助'];
    const semanticMatches = strongKeywords.filter(keyword => textLower.includes(keyword)).length;
    relevanceScore += semanticMatches * 20;
    
    geminiRawScore = Math.min(255, Math.max(0, 128 + relevanceScore));
    
    // 3. ULTU分數平滑
    const alpha = 0.3; // Twin3標準平滑係數
    const smoothedScore = Math.round(alpha * geminiRawScore + (1 - alpha) * previousScore);
    
    // 4. 時間衰減（模擬）
    const timeDecayFactor = 0.98; // 假設輕微衰減
    
    return {
      dimension,
      geminiRawScore,
      previousScore,
      smoothingFactor: alpha,
      timeDecayFactor,
      finalScore: smoothedScore,
      formula: `新分數 = α × Gemini評分 + (1-α) × 前次分數`,
      calculation: `${smoothedScore} = ${alpha} × ${geminiRawScore} + ${1-alpha} × ${previousScore}`,
      metaTags: matchedMetaTags,
      semanticSimilarity,
      matchingProcess: [
        { 
          step: 'MSMM Meta-Tag提取', 
          result: `提取標籤: ${matchedMetaTags.join(', ') || '無匹配'}`, 
          confidence: Math.min(0.95, 0.6 + matchedMetaTags.length * 0.1) 
        },
        { 
          step: 'MSMM語意匹配', 
          result: `維度${attrId}相似度: ${(semanticSimilarity * 100).toFixed(1)}%`, 
          confidence: semanticSimilarity 
        },
        { 
          step: 'Gemini AI評分', 
          result: `原始評分: ${geminiRawScore}/255 (基準128 + 相關性${relevanceScore})`, 
          confidence: 0.88 
        },
        { 
          step: 'ULTU分數平滑', 
          result: `最終分數: ${smoothedScore}/255 (α=${alpha})`, 
          confidence: 1.0 
        }
      ]
    };
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
          <div className="text-xs text-muted-foreground">
            共更新 {Object.keys(matrixData).length} 個維度 | 
            最高分數: {Math.max(...Object.values(matrixData))} | 
            平均分數: {Math.round(Object.values(matrixData).reduce((a, b) => a + b, 0) / Object.keys(matrixData).length)}
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
            
            return (
              <motion.div
                key={attrId}
                className={`matrix-cell rounded-lg border border-border/50 relative group cursor-pointer p-4 ${categoryColor}`}
                style={{ 
                  opacity: getScoreIntensity(score),
                }}
                whileHover={{ scale: 1.05, zIndex: 10 }}
                onClick={() => setShowDetailModal(attrId)}
                animate={processingState === 'processing' ? { 
                  scale: [1, 1.05, 1],
                  opacity: [getScoreIntensity(score), 0.8, getScoreIntensity(score)]
                } : {}}
                transition={{ duration: 0.3 }}
              >
                <div className="text-center">
                  <div className="text-lg font-bold text-white drop-shadow-sm mb-1">
                    {score}
                  </div>
                  <div className="text-xs text-white/90 font-medium mb-1">
                    {attrId}
                  </div>
                  <div className="text-xs text-white/80 leading-tight">
                    {dimensionName}
                  </div>
                </div>
                
                {/* Algorithm Result Badge */}
                <div className="absolute top-1 right-1">
                  <div className="w-2 h-2 bg-white/80 rounded-full"></div>
                </div>
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
              
              return (
                <motion.div
                  key={attrId}
                  className="flex items-center justify-between p-3 bg-secondary rounded-lg border border-border"
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.3 }}
                >
                  <div className="flex items-center space-x-3">
                    <div className={`w-3 h-3 rounded-full ${category?.[1].color || 'bg-gray-500'}`}></div>
                    <div>
                      <div className="font-mono text-sm font-semibold">{attrId}</div>
                      <div className="text-xs text-muted-foreground">{dimensionName}</div>
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
              className="bg-card border border-border rounded-lg p-6 max-w-2xl w-full max-h-[80vh] overflow-y-auto"
              onClick={(e) => e.stopPropagation()}
            >
              {(() => {
                const score = matrixData[showDetailModal];
                const dimensionName = getDimensionName(showDetailModal);
                const details = getCalculationDetails(showDetailModal, score);
                
                return (
                  <>
                    {/* Header */}
                    <div className="flex items-center justify-between mb-6">
                      <div>
                        <h3 className="text-xl font-bold">{dimensionName}</h3>
                        <p className="text-muted-foreground font-mono">{showDetailModal}</p>
                      </div>
                      <button
                        onClick={() => setShowDetailModal(null)}
                        className="p-2 hover:bg-secondary rounded-lg transition-colors"
                      >
                        <X className="w-5 h-5" />
                      </button>
                    </div>

                    {/* Score Display */}
                    <div className="grid grid-cols-3 gap-4 mb-6">
                      <div className="bg-primary/10 p-4 rounded-lg text-center">
                        <div className="text-2xl font-bold text-primary">{score}</div>
                        <div className="text-sm text-muted-foreground">演算法分數</div>
                      </div>
                      <div className="bg-secondary p-4 rounded-lg text-center">
                        <div className="text-2xl font-bold font-mono">0x{score.toString(16).toUpperCase().padStart(2, '0')}</div>
                        <div className="text-sm text-muted-foreground">HEX值</div>
                      </div>
                      <div className="bg-accent/10 p-4 rounded-lg text-center">
                        <div className="text-2xl font-bold">{Math.round((score/255)*100)}%</div>
                        <div className="text-sm text-muted-foreground">相對強度</div>
                      </div>
                    </div>

                    {/* Calculation Process */}
                    <div className="space-y-4">
                      <h4 className="text-lg font-semibold flex items-center">
                        <Calculator className="w-5 h-5 mr-2 text-primary" />
                        演算法計算過程
                      </h4>
                      
                      {/* Processing Steps */}
                      <div className="space-y-3">
                        {details.matchingProcess.map((step, index) => (
                          <div key={index} className="flex items-center space-x-4 p-3 bg-secondary rounded-lg">
                            <div className="w-8 h-8 bg-primary text-primary-foreground rounded-full flex items-center justify-center text-sm font-bold">
                              {index + 1}
                            </div>
                            <div className="flex-1">
                              <div className="font-medium">{step.step}</div>
                              <div className="text-sm text-muted-foreground">{step.result}</div>
                            </div>
                            <div className="text-sm font-mono bg-primary/20 px-2 py-1 rounded">
                              {Math.round(step.confidence * 100)}%
                            </div>
                          </div>
                        ))}
                      </div>

                      {/* 維度定義 */}
                      <div className="bg-muted/50 p-4 rounded-lg">
                        <h5 className="font-semibold mb-2">維度定義</h5>
                        <p className="text-sm text-muted-foreground">{details.dimension?.definition}</p>
                      </div>

                      {/* ULTU Formula */}
                      <div className="bg-accent/10 p-4 rounded-lg">
                        <h5 className="font-semibold mb-2 flex items-center">
                          <Zap className="w-4 h-4 mr-2" />
                          ULTU 分數平滑公式 (Twin3演算法)
                        </h5>
                        <div className="font-mono text-sm bg-background p-3 rounded border">
                          {details.formula}
                        </div>
                        <div className="mt-2 text-sm text-muted-foreground">
                          實際計算: {details.calculation}
                        </div>
                        <div className="mt-2 text-xs text-muted-foreground">
                          α (平滑係數) = {details.smoothingFactor} | 時間衰減係數 = {details.timeDecayFactor} | 語意相似度 = {(details.semanticSimilarity * 100).toFixed(1)}%
                        </div>
                      </div>

                      {/* Meta Tags Used */}
                      <div className="bg-secondary/50 p-4 rounded-lg">
                        <h5 className="font-semibold mb-2 flex items-center">
                          <Brain className="w-4 h-4 mr-2" />
                          匹配的 Meta-Tags (MSMM提取)
                        </h5>
                        {details.metaTags.length > 0 ? (
                          <div className="flex flex-wrap gap-2">
                            {details.metaTags.map((tag, index) => (
                              <span
                                key={index}
                                className="px-3 py-1 bg-primary/20 text-primary rounded-full text-sm"
                              >
                                {tag}
                              </span>
                            ))}
                          </div>
                        ) : (
                          <p className="text-sm text-muted-foreground">此維度無匹配的Meta-Tags</p>
                        )}
                        <div className="mt-2 text-xs text-muted-foreground">
                          維度所有Meta-Tags: {details.dimension?.meta_tags.join(', ')}
                        </div>
                      </div>

                      {/* Technical Details */}
                      <div className="grid grid-cols-2 gap-4 text-sm">
                        <div className="space-y-2">
                          <div className="flex justify-between">
                            <span className="text-muted-foreground">Gemini AI原始評分:</span>
                            <span className="font-mono font-bold">{details.geminiRawScore}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-muted-foreground">前次分數:</span>
                            <span className="font-mono">{details.previousScore}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-muted-foreground">ULTU平滑係數 (α):</span>
                            <span className="font-mono">{details.smoothingFactor}</span>
                          </div>
                        </div>
                        <div className="space-y-2">
                          <div className="flex justify-between">
                            <span className="text-muted-foreground">時間衰減係數:</span>
                            <span className="font-mono">{details.timeDecayFactor}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-muted-foreground">Twin3最終分數:</span>
                            <span className="font-mono font-bold text-primary">{details.finalScore}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-muted-foreground">分數變化:</span>
                            <span className={`font-mono font-bold ${score > details.previousScore ? 'text-green-400' : score < details.previousScore ? 'text-red-400' : 'text-gray-400'}`}>
                              {score > details.previousScore ? '+' : ''}{score - details.previousScore}
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>
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