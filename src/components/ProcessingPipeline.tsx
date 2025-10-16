import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Brain, Search, Zap, Database, CheckCircle, AlertCircle } from 'lucide-react';
import { ProcessingState, UserContent } from '../types';

interface ProcessingPipelineProps {
  state: ProcessingState;
  content: UserContent | null;
  speed: number;
}

const ProcessingPipeline: React.FC<ProcessingPipelineProps> = ({ state, content, speed }) => {
  const [currentStep, setCurrentStep] = useState(0);
  const [extractedTags, setExtractedTags] = useState<string[]>([]);

  const steps = [
    { id: 'input', name: 'Multi-Modal Input', icon: Brain, description: 'Processing text and image content' },
    { id: 'msmm', name: 'MSMM Analysis', icon: Search, description: 'Extracting meta-tags with Gemini AI' },
    { id: 'matching', name: 'Dimension Matching', icon: Database, description: 'Finding relevant personality dimensions' },
    { id: 'ultu', name: 'ULTU Scoring', icon: Zap, description: 'Generating precise scores and updating matrix' }
  ];

  useEffect(() => {
    if (state === 'processing') {
      setCurrentStep(0);
      setExtractedTags([]);
      
      const stepDuration = 1000 / speed;
      
      const timer = setInterval(() => {
        setCurrentStep(prev => {
          if (prev < steps.length - 1) {
            // Simulate meta-tag extraction in step 1
            if (prev === 1) {
              const mockTags = ['學習', '成就感', '團隊合作', '食物', '慶祝'];
              setExtractedTags(mockTags);
            }
            return prev + 1;
          }
          return prev;
        });
      }, stepDuration);

      return () => clearInterval(timer);
    } else if (state === 'idle') {
      setCurrentStep(0);
      setExtractedTags([]);
    }
  }, [state, speed]);

  return (
    <div className="bg-card rounded-lg border border-border p-6">
      <h3 className="text-lg font-semibold mb-4 flex items-center">
        <Brain className="w-5 h-5 mr-2 text-primary" />
        Processing Pipeline
      </h3>

      {/* Content Preview */}
      {content && (
        <div className="mb-6 p-4 bg-secondary rounded-lg">
          <div className="flex items-start space-x-4">
            <div className="flex-1">
              <p className="text-sm text-muted-foreground mb-1">Input Content:</p>
              <p className="text-sm">{content.text}</p>
            </div>
            {content.image && (
              <div className="w-16 h-16 bg-muted rounded-lg flex items-center justify-center">
                <span className="text-xs text-muted-foreground">IMG</span>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Pipeline Steps */}
      <div className="space-y-4">
        {steps.map((step, index) => {
          const Icon = step.icon;
          const isActive = state === 'processing' && currentStep === index;
          const isComplete = state === 'processing' && currentStep > index || state === 'complete';
          const isError = state === 'error' && currentStep === index;

          return (
            <motion.div
              key={step.id}
              className={`pipeline-step flex items-center space-x-4 p-4 rounded-lg border transition-all ${
                isActive ? 'border-primary bg-primary/10 active' : 
                isComplete ? 'border-green-500 bg-green-500/10' :
                isError ? 'border-red-500 bg-red-500/10' :
                'border-border bg-secondary/50'
              }`}
              animate={{
                scale: isActive ? 1.02 : 1,
                opacity: state === 'idle' ? 0.7 : 1
              }}
              transition={{ duration: 0.3 }}
            >
              <div className={`p-2 rounded-full ${
                isActive ? 'bg-primary text-primary-foreground' :
                isComplete ? 'bg-green-500 text-white' :
                isError ? 'bg-red-500 text-white' :
                'bg-muted text-muted-foreground'
              }`}>
                {isComplete ? (
                  <CheckCircle className="w-5 h-5" />
                ) : isError ? (
                  <AlertCircle className="w-5 h-5" />
                ) : (
                  <Icon className={`w-5 h-5 ${isActive ? 'animate-pulse' : ''}`} />
                )}
              </div>
              
              <div className="flex-1">
                <h4 className="font-medium">{step.name}</h4>
                <p className="text-sm text-muted-foreground">{step.description}</p>
                
                {/* Show extracted tags for MSMM step */}
                {step.id === 'msmm' && extractedTags.length > 0 && (
                  <div className="mt-2 flex flex-wrap gap-1">
                    {extractedTags.map((tag, tagIndex) => (
                      <motion.span
                        key={tag}
                        initial={{ opacity: 0, scale: 0.8 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ delay: tagIndex * 0.1 }}
                        className="meta-tag px-2 py-1 bg-primary/20 text-primary text-xs rounded-full"
                      >
                        {tag}
                      </motion.span>
                    ))}
                  </div>
                )}
              </div>

              {isActive && (
                <div className="processing-animation w-2 h-8 rounded-full"></div>
              )}
            </motion.div>
          );
        })}
      </div>

      {/* Processing Status */}
      <div className="mt-4 text-center">
        <AnimatePresence mode="wait">
          {state === 'processing' && (
            <motion.p
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="text-sm text-primary"
            >
              Processing step {currentStep + 1} of {steps.length}...
            </motion.p>
          )}
          {state === 'complete' && (
            <motion.p
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0 }}
              className="text-sm text-green-400"
            >
              ✅ Processing complete! Matrix updated successfully.
            </motion.p>
          )}
          {state === 'error' && (
            <motion.p
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="text-sm text-red-400"
            >
              ❌ Processing failed. Using fallback mode.
            </motion.p>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
};

export default ProcessingPipeline;