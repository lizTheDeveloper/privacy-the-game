import { CURATED_MESSAGES, MESSAGE_BANK, TYPE_LABELS, DIFFICULTY_COLORS } from '../data/phishing.js';
import { renderHud } from '../components/hud.js';

function esc(value) {
  return String(value)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

export function getQuizState(state) {
  if (!state.phishingQuiz) {
    state.phishingQuiz = { curated: {}, streak: 0, bestStreak: 0, quizRound: 0, quizAnswers: {} };
  }
  return state.phishingQuiz;
}

function shuffleArray(arr, random = Math.random) {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

const QUIZ_BATCH = 5;
const MODES = {
  curated: { messages: () => CURATED_MESSAGES, answers: 'curated' },
  bank: { messages: () => MESSAGE_BANK, answers: 'quizAnswers' },
};

// The verdict on one message: saved with what the player typed as THE TELL, and the
// message stays on screen with its reveal (quiz.revealing) until NEXT. False when the
// message isn't in that set.
export function recordQuizVerdict(state, mode, msgId, verdict, tell = '') {
  const set = MODES[mode];
  const msg = set?.messages().find((m) => m.id === msgId);
  if (!msg) return false;
  const quiz = getQuizState(state);
  if (!quiz[set.answers]) quiz[set.answers] = {};
  const correct = verdict === msg.answer;
  quiz[set.answers][msgId] = { verdict, tell: String(tell || '').trim(), correct };
  if (correct) {
    quiz.streak = (quiz.streak || 0) + 1;
    quiz.bestStreak = Math.max(quiz.bestStreak || 0, quiz.streak);
  } else {
    quiz.streak = 0;
  }
  quiz.revealing = { mode, id: msgId };
  return true;
}

// NEXT: the revealed message goes away and the next one is drawn.
export function nextQuizMessage(state) {
  const quiz = getQuizState(state);
  delete quiz.revealing;
}

// Quiz mode draws a batch once and keeps it (in the save) until every message in it is
// answered, so a re-draw never swaps the message on screen.
function currentBankMessage(quiz, random) {
  const answered = quiz.quizAnswers || {};
  const byId = (id) => MESSAGE_BANK.find((m) => m.id === id);
  let pending = (Array.isArray(quiz.batch) ? quiz.batch : []).filter((id) => byId(id) && !answered[id]);
  if (pending.length === 0) {
    const available = MESSAGE_BANK.filter((m) => !answered[m.id]);
    if (available.length === 0) return null;
    quiz.batch = shuffleArray(available, random).slice(0, QUIZ_BATCH).map((m) => m.id);
    pending = quiz.batch;
  }
  return byId(pending[0]);
}

function renderMessageCard(msg) {
  const type = msg.type;
  const typeLabel = TYPE_LABELS[type] || type.toUpperCase();
  const diffColor = DIFFICULTY_COLORS[msg.difficulty] || 'var(--cyan)';

  if (type === 'email') {
    return `
    <div style="background: rgba(26,31,43,0.7); border: 1px solid rgba(0,229,255,0.12); overflow: hidden;">
      <div style="padding: 10px 14px; background: rgba(0,229,255,0.03); border-bottom: 1px solid rgba(0,229,255,0.08); display: flex; align-items: center; gap: 8px;">
        <div style="font-family: var(--font-mono); font-size: 9px; color: rgba(0,229,255,0.5); letter-spacing: 1px;">${esc(typeLabel)}</div>
        <div style="flex:1;"></div>
        <div style="font-family: var(--font-mono); font-size: 9px; color: ${diffColor}; letter-spacing: 1px;">${esc(msg.difficulty).toUpperCase()}</div>
      </div>
      <div style="padding: 14px;">
        <div style="display: flex; gap: 8px; align-items: baseline; margin-bottom: 6px;">
          <span style="font-family: var(--font-mono); font-size: 10px; color: rgba(237,239,243,0.35);">From:</span>
          <span style="font-family: var(--font-mono); font-size: 12px; color: var(--offwhite); word-break: break-all;">${esc(msg.from)}</span>
        </div>
        ${msg.subject ? `<div style="display: flex; gap: 8px; align-items: baseline; margin-bottom: 12px;">
          <span style="font-family: var(--font-mono); font-size: 10px; color: rgba(237,239,243,0.35);">Subject:</span>
          <span style="font-size: 14px; font-weight: 600; color: var(--offwhite);">${esc(msg.subject)}</span>
        </div>` : ''}
        <div style="font-size: 14px; color: rgba(237,239,243,0.75); line-height: 1.7; padding: 12px 0; border-top: 1px solid rgba(0,229,255,0.06);">${esc(msg.body)}</div>
      </div>
    </div>`;
  }

  if (type === 'sms') {
    return `
    <div style="max-width: 380px;">
      <div style="display: flex; align-items: center; gap: 8px; margin-bottom: 8px;">
        <div style="font-family: var(--font-mono); font-size: 9px; color: rgba(0,229,255,0.5); letter-spacing: 1px;">${esc(typeLabel)}</div>
        <div style="flex:1;"></div>
        <div style="font-family: var(--font-mono); font-size: 9px; color: ${diffColor}; letter-spacing: 1px;">${esc(msg.difficulty).toUpperCase()}</div>
      </div>
      <div style="font-family: var(--font-mono); font-size: 11px; color: rgba(237,239,243,0.4); margin-bottom: 6px;">${esc(msg.from)}</div>
      <div style="background: rgba(60,70,90,0.5); border-radius: 16px 16px 16px 4px; padding: 12px 16px; font-size: 14px; color: var(--offwhite); line-height: 1.6;">${esc(msg.body)}</div>
    </div>`;
  }

  if (type === 'call') {
    return `
    <div style="background: rgba(26,31,43,0.7); border: 1px solid rgba(0,229,255,0.12); overflow: hidden;">
      <div style="padding: 10px 14px; background: rgba(0,229,255,0.03); border-bottom: 1px solid rgba(0,229,255,0.08); display: flex; align-items: center; gap: 8px;">
        <div style="font-size: 16px;">📞</div>
        <div style="font-family: var(--font-mono); font-size: 9px; color: rgba(0,229,255,0.5); letter-spacing: 1px;">${esc(typeLabel)}</div>
        <div style="flex:1;"></div>
        <div style="font-family: var(--font-mono); font-size: 9px; color: ${diffColor}; letter-spacing: 1px;">${esc(msg.difficulty).toUpperCase()}</div>
      </div>
      <div style="padding: 14px;">
        <div style="font-family: var(--font-mono); font-size: 12px; color: rgba(237,239,243,0.5); margin-bottom: 10px;">Caller ID: ${esc(msg.from)}</div>
        <div style="font-size: 14px; color: rgba(237,239,243,0.75); line-height: 1.7; font-style: italic; padding: 10px 14px; border-left: 3px solid rgba(0,229,255,0.15);">${esc(msg.body)}</div>
      </div>
    </div>`;
  }

  if (type === 'push') {
    return `
    <div style="max-width: 380px;">
      <div style="display: flex; align-items: center; gap: 8px; margin-bottom: 8px;">
        <div style="font-family: var(--font-mono); font-size: 9px; color: rgba(0,229,255,0.5); letter-spacing: 1px;">${esc(typeLabel)}</div>
        <div style="flex:1;"></div>
        <div style="font-family: var(--font-mono); font-size: 9px; color: ${diffColor}; letter-spacing: 1px;">${esc(msg.difficulty).toUpperCase()}</div>
      </div>
      <div style="background: rgba(50,55,70,0.6); border-radius: 12px; padding: 12px 14px; display: flex; gap: 10px; align-items: flex-start;">
        <div style="width: 28px; height: 28px; background: rgba(0,229,255,0.1); border-radius: 6px; display: flex; align-items: center; justify-content: center; font-size: 14px; flex-shrink: 0;">🔔</div>
        <div>
          <div style="font-size: 12px; font-weight: 600; color: var(--offwhite); margin-bottom: 4px;">${esc(msg.from)}</div>
          <div style="font-size: 13px; color: rgba(237,239,243,0.7); line-height: 1.5;">${esc(msg.body)}</div>
        </div>
      </div>
    </div>`;
  }

  if (type === 'chat') {
    return `
    <div style="max-width: 440px;">
      <div style="display: flex; align-items: center; gap: 8px; margin-bottom: 8px;">
        <div style="font-family: var(--font-mono); font-size: 9px; color: rgba(0,229,255,0.5); letter-spacing: 1px;">${esc(typeLabel)}</div>
        <div style="flex:1;"></div>
        <div style="font-family: var(--font-mono); font-size: 9px; color: ${diffColor}; letter-spacing: 1px;">${esc(msg.difficulty).toUpperCase()}</div>
      </div>
      <div style="background: rgba(26,31,43,0.7); border: 1px solid rgba(0,229,255,0.1); overflow: hidden;">
        <div style="padding: 8px 12px; background: rgba(0,229,255,0.03); border-bottom: 1px solid rgba(0,229,255,0.06); font-family: var(--font-mono); font-size: 10px; color: rgba(237,239,243,0.4);">💬 ${esc(msg.from)}</div>
        <div style="padding: 12px 14px; font-size: 14px; color: rgba(237,239,243,0.75); line-height: 1.7;">${esc(msg.body)}</div>
      </div>
    </div>`;
  }

  return `<div style="padding: 14px; font-size: 14px; color: var(--offwhite); line-height: 1.7;">${esc(msg.body)}</div>`;
}

function renderReveal(msg, record) {
  const isCorrect = record.correct;
  const correctColor = isCorrect ? 'var(--lime)' : 'var(--magenta)';
  const correctBg = isCorrect ? 'rgba(198,255,0,0.06)' : 'rgba(255,45,155,0.06)';
  const correctBorder = isCorrect ? 'rgba(198,255,0,0.2)' : 'rgba(255,45,155,0.2)';
  const answerLabel = msg.answer === 'pretext' ? 'FAKE' : 'REAL';
  const label = (text) => `<div style="font-family: var(--font-display); font-size: 8px; color: rgba(0,229,255,0.5); letter-spacing: 2px; margin: 12px 0 6px;">${text}</div>`;

  // What the player typed under THE TELL, beside the real tells.
  const yours = record.tell
    ? `${label('YOUR TELL')}<div data-your-tell style="font-size: 13px; color: var(--offwhite); line-height: 1.5; font-style: italic;">&ldquo;${esc(record.tell)}&rdquo;</div>`
    : '';

  let tellsHtml = '';
  if (msg.tells && msg.tells.length > 0) {
    tellsHtml = label('THE TELLS') + msg.tells.map(t =>
      `<div style="display: flex; gap: 8px; align-items: flex-start; margin-bottom: 6px;">
        <span style="color: ${correctColor}; flex-shrink: 0;">•</span>
        <span style="font-size: 13px; color: rgba(237,239,243,0.65); line-height: 1.5;">${esc(t)}</span>
      </div>`
    ).join('');
  }

  let verifyHtml = '';
  if (msg.verify) {
    verifyHtml = `<a href="${esc(msg.verify.url)}" target="_blank" rel="noopener" style="display: inline-block; font-family: var(--font-mono); font-size: 10px; letter-spacing: 0.5px; padding: 6px 14px; border: 1px solid rgba(0,229,255,0.2); color: var(--cyan); text-decoration: none; margin-top: 10px;">Verify ↗ ${esc(msg.verify.label)}</a>`;
  }

  return `
  <div data-quiz-reveal="${msg.id}" role="status" style="margin-top: 16px; padding: 16px; background: ${correctBg}; border: 1px solid ${correctBorder};">
    <div style="font-family: var(--font-display); font-size: 12px; font-weight: 700; color: ${correctColor}; letter-spacing: 2px;">
      ${isCorrect ? '✓ CORRECT' : '✗ WRONG'} — THIS IS ${answerLabel}
    </div>
    ${yours}
    ${tellsHtml}
    ${verifyHtml}
  </div>`;
}

function getCuratedProgress(quiz) {
  const answered = Object.keys(quiz.curated).length;
  const correct = Object.values(quiz.curated).filter(a => a.correct).length;
  return { answered, correct, total: CURATED_MESSAGES.length };
}

function getNextCuratedMessage(quiz) {
  return CURATED_MESSAGES.find(m => !quiz.curated[m.id]);
}

const btnStyle = (color, rgb) => `flex: 1; text-align: center; padding: 14px; cursor: pointer; font-family: var(--font-display); font-size: 12px; font-weight: 700; letter-spacing: 2px; color: ${color}; border-color: rgba(${rgb},0.3); background: rgba(${rgb},0.05);`;

// The verdict buttons and THE TELL box for a message not yet answered.
function verdictForm(msg, mode) {
  const action = mode === 'bank' ? 'quiz-bank-verdict' : 'quiz-verdict';
  const tellAttr = mode === 'bank' ? 'data-quiz-bank-tell' : 'data-quiz-tell';
  const placeholder = mode === 'bank' ? 'What tipped you off?' : 'What made you decide?';
  return `
        <div style="margin-top: 20px;">
          <div style="margin-bottom: 12px;">
            <div style="font-family: var(--font-display); font-size: 8px; color: rgba(0,229,255,0.4); letter-spacing: 2px; margin-bottom: 6px;">THE TELL</div>
            <input type="text" ${tellAttr}="${msg.id}" placeholder="${placeholder}" style="width: 100%; padding: 10px 14px; background: rgba(26,31,43,0.6); border: 1px solid rgba(0,229,255,0.15); color: var(--offwhite); font-family: var(--font-body); font-size: 13px; outline: none;">
          </div>
          <div style="display: flex; gap: 12px; margin-bottom: 16px;">
            <div data-action="${action}" data-msg-id="${msg.id}" data-verdict="pretext" role="button" tabindex="0" class="btn-secondary" style="${btnStyle('var(--magenta)', '255,45,155')}">FAKE</div>
            <div data-action="${action}" data-msg-id="${msg.id}" data-verdict="genuine" role="button" tabindex="0" class="btn-secondary" style="${btnStyle('var(--lime)', '198,255,0')}">REAL</div>
          </div>
        </div>`;
}

function nextButton(mode) {
  const action = mode === 'bank' ? 'quiz-bank-next' : 'quiz-next';
  return `<div style="margin-top: 16px; text-align: right;"><div data-action="${action}" role="button" tabindex="0" class="btn-primary" style="display: inline-block; cursor: pointer;">NEXT →</div></div>`;
}

function bankHeader(quiz) {
  const answers = Object.values(quiz.quizAnswers || {});
  return `
      <div style="margin-bottom: 16px; display: flex; align-items: center; gap: 12px;">
        <div style="font-family: var(--font-display); font-size: 9px; color: var(--amber); letter-spacing: 2px;">QUIZ MODE</div>
        <div style="font-family: var(--font-mono); font-size: 11px; color: rgba(237,239,243,0.4);">${answers.length} answered · ${answers.filter((a) => a.correct).length} correct</div>
      </div>`;
}

// random: for tests (quiz mode's batch order).
export function renderPhishingQuiz(state, { random = Math.random } = {}) {
  const quiz = getQuizState(state);
  if (!quiz.quizAnswers) quiz.quizAnswers = {};
  const progress = getCuratedProgress(quiz);
  const curatedDone = progress.answered >= progress.total;

  const scoutIntro = "Real or fake? Name the specific detail that told you. The hard ones are the real messages — genuine services send alerts from domains that look fake.";

  let content;
  const showing = quiz.revealing;
  const revealSet = showing && MODES[showing.mode];
  const revealMsg = revealSet?.messages().find((m) => m.id === showing.id);
  const revealRecord = revealMsg && quiz[revealSet.answers]?.[revealMsg.id];

  if (revealMsg && revealRecord) {
    // The message just answered, with its verdict, the tells and NEXT.
    const head = showing.mode === 'bank'
      ? bankHeader(quiz)
      : `<div style="margin-bottom: 12px; font-family: var(--font-display); font-size: 9px; color: rgba(0,229,255,0.4); letter-spacing: 2px;">${CURATED_MESSAGES.indexOf(revealMsg) + 1} OF ${progress.total}</div>`;
    content = `
      ${head}
      ${renderMessageCard(revealMsg)}
      ${renderReveal(revealMsg, revealRecord)}
      ${nextButton(showing.mode)}`;
  } else if (!curatedDone) {
    const msg = getNextCuratedMessage(quiz);
    content = `
      <div style="margin-bottom: 12px; font-family: var(--font-display); font-size: 9px; color: rgba(0,229,255,0.4); letter-spacing: 2px;">${progress.answered + 1} OF ${progress.total}</div>
      ${renderMessageCard(msg)}
      ${verdictForm(msg, 'curated')}`;
  } else {
    const current = currentBankMessage(quiz, random);
    if (!current) {
      const answers = Object.values(quiz.quizAnswers);
      content = `
      <div style="text-align: center; padding: 32px;">
        <div style="font-family: var(--font-display); font-size: 16px; font-weight: 800; color: var(--lime); letter-spacing: 3px;">TRAINING COMPLETE</div>
        <div style="font-size: 14px; color: rgba(237,239,243,0.55); margin-top: 12px;">You've answered every message in the bank. ${answers.filter((a) => a.correct).length}/${answers.length} correct.</div>
      </div>`;
    } else {
      content = `
      ${bankHeader(quiz)}
      ${renderMessageCard(current)}
      ${verdictForm(current, 'bank')}`;
    }
  }

  return `
  <div class="scanlines">
    ${renderHud(state)}
    <div style="display: flex; align-items: center; gap: 16px; padding: 16px 24px;">
      <a class="btn-secondary" style="flex-shrink: 0; padding: 8px 14px; text-decoration: none;" href="#/district/perimeter">← PERIMETER</a>
      <div style="flex: 1;">
        <div style="font-family: var(--font-display); font-size: 16px; font-weight: 800; color: var(--cyan); letter-spacing: 3px; text-shadow: 0 0 16px rgba(0,229,255,0.3);">SCAM DEFENSE TRAINING</div>
      </div>
      <div style="display: flex; gap: 12px; align-items: center;">
        <div class="hud-stat hud-stat--amber" style="flex-shrink: 0;">
          <span class="stat-value" style="color: var(--amber); text-shadow: 0 0 8px rgba(255,159,0,0.3);">${quiz.streak}</span>
          <span class="stat-label" style="color: rgba(255,159,0,0.5);">STREAK</span>
        </div>
        ${quiz.bestStreak > 0 ? `<div class="hud-stat hud-stat--lime" style="flex-shrink: 0;">
          <span class="stat-value" style="color: var(--lime); text-shadow: 0 0 8px rgba(198,255,0,0.3);">${quiz.bestStreak}</span>
          <span class="stat-label" style="color: rgba(198,255,0,0.5);">BEST</span>
        </div>` : ''}
      </div>
    </div>

    <div style="padding: 0 24px 12px;">
      <div style="display: flex; align-items: center; gap: 12px; margin-bottom: 12px;">
        <img src="assets/characters/scout_0.png" style="width: 40px; height: 40px;">
        <div style="flex: 1; font-size: 13px; color: rgba(237,239,243,0.55); font-style: italic; line-height: 1.5;">"${curatedDone ? "You cleared the curated set. Quiz mode pulls from a bigger bank — no tells this time. Trust your instincts." : esc(scoutIntro)}"</div>
      </div>
      ${!curatedDone ? `<div style="margin-bottom: 8px; height: 3px; background: rgba(255,255,255,0.06); overflow: hidden;">
        <div style="width: ${Math.round((progress.answered / progress.total) * 100)}%; height: 100%; background: var(--cyan); transition: width 300ms;"></div>
      </div>
      <div style="font-family: var(--font-mono); font-size: 10px; color: rgba(237,239,243,0.35);">${progress.correct}/${progress.answered} correct${progress.answered > 0 ? ` (${Math.round((progress.correct / progress.answered) * 100)}%)` : ''}</div>` : ''}
    </div>

    <div style="padding: 0 24px 32px;">
      ${content}
    </div>
  </div>`;
}
