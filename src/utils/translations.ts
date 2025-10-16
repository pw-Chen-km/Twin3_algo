import { Language } from '../hooks/useLanguage';

export interface Translations {
  // Header
  title: string;
  subtitle: string;
  status: {
    ready: string;
    processing: string;
    complete: string;
    error: string;
  };

  // Input Panel
  input: {
    title: string;
    placeholder: string;
    uploadImage: string;
    uploadSupport: string;
    submitButton: string;
    processingButton: string;
    quickExamples: string;
    systemSettings: string;
    autoProcess: string;
    animationSpeed: string;
    characterCount: string;
  };

  // Matrix Visualization
  matrix: {
    title: string;
    allDimensions: string;
    algorithmResults: string;
    updatedDimensions: string;
    highestScore: string;
    averageScore: string;
    totalUpdates: string;
    fullMatrix: string;
    matrixDescription: string;
    clickTip: string;
    activeTip: string;
    colorTip: string;
    currentScore: string;
    hexValue: string;
    relativeStrength: string;
    latestChange: string;
    calculationProcess: string;
    updateHistory: string;
    dimensionDefinition: string;
    categories: {
      physical: string;
      social: string;
      digital: string;
      spiritual: string;
    };
  };

  // AI Response
  ai: {
    title: string;
    assistant: string;
    analyzing: string;
    emotionalState: string;
    behaviorInsights: string;
    matrixUpdateResults: string;
    analysisConfidence: string;
    updatedDimensions: string;
    processingTime: string;
  };

  // Algorithm Steps
  algorithm: {
    title: string;
    status: string;
    running: string;
    complete: string;
    pending: string;
    msmm: string;
    ultu: string;
    matrixUpdate: string;
    msmmDesc: string;
    ultuDesc: string;
    matrixDesc: string;
    extractedTags: string;
    matchedDimensions: string;
    dimensionsUpdated: string;
    processingContent: string;
  };

  // Activity Feed
  activity: {
    title: string;
    noActivity: string;
    submitContent: string;
    processingNew: string;
  };

  // Performance
  performance: {
    title: string;
    avgTime: string;
    updates: string;
    dimensions: string;
    activities: string;
    noData: string;
    processContent: string;
    processingTrend: string;
    activeDimensions: string;
  };

  // Conversation
  conversation: {
    title: string;
    subtitle: string;
    imageFile: string;
    videoFile: string;
    waitingInput: string;
    aiAnalyzing: string;
  };

  // Common
  common: {
    clickDetails: string;
    remove: string;
    close: string;
    user: string;
    time: string;
    score: string;
    change: string;
    strategy: string;
    updates: string;
    more: string;
  };
}

export const translations: Record<Language, Translations> = {
  'en': {
    title: 'twin3 Monitor',
    subtitle: 'Real-Time Processing Visualization',
    status: {
      ready: 'Ready',
      processing: 'Processing...',
      complete: 'Complete',
      error: 'Error'
    },
    input: {
      title: 'Multi-Modal Input',
      placeholder: 'Share your experience or activity... (optional, you can also just upload an image)',
      uploadImage: 'Upload Image or Video',
      uploadSupport: 'Supports multi-modal AI analysis',
      submitButton: '🚀 Start twin3 + AI Analysis',
      processingButton: '🤖 AI Analyzing...',
      quickExamples: 'Quick Examples',
      systemSettings: 'System Settings',
      autoProcess: 'Auto Process',
      animationSpeed: 'Animation Speed',
      characterCount: 'characters'
    },
    matrix: {
      title: 'twin Matrix Visualization',
      allDimensions: 'All Dimensions',
      algorithmResults: 'Algorithm Results',
      updatedDimensions: 'Updated Dimensions',
      highestScore: 'Highest Score',
      averageScore: 'Average Score',
      totalUpdates: 'Total Updates',
      fullMatrix: 'Complete 256-Dimension twin Matrix (16x16 DNA Address Mapping)',
      matrixDescription: 'Each cell represents a dimension, address format is 4-digit hexadecimal (0000-00FF)',
      clickTip: '💡 Click any dimension to view detailed information',
      activeTip: '🎯 Active dimensions have white dot markers, update count shown in bottom left',
      colorTip: '📊 Color depth represents score intensity, hexadecimal values shown in cells',
      currentScore: 'Current Score',
      hexValue: 'HEX Value',
      relativeStrength: 'Relative Strength',
      latestChange: 'Latest Change',
      calculationProcess: 'Latest Calculation Process (twin3 Algorithm)',
      updateHistory: 'Update History',
      dimensionDefinition: 'Dimension Definition',
      categories: {
        physical: 'Physical',
        social: 'Social',
        digital: 'Digital',
        spiritual: 'Spiritual'
      }
    },
    ai: {
      title: 'AI Intelligent Response',
      assistant: 'twin3 AI Assistant',
      analyzing: 'AI is analyzing your content...',
      emotionalState: 'Emotional State',
      behaviorInsights: 'Behavior Insights',
      matrixUpdateResults: 'twin3 Matrix Update Results',
      analysisConfidence: 'Analysis Confidence',
      updatedDimensions: 'Updated',
      processingTime: 'Processing Time'
    },
    algorithm: {
      title: 'twin3 Algorithm Engine [ACTIVE]',
      status: 'Status',
      running: '[RUNNING]',
      complete: '[COMPLETE]',
      pending: '[PENDING]',
      msmm: 'MSMM Semantic Matching',
      ultu: 'ULTU Dynamic Scoring',
      matrixUpdate: 'Matrix Update',
      msmmDesc: 'Gemini 2.5 Flash extracts Meta-Tags',
      ultuDesc: 'Precise scoring and score smoothing',
      matrixDesc: 'twin Matrix state update',
      extractedTags: 'Meta-Tags Extracted',
      matchedDimensions: 'Matched Dimensions',
      dimensionsUpdated: 'Dimensions Updated',
      processingContent: '▶ Processing user content with AI models...'
    },
    activity: {
      title: 'Activity Feed',
      noActivity: 'No activity records yet',
      submitContent: 'Submit content to see processing results',
      processingNew: 'Processing new content...'
    },
    performance: {
      title: 'Performance',
      avgTime: 'Avg Time',
      updates: 'Updates',
      dimensions: 'Dimensions',
      activities: 'Activities',
      noData: 'No performance data',
      processContent: 'Process some content to see metrics',
      processingTrend: 'Processing Time Trend',
      activeDimensions: 'Active Dimensions'
    },
    conversation: {
      title: 'twin3 Intelligent Conversation',
      subtitle: 'Chat with AI assistant for real-time analysis of your life experiences',
      imageFile: '🖼️ Image',
      videoFile: '📹 Video',
      waitingInput: 'Waiting for content input',
      aiAnalyzing: 'AI is analyzing...'
    },
    common: {
      clickDetails: 'Click to view details',
      remove: 'Remove',
      close: 'Close',
      user: 'User',
      time: 'Time',
      score: 'Score',
      change: 'Change',
      strategy: 'Strategy',
      updates: 'Updates',
      more: 'more'
    }
  },
  'zh-TW': {
    title: 'twin3 監控台',
    subtitle: '即時處理視覺化',
    status: {
      ready: '就緒',
      processing: '處理中...',
      complete: '完成',
      error: '錯誤'
    },
    input: {
      title: '多模態輸入',
      placeholder: '分享您今天的體驗或活動... (可選，也可以只上傳圖片)',
      uploadImage: '上傳圖片或視頻',
      uploadSupport: '支援多模態AI分析',
      submitButton: '🚀 開始 twin3 + AI 分析',
      processingButton: '🤖 AI 分析中...',
      quickExamples: '快速範例',
      systemSettings: '系統設定',
      autoProcess: '自動處理',
      animationSpeed: '動畫速度',
      characterCount: '字符'
    },
    matrix: {
      title: 'twin Matrix 視覺化',
      allDimensions: '所有維度',
      algorithmResults: '演算法計算結果',
      updatedDimensions: '共更新維度',
      highestScore: '最高分數',
      averageScore: '平均分數',
      totalUpdates: '總更新次數',
      fullMatrix: '完整256維度 twin Matrix (16x16 DNA位址映射)',
      matrixDescription: '每個格子代表一個維度，位址格式為4位16進制 (0000-00FF)',
      clickTip: '💡 點擊任意維度查看詳細資訊',
      activeTip: '🎯 活躍維度有白色圓點標記，更新次數顯示在左下角',
      colorTip: '📊 顏色深度代表分數強度，16進制值顯示在格子中',
      currentScore: '當前分數',
      hexValue: 'HEX值',
      relativeStrength: '相對強度',
      latestChange: '最新變化',
      calculationProcess: '最新計算過程 (twin3演算法)',
      updateHistory: '更新歷史記錄',
      dimensionDefinition: '維度定義',
      categories: {
        physical: '生理',
        social: '社交',
        digital: '數位',
        spiritual: '精神'
      }
    },
    ai: {
      title: 'AI 智能回應',
      assistant: 'twin3 AI 助理',
      analyzing: 'AI 正在分析您的內容...',
      emotionalState: '情緒狀態',
      behaviorInsights: '行為洞察',
      matrixUpdateResults: 'twin3 Matrix 更新結果',
      analysisConfidence: '分析信心度',
      updatedDimensions: '更新了',
      processingTime: '處理時間'
    },
    algorithm: {
      title: 'twin3 演算法引擎 [啟動中]',
      status: '狀態',
      running: '[執行中]',
      complete: '[完成]',
      pending: '[等待中]',
      msmm: 'MSMM 語意匹配',
      ultu: 'ULTU 動態評分',
      matrixUpdate: '矩陣更新',
      msmmDesc: 'Gemini 2.5 Flash 提取Meta-Tags',
      ultuDesc: '精確評分與分數平滑',
      matrixDesc: 'twin Matrix狀態更新',
      extractedTags: 'Meta-Tags 已提取',
      matchedDimensions: '匹配維度',
      dimensionsUpdated: '維度已更新',
      processingContent: '▶ 正在使用AI模型處理用戶內容...'
    },
    activity: {
      title: '活動記錄',
      noActivity: '尚無活動記錄',
      submitContent: '提交內容以查看處理結果',
      processingNew: '正在處理新內容...'
    },
    performance: {
      title: '效能',
      avgTime: '平均時間',
      updates: '更新',
      dimensions: '維度',
      activities: '活動',
      noData: '無效能數據',
      processContent: '處理一些內容以查看指標',
      processingTrend: '處理時間趨勢',
      activeDimensions: '活躍維度'
    },
    conversation: {
      title: 'twin3 智能對話',
      subtitle: '與AI助理對話，即時分析您的生活體驗',
      imageFile: '🖼️ 圖片',
      videoFile: '📹 視頻',
      waitingInput: '等待內容輸入',
      aiAnalyzing: 'AI 正在分析...'
    },
    common: {
      clickDetails: '點擊查看詳情',
      remove: '移除',
      close: '關閉',
      user: '用戶',
      time: '時間',
      score: '分數',
      change: '變化',
      strategy: '策略',
      updates: '更新',
      more: '更多'
    }
  },
  'zh-CN': {
    title: 'twin3 监控台',
    subtitle: '实时处理可视化',
    status: {
      ready: '就绪',
      processing: '处理中...',
      complete: '完成',
      error: '错误'
    },
    input: {
      title: '多模态输入',
      placeholder: '分享您今天的体验或活动... (可选，也可以只上传图片)',
      uploadImage: '上传图片或视频',
      uploadSupport: '支持多模态AI分析',
      submitButton: '🚀 开始 twin3 + AI 分析',
      processingButton: '🤖 AI 分析中...',
      quickExamples: '快速示例',
      systemSettings: '系统设置',
      autoProcess: '自动处理',
      animationSpeed: '动画速度',
      characterCount: '字符'
    },
    matrix: {
      title: 'twin Matrix 可视化',
      allDimensions: '所有维度',
      algorithmResults: '算法计算结果',
      updatedDimensions: '共更新维度',
      highestScore: '最高分数',
      averageScore: '平均分数',
      totalUpdates: '总更新次数',
      fullMatrix: '完整256维度 twin Matrix (16x16 DNA地址映射)',
      matrixDescription: '每个格子代表一个维度，地址格式为4位16进制 (0000-00FF)',
      clickTip: '💡 点击任意维度查看详细信息',
      activeTip: '🎯 活跃维度有白色圆点标记，更新次数显示在左下角',
      colorTip: '📊 颜色深度代表分数强度，16进制值显示在格子中',
      currentScore: '当前分数',
      hexValue: 'HEX值',
      relativeStrength: '相对强度',
      latestChange: '最新变化',
      calculationProcess: '最新计算过程 (twin3算法)',
      updateHistory: '更新历史记录',
      dimensionDefinition: '维度定义',
      categories: {
        physical: '生理',
        social: '社交',
        digital: '数字',
        spiritual: '精神'
      }
    },
    ai: {
      title: 'AI 智能回应',
      assistant: 'twin3 AI 助理',
      analyzing: 'AI 正在分析您的内容...',
      emotionalState: '情绪状态',
      behaviorInsights: '行为洞察',
      matrixUpdateResults: 'twin3 Matrix 更新结果',
      analysisConfidence: '分析信心度',
      updatedDimensions: '更新了',
      processingTime: '处理时间'
    },
    algorithm: {
      title: 'twin3 算法引擎 [启动中]',
      status: '状态',
      running: '[运行中]',
      complete: '[完成]',
      pending: '[等待中]',
      msmm: 'MSMM 语义匹配',
      ultu: 'ULTU 动态评分',
      matrixUpdate: '矩阵更新',
      msmmDesc: 'Gemini 2.5 Flash 提取Meta-Tags',
      ultuDesc: '精确评分与分数平滑',
      matrixDesc: 'twin Matrix状态更新',
      extractedTags: 'Meta-Tags 已提取',
      matchedDimensions: '匹配维度',
      dimensionsUpdated: '维度已更新',
      processingContent: '▶ 正在使用AI模型处理用户内容...'
    },
    activity: {
      title: '活动记录',
      noActivity: '尚无活动记录',
      submitContent: '提交内容以查看处理结果',
      processingNew: '正在处理新内容...'
    },
    performance: {
      title: '性能',
      avgTime: '平均时间',
      updates: '更新',
      dimensions: '维度',
      activities: '活动',
      noData: '无性能数据',
      processContent: '处理一些内容以查看指标',
      processingTrend: '处理时间趋势',
      activeDimensions: '活跃维度'
    },
    conversation: {
      title: 'twin3 智能对话',
      subtitle: '与AI助理对话，实时分析您的生活体验',
      imageFile: '🖼️ 图片',
      videoFile: '📹 视频',
      waitingInput: '等待内容输入',
      aiAnalyzing: 'AI 正在分析...'
    },
    common: {
      clickDetails: '点击查看详情',
      remove: '移除',
      close: '关闭',
      user: '用户',
      time: '时间',
      score: '分数',
      change: '变化',
      strategy: '策略',
      updates: '更新',
      more: '更多'
    }
  },
  'ja': {
    title: 'twin3 モニター',
    subtitle: 'リアルタイム処理可視化',
    status: {
      ready: '準備完了',
      processing: '処理中...',
      complete: '完了',
      error: 'エラー'
    },
    input: {
      title: 'マルチモーダル入力',
      placeholder: '今日の体験や活動をシェアしてください... (オプション、画像のみのアップロードも可能)',
      uploadImage: '画像または動画をアップロード',
      uploadSupport: 'マルチモーダルAI分析をサポート',
      submitButton: '🚀 twin3 + AI 分析を開始',
      processingButton: '🤖 AI 分析中...',
      quickExamples: 'クイック例',
      systemSettings: 'システム設定',
      autoProcess: '自動処理',
      animationSpeed: 'アニメーション速度',
      characterCount: '文字'
    },
    matrix: {
      title: 'twin Matrix 可視化',
      allDimensions: 'すべての次元',
      algorithmResults: 'アルゴリズム計算結果',
      updatedDimensions: '更新された次元',
      highestScore: '最高スコア',
      averageScore: '平均スコア',
      totalUpdates: '総更新回数',
      fullMatrix: '完全256次元 twin Matrix (16x16 DNAアドレスマッピング)',
      matrixDescription: '各セルは1つの次元を表し、アドレス形式は4桁の16進数 (0000-00FF)',
      clickTip: '💡 任意の次元をクリックして詳細情報を表示',
      activeTip: '🎯 アクティブな次元には白い点マーカーがあり、更新回数が左下に表示されます',
      colorTip: '📊 色の深さはスコア強度を表し、16進数値がセルに表示されます',
      currentScore: '現在のスコア',
      hexValue: 'HEX値',
      relativeStrength: '相対強度',
      latestChange: '最新の変化',
      calculationProcess: '最新の計算プロセス (twin3アルゴリズム)',
      updateHistory: '更新履歴',
      dimensionDefinition: '次元定義',
      categories: {
        physical: '身体的',
        social: '社会的',
        digital: 'デジタル',
        spiritual: '精神的'
      }
    },
    ai: {
      title: 'AI インテリジェント応答',
      assistant: 'twin3 AI アシスタント',
      analyzing: 'AIがあなたのコンテンツを分析しています...',
      emotionalState: '感情状態',
      behaviorInsights: '行動洞察',
      matrixUpdateResults: 'twin3 Matrix 更新結果',
      analysisConfidence: '分析信頼度',
      updatedDimensions: '更新しました',
      processingTime: '処理時間'
    },
    algorithm: {
      title: 'twin3 アルゴリズムエンジン [アクティブ]',
      status: 'ステータス',
      running: '[実行中]',
      complete: '[完了]',
      pending: '[待機中]',
      msmm: 'MSMM セマンティックマッチング',
      ultu: 'ULTU 動的スコアリング',
      matrixUpdate: 'マトリックス更新',
      msmmDesc: 'Gemini 2.5 Flash がMeta-Tagsを抽出',
      ultuDesc: '精密スコアリングとスコア平滑化',
      matrixDesc: 'twin Matrixステート更新',
      extractedTags: 'Meta-Tags 抽出済み',
      matchedDimensions: 'マッチした次元',
      dimensionsUpdated: '次元が更新されました',
      processingContent: '▶ AIモデルでユーザーコンテンツを処理中...'
    },
    activity: {
      title: 'アクティビティフィード',
      noActivity: 'アクティビティ記録はまだありません',
      submitContent: 'コンテンツを送信して処理結果を確認',
      processingNew: '新しいコンテンツを処理中...'
    },
    performance: {
      title: 'パフォーマンス',
      avgTime: '平均時間',
      updates: '更新',
      dimensions: '次元',
      activities: 'アクティビティ',
      noData: 'パフォーマンスデータなし',
      processContent: 'メトリクスを表示するためにコンテンツを処理してください',
      processingTrend: '処理時間トレンド',
      activeDimensions: 'アクティブな次元'
    },
    conversation: {
      title: 'twin3 インテリジェント会話',
      subtitle: 'AIアシスタントと会話し、あなたの生活体験をリアルタイム分析',
      imageFile: '🖼️ 画像',
      videoFile: '📹 動画',
      waitingInput: 'コンテンツ入力を待機中',
      aiAnalyzing: 'AI 分析中...'
    },
    common: {
      clickDetails: 'クリックして詳細を表示',
      remove: '削除',
      close: '閉じる',
      user: 'ユーザー',
      time: '時間',
      score: 'スコア',
      change: '変化',
      strategy: '戦略',
      updates: '更新',
      more: 'その他'
    }
  },
  'ko': {
    title: 'twin3 모니터',
    subtitle: '실시간 처리 시각화',
    status: {
      ready: '준비',
      processing: '처리 중...',
      complete: '완료',
      error: '오류'
    },
    input: {
      title: '멀티모달 입력',
      placeholder: '오늘의 경험이나 활동을 공유해주세요... (선택사항, 이미지만 업로드해도 됩니다)',
      uploadImage: '이미지 또는 비디오 업로드',
      uploadSupport: '멀티모달 AI 분석 지원',
      submitButton: '🚀 twin3 + AI 분석 시작',
      processingButton: '🤖 AI 분석 중...',
      quickExamples: '빠른 예시',
      systemSettings: '시스템 설정',
      autoProcess: '자동 처리',
      animationSpeed: '애니메이션 속도',
      characterCount: '글자'
    },
    matrix: {
      title: 'twin Matrix 시각화',
      allDimensions: '모든 차원',
      algorithmResults: '알고리즘 계산 결과',
      updatedDimensions: '업데이트된 차원',
      highestScore: '최고 점수',
      averageScore: '평균 점수',
      totalUpdates: '총 업데이트 횟수',
      fullMatrix: '완전한 256차원 twin Matrix (16x16 DNA 주소 매핑)',
      matrixDescription: '각 셀은 하나의 차원을 나타내며, 주소 형식은 4자리 16진수 (0000-00FF)',
      clickTip: '💡 임의의 차원을 클릭하여 자세한 정보 보기',
      activeTip: '🎯 활성 차원에는 흰색 점 마커가 있고, 업데이트 횟수가 왼쪽 하단에 표시됩니다',
      colorTip: '📊 색상 깊이는 점수 강도를 나타내며, 16진수 값이 셀에 표시됩니다',
      currentScore: '현재 점수',
      hexValue: 'HEX값',
      relativeStrength: '상대적 강도',
      latestChange: '최신 변화',
      calculationProcess: '최신 계산 과정 (twin3 알고리즘)',
      updateHistory: '업데이트 기록',
      dimensionDefinition: '차원 정의',
      categories: {
        physical: '신체적',
        social: '사회적',
        digital: '디지털',
        spiritual: '정신적'
      }
    },
    ai: {
      title: 'AI 지능형 응답',
      assistant: 'twin3 AI 어시스턴트',
      analyzing: 'AI가 귀하의 콘텐츠를 분석하고 있습니다...',
      emotionalState: '감정 상태',
      behaviorInsights: '행동 통찰',
      matrixUpdateResults: 'twin3 Matrix 업데이트 결과',
      analysisConfidence: '분석 신뢰도',
      updatedDimensions: '업데이트됨',
      processingTime: '처리 시간'
    },
    algorithm: {
      title: 'twin3 알고리즘 엔진 [활성]',
      status: '상태',
      running: '[실행 중]',
      complete: '[완료]',
      pending: '[대기 중]',
      msmm: 'MSMM 의미 매칭',
      ultu: 'ULTU 동적 점수',
      matrixUpdate: '매트릭스 업데이트',
      msmmDesc: 'Gemini 2.5 Flash가 Meta-Tags 추출',
      ultuDesc: '정밀 점수 및 점수 평활화',
      matrixDesc: 'twin Matrix 상태 업데이트',
      extractedTags: 'Meta-Tags 추출됨',
      matchedDimensions: '매칭된 차원',
      dimensionsUpdated: '차원이 업데이트됨',
      processingContent: '▶ AI 모델로 사용자 콘텐츠 처리 중...'
    },
    activity: {
      title: '활동 피드',
      noActivity: '아직 활동 기록이 없습니다',
      submitContent: '콘텐츠를 제출하여 처리 결과 확인',
      processingNew: '새 콘텐츠 처리 중...'
    },
    performance: {
      title: '성능',
      avgTime: '평균 시간',
      updates: '업데이트',
      dimensions: '차원',
      activities: '활동',
      noData: '성능 데이터 없음',
      processContent: '메트릭을 보려면 일부 콘텐츠를 처리하세요',
      processingTrend: '처리 시간 추세',
      activeDimensions: '활성 차원'
    },
    conversation: {
      title: 'twin3 지능형 대화',
      subtitle: 'AI 어시스턴트와 대화하여 생활 경험을 실시간 분석',
      imageFile: '🖼️ 이미지',
      videoFile: '📹 비디오',
      waitingInput: '콘텐츠 입력 대기 중',
      aiAnalyzing: 'AI 분석 중...'
    },
    common: {
      clickDetails: '클릭하여 세부 정보 보기',
      remove: '제거',
      close: '닫기',
      user: '사용자',
      time: '시간',
      score: '점수',
      change: '변화',
      strategy: '전략',
      updates: '업데이트',
      more: '더 보기'
    }
  },
  'es': {
    title: 'Monitor twin3',
    subtitle: 'Visualización de Procesamiento en Tiempo Real',
    status: {
      ready: 'Listo',
      processing: 'Procesando...',
      complete: 'Completo',
      error: 'Error'
    },
    input: {
      title: 'Entrada Multimodal',
      placeholder: 'Comparte tu experiencia o actividad de hoy... (opcional, también puedes subir solo una imagen)',
      uploadImage: 'Subir Imagen o Video',
      uploadSupport: 'Soporta análisis de IA multimodal',
      submitButton: '🚀 Iniciar Análisis twin3 + IA',
      processingButton: '🤖 IA Analizando...',
      quickExamples: 'Ejemplos Rápidos',
      systemSettings: 'Configuración del Sistema',
      autoProcess: 'Proceso Automático',
      animationSpeed: 'Velocidad de Animación',
      characterCount: 'caracteres'
    },
    matrix: {
      title: 'Visualización twin Matrix',
      allDimensions: 'Todas las Dimensiones',
      algorithmResults: 'Resultados del Algoritmo',
      updatedDimensions: 'Dimensiones Actualizadas',
      highestScore: 'Puntuación Más Alta',
      averageScore: 'Puntuación Promedio',
      totalUpdates: 'Total de Actualizaciones',
      fullMatrix: 'twin Matrix Completa de 256 Dimensiones (Mapeo de Direcciones DNA 16x16)',
      matrixDescription: 'Cada celda representa una dimensión, formato de dirección es hexadecimal de 4 dígitos (0000-00FF)',
      clickTip: '💡 Haz clic en cualquier dimensión para ver información detallada',
      activeTip: '🎯 Las dimensiones activas tienen marcadores de puntos blancos, el recuento de actualizaciones se muestra en la esquina inferior izquierda',
      colorTip: '📊 La profundidad del color representa la intensidad de la puntuación, los valores hexadecimales se muestran en las celdas',
      currentScore: 'Puntuación Actual',
      hexValue: 'Valor HEX',
      relativeStrength: 'Fuerza Relativa',
      latestChange: 'Último Cambio',
      calculationProcess: 'Último Proceso de Cálculo (algoritmo twin3)',
      updateHistory: 'Historial de Actualizaciones',
      dimensionDefinition: 'Definición de Dimensión',
      categories: {
        physical: 'Físico',
        social: 'Social',
        digital: 'Digital',
        spiritual: 'Espiritual'
      }
    },
    ai: {
      title: 'Respuesta Inteligente de IA',
      assistant: 'Asistente IA twin3',
      analyzing: 'La IA está analizando tu contenido...',
      emotionalState: 'Estado Emocional',
      behaviorInsights: 'Perspectivas de Comportamiento',
      matrixUpdateResults: 'Resultados de Actualización twin3 Matrix',
      analysisConfidence: 'Confianza del Análisis',
      updatedDimensions: 'Actualizado',
      processingTime: 'Tiempo de Procesamiento'
    },
    algorithm: {
      title: 'Motor de Algoritmo twin3 [ACTIVO]',
      status: 'Estado',
      running: '[EJECUTANDO]',
      complete: '[COMPLETO]',
      pending: '[PENDIENTE]',
      msmm: 'Coincidencia Semántica MSMM',
      ultu: 'Puntuación Dinámica ULTU',
      matrixUpdate: 'Actualización de Matriz',
      msmmDesc: 'Gemini 2.5 Flash extrae Meta-Tags',
      ultuDesc: 'Puntuación precisa y suavizado de puntuación',
      matrixDesc: 'Actualización del estado twin Matrix',
      extractedTags: 'Meta-Tags Extraídos',
      matchedDimensions: 'Dimensiones Coincidentes',
      dimensionsUpdated: 'Dimensiones Actualizadas',
      processingContent: '▶ Procesando contenido del usuario con modelos de IA...'
    },
    activity: {
      title: 'Feed de Actividad',
      noActivity: 'Aún no hay registros de actividad',
      submitContent: 'Envía contenido para ver los resultados del procesamiento',
      processingNew: 'Procesando nuevo contenido...'
    },
    performance: {
      title: 'Rendimiento',
      avgTime: 'Tiempo Promedio',
      updates: 'Actualizaciones',
      dimensions: 'Dimensiones',
      activities: 'Actividades',
      noData: 'Sin datos de rendimiento',
      processContent: 'Procesa algo de contenido para ver métricas',
      processingTrend: 'Tendencia de Tiempo de Procesamiento',
      activeDimensions: 'Dimensiones Activas'
    },
    conversation: {
      title: 'Conversación Inteligente twin3',
      subtitle: 'Chatea con el asistente de IA para análisis en tiempo real de tus experiencias de vida',
      imageFile: '🖼️ Imagen',
      videoFile: '📹 Video',
      waitingInput: 'Esperando entrada de contenido',
      aiAnalyzing: 'IA analizando...'
    },
    common: {
      clickDetails: 'Haz clic para ver detalles',
      remove: 'Eliminar',
      close: 'Cerrar',
      user: 'Usuario',
      time: 'Tiempo',
      score: 'Puntuación',
      change: 'Cambio',
      strategy: 'Estrategia',
      updates: 'Actualizaciones',
      more: 'más'
    }
  }
};

export const useTranslation = (language: Language) => {
  return translations[language];
};