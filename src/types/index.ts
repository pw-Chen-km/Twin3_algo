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
}

export interface DimensionCategory {
  name: string;
  color: string;
  attributes: string[];
}