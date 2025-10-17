// 問題資料 (使用像素座標，假設圖片尺寸為768x768)
const questions = [
  {
    id: 1,
    title: '第1題：迷宮中的選擇',
    text: '一場殘酷的捉迷藏即將開始，你選擇躲在哪裡？',
    image: 'Q1.png',
    width: 768,
    height: 768,
    type: 'clickable',
    options: [
      { id: 'door', text: '一扇半掩的木門後', value: 'A', x: 150, y: 260, w: 140, h: 260 },
      { id: 'passage', text: '一段濕冷的綠牆通道', value: 'B', x: 480, y: 260, w: 130, h: 240 },
      { id: 'storage', text: '地下貯藏室', value: 'C', x: 495, y: 555, w: 120, h: 140 }
    ]
  },
  {
    id: 2,
    title: '第2題：跳繩橋上',
    text: '繩索高速甩動，發出尖銳的破空聲，橋面在腳下微微晃動。<br>你站在橋邊，手上緊緊抱著唯一重要的東西。',
    image: 'ChatGPT Image 2025年6月24日 下午01_56_43.png',
    width: 768,
    height: 768,
    type: 'clickable',
    options: [
      { id: 'doll', text: '一隻破布偶', value: 'A', x: 295, y: 680, w: 80, h: 85 },
      { id: 'notebook', text: '一本舊筆記本', value: 'B', x: 470, y: 700, w: 55, h: 55 },
      { id: 'photo', text: '一張撕掉角的照片', value: 'C', x: 422, y: 695, w: 33, h: 40 }
    ]
  },
  {
    id: 3,
    title: '第3題：天空之聲',
    text: '獨自站在決戰的圓台上，四周寂靜無聲，唯有天空傳來幾段旋律，輕輕地撥動你的心弦。\n**請傾聽，選擇你喜歡的聲音。**\n**選擇你所愛的聲音，讓它成為此刻的記憶。**',
    image: 'ChatGPT Image 2025年6月24日 下午01_56_30.png',
    width: 768,
    height: 768,
    type: 'music',
    options: [
      { id: 'pink', text: 'Pink Soldiers', audio: 'Pink Soldiers.mp3', value: 'A' },
      { id: 'rope', text: 'The Rope is Tied', audio: 'The Rope is Tied  Squid Game OST.mp3', value: 'B' },
      { id: 'way', text: 'Way Back Then', audio: 'Way Back then.mp3', value: 'C' }
    ]
  }
];

// ---------- 香料對應表 ----------
const TOP_NOTE_MAP = {       // Q1：前調（20%）
  A: ['香檸檬', '桂花'],
  B: ['無花果', '白葡萄酒'],
  C: ['含羞草', '伯爵茶']
};

const HEART_NOTE_MAP = {     // Q2：中調（50%）
  A: ['小蒼蘭', '金銀花'],
  B: ['橙花', '茉莉花'],
  C: ['天竺葵', '青草', '海洋']
};

const BASE_NOTE_MAP = {      // Q3：後調（30%）
  A: ['檀香木', '白麝香'],
  B: ['零陵香豆', '香草'],
  C: ['禪茶', '麝香', '紅木']
};

// ---------- 香水配方計算函式 ----------
function getPerfumeFormula(answerValues, totalGrams = 8) {
  if (!Array.isArray(answerValues) || answerValues.length !== 3) {
    throw new Error('❌ 答案應為長度 3 的字母陣列');
  }

  const [q1, q2, q3] = answerValues.map(a => a.toUpperCase());
  const notes = {
    top:   TOP_NOTE_MAP[q1]   || [],
    heart: HEART_NOTE_MAP[q2] || [],
    base:  BASE_NOTE_MAP[q3]  || []
  };
  const ratio = { top: 20, heart: 50, base: 30 };

  // ---- 計算每支香料重量 ----
  const weights = {};
  for (const noteType of ['top', 'heart', 'base']) {
    const groupWeight   = totalGrams * ratio[noteType] / 100;
    const materials     = notes[noteType];
    const eachBase      = +(groupWeight / materials.length).toFixed(3);
    let residual        = +(groupWeight - eachBase * materials.length).toFixed(3);

    materials.forEach((mat, idx) => {
      weights[mat] = eachBase + (idx === 0 ? residual : 0);
    });
  }

  return { notes, ratio, weights, total: totalGrams };
}

// ---------- 渲染香水配方 ----------
function renderPerfumeFormula(result) {
  const { notes, ratio, weights, total } = result;
  
  // 依前中後調分組顯示
  const topNotes = notes.top.map(mat => 
    `<li>${mat}：${weights[mat].toFixed(3)} g</li>`
  ).join('');
  
  const heartNotes = notes.heart.map(mat => 
    `<li>${mat}：${weights[mat].toFixed(3)} g</li>`
  ).join('');
  
  const baseNotes = notes.base.map(mat => 
    `<li>${mat}：${weights[mat].toFixed(3)} g</li>`
  ).join('');

  return `
    <div class="perfume-formula">
      <h3>✨ 你的專屬香水配方 ✨</h3>
      <p class="formula-total">總重量：${total} g</p>
      
      <div class="formula-section">
        <h4>▸ 前調（${ratio.top}%）</h4>
        <ul class="formula-list">${topNotes}</ul>
      </div>
      
      <div class="formula-section">
        <h4>▸ 中調（${ratio.heart}%）</h4>
        <ul class="formula-list">${heartNotes}</ul>
      </div>
      
      <div class="formula-section">
        <h4>▸ 後調（${ratio.base}%）</h4>
        <ul class="formula-list">${baseNotes}</ul>
      </div>
    </div>
  `;
}

// 狀態管理
let currentQuestion = 0;
let answers = [];
let answerValues = []; // 儲存 A, B, C 值
let currentAudio = null;
let selectedMusicOption = null; // 新增：追蹤選中的音樂選項

// DOM 元素
const coverPage = document.getElementById('cover-page');
const questionContainer = document.getElementById('question-container');
const resultContainer = document.getElementById('result-container');
const questionTitle = document.getElementById('question-title');
const questionText = document.getElementById('question-text');
const scene = document.getElementById('scene');
const musicPlayer = document.getElementById('music-player');
const audioPlayer = document.getElementById('audio-player');
const resultContent = document.getElementById('result-content');
const restartBtn = document.getElementById('restart-btn');

// 封面頁面功能
function startGame() {
  coverPage.classList.add('hidden');
  questionContainer.classList.remove('hidden');
  showQuestion();
}



// 初始化
document.addEventListener('DOMContentLoaded', () => {
  // 封面頁面點擊事件
  coverPage.addEventListener('click', startGame);
  
  // 重新開始按鈕事件
  restartBtn.addEventListener('click', restart);
});

// 顯示問題
function showQuestion() {
  if (currentQuestion >= questions.length) {
    showResult();
    return;
  }

  const question = questions[currentQuestion];
  
  // 更新問題文字
  questionTitle.textContent = question.title;
  // 處理換行和粗體格式
  const formattedText = question.text
    .replace(/\n/g, '<br>')
    .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');
  questionText.innerHTML = formattedText;
  
  // 清除之前的內容
  scene.innerHTML = '';
  musicPlayer.classList.add('hidden');
  
  // 停止之前的音樂
  if (currentAudio) {
    audioPlayer.pause();
    currentAudio = null;
  }
  
  // 根據問題類型創建選項
  if (question.type === 'clickable') {
    createSVGScene(question);
  } else if (question.type === 'music') {
    createMusicOptions(question);
  }
}

// 創建SVG場景
function createSVGScene(question) {
  // 創建SVG命名空間
  const svgNS = 'http://www.w3.org/2000/svg';
  
  // 創建SVG元素
  const svg = document.createElementNS(svgNS, 'svg');
  svg.setAttribute('viewBox', `0 0 ${question.width} ${question.height}`);
  svg.setAttribute('preserveAspectRatio', 'xMidYMid meet');
  svg.classList.add('scene-svg');
  
  // 創建底圖
  const imgEl = document.createElementNS(svgNS, 'image');
  imgEl.setAttributeNS('http://www.w3.org/1999/xlink', 'href', question.image);
  imgEl.setAttribute('width', question.width);
  imgEl.setAttribute('height', question.height);
  svg.appendChild(imgEl);
  
  // 創建熱區
  question.options.forEach(option => {
    const rect = document.createElementNS(svgNS, 'rect');
    rect.setAttribute('x', option.x);
    rect.setAttribute('y', option.y);
    rect.setAttribute('width', option.w);
    rect.setAttribute('height', option.h);
    rect.classList.add('hotspot');
    rect.setAttribute('data-option', option.id);
    rect.setAttribute('title', option.text);
    rect.addEventListener('click', () => handleAnswer(option));
    svg.appendChild(rect);
  });
  
  // 為第2題添加SVG說明文字
  if (question.id === 2) {
    const instructionText = document.createElementNS(svgNS, 'text');
    instructionText.setAttribute('x', '384'); // 圖片中央
    instructionText.setAttribute('y', '650'); // 三個選擇的中間上方
    instructionText.setAttribute('text-anchor', 'middle');
    instructionText.setAttribute('font-family', '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif');
    instructionText.setAttribute('font-size', '20');
    instructionText.setAttribute('font-weight', 'bold');
    instructionText.setAttribute('fill', 'white'); // 實白色
    instructionText.textContent = '請選擇，你無法放手的珍寶';
    svg.appendChild(instructionText);
  }
  
  // 將SVG添加到場景中
  scene.appendChild(svg);
}

// 創建音樂選項
function createMusicOptions(question) {
  // 先創建底圖SVG
  const svgNS = 'http://www.w3.org/2000/svg';
  const svg = document.createElementNS(svgNS, 'svg');
  svg.setAttribute('viewBox', `0 0 ${question.width} ${question.height}`);
  svg.setAttribute('preserveAspectRatio', 'xMidYMid meet');
  svg.classList.add('scene-svg');
  
  // 創建底圖
  const imgEl = document.createElementNS(svgNS, 'image');
  imgEl.setAttributeNS('http://www.w3.org/1999/xlink', 'href', question.image);
  imgEl.setAttribute('width', question.width);
  imgEl.setAttribute('height', question.height);
  svg.appendChild(imgEl);
  
  scene.appendChild(svg);
  
  // 創建說明文字（使用HTML元素架構）
  const instructionText = document.createElement('div');
  instructionText.className = 'instruction-text';
  instructionText.textContent = '可選的按鍵,逐一聆聽:';
  scene.appendChild(instructionText);
  
  // 創建音樂選項容器
  const musicSelection = document.createElement('div');
  musicSelection.className = 'music-selection';
  
  question.options.forEach(option => {
    const button = document.createElement('button');
    button.className = 'music-button';
    button.textContent = option.text;
    button.addEventListener('click', () => handleMusicChoice(option));
    musicSelection.appendChild(button);
  });
  
  // 新增確認按鈕
  const confirmButton = document.createElement('button');
  confirmButton.className = 'confirm-button';
  confirmButton.textContent = '確認選擇';
  confirmButton.disabled = true; // 初始時禁用
  confirmButton.addEventListener('click', confirmMusicSelection);
  
  scene.appendChild(musicSelection);
  scene.appendChild(confirmButton);
  
  // 確保確認按鈕可見
  setTimeout(() => {
    confirmButton.scrollIntoView({ block: 'end', behavior: 'smooth' });
  }, 100);
}

// 處理答案選擇
function handleAnswer(option) {
  // 添加點擊動畫
  const clickedArea = document.querySelector(`[data-option="${option.id}"]`);
  if (clickedArea) {
    clickedArea.classList.add('clicked');
  }
  
  // 記錄答案
  answers.push({
    question: questions[currentQuestion].title,
    answer: option.text
  });
  answerValues.push(option.value); // 記錄 A, B, C 值
  
  // 延遲後進入下一題
  setTimeout(() => {
    currentQuestion++;
    showQuestion();
  }, 500);
}

// 處理音樂選擇
function handleMusicChoice(option) {
  // 如果正在播放其他音樂，先停止
  if (currentAudio) {
    audioPlayer.pause();
    document.querySelectorAll('.music-button').forEach(btn => {
      btn.classList.remove('playing');
      btn.classList.remove('selected'); // 移除選中狀態
    });
  }
  
  // 更新音樂播放器
  audioPlayer.src = option.audio;
  
  // 標記正在播放和選中的按鈕
  event.target.classList.add('playing');
  event.target.classList.add('selected');
  
  // 播放音樂
  audioPlayer.play();
  currentAudio = option.audio;
  
  // 記錄選中的選項（但還不記錄答案）
  selectedMusicOption = option;
  
  // 啟用確認按鈕
  const confirmButton = document.querySelector('.confirm-button');
  if (confirmButton) {
    confirmButton.disabled = false;
  }
}

// 新增：確認音樂選擇
function confirmMusicSelection() {
  if (!selectedMusicOption) return;
  
  // 記錄答案
  answers.push({
    question: questions[currentQuestion].title,
    answer: selectedMusicOption.text
  });
  answerValues.push(selectedMusicOption.value); // 記錄 A, B, C 值
  
  // 停止音樂
  if (currentAudio) {
    audioPlayer.pause();
  }
  
  // 重置選擇狀態
  selectedMusicOption = null;
  
  // 進入下一題
  currentQuestion++;
  showQuestion();
}

// 顯示結果
function showResult() {
  questionContainer.classList.add('hidden');
  resultContainer.classList.remove('hidden');
  
  // 停止音樂
  if (currentAudio) {
    audioPlayer.pause();
  }
  
  // 生成選擇結果
  let resultHTML = '';
  answers.forEach((answer, index) => {
    resultHTML += `
      <div class="choice-item">
        <h3>${answer.question}</h3>
        <p>你的選擇：${answer.answer}</p>
      </div>
    `;
  });
  
  // 添加命名輸入區
  resultHTML += `
    <div class="perfume-naming">
      <h3>為你的香水命名</h3>
      <input type="text" id="perfume-name-input" placeholder="輸入香水名稱..." maxlength="30">
      <button id="generate-perfume-btn" class="generate-btn">生成配方卡</button>
    </div>
  `;
  
  // 添加配方卡容器（初始隱藏）
  resultHTML += '<div id="perfume-card-container" class="hidden"></div>';
  
  resultContent.innerHTML = resultHTML;
  
  // 添加事件監聽器
  document.getElementById('generate-perfume-btn').addEventListener('click', generatePerfumeCard);
}

// 重新開始
function restart() {
  currentQuestion = 0;
  answers = [];
  answerValues = [];
  currentAudio = null;
  selectedMusicOption = null; // 重置選擇狀態
  
  questionContainer.classList.add('hidden');
  resultContainer.classList.add('hidden');
  coverPage.classList.remove('hidden');
}

// 生成配方卡
function generatePerfumeCard() {
  const perfumeName = document.getElementById('perfume-name-input').value.trim();
  
  if (!perfumeName) {
    alert('請輸入香水名稱！');
    return;
  }
  
  // 計算香水配方
  try {
    const perfumeResult = getPerfumeFormula(answerValues);
    
    // 生成配方卡HTML
    const cardHTML = `
      <div id="perfume-card" class="perfume-card">
        <div class="card-header">
          <h2>${perfumeName}</h2>
          <p class="card-subtitle">專屬配方卡</p>
        </div>
        
        <div class="card-content">
          ${renderCardFormula(perfumeResult)}
        </div>
        
        <div class="card-footer">
          <p class="creation-date">創建於 ${new Date().toLocaleDateString('zh-TW')}</p>
          <p class="card-signature">21C@JC-JCISC</p>
        </div>
      </div>
      
      <div class="share-buttons">
        <button id="copy-link-btn" class="share-btn">
          <span class="icon">🔗</span> 複製連結
        </button>
        <button id="download-png-btn" class="share-btn">
          <span class="icon">📷</span> 下載圖片
        </button>
        <button id="share-fb-btn" class="share-btn">
          <span class="icon">📱</span> 分享到 Facebook
        </button>
      </div>
    `;
    
    // 顯示配方卡
    const cardContainer = document.getElementById('perfume-card-container');
    cardContainer.innerHTML = cardHTML;
    cardContainer.classList.remove('hidden');
    
    // 隱藏命名區域
    document.querySelector('.perfume-naming').style.display = 'none';
    
    // 綁定分享按鈕事件
    document.getElementById('copy-link-btn').addEventListener('click', copyLink);
    document.getElementById('download-png-btn').addEventListener('click', downloadPNG);
    document.getElementById('share-fb-btn').addEventListener('click', shareToFacebook);
    
    // 滾動到配方卡
    cardContainer.scrollIntoView({ behavior: 'smooth', block: 'center' });
    
  } catch (error) {
    console.error('配方生成錯誤:', error);
    alert('配方生成失敗，請重試！');
  }
}

// 渲染配方卡專用格式
function renderCardFormula(result) {
  const { notes, ratio, weights, total } = result;
  
  let html = '<div class="formula-grid">';
  
  // 前調
  html += `
    <div class="formula-card-section">
      <h4>前調 ${ratio.top}%</h4>
      <ul class="formula-card-list">
        ${notes.top.map(mat => 
          `<li><span class="material-name">${mat}</span><span class="material-weight">${weights[mat].toFixed(3)}g</span></li>`
        ).join('')}
      </ul>
    </div>
  `;
  
  // 中調
  html += `
    <div class="formula-card-section">
      <h4>中調 ${ratio.heart}%</h4>
      <ul class="formula-card-list">
        ${notes.heart.map(mat => 
          `<li><span class="material-name">${mat}</span><span class="material-weight">${weights[mat].toFixed(3)}g</span></li>`
        ).join('')}
      </ul>
    </div>
  `;
  
  // 後調
  html += `
    <div class="formula-card-section">
      <h4>後調 ${ratio.base}%</h4>
      <ul class="formula-card-list">
        ${notes.base.map(mat => 
          `<li><span class="material-name">${mat}</span><span class="material-weight">${weights[mat].toFixed(3)}g</span></li>`
        ).join('')}
      </ul>
    </div>
  `;
  
  html += '</div>';
  html += `<p class="formula-total-weight">總重量：${total} g</p>`;
  
  return html;
}

// 複製連結
function copyLink() {
  const perfumeName = document.getElementById('perfume-name-input').value.trim();
  const url = window.location.href;
  const shareText = `我創造了專屬香水「${perfumeName}」！來試試創造你的香水故事：${url}`;
  
  navigator.clipboard.writeText(shareText).then(() => {
    showToast('連結已複製！');
  }).catch(() => {
    // 降級方案
    const textArea = document.createElement('textarea');
    textArea.value = shareText;
    document.body.appendChild(textArea);
    textArea.select();
    document.execCommand('copy');
    document.body.removeChild(textArea);
    showToast('連結已複製！');
  });
}

// 下載PNG
async function downloadPNG() {
  const perfumeCard = document.getElementById('perfume-card');
  const perfumeName = document.getElementById('perfume-name-input').value.trim();
  
  try {
    showToast('正在生成圖片...');
    
    const canvas = await html2canvas(perfumeCard, {
      backgroundColor: '#1a1a2e',
      scale: 2,
      logging: false
    });
    
    // 轉換為圖片並下載
    canvas.toBlob((blob) => {
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.download = `${perfumeName}_配方卡.png`;
      link.href = url;
      link.click();
      URL.revokeObjectURL(url);
      showToast('圖片已下載！');
    });
  } catch (error) {
    console.error('截圖失敗:', error);
    showToast('圖片生成失敗，請重試！');
  }
}

// 分享到Facebook
function shareToFacebook() {
  const perfumeName = document.getElementById('perfume-name-input').value.trim();
  const url = encodeURIComponent(window.location.href);
  const text = encodeURIComponent(`我創造了專屬香水「${perfumeName}」！`);
  
  const fbShareUrl = `https://www.facebook.com/sharer/sharer.php?u=${url}&quote=${text}`;
  window.open(fbShareUrl, '_blank', 'width=600,height=400');
}

// 顯示提示訊息
function showToast(message) {
  // 移除現有的toast
  const existingToast = document.querySelector('.toast');
  if (existingToast) {
    existingToast.remove();
  }
  
  // 創建新的toast
  const toast = document.createElement('div');
  toast.className = 'toast';
  toast.textContent = message;
  document.body.appendChild(toast);
  
  // 顯示動畫
  setTimeout(() => toast.classList.add('show'), 10);
  
  // 3秒後隱藏
  setTimeout(() => {
    toast.classList.remove('show');
    setTimeout(() => toast.remove(), 300);
  }, 3000);
}
