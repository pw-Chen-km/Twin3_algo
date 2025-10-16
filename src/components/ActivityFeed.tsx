import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Clock, Image, Tag, TrendingUp, TrendingDown } from 'lucide-react';
import { ProcessingState, ActivityLogEntry } from '../types';
import { useLanguage } from '../hooks/useLanguage';
import { useTranslation } from '../utils/translations';

interface ActivityFeedProps {
  activities: ActivityLogEntry[];
  processingState: ProcessingState;
}

const ActivityFeed: React.FC<ActivityFeedProps> = ({ activities, processingState }) => {
  const { language } = useLanguage();
  const t = useTranslation(language);

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
    <div className="bg-white dark:bg-gray-900 rounded-lg border-2 border-gray-300 dark:border-gray-600 p-4 h-[calc(50vh-60px)] shadow-lg">
      <h3 className="text-lg font-semibold mb-4 flex items-center">
        <Clock className="w-5 h-5 mr-2 text-blue-600 dark:text-blue-400" />
        {t.activity.title}
      </h3>

      <div className="space-y-3 h-[calc(100%-60px)] overflow-y-auto conversation-scroll">
        <AnimatePresence>
          {activities.map((activity) => {
            const summary = getUpdateSummary(activity.updates);
            
            return (
              <motion.div
                key={activity.id}
                initial={{ opacity: 0, y: -20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 20 }}
                className="p-3 bg-gray-50 dark:bg-gray-800 rounded-lg border-2 border-gray-200 dark:border-gray-700"
              >
                <div className="flex items-start justify-between mb-2">
                  <span className="text-xs text-gray-500 dark:text-gray-400">
                    {formatTime(activity.timestamp)}
                  </span>
                  <div className="flex items-center space-x-1">
                    {activity.image && <Image className="w-3 h-3 text-gray-500 dark:text-gray-400" />}
                    <span className="text-xs text-gray-500 dark:text-gray-400">
                      {activity.processingTime}ms
                    </span>
                  </div>
                </div>
                <p className="text-sm mb-2 line-clamp-2 text-gray-900 dark:text-gray-100">{activity.content}</p>

                {/* Meta Tags */}
                {activity.metaTags.length > 0 && (
                  <div className="flex flex-wrap gap-1 mb-2">
                    {activity.metaTags.slice(0, 4).map((tag, index) => (
                      <span
                        key={index}
                        className="px-2 py-1 bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 text-xs rounded-full flex items-center"
                      >
                        <Tag className="w-2 h-2 mr-1" />
                        {tag.tag}
                      </span>
                    ))}
                    {activity.metaTags.length > 4 && (
                      <span className="text-xs text-gray-500 dark:text-gray-400">
                        +{activity.metaTags.length - 4} {t.common.more}
                      </span>
                    )}
                  </div>
                )}

                {/* Detailed Changes */}
                {activity.changes && activity.changes.length > 0 && (
                  <div className="space-y-1 mb-2">
                    {activity.changes.slice(0, 3).map((change, index) => (
                      <div key={index} className="flex items-center justify-between text-xs">
                        <span className="text-gray-600 dark:text-gray-400 font-mono">{change.dimensionId}</span>
                        <div className="flex items-center space-x-1">
                          <span className="font-mono text-gray-900 dark:text-gray-100">{change.previousScore} → {change.newScore}</span>
                          <span className={`font-bold ${change.change > 0 ? 'text-green-600 dark:text-green-400' : change.change < 0 ? 'text-red-600 dark:text-red-400' : 'text-gray-500 dark:text-gray-400'}`}>
                            {change.change > 0 ? '+' : ''}{change.change}
                          </span>
                        </div>
                      </div>
                    ))}
                    {activity.changes.length > 3 && (
                      <div className="text-xs text-gray-500 dark:text-gray-400 text-center">
                        +{activity.changes.length - 3} {t.common.more} {t.common.updates}
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
            <Clock className="w-8 h-8 mx-auto mb-2 opacity-50 text-gray-400 dark:text-gray-500" />
            <p className="text-sm text-gray-600">{t.activity.noActivity}</p>
            <p className="text-xs text-gray-500 dark:text-gray-400">{t.activity.submitContent}</p>
          </div>
        )}
      </div>

      {/* Live Processing Indicator */}
      {processingState === 'processing' && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="mt-4 p-3 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-700 rounded-lg"
        >
          <div className="flex items-center space-x-2">
            <motion.div
              animate={{ rotate: 360 }}
              transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
              className="w-4 h-4 border-2 border-blue-600 border-t-transparent rounded-full"
            />
            <span className="text-sm text-blue-700 dark:text-blue-300">{t.activity.processingNew}</span>
          </div>
        </motion.div>
      )}
    </div>
  );
};

export default ActivityFeed;