// 독학사 OX / 실전문제 연습 웹앱
// window.QUIZ_DATA 는 data/*.js 파일들이 채워준다.

const SUBJECT_META = [
  { key: "ai", emoji: "🤖" },
  { key: "computer_network", emoji: "🌐" },
  { key: "embedded", emoji: "🔧" },
  { key: "info_security", emoji: "🔒" },
  { key: "programming_language", emoji: "💻" },
  { key: "soft_engineering", emoji: "🏗️" },
];

const FINAL_META = [
  { key: "final_ai", emoji: "🤖" },
  { key: "final_computer_network", emoji: "🌐" },
  { key: "final_embedded", emoji: "🔧" },
  { key: "final_info_security", emoji: "🔒" },
  { key: "final_programming_language", emoji: "💻" },
  { key: "final_soft_engineering", emoji: "🏗️" },
];

const LS_PREFIX = "dokhaksa_wrong_";

function getData(key) {
  const d = (window.QUIZ_DATA && window.QUIZ_DATA[key]) || null;
  if (!d || !Array.isArray(d.chapters)) {
    return { subjectKey: key, subjectName: key, chapters: [] };
  }
  return d;
}

function countItems(subjectData, mode) {
  let n = 0;
  for (const ch of subjectData.chapters) {
    const arr = ch[mode];
    if (Array.isArray(arr)) n += arr.length;
  }
  return n;
}

function getWrongSet(subjectKey, mode) {
  try {
    const raw = localStorage.getItem(LS_PREFIX + subjectKey + "_" + mode);
    return new Set(raw ? JSON.parse(raw) : []);
  } catch (e) {
    return new Set();
  }
}

function saveWrongSet(subjectKey, mode, set) {
  try {
    localStorage.setItem(LS_PREFIX + subjectKey + "_" + mode, JSON.stringify([...set]));
  } catch (e) {}
}

const ALL_MODES = ["ox", "mcq", "short"];

function clearSubjectRecords(subjectKey) {
  for (const mode of ALL_MODES) {
    try {
      localStorage.removeItem(LS_PREFIX + subjectKey + "_" + mode);
    } catch (e) {}
  }
}

function shuffle(arr) {
  const a = arr.slice();
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

// ---------------- App State ----------------
const state = {
  view: "home",
  subjectKey: null,
  mode: "ox", // 'ox' | 'mcq' | 'short'
  selectedChapters: new Set(), // chapterId set, empty = all
  wrongOnly: false,
  queue: [],
  idx: 0,
  score: 0,
  wrongIdsThisRun: new Set(),
  correctIdsThisRun: new Set(),
  resultSaved: false,
  answered: null, // current question's user answer info
  summarySubject: null,
  summaryChapterId: null,
};

const root = document.getElementById("app");

function render() {
  if (state.view === "home") return renderHome();
  if (state.view === "setup") return renderSetup();
  if (state.view === "quiz") return renderQuiz();
  if (state.view === "result") return renderResult();
  if (state.view === "summary-list") return renderSummaryList();
  if (state.view === "summary-read") return renderSummaryRead();
}

const SUMMARY_META = [
  { key: "ai", emoji: "🤖" },
  { key: "computer_network", emoji: "🌐" },
  { key: "embedded", emoji: "🔧" },
  { key: "info_security", emoji: "🔒" },
  { key: "programming_language", emoji: "💻" },
  { key: "soft_engineering", emoji: "🏗️" },
];

function getSummaryData(key) {
  const d = (window.SUMMARY_DATA && window.SUMMARY_DATA[key]) || null;
  if (!d || !Array.isArray(d.chapters)) {
    return { subjectKey: key, subjectName: key, chapters: [] };
  }
  return d;
}

function subjectCardHtml(m, unitLabel) {
  const d = getData(m.key);
  const oxN = countItems(d, "ox");
  const mcqN = countItems(d, "mcq");
  const shortN = countItems(d, "short");
  const total = oxN + mcqN + shortN;
  const badges = [];
  if (oxN) badges.push(`<span class="badge">OX ${oxN}</span>`);
  if (mcqN) badges.push(`<span class="badge">${unitLabel === "회" ? "문제" : "실전문제"} ${mcqN}</span>`);
  if (shortN) badges.push(`<span class="badge">주관식 ${shortN}</span>`);
  if (!total) badges.push(`<span class="badge empty">준비 중...</span>`);
  return `
    <div class="card subject-card" data-subject="${m.key}">
      <h3>${m.emoji} ${escapeHtml(d.subjectName)}</h3>
      <div class="meta">${d.chapters.length}${unitLabel}</div>
      <div class="counts">${badges.join("")}</div>
    </div>
  `;
}

function summaryCardHtml(m) {
  const d = getSummaryData(m.key);
  const n = d.chapters.length;
  return `
    <div class="card subject-card" data-summary="${m.key}">
      <h3>${m.emoji} ${escapeHtml(d.subjectName)}</h3>
      <div class="meta">${n}개 챕터</div>
      <div class="counts">${n ? `<span class="badge">정리노트</span>` : `<span class="badge empty">준비 중...</span>`}</div>
    </div>
  `;
}

function renderHome() {
  const cards = SUBJECT_META.map((m) => subjectCardHtml(m, "개 챕터")).join("");
  const finalCards = FINAL_META.map((m) => subjectCardHtml(m, "회")).join("");
  const summaryCards = SUMMARY_META.map((m) => summaryCardHtml(m)).join("");

  root.innerHTML = `
    <div class="header">
      <h1>📚 독학사 OX &amp; 실전문제 연습</h1>
      <p>과목을 선택해서 바로 풀어보세요. 데이터는 이 브라우저에만 저장됩니다.</p>
    </div>
    <div class="grid">${cards}</div>
    <div class="header" style="margin-top:36px;margin-bottom:0">
      <h2 style="font-size:1.15rem">🏁 최종모의고사</h2>
      <p>과목별 핵심이론 문제와는 별도로, 실제 시험 형식의 최종모의고사만 모아뒀어요.</p>
    </div>
    <div class="grid">${finalCards}</div>
    <div class="header" style="margin-top:36px;margin-bottom:0">
      <h2 style="font-size:1.15rem">📖 핵심요약 (읽기용 정리노트)</h2>
      <p>문제 풀이가 아니라, 챕터별 핵심이론을 빠르게 훑어보는 정리 노트예요.</p>
    </div>
    <div class="grid">${summaryCards}</div>
  `;

  root.querySelectorAll(".subject-card[data-subject]").forEach((el) => {
    el.addEventListener("click", () => {
      state.subjectKey = el.dataset.subject;
      state.view = "setup";
      state.selectedChapters = new Set();
      state.wrongOnly = false;
      const d = getData(state.subjectKey);
      state.mode = countItems(d, "ox") ? "ox" : countItems(d, "mcq") ? "mcq" : "short";
      render();
    });
  });

  root.querySelectorAll(".subject-card[data-summary]").forEach((el) => {
    el.addEventListener("click", () => {
      state.summarySubject = el.dataset.summary;
      state.summaryChapterId = null;
      state.view = "summary-list";
      render();
    });
  });
}

function renderSummaryList() {
  const d = getSummaryData(state.summarySubject);
  const rows = d.chapters
    .map(
      (ch) => `
      <div class="chapter-item" data-chapter="${ch.chapterId}" style="cursor:pointer">
        ${escapeHtml(ch.chapterTitle)}
      </div>
    `
    )
    .join("");

  root.innerHTML = `
    <button class="back-link" id="btn-home">&larr; 과목 선택으로</button>
    <div class="card">
      <h2>📖 ${escapeHtml(d.subjectName)} 핵심요약</h2>
      ${d.generated ? `<div class="meta" style="margin-bottom:14px">※ 이 요약은 원서 발췌가 아니라 새로 정리한 내용입니다</div>` : ""}
      <div class="chapter-list" style="max-height:none">${rows || '<div class="empty-state">아직 준비되지 않았습니다</div>'}</div>
    </div>
  `;

  document.getElementById("btn-home").addEventListener("click", () => {
    state.view = "home";
    render();
  });

  root.querySelectorAll("[data-chapter]").forEach((el) => {
    el.addEventListener("click", () => {
      state.summaryChapterId = el.dataset.chapter;
      state.view = "summary-read";
      render();
    });
  });
}

function renderSummaryRead() {
  const d = getSummaryData(state.summarySubject);
  const idx = d.chapters.findIndex((c) => c.chapterId === state.summaryChapterId);
  const ch = d.chapters[idx];
  if (!ch) {
    state.view = "summary-list";
    return render();
  }

  root.innerHTML = `
    <button class="back-link" id="btn-back">&larr; ${escapeHtml(d.subjectName)} 챕터 목록으로</button>
    <div class="card summary-content">
      <h2>${escapeHtml(ch.chapterTitle)}</h2>
      ${d.generated ? `<div class="meta" style="margin-bottom:14px">※ 새로 정리한 요약입니다 (원서 발췌 아님)</div>` : ""}
      <div class="summary-html">${ch.html || ""}</div>
    </div>
    <div class="footer-nav" style="justify-content:space-between;margin-top:16px">
      <button class="btn secondary" id="btn-prev-ch" ${idx <= 0 ? "disabled" : ""}>&larr; 이전 챕터</button>
      <button class="btn" id="btn-next-ch" ${idx >= d.chapters.length - 1 ? "disabled" : ""}>다음 챕터 &rarr;</button>
    </div>
  `;

  document.getElementById("btn-back").addEventListener("click", () => {
    state.view = "summary-list";
    render();
  });
  const prevBtn = document.getElementById("btn-prev-ch");
  const nextBtn = document.getElementById("btn-next-ch");
  if (!prevBtn.disabled) {
    prevBtn.addEventListener("click", () => {
      state.summaryChapterId = d.chapters[idx - 1].chapterId;
      window.scrollTo(0, 0);
      render();
    });
  }
  if (!nextBtn.disabled) {
    nextBtn.addEventListener("click", () => {
      state.summaryChapterId = d.chapters[idx + 1].chapterId;
      window.scrollTo(0, 0);
      render();
    });
  }
}

function renderSetup() {
  const d = getData(state.subjectKey);
  const oxN = countItems(d, "ox");
  const mcqN = countItems(d, "mcq");
  const shortN = countItems(d, "short");

  const modeBtn = (mode, label, n) => `
    <button class="option-btn ${state.mode === mode ? "active" : ""}" data-mode="${mode}" ${n === 0 ? "disabled" : ""}>
      ${label} ${n ? `(${n})` : ""}
    </button>`;

  const wrongSet = getWrongSet(state.subjectKey, state.mode);

  const chapterRows = d.chapters
    .map((ch) => {
      const n = (ch[state.mode] || []).length;
      if (!n) return "";
      const checked = state.selectedChapters.size === 0 || state.selectedChapters.has(ch.chapterId);
      return `
        <label class="chapter-item">
          <input type="checkbox" data-chapter="${ch.chapterId}" ${checked ? "checked" : ""}>
          ${escapeHtml(ch.chapterTitle)}
          <span class="count">${n}문항</span>
        </label>
      `;
    })
    .join("");

  root.innerHTML = `
    <button class="back-link" id="btn-home">&larr; 과목 선택으로</button>
    <div class="card">
      <h2>${escapeHtml(d.subjectName)}</h2>
      <div class="setup-section">
        <label>모드</label>
        <div class="option-row">
          ${modeBtn("ox", "OX 점검", oxN)}
          ${modeBtn("mcq", "실전 예상문제", mcqN)}
          ${modeBtn("short", "주관식", shortN)}
        </div>
      </div>
      <div class="setup-section">
        <label>범위 (체크 해제하면 제외)</label>
        <div class="chapter-list">${chapterRows || '<div class="empty-state">이 모드의 문제가 아직 없습니다</div>'}</div>
      </div>
      <div class="checkbox-row">
        <input type="checkbox" id="wrong-only" ${state.wrongOnly ? "checked" : ""} ${wrongSet.size === 0 ? "disabled" : ""}>
        <label for="wrong-only" style="margin:0;font-weight:500;color:var(--text)">
          오답만 다시 풀기 (${wrongSet.size}개 저장됨)
        </label>
      </div>
      <div style="display:flex;gap:10px;align-items:center">
        <button class="btn" id="btn-start">시작하기 &rarr;</button>
        <button class="back-link" id="btn-reset-subject" style="margin:0;padding:11px 4px">이 과목 기록 초기화</button>
      </div>
    </div>
  `;

  document.getElementById("btn-home").addEventListener("click", () => {
    state.view = "home";
    render();
  });

  root.querySelectorAll("[data-mode]").forEach((btn) => {
    btn.addEventListener("click", () => {
      if (btn.disabled) return;
      state.mode = btn.dataset.mode;
      state.selectedChapters = new Set();
      state.wrongOnly = false;
      render();
    });
  });

  root.querySelectorAll("[data-chapter]").forEach((cb) => {
    cb.addEventListener("change", () => {
      const all = d.chapters.map((c) => c.chapterId);
      // build current selected set from checkbox states
      const sel = new Set();
      root.querySelectorAll("[data-chapter]").forEach((el) => {
        if (el.checked) sel.add(el.dataset.chapter);
      });
      state.selectedChapters = sel.size === all.filter(cid => (d.chapters.find(c=>c.chapterId===cid)[state.mode]||[]).length).length ? new Set() : sel;
    });
  });

  const wrongCb = document.getElementById("wrong-only");
  if (wrongCb) {
    wrongCb.addEventListener("change", () => {
      state.wrongOnly = wrongCb.checked;
    });
  }

  document.getElementById("btn-start").addEventListener("click", () => startQuiz(d));

  document.getElementById("btn-reset-subject").addEventListener("click", () => {
    if (confirm(`"${d.subjectName}" 과목의 저장된 오답 기록을 전부 초기화할까요? (OX·객관식·주관식 전체)`)) {
      clearSubjectRecords(state.subjectKey);
      state.wrongOnly = false;
      render();
    }
  });
}

function startQuiz(d) {
  let items = [];
  for (const ch of d.chapters) {
    if (state.selectedChapters.size > 0 && !state.selectedChapters.has(ch.chapterId)) continue;
    const arr = ch[state.mode] || [];
    for (const q of arr) {
      items.push({ ...q, chapterTitle: ch.chapterTitle });
    }
  }
  if (state.wrongOnly) {
    const wrongSet = getWrongSet(state.subjectKey, state.mode);
    items = items.filter((q) => wrongSet.has(q.id));
  }
  if (items.length === 0) {
    alert("선택한 조건에 해당하는 문제가 없습니다.");
    return;
  }
  state.queue = shuffle(items);
  state.idx = 0;
  state.score = 0;
  state.wrongIdsThisRun = new Set();
  state.correctIdsThisRun = new Set();
  state.resultSaved = false;
  state.answered = null;
  state.view = "quiz";
  render();
}

function renderQuiz() {
  const q = state.queue[state.idx];
  const total = state.queue.length;
  const pct = Math.round((state.idx / total) * 100);

  let bodyHtml = "";
  if (state.mode === "ox") {
    bodyHtml = `
      <div class="ox-row">
        <button class="ox-btn" data-ans="true">O</button>
        <button class="ox-btn" data-ans="false">X</button>
      </div>
    `;
  } else if (state.mode === "mcq") {
    bodyHtml = `
      <div class="choices">
        ${q.choices
          .map(
            (c, i) => `
          <button class="choice-btn" data-idx="${i}">
            <span class="num">${i + 1}</span><span>${escapeHtml(c)}</span>
          </button>`
          )
          .join("")}
      </div>
    `;
  } else {
    bodyHtml = `
      <div class="setup-section">
        <textarea id="short-input" placeholder="생각나는 답을 적어보세요 (채점에는 쓰이지 않아요, 그냥 정리용)" style="width:100%;min-height:90px;padding:12px;border-radius:10px;border:1px solid var(--border);background:var(--surface);color:var(--text);font-size:1rem;font-family:inherit;resize:vertical;"></textarea>
      </div>
      <button class="btn" id="btn-reveal-short">정답 확인</button>
    `;
  }

  root.innerHTML = `
    <button class="back-link" id="btn-quit">&larr; 그만하기</button>
    <div class="card">
      <div class="progress-bar"><div class="progress-fill" style="width:${pct}%"></div></div>
      <div class="q-meta">
        <span>${escapeHtml(q.chapterTitle)}</span>
        <span>${state.idx + 1} / ${total} &middot; 맞음 ${state.score}</span>
      </div>
      <div class="q-text">${escapeHtml(state.mode === "ox" ? q.statement : q.question)}</div>
      <div id="answer-area">${bodyHtml}</div>
      <div id="feedback"></div>
      <div class="footer-nav" id="footer-nav"></div>
    </div>
  `;

  document.getElementById("btn-quit").addEventListener("click", () => {
    if (confirm("퀴즈를 종료하고 결과를 볼까요?")) {
      state.view = "result";
      render();
    }
  });

  if (state.mode === "ox") {
    root.querySelectorAll(".ox-btn").forEach((btn) => {
      btn.addEventListener("click", () => answerOx(btn.dataset.ans === "true"));
    });
  } else if (state.mode === "mcq") {
    root.querySelectorAll(".choice-btn").forEach((btn) => {
      btn.addEventListener("click", () => answerMcq(Number(btn.dataset.idx)));
    });
  } else {
    document.getElementById("btn-reveal-short").addEventListener("click", revealShort);
  }
}

// 답을 고를 때마다 바로 localStorage에 쓰지 않고, 이번 회차 결과만 메모리에 쌓아둔다.
// 실제 저장은 결과 화면에서 "저장" 버튼을 눌러야 saveRunResults()가 반영한다.
function markWrongState(q, isCorrect) {
  if (isCorrect) {
    state.correctIdsThisRun.add(q.id);
    state.wrongIdsThisRun.delete(q.id);
  } else {
    state.wrongIdsThisRun.add(q.id);
    state.correctIdsThisRun.delete(q.id);
  }
}

function saveRunResults() {
  const wrongSet = getWrongSet(state.subjectKey, state.mode);
  for (const id of state.correctIdsThisRun) wrongSet.delete(id);
  for (const id of state.wrongIdsThisRun) wrongSet.add(id);
  saveWrongSet(state.subjectKey, state.mode, wrongSet);
  state.resultSaved = true;
}

function showFeedback(isCorrect, explanation) {
  if (isCorrect) state.score++;
  const box = document.getElementById("feedback");
  box.innerHTML = `
    <div class="feedback-box ${isCorrect ? "correct" : "wrong"}">
      ${isCorrect ? "✅ 정답입니다!" : "❌ 오답입니다."}
      ${explanation ? `<div class="explain">${escapeHtml(explanation)}</div>` : ""}
    </div>
  `;
  const nav = document.getElementById("footer-nav");
  const isLast = state.idx >= state.queue.length - 1;
  nav.innerHTML = `<button class="btn" id="btn-next">${isLast ? "결과 보기" : "다음 문제"} &rarr;</button>`;
  document.getElementById("btn-next").addEventListener("click", () => {
    if (isLast) {
      state.view = "result";
    } else {
      state.idx++;
    }
    render();
  });
}

function answerOx(userAns) {
  const q = state.queue[state.idx];
  const isCorrect = userAns === q.answer;
  markWrongState(q, isCorrect);
  root.querySelectorAll(".ox-btn").forEach((btn) => {
    btn.disabled = true;
    const btnAns = btn.dataset.ans === "true";
    if (btnAns === q.answer) btn.classList.add("correct");
    else if (btnAns === userAns) btn.classList.add("wrong");
  });
  showFeedback(isCorrect, q.explanation);
}

function answerMcq(userIdx) {
  const q = state.queue[state.idx];
  const isCorrect = userIdx === q.answerIndex;
  markWrongState(q, isCorrect);
  root.querySelectorAll(".choice-btn").forEach((btn) => {
    btn.disabled = true;
    const i = Number(btn.dataset.idx);
    if (i === q.answerIndex) btn.classList.add("correct");
    else if (i === userIdx) btn.classList.add("wrong");
  });
  showFeedback(isCorrect, q.explanation);
}

function revealShort() {
  const q = state.queue[state.idx];
  const input = document.getElementById("short-input");
  if (input) input.disabled = true;
  document.getElementById("btn-reveal-short").remove();

  const box = document.getElementById("feedback");
  box.innerHTML = `
    <div class="feedback-box" style="background:var(--primary-dim);color:var(--text)">
      <strong>모범 답안</strong>
      <div class="explain" style="white-space:pre-wrap">${escapeHtml(q.answer)}${q.explanation ? "\n\n" + escapeHtml(q.explanation) : ""}</div>
    </div>
  `;
  const nav = document.getElementById("footer-nav");
  nav.innerHTML = `
    <span style="margin-right:auto;color:var(--text-dim);font-size:0.9rem;align-self:center">내 답이 맞았나요?</span>
    <button class="btn secondary" id="btn-self-wrong">틀렸어요</button>
    <button class="btn" id="btn-self-correct">맞았어요</button>
  `;
  document.getElementById("btn-self-correct").addEventListener("click", () => selfGradeShort(true));
  document.getElementById("btn-self-wrong").addEventListener("click", () => selfGradeShort(false));
}

function selfGradeShort(isCorrect) {
  const q = state.queue[state.idx];
  markWrongState(q, isCorrect);
  if (isCorrect) state.score++;

  const box = document.getElementById("feedback");
  box.innerHTML += `<div class="feedback-box ${isCorrect ? "correct" : "wrong"}" style="margin-top:10px">${isCorrect ? "✅ 맞은 걸로 표시했어요" : "❌ 틀린 걸로 표시했어요"} (결과 화면에서 저장 버튼을 눌러야 오답노트에 반영돼요)</div>`;

  const nav = document.getElementById("footer-nav");
  const isLast = state.idx >= state.queue.length - 1;
  nav.innerHTML = `<button class="btn" id="btn-next">${isLast ? "결과 보기" : "다음 문제"} &rarr;</button>`;
  document.getElementById("btn-next").addEventListener("click", () => {
    if (isLast) {
      state.view = "result";
    } else {
      state.idx++;
    }
    render();
  });
}

function renderResult() {
  const total = state.queue.length;
  const pct = total ? Math.round((state.score / total) * 100) : 0;
  const wrongItems = state.queue.filter((q) => state.wrongIdsThisRun.has(q.id));

  const reviewHtml = wrongItems
    .map((q) => {
      const qText = state.mode === "ox" ? q.statement : q.question;
      const ansText =
        state.mode === "ox"
          ? q.answer
            ? "O"
            : "X"
          : state.mode === "mcq"
          ? `${q.answerIndex + 1}. ${q.choices[q.answerIndex]}`
          : q.answer;
      return `
        <div class="review-item">
          <span class="tag wrong">오답</span>${escapeHtml(q.chapterTitle)}
          <div class="q-text" style="font-size:0.98rem;margin:8px 0 4px">${escapeHtml(qText)}</div>
          <div style="color:var(--ok);font-weight:600;font-size:0.9rem">정답: ${escapeHtml(ansText)}</div>
          ${q.explanation ? `<div style="color:var(--text-dim);font-size:0.88rem;margin-top:4px">${escapeHtml(q.explanation)}</div>` : ""}
        </div>
      `;
    })
    .join("");

  root.innerHTML = `
    <div class="card score-hero">
      <div>결과</div>
      <div class="big">${state.score} / ${total}</div>
      <div style="color:var(--text-dim)">정답률 ${pct}%</div>
      <div style="margin-top:14px">
        ${
          state.resultSaved
            ? `<span style="color:var(--ok);font-weight:600">✅ 오답노트에 저장됨</span>`
            : `<button class="btn" id="btn-save-run">이번 회차 저장</button>
               <div style="color:var(--text-dim);font-size:0.82rem;margin-top:8px">저장을 눌러야 오답노트(다시 풀기용 기록)에 반영돼요. 안 누르면 이번 회차는 기록에 남지 않아요.</div>`
        }
      </div>
    </div>
    <div class="footer-nav" style="justify-content:center;margin-top:16px">
      <button class="btn secondary" id="btn-again">다시 풀기</button>
      <button class="btn" id="btn-menu">과목 선택으로</button>
    </div>
    ${wrongItems.length ? `<div class="card" style="margin-top:20px"><h3>오답 노트 (${wrongItems.length})</h3>${reviewHtml}</div>` : ""}
  `;

  const saveBtn = document.getElementById("btn-save-run");
  if (saveBtn) {
    saveBtn.addEventListener("click", () => {
      saveRunResults();
      render();
    });
  }

  document.getElementById("btn-again").addEventListener("click", () => {
    state.view = "setup";
    render();
  });
  document.getElementById("btn-menu").addEventListener("click", () => {
    state.view = "home";
    render();
  });
}

function escapeHtml(str) {
  if (str === undefined || str === null) return "";
  return String(str)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

// ---------------- 비밀번호 게이트 (데이터는 AES-256-GCM으로 암호화되어 있음) ----------------
function b64ToBytes(b64) {
  const bin = atob(b64);
  const arr = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) arr[i] = bin.charCodeAt(i);
  return arr;
}

async function tryDecrypt(password) {
  const bundle = window.ENCRYPTED_BUNDLE;
  const salt = b64ToBytes(bundle.salt);
  const iv = b64ToBytes(bundle.iv);
  const cipher = b64ToBytes(bundle.cipher);

  const baseKey = await crypto.subtle.importKey("raw", new TextEncoder().encode(password), "PBKDF2", false, ["deriveKey"]);
  const key = await crypto.subtle.deriveKey(
    { name: "PBKDF2", salt, iterations: bundle.iterations, hash: "SHA-256" },
    baseKey,
    { name: "AES-GCM", length: 256 },
    false,
    ["decrypt"]
  );
  const plainBuf = await crypto.subtle.decrypt({ name: "AES-GCM", iv }, key, cipher);
  const json = new TextDecoder().decode(plainBuf);
  return JSON.parse(json);
}

function renderPasswordGate(errorMsg) {
  root.innerHTML = `
    <div class="header">
      <h1>🔒 독학사 OX &amp; 실전문제 연습</h1>
      <p>비밀번호를 입력하세요</p>
    </div>
    <div class="card" style="max-width:360px;margin:0 auto">
      <input type="password" id="gate-pw" placeholder="비밀번호" style="width:100%;padding:12px;border-radius:10px;border:1px solid var(--border);background:var(--surface);color:var(--text);font-size:1rem;margin-bottom:12px" autofocus>
      ${errorMsg ? `<div style="color:var(--bad);font-size:0.88rem;margin-bottom:12px">${escapeHtml(errorMsg)}</div>` : ""}
      <button class="btn" id="gate-submit" style="width:100%">입장하기</button>
    </div>
  `;
  const pwInput = document.getElementById("gate-pw");
  const submit = async () => {
    const pw = pwInput.value;
    if (!pw) return;
    submitBtn.disabled = true;
    submitBtn.textContent = "확인 중...";
    try {
      const data = await tryDecrypt(pw);
      window.QUIZ_DATA = data.quiz;
      window.SUMMARY_DATA = data.summary;
      render();
    } catch (e) {
      renderPasswordGate("비밀번호가 올바르지 않습니다.");
    }
  };
  const submitBtn = document.getElementById("gate-submit");
  submitBtn.addEventListener("click", submit);
  pwInput.addEventListener("keydown", (e) => {
    if (e.key === "Enter") submit();
  });
}

renderPasswordGate();
