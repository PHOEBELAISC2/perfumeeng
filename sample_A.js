/* psych-test-perfume.js（增強版：計算重量） */

export const QUESTIONS = [ /* …同上，略… */ ];

// ------- 香料對應表（同上，略） -------
const TOP_NOTE_MAP   = { /* … */ };
const HEART_NOTE_MAP = { /* … */ };
const BASE_NOTE_MAP  = { /* … */ };

// ------- 主工具函式 -------
export function getPerfumeFormula(answers, totalGrams = 4.5) {
  if (!Array.isArray(answers) || answers.length !== 3)
    throw new Error('❌ answers 應為長度 3 的字母陣列，例如 ["A","B","C"]');

  const [q1, q2, q3] = answers.map(a => a.toUpperCase());
  const notes = {
    top:   TOP_NOTE_MAP[q1]   ?? [],
    heart: HEART_NOTE_MAP[q2] ?? [],
    base:  BASE_NOTE_MAP[q3]  ?? []
  };
  const ratio = { top: 20, heart: 50, base: 30 };

  // ---- 計算每支香料重量 ----
  const weights = {};
  for (const noteType of ['top', 'heart', 'base']) {
    const groupWeight   = totalGrams * ratio[noteType] / 100;
    const materials     = notes[noteType];
    const eachBase      = +(groupWeight / materials.length).toFixed(3); // 小數 0.001 g
    let residual        = +(groupWeight - eachBase * materials.length).toFixed(3); // 補齊誤差

    materials.forEach((mat, idx) => {
      // 將因四捨五入產生的 0.001 g 誤差補到第一支香料
      weights[mat] = eachBase + (idx === 0 ? residual : 0);
    });
  }

  return { ratio, weights, total: totalGrams };
}

// ------- 渲染輸出字串 -------
export function renderPerfumeWeights(result) {
  const rows = Object.entries(result.weights)
                     .map(([mat, g]) => `• ${mat.padEnd(6, '　')}: ${g.toFixed(3)} g`)
                     .join('\n');
  return `
🌸 你的專屬香水配方（總重 ${result.total} g）
────────────────────────
${rows}
────────────────────────
  `.trim();
}

// ------- 範例（取消註解即可測試） -------
/*
const answers = ['A', 'C', 'B'];          // Q1=木門、Q2=照片、Q3=The Rope is Tied
const result  = getPerfumeFormula(answers);
console.log(renderPerfumeWeights(result));
*/
