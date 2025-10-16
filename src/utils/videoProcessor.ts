import { UserContent, ProcessingResult, MetaTag, CalculationDetails } from '../types';

// 視頻處理和LLM解析工具
export class VideoLLMProcessor {
  private apiKey: string;
  private geminiEndpoint = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent';

  constructor() {
    this.apiKey = import.meta.env.VITE_GEMINI_API_KEY;
    if (!this.apiKey) {
      console.error('❌ Gemini API key not found in environment variables');
    } else {
      console.log('✅ Gemini API key loaded for video processing');
    }
  }

  // 將視頻文件轉換為base64
  private async videoToBase64(file: File): Promise<string> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => {
        const result = reader.result as string;
        // 移除data URL前綴，只保留base64數據
        const base64 = result.split(',')[1];
        resolve(base64);
      };
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });
  }

  // 獲取視頻的MIME類型
  private getVideoMimeType(file: File): string {
    const mimeType = file.type;
    // 確保是支持的視頻格式
    const supportedTypes = ['video/mp4', 'video/mpeg', 'video/mov', 'video/avi', 'video/x-flv', 'video/mpg', 'video/webm', 'video/wmv', 'video/3gpp'];
    
    if (supportedTypes.includes(mimeType)) {
      return mimeType;
    }
    
    // 默認返回mp4
    return 'video/mp4';
  }

  // 使用Gemini API分析視頻內容
  async analyzeVideoWithLLM(file: File, textContent: string): Promise<{
    videoAnalysis: string;
    extractedTags: string[];
    sceneDescription: string;
    emotionalContext: string;
  }> {
    try {
      console.log('🎬 開始視頻LLM分析...');
      
      // 轉換視頻為base64
      const videoBase64 = await this.videoToBase64(file);
      const mimeType = this.getVideoMimeType(file);
      
      console.log(`📹 視頻格式: ${mimeType}, 大小: ${(file.size / 1024 / 1024).toFixed(2)}MB`);

      // 構建Gemini API請求
      const prompt = `
你是Twin3系統的專業視頻內容分析AI。請分析這個視頻並結合用戶的文字描述，提取關鍵信息。

用戶文字描述：「${textContent}」

請分析視頻內容並提供：
1. 視頻場景描述（50字以內）
2. 情緒和氛圍分析（30字以內）
3. 提取3-8個Meta-Tags（用逗號分隔，如：學習,成就感,團隊合作）
4. 綜合分析（結合文字和視頻，100字以內）

請按以下格式回應：
場景描述：[描述]
情緒分析：[分析]
Meta-Tags：[標籤1,標籤2,標籤3]
綜合分析：[分析]
`;

      const requestBody = {
        contents: [{
          parts: [
            {
              inline_data: {
                mime_type: mimeType,
                data: videoBase64
              }
            },
            {
              text: prompt
            }
          ]
        }],
        generationConfig: {
          temperature: 0.7,
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
      const analysisText = data.candidates?.[0]?.content?.parts?.[0]?.text || '';
      
      console.log('🤖 Gemini視頻分析結果:', analysisText);

      // 解析回應
      const sceneMatch = analysisText.match(/場景描述：(.+)/);
      const emotionMatch = analysisText.match(/情緒分析：(.+)/);
      const tagsMatch = analysisText.match(/Meta-Tags：(.+)/);
      const analysisMatch = analysisText.match(/綜合分析：(.+)/);

      const sceneDescription = sceneMatch?.[1]?.trim() || '無法識別場景';
      const emotionalContext = emotionMatch?.[1]?.trim() || '無法識別情緒';
      const tagsString = tagsMatch?.[1]?.trim() || '';
      const videoAnalysis = analysisMatch?.[1]?.trim() || analysisText;

      // 提取Meta-Tags
      const extractedTags = tagsString
        .split(/[,，\s]+/)
        .map(tag => tag.trim())
        .filter(tag => tag.length > 0 && tag.length < 20)
        .slice(0, 8);

      console.log('🎯 提取的視頻Meta-Tags:', extractedTags);

      return {
        videoAnalysis,
        extractedTags,
        sceneDescription,
        emotionalContext
      };

    } catch (error) {
      console.error('❌ 視頻LLM分析失敗:', error);
      
      // 回退到基本分析
      return {
        videoAnalysis: '視頻分析暫時不可用，使用文字內容進行處理',
        extractedTags: ['視頻', '多媒體', '內容'],
        sceneDescription: '無法分析視頻場景',
        emotionalContext: '無法分析情緒內容'
      };
    }
  }

  // 檢查文件是否為視頻
  isVideoFile(file: File): boolean {
    return file.type.startsWith('video/');
  }

  // 獲取視頻基本信息
  async getVideoInfo(file: File): Promise<{
    duration: number;
    size: number;
    type: string;
    name: string;
  }> {
    return new Promise((resolve) => {
      const video = document.createElement('video');
      video.preload = 'metadata';
      
      video.onloadedmetadata = () => {
        resolve({
          duration: video.duration,
          size: file.size,
          type: file.type,
          name: file.name
        });
      };
      
      video.onerror = () => {
        resolve({
          duration: 0,
          size: file.size,
          type: file.type,
          name: file.name
        });
      };
      
      video.src = URL.createObjectURL(file);
    });
  }
}

export const videoProcessor = new VideoLLMProcessor();