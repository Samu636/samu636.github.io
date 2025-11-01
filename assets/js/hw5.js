document.addEventListener('DOMContentLoaded', () => {
  const classicNumbers = [];
  const classicInput = document.getElementById('classic-input');
  const classicList = document.getElementById('classic-list');
  const classicMeanSpan = document.getElementById('classic-mean');
  const classicVarSpan = document.getElementById('classic-variance');

  document.getElementById('classic-add').addEventListener('click', () => {
    const val = parseFloat(classicInput.value);
    if (!isNaN(val)) {
      classicNumbers.push(val);
      classicList.textContent = JSON.stringify(classicNumbers);
      classicInput.value = '';
      classicInput.focus();
    }
  });

  classicInput.addEventListener('keydown', (event) => {
    if (event.key === 'Enter') {
      event.preventDefault();
      document.getElementById('classic-add').click();
    }
  });

  document.getElementById('classic-finish').addEventListener('click', () => {
    if (classicNumbers.length === 0) return;

    const n = classicNumbers.length;
    const sum = classicNumbers.reduce((a, b) => a + b, 0);
    const mean = sum / n;
    const variance =
      n > 1
        ? classicNumbers.reduce((acc, x) => acc + Math.pow(x - mean, 2), 0) /
          (n - 1)
        : 0;

    classicMeanSpan.textContent = mean.toFixed(3);
    classicVarSpan.textContent = variance.toFixed(3);
  });

  // ONLINE
  let n = 0;
  let mean = 0;
  let M2 = 0;

  const onlineInput = document.getElementById('online-input');
  const onlineCountSpan = document.getElementById('online-count');
  const onlineMeanSpan = document.getElementById('online-mean');
  const onlineVarSpan = document.getElementById('online-variance');

  const ctx = document.getElementById('online-chart').getContext('2d');
  const onlineChart = new Chart(ctx, {
    type: 'line',
    data: {
      labels: [],
      datasets: [
        { label: 'Mean', data: [], borderWidth: 2 },
        { label: 'Variance', data: [], borderWidth: 2 },
      ],
    },
    options: {
      responsive: true,
      scales: { y: { beginAtZero: true } },
    },
  });

  document.getElementById('online-add').addEventListener('click', () => {
    const x = parseFloat(onlineInput.value);
    if (isNaN(x)) return;

    n += 1;
    const delta = x - mean;
    mean += delta / n;
    M2 += delta * (x - mean);
    const variance = n > 1 ? M2 / (n - 1) : 0;

    onlineCountSpan.textContent = n;
    onlineMeanSpan.textContent = mean.toFixed(3);
    onlineVarSpan.textContent = variance.toFixed(3);

    onlineChart.data.labels.push(n.toString());
    onlineChart.data.datasets[0].data.push(mean);
    onlineChart.data.datasets[1].data.push(variance);
    onlineChart.update();

    onlineInput.value = '';
    onlineInput.focus();
  });

  onlineInput.addEventListener('keydown', (event) => {
    if (event.key === 'Enter') {
      event.preventDefault();
      document.getElementById('online-add').click();
    }
  });
});
