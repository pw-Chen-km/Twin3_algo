import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Grid, Filter, TrendingUp, TrendingDown, Minus } from 'lucide-react';
import { ProcessingState } from '../types';

interface MatrixVisualizationProps {
  matrixData: Record<string, number>;
  processingState: ProcessingState;
}

const MatrixVisualization: React.FC<MatrixVisualizationProps> = ({ matrixData, processingState }) => {
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');

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
        <div className="grid grid-cols-8 gap-1">
          {Object.entries(filteredData).map(([attrId, score]) => {
            const category = Object.entries(categories).find(([_, cat]) => 
              cat.attributes.some(catAttr => attrId.includes(catAttr))
            );
            const categoryColor = category?.[1].color || 'bg-gray-500';
            
            return (
              <motion.div
                key={attrId}
                className={`matrix-cell aspect-square rounded-sm border border-border/50 relative group cursor-pointer ${categoryColor}`}
                style={{ 
                  opacity: getScoreIntensity(score),
                }}
                whileHover={{ scale: 1.1, zIndex: 10 }}
                animate={processingState === 'processing' ? { 
                  scale: [1, 1.05, 1],
                  opacity: [getScoreIntensity(score), 0.8, getScoreIntensity(score)]
                } : {}}
                transition={{ duration: 0.3 }}
              >
                <div className="absolute inset-0 flex items-center justify-center">
                  <span className="text-xs font-mono text-white drop-shadow-sm">
                    {score}
                  </span>
                </div>
                
                {/* Tooltip */}
                <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-2 py-1 bg-black text-white text-xs rounded opacity-0 group-hover:opacity-100 transition-opacity z-20 whitespace-nowrap">
                  {attrId}: {score}/255
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
                    <span className="font-mono text-sm">{attrId}</span>
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
                    <span className="font-mono text-sm w-8 text-right">{score}</span>
                  </div>
                </motion.div>
              );
            })}
        </div>
      )}

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