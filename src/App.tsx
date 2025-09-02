import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import Header from './components/Header';
import InputPanel from './components/InputPanel';
import ProcessingPipeline from './components/ProcessingPipeline';
import MatrixVisualization from './components/MatrixVisualization';
import ActivityFeed from './components/ActivityFeed';
import PerformanceDashboard from './components/PerformanceDashboard';
import AlgorithmSteps from './components/AlgorithmSteps';
import { ProcessingState, UserContent, MatrixUpdate, DimensionHistory } from './types';
import { processContentWithTwin3Algorithm } from './utils/twin3Processor';

function App() {
  const [selectedUser, setSelectedUser] = useState<number>(1);
  const [processingState, setProcessingState] = useState<ProcessingState>('idle');
  const [currentContent, setCurrentContent] = useState<UserContent | null>(null);
  const [matrixData, setMatrixData] = useState<Record<string, number>>({});
  const [dimensionHistory, setDimensionHistory] = useState<Record<string, DimensionHistory>>({});
  const [activityLog, setActivityLog] = useState<any[]>([]);
  const [isAutoProcess, setIsAutoProcess] = useState(true);
  const [processingSpeed, setProcessingSpeed] = useState(1);
  const [currentAlgorithmStep, setCurrentAlgorithmStep] = useState<string>('');
  const [algorithmResults, setAlgorithmResults] = useState<any>(null);

  const handleContentSubmit = async (content: UserContent) => {
    if (processingState === 'processing') return;
    
    setCurrentContent(content);
    setProcessingState('processing');
    setCurrentAlgorithmStep('msmm');
    setAlgorithmResults(null);
    
    try {
      // Process with real Twin3 algorithm
      const result = await processContentWithTwin3Algorithm(
        content, 
        processingSpeed, 
        matrixData,
        (step: string, data: any) => {
          setCurrentAlgorithmStep(step);
          setAlgorithmResults(data);
        }
      );
      
      // Update matrix data and track changes
      const previousMatrix = { ...matrixData };
      const newMatrixData = {
        ...previousMatrix,
        ...result.matrixUpdates
      };
      setMatrixData(newMatrixData);
      
      // Update dimension history with calculation details
      setDimensionHistory(prev => {
        const newHistory = { ...prev };
        Object.entries(result.matrixUpdates).forEach(([dimId, newScore]) => {
          const previousScore = previousMatrix[dimId] || 128;
          const change = newScore - previousScore;
          
          if (!newHistory[dimId]) {
            newHistory[dimId] = {
              updates: [],
              totalUpdates: 0,
              firstSeen: new Date().toISOString(),
              lastUpdated: new Date().toISOString()
            };
          }
          
          newHistory[dimId].updates.push({
            timestamp: new Date().toISOString(),
            previousScore,
            newScore,
            change,
            content: content.text,
            hasImage: !!content.image,
            calculationDetails: result.calculationDetails?.[dimId] || null
          });
          
          newHistory[dimId].totalUpdates += 1;
          newHistory[dimId].lastUpdated = new Date().toISOString();
          
          // Keep only last 20 updates per dimension
          if (newHistory[dimId].updates.length > 20) {
            newHistory[dimId].updates = newHistory[dimId].updates.slice(-20);
          }
        });
        return newHistory;
      });
      
      // Add to activity log
      setActivityLog(prev => [
        {
          id: Date.now(),
          timestamp: new Date().toISOString(),
          content: content.text,
          image: content.image,
          updates: result.matrixUpdates,
          metaTags: result.metaTags,
          processingTime: result.processingTime,
          algorithmSteps: result.algorithmSteps,
          changes: Object.entries(result.matrixUpdates).map(([dimId, newScore]) => ({
            dimensionId: dimId,
            previousScore: previousMatrix[dimId] || 128,
            newScore,
            change: newScore - (previousMatrix[dimId] || 128)
          }))
        },
        ...prev.slice(0, 49) // Keep last 50 entries
      ]);
      
      setProcessingState('complete');
      
      // Auto-reset after showing results
      setTimeout(() => {
        setProcessingState('idle');
        setCurrentContent(null);
        setCurrentAlgorithmStep('');
        setAlgorithmResults(null);
      }, 2000);
      
    } catch (error) {
      console.error('Processing error:', error);
      setProcessingState('error');
      setTimeout(() => setProcessingState('idle'), 3000);
    }
  };

  const handleUserChange = (userId: number) => {
    setSelectedUser(userId);
    // In a real app, this would load the user's matrix state
    setMatrixData({});
    setDimensionHistory({});
    setActivityLog([]);
  };

  return (
    <div className="min-h-screen bg-background text-foreground">
      <Header 
        selectedUser={selectedUser}
        onUserChange={handleUserChange}
        processingState={processingState}
      />
      
      <div className="container mx-auto px-4 py-6">
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 h-[calc(100vh-120px)]">
          {/* Left Panel - Input & Controls */}
          <div className="lg:col-span-1 space-y-4">
            <InputPanel
              onContentSubmit={handleContentSubmit}
              isProcessing={processingState === 'processing'}
              isAutoProcess={isAutoProcess}
              onAutoProcessChange={setIsAutoProcess}
              processingSpeed={processingSpeed}
              onSpeedChange={setProcessingSpeed}
            />
            
            {/* Algorithm Steps Display */}
            <AlgorithmSteps
              currentStep={currentAlgorithmStep}
              results={algorithmResults}
              isProcessing={processingState === 'processing'}
            />
          </div>
          
          {/* Main Visualization Area */}
          <div className="lg:col-span-2 space-y-4">
            <ProcessingPipeline
              state={processingState}
              content={currentContent}
              speed={processingSpeed}
            />
            
            <MatrixVisualization
              matrixData={matrixData}
              processingState={processingState}
              dimensionHistory={dimensionHistory}
            />
          </div>
          
          {/* Right Panel - Activity & Performance */}
          <div className="lg:col-span-1 space-y-4">
            <ActivityFeed
              activities={activityLog}
              processingState={processingState}
            />
            
            <PerformanceDashboard
              activityLog={activityLog}
              matrixData={matrixData}
            />
          </div>
        </div>
      </div>
    </div>
  );
}

export default App;