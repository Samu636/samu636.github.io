document.addEventListener('DOMContentLoaded', () => {
  const lambdaInput = document.getElementById('lambda');
  const TInput = document.getElementById('T');
  const nInput = document.getElementById('n');
  const runsInput = document.getElementById('runs');
  const simulateBtn = document.getElementById('simulate');
  const resetBtn = document.getElementById('reset');

  const theorySpan = document.getElementById('theory');
  const empMeanSpan = document.getElementById('emp-mean');
  const empVarSpan = document.getElementById('emp-var');

  const histCtx = document.getElementById('hist').getContext('2d');
  const pathsCtx = document.getElementById('paths').getContext('2d');
  let histChart = null;
  let pathsChart = null;

  function poissonPmf(k, mu) {
    // P(N=k) = e^{-mu} mu^k / k!
    let logP = -mu + k * Math.log(mu) - logFactorial(k);
    return Math.exp(logP);
  }
  function logFactorial(k) {
    // simple Stirling for large k; exact product for small k
    if (k < 50) {
      let s = 0;
      for (let i = 2; i <= k; i++) s += Math.log(i);
      return s;
    }
    const x = k + 1;
    return (x - 0.5) * Math.log(x) - x + 0.5 * Math.log(2 * Math.PI); // Stirling
  }

  function simulateOnePath(lambda, T, n) {
    const dt = T / n;
    const p = lambda * dt; // λΔt
    let Nt = 0;
    const times = [0];
    const values = [0];

    for (let i = 1; i <= n; i++) {
      if (Math.random() < p) Nt += 1; // Bernoulli(λΔt)
      times.push(i * dt);
      values.push(Nt);
    }
    return { times, values, count: Nt };
  }

  function simulateMany(lambda, T, n, runs) {
    const counts = [];
    const samplePaths = [];
    const nPaths = Math.min(8, runs);

    for (let r = 0; r < runs; r++) {
      const path = simulateOnePath(lambda, T, n);
      counts.push(path.count);
      if (r < nPaths) samplePaths.push(path);
    }
    return { counts, samplePaths };
  }

  function renderHistogram(counts, mu) {
    const maxK = Math.max(...counts, Math.ceil(mu + 5 * Math.sqrt(mu)));
    const minK = 0;
    const bins = new Array(maxK - minK + 1).fill(0);

    for (const c of counts) bins[c - minK]++;

    const labels = [];
    const emp = [];
    const theo = [];
    const total = counts.length;

    for (let k = minK; k <= maxK; k++) {
      labels.push(String(k));
      emp.push(bins[k - minK] / total);
      theo.push(poissonPmf(k, mu));
    }

    const data = {
      labels,
      datasets: [
        { type: 'bar', label: 'Empirical', data: emp, borderWidth: 1 },
        {
          type: 'line',
          label: 'Poisson(μ)',
          data: theo,
          borderWidth: 2,
          pointRadius: 0,
          tension: 0.2,
        },
      ],
    };
    const options = {
      responsive: true,
      scales: {
        y: { beginAtZero: true, title: { display: true, text: 'Probability' } },
        x: { title: { display: true, text: 'Count N(T)' } },
      },
      plugins: { tooltip: { mode: 'index', intersect: false } },
    };

    if (histChart) {
      histChart.data = data;
      histChart.options = options;
      histChart.update();
    } else {
      histChart = new Chart(histCtx, { data, options });
    }
  }

  function renderPaths(samplePaths) {
    const datasets = samplePaths.map((p, i) => ({
      label: `Path ${i + 1}`,
      data: p.times.map((t, idx) => ({ x: t, y: p.values[idx] })),
      borderWidth: 2,
      fill: false,
      stepped: true,
      pointRadius: 0,
    }));

    const data = { datasets };
    const options = {
      responsive: true,
      parsing: false,
      scales: {
        x: { type: 'linear', title: { display: true, text: 't' } },
        y: { title: { display: true, text: 'N(t)' }, beginAtZero: true },
      },
      plugins: { legend: { display: false } },
    };

    if (pathsChart) {
      pathsChart.data = data;
      pathsChart.options = options;
      pathsChart.update();
    } else {
      pathsChart = new Chart(pathsCtx, { type: 'line', data, options });
    }
  }

  function mean(arr) {
    return arr.reduce((a, b) => a + b, 0) / arr.length;
  }
  function variance(arr) {
    const m = mean(arr);
    return arr.reduce((s, x) => s + (x - m) * (x - m), 0) / (arr.length - 1);
  }

  function updateTheory(lambda, T) {
    const mu = lambda * T;
    theorySpan.textContent = `λT = ${mu.toFixed(3)}`;
    return mu;
  }

  function run() {
    const lambda = Number(lambdaInput.value);
    const T = Number(TInput.value);
    const n = Number(nInput.value);
    const runs = Number(runsInput.value);

    const mu = updateTheory(lambda, T);
    const { counts, samplePaths } = simulateMany(lambda, T, n, runs);

    const empMean = mean(counts);
    const empVar = variance(counts);

    empMeanSpan.textContent = empMean.toFixed(3);
    empVarSpan.textContent = empVar.toFixed(3);

    renderHistogram(counts, mu);
    renderPaths(samplePaths);
  }

  function reset() {
    if (histChart) {
      histChart.destroy();
      histChart = null;
    }
    if (pathsChart) {
      pathsChart.destroy();
      pathsChart = null;
    }
    empMeanSpan.textContent = '—';
    empVarSpan.textContent = '—';
  }

  simulateBtn.addEventListener('click', run);
  resetBtn.addEventListener('click', reset);

  // Enter-to-run
  [lambdaInput, TInput, nInput, runsInput].forEach((el) => {
    el.addEventListener('keydown', (e) => {
      if (e.key === 'Enter') {
        e.preventDefault();
        run();
      }
    });
  });

  // Initial theory display
  updateTheory(Number(lambdaInput.value), Number(TInput.value));
});
