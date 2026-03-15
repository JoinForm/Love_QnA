import { FIREBASE_ENABLED, firebaseWebConfig, FIRESTORE_COLLECTION } from './firebase-config.js';

let useFirebase = false;
let db = null;

const STORAGE_KEY = 'loveQnaQuestionsV4';

async function initFirebaseIfPossible() {
  if (!FIREBASE_ENABLED) {
    return;
  }

  try {
    const { initializeApp } = await import('https://www.gstatic.com/firebasejs/10.14.1/firebase-app.js');
    const {
      getFirestore, collection, getDocs, addDoc, updateDoc, deleteDoc, doc, query, orderBy
    } = await import('https://www.gstatic.com/firebasejs/10.14.1/firebase-firestore.js');

    console.log('[Firebase] config =', firebaseWebConfig);

    const app = initializeApp(firebaseWebConfig);
    const firestore = getFirestore(app);

    db = {
      getFirestore, collection, getDocs, addDoc, updateDoc, deleteDoc, doc, query, orderBy,
      instance: firestore
    };

    useFirebase = true;
    console.log('[Firebase] Firestore initialized successfully');
  } catch (error) {
    console.error('[Firebase 초기화 실패]', error);
    alert('Firebase 초기화 실패: ' + (error?.message || error));
    useFirebase = false;
  }
}

function formatDate(dateString) {
  const date = new Date(dateString);
  if (Number.isNaN(date.getTime())) return '-';
  return date.toLocaleString('ko-KR');
}

function escapeHtml(text = '') {
  return text
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#039;');
}

function createId() {
  return 'q_' + Date.now().toString(36) + Math.random().toString(36).slice(2, 7);
}

function renderDday() {
  const start = new Date('2026-03-14T00:00:00');
  const today = new Date();
  const todayOnly = new Date(today.getFullYear(), today.getMonth(), today.getDate());
  const startOnly = new Date(start.getFullYear(), start.getMonth(), start.getDate());

  const diffMs = todayOnly - startOnly;
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

  const ddayEl = document.getElementById('ddayCount');
  if (ddayEl) {
    ddayEl.textContent = diffDays >= 0 ? `D+${diffDays + 1}` : `D${diffDays}`;
  }

  const day100El = document.getElementById('day100Date');
  const day365El = document.getElementById('day365Date');

  const day100 = new Date(startOnly);
  day100.setDate(day100.getDate() + 99);

  const day365 = new Date(startOnly);
  day365.setDate(day365.getDate() + 364);

  const formatShort = (d) => {
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${y}.${m}.${day}`;
  };

  if (day100El) day100El.textContent = formatShort(day100);
  if (day365El) day365El.textContent = formatShort(day365);
}

async function loadQuestions() {
  if (useFirebase && db) {
    try {
      const snap = await db.getDocs(
        db.query(
          db.collection(db.instance, FIRESTORE_COLLECTION),
          db.orderBy('createdAt', 'desc')
        )
      );

      console.log('[Firestore 조회 성공] 문서 수 =', snap.size);

      return snap.docs.map((docSnap) => ({
        ...docSnap.data(),
        id: docSnap.id
      }));
    } catch (error) {
      console.error('[Firestore 조회 실패]', error);
      alert('Firestore 조회 실패: ' + (error?.message || error));
      throw error;
    }
  }

  try {
    const data = JSON.parse(localStorage.getItem(STORAGE_KEY)) || [];
    return data.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
  } catch (error) {
    console.error('질문 로드 실패:', error);
    return [];
  }
}

async function createQuestion(item) {
  if (useFirebase && db) {
    try {
      const ref = await db.addDoc(
        db.collection(db.instance, FIRESTORE_COLLECTION),
        item
      );
      console.log('[Firestore 저장 성공] docId =', ref.id);
      return;
    } catch (error) {
      console.error('[Firestore 저장 실패]', error);
      alert('Firestore 저장 실패: ' + (error?.message || error));
      throw error;
    }
  }

  const current = JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]');
  current.push(item);
  localStorage.setItem(STORAGE_KEY, JSON.stringify(current));
}

async function updateQuestion(id, patch) {
  if (useFirebase && db) {
    await db.updateDoc(db.doc(db.instance, FIRESTORE_COLLECTION, id), patch);
    return;
  }

  const current = JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]');
  const next = current.map((item) => item.id === id ? { ...item, ...patch } : item);
  localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
}

async function removeQuestion(id) {
  try {
    if (useFirebase && db) {
      await db.deleteDoc(db.doc(db.instance, FIRESTORE_COLLECTION, id));
      console.log('삭제 성공:', id);
      return;
    }

    const current = JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]');
    const next = current.filter((item) => item.id !== id);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
    console.log('로컬 삭제 성공:', id);
  } catch (error) {
    console.error('삭제 실패:', error);
    alert('삭제 실패: ' + (error?.message || error));
  }
}

function createQuestionCardForMyPage(item, index, total) {
  const isMine = item.owner === 'me';

  return `
    <article class="question-card">
      <div class="question-header">
        <div>
          <div class="role-chip">${isMine ? '현수가 등록한 질문' : '예지가 등록한 질문'}</div>
          <div class="meta">질문 ${total - index}</div>
          <div class="question-title">${escapeHtml(item.question)}</div>
        </div>
        <div class="meta">등록일 ${formatDate(item.createdAt)}</div>
      </div>

      ${isMine ? `
        <div class="answer-box">
          <div class="answer-label">현수의 답변</div>
          <div>${escapeHtml(item.myAnswer || '').replaceAll('\n', '<br />')}</div>
        </div>

        <div class="answer-box">
          <div class="answer-label">예지의 답변</div>
          <div>${item.partnerAnswer ? escapeHtml(item.partnerAnswer).replaceAll('\n', '<br />') : '<span class="muted">아직 작성되지 않았습니다.</span>'}</div>
        </div>

        <div class="card-actions">
          <button class="btn danger" data-delete-id="${item.id}">질문 삭제</button>
          <div class="status">${item.partnerAnswer ? '예지 답변 완료' : '예지 답변 대기 중'}</div>
        </div>
      ` : `
        <div class="answer-box">
          <div class="answer-label">예지의 답변</div>
          <div>${escapeHtml(item.partnerOwnAnswer || '').replaceAll('\n', '<br />')}</div>
        </div>

        <div class="answer-box">
          <div class="answer-label">현수의 답변은 무엇인가요?</div>
          <textarea class="partner-textarea" data-my-reply-id="${item.id}" placeholder="여기에 현수의 답변을 입력해주세요.">${escapeHtml(item.myReplyToPartnerQuestion || '')}</textarea>
        </div>

        <div class="card-actions">
          <button class="btn primary" data-save-my-reply-id="${item.id}">현수 답변 저장하기</button>
          <div class="status">${item.myReplyToPartnerQuestion ? '현수 답변 저장 완료' : '아직 현수 답변이 없습니다.'}</div>
        </div>
      `}
    </article>
  `;
}

function createQuestionCardForPartnerPage(item, index, total) {
  const isMine = item.owner === 'me';

  return `
    <article class="question-card">
      <div class="question-header">
        <div>
          <div class="role-chip">${isMine ? '현수가 등록한 질문' : '예지가 등록한 질문'}</div>
          <div class="meta">질문 ${total - index}</div>
          <div class="question-title">${escapeHtml(item.question)}</div>
        </div>
        <div class="meta">등록일 ${formatDate(item.createdAt)}</div>
      </div>

      ${isMine ? `
        <div class="answer-box">
          <div class="answer-label">현수는 이렇게 답변했습니다</div>
          <div>${escapeHtml(item.myAnswer || '').replaceAll('\n', '<br />')}</div>
        </div>

        <div class="answer-box">
          <div class="answer-label">예지의 답변은 무엇인가요?</div>
          <textarea class="partner-textarea" data-partner-answer-id="${item.id}" placeholder="여기에 예지의 답변을 입력해주세요.">${escapeHtml(item.partnerAnswer || '')}</textarea>
        </div>

        <div class="card-actions">
          <button class="btn primary" data-save-partner-answer-id="${item.id}">예지 답변 저장하기</button>
          <div class="status">${item.partnerAnswer ? '현재 저장된 답변이 있습니다.' : '아직 저장된 답변이 없습니다.'}</div>
        </div>
      ` : `
        <div class="answer-box">
          <div class="answer-label">예지의 답변</div>
          <div>${escapeHtml(item.partnerOwnAnswer || '').replaceAll('\n', '<br />')}</div>
        </div>

        <div class="answer-box">
          <div class="answer-label">현수의 답변</div>
          <div>${item.myReplyToPartnerQuestion ? escapeHtml(item.myReplyToPartnerQuestion).replaceAll('\n', '<br />') : '<span class="muted">아직 현수의 답변이 작성되지 않았습니다.</span>'}</div>
        </div>

        <div class="card-actions">
          <button class="btn danger" data-delete-id="${item.id}">질문 삭제</button>
          <div class="status">${item.myReplyToPartnerQuestion ? '현수 답변 완료' : '현수 답변 대기 중'}</div>
        </div>
      `}
    </article>
  `;
}

async function renderMyPage() {
  const list = document.getElementById('myQuestionsList');
  const count = document.getElementById('questionCount');
  if (!list || !count) return;

  const questions = await loadQuestions();
  count.textContent = questions.length;

  if (!questions.length) {
    list.className = 'question-list empty-box';
    list.innerHTML = '아직 등록된 질문이 없습니다.';
    return;
  }

  list.className = 'question-list';
  list.innerHTML = questions.map((item, index) => createQuestionCardForMyPage(item, index, questions.length)).join('');

  list.querySelectorAll('[data-delete-id]').forEach((button) => {
    button.addEventListener('click', async () => {
      await removeQuestion(button.dataset.deleteId);
      await renderMyPage();
    });
  });

  list.querySelectorAll('[data-save-my-reply-id]').forEach((button) => {
    button.addEventListener('click', async () => {
      const id = button.dataset.saveMyReplyId;
      const textarea = list.querySelector(`[data-my-reply-id="${id}"]`);
      const value = textarea ? textarea.value.trim() : '';

      await updateQuestion(id, {
        myReplyToPartnerQuestion: value,
        myReplyAt: new Date().toISOString()
      });

      await renderMyPage();
      alert('현수 답변이 저장되었습니다.');
    });
  });
}

async function renderPartnerPage() {
  const list = document.getElementById('partnerQuestionsList');
  const count = document.getElementById('partnerQuestionCount');
  if (!list || !count) return;

  const questions = await loadQuestions();
  count.textContent = questions.length;

  if (!questions.length) {
    list.className = 'question-list empty-box';
    list.innerHTML = '아직 등록된 질문이 없습니다.';
    return;
  }

  list.className = 'question-list';
  list.innerHTML = questions.map((item, index) => createQuestionCardForPartnerPage(item, index, questions.length)).join('');

  list.querySelectorAll('[data-save-partner-answer-id]').forEach((button) => {
    button.addEventListener('click', async () => {
      const id = button.dataset.savePartnerAnswerId;
      const textarea = list.querySelector(`[data-partner-answer-id="${id}"]`);
      const value = textarea ? textarea.value.trim() : '';

      await updateQuestion(id, {
        partnerAnswer: value,
        answeredAt: new Date().toISOString()
      });

      await renderPartnerPage();
      alert('예지 답변이 저장되었습니다.');
    });
  });

  list.querySelectorAll('[data-delete-id]').forEach((button) => {
    button.addEventListener('click', async () => {
      await removeQuestion(button.dataset.deleteId);
      await renderPartnerPage();
    });
  });
}

function bindMyPageActions() {
  const form = document.getElementById('myQuestionForm');
  if (!form) return;

  form.addEventListener('submit', async (event) => {
    event.preventDefault();

    const question = document.getElementById('myQuestionInput').value.trim();
    const myAnswer = document.getElementById('myAnswerInput').value.trim();

    if (!question || !myAnswer) {
      alert('질문과 답변을 모두 입력해주세요.');
      return;
    }

    await createQuestion({
      id: createId(),
      owner: 'me',
      question,
      myAnswer,
      partnerAnswer: '',
      partnerOwnAnswer: '',
      myReplyToPartnerQuestion: '',
      createdAt: new Date().toISOString()
    });

    form.reset();
    await renderMyPage();
    alert('현수 질문이 추가되었습니다.');
  });
}

function bindPartnerPageActions() {
  const form = document.getElementById('partnerQuestionForm');
  if (!form) return;

  form.addEventListener('submit', async (event) => {
    event.preventDefault();

    const question = document.getElementById('partnerQuestionInput').value.trim();
    const partnerOwnAnswer = document.getElementById('partnerOwnAnswerInput').value.trim();

    if (!question || !partnerOwnAnswer) {
      alert('질문과 답변을 모두 입력해주세요.');
      return;
    }

    await createQuestion({
      id: createId(),
      owner: 'partner',
      question,
      myAnswer: '',
      partnerAnswer: '',
      partnerOwnAnswer,
      myReplyToPartnerQuestion: '',
      createdAt: new Date().toISOString()
    });

    form.reset();
    await renderPartnerPage();
    alert('예지 질문이 추가되었습니다.');
  });
}

async function init() {
  renderDday();
  await initFirebaseIfPossible();

  const page = document.body.dataset.page;
  if (page === 'my') {
    bindMyPageActions();
    await renderMyPage();
  } else if (page === 'partner') {
    bindPartnerPageActions();
    await renderPartnerPage();
  }
}

window.addEventListener('DOMContentLoaded', init);
