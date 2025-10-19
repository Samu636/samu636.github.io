// hw3.js -- educational per character RSA encryption/decryption

(function () {
  const $ = (sel) => document.querySelector(sel);
  const ENG_REF_WITH_SPACE = {
    ' ': 18.0,
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
  const alphabet_space = ' abcdefghijklmnopqrstuvwxyz';
  //normalize text for demo: lowercase, keep a-z and space only
  function normalizeForDemo(text) {
    return text.toLowerCase().replace(/[^a-z ]/g, ''); // keep only a-z and space
  }

  //parse cipher symbol
  function parseCipherSymbol(sym) {
    //splitto on space
    if (!sym.trim()) return [];
    return sym.trim().split(/\s+/);
  }

  //function to count symbol frequencies
  function countFrequencies(symbols) {
    const freq = new Map();
    for (const sym of symbols) {
      freq.set(sym, (freq.get(sym) || 0) + 1);
    }
    return freq;
  }

  //sort by frequency with caching for optimization
  function sortByFrequency(freqMap) {
    if (freqMap._sortedEntries) {
      return freqMap._sortedEntries;
    }
    const sorted = [...freqMap.entries()].sort((a, b) => b[1] - a[1]);
    freqMap._sortedEntries = sorted;
    return sorted;
  }

  //mapping based on frequency

  // Define TARGET_ORDER as the expected order of characters by frequency (space + a-z)

  const TARGET_ORDER = ' etaoinshrdlcumwfgypbvkjxqz'.split('');

  function buildRankMapping(freqMap) {
    const ranked = sortByFrequency(freqMap);
    const map = new Map();
    for (let i = 0; i < ranked.length; i++) {
      const cipherNum = ranked[i][0];
      map.set(cipherNum, TARGET_ORDER[i] || '?');
    }
    return map;
  }

  function applyRankMapping(symbols, rankMap) {
    return symbols.map((sym) => rankMap.get(sym) || '?').join('');
  }

  // From a guessed plaintext string, compute observed % for space + a..z
  function observedPctFromGuess(guess) {
    const keys = [' '].concat('abcdefghijklmnopqrstuvwxyz'.split(''));
    const counts = Object.fromEntries(keys.map((k) => [k, 0]));
    let N = 0;
    for (const ch of String(guess).toLowerCase()) {
      if (counts.hasOwnProperty(ch)) {
        counts[ch]++;
        N++;
      }
    }
    if (N === 0) N = 1;
    const pct = {};
    for (const k of keys) pct[k] = (counts[k] * 100) / N;
    return pct;
  }

  // Chi-squared: lower = closer to English reference
  function chiSquaredLetters(obsPct, expectedPct = ENG_REF_WITH_SPACE) {
    let chi2 = 0;
    for (const k of Object.keys(expectedPct)) {
      const o = obsPct[k] || 0;
      const e = expectedPct[k] || 1e-6; // avoid divide-by-zero
      const d = o - e;
      chi2 += (d * d) / e;
    }
    return chi2;
  }

  function autoDecodeByFrequency(cipherText) {
    // 1. Parse cipher into symbols (numbers separated by spaces)
    const symbols = parseCipherSymbol(cipherText);
    if (symbols.length === 0) return { text: '', score: Infinity };

    // 2. Count frequencies of the cipher symbols
    const freqMap = countFrequencies(symbols);

    // 3. Build a mapping based on rank (most common symbol → ' ', then 'e', 't', ...)
    const rankMap = buildRankMapping(freqMap);

    // 4. Apply mapping to get a guessed plaintext (letters)
    const guess = applyRankMapping(symbols, rankMap);

    // 5. Compute the observed distribution and chi-squared score
    const obs = observedPctFromGuess(guess);
    const score = chiSquaredLetters(obs, ENG_REF_WITH_SPACE);

    // 6. Return everything
    return { text: guess, score, rankMap };
  }

  //extended euclidean algorithm to find gcd and coefficients
  function extendedGCD(a, b) {
    //in realta dovrei farla con bigint
    if (b === 0) {
      return [a, 1, 0];
    } else {
      const [gcd, x1, y1] = extendedGCD(b, a % b);
      const x = y1;
      const y = x1 - Math.floor(a / b) * y1;
      return [gcd, x, y];
    }
  }

  //funzione per calcolare il mod inverso.. cerco x tale che (a*x)= 1 mod(m)
  function modInverse(a, m) {
    const [gcd, x, y] = extendedGCD(a, m);
    if (gcd != 1) {
      throw new Error('Modular inverse does not exist');
    }
    if (x < 0) {
      return ((x % m) + m) % m;
    }
    return x;
  }

  //funzione per calcolare (base^exp) mod mod in modo efficiente (encryption/decryption)
  //fondamentalmente non posso calcolare normalmente base^exp perche diventerebbe enorme

  function modExp(base, exp, mod) {
    let result = 1n;
    base = BigInt(base) % BigInt(mod);
    exp = BigInt(exp);
    mod = BigInt(mod);
    while (exp > 0) {
      if (exp % 2n === 1n) {
        result = (result * base) % mod;
      }
      exp = exp >> 1n; // divide exp by 2
      base = (base * base) % mod;
    }
    return result;
  }

  //funzione per convertire stringa in array di codici ascii
  function stringToAsciiArray(str) {
    const asciiArray = [];
    for (let i = 0; i < str.length; i++) {
      asciiArray.push(str.charCodeAt(i));
    }
    return asciiArray;
  }

  function isPrime(num) {
    if (num <= 1) return false;

    for (let i = 2; i < num; i++) {
      if (num % i === 0) return false;
    }
    return true;
  }

  //funzione per generare keypair RSA dato due numeri primi p e q
  function generateKeys(p, q) {
    if (!isPrime(p) || !isPrime(q)) {
      throw new Error('Both numbers must be prime.');
    }
    let e = 65537; // common choice for e
    const n = p * q;
    const phi = (p - 1) * (q - 1);
    console.log('phi:', phi);
    const [g, x, y] = extendedGCD(e, phi);
    console.log('gcd e,phi:', g);
    if (g !== 1) {
      throw new Error('e and phi(n) are not coprime.');
    }
    const d = modInverse(e, phi);
    return {
      publicKey: { e: e, n: n },
      privateKey: { d: d, n: n },
      p: p,
      q: q,
      phi: phi,
    };
  }

  //render key details
  function renderKeyDetails({ p, q, phi, publicKey, privateKey }) {
    const box = $('#rsa_keyvals');
    box.innerHTML = `
    <pre style="white-space: pre-wrap; margin:0;">
    p= ${p.toString()}
    q = ${q.toString()}
    n = p*q = ${publicKey.n.toString()}
    φ(n) = (p-1)(q-1) = ${phi.toString()}
    e (public exponent) = ${publicKey.e.toString()}
    d (private exponent) = ${privateKey.d.toString()}
    Public key  = (e=${publicKey.e.toString()}, n=${publicKey.n.toString()})
    Private key = (d=${privateKey.d.toString()}, n=${privateKey.n.toString()})
      </pre>
    `;
  }
  function renderCharTable(plaintext, cipherArray, n, e) {
    const tbody = $('#rsa_char_table tbody');
    tbody.innerHTML = '';
    const limit = Math.min(cipherArray.length, 50);
    for (let i = 0; i < limit; i++) {
      const ch = plaintext[i];
      const m = plaintext.charCodeAt(i);
      const c = cipherArray[i];
      const tr = document.createElement('tr');
      const td = (txt) => {
        const t = document.createElement('td');
        t.style.padding = '.25rem .3rem';
        t.style.borderBottom = '1px solid #eee';
        t.style.textAlign = 'center';
        t.textContent = txt;
        return t;
      };
      tr.appendChild(td(String(i)));
      tr.appendChild(td(JSON.stringify(ch))); // show quotes for whitespace
      tr.appendChild(td(String(m)));
      tr.appendChild(td(String(c)));
      tbody.appendChild(tr);
    }
    const note = $('#rsa_notes');
    note.textContent =
      'Note: This demo encrypts each character independently (insecure in practice). ' +
      'Per-character mapping preserves frequency; a lookup-table attack can recover plaintext.';
  }

  let KEYS = null;
  document.addEventListener('DOMContentLoaded', function () {
    const input = document.getElementById('cc_input');
    const output = document.getElementById('cc_output');

    $('#generate_keys').addEventListener('click', () => {
      try {
        const pVal = $('#prime_p').value.trim();
        const qVal = $('#prime_q').value.trim();
        const p = Number(pVal);
        const q = Number(qVal);
        KEYS = generateKeys(p, q); // use 17n for tiny demo
        console.log('Generated keys:', KEYS);
        renderKeyDetails(KEYS);
        output.value = 'Keys generated. Now enter text and click Encrypt.';
      } catch (err) {
        output.value = `Key generation error: ${err.message}`;
      }
    });

    //get input values
    // console.log('Prova', extendedGCD(60, 13)); //res 1,5, -23
    // console.log('Prova', extendedGCD(93753, 234)); // res 9,-3,1202 sembra funzionare
    // console.log('mod inverse', modInverse(3, 11)); // dovrebbe essere 4
    // console.log('mod inverse', modInverse(60, 13)); // dovrebbe essere 5 works
    // console.log('mod exp', modExp(4, 13, 497)); // dovrebbe essere 445
    // console.log('mod exp', modExp(123n, 456n, 789n)); // dovrebbe essere 699
    //console.log('string to ascii', stringToAsciiArray('Hello!')); // dovrebbe essere [72, 101, 108, 108, 111, 33]
    console.log('generate keys', generateKeys(61, 53)); // dovrebbe funzionare
    $('#cc_encrypt').addEventListener('click', () => {
      if (!KEYS) {
        output.value = 'Please generate keys first.';
        return;
      }
      const plaintext = normalizeForDemo(input.value || '');
      console.log('Plaintext for encryption:', plaintext);
      const codes = stringToAsciiArray(plaintext);

      //devo encryptare ogni codice ascii
      const n = KEYS.publicKey.n;
      const e = KEYS.publicKey.e;
      const cipherArray = codes.map((m) => {
        return modExp(m, e, n);
      });
      output.value = cipherArray.join(' '); //spazio come separatore
      renderCharTable(
        plaintext,
        cipherArray.map((c) => c.toString()),
        n,
        e
      );
    });

    $('#cc_autodecode').addEventListener('click', () => {
      const inputText = document.getElementById('cc_output').value.trim();
      if (!inputText) {
        output.value = 'No ciphertext to decode.';
        return;
      }

      const result = autoDecodeByFrequency(inputText);
      output.value = result.text;

      console.log('Chi² score:', result.score.toFixed(2));
      console.log('Rank mapping:', result.rankMap);
    });
  });
})();
