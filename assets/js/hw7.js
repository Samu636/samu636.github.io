document.addEventListener('DOMContentLoaded', () => {
  // DOM refs
  const nInput = document.getElementById('n-weeks');
  const mInput = document.getElementById('m-attackers');
  const pInput = document.getElementById('p-breach');
  const runsInput = document.getElementById('runs');
  const qSafeSpan = document.getElementById('q-safe');
  const qBreachSpan = document.getElementById('q-breach');
  const runBtn = document.getElementById('run-sim');
  const resetBtn = document.getElementById('reset-sim');

  // Charts
  const histCtx = document.getElementById('hist-chart').getContext('2d');
  const trajCtx = document.getElementById('traj-chart').getContext('2d');

  let histChart = null;
  let trajChart = null;

  // Utility: safe probability q = (1 - p)^m
  function calcQ(p, m) {
    return Math.pow(1 - p, m);
  }

  // coefficiente binomiale "n choose k"
  function comb(n, k) {
    if (k < 0 || k > n) return 0;
    if (k === 0 || k === n) return 1;
    // evito large factorials by computing iteratively
    let res = 1;
    for (let i = 1; i <= k; i++) {
      res = (res * (n - (k - i))) / i;
    }
    return res;
  }

  // Theoretical PMF for K ~ Bin(n, q), mapped to score S = 2K - n
  function theoreticalScorePMF(n, q) {
    const probs = new Array(n + 1);
    for (let k = 0; k <= n; k++) {
      // P(K=k)
      const pk = comb(n, k) * Math.pow(q, k) * Math.pow(1 - q, n - k);
      probs[k] = pk;
    }
    return probs; // index k corresponds to score s = 2k - n
  }

  // Simulo la traiettoria di un singolo gioco di n settimane
  function simulateTrajectory(n, q) {
    const path = new Array(n + 1);
    let cum = 0;
    path[0] = 0;
    for (let t = 1; t <= n; t++) {
      const safe = Math.random() < q; // +1 if safe, -1 otherwise (richiesta prof)
      cum += safe ? +1 : -1;
      path[t] = cum;
    }
    return path;
  }

  // Run many simulations: return histogram over k = #safe (0..n)
  function simulateHistogram(n, q, runs) {
    const countsK = new Array(n + 1).fill(0);
    for (let r = 0; r < runs; r++) {
      // Count number of safe weeks
      // Safe per week is Bernoulli(q), repeat n times.
      let k = 0;
      for (let t = 0; t < n; t++) {
        if (Math.random() < q) k++;
      }
      countsK[k]++;
    }
    return countsK; // index k corresponds to score s = 2k - n
  }

  // Create / update histogram chart
  function renderHist(n, countsK, pmfK, runs) {
    const labels = [];
    const empProb = [];
    const thProb = [];

    for (let k = 0; k <= n; k++) {
      const s = 2 * k - n; // score
      labels.push(String(s));
      empProb.push(countsK[k] / runs);
      thProb.push(pmfK[k]);
    }

    const data = {
      labels,
      datasets: [
        {
          type: 'bar',
          label: 'Empirical (simulation)',
          data: empProb,
          borderWidth: 1,
        },
        {
          type: 'line',
          label: 'Theoretical Binomial',
          data: thProb,
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
        x: { title: { display: true, text: 'Final score S = 2K - n' } },
      },
      plugins: {
        tooltip: { mode: 'index', intersect: false },
      },
    };

    if (histChart) {
      histChart.data = data;
      histChart.options = options;
      histChart.update();
    } else {
      histChart = new Chart(histCtx, { data, options });
    }
  }

  // plot multiple trajectories
  function renderTrajectories(n, q, nTraj = 10) {
    const labels = Array.from({ length: n + 1 }, (_, i) => i); // week index 0..n
    const datasets = [];

    for (let i = 0; i < nTraj; i++) {
      const path = simulateTrajectory(n, q);
      datasets.push({
        label: `Path ${i + 1}`,
        data: path,
        borderWidth: 2,
        fill: false,
        pointRadius: 0,
      });
    }

    const data = { labels, datasets };
    const options = {
      responsive: true,
      scales: {
        x: { title: { display: true, text: 'Week' } },
        y: { title: { display: true, text: 'Cumulative score' } },
      },
      plugins: { legend: { display: false } },
    };

    if (trajChart) {
      trajChart.data = data;
      trajChart.options = options;
      trajChart.update();
    } else {
      trajChart = new Chart(trajCtx, { type: 'line', data, options });
    }
  }

  // update q
  function updateQDisplay() {
    const n = Number(nInput.value);
    const m = Number(mInput.value);
    const p = Number(pInput.value);
    const q = calcQ(p, m);
    qSafeSpan.textContent = q.toFixed(6);
    qBreachSpan.textContent = (1 - q).toFixed(6);
    return { n, m, p, q };
  }

  // run sim
  function runSimulation() {
    const { n, q } = updateQDisplay();
    const runs = Number(runsInput.value);

    // Histogram simulation over final scores via counts over K
    const countsK = simulateHistogram(n, q, runs);

    // Theoretical PMF over K
    const pmfK = theoreticalScorePMF(n, q);

    // Render charts
    renderHist(n, countsK, pmfK, runs);
    renderTrajectories(n, q, Math.min(10, runs)); // show up to 10 trajectories
  }

  // Reset
  function resetAll() {
    if (histChart) {
      histChart.destroy();
      histChart = null;
    }
    if (trajChart) {
      trajChart.destroy();
      trajChart = null;
    }
  }

  // Wire up
  runBtn.addEventListener('click', runSimulation);
  resetBtn.addEventListener('click', resetAll);

  // Live update q when inputs change
  [nInput, mInput, pInput, runsInput].forEach((el) => {
    el.addEventListener('input', updateQDisplay);
    el.addEventListener('keydown', (e) => {
      if (e.key === 'Enter') {
        e.preventDefault();
        runSimulation();
      }
    });
  });

  // Initial display
  updateQDisplay();
});
