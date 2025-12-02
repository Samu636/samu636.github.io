document.addEventListener('DOMContentLoaded', () => {
  const muInput = document.getElementById('mu');
  const sigmaInput = document.getElementById('sigma');
  const x0Input = document.getElementById('x0');
  const TInput = document.getElementById('T');
  const nStepsInput = document.getElementById('n-steps');
  const nPathsInput = document.getElementById('n-paths');
  const runBtn = document.getElementById('bm-run');

  const ctx = document.getElementById('bm-chart').getContext('2d');
  let bmChart = null;

  function randn() {
    // Box-Muller to get N(0,1)
    let u = 0,
      v = 0;
    while (u === 0) u = Math.random();
    while (v === 0) v = Math.random();
    return Math.sqrt(-2.0 * Math.log(u)) * Math.cos(2.0 * Math.PI * v);
  }

  function simulatePath(mu, sigma, x0, T, nSteps) {
    const dt = T / nSteps;
    const times = new Array(nSteps + 1);
    const values = new Array(nSteps + 1);

    let x = x0;
    times[0] = 0;
    values[0] = x0;

    for (let k = 1; k <= nSteps; k++) {
      const z = randn();
      x = x + mu * dt + sigma * Math.sqrt(dt) * z;
      times[k] = k * dt;
      values[k] = x;
    }
    return { times, values };
  }

  function regenerate() {
    const mu = parseFloat(muInput.value);
    const sigma = parseFloat(sigmaInput.value);
    const x0 = parseFloat(x0Input.value);
    const T = parseFloat(TInput.value);
    const nSteps = parseInt(nStepsInput.value, 10);
    const nPaths = parseInt(nPathsInput.value, 10);

    const datasets = [];
    for (let p = 0; p < nPaths; p++) {
      const { times, values } = simulatePath(mu, sigma, x0, T, nSteps);
      datasets.push({
        label: `Path ${p + 1}`,
        data: times.map((t, i) => ({ x: t, y: values[i] })),
        borderWidth: 1,
        fill: false,
        pointRadius: 0,
        stepped: false,
      });
    }

    const data = { datasets };
    const options = {
      responsive: true,
      parsing: false,
      scales: {
        x: { type: 'linear', title: { display: true, text: 'Time t' } },
        y: { title: { display: true, text: 'X(t)' } },
      },
      plugins: { legend: { display: false } },
    };

    if (bmChart) {
      bmChart.data = data;
      bmChart.options = options;
      bmChart.update();
    } else {
      bmChart = new Chart(ctx, { type: 'line', data, options });
    }
  }

  runBtn.addEventListener('click', regenerate);

  // initial run
  regenerate();
});
