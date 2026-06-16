// background.js - Service Worker

const STORAGE_KEY = 'vocab-learning-extension';
const DEFAULT_API_URL = 'http://localhost:3000/api/vocabulary';

// ─── Message handler ──────────────────────────────────────────────────────────
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {

  // Content script đẩy token lên khi trang app load
  if (message?.type === 'SYNC_TOKEN') {
    const token = message.payload?.token;
    if (token) {
      chrome.storage.local.set({ 'vocab_auth_token': token });
      console.log('[VocabExt] Token synced from app.');
    } else {
      chrome.storage.local.remove('vocab_auth_token');
      console.log('[VocabExt] Token removed (logout).');
    }
    return;
  }

  if (message?.type === 'VOCAB_SAVED') {
    chrome.action.setBadgeText({ text: '✓', tabId: sender.tab?.id });
    chrome.action.setBadgeBackgroundColor({ color: '#22c55e', tabId: sender.tab?.id });
    setTimeout(() => chrome.action.setBadgeText({ text: '', tabId: sender.tab?.id }), 2000);
  }

  if (message?.type === 'VOCAB_SAVE_ERROR') {
    chrome.action.setBadgeText({ text: '!', tabId: sender.tab?.id });
    chrome.action.setBadgeBackgroundColor({ color: '#ef4444', tabId: sender.tab?.id });
    setTimeout(() => chrome.action.setBadgeText({ text: '', tabId: sender.tab?.id }), 2000);
  }

  if (message?.type === 'CHECK_AUTH') {
    checkAuth().then(result => sendResponse(result));
    return true;
  }

  if (message?.type === 'SAVE_WORD') {
    handleSaveWord(message.payload).then(result => sendResponse(result));
    return true; // async response
  }
});

// ─── Kiểm tra auth ────────────────────────────────────────────────────────────
async function checkAuth() {
  const token = await getAuthToken();
  if (!token) return { authenticated: false };

  const settings = await getSettings();
  const apiUrl   = settings.apiUrl || DEFAULT_API_URL;

  try {
    const res = await fetch(apiUrl, {
      headers: { Authorization: `Bearer ${token}` }
    });
    const data = await res.json();
    if (data.authenticated) {
      return { authenticated: true, email: data.user.email };
    }
    await chrome.storage.local.remove('vocab_auth_token');
    return { authenticated: false };
  } catch {
    return { authenticated: false };
  }
}

// ─── Context menu ─────────────────────────────────────────────────────────────
chrome.runtime.onInstalled.addListener(() => {
  chrome.contextMenus.create({
    id: 'vocab-add-word',
    title: 'Add "%s" to Vocabulary',
    contexts: ['selection']
  });
});

chrome.contextMenus.onClicked.addListener(async (info, tab) => {
  if (info.menuItemId === 'vocab-add-word' && info.selectionText) {
    const result = await handleSaveWord({ text: info.selectionText.trim() });
    chrome.tabs.sendMessage(tab.id, {
      type: result.success ? 'VOCAB_SAVED' : 'VOCAB_SAVE_ERROR',
      payload: { text: info.selectionText.trim(), ...result }
    });
  }
});

// ─── Lấy token từ chrome.storage (đã được sync bởi content script) ────────────
async function getAuthToken() {
  try {
    const result = await chrome.storage.local.get('vocab_auth_token');
    return result['vocab_auth_token'] || null;
  } catch {
    return null;
  }
}

// ─── Lưu word ─────────────────────────────────────────────────────────────────
async function handleSaveWord({ text, setName }) {
  if (!text) return { success: false, error: 'Empty text' };

  const settings = await getSettings();
  const apiUrl = settings.apiUrl || DEFAULT_API_URL;
  const token = await getAuthToken();

  if (!token) {
    const appUrl = settings.appUrl || 'http://localhost:3000';
    return { success: false, error: `Chưa đăng nhập! Vào ${appUrl} để đăng nhập.` };
  }

  try {
    const response = await fetch(apiUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify({
        text,
        defaultSetName: setName || settings.defaultSetName || 'Extension Saved Words'
      })
    });

    if (!response.ok) {
      const errorText = await response.text();
      // Token hết hạn — xóa để user biết cần đăng nhập lại
      if (response.status === 401) {
        await chrome.storage.local.remove('vocab_auth_token');
        return { success: false, error: 'Phiên đăng nhập hết hạn. Vào app để đăng nhập lại.' };
      }
      return { success: false, error: `HTTP ${response.status}: ${errorText}` };
    }

    const data = await response.json();
    return { success: true, data, alreadyExists: data.alreadyExists };
  } catch (error) {
    return { success: false, error: error.message };
  }
}

// ─── Settings ─────────────────────────────────────────────────────────────────
async function getSettings() {
  try {
    const result = await chrome.storage.sync.get(STORAGE_KEY);
    return result[STORAGE_KEY] || {};
  } catch {
    return {};
  }
}
