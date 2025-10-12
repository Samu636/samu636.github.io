(function () {
  const alphabet = 'abcdefghijklmnopqrstuvwxyz';
  const $ = (sel) => document.querySelector(sel);
  const ENG_FREQ = {
    e: 12.02,
    t: 9.06,
    a: 8.17,
    o: 7.51,
    i: 7.0,
    n: 6.75,
    s: 6.33,
    h: 6.09,
    r: 5.99,
    d: 4.25,
    l: 4.03,
    c: 2.78,
    u: 2.76,
    m: 2.41,
    w: 2.36,
    f: 2.23,
    g: 2.02,
    y: 1.97,
    p: 1.93,
    b: 1.49,
    v: 0.98,
    k: 0.77,
    j: 0.15,
    x: 0.15,
    q: 0.1,
    z: 0.07,
  };
  // Normalize text: lowercase, remove non-a-z characters
  function normalizeText(text) {
    return text.toLowerCase().replace(/[^a-z]/g, ''); // keep only a-z, remove everything else
  }

  // Analyze letter frequency, return counts and percentages
  function analyzerFrequency(text) {
    const freq = {};
    for (const char of alphabet) freq[char] = 0; // initialize counts to 0
    const totalChars = text.length;
    for (let char of text) {
      if (char in freq) freq[char]++;
    }
    // convert counts to percentages
    for (const char in freq) {
      freq[char] = ((freq[char] / totalChars) * 100).toFixed(2); // percentage with 2 decimal places
    }
    return freq;
  }
  function addPercentageSign(x) {
    return (x * 1).toFixed(2) + '%';
  }

  //function to render the frequency table
  function renderTable(frequency) {
    const table = document.createElement('table');
    table.innerHTML = `
         <thead>
            <tr><th>Letter</th><th>Frequency</th></tr>
         </thead>
         <tbody></tbody>
      `;
    for (const ch of alphabet) {
      const row = document.createElement('tr');
      row.innerHTML = `<td>${ch}</td><td>${addPercentageSign(
        frequency[ch]
      )}</td>`;
      table.querySelector('tbody').appendChild(row);
    }
    return table;
  }

  //plotting the frequency chart
  function plotChart(frequency) {
    const canvas = document.getElementById('lf_chart');
    const ctx = canvas.getContext('2d');
    ctx.clearRect(0, 0, canvas.width, canvas.height); // clear previous chart

    const barWidth = canvas.width / alphabet.length;
    const maxFreq = Math.max(
      ...Object.values(frequency).map((x) => parseFloat(x))
    );

    // Draw bars
    alphabet.split('').forEach((ch, i) => {
      const barHeight =
        (parseFloat(frequency[ch]) / maxFreq) * (canvas.height - 20);
      ctx.fillStyle = '#5CE65C';
      ctx.fillRect(
        i * barWidth,
        canvas.height - barHeight,
        barWidth - 2,
        barHeight
      );
      ctx.fillStyle = '#f2f2f2';
      ctx.font = '10px monospace';
      ctx.fillText(ch, i * barWidth + barWidth / 2 - 3, canvas.height - 5);
      ctx.fillText(
        addPercentageSign(frequency[ch]),
        i * barWidth + barWidth / 2 - 10,
        canvas.height - barHeight - 10
      );
    });
  }
  //element listeners for analyze and clear buttons------------------------------------
  //-----------------------------------------------------------------------------------
  document.getElementById('lf_analyze').addEventListener('click', function () {
    const tablewrap = document.getElementById('lf_table_wrap');
    console.log('Analyze button clicked');
    const text = document.getElementById('lf_text').value;
    const normalized = normalizeText(text);
    console.log(normalized);
    const frequency = analyzerFrequency(normalized);
    console.log(JSON.stringify(frequency, null, 2));
    tablewrap.innerHTML = ''; //clear previous table
    tablewrap.appendChild(renderTable(frequency));
    plotChart(frequency);
  });
  document.getElementById('lf_clear').addEventListener('click', function () {
    document.getElementById('lf_text').value = '';
    document.getElementById('lf_table_wrap').innerHTML = '';
    const canvas = document.getElementById('lf_chart');
    const ctx = canvas.getContext('2d');
    ctx.clearRect(0, 0, canvas.width, canvas.height); // clear chart
  }); //the double parentheses at the end invoke the function immediately!!!! important!!!

  //Caesar Cipher functions-----------------------------------------------------------
  //----------------------------------------------------------------------------------
  //shift char function based on shift selected
  function shiftChar(char, shift) {
    const lowerCase = char.toLowerCase();
    const index = alphabet.indexOf(lowerCase);
    if (index === -1) return char; // non az non vengono convertiti
    const shiftedIndex = (index + shift + 26) % 26;
    const shiftedChar = alphabet[shiftedIndex];
    return char === lowerCase ? shiftedChar : shiftedChar.toUpperCase();
  }

  function caesarCipher(text, shift) {
    return text
      .split('')
      .map((char) => shiftChar(char, shift))
      .join('');
  }
  //console.log(caesarCipher('Hello, World!', 3)); // "Khoor, Zruog!"

  //brute force all 26 shifts
  function bruteForce(text) {
    const res = [];
    for (let s = 0; s < 26; s++) {
      res.push({ shift: s, text: caesarCipher(text, -s) });
    }
    return res;
  }

  //decrypt with frequency analysis
  //chisquared function
  function chiSquared(observed, expected) {
    let chi2 = 0;
    for (const ch in expected) {
      const obs = parseFloat(observed[ch]) || 0;
      const exp = expected[ch];
      const diff = obs - exp;
      chi2 += (diff * diff) / exp;
    }
    return chi2;
  }
  //function to auto decode
  function autoDecodeByFrequency(cipherText) {
    const normalized = normalizeText(cipherText);
    let best = { shift: null, score: Infinity, text: '' };

    for (let s = 0; s < 26; s++) {
      const decrypted = caesarCipher(cipherText, -s); // reuse your function
      const freq = analyzerFrequency(normalizeText(decrypted));
      const score = chiSquared(freq, ENG_FREQ);
      if (score < best.score) {
        best = { shift: s, score, text: decrypted };
      }
    }
    return best;
  }

  document.addEventListener('DOMContentLoaded', function () {
    const input = document.getElementById('cc_input');
    const output = document.getElementById('cc_output');
    const shiftInput = document.getElementById('cc_shift');
    const status = document.getElementById('cc_status');
    const candidatesWrap = $('#cc_candidates');
    const listWrap = $('#cc_list_wrap');

    //encrypt button
    $('#cc_encrypt').addEventListener('click', () => {
      const text = input.value || '';
      const shift = shiftInput.value || 0;
      output.value = caesarCipher(text, shift);
    });

    //bruteforce button
    $('#cc_bruteforce').addEventListener('click', () => {
      const enc = input.value || '';
      const results = bruteForce(enc);
      candidatesWrap.innerHTML = '';
      results.forEach((r) => {
        const card = document.createElement('div');
        card.className = 'card';
        card.style.marginBottom = '.5rem';
        card.innerHTML = `
          <div class="row" style="align-items:center;">
            <strong>shift ${r.shift}</strong>
            <button data-shift="${r.shift}" class="cc-use">Use</button>
            <button data-shift="${r.shift}" class="cc-copy">Copy</button>
            <button data-shift="${r.shift}" class="cc-dl">Download</button>
          </div>
          <textarea rows="3" readonly>${r.text}</textarea>
        `;
        candidatesWrap.appendChild(card);
      });
      listWrap.open = true;

      // delegate buttons
      candidatesWrap.addEventListener(
        'click',
        (e) => {
          const btn = e.target.closest('button');
          if (!btn) return;
          const idx = parseInt(btn.dataset.shift, 10);
          const text = results.find((x) => x.shift === idx)?.text || '';
          if (btn.classList.contains('cc-use')) {
            output.value = text;
            ok(`Loaded candidate with shift ${idx}.`);
          }
          if (btn.classList.contains('cc-copy')) {
            copyToClipboard(text);
            ok(`Copied candidate shift ${idx}.`);
          }
          if (btn.classList.contains('cc-dl')) {
            downloadText(text, `dec_shift_${idx}.txt`);
          }
        },
        { once: true }
      ); // attach once per generation
    });

    //autodecode button
    document.getElementById('cc_autodecode').addEventListener('click', () => {
      const inputText = document.getElementById('cc_input').value;
      if (!inputText.trim()) {
        document.getElementById('cc_status').textContent =
          'Please enter some encrypted text first.';
        return;
      }

      const best = autoDecodeByFrequency(inputText);
      document.getElementById('cc_output').value = best.text;
      document.getElementById('cc_status').textContent = `Best shift: ${
        best.shift
      } (score: ${best.score.toFixed(2)})`;
    });
  });
})();
