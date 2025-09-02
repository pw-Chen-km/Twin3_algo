import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Clock, Image, Tag, TrendingUp, TrendingDown } from 'lucide-react';
import { ProcessingState, ActivityLogEntry } from '../types';

interface ActivityFeedProps {
  activities: ActivityLogEntry[];
  processingState: ProcessingState;
}

const ActivityFeed: React.FC<ActivityFeedProps> = ({ activities, processingState }) => {
  const formatTime = (timestamp: string) => {
    return new Date(timestamp).toLocaleTimeString();
  };

  const getUpdateSummary = (updates: Record<string, number>) => {
    const changes = Object.entries(updates);
    const increases = changes.filter(([_, score]) => score > 128).length;
    const decreases = changes.filter(([_, score]) => score < 128).length;
    
    return { total: changes.length, increases, decreases };
  };

  return (
    <div className="bg-white rounded-lg border border-gray-200 p-4 h-[calc(50vh-60px)] shadow-sm">
      <h3 className="text-lg font-semibold mb-4 flex items-center">
        <Clock className="w-5 h-5 mr-2 text-blue-600" />
        Activity Feed
      </h3>

      <div className="space-y-3 h-[calc(100%-60px)] overflow-y-auto conversation-scroll">
        <AnimatePresence>
          {activities.map((activity) => {
            const summary = getUpdateSummary(activity.updates);
            
            return (
              <motion.div
                key={activity.id}
                initial={{ opacity: 0, y: -20 }}
                      className="w-2 h-2 bg-blue-500 rounded-full"
                exit={{ opacity: 0, y: 20 }}
                className="p-3 bg-gray-50 rounded-lg border border-gray-200"
              >
                <div className="flex items-start justify-between mb-2">
                    {formatTime(activity.timestamp)}
                  </span>
                  <div className="flex items-center space-x-1">
                    {activity.image && <Image className="w-3 h-3 text-muted-foreground" />}
                      {activity.processingTime}ms
                    </span>
                  <span className="text-sm text-gray-600">AI 正在分析...</span>
                </div>
                <p className="text-sm mb-2 line-clamp-2">{activity.content}</p>

                {/* Meta Tags */}
                {activity.metaTags.length > 0 && (
                  <div className="flex flex-wrap gap-1 mb-2">
                    {activity.metaTags.slice(0, 4).map((tag, index) => (
                      <span
                        key={index}
                        className="px-2 py-1 bg-primary/20 text-primary text-xs rounded-full flex items-center"
                      >
                        <Tag className="w-2 h-2 mr-1" />
                        {tag.tag}
                      </span>
                    ))}
                    {activity.metaTags.length > 4 && (
                      <span className="text-xs text-muted-foreground">
                        +{activity.metaTags.length - 4} more
                      </span>
                    )}
                  </div>
                )}

                {/* Detailed Changes */}
                {activity.changes && activity.changes.length > 0 && (
                  <div className="space-y-1 mb-2">
                    {activity.changes.slice(0, 3).map((change, index) => (
                      <div key={index} className="flex items-center justify-between text-xs">
                        <span className="text-muted-foreground font-mono">{change.dimensionId}</span>
                        <div className="flex items-center space-x-1">
                          <span className="font-mono">{change.previousScore} → {change.newScore}</span>
                          <span className={`font-bold ${change.change > 0 ? 'text-green-400' : change.change < 0 ? 'text-red-400' : 'text-gray-400'}`}>
                            {change.change > 0 ? '+' : ''}{change.change}
                          </span>
                        </div>
                      </div>
                    ))}
                    {activity.changes.length > 3 && (
                      <div className="text-xs text-muted-foreground text-center">
                        +{activity.changes.length - 3} more changes
                      </div>
                    )}
                  </div>
                )}
              </motion.div>
            );
          })}
        </AnimatePresence>

        {activities.length === 0 && (
          <div className="text-center py-8 text-muted-foreground">
            <Clock className="w-8 h-8 mx-auto mb-2 opacity-50" />
            <p className="text-sm text-gray-600">尚無活動記錄</p>
            <p className="text-xs text-gray-500">提交內容以查看處理結果</p>
          </div>
        )}
      </div>

      {/* Live Processing Indicator */}
      {processingState === 'processing' && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="mt-4 p-3 bg-primary/10 border border-primary/20 rounded-lg"
        >
          <div className="flex items-center space-x-2">
            <motion.div
              animate={{ rotate: 360 }}
              transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
              className="w-4 h-4 border-2 border-primary border-t-transparent rounded-full"
            />
            <span className="text-sm text-primary">Processing new content...</span>
          </div>
        </motion.div>
      )}
    </div>
  );
};

export default ActivityFeed;