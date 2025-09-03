import React, { useMemo } from 'react';
import { BarChart, Bar, XAxis, YAxis, ResponsiveContainer, LineChart, Line, PieChart, Pie, Cell } from 'recharts';
import { Activity, Cpu, Zap, Database } from 'lucide-react';
import { ActivityLogEntry } from '../types';
import { useLanguage } from '../hooks/useLanguage';
import { useTranslation } from '../utils/translations';

interface PerformanceDashboardProps {
  activityLog: ActivityLogEntry[];
  matrixData: Record<string, number>;
}

const PerformanceDashboard: React.FC<PerformanceDashboardProps> = ({ activityLog, matrixData }) => {
  const { language } = useLanguage();
  const t = useTranslation(language);

  const performanceMetrics = useMemo(() => {
    if (activityLog.length === 0) return null;

    const avgProcessingTime = activityLog.reduce((sum, entry) => sum + entry.processingTime, 0) / activityLog.length;
    const totalUpdates = activityLog.reduce((sum, entry) => sum + Object.keys(entry.updates).length, 0);
    const uniqueDimensions = new Set(activityLog.flatMap(entry => Object.keys(entry.updates))).size;
    
    return {
      avgProcessingTime: Math.round(avgProcessingTime),
      totalUpdates,
      uniqueDimensions,
      totalActivities: activityLog.length
    };
  }, [activityLog]);

  const processingTimeData = useMemo(() => {
    return activityLog.slice(-10).map((entry, index) => ({
      index: index + 1,
      time: entry.processingTime
    }));
  }, [activityLog]);

  const dimensionDistribution = useMemo(() => {
    const categories = {
      Physical: ['0010', '0012', '0016', '0019', '0021', '0033', '0034', '0035'],
      Social: ['0040', '0041', '0047', '004C', '004D', '0054', '0060', '006E', '0071', '0048'],
      Digital: ['0081', '0088', '0093', '0094', '0096', '00B6', '00BC', '00BF'],
      Spiritual: ['0067', '0069', '006C', '006D', '0070', '0099', '0156', 'SP088']
    };

    const distribution = Object.entries(categories).map(([name, attrs]) => {
      const count = Object.keys(matrixData).filter(attrId => 
        attrs.some(catAttr => attrId.includes(catAttr))
      ).length;
      return { name, value: count };
    });

    return distribution;
  }, [matrixData]);

  const COLORS = ['#ef4444', '#10b981', '#3b82f6', '#8b5cf6'];

  return (
    <div className="bg-card rounded-lg border border-border p-4">
      <h3 className="text-lg font-semibold mb-4 flex items-center">
        <Activity className="w-5 h-5 mr-2 text-primary" />
        {t.performance.title}
      </h3>

      {performanceMetrics ? (
        <div className="space-y-4">
          {/* Key Metrics */}
          <div className="grid grid-cols-2 gap-3">
            <div className="bg-secondary p-3 rounded-lg">
              <div className="flex items-center justify-between">
                <Cpu className="w-4 h-4 text-muted-foreground" />
                <span className="text-xs text-muted-foreground">{t.performance.avgTime}</span>
              </div>
              <p className="text-lg font-semibold">{performanceMetrics.avgProcessingTime}ms</p>
            </div>
            
            <div className="bg-secondary p-3 rounded-lg">
              <div className="flex items-center justify-between">
                <Database className="w-4 h-4 text-muted-foreground" />
                <span className="text-xs text-muted-foreground">{t.performance.updates}</span>
              </div>
              <p className="text-lg font-semibold">{performanceMetrics.totalUpdates}</p>
            </div>
            
            <div className="bg-secondary p-3 rounded-lg">
              <div className="flex items-center justify-between">
                <Zap className="w-4 h-4 text-muted-foreground" />
                <span className="text-xs text-muted-foreground">{t.performance.dimensions}</span>
              </div>
              <p className="text-lg font-semibold">{performanceMetrics.uniqueDimensions}</p>
            </div>
            
            <div className="bg-secondary p-3 rounded-lg">
              <div className="flex items-center justify-between">
                <Activity className="w-4 h-4 text-muted-foreground" />
                <span className="text-xs text-muted-foreground">{t.performance.activities}</span>
              </div>
              <p className="text-lg font-semibold">{performanceMetrics.totalActivities}</p>
            </div>
          </div>

          {/* Processing Time Chart */}
          {processingTimeData.length > 0 && (
            <div>
              <h4 className="text-sm font-medium mb-2">{t.performance.processingTrend}</h4>
              <div className="h-24">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={processingTimeData}>
                    <XAxis dataKey="index" hide />
                    <YAxis hide />
                    <Line 
                      type="monotone" 
                      dataKey="time" 
                      stroke="#3b82f6" 
                      strokeWidth={2}
                      dot={false}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </div>
          )}

          {/* Dimension Distribution */}
          {dimensionDistribution.some(d => d.value > 0) && (
            <div>
              <h4 className="text-sm font-medium mb-2">{t.performance.activeDimensions}</h4>
              <div className="h-24">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={dimensionDistribution}
                      dataKey="value"
                      nameKey="name"
                      cx="50%"
                      cy="50%"
                      innerRadius={20}
                      outerRadius={40}
                    >
                      {dimensionDistribution.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                  </PieChart>
                </ResponsiveContainer>
              </div>
              <div className="flex flex-wrap gap-1 mt-2">
                {dimensionDistribution.map((entry, index) => (
                  <div key={entry.name} className="flex items-center space-x-1">
                    <div 
                      className="w-2 h-2 rounded-full" 
                      style={{ backgroundColor: COLORS[index % COLORS.length] }}
                    />
                    <span className="text-xs text-muted-foreground">
                      {entry.name}: {entry.value}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      ) : (
        <div className="text-center py-8 text-muted-foreground">
          <Activity className="w-8 h-8 mx-auto mb-2 opacity-50" />
          <p className="text-sm">{t.performance.noData}</p>
          <p className="text-xs">{t.performance.processContent}</p>
        </div>
      )}
    </div>
  );
};

export default PerformanceDashboard;