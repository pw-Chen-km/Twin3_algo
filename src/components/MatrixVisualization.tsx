import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Grid, Filter, TrendingUp, TrendingDown, Minus, Info, X, Calculator, Brain, Zap, Clock, BarChart3, Eye, EyeOff } from 'lucide-react';
import { ProcessingState, DimensionHistory } from '../types';

interface MatrixVisualizationProps {
  matrixData: Record<string, number>;
  processingState: ProcessingState;
  dimensionHistory: Record<string, DimensionHistory>;
}

const MatrixVisualization: React.FC<MatrixVisualizationProps> = ({ matrixData, processingState, dimensionHistory }) => {
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [viewMode, setViewMode] = useState<'grid' | 'list' | 'matrix256'>('matrix256');
  const [selectedDimension, setSelectedDimension] = useState<string | null>(null);
  const [showDetailModal, setShowDetailModal] = useState<string | null>(null);

  // 使用真實twin3維度定義
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

  // 生成256個維度的完整矩陣
  const generate256Matrix = () => {
    const matrix = [];
    for (let i = 0; i < 256; i++) {
      const hexAddress = i.toString(16).toUpperCase().padStart(4, '0');
      const score = matrixData[hexAddress] || 0; // 默認值0
      const isActive = matrixData.hasOwnProperty(hexAddress);
      
      matrix.push({
        address: hexAddress,
        score,
        isActive,
        row: Math.floor(i / 16),
        col: i % 16
      });
    }
    return matrix;
  };

  const matrix256 = generate256Matrix();

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
    <div className="bg-white dark:bg-gray-900 rounded-lg border-2 border-gray-300 dark:border-gray-600 p-6 shadow-lg">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold flex items-center text-gray-900 dark:text-gray-100">
          <Grid className="w-5 h-5 mr-2 text-blue-600 dark:text-blue-400" />
          twin Matrix Visualization
        </h3>
        
        <div className="flex items-center space-x-2">
          <select
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
            className="bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 px-3 py-1 rounded-md border-2 border-gray-300 dark:border-gray-600 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="all">All Dimensions</option>
            {Object.entries(categories).map(([key, cat]) => (
              <option key={key} value={key}>{cat.name}</option>
            ))}
          </select>
          
          <button
            onClick={() => setViewMode(viewMode === 'matrix256' ? 'grid' : viewMode === 'grid' ? 'list' : 'matrix256')}
            className="p-2 bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700 rounded-md border-2 border-gray-300 dark:border-gray-600 transition-colors"
          >
            {viewMode === 'matrix256' ? <Eye className="w-4 h-4" /> : <Filter className="w-4 h-4" />}
          </button>
        </div>
      </div>

      {/* Algorithm Results Summary */}
      {Object.keys(matrixData).length > 0 && (
        <div className="mb-4 p-4 bg-blue-50 dark:bg-blue-900/20 border-2 border-blue-200 dark:border-blue-700 rounded-lg">
          <h4 className="text-sm font-semibold mb-2 flex items-center text-blue-700 dark:text-blue-300">
            <Info className="w-4 h-4 mr-2" />
            演算法計算結果 (Algorithm Results)
          </h4>
          <div className="grid grid-cols-2 gap-4 text-xs">
            <div>
              <div className="text-gray-600 dark:text-gray-400">共更新維度: <span className="font-bold text-gray-900 dark:text-gray-100">{Object.keys(matrixData).length}</span></div>
              <div className="text-gray-600 dark:text-gray-400">最高分數: <span className="font-bold text-green-600 dark:text-green-400">{Math.max(...Object.values(matrixData))}</span></div>
            </div>
            <div>
              <div className="text-gray-600 dark:text-gray-400">平均分數: <span className="font-bold text-gray-900 dark:text-gray-100">{Math.round(Object.values(matrixData).reduce((a, b) => a + b, 0) / Object.keys(matrixData).length)}</span></div>
              <div className="text-gray-600 dark:text-gray-400">總更新次數: <span className="font-bold text-blue-600 dark:text-blue-400">{Object.values(dimensionHistory).reduce((sum, hist) => sum + hist.totalUpdates, 0)}</span></div>
            </div>
          </div>
        </div>
      )}
      
      {/* Category Legend */}
      <div className="flex flex-wrap gap-2 mb-4">
        {Object.entries(categories).map(([key, cat]) => (
          <div key={key} className="flex items-center space-x-1">
            <div className={`w-3 h-3 rounded-full ${cat.color}`}></div>
            <span className="text-xs text-gray-600 dark:text-gray-400">{cat.name}</span>
          </div>
        ))}
      </div>

      <div>
        {/* 256維度矩陣視圖 */}
        {viewMode === 'matrix256' && (
          <div className="space-y-4">
            <div className="text-center">
              <h4 className="text-sm font-semibold text-gray-900 dark:text-gray-100 mb-2">
                完整256維度 twin Matrix (16x16 DNA位址映射)
              </h4>
              <p className="text-xs text-gray-600 dark:text-gray-400 mb-4">
                每個格子代表一個維度，位址格式為4位16進制 (0000-00FF)
              </p>
            </div>
            
            {/* Terminal風格256維度矩陣 */}
            <div className="bg-black text-green-400 p-4 rounded-lg border-2 border-gray-600 font-mono text-xs">
              {/* Terminal Header */}
              <div className="text-green-300 mb-3 border-b border-green-600 pb-2">
                <div className="flex items-center space-x-2">
                  <span className="text-green-500">●</span>
                  <span>twin Matrix DNA Map [256 dimensions]</span>
                </div>
                <div className="text-green-600 text-xs mt-1">
                  Address: 0x0000-0x00FF | Format: HEX | Status: ACTIVE
                </div>
              </div>
              
              {/* Column Headers */}
              <div className="flex text-green-600 mb-1">
                <div className="w-12 text-right pr-2">ADDR</div>
                {Array.from({length: 16}, (_, i) => (
                  <div key={i} className="w-6 text-center">
                    {i.toString(16).toUpperCase()}
                  </div>
                ))}
              </div>
              
              {/* Matrix Rows */}
              {Array.from({length: 16}, (_, row) => (
                <div key={row} className="flex items-center">
                  {/* Row Address */}
                  <div className="w-12 text-right pr-2 text-green-600">
                    {row.toString(16).toUpperCase().padStart(2, '0')}0:
                  </div>
                  
                  {/* Row Data */}
                  {Array.from({length: 16}, (_, col) => {
                    const index = row * 16 + col;
                    const hexAddress = index.toString(16).toUpperCase().padStart(4, '0');
                    const score = matrixData[hexAddress] || 0;
                    const isActive = matrixData.hasOwnProperty(hexAddress);
                    const history = dimensionHistory[hexAddress];
                    
                    const getTerminalColor = (score: number, isActive: boolean) => {
                      if (!isActive) return 'text-gray-600';
                      if (score >= 200) return 'text-green-400';
                      if (score >= 150) return 'text-yellow-400';
                      if (score >= 100) return 'text-orange-400';
                      if (score >= 50) return 'text-red-400';
                      return 'text-gray-400';
                    };
                    
                    return (
                      <motion.div
                        key={hexAddress}
                        className={`w-6 text-center cursor-pointer hover:bg-green-900 hover:text-white transition-all duration-200 ${getTerminalColor(score, isActive)}`}
                        whileHover={{ scale: 1.2 }}
                        onClick={() => setShowDetailModal(hexAddress)}
                        title={`${hexAddress}: ${getDimensionName(hexAddress)} (${score}/255)${history ? ` | Updates: ${history.totalUpdates}` : ''}`}
                      >
                        {score.toString(16).toUpperCase().padStart(2, '0')}
                        {isActive && <span className="text-white">*</span>}
                      </motion.div>
                    );
                  })}
                </div>
              ))}
              
              {/* Terminal Footer */}
              <div className="mt-3 pt-2 border-t border-green-600 text-green-600 text-xs">
                <div className="flex justify-between">
                  <span>Active: {Object.keys(matrixData).length}/256</span>
                  <span>Updates: {Object.values(dimensionHistory).reduce((sum, hist) => sum + hist.totalUpdates, 0)}</span>
                </div>
                <div className="mt-1 text-green-700">
                  Legend: <span className="text-green-400">High</span> | <span className="text-yellow-400">Med</span> | <span className="text-red-400">Low</span> | <span className="text-gray-600">Inactive</span> | * = Active
                </div>
              </div>
            </div>
            
            <div className="text-xs text-gray-500 dark:text-gray-400 text-center space-y-1 mt-4">
              <p>💡 點擊任意維度查看詳細資訊</p>
              <p>🎯 活躍維度有白色圓點標記，更新次數顯示在左下角</p>
              <p>📊 顏色深度代表分數強度，16進制值顯示在格子中</p>
            </div>
          </div>
        )}

        {viewMode === 'grid' && (
          /* Grid View */
          <div className="grid grid-cols-4 gap-3 max-h-96 overflow-auto">
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
                  className={`matrix-cell rounded-lg border-2 border-gray-300 dark:border-gray-600 relative group cursor-pointer p-4 ${categoryColor} hover:border-blue-500 hover:shadow-lg hover:shadow-blue-500/20 transition-all duration-300 transform hover:-translate-y-1`}
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
                >
                  <div className="text-center relative h-full flex flex-col justify-center">
                    <div className="absolute -top-2 -right-2 w-4 h-4 bg-white/20 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                      <div className="w-2 h-2 bg-white rounded-full animate-pulse"></div>
                    </div>
                    
                    <div className="text-2xl font-bold text-white drop-shadow-lg mb-2">
                      {score}
                    </div>
                    {latestChange !== 0 && (
                      <div className={`text-sm font-bold mb-2 px-2 py-1 rounded-full bg-white/30 ${latestChange > 0 ? 'text-green-200' : 'text-red-200'}`}>
                        {latestChange > 0 ? '+' : ''}{latestChange}
                      </div>
                    )}
                    <div className="text-sm text-white/90 font-bold mb-1">
                      {attrId}
                    </div>
                    <div className="text-xs text-white/90 leading-tight font-medium">
                      {dimensionName}
                    </div>
                    
                    <div className="absolute inset-0 bg-white/20 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                      <div className="text-sm text-white font-bold bg-black/50 px-3 py-2 rounded-lg shadow-lg">
                        點擊查看詳情
                      </div>
                    </div>
                  </div>
                  
                  <div className="absolute top-1 right-1">
                    {history && history.totalUpdates > 0 && (
                      <div className="bg-white/40 text-white text-sm px-2 py-1 rounded-full font-bold border border-white/30 shadow-lg">
                        {history.totalUpdates}
                      </div>
                    )}
                  </div>
                </motion.div>
              );
            })}
          </div>
        )}

        {viewMode === 'list' && (
          /* List View */
          <div className="space-y-2 max-h-96 overflow-auto">
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
                    className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-800 rounded-lg border-2 border-gray-200 dark:border-gray-700 cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ duration: 0.3 }}
                    onClick={() => setShowDetailModal(attrId)}
                  >
                    <div className="flex items-center space-x-3">
                      <div className={`w-3 h-3 rounded-full ${category?.[1].color || 'bg-gray-500'}`}></div>
                      <div>
                        <div className="font-mono text-sm font-semibold text-gray-900 dark:text-gray-100">{attrId}</div>
                        <div className="text-xs text-gray-600 dark:text-gray-400">{dimensionName}</div>
                        {history && (
                          <div className="text-xs text-gray-500 dark:text-gray-500">
                            更新 {history.totalUpdates} 次
                          </div>
                        )}
                      </div>
                      {getChangeIcon(attrId)}
                    </div>
                    
                    <div className="flex items-center space-x-2">
                      <div className="w-24 h-2 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                        <motion.div
                          className={`h-full ${getScoreColor(score)}`}
                          initial={{ width: 0 }}
                          animate={{ width: `${(score / 255) * 100}%` }}
                          transition={{ duration: 0.5 }}
                        />
                      </div>
                      <div className="text-right">
                        <div className="font-mono text-sm font-bold text-gray-900 dark:text-gray-100">{score}</div>
                        {latestChange !== 0 && (
                          <div className={`text-xs font-bold ${latestChange > 0 ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}`}>
                            {latestChange > 0 ? '+' : ''}{latestChange}
                          </div>
                        )}
                        <div className="text-xs text-gray-500 dark:text-gray-500">/255</div>
                      </div>
                    </div>
                  </motion.div>
                );
              })}
          </div>
        )}
      </div>

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
              className="bg-white dark:bg-gray-900 border-2 border-gray-300 dark:border-gray-600 rounded-lg p-6 max-w-4xl w-full max-h-[90vh] overflow-y-auto shadow-2xl"
              onClick={(e) => e.stopPropagation()}
            >
              {(() => {
                const score = matrixData[showDetailModal] || 128;
                const dimensionName = getDimensionName(showDetailModal);
                const dimension = TWIN3_METADATA[showDetailModal];
                const history = dimensionHistory[showDetailModal];
                const latestUpdate = history?.updates[history.updates.length - 1];
                
                return (
                  <>
                    <div className="flex items-center justify-between mb-6">
                      <div>
                        <h3 className="text-xl font-bold text-gray-900 dark:text-gray-100">{dimensionName}</h3>
                        <p className="text-gray-600 dark:text-gray-400 font-mono">{showDetailModal}</p>
                        {history && (
                          <p className="text-sm text-gray-500 dark:text-gray-500">
                            總更新次數: {history.totalUpdates} | 最後更新: {new Date(history.lastUpdated).toLocaleString()}
                          </p>
                        )}
                      </div>
                      <button
                        onClick={() => setShowDetailModal(null)}
                        className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors"
                      >
                        <X className="w-5 h-5 text-gray-600 dark:text-gray-400" />
                      </button>
                    </div>

                    <div className="grid grid-cols-4 gap-4 mb-6">
                      <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-lg text-center border-2 border-blue-200 dark:border-blue-700">
                        <div className="text-2xl font-bold text-blue-600 dark:text-blue-400">{score}</div>
                        <div className="text-sm text-gray-600 dark:text-gray-400">當前分數</div>
                      </div>
                      <div className="bg-gray-50 dark:bg-gray-800 p-4 rounded-lg text-center border-2 border-gray-200 dark:border-gray-700">
                        <div className="text-2xl font-bold font-mono text-gray-900 dark:text-gray-100">0x{score.toString(16).toUpperCase().padStart(2, '0')}</div>
                        <div className="text-sm text-gray-600 dark:text-gray-400">HEX值</div>
                      </div>
                      <div className="bg-purple-50 dark:bg-purple-900/20 p-4 rounded-lg text-center border-2 border-purple-200 dark:border-purple-700">
                        <div className="text-2xl font-bold text-purple-600 dark:text-purple-400">{Math.round((score/255)*100)}%</div>
                        <div className="text-sm text-gray-600 dark:text-gray-400">相對強度</div>
                      </div>
                      <div className={`p-4 rounded-lg text-center border-2 ${latestUpdate?.change > 0 ? 'bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-700' : latestUpdate?.change < 0 ? 'bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-700' : 'bg-gray-50 dark:bg-gray-800 border-gray-200 dark:border-gray-700'}`}>
                        <div className={`text-2xl font-bold ${latestUpdate?.change > 0 ? 'text-green-600 dark:text-green-400' : latestUpdate?.change < 0 ? 'text-red-600 dark:text-red-400' : 'text-gray-600 dark:text-gray-400'}`}>
                          {latestUpdate?.change > 0 ? '+' : ''}{latestUpdate?.change || 0}
                        </div>
                        <div className="text-sm text-gray-600 dark:text-gray-400">最新變化</div>
                      </div>
                    </div>

                    {latestUpdate?.calculationDetails && (
                      <div className="space-y-4 mb-6">
                        <h4 className="text-lg font-semibold flex items-center text-gray-900 dark:text-gray-100">
                          <Calculator className="w-5 h-5 mr-2 text-blue-600 dark:text-blue-400" />
                          最新計算過程 (twin3演算法)
                        </h4>
                        
                        <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-lg border-2 border-blue-200 dark:border-blue-700">
                          <h5 className="font-semibold mb-2 flex items-center text-blue-700 dark:text-blue-300">
                            <Zap className="w-4 h-4 mr-2" />
                            twin3 ULTU 分數平滑公式
                          </h5>
                          <div className="font-mono text-sm bg-white dark:bg-gray-800 p-3 rounded border-2 border-gray-200 dark:border-gray-700 mb-2 text-gray-900 dark:text-gray-100">
                            新分數 = α × Gemini評分 + (1-α) × 前次分數 (α={latestUpdate.calculationDetails.smoothingFactor})
                          </div>
                          <div className="font-mono text-sm bg-blue-100 dark:bg-blue-800 p-3 rounded border-2 border-blue-300 dark:border-blue-600 text-blue-900 dark:text-blue-100">
                            {latestUpdate.newScore} = {latestUpdate.calculationDetails.smoothingFactor} × {latestUpdate.calculationDetails.geminiRawScore} + {1-latestUpdate.calculationDetails.smoothingFactor} × {latestUpdate.calculationDetails.previousScore}
                          </div>
                          <div className="text-xs text-gray-600 dark:text-gray-400 mt-2">
                            更新策略: {latestUpdate.calculationDetails.strategy} | 第 {latestUpdate.calculationDetails.updateCount} 次更新
                          </div>
                        </div>

                        <div className="space-y-3">
                          <div className="flex items-center space-x-4 p-3 bg-gray-50 dark:bg-gray-800 rounded-lg border-2 border-gray-200 dark:border-gray-700">
                            <div className="w-8 h-8 bg-blue-500 text-white rounded-full flex items-center justify-center text-sm font-bold">1</div>
                            <div className="flex-1">
                              <div className="font-medium text-gray-900 dark:text-gray-100">MSMM 語意匹配</div>
                              <div className="text-sm text-gray-600 dark:text-gray-400">
                                語意相似度: {(latestUpdate.calculationDetails.msmmSimilarity * 100).toFixed(1)}% | 
                                匹配標籤: {latestUpdate.calculationDetails.matchedMetaTags.join(', ') || '無'}
                              </div>
                            </div>
                            <div className="text-sm font-bold text-blue-600 dark:text-blue-400">
                              {(latestUpdate.calculationDetails.msmmSimilarity * 100).toFixed(1)}%
                            </div>
                          </div>
                          
                          <div className="flex items-center space-x-4 p-3 bg-gray-50 dark:bg-gray-800 rounded-lg border-2 border-gray-200 dark:border-gray-700">
                            <div className="w-8 h-8 bg-green-500 text-white rounded-full flex items-center justify-center text-sm font-bold">2</div>
                            <div className="flex-1">
                              <div className="font-medium text-gray-900 dark:text-gray-100">Gemini 2.5 Flash AI 評分</div>
                              <div className="text-sm text-gray-600 dark:text-gray-400">
                                AI原始評分: {latestUpdate.calculationDetails.geminiRawScore}/255 | 基準分數: 128
                              </div>
                            </div>
                            <div className="text-lg font-bold text-green-600 dark:text-green-400">{latestUpdate.calculationDetails.geminiRawScore}</div>
                          </div>
                          
                          <div className="flex items-center space-x-4 p-3 bg-gray-50 dark:bg-gray-800 rounded-lg border-2 border-gray-200 dark:border-gray-700">
                            <div className="w-8 h-8 bg-purple-500 text-white rounded-full flex items-center justify-center text-sm font-bold">3</div>
                            <div className="flex-1">
                              <div className="font-medium text-gray-900 dark:text-gray-100">ULTU 分數平滑</div>
                              <div className="text-sm text-gray-600 dark:text-gray-400">
                                策略: {latestUpdate.calculationDetails.strategy} | α = {latestUpdate.calculationDetails.smoothingFactor} | 前次: {latestUpdate.calculationDetails.previousScore}
                              </div>
                            </div>
                            <div className="text-lg font-bold text-blue-600 dark:text-blue-400">{latestUpdate.newScore}</div>
                          </div>
                        </div>

                        {latestUpdate.calculationDetails.relevanceFactors.length > 0 && (
                          <div className="bg-gray-50 dark:bg-gray-800 p-4 rounded-lg border-2 border-gray-200 dark:border-gray-700">
                            <h5 className="font-semibold mb-3 flex items-center text-gray-900 dark:text-gray-100">
                              <Calculator className="w-4 h-4 mr-2" />
                              Gemini AI 評分因子分析
                            </h5>
                            <div className="space-y-2">
                              {latestUpdate.calculationDetails.relevanceFactors.map((factor, index) => (
                                <div key={index} className="flex items-center justify-between p-2 bg-white dark:bg-gray-900 rounded border-2 border-gray-200 dark:border-gray-700">
                                  <div>
                                    <div className="font-medium text-sm text-gray-900 dark:text-gray-100">{factor.factor}</div>
                                    <div className="text-xs text-gray-600 dark:text-gray-400">{factor.description}</div>
                                  </div>
                                  <div className="text-sm font-bold text-blue-600 dark:text-blue-400">+{factor.contribution}</div>
                                </div>
                              ))}
                            </div>
                            <div className="mt-3 pt-3 border-t-2 border-gray-200 dark:border-gray-700">
                              <div className="text-xs text-gray-600 dark:text-gray-400">
                                總加分: +{latestUpdate.calculationDetails.relevanceFactors.reduce((sum, f) => sum + f.contribution, 0)} 
                                | 最終Gemini評分: {latestUpdate.calculationDetails.geminiRawScore}/255
                              </div>
                            </div>
                          </div>
                        )}
                      </div>
                    )}

                    {history && history.updates.length > 0 && (
                      <div className="space-y-4">
                        <h4 className="text-lg font-semibold flex items-center text-gray-900 dark:text-gray-100">
                          <Clock className="w-5 h-5 mr-2 text-blue-600 dark:text-blue-400" />
                          更新歷史記錄
                        </h4>
                        
                        <div className="max-h-64 overflow-y-auto space-y-2">
                          {history.updates.slice().reverse().map((update, index) => (
                            <div key={index} className="p-3 bg-gray-50 dark:bg-gray-800 rounded-lg border-2 border-gray-200 dark:border-gray-700">
                              <div className="flex items-center justify-between mb-2">
                                <span className="text-xs text-gray-500 dark:text-gray-500">
                                  {new Date(update.timestamp).toLocaleString()}
                                </span>
                                <div className="flex items-center space-x-2">
                                  <span className="text-sm font-mono text-gray-900 dark:text-gray-100">{update.previousScore} → {update.newScore}</span>
                                  <span className={`text-sm font-bold ${update.change > 0 ? 'text-green-600 dark:text-green-400' : update.change < 0 ? 'text-red-600 dark:text-red-400' : 'text-gray-600 dark:text-gray-400'}`}>
                                    {update.change > 0 ? '+' : ''}{update.change}
                                  </span>
                                </div>
                              </div>
                              <p className="text-xs text-gray-600 dark:text-gray-400 line-clamp-2">{update.content}</p>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {dimension && (
                      <div className="bg-gray-50 dark:bg-gray-800 p-4 rounded-lg mb-4 border-2 border-gray-200 dark:border-gray-700">
                        <h5 className="font-semibold mb-2 text-gray-900 dark:text-gray-100">維度定義</h5>
                        <p className="text-sm text-gray-700 dark:text-gray-300 mb-2">{dimension.definition}</p>
                        <div className="mt-2">
                          <strong className="text-xs text-gray-900 dark:text-gray-100">Meta-Tags:</strong>
                          <div className="flex flex-wrap gap-1 mt-1">
                            {dimension.meta_tags.map((tag, index) => (
                              <span key={index} className="px-2 py-1 bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 text-xs rounded-full border border-blue-200 dark:border-blue-700">
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
    </div>
  );
};

export default MatrixVisualization;