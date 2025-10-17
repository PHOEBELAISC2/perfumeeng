/* psych-test-perfume.js
 * 迷宮・跳繩橋・天空之聲 ─ 三題故事心理測驗
 * 輸入〔answers〕為 3 個英文字母陣列，例如 ['A','C','B']
 * 回傳一支依指定香料調配的香水配方
 * 作者：ChatGPT（Traditional Chinese）
 */

// ---------- 題目與選項（可直接拿來做前端渲染） ----------
export const QUESTIONS = [
    {
      id: 1,
      text: '迷宮中的選擇：一場殘酷的捉迷藏即將開始，你選擇躲在哪裡？',
      options: {
        A: '一扇半掩的木門後',
        B: '一段濕冷的綠牆通道',
        C: '地下貯藏室'
      }
    },
    {
      id: 2,
      text: '跳繩橋上：繩索高速甩動，你站在橋邊，手上抱著唯一重要的東西，那是⋯⋯',
      options: {
        A: '一隻破布偶',
        B: '一本舊筆記本',
        C: '一張撕掉角的照片'
      }
    },
    {
      id: 3,
      text: '天空之聲：獨自站在決戰圓台，你聽見的，是⋯⋯',
      options: {
        A: 'Pink Soldiers',
        B: 'The Rope is Tied',
        C: 'Way Back Then'
      }
    }
  ];
  
  // ---------- 答案 → 香料對照表 ----------
  const TOP_NOTE_MAP = {       // Q1：前調（20 %）
    A: ['香檸檬', '桂花'],
    B: ['無花果', '白葡萄酒'],
    C: ['含羞草', '伯爵茶']
  };
  
  const HEART_NOTE_MAP = {     // Q2：中調（50 %）
    A: ['小蒼蘭', '金銀花'],
    B: ['橙花', '茉莉花'],
    C: ['天竺葵', '青草', '海洋']
  };
  
  const BASE_NOTE_MAP = {      // Q3：後調（30 %）
    A: ['檀香木', '白麝香'],
    B: ['零陵香豆', '香草'],
    C: ['禪茶', '麝香', '紅木']
  };
  
  // ---------- 主函式：由使用者答案產生配方 ----------
  export function getPerfumeFormula(answers /* string[] 長度=3 */) {
    if (!Array.isArray(answers) || answers.length !== 3) {
      throw new Error('❌ answers 應為長度 3 的字母陣列，例如 ["A","B","C"]');
    }
  
    const [q1, q2, q3] = answers.map(a => a.toUpperCase());
    const formula = {
      top:   TOP_NOTE_MAP[q1]   ?? [],
      heart: HEART_NOTE_MAP[q2] ?? [],
      base:  BASE_NOTE_MAP[q3]  ?? [],
      ratio: { top: 20, heart: 50, base: 30 }
    };
    return formula;
  }
  
  // ---------- 輸出字串，可直接 innerHTML 或 console.log ----------
  export function renderFormula(formula) {
    const { top, heart, base, ratio } = formula;
    return `
  ✨ 你的專屬香水配方 ✨
  ──────────────
  ▸ 前調（${ratio.top}%）：${top.join('、')}
  ▸ 中調（${ratio.heart}%）：${heart.join('、')}
  ▸ 後調（${ratio.base}%）：${base.join('、')}
  ──────────────
    `.trim();
  }
  
  // ---------- 範例 ----------
  /* 取消註解即可在瀏覽器 Console 測試
  const myAnswers = ['A', 'C', 'B'];
  const myPerfume = getPerfumeFormula(myAnswers);
  console.log(renderFormula(myPerfume));
  */
  