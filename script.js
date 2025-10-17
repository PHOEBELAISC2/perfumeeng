// ======================= QUESTION DATA (using pixel coordinates, assuming 768x768 images) =======================
const questions = [
  {
    id: 1,
    title: 'Question 1: The Maze Choice',
    text: 'A brutal game of hide-and-seek is about to begin. Where do you choose to hide?',
    image: 'Q1.png',
    width: 768,
    height: 768,
    type: 'clickable',
    options: [
      { id: 'door',    text: 'Behind a half-open wooden door', value: 'A', x: 150, y: 260, w: 140, h: 260 },
      { id: 'passage', text: 'In a damp, moss-covered passage', value: 'B', x: 480, y: 260, w: 130, h: 240 },
      { id: 'storage', text: 'Inside an underground storage room', value: 'C', x: 495, y: 555, w: 120, h: 140 }
    ]
  },
  {
    id: 2,
    title: 'Question 2: The Rope Bridge',
    text: 'The rope cracks through the air with a sharp hiss, and the bridge trembles beneath your feet.<br>You stand at the edge, clutching the one thing that matters most to you.',
    image: 'ChatGPT Image 2025年6月24日 下午01_56_43.png',
    width: 768,
    height: 768,
    type: 'clickable',
    options: [
      { id: 'doll',     text: 'A torn rag doll',                 value: 'A', x: 295, y: 680, w: 80, h: 85 },
      { id: 'notebook', text: 'An old notebook',                 value: 'B', x: 470, y: 700, w: 55, h: 55 },
      { id: 'photo',    text: 'A photo with a torn corner',      value: 'C', x: 422, y: 695, w: 33, h: 40 }
    ]
  },
  {
    id: 3,
    title: 'Question 3: The Voice of the Sky',
    text: 'You stand alone on a circular platform of destiny. The world falls silent—only a few melodies from the sky lightly pluck your heart.\n**Listen carefully and choose the sound you love.**\n**Let your chosen sound become the memory of this moment.**',
    image: 'ChatGPT Image 2025年6月24日 下午01_56_30.png',
    width: 768,
    height: 768,
    type: 'music',
    options: [
      { id: 'pink', text: 'Pink Soldiers',        audio: 'Pink Soldiers.mp3', value: 'A' },
      { id: 'rope', text: 'The Rope is Tied',     audio: 'The Rope is Tied  Squid Game OST.mp3', value: 'B' },
      { id: 'way',  text: 'Way Back Then',        audio: 'Way Back then.mp3', value: 'C' }
    ]
  }
];

// ======================= NOTE MAPS (baseline: Top 20 / Heart 50 / Base 30) =======================
const TOP_NOTE_MAP = {
  A: ['Bergamot', 'Osmanthus'],
  B: ['Lavender', 'White Wine'],
  C: ['Mimosa', 'Earl Grey Tea']
};
const HEART_NOTE_MAP = {
  A: ['Freesia', 'Honeysuckle'],
  B: ['Orange Blossom', 'Jasmine'],
  C: ['Geranium', 'Green Grass', 'Ocean']
};
const BASE_NOTE_MAP = {
  A: ['Sandalwood', 'White Musk'],
  B: ['Tonka Bean', 'Vanilla'],
  C: ['Oolong Tea', 'Musk']
};

// ======== ALL POSSIBLE MATERIALS (for name-based preferences; materials not present will be ignored) ========
const ALL_MATERIALS = Array.from(new Set(
  Object.values(TOP_NOTE_MAP).flat()
  .concat(Object.values(HEART_NOTE_MAP).flat())
  .concat(Object.values(BASE_NOTE_MAP).flat())
));

// ======================= Utilities: String Hash + Stable PRNG (Mulberry32) =======================
function hashString(str) {
  let h = 1779033703 ^ str.length;
  for (let i = 0; i < str.length; i++) {
    h = Math.imul(h ^ str.charCodeAt(i), 3432918353);
    h = (h << 13) | (h >>> 19);
  }
  return (h >>> 0);
}
function mulberry32(seed) {
  return function() {
    let t = seed += 0x6D2B79F5;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296; // [0,1)
  };
}
function randSigned01(rng){ return rng()*2 - 1; }
function randRange(rng, a, b){ return a + (b - a) * rng(); }

// ======================= Name-based adjustments (any name works) =======================
// 1) Group ratios: derive stable heart/base offsets (±5.0%), top is normalized remainder
function getNameAdjustments(perfumeName) {
  const seed = hashString(perfumeName.toLowerCase().trim());
  const rng = mulberry32(seed);

  // soften short/vowel-rich names (more lyrical names bias toward heart)
  const vowels = perfumeName.match(/[aeiouAEIOU]/g)?.length || 0;
  const softness = Math.min(1, vowels / Math.max(1, perfumeName.length)); // 0~1

  // heart in [-5, +5], base in [-5, +5]; add slight negative correlation
  const heartDelta = clamp1dp((randSigned01(rng) * 5.0) * (0.6 + 0.4*softness), -5.0, 5.0);
  const baseRaw    = randSigned01(rng) * 5.0;
  const baseDelta  = clamp1dp(baseRaw - heartDelta * 0.3, -5.0, 5.0);

  return { heartDelta, baseDelta };
}

// 2) In-group material weights: stable per-material preference from name (±5.0)
function getNameMaterialBias(perfumeName) {
  const seed = hashString('MAT@' + perfumeName.toLowerCase().trim());
  const rng = mulberry32(seed);

  // Letter-shape heuristics: round letters → floral/sweet; sharp letters → wood/tea/musk
  const roundLetters = (perfumeName.match(/[oaebcdfgh]/ig)?.length || 0) / Math.max(1, perfumeName.length);
  const sharpLetters = (perfumeName.match(/[ktvyxz]/ig)?.length || 0) / Math.max(1, perfumeName.length);

  const bias = {};
  ALL_MATERIALS.forEach(mat => {
    const base = clamp1dp(randSigned01(rng) * 5.0, -5.0, 5.0);
    let tweak = 0;
    // Floral/sweet: Jasmine, Freesia, Honeysuckle, Vanilla, White Wine, Bergamot, Fig (if present)
    if (['Jasmine','Freesia','Honeysuckle','Vanilla','White Wine','Bergamot','Fig'].includes(mat)) {
      tweak += roundLetters * 2.0; // up to +2.0
    }
    // Wood/tea/musk
    if (['Sandalwood','Oolong Tea','Musk','White Musk','Earl Grey Tea','Tonka Bean'].includes(mat)) {
      tweak += sharpLetters * 2.0; // up to +2.0
    }
    // Fresh/clean: Ocean, Green Grass
    if (['Ocean','Green Grass'].includes(mat)) {
      tweak += (roundLetters * 0.5 - sharpLetters * 0.3);
    }
    bias[mat] = clamp1dp(base + tweak, -5.0, 5.0);
  });

  return bias;
}

// ======================= Answer-driven: group ratio tweaks (within ±5%) =======================
function getAnswerGroupAdjustments(answerValues) {
  const delta = { top: 0, heart: 0, base: 0 };
  const q1 = (answerValues[0] || '').toUpperCase();
  if (q1 === 'A') { delta.top += 5; }
  else if (q1 === 'B') { delta.heart += 3; delta.base += 2; }
  else if (q1 === 'C') { delta.base += 5; }

  const q2 = (answerValues[1] || '').toUpperCase();
  if (q2 === 'A') { delta.heart += 5; }
  else if (q2 === 'B') { delta.top += 2; delta.heart += 3; }
  else if (q2 === 'C') { delta.base += 3; delta.heart += 2; }

  const q3 = (answerValues[2] || '').toUpperCase();
  if (q3 === 'A') { delta.top += 3; }
  else if (q3 === 'B') { delta.base += 5; }
  else if (q3 === 'C') { delta.base += 3; delta.heart += 2; }

  return delta;
}

// ======================= Answer-driven: in-group material bias (±5% each) =======================
function getAnswerMaterialBias(answerValues) {
  const bias = {};
  const add = (m, d) => { bias[m] = clamp1dp((bias[m] || 0) + d, -5.0, 5.0); };

  const q1 = (answerValues[0] || '').toUpperCase();
  if (q1 === 'A') { add('Bergamot', 3.0); add('Osmanthus', 2.0); }
  if (q1 === 'B') { add('Fig', 3.0); add('White Wine', 2.0); }
  if (q1 === 'C') { add('Mimosa', 3.0); add('Earl Grey Tea', 2.0); }

  const q2 = (answerValues[1] || '').toUpperCase();
  if (q2 === 'A') { add('Freesia', 3.0); add('Honeysuckle', 2.0); }
  if (q2 === 'B') { add('Orange Blossom', 3.0); add('Jasmine', 2.0); }
  if (q2 === 'C') { add('Geranium', 3.0); add('Green Grass', 2.0); }

  const q3 = (answerValues[2] || '').toUpperCase();
  if (q3 === 'A') { add('White Musk', 3.0); add('Sandalwood', 2.0); }
  if (q3 === 'B') { add('Vanilla', 3.0); add('Tonka Bean', 2.0); }
  if (q3 === 'C') { add('Musk', 3.0); add('Oolong Tea', 2.0); }

  return bias;
}

// ======================= Utility: clamp 1dp & normalization =======================
function clamp1dp(v, min, max) {
  const r = Math.max(min, Math.min(max, v));
  return Math.round(r * 10) / 10;
}

function normalizeRatiosTo1dp(r) {
  const sumRaw = r.top + r.heart + r.base;
  let rt = {
    top:   (r.top   / sumRaw) * 100,
    heart: (r.heart / sumRaw) * 100,
    base:  (r.base  / sumRaw) * 100,
  };
  rt.top   = Math.round(rt.top   * 10) / 10;
  rt.heart = Math.round(rt.heart * 10) / 10;
  rt.base  = Math.round(rt.base  * 10) / 10;

  const sum1dp = +(rt.top + rt.heart + rt.base).toFixed(1);
  const diff = +(100.0 - sum1dp).toFixed(1);
  if (diff !== 0) {
    const entries = [['top', rt.top], ['heart', rt.heart], ['base', rt.base]].sort((a,b)=>b[1]-a[1]);
    rt[entries[0][0]] = +(entries[0][1] + diff).toFixed(1);
  }
  return rt;
}

function normalizeMaterialDistTo1dp(obj) {
  const mats = Object.keys(obj);
  if (mats.length === 0) return obj;
  const sumRaw = mats.reduce((s, k) => s + obj[k], 0);
  let dist = {};
  mats.forEach(k => { dist[k] = sumRaw > 0 ? (obj[k] / sumRaw) * 100 : 100 / mats.length; });
  mats.forEach(k => { dist[k] = Math.round(dist[k] * 10) / 10; });
  let sum1dp = +(mats.reduce((s, k) => s + dist[k], 0)).toFixed(1);
  let diff = +(100.0 - sum1dp).toFixed(1);
  if (diff !== 0) {
    const maxKey = mats.slice().sort((a,b)=>dist[b]-dist[a])[0];
    dist[maxKey] = +(dist[maxKey] + diff).toFixed(1);
  }
  return dist;
}

function buildGroupMaterialDistribution(materials, answerMatBias, nameMatBias) {
  if (!materials || materials.length === 0) return {};
  const baseEach = +(100 / materials.length).toFixed(1);
  let raw = {};
  materials.forEach(m => raw[m] = baseEach);

  const add = (m, d) => { raw[m] = clamp1dp((raw[m] ?? baseEach) + d, 0, 100); };
  materials.forEach(m => {
    if (answerMatBias[m]) add(m, clamp1dp(answerMatBias[m], -5.0, 5.0));
    if (nameMatBias[m])   add(m, clamp1dp(nameMatBias[m],   -5.0, 5.0));
  });

  return normalizeMaterialDistTo1dp(raw);
}

// ======================= Perfume formula calculation (grams, total fixed at 6 g) =======================
function getPerfumeFormula(answerValues, totalG = 6, ratioOverride = null, perfumeNameForMaterials = '') {
  if (!Array.isArray(answerValues) || answerValues.length !== 3) {
    throw new Error('❌ Answers should be an array of length 3 (A/B/C).');
  }

  const [q1, q2, q3] = answerValues.map(a => a.toUpperCase());
  const notes = {
    top:   TOP_NOTE_MAP[q1]   || [],
    heart: HEART_NOTE_MAP[q2] || [],
    base:  BASE_NOTE_MAP[q3]  || []
  };

  // 1) Group ratio: baseline 20/50/30 → name ±5% → answers ±5% → normalize (1dp)
  const nameAdj = getNameAdjustments(perfumeNameForMaterials);
  let ratio = ratioOverride || { top: 20, heart: 50 + nameAdj.heartDelta, base: 30 + nameAdj.baseDelta };
  ratio = normalizeRatiosTo1dp(ratio);

  const ansGrp = getAnswerGroupAdjustments(answerValues);
  ratio = normalizeRatiosTo1dp({
    top:   ratio.top   + ansGrp.top,
    heart: ratio.heart + ansGrp.heart,
    base:  ratio.base  + ansGrp.base
  });

  // 2) In-group material distribution: even → answer bias ±5 → name bias ±5 → normalize 1dp
  const ansMatBias  = getAnswerMaterialBias(answerValues);
  const nameMatBias = getNameMaterialBias(perfumeNameForMaterials);
  const distTop   = buildGroupMaterialDistribution(notes.top,   ansMatBias, nameMatBias);
  const distHeart = buildGroupMaterialDistribution(notes.heart, ansMatBias, nameMatBias);
  const distBase  = buildGroupMaterialDistribution(notes.base,  ansMatBias, nameMatBias);

  // 3) Convert to grams (materials rounded to 0.1 g)
  const groupG = {
    top:   +(totalG * ratio.top   / 100).toFixed(3),
    heart: +(totalG * ratio.heart / 100).toFixed(3),
    base:  +(totalG * ratio.base  / 100).toFixed(3),
  };
  const weights = {};
  const assign = (dist, key) => {
    Object.entries(dist).forEach(([mat, pct]) => {
      const g = +(groupG[key] * (pct / 100)).toFixed(1); // 0.1 g
      weights[mat] = g;
    });
  };
  assign(distTop, 'top');
  assign(distHeart, 'heart');
  assign(distBase, 'base');

  return { notes, ratio, weights, total: totalG, unit: 'g' };
}

// ======================= General formula rendering (no in-group %, materials to 0.1 g) =======================
function renderPerfumeFormula(result) {
  const { notes, ratio, weights, total, unit } = result;
  const listHtml = (arr) => arr.map(mat => `<li>${mat}: ${(weights[mat] ?? 0).toFixed(1)} ${unit}</li>`).join('');
  return `
    <div class="perfume-formula">
      <h3>✨ Your Personalized Perfume Formula ✨</h3>
      <p class="formula-total">Total: ${total} ${unit}</p>
      <div class="formula-section">
        <h4>▸ Top Notes (${ratio.top.toFixed(1)}%)</h4>
        <ul class="formula-list">${listHtml(notes.top)}</ul>
      </div>
      <div class="formula-section">
        <h4>▸ Heart Notes (${ratio.heart.toFixed(1)}%)</h4>
        <ul class="formula-list">${listHtml(notes.heart)}</ul>
      </div>
      <div class="formula-section">
        <h4>▸ Base Notes (${ratio.base.toFixed(1)}%)</h4>
        <ul class="formula-list">${listHtml(notes.base)}</ul>
      </div>
    </div>
  `;
}

// ======================= Card rendering (no in-group %, materials to 0.1 g; no explanations) =======================
function renderCardFormula(result) {
  const { notes, ratio, weights, total, unit } = result;
  const mkList = (arr) => arr.map(mat =>
    `<li><span class="material-name">${mat}</span><span class="material-weight">${(weights[mat] ?? 0).toFixed(1)}${unit}</span></li>`
  ).join('');
  let html = '<div class="formula-grid">';
  html += `
    <div class="formula-card-section">
      <h4>Top ${ratio.top.toFixed(1)}%</h4>
      <ul class="formula-card-list">${mkList(notes.top)}</ul>
    </div>
  `;
  html += `
    <div class="formula-card-section">
      <h4>Heart ${ratio.heart.toFixed(1)}%</h4>
      <ul class="formula-card-list">${mkList(notes.heart)}</ul>
    </div>
  `;
  html += `
    <div class="formula-card-section">
      <h4>Base ${ratio.base.toFixed(1)}%</h4>
      <ul class="formula-card-list">${mkList(notes.base)}</ul>
    </div>
  `;
  html += '</div>';
  html += `<p class="formula-total-weight">Total: ${total} ${unit}</p>`;
  return html;
}

// ======================= State & DOM =======================
let currentQuestion = 0;
let answers = [];
let answerValues = []; // store A, B, C
let currentAudio = null;
let selectedMusicOption = null;

const coverPage         = document.getElementById('cover-page');
const questionContainer = document.getElementById('question-container');
const resultContainer   = document.getElementById('result-container');
const questionTitle     = document.getElementById('question-title');
const questionText      = document.getElementById('question-text');
const scene             = document.getElementById('scene');
const musicPlayer       = document.getElementById('music-player');
const audioPlayer       = document.getElementById('audio-player');
const resultContent     = document.getElementById('result-content');
const restartBtn        = document.getElementById('restart-btn');

// ======================= Cover page =======================
function startGame() {
  coverPage.classList.add('hidden');
  questionContainer.classList.remove('hidden');
  showQuestion();
}

// ======================= Init =======================
document.addEventListener('DOMContentLoaded', () => {
  coverPage.addEventListener('click', startGame);
  restartBtn.addEventListener('click', restart);
});

// ======================= Show question =======================
function showQuestion() {
  if (currentQuestion >= questions.length) {
    showResult();
    return;
  }

  const question = questions[currentQuestion];
  questionTitle.textContent = question.title;
  const formattedText = question.text.replace(/\n/g, '<br>').replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');
  questionText.innerHTML = formattedText;

  scene.innerHTML = '';
  musicPlayer.classList.add('hidden');

  if (currentAudio) {
    audioPlayer.pause();
    currentAudio = null;
  }

  if (question.type === 'clickable') {
    createSVGScene(question);
  } else if (question.type === 'music') {
    createMusicOptions(question);
  }
}

// ======================= Create SVG scene =======================
function createSVGScene(question) {
  const svgNS = 'http://www.w3.org/2000/svg';
  const svg = document.createElementNS(svgNS, 'svg');
  svg.setAttribute('viewBox', `0 0 ${question.width} ${question.height}`);
  svg.setAttribute('preserveAspectRatio', 'xMidYMid meet');
  svg.classList.add('scene-svg');

  const imgEl = document.createElementNS(svgNS, 'image');
  imgEl.setAttributeNS('http://www.w3.org/1999/xlink', 'href', question.image);
  imgEl.setAttribute('width', question.width);
  imgEl.setAttribute('height', question.height);
  svg.appendChild(imgEl);

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

  if (question.id === 2) {
    const instructionText = document.createElementNS(svgNS, 'text');
    instructionText.setAttribute('x', '384');
    instructionText.setAttribute('y', '650');
    instructionText.setAttribute('text-anchor', 'middle');
    instructionText.setAttribute('font-family', '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif');
    instructionText.setAttribute('font-size', '20');
    instructionText.setAttribute('font-weight', 'bold');
    instructionText.setAttribute('fill', 'white');
    instructionText.textContent = 'Choose the treasure you cannot let go of.';
    svg.appendChild(instructionText);
  }

  scene.appendChild(svg);
}

// ======================= Create music options =======================
function createMusicOptions(question) {
  const svgNS = 'http://www.w3.org/2000/svg';
  const svg = document.createElementNS(svgNS, 'svg');
  svg.setAttribute('viewBox', `0 0 ${question.width} ${question.height}`);
  svg.setAttribute('preserveAspectRatio', 'xMidYMid meet');
  svg.classList.add('scene-svg');

  const imgEl = document.createElementNS(svgNS, 'image');
  imgEl.setAttributeNS('http://www.w3.org/1999/xlink', 'href', question.image);
  imgEl.setAttribute('width', question.width);
  imgEl.setAttribute('height', question.height);
  svg.appendChild(imgEl);

  scene.appendChild(svg);

  const instructionText = document.createElement('div');
  instructionText.className = 'instruction-text';
  instructionText.textContent = 'Available tracks — listen one by one:';
  scene.appendChild(instructionText);

  const musicSelection = document.createElement('div');
  musicSelection.className = 'music-selection';

  question.options.forEach(option => {
    const button = document.createElement('button');
    button.className = 'music-button';
    button.textContent = option.text;
    button.addEventListener('click', (ev) => handleMusicChoice(option, ev.target));
    musicSelection.appendChild(button);
  });

  const confirmButton = document.createElement('button');
  confirmButton.className = 'confirm-button';
  confirmButton.textContent = 'Confirm Selection';
  confirmButton.disabled = true;
  confirmButton.addEventListener('click', confirmMusicSelection);

  scene.appendChild(musicSelection);
  scene.appendChild(confirmButton);

  setTimeout(() => {
    confirmButton.scrollIntoView({ block: 'end', behavior: 'smooth' });
  }, 100);
}

// ======================= Handle answers =======================
function handleAnswer(option) {
  const clickedArea = document.querySelector(`[data-option="${option.id}"]`);
  if (clickedArea) clickedArea.classList.add('clicked');

  answers.push({ question: questions[currentQuestion].title, answer: option.text });
  answerValues.push(option.value);

  setTimeout(() => {
    currentQuestion++;
    showQuestion();
  }, 500);
}

// ======================= Handle music choice =======================
function handleMusicChoice(option, btnEl) {
  if (currentAudio) {
    audioPlayer.pause();
    document.querySelectorAll('.music-button').forEach(btn => btn.classList.remove('playing', 'selected'));
  }
  audioPlayer.src = option.audio;
  btnEl.classList.add('playing', 'selected');
  audioPlayer.play();
  currentAudio = option.audio;
  selectedMusicOption = option;

  const confirmButton = document.querySelector('.confirm-button');
  if (confirmButton) confirmButton.disabled = false;
}

function confirmMusicSelection() {
  if (!selectedMusicOption) return;
  answers.push({ question: questions[currentQuestion].title, answer: selectedMusicOption.text });
  answerValues.push(selectedMusicOption.value);
  if (currentAudio) audioPlayer.pause();
  selectedMusicOption = null;
  currentQuestion++;
  showQuestion();
}

// ======================= Show result =======================
function showResult() {
  questionContainer.classList.add('hidden');
  resultContainer.classList.remove('hidden');

  if (currentAudio) audioPlayer.pause();

  let resultHTML = '';
  answers.forEach((answer) => {
    resultHTML += `
      <div class="choice-item">
        <h3>${answer.question}</h3>
        <p>Your choice: ${answer.answer}</p>
      </div>
    `;
  });

  resultHTML += `
    <div class="perfume-naming">
      <h3>Name Your Perfume</h3>
      <input type="text" id="perfume-name-input" placeholder="Enter perfume name..." maxlength="30">
      <button id="generate-perfume-btn" class="generate-btn">Generate Formula Card</button>
    </div>
  `;

  resultHTML += '<div id="perfume-card-container" class="hidden"></div>';
  resultContent.innerHTML = resultHTML;

  document.getElementById('generate-perfume-btn').addEventListener('click', generatePerfumeCard);
}

// ======================= Restart =======================
function restart() {
  currentQuestion = 0;
  answers = [];
  answerValues = [];
  currentAudio = null;
  selectedMusicOption = null;

  questionContainer.classList.add('hidden');
  resultContainer.classList.add('hidden');
  coverPage.classList.remove('hidden');
}

// ======================= Generate card (based on answers + name-driven variation) =======================
function generatePerfumeCard() {
  const perfumeName = document.getElementById('perfume-name-input').value.trim();
  if (!perfumeName) { alert('Please enter a perfume name!'); return; }

  try {
    // Name preferences are handled directly inside getPerfumeFormula (group + material)
    const perfumeResult = getPerfumeFormula(answerValues, 6, null, perfumeName);

    const cardHTML = `
      <div id="perfume-card" class="perfume-card">
        <div class="card-header">
          <h2>${perfumeName}</h2>
          <p class="card-subtitle">Personal Formula Card</p>
        </div>
        <div class="card-content">
          ${renderCardFormula(perfumeResult)}
        </div>
        <div class="card-footer">
          <p class="creation-date">Created on ${new Date().toLocaleDateString('en-US')}</p>
          <p class="card-signature">21C@JC-JCISC</p>
        </div>
      </div>

      <div class="share-buttons">
        <button id="copy-link-btn" class="share-btn"><span class="icon">🔗</span> Copy Link</button>
        <button id="download-png-btn" class="share-btn"><span class="icon">📷</span> Download PNG</button>
        <button id="share-fb-btn" class="share-btn"><span class="icon">📱</span> Share to Facebook</button>
      </div>
    `;

    const cardContainer = document.getElementById('perfume-card-container');
    cardContainer.innerHTML = cardHTML;
    cardContainer.classList.remove('hidden');

    document.querySelector('.perfume-naming').style.display = 'none';

    document.getElementById('copy-link-btn').addEventListener('click', copyLink);
    document.getElementById('download-png-btn').addEventListener('click', downloadPNG);
    document.getElementById('share-fb-btn').addEventListener('click', shareToFacebook);

    cardContainer.scrollIntoView({ behavior: 'smooth', block: 'center' });
  } catch (error) {
    console.error('Formula generation error:', error);
    alert('Failed to generate the formula. Please try again!');
  }
}

// ======================= Share / Download =======================
function copyLink() {
  const perfumeName = document.getElementById('perfume-name-input').value.trim();
  const url = window.location.href;
  const shareText = `I created my personalized perfume \"${perfumeName}\"! Try creating your own story: ${url}`;

  navigator.clipboard.writeText(shareText).then(() => {
    showToast('Link copied!');
  }).catch(() => {
    const textArea = document.createElement('textarea');
    textArea.value = shareText;
    document.body.appendChild(textArea);
    textArea.select();
    document.execCommand('copy');
    document.body.removeChild(textArea);
    showToast('Link copied!');
  });
}

async function downloadPNG() {
  const perfumeCard = document.getElementById('perfume-card');
  const perfumeName = document.getElementById('perfume-name-input').value.trim();

  try {
    showToast('Generating image...');
    const canvas = await html2canvas(perfumeCard, { backgroundColor: '#1a1a2e', scale: 2, logging: false });
    canvas.toBlob((blob) => {
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.download = `${perfumeName}_FormulaCard.png`;
      link.href = url;
      link.click();
      URL.revokeObjectURL(url);
      showToast('Image downloaded!');
    });
  } catch (error) {
    console.error('Screenshot failed:', error);
    showToast('Failed to generate image. Please try again.');
  }
}

function shareToFacebook() {
  const perfumeName = document.getElementById('perfume-name-input').value.trim();
  const url = encodeURIComponent(window.location.href);
  const text = encodeURIComponent(`I created my personalized perfume \"${perfumeName}\"!`);
  const fbShareUrl = `https://www.facebook.com/sharer/sharer.php?u=${url}&quote=${text}`;
  window.open(fbShareUrl, '_blank', 'width=600,height=400');
}

// ======================= Toast =======================
function showToast(message) {
  const existingToast = document.querySelector('.toast');
  if (existingToast) existingToast.remove();
  const toast = document.createElement('div');
  toast.className = 'toast';
  toast.textContent = message;
  document.body.appendChild(toast);
  setTimeout(() => toast.classList.add('show'), 10);
  setTimeout(() => {
    toast.classList.remove('show');
    setTimeout(() => toast.remove(), 300);
  }, 3000);
}
