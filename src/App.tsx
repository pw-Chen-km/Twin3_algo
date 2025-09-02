import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import Header from './components/Header';
import InputPanel from './components/InputPanel';
import ProcessingPipeline from './components/ProcessingPipeline';
import MatrixVisualization from './components/MatrixVisualization';
import ActivityFeed from './components/ActivityFeed';
import PerformanceDashboard from './components/PerformanceDashboard';
import { ProcessingState, UserContent, MatrixUpdate } from './types';
import { mockProcessContent } from './utils/mockProcessor';

function App() {
  const [selectedUser, setSelectedUser] = useState<number>(1);
  const [processingState, setProcessingState] = useState<ProcessingState>('idle');
  const [currentContent, setCurrentContent] = useState<UserContent | null>(null);
  const [matrixData, setMatrixData] = useState<Record<string, number>>({});
  const [activityLog, setActivityLog] = useState<any[]>([]);
  const [isAutoProcess, setIsAutoProcess] = useState(true);
  const [processingSpeed, setProcessingSpeed] = useState(1);

  const handleContentSubmit = async (content: UserContent) => {
    if (processingState === 'processing') return;
    
    setCurrentContent(content);
    setProcessingState('processing');
    
    try {
      // Simulate processing with the mock processor
      const result = await mockProcessContent(content, processingSpeed);
      
      // Update matrix data
      setMatrixData(prev => ({
        ...prev,
        ...result.matrixUpdates
      }));
      
      // Add to activity log
      setActivityLog(prev => [
        {
          id: Date.now(),
          timestamp: new Date().toISOString(),
          content: content.text,
          image: content.image,
          updates: result.matrixUpdates,
          metaTags: result.metaTags,
          processingTime: result.processingTime
        },
        ...prev.slice(0, 49) // Keep last 50 entries
      ]);
      
      setProcessingState('complete');
      
      // Auto-reset after showing results
      setTimeout(() => {
        setProcessingState('idle');
        setCurrentContent(null);
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