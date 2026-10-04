/* Book-to-course player. No dependencies. Works from file:// (progress in browser)
   and through serve.py (progress in progress/progress.json, tests runnable from the page). */
(function () {
"use strict";
const C = window.COURSE;
if (!C) { document.body.innerHTML = "<p style='padding:2rem;font-family:sans-serif'>Missing course/data.js — run scripts/build_course.py first.</p>"; return; }

/* ───────────── i18n ───────────── */
const STR = {
  pl: {
    home: "Start", glossary: "Słowniczek", cont: "Kontynuuj", startCourse: "Zacznij kurs", lessonsDone: "Ukończone lekcje",
    exercisesDone: "Zaliczone ćwiczenia", quizScore: "Poprawne odpowiedzi w quizach", minLeft: "Do końca około", min: "min",
    chapter: "Rozdział", lesson: "Lekcja", test: "Test rozdziału", quiz: "Szybki quiz", exercise: "Ćwiczenie", flashcards: "Fiszki",
    summary: "Najważniejsze", frombook: "Z książki", terms: "Nowe pojęcia", check: "Sprawdź", checkTest: "Sprawdź test",
    retry: "Spróbuj ponownie", hint: "Podpowiedź", showAnswer: "Pokaż odpowiedź", correct: "Dobrze!", wrong: "Jeszcze nie.",
    score: "Wynik", passed: "Zaliczone", failed: "Niezaliczone", needScore: "Wymagane: {0}%", best: "najlepszy",
    unanswered: "Pytań bez odpowiedzi: {0}. Sprawdzić mimo to?", tTrue: "Prawda", tFalse: "Fałsz", next: "Dalej", prev: "Wstecz",
    again: "Od nowa", step: "Krok {0} z {1}", reveal: "Pokaż odpowiedź", thinkFirst: "Zastanów się, zanim klikniesz.",
    goal: "Cel", behavior: "Co ma robić program", examples: "Przykłady wejścia i wyjścia", input: "Wejście", output: "Oczekiwane wyjście",
    startFiles: "Pliki startowe", testFiles: "Testy (możesz je przeczytać)", whereToWork: "Gdzie pracować", runCmd: "Polecenie w terminalu",
    runTests: "Uruchom testy", running: "Uruchamiam…", noServer: "Aby uruchamiać testy jednym kliknięciem, otwórz kurs przez start.sh / start.bat. Możesz też uruchomić polecenie ręcznie w terminalu.",
    markDone: "Zaznacz jako zaliczone", markUndone: "Cofnij zaliczenie", showSolution: "Pokaż rozwiązanie", hideSolution: "Ukryj rozwiązanie",
    confirmSolution: "Spróbuj jeszcze raz samodzielnie! Na pewno pokazać rozwiązanie?", stTodo: "Do zrobienia", stPassed: "Zaliczone",
    stFailed: "Testy jeszcze nie przechodzą", easy: "łatwe", medium: "średnie", hard: "trudne", checklist: "Sprawdź siebie",
    know: "Znam", notYet: "Jeszcze nie", flipHint: "Kliknij kartę, aby ją odwrócić", cardsLeft: "Do opanowania: {0}",
    allKnown: "Wszystkie fiszki opanowane! 🎉", finishLesson: "Ukończ lekcję", lessonDone: "Lekcja ukończona 🎉", nextLesson: "Następna lekcja",
    yourPractice: "Twoja praktyka", quizzes: "Quizy", exercises: "Ćwiczenia", later: "Możesz wrócić do ćwiczeń później — lekcję i tak można ukończyć.",
    reset: "Wyzeruj postęp", resetConfirm: "Na pewno wyzerować cały postęp?", savedFile: "💾 zapisano w pliku", savedBrowser: "💾 zapisano w przeglądarce",
    search: "Szukaj pojęcia…", none: "Brak wyników", courseDone: "Cały kurs ukończony! 🎓", passTest: "Zalicz test, aby ukończyć ten rozdział.",
    solution: "Rozwiązanie wzorcowe", yourAnswer: "Twoja odpowiedź", correctIs: "Poprawna odpowiedź", moveUp: "W górę", moveDown: "W dół",
    copy: "Kopiuj", copied: "Skopiowano", progressFile: "Postęp zapisuje się w folderze progress/.", exitCode: "kod wyjścia", testsOk: "Wszystkie testy przeszły ✓",
    testsFail: "Testy nie przechodzą — przeczytaj komunikaty poniżej i popraw kod.", serverErr: "Nie udało się połączyć z pomocnikiem (serve.py).",
    timedOut: "Przekroczono limit czasu — sprawdź, czy program nie zapętla się.", questionsN: "pytań", attempts: "podejść", readTime: "czytanie + praktyka", chOf: "Rozdział {0}", openSidebar: "Menu"
  },
  en: {
    home: "Home", glossary: "Glossary", cont: "Continue", startCourse: "Start the course", lessonsDone: "Lessons completed",
    exercisesDone: "Exercises passed", quizScore: "Correct quiz answers", minLeft: "About", min: "min",
    chapter: "Chapter", lesson: "Lesson", test: "Chapter test", quiz: "Quick quiz", exercise: "Exercise", flashcards: "Flashcards",
    summary: "Key takeaways", frombook: "From the book", terms: "New terms", check: "Check", checkTest: "Check test",
    retry: "Try again", hint: "Hint", showAnswer: "Show answer", correct: "Correct!", wrong: "Not yet.",
    score: "Score", passed: "Passed", failed: "Not passed", needScore: "Required: {0}%", best: "best",
    unanswered: "Unanswered questions: {0}. Check anyway?", tTrue: "True", tFalse: "False", next: "Next", prev: "Back",
    again: "Restart", step: "Step {0} of {1}", reveal: "Show answer", thinkFirst: "Think about it before you click.",
    goal: "Goal", behavior: "What the program should do", examples: "Input and output examples", input: "Input", output: "Expected output",
    startFiles: "Starter files", testFiles: "Tests (you can read them)", whereToWork: "Where to work", runCmd: "Terminal command",
    runTests: "Run tests", running: "Running…", noServer: "To run tests with one click, open the course via start.sh / start.bat. You can also run the command yourself in a terminal.",
    markDone: "Mark as passed", markUndone: "Undo", showSolution: "Show solution", hideSolution: "Hide solution",
    confirmSolution: "Try once more on your own first! Really show the solution?", stTodo: "To do", stPassed: "Passed",
    stFailed: "Tests not passing yet", easy: "easy", medium: "medium", hard: "hard", checklist: "Check yourself",
    know: "I know it", notYet: "Not yet", flipHint: "Click the card to flip it", cardsLeft: "Left to learn: {0}",
    allKnown: "All cards mastered! 🎉", finishLesson: "Finish lesson", lessonDone: "Lesson completed 🎉", nextLesson: "Next lesson",
    yourPractice: "Your practice", quizzes: "Quizzes", exercises: "Exercises", later: "You can come back to the exercises later — you can still finish the lesson.",
    reset: "Reset progress", resetConfirm: "Really reset all progress?", savedFile: "💾 saved to file", savedBrowser: "💾 saved in browser",
    search: "Search terms…", none: "No results", courseDone: "Whole course completed! 🎓", passTest: "Pass the test to complete this chapter.",
    solution: "Reference solution", yourAnswer: "Your answer", correctIs: "Correct answer", moveUp: "Up", moveDown: "Down",
    copy: "Copy", copied: "Copied", progressFile: "Progress is saved in the progress/ folder.", exitCode: "exit code", testsOk: "All tests passed ✓",
    testsFail: "Tests are failing — read the messages below and fix your code.", serverErr: "Could not reach the helper (serve.py).",
    timedOut: "Time limit exceeded — check for an infinite loop.", questionsN: "questions", attempts: "attempts", readTime: "reading + practice", chOf: "Chapter {0}", openSidebar: "Menu"
  }
};
const L = STR[C.meta.ui_lang] || STR.en;
const t = (k, ...a) => { let s = L[k] != null ? L[k] : (STR.en[k] != null ? STR.en[k] : k); a.forEach((v, i) => { s = s.split("{" + i + "}").join(v); }); return s; };

/* ───────────── tiny DOM helpers ───────────── */
function h(tag, props, ...kids) {
  const el = document.createElement(tag);
  if (props) for (const [k, v] of Object.entries(props)) {
    if (v == null || v === false) continue;
    if (k === "class") el.className = v;
    else if (k === "html") el.innerHTML = v;
    else if (k.slice(0, 2) === "on" && typeof v === "function") el.addEventListener(k.slice(2), v);
    else el.setAttribute(k, v === true ? "" : v);
  }
  for (const kid of kids.flat(Infinity)) { if (kid == null || kid === false) continue; el.append(kid.nodeType ? kid : document.createTextNode(String(kid))); }
  return el;
}
const esc = s => String(s).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
const $ = (s, r) => (r || document).querySelector(s);
/* replaceChildren() stringifies arrays and null — fill() flattens, drops empties and accepts text */
function fill(el, ...kids) { el.replaceChildren(...kids.flat(Infinity).filter(k => k != null && k !== false).map(k => (k.nodeType ? k : document.createTextNode(String(k))))); return el; }
function add(el, ...kids) { kids.flat(Infinity).forEach(k => { if (k != null && k !== false) el.append(k.nodeType ? k : document.createTextNode(String(k))); }); return el; }
const wait = ms => new Promise(r => setTimeout(r, ms));
const reduceMotion = () => window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches;

/* ───────────── mini markdown (safe: escapes everything first) ───────────── */
function inline(s) {
  const codes = [];
  s = String(s).replace(/`([^`]+)`/g, (m, c) => { codes.push(c); return "\u0000" + (codes.length - 1) + "\u0000"; });
  s = esc(s);
  s = s.replace(/\*\*([^*]+)\*\*/g, "<strong>$1</strong>").replace(/(^|[^*\w])\*([^*\s][^*]*?)\*(?!\w)/g, "$1<em>$2</em>");
  s = s.replace(/\[([^\]]+)\]\((https?:[^)\s]+)\)/g, '<a href="$2" target="_blank" rel="noopener noreferrer">$1</a>');
  return s.replace(/\u0000(\d+)\u0000/g, (m, i) => "<code>" + esc(codes[+i]) + "</code>");
}
function md(src) {
  const lines = String(src == null ? "" : src).replace(/\r/g, "").split("\n");
  const isList = l => /^\s*([-*]|\d+\.)\s+/.test(l);
  let html = "", i = 0;
  while (i < lines.length) {
    const l = lines[i];
    if (!l.trim()) { i++; continue; }
    let m;
    if (/^```/.test(l)) {
      const lang = l.replace(/^```/, "").trim(); const buf = []; i++;
      while (i < lines.length && !/^```/.test(lines[i])) buf.push(lines[i++]);
      i++;
      html += '<div class="code-wrap"><pre><code>' + highlightLines(buf.join("\n"), lang).map(x => '<span class="ln">' + x + "</span>").join("") + "</code></pre></div>";
      continue;
    }
    if ((m = /^(#{1,4})\s+(.*)$/.exec(l))) { const n = Math.min(m[1].length + 2, 6); html += "<h" + n + ">" + inline(m[2]) + "</h" + n + ">"; i++; continue; }
    if (/^>\s?/.test(l)) { const buf = []; while (i < lines.length && /^>\s?/.test(lines[i])) buf.push(lines[i++].replace(/^>\s?/, "")); html += "<blockquote>" + inline(buf.join(" ")) + "</blockquote>"; continue; }
    if (isList(l)) {
      const ordered = /^\s*\d+\./.test(l); const items = [];
      while (i < lines.length && isList(lines[i])) items.push(lines[i++].replace(/^\s*([-*]|\d+\.)\s+/, ""));
      const tag = ordered ? "ol" : "ul";
      html += "<" + tag + ">" + items.map(x => "<li>" + inline(x) + "</li>").join("") + "</" + tag + ">"; continue;
    }
    const buf = [];
    while (i < lines.length && lines[i].trim() && !isList(lines[i]) && !/^#{1,4}\s/.test(lines[i]) && !/^>/.test(lines[i]) && !/^```/.test(lines[i])) buf.push(lines[i++]);
    html += "<p>" + inline(buf.join(" ")) + "</p>";
  }
  return html;
}

/* ───────────── syntax highlighting (small, dependency-free) ───────────── */
const KW = {
  go: ["break case chan const continue default defer else fallthrough for func go goto if import interface map package range return select struct switch type var", "true false nil iota", "append cap close copy delete len make new panic print println recover string int int8 int16 int32 int64 uint uint8 uint16 uint32 uint64 uintptr float32 float64 bool byte rune error any"],
  python: ["and as assert async await break class continue def del elif else except finally for from global if import in is lambda nonlocal not or pass raise return try while with yield match case", "True False None self cls", "print len range int str float list dict set tuple bool type input open enumerate zip map filter sum min max abs sorted reversed isinstance super"],
  js: ["async await break case catch class const continue debugger default delete do else export extends finally for from function if import in instanceof let new of return static super switch this throw try typeof var void while with yield interface type enum implements public private protected readonly", "true false null undefined NaN Infinity", "console Math JSON Object Array String Number Boolean Promise Map Set Date Error require module process"],
  java: ["abstract assert break case catch class const continue default do else enum extends final finally for goto if implements import instanceof interface native new package private protected public return static strictfp super switch synchronized this throw throws transient try volatile while var record", "true false null", "String Integer Long Double Boolean List Map Set System Object Math ArrayList HashMap"],
  c: ["auto break case const continue default do else enum extern for goto if inline register return sizeof static struct switch typedef union volatile while class namespace template typename public private protected virtual new delete using nullptr", "true false NULL", "int char float double long short unsigned signed void bool size_t printf scanf malloc free std string vector cout cin endl"],
  rust: ["as async await break const continue crate dyn else enum extern fn for if impl in let loop match mod move mut pub ref return self Self static struct super trait type unsafe use where while", "true false None Some Ok Err", "i8 i16 i32 i64 u8 u16 u32 u64 usize isize f32 f64 bool char str String Vec Option Result Box println vec"],
  bash: ["if then else elif fi for while do done case esac in function return exit local export source alias unset set", "true false", "echo cd ls cat grep sed awk chmod mkdir rm cp mv curl git sudo npm pip python go"],
  sql: ["select from where and or not insert into values update set delete create table drop alter add join inner left right outer on group by order having limit offset as distinct union all null is in like between primary key foreign references index view", "true false null", "count sum avg min max coalesce"]
};
const ALIAS = { golang: "go", py: "python", python3: "python", javascript: "js", node: "js", jsx: "js", ts: "js", typescript: "js", tsx: "js", cpp: "c", "c++": "c", "c#": "java", cs: "java", kotlin: "java", shell: "bash", sh: "bash", zsh: "bash", rs: "rust", mysql: "sql", postgres: "sql", sqlite: "sql" };
const COMMENTS = { go: ["//", "/*"], js: ["//", "/*"], java: ["//", "/*"], c: ["//", "/*"], rust: ["//", "/*"], python: ["#"], bash: ["#"], sql: ["--", "/*"] };
const reCache = {};
function langDef(lang) {
  const k = ALIAS[String(lang || "").toLowerCase()] || String(lang || "").toLowerCase();
  if (!KW[k]) return null;
  if (!reCache[k]) {
    const [kw, lit, bi] = KW[k].map(s => new Set(s.split(" ")));
    const com = COMMENTS[k] || [];
    const parts = [];
    if (com.indexOf("/*") >= 0) parts.push("\\/\\*[\\s\\S]*?(?:\\*\\/|$)");
    if (com.indexOf("//") >= 0) parts.push("\\/\\/[^\\n]*");
    if (com.indexOf("#") >= 0) parts.push("#[^\\n]*");
    if (com.indexOf("--") >= 0) parts.push("--[^\\n]*");
    if (k === "python") parts.push('"""[\\s\\S]*?(?:"""|$)', "'''[\\s\\S]*?(?:'''|$)");
    parts.push('"(?:\\\\.|[^"\\\\\\n])*"', "'(?:\\\\.|[^'\\\\\\n])*'");
    if (k === "go" || k === "js") parts.push("`[^`]*`");
    parts.push("\\b0x[0-9a-fA-F_]+\\b|\\b\\d[\\d_]*(?:\\.\\d+)?(?:[eE][+-]?\\d+)?\\b", "[A-Za-z_$][\\w$]*");
    reCache[k] = { re: new RegExp(parts.join("|"), "g"), kw, lit, bi, ci: k === "sql" };
  }
  return reCache[k];
}
function highlightLines(code, lang) {
  const def = langDef(lang);
  const lines = [""];
  const push = (cls, text) => {
    const pieces = text.split("\n");
    pieces.forEach((p, i) => {
      if (i > 0) lines.push("");
      if (p) lines[lines.length - 1] += cls ? '<span class="tk-' + cls + '">' + esc(p) + "</span>" : esc(p);
    });
  };
  code = String(code == null ? "" : code).replace(/\r/g, "").replace(/\n+$/, "");
  if (!def) { push("", code); return lines; }
  let last = 0, m;
  def.re.lastIndex = 0;
  while ((m = def.re.exec(code))) {
    if (m.index > last) push("", code.slice(last, m.index));
    const tok = m[0]; let cls = "";
    const c = tok[0];
    if (tok.startsWith("//") || tok.startsWith("/*") || tok.startsWith("--") || (c === "#" && !/^#include|^#define/.test(tok) && true)) cls = "com";
    else if (c === '"' || c === "'" || c === "`") cls = "str";
    else if (/^\d/.test(tok)) cls = "num";
    else {
      const w = def.ci ? tok.toLowerCase() : tok;
      if (def.kw.has(w)) cls = "kw"; else if (def.lit.has(w)) cls = "lit"; else if (def.bi.has(w)) cls = "bi";
      else if (code[def.re.lastIndex] === "(") cls = "fn";
    }
    push(cls, tok); last = def.re.lastIndex;
    if (tok.length === 0) def.re.lastIndex++;
  }
  if (last < code.length) push("", code.slice(last));
  return lines;
}
const EXT = { go: "go", py: "python", js: "js", mjs: "js", ts: "ts", java: "java", c: "c", h: "c", cpp: "cpp", rs: "rust", sh: "bash", sql: "sql", json: "json" };
const langOf = p => EXT[String(p || "").split(".").pop().toLowerCase()] || "";

function copyText(text, btn) {
  const done = () => { const o = btn.textContent; btn.textContent = t("copied"); setTimeout(() => (btn.textContent = o), 1200); };
  if (navigator.clipboard && navigator.clipboard.writeText) navigator.clipboard.writeText(text).then(done, done);
  else { const ta = h("textarea", { style: "position:fixed;opacity:0" }); ta.value = text; document.body.append(ta); ta.select(); try { document.execCommand("copy"); } catch (e) { /* ignore */ } ta.remove(); done(); }
}
function codeBlock(o) {
  const hl = new Set(o.highlight || []);
  const lines = highlightLines(o.code, o.lang || langOf(o.file));
  const copy = h("button", { class: "copy-btn", type: "button", onclick: () => copyText(o.code, copy) }, t("copy"));
  const wrap = h("div", { class: "code-wrap" },
    h("div", { class: "code-head" }, h("span", null, o.file || o.lang || ""), copy),
    h("pre", null, h("code", null, lines.map((ln, i) => h("span", { class: "ln" + (hl.has(i + 1) ? " hl" : ""), html: ln })))));
  return o.caption ? h("div", null, wrap, h("div", { class: "code-caption", html: inline(o.caption) })) : wrap;
}
function sanitizeSvg(src) {
  const tpl = document.createElement("template"); tpl.innerHTML = String(src);
  tpl.content.querySelectorAll("script,foreignObject,iframe,object,embed").forEach(n => n.remove());
  tpl.content.querySelectorAll("*").forEach(n => [...n.attributes].forEach(a => {
    if (/^on/i.test(a.name) || (/^(xlink:)?href$/i.test(a.name) && /^\s*javascript:/i.test(a.value))) n.removeAttribute(a.name);
  }));
  return tpl.innerHTML;
}

/* ───────────── progress storage ───────────── */
let P = { version: 1, lessons: {}, quizzes: {}, exercises: {}, cards: {}, last: null, updated: null };
let serverMode = false, saveTimer = null;
const LS_KEY = "course-progress:" + C.meta.id;
const stamp = o => (o && o.updated) || "";
async function loadProgress() {
  let local = null;
  try { local = JSON.parse(localStorage.getItem(LS_KEY) || "null"); } catch (e) { /* ignore */ }
  let remote = null;
  if (location.protocol.indexOf("http") === 0) {
    try {
      const r = await fetch("api/ping", { cache: "no-store" });
      if (r.ok && (await r.json()).ok) { serverMode = true; const pr = await fetch("api/progress", { cache: "no-store" }); remote = await pr.json(); }
    } catch (e) { serverMode = false; }
  }
  const pick = serverMode ? (remote && remote.updated ? remote : (local || remote)) : local;
  if (pick && typeof pick === "object") P = Object.assign({ version: 1, lessons: {}, quizzes: {}, exercises: {}, cards: {}, last: null, updated: null }, pick);
  if (serverMode && (!remote || !remote.updated) && local) save(true);
}
function save(now) {
  P.updated = new Date().toISOString();
  try { localStorage.setItem(LS_KEY, JSON.stringify(P)); } catch (e) { /* ignore */ }
  const doPost = () => {
    if (!serverMode) return;
    fetch("api/progress", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(P) }).then(r => { if (!r.ok) throw new Error(); setSaveState(); }).catch(() => { const s = $("#saveState"); if (s) s.textContent = "⚠ " + t("serverErr"); });
  };
  clearTimeout(saveTimer);
  if (now) doPost(); else saveTimer = setTimeout(doPost, 350);
  setSaveState(); refreshChrome();
}
function setSaveState() { const s = $("#saveState"); if (s) s.textContent = serverMode ? t("savedFile") : t("savedBrowser"); }

/* ───────────── course model helpers ───────────── */
const ORDER = []; const CH_OF = {};
C.chapters.forEach((ch, ci) => ch.lessons.forEach(id => { ORDER.push(id); CH_OF[id] = ci; }));
const lessonDone = id => !!(P.lessons[id] && P.lessons[id].completed);
const lessonStarted = id => !!(P.lessons[id] && (P.lessons[id].visited || P.lessons[id].completed));
function chapterPct(ch) { if (!ch.lessons.length) return 0; return Math.round(100 * ch.lessons.filter(lessonDone).length / ch.lessons.length); }
function overallPct() { return ORDER.length ? Math.round(100 * ORDER.filter(lessonDone).length / ORDER.length) : 0; }
function allBlocks(les) { return les.blocks || []; }
function practiceOf(les) {
  let qT = 0, qC = 0, eT = 0, eP = 0;
  allBlocks(les).forEach(b => {
    if (b.type === "quiz" && !(b.mode === "test" || les.kind === "test")) { qT += b.questions.length; const s = P.quizzes[b.id]; qC += s && s.correct ? s.correct.length : 0; }
    if (b.type === "exercise") { eT++; if (P.exercises[b.id] && P.exercises[b.id].status === "passed") eP++; }
  });
  return { qT, qC, eT, eP };
}
function nextLessonId() { const first = ORDER.find(id => !lessonDone(id)); return (P.last && ORDER.indexOf(P.last) >= 0 && !lessonDone(P.last)) ? P.last : first; }
function celebrate(count) {
  if (reduceMotion() || !document.body.animate) return;
  const emojis = ["🎉", "✨", "⭐", "🎊", "💡"];
  for (let i = 0; i < (count || 22); i++) {
    const el = h("span", { class: "confetti" }, emojis[i % emojis.length]);
    document.body.append(el);
    const x = innerWidth / 2 + (Math.random() - .5) * 160, y = innerHeight * .55;
    const dx = (Math.random() - .5) * 520, dy = -180 - Math.random() * 280;
    el.animate([{ transform: "translate(" + x + "px," + y + "px) scale(.6)", opacity: 1 }, { transform: "translate(" + (x + dx) + "px," + (y + dy) + "px) rotate(" + (Math.random() * 540) + "deg) scale(1.2)", opacity: 1, offset: .55 }, { transform: "translate(" + (x + dx * 1.1) + "px," + (y + dy + 420) + "px) rotate(720deg) scale(.8)", opacity: 0 }], { duration: 1500 + Math.random() * 700, easing: "cubic-bezier(.2,.7,.4,1)" }).onfinish = () => el.remove();
  }
}

/* ───────────── blocks ───────────── */
const CALLOUT_ICON = { tip: "💡", note: "📝", warning: "⚠️", analogy: "🧩", key: "🔑", example: "🔍" };
const CALLOUT_NAME = { pl: { tip: "Wskazówka", note: "Uwaga", warning: "Uważaj", analogy: "Analogia", key: "Zapamiętaj", example: "Przykład" }, en: { tip: "Tip", note: "Note", warning: "Careful", analogy: "Analogy", key: "Remember", example: "Example" } };

function renderBlock(b, les) {
  switch (b.type) {
    case "text": return h("div", { class: "block text" }, b.title ? h("h3", null, b.title) : null, h("div", { html: md(b.md) }));
    case "callout": { const kind = CALLOUT_ICON[b.kind] ? b.kind : "note"; const nm = (CALLOUT_NAME[C.meta.ui_lang] || CALLOUT_NAME.en)[kind];
      return h("aside", { class: "block callout " + kind }, h("div", { class: "c-title" }, CALLOUT_ICON[kind], " ", b.title || nm), h("div", { html: md(b.md) })); }
    case "code": return h("div", { class: "block" }, b.title ? h("h4", null, b.title) : null, codeBlock(b),
      b.output ? [h("div", { class: "out-label" }, "▶ " + (b.output_label || t("output"))), h("pre", { class: "term" }, b.output)] : null, b.explain ? h("div", { class: "text", html: md(b.explain) }) : null);
    case "stepper": return stepperBlock(b);
    case "reveal": return revealBlock(b);
    case "from_book": return h("figure", { class: "block frombook", style: "margin-left:auto;margin-right:auto" }, h("div", { class: "fb-label" }, "📖 " + t("frombook") + (b.source ? " · " + b.source : "")), h("div", { html: md(b.md) }), b.code ? codeBlock({ code: b.code, lang: b.lang }) : null);
    case "table": return h("div", { class: "block tablewrap" }, h("table", null, h("thead", null, h("tr", null, b.headers.map(x => h("th", { html: inline(x) })))), h("tbody", null, b.rows.map(r => h("tr", null, r.map(c => h("td", { html: inline(c) })))))));
    case "flow": return flowBlock(b);
    case "svg": return h("figure", { class: "block svgfig", style: "margin-left:auto;margin-right:auto" }, h("div", { html: sanitizeSvg(b.svg) }), b.caption ? h("figcaption", { html: inline(b.caption) }) : null);
    case "quiz": return quizBlock(b, les);
    case "exercise": return exerciseBlock(b, les);
    case "flashcards": return flashBlock(b);
    case "summary": return h("div", { class: "block summary" }, h("h3", { class: "block-title" }, "🧾 " + (b.title || t("summary"))), h("ul", null, b.points.map((p, i) => h("li", { style: "animation-delay:" + (i * 120) + "ms", html: inline(p) }))));
    default: return h("div", { class: "block" }, "[" + b.type + "]");
  }
}

function stepperBlock(b) {
  let idx = 0;
  const stage = h("div", { class: "stepper-stage" }), dots = h("div", { class: "dots" }), meta = h("div", { class: "note-small" });
  const prev = h("button", { class: "btn ghost sm", type: "button", onclick: () => go(idx - 1, "prev") }, "← " + t("prev"));
  const next = h("button", { class: "btn sm", type: "button", onclick: () => go(idx + 1, "next") }, t("next") + " →");
  function go(i, dir) {
    idx = Math.max(0, Math.min(b.steps.length - 1, i)); const s = b.steps[idx];
    stage.className = "stepper-stage"; void stage.offsetWidth; if (dir) stage.classList.add("anim-" + dir);
    fill(stage, h("div", { class: "step-title" }, (idx + 1) + ". " + (s.title || "")), s.md ? h("div", { html: md(s.md) }) : null, s.code ? codeBlock({ code: s.code, lang: s.lang || b.lang, highlight: s.highlight, file: s.file }) : null, s.output ? [h("div", { class: "out-label" }, "▶ " + t("output")), h("pre", { class: "term" }, s.output)] : null);
    dots.replaceChildren(...b.steps.map((_, j) => h("button", { class: "dot" + (j === idx ? " on" : j < idx ? " past" : ""), type: "button", "aria-label": t("step", j + 1, b.steps.length), onclick: () => go(j, j > idx ? "next" : "prev") })));
    meta.textContent = t("step", idx + 1, b.steps.length); prev.disabled = idx === 0; next.disabled = idx === b.steps.length - 1;
  }
  const root = h("div", { class: "block stepper" }, h("h3", { class: "block-title" }, "🪜 " + (b.title || "")), stage, dots, h("div", { class: "row" }, prev, next, meta));
  go(0); return root;
}
function revealBlock(b) {
  const ans = h("div", { class: "answer", html: md(b.md) });
  const btn = h("button", { class: "btn ghost sm", type: "button", onclick: () => { const open = !ans.isConnected; if (open) { root.append(ans); btn.textContent = "▲"; } else { ans.remove(); btn.textContent = t("reveal"); } } }, t("reveal"));
  const root = h("div", { class: "block reveal" }, h("div", { class: "prompt", html: md(b.prompt) }), h("div", { class: "note-small" }, t("thinkFirst")), h("div", { style: "margin-top:8px" }, btn));
  return root;
}
function flowBlock(b) {
  let cur = -1;
  const track = h("div", { class: "flow-track" }), detail = h("div", { class: "flow-detail" }), nodes = [], arrows = [];
  b.nodes.forEach((n, i) => {
    const el = h("div", { class: "flow-node", tabindex: "0", role: "button", onclick: () => show(i), onkeydown: e => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); show(i); } } }, n.label);
    nodes.push(el); track.append(el); if (i < b.nodes.length - 1) { const a = h("span", { class: "flow-arrow" }, "→"); arrows.push(a); track.append(a); }
  });
  function show(i) {
    cur = i; nodes.forEach((n, j) => { n.classList.toggle("on", j <= i); n.classList.remove("cur"); }); void nodes[i].offsetWidth; nodes[i].classList.add("cur");
    arrows.forEach((a, j) => a.classList.toggle("on", j < i)); detail.innerHTML = md(b.nodes[i].detail || ""); nxt.disabled = i >= b.nodes.length - 1;
  }
  const nxt = h("button", { class: "btn sm", type: "button", onclick: () => show(cur + 1) }, t("next") + " ▶");
  const rst = h("button", { class: "btn ghost sm", type: "button", onclick: () => { cur = -1; nodes.forEach(n => n.classList.remove("on", "cur")); arrows.forEach(a => a.classList.remove("on")); detail.textContent = ""; nxt.disabled = false; } }, t("again"));
  return h("div", { class: "block flow" }, h("h3", { class: "block-title" }, "🔀 " + (b.title || "")), track, detail, h("div", { class: "row", style: "margin-top:10px" }, nxt, rst));
}

/* ───────────── quiz engine ───────────── */
function rng(seedStr) { let a = 0; for (let i = 0; i < seedStr.length; i++) a = (a * 31 + seedStr.charCodeAt(i)) >>> 0; return () => { a |= 0; a = (a + 0x6D2B79F5) | 0; let x = Math.imul(a ^ (a >>> 15), 1 | a); x = (x + Math.imul(x ^ (x >>> 7), 61 | x)) ^ x; return ((x ^ (x >>> 14)) >>> 0) / 4294967296; }; }
const normTxt = (s, ci) => { s = String(s == null ? "" : s).trim().replace(/\s+/g, " "); return ci === false ? s : s.toLowerCase(); };

function qSingle(q, uid) {
  let sel = null; const labels = [], inputs = [];
  const el = h("div", { class: "opts", role: "radiogroup" }, q.options.map((o, i) => {
    const inp = h("input", { type: "radio", name: uid, value: String(i), onchange: () => { sel = i; labels.forEach((l, j) => l.classList.toggle("sel", j === i)); } });
    const lab = h("label", { class: "opt" }, inp, h("span", { html: inline(o) })); labels.push(lab); inputs.push(inp); return lab;
  }));
  return { el, answered: () => sel !== null, correct: () => sel === q.answer, lock: v => inputs.forEach(i => (i.disabled = v)),
    mark: ok => { labels.forEach((l, j) => { l.classList.remove("good", "bad"); if (j === sel) l.classList.add(ok ? "good" : "bad"); }); },
    reveal: () => { labels.forEach((l, j) => { l.classList.remove("bad"); if (j === q.answer) l.classList.add("good"); }); },
    reset: () => { sel = null; inputs.forEach(i => (i.checked = false)); labels.forEach(l => l.classList.remove("sel", "good", "bad")); } };
}
function qMulti(q, uid) {
  const sel = new Set(); const labels = [], inputs = [];
  const el = h("div", { class: "opts" }, q.options.map((o, i) => {
    const inp = h("input", { type: "checkbox", name: uid, onchange: () => { inp.checked ? sel.add(i) : sel.delete(i); lab.classList.toggle("sel", inp.checked); } });
    const lab = h("label", { class: "opt" }, inp, h("span", { html: inline(o) })); labels.push(lab); inputs.push(inp); return lab;
  }));
  const want = new Set(q.answer);
  return { el, answered: () => sel.size > 0, correct: () => sel.size === want.size && [...sel].every(x => want.has(x)), lock: v => inputs.forEach(i => (i.disabled = v)),
    mark: ok => { labels.forEach((l, j) => { l.classList.remove("good", "bad"); if (sel.has(j)) l.classList.add(want.has(j) ? "good" : "bad"); }); },
    reveal: () => { labels.forEach((l, j) => { l.classList.remove("bad", "good"); if (want.has(j)) l.classList.add("good"); }); },
    reset: () => { sel.clear(); inputs.forEach(i => (i.checked = false)); labels.forEach(l => l.classList.remove("sel", "good", "bad")); } };
}
function qFill(q, uid) {
  const inp = h("input", { type: "text", autocomplete: "off", spellcheck: "false", placeholder: q.placeholder || "…", "aria-label": t("yourAnswer") });
  const el = h("div", { class: "fill-in" }, inp);
  const accepted = [].concat(q.answer).map(a => normTxt(a, q.ignore_case));
  return { el, answered: () => inp.value.trim() !== "", correct: () => accepted.indexOf(normTxt(inp.value, q.ignore_case)) >= 0, lock: v => (inp.disabled = v),
    mark: ok => { el.classList.remove("good", "bad"); el.classList.add(ok ? "good" : "bad"); },
    reveal: () => { inp.value = [].concat(q.answer)[0]; el.classList.remove("bad"); el.classList.add("good"); },
    reset: () => { inp.value = ""; el.classList.remove("good", "bad"); } };
}
function qOrder(q, uid) {
  const n = q.items.length; let order = [...Array(n).keys()]; const rnd = rng(uid);
  const shuffle = () => { for (let k = 0; k < 6; k++) { for (let i = n - 1; i > 0; i--) { const j = Math.floor(rnd() * (i + 1)); [order[i], order[j]] = [order[j], order[i]]; } if (order.some((v, i) => v !== i)) break; } };
  shuffle();
  const ul = h("ol", { class: "order-list" }); let locked = false;
  function draw() {
    ul.replaceChildren(...order.map((idx, pos) => h("li", null, h("span", { class: "txt", html: inline(q.items[idx]) }),
      h("button", { class: "btn ghost sm", type: "button", disabled: locked || pos === 0, "aria-label": t("moveUp"), onclick: () => { [order[pos - 1], order[pos]] = [order[pos], order[pos - 1]]; draw(); } }, "↑"),
      h("button", { class: "btn ghost sm", type: "button", disabled: locked || pos === n - 1, "aria-label": t("moveDown"), onclick: () => { [order[pos + 1], order[pos]] = [order[pos], order[pos + 1]]; draw(); } }, "↓"))));
  }
  draw();
  return { el: ul, answered: () => true, correct: () => order.every((v, i) => v === i), lock: v => { locked = v; draw(); },
    mark: ok => { ul.classList.remove("good", "bad"); ul.classList.add(ok ? "good" : "bad"); },
    reveal: () => { order = [...Array(n).keys()]; ul.classList.remove("bad"); ul.classList.add("good"); draw(); },
    reset: () => { order = [...Array(n).keys()]; shuffle(); ul.classList.remove("good", "bad"); draw(); } };
}
function makeQuestion(q0, qi, quizId) {
  const q = q0.type === "truefalse" ? Object.assign({}, q0, { type: "single", options: [t("tTrue"), t("tFalse")], answer: q0.answer ? 0 : 1 }) : q0;
  const uid = quizId + "-" + qi;
  const impl = q.type === "multi" ? qMulti(q, uid) : q.type === "fill" ? qFill(q, uid) : q.type === "order" ? qOrder(q, uid) : qSingle(q, uid);
  const fb = h("div", { class: "q-feedback", role: "status" });
  const root = h("div", { class: "question" }, h("div", { class: "q-head" }, h("span", { class: "q-num" }, String(qi + 1)), h("div", { class: "q-text", html: md(q.q) })), q.code ? codeBlock({ code: q.code, lang: q.lang }) : null, impl.el);
  const hints = q.hints || []; let used = 0;
  const hintBox = h("div", { class: "hints" });
  let hintBtn = null;
  if (hints.length) {
    hintBtn = h("button", { class: "btn ghost sm", type: "button", onclick: () => { hintBox.append(h("div", { class: "hint pop", html: "💡 " + inline(hints[used]) })); used++; label(); } });
    const label = () => { hintBtn.textContent = "💡 " + t("hint") + " (" + used + "/" + hints.length + ")"; hintBtn.disabled = used >= hints.length; }; label();
  }
  const actions = h("div", { class: "q-actions" });
  const api = { el: root, impl, actions, hintBtn, answered: impl.answered, hintsUsed: () => used };
  api.show = (ok, reveal) => {
    impl.mark(ok); if (reveal && !ok) impl.reveal();
    fb.replaceChildren(h("div", { class: "fb " + (ok ? "good" : "bad") }, h("strong", null, ok ? "✓ " + t("correct") : "✗ " + t("wrong")), (ok || reveal) && q.explanation ? h("div", { html: md(q.explanation) }) : null));
  };
  api.clear = () => { fb.replaceChildren(); impl.reset(); impl.lock(false); };
  add(root, hintBtn ? h("div", { class: "q-actions" }, hintBtn) : null, hintBox, actions, fb);
  return api;
}
function quizBlock(b, les) {
  const isTest = b.mode === "test" || les.kind === "test";
  const need = b.pass_score != null ? b.pass_score : 0.7;
  const st = P.quizzes[b.id] || (P.quizzes[b.id] = { attempts: 0, best: 0, correct: [], passed: false });
  const root = h("section", { class: "block quiz" + (isTest ? " is-test" : "") });
  const badge = h("span", { class: "chip" });
  const showBadge = () => {
    if (isTest) { badge.className = "chip " + (st.passed ? "ok" : st.attempts ? "bad" : ""); badge.textContent = st.attempts ? (st.passed ? "✓ " : "") + t("best") + ": " + Math.round(st.best * 100) + "%" : t("needScore", Math.round(need * 100)); }
    else { badge.className = "chip " + (st.correct.length === b.questions.length ? "ok" : ""); badge.textContent = st.correct.length + "/" + b.questions.length; }
  };
  showBadge();
  root.append(h("h3", { class: "block-title" }, (isTest ? "🏁 " : "❓ ") + (b.title || (isTest ? t("test") : t("quiz"))), " ", badge));
  if (b.intro) root.append(h("div", { class: "text", html: md(b.intro) }));
  const body = h("div"); root.append(body);
  let qs = [];
  function build() {
    qs = b.questions.map((q, i) => makeQuestion(q, i, b.id)); body.replaceChildren(...qs.map(x => x.el));
    if (!isTest) qs.forEach((x, i) => {
      const q = b.questions[i]; let solved = false;
      const chk = h("button", { class: "btn sm", type: "button" }, t("check")), retry = h("button", { class: "btn ghost sm", type: "button", style: "display:none" }, t("retry")), rev = h("button", { class: "btn ghost sm", type: "button", style: "display:none" }, t("showAnswer"));
      chk.onclick = () => {
        if (!x.answered()) return; const ok = x.impl.correct(); st.attempts++;
        if (ok) { x.impl.lock(true); x.show(true); chk.disabled = true; retry.style.display = "none"; rev.style.display = "none"; if (st.correct.indexOf(i) < 0) st.correct.push(i); if (!solved) { solved = true; } }
        else { x.show(false); retry.style.display = ""; rev.style.display = ""; }
        showBadge(); save();
      };
      retry.onclick = () => { x.clear(); chk.disabled = false; retry.style.display = "none"; rev.style.display = "none"; };
      rev.onclick = () => { x.impl.lock(true); x.show(false, true); chk.disabled = true; rev.style.display = "none"; retry.style.display = ""; };
      x.actions.append(chk, retry, rev);
    });
  }
  build();
  if (isTest) {
    const res = h("div"), go = h("button", { class: "btn", type: "button" }, t("checkTest")), again = h("button", { class: "btn ghost", type: "button", style: "display:none" }, t("retry"));
    go.onclick = () => {
      const miss = qs.filter(x => !x.answered()).length;
      if (miss && !confirm(t("unanswered", miss))) return;
      let right = 0; qs.forEach(x => { const ok = x.answered() && x.impl.correct(); if (ok) right++; x.impl.lock(true); x.show(ok, true); });
      const frac = right / qs.length; st.attempts++; st.best = Math.max(st.best, frac); st.last = frac; const pass = frac >= need;
      if (pass) { st.passed = true; P.lessons[les.id] = Object.assign(P.lessons[les.id] || {}, { completed: true, completedAt: new Date().toISOString() }); celebrate(); }
      res.replaceChildren(h("div", { class: "scorebar " + (pass ? "pass" : "fail") }, h("div", { class: "big" }, t("score") + ": " + right + "/" + qs.length + " (" + Math.round(frac * 100) + "%) — " + (pass ? t("passed") + " ✓" : t("failed"))), h("div", { class: "note-small" }, t("needScore", Math.round(need * 100)))));
      go.style.display = "none"; again.style.display = ""; showBadge(); save();
    };
    again.onclick = () => { build(); res.replaceChildren(); go.style.display = ""; again.style.display = "none"; };
    root.append(h("div", { class: "quiz-foot" }, go, again), res);
  }
  return root;
}

/* ───────────── exercises ───────────── */
function exerciseBlock(b, les) {
  const st = P.exercises[b.id] || (P.exercises[b.id] = { status: "todo", attempts: 0, hints: 0, checked: [] });
  const mode = b.mode === "tests" ? "tests" : "selfcheck";
  const statusChip = h("span", { class: "chip" });
  const setChip = () => { statusChip.className = "chip " + (st.status === "passed" ? "ok" : st.status === "failed" ? "bad" : ""); statusChip.textContent = st.status === "passed" ? "✓ " + t("stPassed") : st.status === "failed" ? t("stFailed") : t("stTodo"); };
  setChip();
  const root = h("section", { class: "block exercise" }, h("h3", { class: "block-title" }, "🛠️ " + t("exercise") + ": " + b.title, " ", b.difficulty ? h("span", { class: "chip accent" }, t(b.difficulty)) : null, " ", statusChip));
  root.append(h("h4", null, t("goal")), h("div", { class: "text", html: md(b.goal) }));
  if (b.behavior) root.append(h("h4", null, t("behavior")), h("div", { class: "text", html: md(b.behavior) }));
  if (b.examples && b.examples.length) {
    const hasIn = b.examples.some(e => e.input != null);
    root.append(h("h4", null, t("examples")), h("div", { class: "tablewrap", style: "box-shadow:none" }, h("table", null,
      h("thead", null, h("tr", null, hasIn ? h("th", null, t("input")) : null, h("th", null, t("output")), b.examples.some(e => e.note) ? h("th", null, "") : null)),
      h("tbody", null, b.examples.map(e => h("tr", null, hasIn ? h("td", null, h("code", null, e.input == null ? "" : e.input)) : null, h("td", null, h("code", null, e.output == null ? "" : e.output)), b.examples.some(x => x.note) ? h("td", { html: inline(e.note || "") }) : null))))));
  }
  const out = h("div"), runStatus = h("div", { class: "run-status" });
  function mark(status) { st.status = status; setChip(); save(); if (status === "passed") celebrate(14); }
  const doneBtn = h("button", { class: "btn ghost sm", type: "button" });
  const setDoneLabel = () => { doneBtn.textContent = st.status === "passed" ? t("markUndone") : t("markDone"); };
  doneBtn.onclick = () => { mark(st.status === "passed" ? "todo" : "passed"); setDoneLabel(); };
  setDoneLabel();
  const actions = h("div", { class: "row", style: "margin-top:12px" });
  if (mode === "tests") {
    const f = b.files || {};
    if (f.starter && f.starter.length) root.append(h("details", { open: true }, h("summary", null, t("startFiles")), f.starter.map(x => codeBlock({ code: x.content, file: x.path, lang: langOf(x.path) }))));
    if (f.tests && f.tests.length) root.append(h("details", null, h("summary", null, t("testFiles")), f.tests.map(x => codeBlock({ code: x.content, file: x.path, lang: langOf(x.path) }))));
    const cmd = b.command_display || "";
    const copy = h("button", { class: "copy-btn", style: "color:var(--text);border-color:var(--border)", type: "button", onclick: () => copyText("cd exercises/" + b.dir + " && " + cmd, copy) }, t("copy"));
    root.append(h("h4", null, t("whereToWork")), h("div", { class: "note-small" }, "📁 ", h("code", null, "exercises/" + b.dir + "/")), h("div", { class: "note-small", style: "margin-top:8px" }, t("runCmd") + ":"), h("div", { class: "cmdline" }, h("code", null, "cd exercises/" + b.dir + "\n" + cmd), copy));
    const run = h("button", { class: "btn", type: "button", disabled: !serverMode }, "▶ " + t("runTests"));
    run.onclick = async () => {
      run.disabled = true; run.textContent = t("running"); runStatus.className = "run-status"; runStatus.textContent = ""; out.replaceChildren(); st.attempts++;
      try {
        const r = await fetch("api/run-tests", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ dir: b.dir }) });
        const j = await r.json();
        if (!r.ok) throw new Error(j.error || "error");
        runStatus.className = "run-status " + (j.ok ? "good" : "bad");
        runStatus.textContent = j.timed_out ? "⏱ " + t("timedOut") : j.ok ? t("testsOk") : "✗ " + t("testsFail") + " (" + t("exitCode") + " " + j.exit_code + ")";
        out.replaceChildren(h("pre", { class: "term" }, j.output || ""));
        mark(j.ok ? "passed" : "failed"); setDoneLabel();
      } catch (e) { runStatus.className = "run-status bad"; runStatus.textContent = t("serverErr") + " " + (e.message || ""); }
      run.disabled = false; run.textContent = "▶ " + t("runTests");
    };
    actions.append(run);
    if (!serverMode) root.append(h("div", { class: "note-small", style: "margin-top:8px" }, "ℹ️ " + t("noServer")));
  } else if (b.checklist && b.checklist.length) {
    root.append(h("h4", null, t("checklist")), h("ul", { class: "checklist" }, b.checklist.map((c, i) => h("li", null, h("label", null,
      h("input", Object.assign({ type: "checkbox", onchange: e => { const k = st.checked.indexOf(i); if (e.target.checked && k < 0) st.checked.push(i); if (!e.target.checked && k >= 0) st.checked.splice(k, 1); save(); } }, st.checked.indexOf(i) >= 0 ? { checked: true } : {})), h("span", { html: inline(c) }))))));
  }
  actions.append(doneBtn);
  const hints = b.hints || []; const hintBox = h("div", { class: "hints", style: "margin-left:0" });
  for (let i = 0; i < Math.min(st.hints || 0, hints.length); i++) hintBox.append(h("div", { class: "hint", html: "💡 " + inline(hints[i]) }));
  if (hints.length) {
    const hb = h("button", { class: "btn ghost sm", type: "button", onclick: () => { hintBox.append(h("div", { class: "hint pop", html: "💡 " + inline(hints[st.hints]) })); st.hints++; lab(); save(); } });
    const lab = () => { hb.textContent = "💡 " + t("hint") + " (" + st.hints + "/" + hints.length + ")"; hb.disabled = st.hints >= hints.length; }; lab(); actions.append(hb);
  }
  const solBox = h("div");
  const sol = mode === "tests" ? ((b.files && b.files.solution) || []) : (typeof b.solution === "string" ? [{ path: b.solution_file || "", content: b.solution, lang: b.solution_lang || b.language }] : (b.solution || []));
  if (sol.length || b.solution_explain) {
    const sb = h("button", { class: "btn ghost sm", type: "button" }, "👁 " + t("showSolution"));
    sb.onclick = () => {
      if (solBox.childNodes.length) { solBox.replaceChildren(); sb.textContent = "👁 " + t("showSolution"); return; }
      if (!confirm(t("confirmSolution"))) return;
      fill(solBox, h("h4", null, t("solution")), sol.map(x => codeBlock({ code: x.content, file: x.path, lang: x.lang || langOf(x.path) })), b.solution_explain ? h("div", { class: "text", html: md(b.solution_explain) }) : null);
      sb.textContent = "🙈 " + t("hideSolution");
    };
    actions.append(sb);
  }
  root.append(actions, runStatus, out, hintBox, solBox);
  return root;
}

/* ───────────── flashcards ───────────── */
function flashBlock(b) {
  const st = P.cards[b.id] || (P.cards[b.id] = { known: [] });
  let queue = b.cards.map((_, i) => i).filter(i => st.known.indexOf(i) < 0), flipped = false;
  const root = h("div", { class: "block flash" }), meta = h("div", { class: "flash-meta" }), stage = h("div", { class: "flash-stage" }), ctr = h("div", { class: "row" });
  function draw() {
    stage.replaceChildren(); ctr.replaceChildren(); flipped = false;
    if (!queue.length) { stage.append(h("div", { class: "scorebar pass" }, h("div", { class: "big" }, t("allKnown")))); ctr.append(h("button", { class: "btn ghost sm", type: "button", onclick: () => { st.known = []; queue = b.cards.map((_, i) => i); save(); draw(); } }, t("again"))); meta.textContent = ""; return; }
    const c = b.cards[queue[0]];
    const card = h("div", { class: "card", tabindex: "0", role: "button", onclick: () => { flipped = !flipped; card.classList.toggle("flipped", flipped); }, onkeydown: e => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); card.click(); } } }, h("div", { class: "face front", html: inline(c.front) }), h("div", { class: "face back", html: inline(c.back) }));
    stage.append(card); meta.textContent = t("cardsLeft", queue.length) + " · " + t("flipHint");
    ctr.append(h("button", { class: "btn ok sm", type: "button", onclick: () => { st.known.push(queue.shift()); save(); draw(); } }, "✓ " + t("know")), h("button", { class: "btn ghost sm", type: "button", onclick: () => { queue.push(queue.shift()); draw(); } }, "↻ " + t("notYet")));
  }
  root.append(h("h3", { class: "block-title" }, "🗂️ " + (b.title || t("flashcards"))), meta, stage, ctr); draw(); return root;
}

/* ───────────── pages ───────────── */
const content = () => $("#content");
let observer = null;
function armReveal(container) {
  const blocks = container.querySelectorAll(".block, .finish, .pager");
  if (!("IntersectionObserver" in window) || reduceMotion()) { blocks.forEach(b => b.classList.add("in")); return; }
  if (observer) observer.disconnect();
  observer = new IntersectionObserver(es => es.forEach(e => { if (e.isIntersecting) { e.target.classList.add("in"); observer.unobserve(e.target); } }), { threshold: .08 });
  blocks.forEach(b => { b.classList.add("rv"); observer.observe(b); });
}
function ring(pct) {
  const r = 52, c = 2 * Math.PI * r; const ns = "http://www.w3.org/2000/svg";
  const svg = document.createElementNS(ns, "svg"); svg.setAttribute("width", 132); svg.setAttribute("height", 132); svg.setAttribute("viewBox", "0 0 132 132");
  const mk = cls => { const e = document.createElementNS(ns, "circle"); e.setAttribute("cx", 66); e.setAttribute("cy", 66); e.setAttribute("r", r); e.setAttribute("fill", "none"); e.setAttribute("stroke-width", 12); e.setAttribute("class", cls); return e; };
  const fg = mk("fg"); fg.style.strokeDasharray = c; fg.style.strokeDashoffset = c; svg.append(mk("bg"), fg);
  requestAnimationFrame(() => requestAnimationFrame(() => { fg.style.strokeDashoffset = c * (1 - pct / 100); }));
  return h("div", { class: "ring" }, svg, h("div", { class: "pct" }, pct + "%"));
}
function renderHome() {
  const el = content(); const pct = overallPct(); const nid = nextLessonId(); const doneAll = pct === 100;
  const ex = { t: 0, p: 0 }, qz = { t: 0, c: 0 }; let minLeft = 0;
  ORDER.forEach(id => { const les = C.lessons[id]; const pr = practiceOf(les); ex.t += pr.eT; ex.p += pr.eP; qz.t += pr.qT; qz.c += pr.qC; if (!lessonDone(id)) minLeft += les.minutes || 10; });
  const cta = nid ? h("a", { class: "btn", href: "#/lesson/" + nid, style: "text-decoration:none;display:inline-block;margin-top:10px" }, (P.last ? t("cont") : t("startCourse")) + " →") : null;
  fill(el,
    h("div", { class: "hero block" }, h("div", { class: "hero-text" }, h("h1", null, C.meta.title), C.meta.subtitle ? h("p", { class: "lead", style: "margin:0 0 6px" }, C.meta.subtitle) : null, C.meta.description ? h("div", { class: "text", html: md(C.meta.description) }) : null, doneAll ? h("p", null, h("strong", null, t("courseDone"))) : cta), ring(pct)),
    h("div", { class: "stats block" }, h("div", { class: "stat" }, h("b", null, ORDER.filter(lessonDone).length + "/" + ORDER.length), h("span", null, t("lessonsDone"))), h("div", { class: "stat" }, h("b", null, ex.p + "/" + ex.t), h("span", null, t("exercisesDone"))), h("div", { class: "stat" }, h("b", null, qz.c + "/" + qz.t), h("span", null, t("quizScore"))), h("div", { class: "stat" }, h("b", null, "~" + minLeft + " " + t("min")), h("span", null, t("minLeft") + "…"))),
    C.chapters.map((ch, ci) => h("section", { class: "ch-card block" }, h("h3", null, h("span", { class: "ch-num" }, ci + 1), ch.title, h("span", { class: "chip", style: "margin-left:auto" }, chapterPct(ch) + "%")), ch.summary ? h("div", { class: "note-small", html: inline(ch.summary) }) : null, h("div", { class: "bar", style: "margin-top:10px" }, h("div", { class: "bar-fill", style: "width:" + chapterPct(ch) + "%" })),
      h("ul", null, ch.lessons.map(id => h("li", null, h("a", { href: "#/lesson/" + id }, h("span", { class: "st" }, lessonDone(id) ? "✓" : lessonStarted(id) ? "◐" : "○"), C.lessons[id].title + (C.lessons[id].kind === "test" ? " 🏁" : ""))))))),
    h("div", { class: "footer-tools" }, h("span", null, serverMode ? t("progressFile") : t("savedBrowser")), h("button", { class: "btn ghost sm", type: "button", onclick: () => { if (confirm(t("resetConfirm"))) { P = { version: 1, lessons: {}, quizzes: {}, exercises: {}, cards: {}, last: null, updated: null }; save(true); route(); } } }, t("reset"))));
  armReveal(el);
}
function renderGlossary() {
  const el = content(); const list = h("div");
  const draw = q => {
    const items = (C.glossary || []).filter(g => !q || (g.term + " " + g.def).toLowerCase().indexOf(q.toLowerCase()) >= 0).sort((a, b) => a.term.localeCompare(b.term, C.meta.language || undefined));
    list.replaceChildren(...(items.length ? items.map(g => h("div", { class: "gloss-item" }, h("b", null, g.term), g.lesson ? h("a", { href: "#/lesson/" + g.lesson }, "→ " + (C.lessons[g.lesson] ? C.lessons[g.lesson].title : "")) : null, h("div", { html: inline(g.def) }))) : [h("p", { class: "note-small" }, t("none"))]));
  };
  const inp = h("input", { class: "gloss-search", type: "search", placeholder: t("search"), oninput: e => draw(e.target.value) });
  el.replaceChildren(h("h1", null, "📚 " + t("glossary")), inp, list); draw("");
}
function renderLesson(id) {
  const les = C.lessons[id]; const el = content();
  if (!les) { el.replaceChildren(h("p", null, "?")); return; }
  const ci = CH_OF[id], ch = C.chapters[ci]; const pos = ORDER.indexOf(id);
  P.last = id; const lp = (P.lessons[id] = P.lessons[id] || {}); if (!lp.visited) lp.visited = new Date().toISOString(); save();
  const isTest = les.kind === "test";
  const frag = [h("div", { class: "crumb" }, t("chOf", ci + 1) + " · " + ch.title), h("h1", null, les.title),
    h("div", { class: "chips" }, h("span", { class: "chip" }, "⏱ ~" + (les.minutes || 10) + " " + t("min")), h("span", { class: "chip accent" }, isTest ? t("test") : t("lesson")), lessonDone(id) ? h("span", { class: "chip ok" }, "✓ " + t("lessonDone")) : null),
    les.summary ? h("p", { class: "lead" }, les.summary) : null];
  allBlocks(les).forEach(b => frag.push(renderBlock(b, les)));
  if (les.terms && les.terms.length) frag.push(h("dl", { class: "terms block" }, h("h3", null, "📚 " + t("terms")), les.terms.map(x => [h("dt", null, x.term), h("dd", { html: inline(x.def) })])));
  const pr = practiceOf(les);
  const fin = h("div", { class: "finish" });
  const drawFinish = () => {
    const p2 = practiceOf(les); fin.replaceChildren();
    if (isTest) { fin.append(h("h3", null, lessonDone(id) ? t("lessonDone") : "🏁 " + t("test")), h("div", { class: "note-small" }, lessonDone(id) ? "" : t("passTest"))); return; }
    add(fin, h("h3", null, lessonDone(id) ? t("lessonDone") : t("yourPractice")),
      h("div", { class: "chips" }, p2.qT ? h("span", { class: "chip " + (p2.qC === p2.qT ? "ok" : "") }, t("quizzes") + ": " + p2.qC + "/" + p2.qT) : null, p2.eT ? h("span", { class: "chip " + (p2.eP === p2.eT ? "ok" : "") }, t("exercises") + ": " + p2.eP + "/" + p2.eT) : null),
      (!lessonDone(id) && (p2.qC < p2.qT || p2.eP < p2.eT)) ? h("div", { class: "note-small" }, t("later")) : null,
      lessonDone(id) ? null : h("button", { class: "btn", type: "button", style: "margin-top:10px", onclick: () => { P.lessons[id] = Object.assign(P.lessons[id] || {}, { completed: true, completedAt: new Date().toISOString() }); save(); celebrate(); drawFinish(); } }, "✓ " + t("finishLesson")));
    if (lessonDone(id) && pos < ORDER.length - 1) fin.append(h("a", { class: "btn", href: "#/lesson/" + ORDER[pos + 1], style: "text-decoration:none;display:inline-block;margin-top:10px" }, t("nextLesson") + " →"));
    if (lessonDone(id) && overallPct() === 100) fin.append(h("p", null, h("strong", null, t("courseDone"))));
  };
  drawFinish(); window.__drawFinish = drawFinish; void pr;
  frag.push(fin);
  const prev = pos > 0 ? ORDER[pos - 1] : null, nxt = pos < ORDER.length - 1 ? ORDER[pos + 1] : null;
  frag.push(h("nav", { class: "pager" }, prev ? h("a", { href: "#/lesson/" + prev }, h("small", null, "← " + t("prev")), C.lessons[prev].title) : h("span"), nxt ? h("a", { class: "nx", href: "#/lesson/" + nxt }, h("small", null, t("next") + " →"), C.lessons[nxt].title) : null));
  fill(el, ...frag); armReveal(el);
}

/* ───────────── chrome: sidebar, progress, theme, routing ───────────── */
function renderSidebar(current) {
  const sb = $("#sidebar"); const openChs = new Set([...sb.querySelectorAll("details[open]")].map(d => d.dataset.ch));
  const firstRender = !sb.children.length; const curCh = current && CH_OF[current] != null ? C.chapters[CH_OF[current]].id : null;
  fill(sb, h("a", { class: "nav-home" + (current === "home" ? " active" : ""), href: "#/home" }, "🏠 " + t("home")), h("a", { class: "nav-gloss" + (current === "glossary" ? " active" : ""), href: "#/glossary" }, "📚 " + t("glossary")),
    C.chapters.map((ch, ci) => {
      const d = h("details", { class: "nav-ch", "data-ch": ch.id }, h("summary", null, h("span", null, (ci + 1) + ". " + ch.title), h("span", { class: "ch-pct" }, chapterPct(ch) + "%")),
        ch.lessons.map(id => h("a", { class: "nav-lesson" + (lessonDone(id) ? " done" : lessonStarted(id) ? " started" : "") + (current === id ? " active" : "") + (C.lessons[id].kind === "test" ? " is-test" : ""), href: "#/lesson/" + id }, h("span", { class: "st" }, lessonDone(id) ? "✓" : ""), h("span", { class: "t" }, C.lessons[id].title))));
      if (firstRender ? ch.id === curCh || ci === 0 && !curCh : openChs.has(ch.id) || ch.id === curCh) d.setAttribute("open", ""); return d;
    }));
}
let currentRoute = "home";
function refreshChrome() {
  const pct = overallPct(); const gb = $("#globalBar"); if (gb) gb.style.width = pct + "%"; const gp = $("#globalPct"); if (gp) gp.textContent = pct + "%";
  renderSidebar(currentRoute);
}
function route() {
  const hash = location.hash.replace(/^#\/?/, "") || "home"; const [kind, ...rest] = hash.split("/"); const arg = rest.join("/");
  document.body.classList.remove("nav-open");
  if (kind === "lesson" && C.lessons[arg]) { currentRoute = arg; renderLesson(arg); }
  else if (kind === "glossary") { currentRoute = "glossary"; renderGlossary(); }
  else { currentRoute = "home"; renderHome(); }
  refreshChrome(); content().scrollTop = 0; window.scrollTo(0, 0);
}
function initChrome() {
  document.documentElement.lang = C.meta.language || C.meta.ui_lang || "pl"; document.title = C.meta.title;
  $("#brand").textContent = C.meta.title;
  let theme = null; try { theme = localStorage.getItem("course-theme"); } catch (e) { /* ignore */ }
  if (!theme) theme = window.matchMedia && matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
  document.documentElement.dataset.theme = theme;
  $("#themeBtn").onclick = () => { const n = document.documentElement.dataset.theme === "dark" ? "light" : "dark"; document.documentElement.dataset.theme = n; try { localStorage.setItem("course-theme", n); } catch (e) { /* ignore */ } };
  $("#menuBtn").onclick = () => document.body.classList.toggle("nav-open"); $("#scrim").onclick = () => document.body.classList.remove("nav-open");
}
(async function boot() {
  initChrome(); await loadProgress(); setSaveState();
  window.addEventListener("hashchange", route); route();
  window.__course = { get progress() { return P; }, route, save };
})();
})();
