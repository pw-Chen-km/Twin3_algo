export type ProcessingState = 'idle' | 'processing' | 'complete' | 'error';

export interface UserContent {
  text: string;
  image?: File | string;
}

export interface MatrixUpdate {
  attributeId: string;
  attributeName: string;
  previousScore: number;
  newScore: number;
  change: number;
  strategy: string;
}

export interface MetaTag {
  tag: string;
  confidence: number;
}

export interface ProcessingResult {
  metaTags: MetaTag[];
  matrixUpdates: Record<string, number>;
  processingTime: number;
  matchedDimensions: string[];
}

export interface ActivityLogEntry {
  id: number;
  timestamp: string;
  content: string;
  image?: File | string;
  updates: Record<string, number>;
  metaTags: MetaTag[];
  processingTime: number;
  changes: Array<{
    dimensionId: string;
    previousScore: number;
    newScore: number;
    change: number;
  }>;
}

export interface DimensionCategory {
  name: string;
  color: string;
  attributes: string[];
}

export interface CalculationDetails {
  msmmSimilarity: number;
  geminiRawScore: number;
  previousScore: number;
  smoothingFactor: number;
  timeDecayFactor: number;
  finalScore: number;
  matchedMetaTags: string[];
  relevanceFactors: Array<{
    factor: string;
    contribution: number;
    description: string;
  }>;
}

export interface DimensionUpdate {
  timestamp: string;
  previousScore: number;
  newScore: number;
  change: number;
  content: string;
  calculationDetails: CalculationDetails | null;
}

export interface DimensionHistory {
  updates: DimensionUpdate[];
  totalUpdates: number;
  firstSeen: string;
  lastUpdated: string;
}