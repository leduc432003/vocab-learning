// popup.js
const STORAGE_KEY = 'vocab-learning-extension';
const DEFAULT_API_URL = 'http://localhost:3000/api/vocabulary';
const DEFAULT_APP_URL = 'http://localhost:3000';
const DEFAULT_SET_NAME = 'Extension Saved Words';
const MAX_RECENT = 10;

let currentSelectedText = '';

// DOM refs
const selectedWordEl  = document.getElementById('selected-word');
const manualInputEl   = document.getElementById('manual-input');
const btnSave         = document.getElementById('btn-save');
const btnSaveLabel    = document.getElementById('btn-save-label');
const toastEl         = document.getElementById('toast');
const recentListEl    = document.getElementById('recent-list');
const settingsToggleEl = document.getElementById('settings-toggle');
const settingsPanelEl = document.getElementById('settings-panel');
const appUrlInput     = document.getElementById('app-url');
const apiUrlInput     = document.getElementById('api-url');
const defaultSetInput = document.getElementById('default-set');
const btnSaveSettings = document.getElementById('btn-save-settings');
const authStatusEl    = document.getElementById('auth-status');

let toastTimer = null;

// ─── Toast ────────────────────────────────────────────────────────────────────
function showToast(message, type = 'info') {
  toastEl.textContent = message;
  toastEl.className = `toast show ${type}`;
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => { toastEl.className = 'toast'; }, 3000);
}

// ─── Lấy token từ storage ─────────────────────────────────────────────────────
async function getAuthToken() {
  const stored = await chrome.storage.local.get('vocab_auth_token');
  return stored['vocab_auth_token'] || null;
}

// ─── Settings ─────────────────────────────────────────────────────────────────
async function getSettings() {
  const result = await chrome.storage.sync.get(STORAGE_KEY);
  return result[STORAGE_KEY] || {};
}

async function loadSettings() {
  const s = await getSettings();
  if (appUrlInput)   appUrlInput.value   = s.appUrl   || DEFAULT_APP_URL;
  if (apiUrlInput)   apiUrlInput.value   = s.apiUrl   || DEFAULT_API_URL;
  if (defaultSetInput) defaultSetInput.value = s.defaultSetName || DEFAULT_SET_NAME;
}

async function saveSettings() {
  const appUrl = (appUrlInput?.value || DEFAULT_APP_URL).trim().replace(/\/$/, '');
  const apiUrl = (apiUrlInput?.value || '').trim() || `${appUrl}/api/vocabulary`;
  const settings = { appUrl, apiUrl, defaultSetName: defaultSetInput?.value.trim() || DEFAULT_SET_NAME };
  await chrome.storage.sync.set({ [STORAGE_KEY]: settings });
  showToast('Đã lưu settings!', 'success');
  await checkAuthStatus();
}

// ─── Auth Status ──────────────────────────────────────────────────────────────
async function checkAuthStatus() {
  if (!authStatusEl) return;
  authStatusEl.textContent = 'Đang kiểm tra…';
  authStatusEl.className = 'auth-status loading';

  const token = await getAuthToken();
  const s     = await getSettings();
  const appUrl = s.appUrl || DEFAULT_APP_URL;

  if (!token) {
    authStatusEl.innerHTML = `⚠ Chưa đăng nhập — <a href="${appUrl}" target="_blank" style="color:#93c5fd;text-decoration:underline">mở app</a> để đăng nhập`;
    authStatusEl.className = 'auth-status error';
    return;
  }

  // Dùng background để verify (tránh CORS trong popup context)
  try {
    const result = await chrome.runtime.sendMessage({ type: 'CHECK_AUTH' });
    if (result?.authenticated) {
      authStatusEl.textContent = `✓ ${result.email}`;
      authStatusEl.className = 'auth-status success';
    } else {
      authStatusEl.innerHTML = `⚠ Phiên hết hạn — <a href="${appUrl}" target="_blank" style="color:#93c5fd;text-decoration:underline">đăng nhập lại</a>`;
      authStatusEl.className = 'auth-status error';
    }
  } catch {
    authStatusEl.textContent = '⚠ Không thể kết nối tới app';
    authStatusEl.className = 'auth-status error';
  }
}

// ─── Recent Words ─────────────────────────────────────────────────────────────
async function loadRecent() {
  const result = await chrome.storage.local.get('vocab-recent');
  renderRecent(result['vocab-recent'] || []);
}

function renderRecent(recent) {
  recentListEl.innerHTML = '';
  if (!recent.length) {
    recentListEl.innerHTML = '<div class="recent-empty">Chưa có từ nào được lưu.</div>';
    return;
  }
  recent.slice(0, 5).forEach(word => {
    const el = document.createElement('div');
    el.className = 'recent-item';
    el.textContent = word;
    recentListEl.appendChild(el);
  });
}

async function addToRecent(word) {
  const result  = await chrome.storage.local.get('vocab-recent');
  const recent  = result['vocab-recent'] || [];
  const updated = [word, ...recent.filter(w => w !== word)].slice(0, MAX_RECENT);
  await chrome.storage.local.set({ 'vocab-recent': updated });
  renderRecent(updated);
}

// ─── Save Word — gửi qua background (không bị CORS) ──────────────────────────
async function saveWord(text) {
  const word = text?.trim();
  if (!word) return;

  btnSave.disabled = true;
  btnSaveLabel.textContent = 'Đang lưu…';

  try {
    // Gửi qua background service worker
    const result = await chrome.runtime.sendMessage({
      type: 'SAVE_WORD',
      payload: { text: word }
    });

    if (result?.success) {
      await addToRecent(word);
      if (result.alreadyExists) {
        showToast(`📚 "${word}" đã có trong từ vựng!`, 'info');
      } else {
        showToast(`✓ "${word}" đã được lưu! 🎉`, 'success');
      }
      // Xóa input thủ công sau khi lưu
      if (manualInputEl) manualInputEl.value = '';
    } else {
      showToast(`Lỗi: ${result?.error || 'Unknown error'}`, 'error');
      // Nếu lỗi auth thì cập nhật status
      if (result?.error?.includes('đăng nhập') || result?.error?.includes('hết hạn')) {
        await checkAuthStatus();
      }
    }
  } catch (err) {
    showToast(`Lỗi: ${err.message}`, 'error');
  } finally {
    btnSave.disabled = false;
    btnSaveLabel.textContent = 'Lưu vào từ vựng';
  }
}

// ─── Get selected text from active tab ───────────────────────────────────────
async function getSelectedTextFromTab() {
  try {
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
    if (!tab?.id) return '';
    const results = await chrome.scripting.executeScript({
      target: { tabId: tab.id },
      func: () => window.getSelection()?.toString().trim() || ''
    });
    return results?.[0]?.result || '';
  } catch {
    return '';
  }
}

// ─── Lấy từ hiện tại cần lưu (highlight hoặc manual input) ──────────────────
function getWordToSave() {
  const manual = manualInputEl?.value?.trim();
  if (manual) return manual;
  return currentSelectedText;
}

// ─── Init ─────────────────────────────────────────────────────────────────────
async function init() {
  await loadSettings();
  await loadRecent();
  await checkAuthStatus();

  // Lấy text đang highlight ở tab hiện tại
  const selectedText = await getSelectedTextFromTab();
  if (selectedText) {
    currentSelectedText = selectedText;
    selectedWordEl.textContent = selectedText;
    selectedWordEl.classList.remove('placeholder');
    btnSave.disabled = false;
  }

  // Manual input → enable/disable nút save
  manualInputEl?.addEventListener('input', () => {
    const val = manualInputEl.value.trim();
    btnSave.disabled = !val && !currentSelectedText;
  });

  // Enter trong input → save luôn
  manualInputEl?.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') {
      const word = getWordToSave();
      if (word) saveWord(word);
    }
  });

  settingsToggleEl?.addEventListener('click', () => {
    settingsPanelEl.classList.toggle('hidden');
  });

  btnSaveSettings?.addEventListener('click', saveSettings);

  btnSave.addEventListener('click', () => {
    const word = getWordToSave();
    if (word) saveWord(word);
  });
}

init();
