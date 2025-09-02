import { UserContent, ProcessingResult, MetaTag, CalculationDetails } from '../types';

// Real Twin3 algorithm simulation based on actual project code
const TWIN3_METADATA = {
  '0008': {
    name: 'Dietary Habits',
    definition: '個人飲食習慣和營養選擇的傾向',
    meta_tags: ['食物', '營養', '健康', '飲食', '料理'],
    encoding_rules: '基於飲食選擇的健康程度和多樣性評分'
  },
  '0067': {
    name: 'Spiritual Awareness',
    definition: '對精神層面和內在成長的關注程度',
    meta_tags: ['精神', '內在', '成長', '覺察', '靈性'],
    encoding_rules: '基於精神實踐和自我反思的深度評分'
  },
  '006C': {
    name: 'Emotional Intelligence',
    definition: '理解和管理自己及他人情緒的能力',
    meta_tags: ['情緒', '理解', '同理心', '溝通', '感受'],
    encoding_rules: '基於情緒識別和管理能力評分'
  },
  '006C': {
    name: 'Dimension 006C',
    definition: '個人特質維度006C',
    meta_tags: ['特質', '行為', '表現'],
    encoding_rules: '基於行為表現評分'
  },
  '0071': {
    name: 'Social Achievements',
    definition: '在社會環境中的成就和認可程度',
    meta_tags: ['成就', '成功', '認可', '表現', '完成'],
    encoding_rules: '基於社會成就的影響力和重要性評分'
  },
  '0048': {
    name: 'Leadership Ability',
    definition: '領導他人和組織團隊的能力',
    meta_tags: ['領導', '指導', '管理', '組織', '帶領'],
    encoding_rules: '基於領導行為的效果和影響範圍評分'
  },
  '0040': {
    name: 'Social Relationships',
    definition: '建立和維持人際關係的能力',
    meta_tags: ['朋友', '關係', '社交', '互動', '連結'],
    encoding_rules: '基於社交互動的質量和頻率評分'
  },
  '0099': {
    name: 'Learning Orientation',
    definition: '對學習新知識和技能的積極程度',
    meta_tags: ['學習', '知識', '技能', '成長', '教育'],
    encoding_rules: '基於學習活動的主動性和深度評分'
  },
  '0156': {
    name: 'Creative Expression',
    definition: '創意表達和藝術創作的能力',
    meta_tags: ['創意', '創作', '藝術', '表達', '想像'],
    encoding_rules: '基於創意作品的原創性和表達力評分'
  },
  'SP088': {
    name: 'Social Responsibility',
    definition: '對社會責任和環境保護的關注程度',
    meta_tags: ['責任', '環保', '社會', '永續', '公益'],
    encoding_rules: '基於社會責任行為的影響力和持續性評分'
  },
  '0010': {
    name: 'Physical Fitness',
    definition: '身體健康和體能狀況',
    meta_tags: ['健身', '運動', '體能', '健康', '鍛鍊'],
    encoding_rules: '基於運動頻率和強度評分'
  },
  '0081': {
    name: 'Technology Adoption',
    definition: '對新技術的接受和應用能力',
    meta_tags: ['科技', '技術', '數位', '創新', '應用'],
    encoding_rules: '基於技術使用的熟練度和創新性評分'
  },
  '0032': {
    name: 'Emotional Stability',
    definition: '情緒管理和心理穩定性',
    meta_tags: ['情緒', '穩定', '平衡', '調節', '心理'],
    encoding_rules: '基於情緒表達的穩定性和適應性評分'
  }
};

// MSMM語意匹配算法模擬
const simulateMSMM = (text: string): { metaTags: string[], matchedDimensions: string[] } => {
  const extractedTags: string[] = [];
  const matchedDimensions: string[] = [];
  
  // 1. Meta-Tag提取（模擬Gemini AI）
  const textLower = text.toLowerCase();
  
  // 基於關鍵詞提取Meta-Tags
  Object.values(TWIN3_METADATA).forEach(dim => {
    dim.meta_tags.forEach(tag => {
      if (textLower.includes(tag)) {
        extractedTags.push(tag);
      }
    });
  });
  
  // 2. 維度匹配（模擬Sentence-BERT相似度計算）
  Object.entries(TWIN3_METADATA).forEach(([dimId, dim]) => {
    const similarity = calculateSemanticSimilarity(extractedTags, dim.meta_tags);
    if (similarity > 0.1) { // 相似度閾值
      matchedDimensions.push(dimId);
    }
  });
  
  return { metaTags: extractedTags, matchedDimensions };
};

// 語意相似度計算（模擬Sentence-BERT）
const calculateSemanticSimilarity = (userTags: string[], dimensionTags: string[]): number => {
  const intersection = userTags.filter(tag => dimensionTags.includes(tag));
  const union = [...new Set([...userTags, ...dimensionTags])];
  return intersection.length / Math.max(union.length, 1);
};

// ULTU評分算法模擬（包含詳細計算過程）
const simulateULTU = (dimensionId: string, userContent: string, previousScore: number = 128): { score: number, details: CalculationDetails } => {
  const dimension = TWIN3_METADATA[dimensionId];
  if (!dimension) return { score: 128, details: null };
  
  // 1. MSMM語意匹配
  const textLower = userContent.toLowerCase();
  const matchedMetaTags = dimension.meta_tags.filter(tag => textLower.includes(tag));
  const msmmSimilarity = matchedMetaTags.length / dimension.meta_tags.length;
  
  // 2. Gemini AI評分模擬（基於內容相關性）
  let geminiRawScore = 128; // 基準分數
  const relevanceFactors = [];
  
  let relevanceScore = 0;
  
  // Meta-Tags匹配加分
  if (matchedMetaTags.length > 0) {
    const tagBonus = matchedMetaTags.length * 25;
    relevanceScore += tagBonus;
    relevanceFactors.push({
      factor: 'Meta-Tags匹配',
      contribution: tagBonus,
      description: `匹配${matchedMetaTags.length}個標籤: ${matchedMetaTags.join(', ')}`
    });
  }
  
  // 內容複雜度加分
  if (userContent.length > 50) {
    relevanceScore += 15;
    relevanceFactors.push({
      factor: '內容複雜度',
      contribution: 15,
      description: '內容長度超過50字符'
    });
  }
  if (userContent.length > 100) {
    relevanceScore += 10;
    relevanceFactors.push({
      factor: '內容深度',
      contribution: 10,
      description: '內容長度超過100字符'
    });
  }
  
  // 特殊關鍵詞加分（模擬Gemini的語意理解）
  const strongKeywords = ['帶領', '完成', '成功', '創新', '學習', '幫助'];
  const semanticMatches = strongKeywords.filter(keyword => textLower.includes(keyword));
  if (semanticMatches.length > 0) {
    const semanticBonus = semanticMatches.length * 20;
    relevanceScore += semanticBonus;
    relevanceFactors.push({
      factor: '語意深度分析',
      contribution: semanticBonus,
      description: `識別關鍵行為: ${semanticMatches.join(', ')}`
    });
  }
  
  // 維度特定加分
  if (dimensionId === '0071' && (textLower.includes('完成') || textLower.includes('成就'))) {
    relevanceScore += 30;
    relevanceFactors.push({
      factor: '社會成就特定加分',
      contribution: 30,
      description: '內容體現明確的成就表現'
    });
  }
  
  if (dimensionId === '0048' && textLower.includes('帶領')) {
    relevanceScore += 35;
    relevanceFactors.push({
      factor: '領導能力特定加分',
      contribution: 35,
      description: '內容體現領導行為'
    });
  }
  
  if (dimensionId === 'SP088' && (textLower.includes('環保') || textLower.includes('永續'))) {
    relevanceScore += 40;
    relevanceFactors.push({
      factor: '社會責任特定加分',
      contribution: 40,
      description: '內容體現環保意識'
    });
  }
  
  geminiRawScore = Math.min(255, Math.max(0, 128 + relevanceScore));
  
  // 3. ULTU分數平滑（Twin3標準公式）
  const alpha = 0.3; // Twin3標準平滑係數
  const smoothedScore = Math.round(alpha * geminiRawScore + (1 - alpha) * previousScore);
  
  // 4. 時間衰減模擬
  const timeDecayFactor = 0.98; // 輕微時間衰減
  
  const calculationDetails: CalculationDetails = {
    msmmSimilarity,
    geminiRawScore,
    previousScore,
    smoothingFactor: alpha,
    timeDecayFactor,
    finalScore: smoothedScore,
    matchedMetaTags,
    relevanceFactors
  };
  
  return { 
    score: Math.max(0, Math.min(255, smoothedScore)), 
    details: calculationDetails 
  };
};

// Mock processing function that simulates the Twin3 pipeline
export const mockProcessContent = async (
  content: UserContent, 
  speed: number = 1, 
  currentMatrix: Record<string, number> = {}
): Promise<ProcessingResult & { calculationDetails: Record<string, CalculationDetails> }> => {
  const baseDelay = 1000 / speed;
  
  // Simulate processing delay
  await new Promise(resolve => setTimeout(resolve, baseDelay * 2));
  
  // 使用真實Twin3演算法模擬
  const msmmResult = simulateMSMM(content.text);
  
  // 轉換為MetaTag格式
  const metaTags: MetaTag[] = msmmResult.metaTags.map(tag => ({
    tag,
    confidence: 0.8 + Math.random() * 0.2
  }));
  
  // 使用ULTU演算法計算分數（包含詳細計算過程）
  const matrixUpdates: Record<string, number> = {};
  const calculationDetails: Record<string, CalculationDetails> = {};
  
  msmmResult.matchedDimensions.forEach(dimId => {
    const previousScore = currentMatrix[dimId] || 128; // 使用實際的前次分數
    const result = simulateULTU(dimId, content.text, previousScore);
    matrixUpdates[dimId] = result.score;
    calculationDetails[dimId] = result.details;
  });
  
  // Mock processing time
  const processingTime = Math.round(800 + Math.random() * 400);
  
  return {
    metaTags,
    matrixUpdates,
    processingTime,
    matchedDimensions: msmmResult.matchedDimensions,
    calculationDetails
  };
};
    if (textLower.includes(keyword)) {
      relevanceScore += 20;
    }
  });
  
  geminiRawScore = Math.min(255, Math.max(0, 128 + relevanceScore));
  
  // 2. ULTU分數平滑（α = 0.3）
  const alpha = 0.3;
  const smoothedScore = Math.round(alpha * geminiRawScore + (1 - alpha) * previousScore);
  
  return Math.max(0, Math.min(255, smoothedScore));
};

// Mock processing function that simulates the Twin3 pipeline
export const mockProcessContent = async (content: UserContent, speed: number = 1): Promise<ProcessingResult> => {
  const baseDelay = 1000 / speed;
  
  // Simulate processing delay
  await new Promise(resolve => setTimeout(resolve, baseDelay * 2));
  
  // 使用真實Twin3演算法模擬
  const msmmResult = simulateMSMM(content.text);
  
  // 轉換為MetaTag格式
  const metaTags: MetaTag[] = msmmResult.metaTags.map(tag => ({
    tag,
    confidence: 0.8 + Math.random() * 0.2
  }));
  
  // 使用ULTU演算法計算分數
  const matrixUpdates: Record<string, number> = {};
  msmmResult.matchedDimensions.forEach(dimId => {
    const previousScore = 128; // 模擬前次分數
    const newScore = simulateULTU(dimId, content.text, previousScore);
    matrixUpdates[dimId] = newScore;
  });
  
  // Mock processing time
  const processingTime = Math.round(800 + Math.random() * 400);
  
  return {
    metaTags,
    matrixUpdates,
    processingTime,
    matchedDimensions: msmmResult.matchedDimensions
  };
};
