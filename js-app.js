// Helpers
const $ = (sel) => document.querySelector(sel);
const $$ = (sel) => document.querySelectorAll(sel);

function clamp(n, min, max) {
  return Math.max(min, Math.min(max, n));
}

function showToast(msg) {
  const t = $("#toast");
  if (!t) return;
  t.textContent = msg;
  t.classList.add("is-show");
  clearTimeout(showToast._tm);
  showToast._tm = setTimeout(() => t.classList.remove("is-show"), 1700);
}

// Burger menu
(function initMenu(){
  const burger = $("#burger");
  const nav = $("#nav");
  if (!burger || !nav) return;

  burger.addEventListener("click", () => {
    const open = nav.classList.toggle("is-open");
    burger.setAttribute("aria-expanded", open ? "true" : "false");
  });

  // close on link click (mobile)
  nav.addEventListener("click", (e) => {
    const a = e.target.closest("a");
    if (!a) return;
    nav.classList.remove("is-open");
    burger.setAttribute("aria-expanded", "false");
  });

  // close on outside click
  document.addEventListener("click", (e) => {
    if (e.target.closest("#nav") || e.target.closest("#burger")) return;
    nav.classList.remove("is-open");
    burger.setAttribute("aria-expanded", "false");
  });
})();

// Modal
(function initModal(){
  const modal = $("#modal");
  const openBtn = $("#openInfo");
  if (!modal) return;

  const open = () => {
    modal.classList.add("is-open");
    modal.setAttribute("aria-hidden", "false");
  };
  const close = () => {
    modal.classList.remove("is-open");
    modal.setAttribute("aria-hidden", "true");
  };

  if (openBtn) openBtn.addEventListener("click", open);

  modal.addEventListener("click", (e) => {
    if (e.target.dataset.close) close();
  });

  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape") close();
  });
})();

// Caesar cipher (Latin + Cyrillic)
function shiftChar(ch, shift, decode = false) {
  const latinUpper = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";
  const latinLower = "abcdefghijklmnopqrstuvwxyz";
  const cyrUpper = "АБВГДЕЁЖЗИЙКЛМНОПРСТУФХЦЧШЩЪЫЬЭЮЯ";
  const cyrLower = "абвгдеёжзийклмнопрстуфхцчшщъыьэюя";

  function shiftFromAlphabet(char, alphabet) {
    const n = alphabet.length;
    const index = alphabet.indexOf(char);

    if (index === -1) return char;

    const normalizedShift = ((shift % n) + n) % n;
    const finalShift = decode ? (n - normalizedShift) % n : normalizedShift;

    return alphabet[(index + finalShift) % n];
  }

  if (latinUpper.includes(ch)) return shiftFromAlphabet(ch, latinUpper);
  if (latinLower.includes(ch)) return shiftFromAlphabet(ch, latinLower);
  if (cyrUpper.includes(ch)) return shiftFromAlphabet(ch, cyrUpper);
  if (cyrLower.includes(ch)) return shiftFromAlphabet(ch, cyrLower);

  return ch;
}

function caesar(text, shift, mode) {
  const decode = mode === "decode";
  const s = Number.parseInt(shift, 10);

  return [...text]
    .map(ch => shiftChar(ch, Number.isNaN(s) ? 0 : s, decode))
    .join("");
}
const polybiusEn = [
  ['A','B','C','D','E'],
  ['F','G','H','I','K'],
  ['L','M','N','O','P'],
  ['Q','R','S','T','U'],
  ['V','W','X','Y','Z']
];

const polybiusRu = [
  ['А','Б','В','Г','Д','Е'],
  ['Ё','Ж','З','И','Й','К'],
  ['Л','М','Н','О','П','Р'],
  ['С','Т','У','Ф','Х','Ц'],
  ['Ч','Ш','Щ','Ъ','Ы','Ь'],
  ['Э','Ю','Я','','','']
];

function findInSquare(letter, square){
  for (let i = 0; i < square.length; i++){
    for (let j = 0; j < square[i].length; j++){
      if (square[i][j] === letter){
        return (i+1) + "" + (j+1);
      }
    }
  }
  return letter;
}

function polybiusEncode(text){

  let result = "";

  for (let ch of text){

    const upper = ch.toUpperCase();

    // Латиница
    if (/[A-Z]/.test(upper)){
      const letter = upper.replace('J','I');
      result += findInSquare(letter, polybiusEn) + " ";
      continue;
    }

    // Кириллица
    if (/[А-ЯЁ]/.test(upper)){
      result += findInSquare(upper, polybiusRu) + " ";
      continue;
    }

    // Остальные символы
    result += ch;
  }

  return result.trim();
}

function polybiusDecode(text){

  const parts = text.trim().split(/\s+/);

  // Определяем, какая таблица используется
  let useRu = false;

  for (let part of parts){
    if (/^\d{2}$/.test(part)){
      const r = parseInt(part[0]);
      const c = parseInt(part[1]);
      if (r > 5 || c > 5){
        useRu = true;
        break;
      }
    }
  }

  const square = useRu ? polybiusRu : polybiusEn;

  let result = "";

  for (let part of parts){

    if (/^\d{2}$/.test(part)){
      const row = parseInt(part[0]) - 1;
      const col = parseInt(part[1]) - 1;

      if (square[row] && square[row][col]){
        result += square[row][col];
      }
    } else {
      result += part + " ";
    }
  }

  return result.trim();
}

function getAlphabetType(ch) {
  const code = ch.charCodeAt(0);

  if ((code >= 65 && code <= 90) || (code >= 97 && code <= 122)) {
    return "latin";
  }

  if (ch === "Ё" || ch === "ё" || (code >= 1040 && code <= 1103)) {
    return "cyrillic";
  }

  return null;
}

function normalizeVigenereKey(key) {
  return [...(key || "")]
    .filter(ch => getAlphabetType(ch))
    .join("");
}

function getShiftFromKeyChar(ch) {
  const code = ch.charCodeAt(0);

  // Latin
  if (code >= 65 && code <= 90) return code - 65;
  if (code >= 97 && code <= 122) return code - 97;

  // Cyrillic special case Ё/ё
  if (ch === "Ё") return 6;
  if (ch === "ё") return 6;

  // Cyrillic uppercase А-Я
  if (code >= 1040 && code <= 1071) {
    if (code <= 1045) return code - 1040;     // А...Е
    return code - 1040 + 1;                   // Ж...Я with Ё included logically
  }

  // Cyrillic lowercase а-я
  if (code >= 1072 && code <= 1103) {
    if (code <= 1077) return code - 1072;     // а...е
    return code - 1072 + 1;                   // ж...я with ё included logically
  }

  return 0;
}

function shiftLatinChar(ch, shift, decode = false) {
  const base = ch >= "a" && ch <= "z" ? 97 : 65;
  const n = 26;
  const s = decode ? (n - (shift % n)) % n : shift % n;
  return String.fromCharCode(((ch.charCodeAt(0) - base + s) % n) + base);
}

function shiftCyrillicChar(ch, shift, decode = false) {
  const upper = "АБВГДЕЁЖЗИЙКЛМНОПРСТУФХЦЧШЩЪЫЬЭЮЯ";
  const lower = "абвгдеёжзийклмнопрстуфхцчшщъыьэюя";

  const alphabet = upper.includes(ch) ? upper : lower;
  const idx = alphabet.indexOf(ch);
  if (idx === -1) return ch;

  const n = alphabet.length; // 33
  const s = decode ? (n - (shift % n)) % n : shift % n;
  return alphabet[(idx + s) % n];
}

function vigenere(text, key, mode) {
  const cleanKey = normalizeVigenereKey(key);

  if (!cleanKey) return text;

  let result = "";
  let keyIndex = 0;

  for (const ch of text) {
    const textType = getAlphabetType(ch);

    if (!textType) {
      result += ch;
      continue;
    }

    let keyChar = cleanKey[keyIndex % cleanKey.length];
    let keyType = getAlphabetType(keyChar);

    // ищем следующий символ ключа того же алфавита, что и текст
    let attempts = 0;
    while (keyType !== textType && attempts < cleanKey.length) {
      keyIndex++;
      keyChar = cleanKey[keyIndex % cleanKey.length];
      keyType = getAlphabetType(keyChar);
      attempts++;
    }

    if (keyType !== textType) {
      result += ch;
      continue;
    }

    const shift = getShiftFromKeyChar(keyChar);

    if (textType === "latin") {
      result += shiftLatinChar(ch, shift, mode === "decode");
    } else {
      result += shiftCyrillicChar(ch, shift, mode === "decode");
    }

    keyIndex++;
  }

  return result;
}

function atbash(text) {
  const latinUpper = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";
  const latinLower = "abcdefghijklmnopqrstuvwxyz";

  const cyrUpper = "АБВГДЕЁЖЗИЙКЛМНОПРСТУФХЦЧШЩЪЫЬЭЮЯ";
  const cyrLower = "абвгдеёжзийклмнопрстуфхцчшщъыьэюя";

  return [...text].map(ch => {
    if (latinUpper.includes(ch)) {
      return latinUpper[25 - latinUpper.indexOf(ch)];
    }
    if (latinLower.includes(ch)) {
      return latinLower[25 - latinLower.indexOf(ch)];
    }
    if (cyrUpper.includes(ch)) {
      return cyrUpper[cyrUpper.length - 1 - cyrUpper.indexOf(ch)];
    }
    if (cyrLower.includes(ch)) {
      return cyrLower[cyrLower.length - 1 - cyrLower.indexOf(ch)];
    }
    return ch;
  }).join("");
}

// Calculator page init
(function initCalculator(){
  const input = $("#inputText");
  const output = $("#outputText");
  const shift = $("#shift");
  const run = $("#run");
  const copy = $("#copy");
  const clear = $("#clear");
  const swap = $("#swap");
  const randomShift = $("#randomShift");
  const modeHidden = $("#mode");
  const keyText = $("#keyText");
  const currentAlgo = document.body.dataset.algo;
  const bruteBtn = $("#bruteforce");
  

  if (!input || !output || !run) return;

  // Segmented mode buttons
  document.querySelectorAll("[data-mode]").forEach(btn => {
  btn.addEventListener("click", () => {
    document.querySelectorAll("[data-mode]").forEach(b =>
      b.classList.remove("is-active")
    );
    btn.classList.add("is-active");
    if (modeHidden) modeHidden.value = btn.dataset.mode;
  });
});
    

  const runCalc = () => {
  const txt = input.value || "";
  if (!txt.trim()) {
  input?.focus();
  input?.classList.add("is-invalid");
  showToast("Введите текст для шифрования!");
  input?.addEventListener("input", () => {
  if (input.value.trim()) {
    input.classList.remove("is-invalid");
  }
});
  output.value = "";
  return;
}

input?.classList.remove("is-invalid");
  const mode = modeHidden?.value || "encode";
  const algo = currentAlgo;

if (algo === "caesar"){
  const s = Number.parseInt(shift?.value, 10);
  const value = Number.isNaN(s) ? 0 : s;

  shift.value = value;
  output.value = caesar(txt, value, mode);
}

  if (algo === "polybius"){
    if (mode === "encode")
      output.value = polybiusEncode(txt);
    else
      output.value = polybiusDecode(txt);
  }

  if (algo === "vigenere") {
    const key = keyText?.value || "";
    output.value = vigenere(txt, key, mode);
  }

  if (algo === "atbash") {
  output.value = atbash(txt);
}

  showToast("Готово!");
};

  run?.addEventListener("click", runCalc);

  randomShift?.addEventListener("click", () => {
    const r = Math.floor(Math.random() * 100);
    shift.value = r;
    showToast("Сдвиг: " + r);
    runCalc();
  });

  clear?.addEventListener("click", () => {
    input.value = "";
    output.value = "";
    if (keyText) keyText.value = "";
    showToast("Очищено");
  });

  swap?.addEventListener("click", () => {
    const a = input.value;
    input.value = output.value;
    output.value = a;
    showToast("Поля поменяны");
  });

  copy?.addEventListener("click", async () => {
    try{
      await navigator.clipboard.writeText(output.value || "");
      showToast("Скопировано");
    }catch{
      showToast("Не удалось скопировать (браузер запретил)");
    }
  });

  // Bruteforce drawer
  const drawer = $("#drawer");
  const bruteList = $("#bruteList");
  const openDrawer = () => {
    if (!drawer || !bruteList) return;
    bruteList.innerHTML = "";
    const txt = input.value || "";
    for (let s = 0; s <= 32; s++){
      const res = caesar(txt, s, modeHidden.value);
      const div = document.createElement("div");
      div.className = "bruteItem";
      div.innerHTML = `
        <div class="bruteItem__top">
          <span class="pill">Сдвиг: ${s}</span>
          <button class="btn btn--ghost" data-use="${s}" type="button">Использовать</button>
        </div>
        <div class="muted small">${escapeHtml(res).slice(0, 400)}${res.length>400?"…":""}</div>
      `;
      bruteList.appendChild(div);
    }
    drawer.classList.add("is-open");
    drawer.setAttribute("aria-hidden", "false");
  };

  bruteBtn?.addEventListener("click", openDrawer);

  drawer?.addEventListener("click", (e) => {
    if (e.target.dataset.dclose) {
      drawer.classList.remove("is-open");
      drawer.setAttribute("aria-hidden", "true");
      return;
    }
    const use = e.target.closest("[data-use]");
    if (use) {
      const s = parseInt(use.dataset.use, 10);
      shift.value = s;
      runCalc();
      showToast("Выбран сдвиг: " + s);
    }
  });
})();

function escapeHtml(str){
  return (str || "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

// Contact form validation
(function initContactForm(){
  const form = $("#contactForm");
  if (!form) return;

  const name = $("#name");
  const email = $("#email");
  const message = $("#message");

  const errName = $("#errName");
  const errEmail = $("#errEmail");
  const errMsg = $("#errMsg");

  function setErr(el, msg){
    el.textContent = msg || "";
  }

  function isEmail(v){
    return /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(v);
  }

  form.addEventListener("submit", (e) => {
    e.preventDefault();

    const n = (name.value || "").trim();
    const em = (email.value || "").trim();
    const msg = (message.value || "").trim();

    let ok = true;

    if (n.length < 2){ setErr(errName, "Введите имя (минимум 2 символа)"); ok=false; }
    else setErr(errName, "");

    if (!isEmail(em)){ setErr(errEmail, "Введите корректный email"); ok=false; }
    else setErr(errEmail, "");

    if (msg.length < 10){ setErr(errMsg, "Сообщение должно быть не короче 10 символов"); ok=false; }
    else setErr(errMsg, "");

    if (!ok){
      showToast("Проверьте поля формы");
      return;
    }

    // Simulation of sending
    showToast("Сообщение отправлено (симуляция)");
    form.reset();
  });
})();
