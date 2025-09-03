import React, { useState, useRef } from 'react';
import { Send, Image, Settings, Play, Pause, Zap } from 'lucide-react';
import { UserContent } from '../types';
import { useLanguage } from '../hooks/useLanguage';
import { useTranslation } from '../utils/translations';

interface InputPanelProps {
  onContentSubmit: (content: UserContent) => void;
  isProcessing: boolean;
  isAutoProcess: boolean;
  onAutoProcessChange: (enabled: boolean) => void;
  processingSpeed: number;
  onSpeedChange: (speed: number) => void;
}

const InputPanel: React.FC<InputPanelProps> = ({
  onContentSubmit,
  isProcessing,
  isAutoProcess,
  onAutoProcessChange,
  processingSpeed,
  onSpeedChange
}) => {
  const { language } = useLanguage();
  const t = useTranslation(language);
  const [text, setText] = useState('');
  const [selectedImage, setSelectedImage] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!text.trim() || isProcessing) return;

    onContentSubmit({
      text: text.trim(),
      image: selectedImage || undefined
    });

    // Clear form after submission
    setText('');
    setSelectedImage(null);
    setImagePreview(null);
  };

  const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setSelectedImage(file);
      const reader = new FileReader();
      reader.onload = (e) => {
        setImagePreview(e.target?.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const removeImage = () => {
    setSelectedImage(null);
    setImagePreview(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const quickExamples = [
    getQuickExample(language, 'academic'),
    getQuickExample(language, 'environmental'),
    getQuickExample(language, 'fitness')
  ];

  // 快速範例生成函數
  const getQuickExample = (lang: string, type: string): string => {
    const examples = {
      'en': {
        academic: "I led my juniors to complete a research paper and celebrated with a famous Taiwanese breakfast.",
        environmental: "Participated in an eco-market, learned how to reduce carbon footprint, and bought some sustainable products.",
        fitness: "Did high-intensity interval training at the gym, then enjoyed a healthy dinner with friends."
      },
      'zh-CN': {
        academic: "我今天带领学弟妹完成了一篇论文，还顺便去吃了有名的台式早餐庆祝。",
        environmental: "参加了环保市集，学习如何减少碳足迹，买了一些永续产品。",
        fitness: "在健身房进行了高强度间歇训练，然后和朋友们一起享用健康晚餐。"
      },
      'ja': {
        academic: "今日、後輩たちと一緒に論文を完成させ、有名な台湾式朝食を食べてお祝いしました。",
        environmental: "エコマーケットに参加し、カーボンフットプリントを減らす方法を学び、持続可能な製品を購入しました。",
        fitness: "ジムで高強度インターバルトレーニングを行い、その後友達と健康的な夕食を楽しみました。"
      },
      'ko': {
        academic: "오늘 후배들과 함께 논문을 완성하고 유명한 대만식 아침식사로 축하했습니다.",
        environmental: "환경 시장에 참여하여 탄소 발자국을 줄이는 방법을 배우고 지속 가능한 제품을 구입했습니다.",
        fitness: "체육관에서 고강도 인터벌 트레이닝을 하고 친구들과 건강한 저녁을 즐겼습니다."
      },
      'es': {
        academic: "Hoy dirigí a mis compañeros menores para completar un artículo de investigación y celebramos con un famoso desayuno taiwanés.",
        environmental: "Participé en un mercado ecológico, aprendí cómo reducir la huella de carbono y compré algunos productos sostenibles.",
        fitness: "Hice entrenamiento de intervalos de alta intensidad en el gimnasio, luego disfruté de una cena saludable con amigos."
      },
      'zh-TW': {
        academic: "我今天帶領學弟妹完成了一篇論文，還順便去吃了有名的台式早餐慶祝。",
        environmental: "參加了環保市集，學習如何減少碳足跡，買了一些永續產品。",
        fitness: "在健身房進行了高強度間歇訓練，然後和朋友們一起享用健康晚餐。"
      }
    };
    return examples[lang]?.[type] || examples['zh-TW'][type];
  };

  return (
    <div className="space-y-4">
      {/* Input Form */}
      <div className="bg-card rounded-lg border border-border p-4">
        <h3 className="text-lg font-semibold mb-4 flex items-center">
          <Zap className="w-5 h-5 mr-2 text-primary" />
          Multi-Modal Input
        </h3>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-2">User Content</label>
            <textarea
              value={text}
              onChange={(e) => setText(e.target.value)}
              placeholder={t.input.placeholder}
              className="w-full h-32 px-3 py-2 bg-input border border-border rounded-md resize-none focus:outline-none focus:ring-2 focus:ring-primary"
              disabled={isProcessing}
            />
            <div className="text-xs text-muted-foreground mt-1">
              {text.length}/500 {t.input.characterCount}
            </div>
          </div>

          {/* Image Upload */}
          <div>
            <label className="block text-sm font-medium mb-2">{t.input.uploadImage}</label>
            <div className="space-y-2">
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*,video/*"
                onChange={handleImageSelect}
                className="hidden"
              />
              
              {!imagePreview ? (
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="w-full h-24 border-2 border-dashed border-border rounded-md flex items-center justify-center hover:border-primary transition-colors"
                  disabled={isProcessing}
                >
                  <div className="text-center">
                    <Image className="w-6 h-6 mx-auto mb-1 text-muted-foreground" />
                    <span className="text-sm text-muted-foreground">{t.input.uploadImage}</span>
                    <span className="text-xs text-muted-foreground block">{t.input.uploadSupport}</span>
                  </div>
                </button>
              ) : (
                <div className="relative">
                  <img
                    src={imagePreview}
                    alt="Preview"
                    className="w-full h-24 object-cover rounded-md border border-border"
                  />
                  <div className="absolute bottom-1 left-1 bg-black/70 text-white text-xs px-2 py-1 rounded">
                    {selectedImage?.type.startsWith('video/') ? '📹 視頻' : '🖼️ 圖片'}
                  </div>
                  <button
                    type="button"
                    onClick={removeImage}
                    className="absolute top-1 right-1 bg-destructive text-destructive-foreground rounded-full w-6 h-6 flex items-center justify-center text-xs hover:bg-destructive/80"
                    disabled={isProcessing}
                  >
                    ×
                  </button>
                </div>
              )}
            </div>
          </div>

          <button
            type="submit"
            disabled={!text.trim() || isProcessing}
            className="w-full bg-primary text-primary-foreground py-3 px-4 rounded-md hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center space-x-2 transition-all transform hover:scale-105 active:scale-95 shadow-lg hover:shadow-xl"
          >
            <Send className="w-4 h-4" />
            <span>{isProcessing ? t.input.processingButton : t.input.submitButton}</span>
          </button>
        </form>
      </div>

      {/* Quick Examples */}
      <div className="bg-card rounded-lg border border-border p-4">
        <h4 className="text-sm font-medium mb-3">{t.input.quickExamples}</h4>
        <div className="space-y-2">
          {quickExamples.map((example, index) => (
            <button
              key={index}
              onClick={() => setText(example)}
              className="w-full text-left text-xs p-2 bg-secondary hover:bg-secondary/80 rounded border border-border transition-colors"
              disabled={isProcessing}
            >
              {example}
            </button>
          ))}
        </div>
      </div>

      {/* Processing Controls */}
      <div className="bg-card rounded-lg border border-border p-4">
        <h4 className="text-sm font-medium mb-3 flex items-center">
          <Settings className="w-4 h-4 mr-2" />
          {t.input.systemSettings}
        </h4>
        
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <span className="text-sm">{t.input.autoProcess}</span>
            <button
              onClick={() => onAutoProcessChange(!isAutoProcess)}
              className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                isAutoProcess ? 'bg-primary' : 'bg-secondary'
              }`}
            >
              <span
                className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                  isAutoProcess ? 'translate-x-6' : 'translate-x-1'
                }`}
              />
            </button>
          </div>
          
          <div>
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm">{t.input.animationSpeed}</span>
              <span className="text-xs text-muted-foreground">{processingSpeed}x</span>
            </div>
            <input
              type="range"
              min="0.5"
              max="3"
              step="0.5"
              value={processingSpeed}
              onChange={(e) => onSpeedChange(Number(e.target.value))}
              className="w-full h-2 bg-secondary rounded-lg appearance-none cursor-pointer"
            />
          </div>
        </div>
      </div>
    </div>
  );
};

export default InputPanel;