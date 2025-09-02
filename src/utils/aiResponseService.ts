import { UserContent, MetaTag } from '../types';
import { Language } from '../hooks/useLanguage';

export interface AIResponse {
  message: string;
  insights: string[];
  recommendations: string[];
  emotionalTone: string;
  analysisConfidence: number;
}

export class AIResponseService {
  private apiKey: string;
  private geminiEndpoint = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent';

  constructor() {
    this.apiKey = import.meta.env.VITE_GEMINI_API_KEY;
    if (!this.apiKey) {
      console.error('❌ Gemini API key not found in environment variables');
    } else {
      console.log('✅ Gemini API key loaded successfully');
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
  private buildResponsePrompt(userContent: string, extractedTags: MetaTag[], language: Language): string {
    const tagsText = extractedTags.map(tag => tag.tag).join(', ');
    
    const languagePrompts = {
      'en': `
You are the twin3 system's intelligent assistant, specializing in analyzing users' life experiences and providing personalized insights.

The user just shared the following content:
"${userContent}"

System extracted Meta-Tags: ${tagsText}

Please respond to the user in a warm, professional, and insightful manner, including:

1. **Personalized Response**: Give positive and specific feedback on the user's shared experience
2. **Behavioral Insights**: Analyze the user's behavioral patterns and traits based on extracted Meta-Tags
3. **Emotional Recognition**: Identify the user's current emotional state

Please respond in English with a friendly yet professional tone. Keep response length between 150-200 words.

Format requirements:
Response: [Personalized response content]
Insights: [Behavioral insights]
Emotion: [Emotional state]
`,
      'zh-TW': `
你是twin3系統的智能助理，專門分析用戶的生活體驗並提供個人化洞察。

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
`,
      'zh-CN': `
你是twin3系统的智能助理，专门分析用户的生活体验并提供个性化洞察。

用户刚刚分享了以下内容：
"${userContent}"

系统已提取的Meta-Tags：${tagsText}

请以温暖、专业且具洞察力的方式回应用户，包含：

1. **个性化回应**：对用户分享的体验给予正面且具体的反馈
2. **行为洞察**：基于提取的Meta-Tags分析用户的行为模式和特质
3. **情绪识别**：识别用户当前的情绪状态

请用简体中文回应，语调要亲切且专业。回应长度控制在150-200字。

格式要求：
回应：[个性化回应内容]
洞察：[行为洞察]
情绪：[情绪状态]
`,
      'ja': `
あなたはtwin3システムのインテリジェントアシスタントで、ユーザーの生活体験を分析し、パーソナライズされた洞察を提供することを専門としています。

ユーザーが以下の内容を共有しました：
「${userContent}」

システムが抽出したMeta-Tags：${tagsText}

温かく、専門的で洞察力のある方法でユーザーに応答してください。以下を含めてください：

1. **パーソナライズされた応答**：ユーザーが共有した体験に対して前向きで具体的なフィードバックを提供
2. **行動洞察**：抽出されたMeta-Tagsに基づいてユーザーの行動パターンと特性を分析
3. **感情認識**：ユーザーの現在の感情状態を特定

日本語で親しみやすく専門的な口調で応答してください。応答の長さは150-200文字に制御してください。

フォーマット要件：
応答：[パーソナライズされた応答内容]
洞察：[行動洞察]
感情：[感情状態]
`,
      'ko': `
당신은 twin3 시스템의 지능형 어시스턴트로, 사용자의 생활 경험을 분석하고 개인화된 통찰을 제공하는 것을 전문으로 합니다.

사용자가 다음 내용을 공유했습니다:
"${userContent}"

시스템이 추출한 Meta-Tags: ${tagsText}

따뜻하고 전문적이며 통찰력 있는 방식으로 사용자에게 응답해주세요. 다음을 포함해주세요:

1. **개인화된 응답**: 사용자가 공유한 경험에 대해 긍정적이고 구체적인 피드백 제공
2. **행동 통찰**: 추출된 Meta-Tags를 기반으로 사용자의 행동 패턴과 특성 분석
3. **감정 인식**: 사용자의 현재 감정 상태 식별

한국어로 친근하면서도 전문적인 어조로 응답해주세요. 응답 길이는 150-200자로 제한해주세요.

형식 요구사항:
응답: [개인화된 응답 내용]
통찰: [행동 통찰]
감정: [감정 상태]
`,
      'es': `
Eres el asistente inteligente del sistema twin3, especializado en analizar las experiencias de vida de los usuarios y proporcionar perspectivas personalizadas.

El usuario acaba de compartir el siguiente contenido:
"${userContent}"

Meta-Tags extraídos por el sistema: ${tagsText}

Por favor, responde al usuario de manera cálida, profesional y perspicaz, incluyendo:

1. **Respuesta Personalizada**: Proporciona retroalimentación positiva y específica sobre la experiencia compartida por el usuario
2. **Perspectivas Conductuales**: Analiza los patrones de comportamiento y características del usuario basándote en los Meta-Tags extraídos
3. **Reconocimiento Emocional**: Identifica el estado emocional actual del usuario

Por favor, responde en español con un tono amigable pero profesional. Controla la longitud de la respuesta entre 150-200 palabras.

Requisitos de formato:
Respuesta: [Contenido de respuesta personalizada]
Perspectivas: [Perspectivas conductuales]
Emoción: [Estado emocional]
`
    };
    
    return languagePrompts[language] || languagePrompts['zh-TW'];
  }

  // 使用Gemini API生成AI回應
  async generateResponse(content: UserContent, extractedTags: MetaTag[], language: Language = 'zh-TW'): Promise<AIResponse> {
    if (!this.apiKey) {
      return this.getFallbackResponse(content.text, extractedTags, language);
    }

    try {
      console.log('🤖 正在生成AI回應...');
      
      const prompt = this.buildResponsePrompt(content.text, extractedTags, language);
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

      return this.parseAIResponse(responseText, language);

    } catch (error) {
      console.error('❌ AI回應生成失敗:', error);
      return this.getFallbackResponse(content.text, extractedTags, language);
    }
  }

  // 解析AI回應
  private parseAIResponse(responseText: string, language: Language): AIResponse {
    let responseMatch, insightMatch, emotionMatch;
    
    switch (language) {
      case 'en':
        responseMatch = responseText.match(/Response:\s*(.+?)(?=Insights:|$)/s);
        insightMatch = responseText.match(/Insights:\s*(.+?)(?=Emotion:|$)/s);
        emotionMatch = responseText.match(/Emotion:\s*(.+?)$/s);
        break;
      case 'zh-CN':
        responseMatch = responseText.match(/回应：(.+?)(?=洞察：|$)/s);
        insightMatch = responseText.match(/洞察：(.+?)(?=情绪：|$)/s);
        emotionMatch = responseText.match(/情绪：(.+?)$/s);
        break;
      case 'ja':
        responseMatch = responseText.match(/応答：(.+?)(?=洞察：|$)/s);
        insightMatch = responseText.match(/洞察：(.+?)(?=感情：|$)/s);
        emotionMatch = responseText.match(/感情：(.+?)$/s);
        break;
      case 'ko':
        responseMatch = responseText.match(/응답:\s*(.+?)(?=통찰:|$)/s);
        insightMatch = responseText.match(/통찰:\s*(.+?)(?=감정:|$)/s);
        emotionMatch = responseText.match(/감정:\s*(.+?)$/s);
        break;
      case 'es':
        responseMatch = responseText.match(/Respuesta:\s*(.+?)(?=Perspectivas:|$)/s);
        insightMatch = responseText.match(/Perspectivas:\s*(.+?)(?=Emoción:|$)/s);
        emotionMatch = responseText.match(/Emoción:\s*(.+?)$/s);
        break;
      default: // zh-TW
        responseMatch = responseText.match(/回應：(.+?)(?=洞察：|$)/s);
        insightMatch = responseText.match(/洞察：(.+?)(?=情緒：|$)/s);
        emotionMatch = responseText.match(/情緒：(.+?)$/s);
    }

    const message = responseMatch?.[1]?.trim() || responseText.substring(0, 200);
    const insightText = insightMatch?.[1]?.trim() || '';
    const emotionalTone = emotionMatch?.[1]?.trim() || '正面積極';

    // 解析洞察和建議
    const insights = insightText ? [insightText] : [];

    return {
      message,
      insights,
      recommendations: [], // 移除建議功能
      emotionalTone,
      analysisConfidence: 0.85 + Math.random() * 0.15
    };
  }

  // 回退回應（當API不可用時）
  private getFallbackResponse(userContent: string, extractedTags: MetaTag[], language: Language): AIResponse {
    const tags = extractedTags.map(tag => tag.tag);
    
    const fallbackMessages = {
      'en': {
        default: "Thank you for sharing this meaningful experience!",
        achievement: "Congratulations on this achievement! Your effort and persistence are commendable.",
        learning: "Great learning experience! Continuous learning is key to personal growth.",
        environmental: "Your concern for the environment and society is admirable! These actions are very meaningful.",
        emotionalTones: {
          default: "Positive and Active",
          achievement: "Sense of Achievement",
          learning: "Eager to Learn",
          environmental: "Social Responsibility"
        }
      },
      'zh-TW': {
        default: "感謝您分享這個有意義的體驗！",
        achievement: "恭喜您取得這個成就！您的努力和堅持值得讚賞。",
        learning: "很棒的學習體驗！持續學習是個人成長的關鍵。",
        environmental: "您對環境和社會的關注令人敬佩！這些行動很有意義。",
        emotionalTones: {
          default: "正面積極",
          achievement: "成就感滿足",
          learning: "求知慾旺盛",
          environmental: "社會責任感"
        }
      },
      'zh-CN': {
        default: "感谢您分享这个有意义的体验！",
        achievement: "恭喜您取得这个成就！您的努力和坚持值得赞赏。",
        learning: "很棒的学习体验！持续学习是个人成长的关键。",
        environmental: "您对环境和社会的关注令人敬佩！这些行动很有意义。",
        emotionalTones: {
          default: "正面积极",
          achievement: "成就感满足",
          learning: "求知欲旺盛",
          environmental: "社会责任感"
        }
      },
      'ja': {
        default: "この意味のある体験をシェアしていただき、ありがとうございます！",
        achievement: "この成果おめでとうございます！あなたの努力と継続は称賛に値します。",
        learning: "素晴らしい学習体験ですね！継続的な学習は個人の成長の鍵です。",
        environmental: "環境と社会への関心は素晴らしいです！これらの行動はとても意義があります。",
        emotionalTones: {
          default: "前向きで積極的",
          achievement: "達成感に満ちている",
          learning: "学習意欲旺盛",
          environmental: "社会責任感"
        }
      },
      'ko': {
        default: "이 의미 있는 경험을 공유해 주셔서 감사합니다!",
        achievement: "이 성취를 축하드립니다! 당신의 노력과 끈기는 칭찬받을 만합니다.",
        learning: "훌륭한 학습 경험이네요! 지속적인 학습은 개인 성장의 열쇠입니다.",
        environmental: "환경과 사회에 대한 관심이 존경스럽습니다! 이러한 행동들은 매우 의미가 있습니다.",
        emotionalTones: {
          default: "긍정적이고 적극적",
          achievement: "성취감 충만",
          learning: "학습 욕구 왕성",
          environmental: "사회적 책임감"
        }
      },
      'es': {
        default: "¡Gracias por compartir esta experiencia tan significativa!",
        achievement: "¡Felicidades por este logro! Tu esfuerzo y persistencia son admirables.",
        learning: "¡Excelente experiencia de aprendizaje! El aprendizaje continuo es clave para el crecimiento personal.",
        environmental: "¡Tu preocupación por el medio ambiente y la sociedad es admirable! Estas acciones son muy significativas.",
        emotionalTones: {
          default: "Positivo y Activo",
          achievement: "Sensación de Logro",
          learning: "Ansioso por Aprender",
          environmental: "Responsabilidad Social"
        }
      }
    };
    
    const messages = fallbackMessages[language] || fallbackMessages['zh-TW'];
    let message = messages.default;
    let emotionalTone = messages.emotionalTones.default;
    
    if (tags.some(tag => ['成就', '完成', '成功'].includes(tag))) {
      message = messages.achievement;
      emotionalTone = messages.emotionalTones.achievement;
    } else if (tags.some(tag => ['學習', '知識', '技能'].includes(tag))) {
      message = messages.learning;
      emotionalTone = messages.emotionalTones.learning;
    } else if (tags.some(tag => ['環保', '永續', '社會'].includes(tag))) {
      message = messages.environmental;
      emotionalTone = messages.emotionalTones.environmental;
    }

    const insightMessages = {
      'en': `You demonstrated traits related to ${tags.slice(0, 3).join(', ')}`,
      'zh-TW': `您展現了與${tags.slice(0, 3).join('、')}相關的特質`,
      'zh-CN': `您展现了与${tags.slice(0, 3).join('、')}相关的特质`,
      'ja': `${tags.slice(0, 3).join('、')}に関連する特性を示されました`,
      'ko': `${tags.slice(0, 3).join(', ')}와 관련된 특성을 보여주셨습니다`,
      'es': `Demostraste rasgos relacionados con ${tags.slice(0, 3).join(', ')}`
    };

    return {
      message,
      insights: [insightMessages[language] || insightMessages['zh-TW']],
      recommendations: [], // 移除建議功能
      emotionalTone,
      analysisConfidence: 0.75
    };
  }
}

export const aiResponseService = new AIResponseService();