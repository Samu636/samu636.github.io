// ---- stato ----
const state = {
  p: 0.5,
  N: 5000,
  batch: 200,
  showCI: true,
  n: 0,
  s: 0,
  freqSeries: [],
  outcomes: [],
  rng: Math.random,
  running: false,
  raf: null,
};
function getRNG() {
  return Math.random;
}

// ---- canvas ----
function makeCtx(id) {
  const canvas = document.getElementById(id);
  const ctx = canvas.getContext('2d');
  const wrapper = { canvas, ctx, w: 0, h: 0, resize };

  function resize() {
    const dpr = window.devicePixelRatio || 1;
    const rect = canvas.getBoundingClientRect();
    const cssW = rect.width || canvas.clientWidth || 800; // fallback
    const cssH = rect.height || canvas.clientHeight || 320; // fallback
    canvas.width = Math.max(600, Math.floor(cssW * dpr));
    canvas.height = Math.max(200, Math.floor(cssH * dpr));
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    wrapper.w = cssW;
    wrapper.h = cssH;
  }

  resize();
  window.addEventListener('resize', resize);
  return wrapper;
}
let freqCtx;

// ---- utils draw ----
function clear(ctx, w, h) {
  ctx.clearRect(0, 0, w, h);
}
function grid(ctx, w, h) {
  ctx.save();
  ctx.strokeStyle = '#ddd';
  ctx.lineWidth = 1;
  for (let x = 40; x < w; x += 40) {
    ctx.beginPath();
    ctx.moveTo(x, 0);
    ctx.lineTo(x, h);
    ctx.stroke();
  }
  for (let y = 0; y < h; y += 40) {
    ctx.beginPath();
    ctx.moveTo(0, y);
    ctx.lineTo(w, y);
    ctx.stroke();
  }
  ctx.restore();
}

// ---- draw ----
function drawFreq() {
  const { ctx, w, h } = freqCtx;
  clear(ctx, w, h);
  grid(ctx, w, h);

  const padL = 40,
    padR = 10,
    padT = 14,
    padB = 28;
  const plotW = w - padL - padR;
  const plotH = h - padT - padB;

  // axes
  ctx.save();
  ctx.strokeStyle = '#4762a8';
  ctx.lineWidth = 1.2;
  ctx.beginPath();
  ctx.moveTo(padL, padT);
  ctx.lineTo(padL, padT + plotH);
  ctx.lineTo(padL + plotW, padT + plotH);
  ctx.stroke();
  ctx.fillStyle = '#666';
  ctx.font = '12px system-ui';
  ctx.fillText('0', padL - 16, padT + plotH + 14);
  ctx.restore();

  const N = Math.max(1, state.N);
  const xScale = (n) => padL + (n / N) * plotW;
  const yScale = (y) => padT + (1 - y) * plotH;

  // true p line
  const comp = getComputedStyle(document.documentElement);
  const accent2 = (comp.getPropertyValue('--accent-2') || '#7cf1b4').trim();
  const accent = (comp.getPropertyValue('--accent') || '#4ea3ff').trim();

  ctx.save();
  ctx.setLineDash([6, 6]);
  ctx.strokeStyle = accent2;
  ctx.lineWidth = 1.5;
  ctx.beginPath();
  ctx.moveTo(padL, yScale(state.p));
  ctx.lineTo(padL + plotW, yScale(state.p));
  ctx.stroke();
  ctx.setLineDash([]);
  ctx.restore();

  // 95% band
  if (state.showCI && state.n > 1) {
    ctx.save();
    ctx.fillStyle = 'rgba(255,107,107,0.15)';
    ctx.strokeStyle = 'rgba(255,107,107,0.5)';
    ctx.lineWidth = 1;
    ctx.beginPath();
    for (let i = 1; i <= state.n; i++) {
      const se = Math.sqrt((state.p * (1 - state.p)) / i);
      const lower = Math.max(0, state.p - 1.96 * se);
      const x = xScale(i);
      if (i === 1) ctx.moveTo(x, yScale(lower));
      else ctx.lineTo(x, yScale(lower));
    }
    for (let i = state.n; i >= 1; i--) {
      const se = Math.sqrt((state.p * (1 - state.p)) / i);
      const upper = Math.min(1, state.p + 1.96 * se);
      const x = xScale(i);
      ctx.lineTo(x, yScale(upper));
    }
    ctx.closePath();
    ctx.fill();
    ctx.stroke();
    ctx.restore();
  }

  // running frequency
  ctx.strokeStyle = accent;
  ctx.lineWidth = 2.0;
  ctx.beginPath();
  const maxIdx = Math.min(state.freqSeries.length, state.n);
  for (let i = 0; i < maxIdx; i++) {
    const n = i + 1;
    const x = xScale(n);
    const y = yScale(state.freqSeries[i]);
    if (i === 0) ctx.moveTo(x, y);
    else ctx.lineTo(x, y);
  }
  ctx.stroke();

  // labels & stats
  ctx.fillStyle = '#222';
  ctx.fillText('trials n →', padL + plotW - 70, padT + plotH + 18);
  ctx.save();
  ctx.translate(10, padT + plotH / 2);
  ctx.rotate(-Math.PI / 2);
  ctx.fillText('frequency of success', 0, 0);
  ctx.restore();

  const mean = state.n ? state.s / state.n : 0;
  const statN = document.getElementById('statN');
  const statM = document.getElementById('statMean');
  const statErr = document.getElementById('statErr');
  if (statN) statN.textContent = `n = ${state.n.toLocaleString()}`;
  if (statM) statM.textContent = `\u0305X_n = ${mean.toFixed(3)}`;
  if (statErr)
    statErr.textContent = `|error| = ${Math.abs(mean - state.p).toFixed(3)}`;
}
function drawAll() {
  drawFreq();
}

// ---- simulation ----
function stepOnce() {
  if (state.n >= state.N) return false;
  const u = state.rng();
  const x = u < state.p ? 1 : 0;
  state.n += 1;
  state.s += x;
  state.outcomes.push(x);
  state.freqSeries.push(state.s / state.n);
  return true;
}
function stepBatch(k) {
  let c = 0;
  for (let i = 0; i < k && state.n < state.N; i++) {
    stepOnce();
    c++;
  }
  return c;
}
function loop() {
  if (!state.running) return;
  stepBatch(state.batch);
  drawAll();
  if (state.n >= state.N) {
    state.running = false;
    updateStartStopLabel();
    return;
  }
  state.raf = requestAnimationFrame(loop);
}
function updateStartStopLabel() {
  const btn = document.getElementById('startStop');
  if (btn) btn.textContent = state.running ? 'Stop' : 'Start';
}
function reset() {
  const pEl = document.getElementById('p');
  const nEl = document.getElementById('n');
  const bEl = document.getElementById('batch');
  const ciEl = document.getElementById('ci');

  state.p = parseFloat(pEl?.value ?? '0.5') || 0.5;
  state.N = parseInt(nEl?.value ?? '1000', 10) || 1000;
  state.batch = parseInt(bEl?.value ?? '100', 10) || 100;
  state.showCI = !!ciEl?.checked;

  state.n = 0;
  state.s = 0;
  state.freqSeries = [];
  state.outcomes = [];
  state.rng = getRNG();
  state.running = false;
  cancelAnimationFrame(state.raf);
  updateStartStopLabel();
  drawAll();
}

// ---- wire up (script con defer, quindi DOM già pronto) ----
document.addEventListener('DOMContentLoaded', () => {
  freqCtx = makeCtx('freq');

  const p = document.getElementById('p');
  const pText = document.getElementById('pText');
  const n = document.getElementById('n');
  const batch = document.getElementById('batch');
  const ci = document.getElementById('ci');
  const start = document.getElementById('startStop');
  const resetBtn = document.getElementById('reset');

  function updateFromSlider() {
    const val = parseFloat(p.value);
    pText.value = val.toFixed(2);
    state.p = val;
    drawAll();
  }
  function updateFromText() {
    let v = parseFloat(pText.value);
    if (isNaN(v)) v = 0.5;
    v = Math.max(0, Math.min(1, v));
    pText.value = v.toFixed(2);
    p.value = v;
    state.p = v;
    drawAll();
  }

  p?.addEventListener('input', updateFromSlider);
  pText?.addEventListener('input', updateFromText);
  n?.addEventListener('change', () => {
    state.N = parseInt(n.value, 10) || state.N;
  });
  batch?.addEventListener('change', () => {
    state.batch = parseInt(batch.value, 10) || state.batch;
  });
  ci?.addEventListener('change', () => {
    state.showCI = ci.checked;
    drawAll();
  });

  start?.addEventListener('click', () => {
    state.running = !state.running;
    updateStartStopLabel();
    if (state.running) loop();
  });
  resetBtn?.addEventListener('click', reset);

  reset();
  window.addEventListener('load', () => freqCtx.resize()); // “secondo colpo”
});
