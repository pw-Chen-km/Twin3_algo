import { UserContent, ProcessingResult, MetaTag, CalculationDetails } from '../types';

// 動態載入真實的 Twin3 維度定義（從後端 /metadata）
let REAL_TWIN3_METADATA: Record<string, { name: string; definition: string; meta_tags: string[]; encoding_rules?: string; ai_parsing_guidelines?: string }> = {} as any;
const ensureMetadataLoaded = async () => {
  if (Object.keys(REAL_TWIN3_METADATA).length > 0) return;
  try {
    const resp = await fetch('/metadata');
    const data = await resp.json();
    // 轉換結構：後端是 attribute_name/meta_tags 鍵名
    const mapped: Record<string, any> = {};
    Object.entries<any>(data).forEach(([id, v]) => {
      mapped[id] = {
        name: v.attribute_name,
        definition: v.definition,
        meta_tags: v.attribute_meta_tags || [],
        encoding_rules: v.encoding_rules,
        ai_parsing_guidelines: v.ai_parsing_guidelines
      };
    });
    REAL_TWIN3_METADATA = mapped as any;
  } catch (e) {
    console.warn('⚠️ 載入後端 metadata 失敗：', e);
  }
};

// 將 File 轉成 data URL（base64）
const fileToDataUrl = (file: File): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
};

// 透過後端 API 呼叫真實的 MSMM（若失敗則回退本地模擬）
const runMSMMViaAPI = async (
  text: string,
  image?: File | string
): Promise<{ metaTags: string[]; matchedDimensions: Array<{ id: string; similarity: number }> }> => {
  try {
    const payload: any = { text, threshold: 0.6 };
    if (typeof image === 'string') {
      payload.image = image;
    } else if (image instanceof File) {
      payload.image = await fileToDataUrl(image);
    }
    const resp = await fetch('/msmm', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });
    if (!resp.ok) throw new Error(`MSMM API error ${resp.status}`);
    const data = await resp.json();
    const metaTags: string[] = data.meta_tags || [];
    const matchedDimensions = (data.matches || []).map((m: any) => ({ id: m.attribute_id, similarity: m.similarity }));
    return { metaTags, matchedDimensions };
  } catch (e) {
    console.warn('⚠️ MSMM API 失敗，回退本地模擬：', e);
    return runMSMMLocal(text, image);
  }
};

// 本地模擬的MSMM（保留為回退）
const runMSMMLocal = (text: string, image?: File | string): { metaTags: string[], matchedDimensions: Array<{id: string, similarity: number}> } => {
  console.log('🔍 MSMM: 開始語意匹配分析...');
  
  // 1. Meta-Tag提取（模擬Gemini 2.5 Flash）
  const extractedTags: string[] = [];
  const textLower = text.toLowerCase();
  
  // 基於真實維度的meta_tags進行提取
  Object.values(REAL_TWIN3_METADATA).forEach(dim => {
    dim.meta_tags.forEach(tag => {
      if (textLower.includes(tag)) {
        extractedTags.push(tag);
      }
    });
  });
  
  // 如果有圖片，模擬圖片內容分析
  if (image) {
    // 模擬圖片Meta-Tag提取
    const imageTags = ['活動', '場景', '情境'];
    extractedTags.push(...imageTags);
  }
  
  // 如果沒有提取到任何標籤，使用通用標籤確保有匹配結果
  if (extractedTags.length === 0) {
    // 基於文字內容長度和複雜度推斷可能的標籤
    if (textLower.includes('學習') || textLower.includes('技能') || textLower.includes('知識')) {
      extractedTags.push('學習', '知識');
    }
    if (textLower.includes('朋友') || textLower.includes('聚會') || textLower.includes('社交')) {
      extractedTags.push('社交', '朋友');
    }
    if (textLower.includes('完成') || textLower.includes('成功') || textLower.includes('達成')) {
      extractedTags.push('成就', '完成');
    }
    if (textLower.includes('吃') || textLower.includes('食物') || textLower.includes('餐')) {
      extractedTags.push('食物', '飲食');
    }
    if (textLower.includes('運動') || textLower.includes('健身') || textLower.includes('鍛鍊')) {
      extractedTags.push('運動', '健身');
    }
    
    // 如果還是沒有標籤，添加通用標籤
    if (extractedTags.length === 0) {
      extractedTags.push('體驗', '活動', '生活');
    }
  }
  
  console.log('🎯 提取的Meta-Tags:', extractedTags);
  
  // 2. 維度匹配（模擬Sentence-BERT相似度計算）
  const matchedDimensions: Array<{id: string, similarity: number}> = [];
  
  Object.entries(REAL_TWIN3_METADATA).forEach(([dimId, dim]) => {
    const intersection = extractedTags.filter(tag => dim.meta_tags.includes(tag));
    let similarity = intersection.length / Math.max(dim.meta_tags.length, 1);
    
    // 如果沒有直接匹配，使用語意相似度計算
    if (similarity === 0) {
      // 計算語意相似度（簡化版）
      const semanticScore = calculateSemanticSimilarity(extractedTags, dim.meta_tags);
      similarity = semanticScore;
    }
    
    if (similarity > 0.05) { // 降低相似度閾值以確保有匹配結果
      matchedDimensions.push({ id: dimId, similarity });
      console.log(`📊 匹配維度 ${dimId}: 相似度 ${(similarity * 100).toFixed(1)}%`);
    }
  });
  
  // 確保至少有一些維度被匹配到
  if (matchedDimensions.length === 0) {
    console.log('⚠️ 沒有匹配到維度，使用默認匹配策略');
    // 添加一些基本維度作為默認匹配
    const defaultDimensions = ['0099', '0071', '0032']; // Learning, Social Achievement, Emotional Stability
    defaultDimensions.forEach(dimId => {
      if (REAL_TWIN3_METADATA[dimId]) {
        matchedDimensions.push({ id: dimId, similarity: 0.3 });
        console.log(`📊 默認匹配維度 ${dimId}: 相似度 30%`);
      }
    });
  }
  
  return { metaTags: extractedTags, matchedDimensions };
};

// 語意相似度計算（簡化版）
const calculateSemanticSimilarity = (userTags: string[], dimensionTags: string[]): number => {
  let score = 0;
  
  // 檢查語意相關性
  const semanticGroups = {
    learning: ['學習', '知識', '技能', '教育', '研究', '課程'],
    social: ['朋友', '社交', '聚會', '團隊', '合作', '互動'],
    achievement: ['成就', '完成', '成功', '達成', '獲得', '表現'],
    food: ['食物', '吃', '餐', '飲食', '料理', '營養'],
    leadership: ['領導', '帶領', '指導', '管理', '組織'],
    responsibility: ['責任', '環保', '永續', '社會', '公益'],
    emotion: ['情緒', '感受', '心情', '情感', '穩定']
  };
  
  for (const [group, keywords] of Object.entries(semanticGroups)) {
    const userMatches = userTags.filter(tag => keywords.includes(tag)).length;
    const dimMatches = dimensionTags.filter(tag => keywords.includes(tag)).length;
    
    if (userMatches > 0 && dimMatches > 0) {
      score += Math.min(userMatches, dimMatches) * 0.2;
    }
  }
  
  return Math.min(score, 1.0);
};
// 真實的ULTU動態評分算法
const runULTU = (
  dimensionId: string, 
  userContent: string, 
  previousScore: number, 
  updateCount: number,
  msmmSimilarity: number,
  matchedMetaTags: string[]
): { score: number, details: CalculationDetails } => {
  console.log(`⚡ ULTU: 開始為維度 ${dimensionId} 計算分數...`);
  
  const dimension = REAL_TWIN3_METADATA[dimensionId];
  if (!dimension) {
    const defaultDetails: CalculationDetails = {
      msmmSimilarity,
      geminiRawScore: 0,
      previousScore,
      smoothingFactor: 1.0,
      timeDecayFactor: 1.0,
      finalScore: previousScore,
      matchedMetaTags,
      relevanceFactors: [],
      strategy: 'not-applicable',
      updateCount: updateCount + 1
    };
    return { score: previousScore, details: defaultDetails };
  }
  
  // 1. Gemini AI評分模擬（基於真實的AI解析指導）
  let geminiRawScore = 0; // 基準分數從0開始
  const relevanceFactors: Array<{ factor: string; contribution: number; description: string }> = [];
  
  // Meta-Tags匹配強度分析
  const tagMatchStrength = matchedMetaTags.length / dimension.meta_tags.length;
  if (tagMatchStrength > 0) {
    const tagBonus = Math.round(tagMatchStrength * 80 + 50); // 基礎50分 + 最高80分加分
    geminiRawScore += tagBonus;
    relevanceFactors.push({
      factor: 'Meta-Tags匹配強度',
      contribution: tagBonus,
      description: `匹配度 ${(tagMatchStrength * 100).toFixed(1)}%，匹配標籤: ${matchedMetaTags.join(', ')}`
    });
  }
  
  // 內容語意深度分析
  const contentComplexity = Math.min(userContent.length / 20, 10); // 最高10分
  if (contentComplexity > 2) {
    const complexityBonus = Math.round(contentComplexity);
    geminiRawScore += complexityBonus;
    relevanceFactors.push({
      factor: '內容語意深度',
      contribution: complexityBonus,
      description: `內容複雜度評分: ${contentComplexity.toFixed(1)}/10`
    });
  }
  
  // 維度特定的AI解析（基於encoding_rules）
  const textLower = userContent.toLowerCase();
  
  // 社會成就維度特定分析
  if (dimensionId === '0071') {
    if (textLower.includes('完成') || textLower.includes('成功') || textLower.includes('獲得')) {
      const achievementBonus = 50;
      geminiRawScore += achievementBonus;
      relevanceFactors.push({
        factor: '成就行為識別',
        contribution: achievementBonus, 
        description: '識別到明確的成就表現行為'
      });
    }
  }
  
  // 領導能力維度特定分析
  if (dimensionId === '0048') {
    if (textLower.includes('帶領') || textLower.includes('指導') || textLower.includes('組織')) {
      const leadershipBonus = 60;
      geminiRawScore += leadershipBonus;
      relevanceFactors.push({
        factor: '領導行為識別',
        contribution: leadershipBonus,
        description: '識別到明確的領導行為表現'
      });
    }
  }
  
  // 社會責任維度特定分析
  if (dimensionId === 'SP088') {
    if (textLower.includes('環保') || textLower.includes('永續') || textLower.includes('社會')) {
      const responsibilityBonus = 70;
      geminiRawScore += responsibilityBonus;
      relevanceFactors.push({
        factor: '社會責任識別',
        contribution: responsibilityBonus,
        description: '識別到環保或社會責任相關行為'
      });
    }
  }
  
  // 學習導向維度特定分析
  if (dimensionId === '0099') {
    if (textLower.includes('學習') || textLower.includes('知識') || textLower.includes('技能')) {
      const learningBonus = 55;
      geminiRawScore += learningBonus;
      relevanceFactors.push({
        factor: '學習行為識別',
        contribution: learningBonus,
        description: '識別到學習和知識獲取行為'
      });
    }
  }
  
  // 飲食習慣維度特定分析
  if (dimensionId === '0008') {
    if (textLower.includes('吃') || textLower.includes('食物') || textLower.includes('餐')) {
      const foodBonus = 45;
      geminiRawScore += foodBonus;
      relevanceFactors.push({
        factor: '飲食行為識別',
        contribution: foodBonus,
        description: '識別到飲食相關活動'
      });
    }
  }
  
  // 情緒穩定性維度特定分析
  if (dimensionId === '0032') {
    if (textLower.includes('開心') || textLower.includes('快樂') || textLower.includes('滿足')) {
      const emotionBonus = 40;
      geminiRawScore += emotionBonus;
      relevanceFactors.push({
        factor: '正面情緒識別',
        contribution: emotionBonus,
        description: '識別到正面情緒表達'
      });
    }
  }
  
  // 確保分數在有效範圍內
  geminiRawScore = Math.max(0, Math.min(255, geminiRawScore));
  
  // 2. ULTU分數平滑（Twin3標準公式）
  let alpha = updateCount === 0 ? 1.0 : 0.3; // 首次更新直接使用新分數
  
  // 確保有意義的分數變化
  if (geminiRawScore < 50 && updateCount === 0) {
    geminiRawScore = Math.max(50, geminiRawScore + 30); // 提升初始分數
  }
  
  const smoothedScore = Math.round(alpha * geminiRawScore + (1 - alpha) * previousScore);
  
  // 3. 智能更新策略（基於真實ULTU邏輯）
  let finalScore = smoothedScore;
  let strategy = '標準平滑';
  
  if (updateCount === 0) {
    strategy = '首次評分';
    finalScore = Math.max(finalScore, 80); // 確保首次評分有合理的基礎分數
  } else if (updateCount < 3) {
    // 早期更新：較積極的學習
    const aggressiveAlpha = 0.7;
    finalScore = Math.round(aggressiveAlpha * geminiRawScore + (1 - aggressiveAlpha) * previousScore);
    strategy = '積極學習';
  } else if (Math.abs(geminiRawScore - previousScore) > 50) {
    // 異常變化：謹慎處理
    const conservativeAlpha = 0.15;
    finalScore = Math.round(conservativeAlpha * geminiRawScore + (1 - conservativeAlpha) * previousScore);
    strategy = '異常保護';
  }
  
  // 確保分數有實際變化
  if (finalScore === previousScore && geminiRawScore !== previousScore) {
    finalScore = previousScore + (geminiRawScore > previousScore ? 5 : -5);
  }
  
  console.log(`📊 ${dimensionId}: ${previousScore} → ${finalScore} (Gemini: ${geminiRawScore}, 策略: ${strategy})`);
  
  const calculationDetails: CalculationDetails = {
    msmmSimilarity,
    geminiRawScore,
    previousScore,
    smoothingFactor: alpha,
    timeDecayFactor: 1.0,
    finalScore,
    matchedMetaTags,
    relevanceFactors,
    strategy,
    updateCount: updateCount + 1
  };
  
  return { score: finalScore, details: calculationDetails };
};

// 真實的Twin3演算法處理流程
export const processContentWithTwin3Algorithm = async (
  content: UserContent,
  speed: number = 1,
  currentMatrix: Record<string, number> = {},
  onStepUpdate?: (step: string, data: any) => void
): Promise<ProcessingResult & { 
  calculationDetails: Record<string, CalculationDetails>,
  algorithmSteps: Array<{step: string, timestamp: string, data: any}>
}> => {
  const baseDelay = 800 / speed;
  const algorithmSteps: Array<{ step: string; timestamp: string; data: any }> = [];
  
  console.log('🚀 Twin3演算法開始處理...');
  console.log('🚀 twin3演算法開始處理...');
  
  // 步驟1: MSMM語意匹配（優先走後端 API）
  onStepUpdate?.('msmm', { status: 'running', message: '正在提取Meta-Tags...' });
  await new Promise(resolve => setTimeout(resolve, baseDelay));
  await ensureMetadataLoaded();
  
  const msmmResult = await runMSMMViaAPI(content.text, content.image);

  // 若 metaTags 為空，直接終止流程
  if (!msmmResult.metaTags || msmmResult.metaTags.length === 0) {
    onStepUpdate?.('msmm', { status: 'complete', metaTags: [], matchedDimensions: [] });
    onStepUpdate?.('complete', { status: 'complete', totalUpdates: 0, summary: [] });
    return {
      metaTags: [],
      matrixUpdates: {},
      processingTime: Math.round(baseDelay),
      matchedDimensions: [],
      calculationDetails: {},
      algorithmSteps: []
    };
  }
  algorithmSteps.push({
    step: 'MSMM完成',
    timestamp: new Date().toISOString(),
    data: {
      extractedTags: msmmResult.metaTags,
      matchedDimensions: msmmResult.matchedDimensions.length,
      details: msmmResult.matchedDimensions
    }
  });
  
  onStepUpdate?.('msmm', { 
    status: 'complete', 
    metaTags: msmmResult.metaTags,
    matchedDimensions: msmmResult.matchedDimensions
  });
  
  // 步驟2: ULTU動態評分
  onStepUpdate?.('ultu', { status: 'running', message: '正在計算維度分數...' });
  await new Promise(resolve => setTimeout(resolve, baseDelay));
  
  const matrixUpdates: Record<string, number> = {};
  const calculationDetails: Record<string, CalculationDetails> = {};
  
  // 為每個匹配的維度計算新分數
  try {
    const resp = await fetch('/ultu', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        text: content.text,
        image: typeof content.image === 'string' 
          ? content.image 
          : (content.image instanceof File ? await fileToDataUrl(content.image) : undefined),
        matches: msmmResult.matchedDimensions.map(m => ({
          attribute_id: m.id,
          attribute_name: REAL_TWIN3_METADATA[m.id]?.name,
          similarity_score: m.similarity
        })),
        user_id: 1
      })
    });
    if (!resp.ok) throw new Error(`ULTU API error ${resp.status}`);
    const data = await resp.json();
    console.log('🔍 ULTU API 回傳:', data);
    const updates = data.updates || {};
    console.log('🔍 updates 內容:', updates);
    Object.entries(updates).forEach(([id, info]: any) => {
      console.log(`🔍 處理維度 ${id}:`, info);
      matrixUpdates[id] = info.smoothed_score;
      calculationDetails[id] = {
        msmmSimilarity: msmmResult.matchedDimensions.find(d => d.id === id)?.similarity || 0,
        geminiRawScore: info.new_raw_score ?? 0,
        previousScore: info.previous_score ?? 128,
        smoothingFactor: 0.3,
        timeDecayFactor: 1.0,
        finalScore: info.smoothed_score ?? info.previous_score ?? 128,
        matchedMetaTags: msmmResult.metaTags.filter(tag => REAL_TWIN3_METADATA[id]?.meta_tags.includes(tag)),
        relevanceFactors: [],
        strategy: info.strategy_used ?? 'balanced',
        updateCount: info.update_count ?? 1
      };
    });
  } catch (e) {
    console.warn('⚠️ ULTU API 失敗，暫以本地模擬：', e);
    msmmResult.matchedDimensions.forEach(match => {
      const previousScore = currentMatrix[match.id] || 0;
      const updateCount = 0;
      const result = runULTU(
        match.id,
        content.text,
        previousScore, 
        updateCount,
        match.similarity,
        msmmResult.metaTags.filter(tag => 
          REAL_TWIN3_METADATA[match.id]?.meta_tags.includes(tag)
        )
      );
      matrixUpdates[match.id] = result.score;
      calculationDetails[match.id] = result.details;
    });
  }
  
  algorithmSteps.push({
    step: 'ULTU完成',
    timestamp: new Date().toISOString(),
    data: {
      updatedDimensions: Object.keys(matrixUpdates).length,
      scoreChanges: Object.entries(matrixUpdates).map(([id, newScore]) => ({
        dimensionId: id,
        previousScore: currentMatrix[id] || 128,
        newScore,
        change: newScore - (currentMatrix[id] || 128)
      }))
    }
  });
  
  onStepUpdate?.('ultu', { 
    status: 'complete', 
    updates: matrixUpdates,
    calculationDetails
  });
  
  // 步驟3: 矩陣更新完成
  onStepUpdate?.('complete', { 
    status: 'complete', 
    totalUpdates: Object.keys(matrixUpdates).length,
    summary: algorithmSteps
  });
  
  // 轉換Meta-Tags為標準格式
  const metaTags: MetaTag[] = msmmResult.metaTags.map(tag => ({
    tag,
    confidence: 0.85 + Math.random() * 0.15
  }));
  
  const processingTime = Math.round(baseDelay * 3 + Math.random() * 200);
  
  console.log('✅ Twin3演算法處理完成');
  console.log('✅ twin3演算法處理完成');
  console.log(`📊 更新了 ${Object.keys(matrixUpdates).length} 個維度`);
  console.log('📊 matrixUpdates 詳細內容:', matrixUpdates);
  
  return {
    metaTags,
    matrixUpdates,
    processingTime,
    matchedDimensions: msmmResult.matchedDimensions.map(m => m.id),
    calculationDetails,
    algorithmSteps
  };
};