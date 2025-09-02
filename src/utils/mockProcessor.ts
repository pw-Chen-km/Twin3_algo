import { UserContent, ProcessingResult, MetaTag } from '../types';

// Mock processing function that simulates the Twin3 pipeline
export const mockProcessContent = async (content: UserContent, speed: number = 1): Promise<ProcessingResult> => {
  const baseDelay = 1000 / speed;
  
  // Simulate processing delay
  await new Promise(resolve => setTimeout(resolve, baseDelay * 2));
  
  // Mock meta-tag extraction based on content
  const metaTags: MetaTag[] = extractMockMetaTags(content.text);
  
  // Mock dimension matching and scoring
  const matrixUpdates = generateMockMatrixUpdates(content.text, content.image);
  
  // Mock processing time
  const processingTime = Math.round(800 + Math.random() * 400);
  
  return {
    metaTags,
    matrixUpdates,
    processingTime,
    matchedDimensions: Object.keys(matrixUpdates)
  };
};

const extractMockMetaTags = (text: string): MetaTag[] => {
  const keywords = {
    '學習': ['學習', '研究', '課程', '知識', '閱讀'],
    '成就感': ['完成', '成功', '達成', '獲得', '成就'],
    '領導': ['帶領', '領導', '指導', '管理', '組織'],
    '食物': ['吃', '食物', '餐廳', '料理', '早餐', '晚餐'],
    '社交': ['朋友', '聚會', '社交', '團體', '分享'],
    '運動': ['健身', '運動', '跑步', '訓練', '體能'],
    '環保': ['環保', '永續', '減碳', '綠色', '生態'],
    '科技': ['程式', '科技', '軟體', 'AI', '開發'],
    '創意': ['創作', '設計', '藝術', '創新', '想法'],
    '慶祝': ['慶祝', '開心', '快樂', '滿足', '愉悅']
  };

  const extractedTags: MetaTag[] = [];
  const textLower = text.toLowerCase();

  Object.entries(keywords).forEach(([tag, words]) => {
    const matches = words.filter(word => textLower.includes(word)).length;
    if (matches > 0) {
      extractedTags.push({
        tag,
        confidence: Math.min(0.9, 0.3 + matches * 0.2)
      });
    }
  });

  // Add some random variation
  if (extractedTags.length < 3) {
    const randomTags = ['體驗', '感受', '活動', '時間', '生活'];
    randomTags.forEach(tag => {
      if (Math.random() > 0.7) {
        extractedTags.push({ tag, confidence: 0.4 + Math.random() * 0.3 });
      }
    });
  }

  return extractedTags.slice(0, 6);
};

const generateMockMatrixUpdates = (text: string, image?: File | string): Record<string, number> => {
  const updates: Record<string, number> = {};
  
  // Define dimension mappings based on content analysis
  const dimensionMappings = {
    // Social dimensions
    '0071': ['完成', '成功', '達成', '論文', '成就'],  // Social Achievements
    '0048': ['帶領', '領導', '指導', '管理'],          // Leadership Ability
    '0040': ['朋友', '聚會', '社交', '分享'],          // Social Relationships
    
    // Learning dimensions
    '0099': ['學習', '研究', '課程', '知識', '閱讀'],   // Learning Orientation
    '0156': ['創新', '創意', '設計', '想法'],          // Creative Expression
    
    // Physical dimensions
    '0008': ['吃', '食物', '餐廳', '料理', '早餐'],     // Dietary Habits
    '0010': ['健身', '運動', '跑步', '訓練'],          // Physical Fitness
    
    // Digital dimensions
    '0081': ['程式', '科技', '軟體', 'AI', '開發'],     // Technology Adoption
    
    // Environmental/Social responsibility
    'SP088': ['環保', '永續', '減碳', '綠色', '生態'],  // Social Responsibility
    
    // Emotional dimensions
    '0032': ['開心', '快樂', '滿足', '愉悅', '慶祝']    // Emotional Stability
  };

  const textLower = text.toLowerCase();
  
  Object.entries(dimensionMappings).forEach(([dimensionId, keywords]) => {
    const matches = keywords.filter(keyword => textLower.includes(keyword)).length;
    
    if (matches > 0) {
      // Base score influenced by number of keyword matches
      let baseScore = 128 + (matches * 15) + Math.random() * 30 - 15;
      
      // Image bonus (if image is provided)
      if (image) {
        baseScore += 10 + Math.random() * 20;
      }
      
      // Ensure score is within valid range
      updates[dimensionId] = Math.max(0, Math.min(255, Math.round(baseScore)));
    }
  });

  // Add some random updates for demonstration
  if (Object.keys(updates).length < 3) {
    const randomDimensions = ['0067', '0069', '006C', '006D', '0070'];
    randomDimensions.forEach(dim => {
      if (Math.random() > 0.6) {
        updates[dim] = Math.round(100 + Math.random() * 100);
      }
    });
  }

  return updates;
};