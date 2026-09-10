import { CURATED_MESSAGES, MESSAGE_BANK, TYPE_LABELS, DIFFICULTY_COLORS } from '../data/phishing.js';
import { renderHud } from '../components/hud.js';

function esc(value) {
  return String(value)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

function getQuizState(state) {
  if (!state.phishingQuiz) {
    state.phishingQuiz = { curated: {}, streak: 0, bestStreak: 0, quizRound: 0, quizAnswers: {} };
  }
  return state.phishingQuiz;
}

function shuffleArray(arr) {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
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

function renderReveal(msg, answer, isCorrect) {
  const correctColor = isCorrect ? 'var(--lime)' : 'var(--magenta)';
  const correctBg = isCorrect ? 'rgba(198,255,0,0.06)' : 'rgba(255,45,155,0.06)';
  const correctBorder = isCorrect ? 'rgba(198,255,0,0.2)' : 'rgba(255,45,155,0.2)';
  const answerLabel = msg.answer === 'pretext' ? 'FAKE' : 'REAL';

  let tellsHtml = '';
  if (msg.tells && msg.tells.length > 0) {
    tellsHtml = msg.tells.map(t =>
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
  <div style="margin-top: 16px; padding: 16px; background: ${correctBg}; border: 1px solid ${correctBorder};">
    <div style="font-family: var(--font-display); font-size: 12px; font-weight: 700; color: ${correctColor}; letter-spacing: 2px; margin-bottom: 10px;">
      ${isCorrect ? '✓ CORRECT' : '✗ WRONG'} — THIS IS ${answerLabel}
    </div>
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

function getQuizBatchMessages(quiz) {
  const answered = new Set(Object.keys(quiz.quizAnswers).map(Number));
  const available = MESSAGE_BANK.filter(m => !answered.has(m.id));
  if (available.length === 0) return [];
  return shuffleArray(available).slice(0, 5);
}

export function renderPhishingQuiz(state) {
  const quiz = getQuizState(state);
  const progress = getCuratedProgress(quiz);
  const curatedDone = progress.answered >= progress.total;

  const scoutIntro = "Real or fake? Name the specific detail that told you. The hard ones are the real messages — genuine services send alerts from domains that look fake.";

  let content;

  if (!curatedDone) {
    const msg = getNextCuratedMessage(quiz);
    if (!msg) {
      content = '<div style="padding: 32px; text-align: center; color: rgba(237,239,243,0.5);">All curated messages completed.</div>';
    } else {
      const existing = quiz.curated[msg.id];
      content = `
      <div style="margin-bottom: 12px; font-family: var(--font-display); font-size: 9px; color: rgba(0,229,255,0.4); letter-spacing: 2px;">${progress.answered + 1} OF ${progress.total}</div>
      ${renderMessageCard(msg)}
      ${existing ? renderReveal(msg, existing.verdict, existing.correct) : `
        <div style="margin-top: 20px;">
          <div style="display: flex; gap: 12px; margin-bottom: 16px;">
            <div data-action="quiz-verdict" data-msg-id="${msg.id}" data-verdict="pretext" class="btn-secondary" style="flex: 1; text-align: center; padding: 14px; cursor: pointer; font-family: var(--font-display); font-size: 12px; font-weight: 700; letter-spacing: 2px; color: var(--magenta); border-color: rgba(255,45,155,0.3); background: rgba(255,45,155,0.05);">FAKE</div>
            <div data-action="quiz-verdict" data-msg-id="${msg.id}" data-verdict="genuine" class="btn-secondary" style="flex: 1; text-align: center; padding: 14px; cursor: pointer; font-family: var(--font-display); font-size: 12px; font-weight: 700; letter-spacing: 2px; color: var(--lime); border-color: rgba(198,255,0,0.3); background: rgba(198,255,0,0.05);">REAL</div>
          </div>
          <div style="margin-bottom: 12px;">
            <div style="font-family: var(--font-display); font-size: 8px; color: rgba(0,229,255,0.4); letter-spacing: 2px; margin-bottom: 6px;">THE TELL</div>
            <input type="text" data-quiz-tell="${msg.id}" placeholder="What made you decide?" style="width: 100%; padding: 10px 14px; background: rgba(26,31,43,0.6); border: 1px solid rgba(0,229,255,0.15); color: var(--offwhite); font-family: var(--font-body); font-size: 13px; outline: none;">
          </div>
        </div>
      `}
      ${existing ? `<div style="margin-top: 16px; text-align: right;"><div data-action="quiz-next" class="btn-primary" style="display: inline-block; cursor: pointer;">NEXT →</div></div>` : ''}
      `;
    }
  } else {
    const quizBatch = getQuizBatchMessages(quiz);
    const bankAnswered = Object.keys(quiz.quizAnswers).length;
    const bankCorrect = Object.values(quiz.quizAnswers).filter(a => a.correct).length;

    if (quizBatch.length === 0) {
      content = `
      <div style="text-align: center; padding: 32px;">
        <div style="font-family: var(--font-display); font-size: 16px; font-weight: 800; color: var(--lime); letter-spacing: 3px;">TRAINING COMPLETE</div>
        <div style="font-size: 14px; color: rgba(237,239,243,0.55); margin-top: 12px;">You've answered every message in the bank. ${bankCorrect}/${bankAnswered} correct.</div>
      </div>`;
    } else {
      const currentBankMsg = quizBatch[0];
      const bankExisting = quiz.quizAnswers[currentBankMsg.id];

      content = `
      <div style="margin-bottom: 16px; display: flex; align-items: center; gap: 12px;">
        <div style="font-family: var(--font-display); font-size: 9px; color: var(--amber); letter-spacing: 2px;">QUIZ MODE</div>
        <div style="font-family: var(--font-mono); font-size: 11px; color: rgba(237,239,243,0.4);">${bankAnswered} answered · ${bankCorrect} correct</div>
      </div>
      ${renderMessageCard(currentBankMsg)}
      ${bankExisting ? renderReveal(currentBankMsg, bankExisting.verdict, bankExisting.correct) : `
        <div style="margin-top: 20px;">
          <div style="display: flex; gap: 12px; margin-bottom: 16px;">
            <div data-action="quiz-bank-verdict" data-msg-id="${currentBankMsg.id}" data-verdict="pretext" class="btn-secondary" style="flex: 1; text-align: center; padding: 14px; cursor: pointer; font-family: var(--font-display); font-size: 12px; font-weight: 700; letter-spacing: 2px; color: var(--magenta); border-color: rgba(255,45,155,0.3); background: rgba(255,45,155,0.05);">FAKE</div>
            <div data-action="quiz-bank-verdict" data-msg-id="${currentBankMsg.id}" data-verdict="genuine" class="btn-secondary" style="flex: 1; text-align: center; padding: 14px; cursor: pointer; font-family: var(--font-display); font-size: 12px; font-weight: 700; letter-spacing: 2px; color: var(--lime); border-color: rgba(198,255,0,0.3); background: rgba(198,255,0,0.05);">REAL</div>
          </div>
          <div style="margin-bottom: 12px;">
            <div style="font-family: var(--font-display); font-size: 8px; color: rgba(0,229,255,0.4); letter-spacing: 2px; margin-bottom: 6px;">THE TELL</div>
            <input type="text" data-quiz-bank-tell="${currentBankMsg.id}" placeholder="What tipped you off?" style="width: 100%; padding: 10px 14px; background: rgba(26,31,43,0.6); border: 1px solid rgba(0,229,255,0.15); color: var(--offwhite); font-family: var(--font-body); font-size: 13px; outline: none;">
          </div>
        </div>
      `}
      ${bankExisting ? `<div style="margin-top: 16px; text-align: right;"><div data-action="quiz-bank-next" class="btn-primary" style="display: inline-block; cursor: pointer;">NEXT →</div></div>` : ''}
      `;
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
