import { UserContent, MetaTag } from '../types';

export interface AIResponse {
  message: string;
  insights: string[];
  recommendations: string[];
  emotionalTone: string;
  analysisConfidence: number;
}

export class AIResponseService {
  private apiKey: string;
  private geminiEndpoint = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash-exp:generateContent';

  constructor() {
    this.apiKey = import.meta.env.VITE_GEMINI_API_KEY;
    if (!this.apiKey) {
      console.warn('⚠️ Gemini API key not found in environment variables');
    }
  }

  // 將圖片文件轉換為base64
  private async imageToBase64(file: File): Promise<string> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => {
        const result = reader.result as string;
        const base64 = result.split(',')[1];
        resolve(base64);
      };
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });
  }

  // 將視頻文件轉換為base64
  private async videoToBase64(file: File): Promise<string> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => {
        const result = reader.result as string;
        const base64 = result.split(',')[1];
        resolve(base64);
      };
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });
  }

  // 獲取文件的MIME類型
  private getFileMimeType(file: File): string {
    if (file.type.startsWith('image/')) {
      return file.type;
    } else if (file.type.startsWith('video/')) {
      return file.type;
    }
    return 'application/octet-stream';
  }

  // 構建AI回應的prompt
  private buildResponsePrompt(userContent: string, extractedTags: MetaTag[]): string {
    const tagsText = extractedTags.map(tag => tag.tag).join(', ');
    
    return `
你是Twin3系統的智能助理，專門分析用戶的生活體驗並提供個人化洞察。

用戶剛剛分享了以下內容：
「${userContent}」

系統已提取的Meta-Tags：${tagsText}

請以溫暖、專業且具洞察力的方式回應用戶，包含：

1. **個人化回應**：對用戶分享的體驗給予正面且具體的回饋
2. **行為洞察**：基於提取的Meta-Tags分析用戶的行為模式和特質
3. **成長建議**：提供2-3個具體的個人發展建議
4. **情緒識別**：識別用戶當前的情緒狀態

請用繁體中文回應，語調要親切且專業。回應長度控制在150-200字。

格式要求：
回應：[個人化回應內容]
洞察：[行為洞察]
建議：[成長建議]
情緒：[情緒狀態]
`;
  }

  // 使用Gemini API生成AI回應
  async generateResponse(content: UserContent, extractedTags: MetaTag[]): Promise<AIResponse> {
    if (!this.apiKey) {
      return this.getFallbackResponse(content.text, extractedTags);
    }

    try {
      console.log('🤖 正在生成AI回應...');
      
      const prompt = this.buildResponsePrompt(content.text, extractedTags);
      const parts: any[] = [];

      // 如果有圖片或視頻，添加到請求中
      if (content.image) {
        if (content.image instanceof File) {
          let base64Data: string;
          let mimeType: string;

          if (content.image.type.startsWith('video/')) {
            base64Data = await this.videoToBase64(content.image);
            mimeType = this.getFileMimeType(content.image);
            console.log(`📹 添加視頻分析: ${mimeType}, 大小: ${(content.image.size / 1024 / 1024).toFixed(2)}MB`);
          } else {
            base64Data = await this.imageToBase64(content.image);
            mimeType = this.getFileMimeType(content.image);
            console.log(`🖼️ 添加圖片分析: ${mimeType}`);
          }

          parts.push({
            inline_data: {
              mime_type: mimeType,
              data: base64Data
            }
          });
        }
      }

      parts.push({ text: prompt });

      const requestBody = {
        contents: [{
          parts: parts
        }],
        generationConfig: {
          temperature: 0.8,
          topK: 40,
          topP: 0.95,
          maxOutputTokens: 1024,
        }
      };

      const response = await fetch(`${this.geminiEndpoint}?key=${this.apiKey}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestBody)
      });

      if (!response.ok) {
        throw new Error(`Gemini API error: ${response.status} ${response.statusText}`);
      }

      const data = await response.json();
      const responseText = data.candidates?.[0]?.content?.parts?.[0]?.text || '';
      
      console.log('✅ AI回應生成成功');

      return this.parseAIResponse(responseText);

    } catch (error) {
      console.error('❌ AI回應生成失敗:', error);
      return this.getFallbackResponse(content.text, extractedTags);
    }
  }

  // 解析AI回應
  private parseAIResponse(responseText: string): AIResponse {
    const responseMatch = responseText.match(/回應：(.+?)(?=洞察：|$)/s);
    const insightMatch = responseText.match(/洞察：(.+?)(?=建議：|$)/s);
    const recommendationMatch = responseText.match(/建議：(.+?)(?=情緒：|$)/s);
    const emotionMatch = responseText.match(/情緒：(.+?)$/s);

    const message = responseMatch?.[1]?.trim() || responseText.substring(0, 200);
    const insightText = insightMatch?.[1]?.trim() || '';
    const recommendationText = recommendationMatch?.[1]?.trim() || '';
    const emotionalTone = emotionMatch?.[1]?.trim() || '正面積極';

    // 解析洞察和建議
    const insights = insightText ? [insightText] : [];
    const recommendations = recommendationText ? 
      recommendationText.split(/[1-3]\.|\n/).filter(r => r.trim()).map(r => r.trim()) : 
      [];

    return {
      message,
      insights,
      recommendations: recommendations.slice(0, 3), // 最多3個建議
      emotionalTone,
      analysisConfidence: 0.85 + Math.random() * 0.15
    };
  }

  // 回退回應（當API不可用時）
  private getFallbackResponse(userContent: string, extractedTags: MetaTag[]): AIResponse {
    const tags = extractedTags.map(tag => tag.tag);
    
    let message = "感謝您分享這個有意義的體驗！";
    let emotionalTone = "正面積極";
    
    if (tags.some(tag => ['成就', '完成', '成功'].includes(tag))) {
      message = "恭喜您取得這個成就！您的努力和堅持值得讚賞。";
      emotionalTone = "成就感滿足";
    } else if (tags.some(tag => ['學習', '知識', '技能'].includes(tag))) {
      message = "很棒的學習體驗！持續學習是個人成長的關鍵。";
      emotionalTone = "求知慾旺盛";
    } else if (tags.some(tag => ['環保', '永續', '社會'].includes(tag))) {
      message = "您對環境和社會的關注令人敬佩！這些行動很有意義。";
      emotionalTone = "社會責任感";
    }

    return {
      message,
      insights: [`您展現了與${tags.slice(0, 3).join('、')}相關的特質`],
      recommendations: [
        "繼續保持這樣的積極態度",
        "可以考慮分享經驗給其他人",
        "記錄這些有意義的時刻"
      ],
      emotionalTone,
      analysisConfidence: 0.75
    };
  }
}

export const aiResponseService = new AIResponseService();