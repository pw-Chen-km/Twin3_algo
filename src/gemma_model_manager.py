"""
GemmaModelManager - 統一的 Gemma 模型管理器
負責載入和管理 Gemma 模型實例，支持多模組間共享以節省記憶體
"""

import os
import torch

# Gemma-3 多模態 LLM 整合
try:
    from transformers import AutoProcessor, AutoModelForImageTextToText
    import torch
    GEMMA_AVAILABLE = True
except ImportError:
    print("警告：transformers未安裝，GemmaModelManager將使用模擬模式")
    GEMMA_AVAILABLE = False
    torch = None

class GemmaModelManager:
    """統一的 Gemma 模型管理器，支持多模組間共享"""
    
    _instance = None  # 單例模式
    _model_loaded = False
    
    def __new__(cls):
        if cls._instance is None:
            cls._instance = super().__new__(cls)
        return cls._instance
    
    def __init__(self):
        if not hasattr(self, 'initialized'):
            self.initialized = True
            self.gemma_processor = None
            self.gemma_model = None
            self.device = None
            self.is_available = GEMMA_AVAILABLE
            self.model_path = None
    
    def load_model(self, 
                   gemma_model_name: str = "google/gemma-3n-E4B-it",
                   local_model_path: str = "models/gemma-3n-E4B-it",
                   use_local: bool = True) -> bool:
        """
        載入 Gemma 模型（如果尚未載入）
        返回是否成功載入
        """
        if self._model_loaded:
            print(f"✅ Gemma 模型已載入，重複使用中")
            return True
        
        if not self.is_available:
            print("❌ transformers 不可用，無法載入 Gemma 模型")
            return False
        
        try:
            # 確定使用的模型路徑
            if use_local and local_model_path and os.path.exists(local_model_path):
                model_path = local_model_path
                print(f"🏠 正在載入本地 Gemma 模型: {model_path}")
            elif use_local and local_model_path:
                print(f"❌ 找不到本地模型: {local_model_path}")
                print("請確認模型已下載到正確位置，或使用線上模式")
                raise FileNotFoundError(f"本地模型不存在: {local_model_path}")
            else:
                model_path = gemma_model_name
                print(f"🌐 正在載入線上 Gemma 模型: {model_path}")
            
            self.model_path = model_path
            
            # 載入 Processor
            print("📦 載入 Processor...")
            self.gemma_processor = AutoProcessor.from_pretrained(model_path)
            
            # 設置設備優先順序
            import torch
            if torch.backends.mps.is_available():
                self.device = torch.device("mps")
                print("🚀 使用 MPS (Apple Silicon) 加速")
            elif torch.cuda.is_available():
                self.device = torch.device("cuda")
                print(f"🚀 使用 CUDA GPU 加速")
            else:
                self.device = torch.device("cpu")
                print("💻 使用 CPU 運算")

            # 載入 Gemma 多模態模型（使用正確的模型類別）
            print("🤖 載入 Gemma 多模態模型...")
            self.gemma_model = AutoModelForImageTextToText.from_pretrained(
                model_path,
                torch_dtype=torch.bfloat16 if self.device.type != "cpu" else torch.float32,
                device_map="auto" if torch.cuda.is_available() else None
            )
            
            # 如果不是使用 device_map，手動移動到設備
            if not torch.cuda.is_available():
                self.gemma_model = self.gemma_model.to(self.device)
            
            self.gemma_model.eval()
            
            self._model_loaded = True
            print(f"✅ Gemma 模型載入成功！")
            print(f"📊 設備: {self.device}")
            print(f"🔧 模型路徑: {model_path}")
            
            return True
            
        except Exception as e:
            print(f"❌ Gemma 模型載入失敗: {e}")
            self._model_loaded = False
            return False
    
    def get_model_components(self):
        """
        獲取模型組件（processor, model, device）
        如果模型未載入，返回 None
        """
        if not self._model_loaded or not self.is_available:
            return None, None, None
        
        return self.gemma_processor, self.gemma_model, self.device
    
    def is_model_available(self) -> bool:
        """檢查模型是否可用"""
        return self._model_loaded and self.is_available
    
    def get_model_info(self) -> dict:
        """獲取模型信息"""
        return {
            "loaded": self._model_loaded,
            "available": self.is_available,
            "device": self.device,
            "model_path": self.model_path
        }

# 全局單例實例
gemma_manager = GemmaModelManager() 