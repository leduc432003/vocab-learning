(() => {
  'use strict';

  // Avoid injecting twice (e.g. SPA navigation)
  if (window.__vocabExtLoaded) return;
  window.__vocabExtLoaded = true;

  const STORAGE_KEY = 'vocab-learning-extension';

  // ─── Helper: kiểm tra extension context còn hợp lệ không ────────────────────
  function isExtensionValid() {
    try {
      // Nếu context bị invalidate, chrome.runtime.id sẽ là undefined
      return !!chrome?.runtime?.id;
    } catch {
      return false;
    }
  }

  // ─── Helper: gửi message an toàn, không crash khi context invalidated ────────
  async function safeSendMessage(msg) {
    if (!isExtensionValid()) return null;
    try {
      return await chrome.runtime.sendMessage(msg);
    } catch (e) {
      // "Extension context invalidated" hoặc "Could not establish connection"
      console.warn('[VocabExt] sendMessage failed:', e.message);
      return null;
    }
  }

  // ─── Sync token từ localStorage của app lên chrome.storage ──────────────────
  function syncTokenToExtStorage() {
    if (!isExtensionValid()) return;
    try {
      const token = localStorage.getItem('vocab_ext_token');
      if (token) {
        safeSendMessage({ type: 'SYNC_TOKEN', payload: { token } });
      }
    } catch (e) {
      // trang không phải app, bỏ qua
    }
  }

  syncTokenToExtStorage();

  window.addEventListener('vocab_token_updated', (e) => {
    if (e.detail?.token) {
      safeSendMessage({ type: 'SYNC_TOKEN', payload: { token: e.detail.token } });
    }
  });

  let btn = null;
  let currentText = '';

  // ─── Create floating button with INLINE styles (immune to page CSS) ─────────
  function createBtn() {
    if (btn) return;

    btn = document.createElement('button');
    btn.setAttribute('data-vocab-ext', 'true');
    btn.setAttribute('aria-label', 'Lưu vào từ vựng');
    btn.type = 'button';

    // All styles inline → never overridden by page CSS
    Object.assign(btn.style, {
      position:        'fixed',
      zIndex:          '2147483647',
      display:         'none',
      alignItems:      'center',
      gap:             '6px',
      padding:         '8px 16px',
      background:      'linear-gradient(135deg,#1e293b,#0f172a)',
      color:           '#f8fafc',
      border:          '1.5px solid rgba(255,255,255,0.15)',
      borderRadius:    '999px',
      fontFamily:      '-apple-system,BlinkMacSystemFont,"Segoe UI",sans-serif',
      fontSize:        '13px',
      fontWeight:      '700',
      letterSpacing:   '0.03em',
      cursor:          'pointer',
      boxShadow:       '0 8px 32px rgba(0,0,0,0.45),0 2px 8px rgba(0,0,0,0.25)',
      transform:       'translateX(-50%)',
      transition:      'opacity 0.15s,transform 0.15s',
      whiteSpace:      'nowrap',
      userSelect:      'none',
      pointerEvents:   'auto',
      outline:         'none',
      lineHeight:      '1',
    });

    btn.innerHTML = '&#128218; Lưu vào từ vựng';

    btn.addEventListener('mouseenter', () => {
      btn.style.background = 'linear-gradient(135deg,#334155,#1e293b)';
    });
    btn.addEventListener('mouseleave', () => {
      btn.style.background = 'linear-gradient(135deg,#1e293b,#0f172a)';
    });

    btn.addEventListener('click', onBtnClick);

    // Prevent mousedown from clearing the selection
    btn.addEventListener('mousedown', e => e.preventDefault());

    document.documentElement.appendChild(btn);
  }

  // ─── Show button near the selection ─────────────────────────────────────────
  function showBtn(text) {
    if (!btn) createBtn();

    const sel = window.getSelection();
    if (!sel || sel.rangeCount === 0) return;

    const rect = sel.getRangeAt(0).getBoundingClientRect();
    if (!rect || rect.width === 0) return;

    // viewport-based (fixed positioning)
    const top  = Math.max(8, rect.top - 44);
    const left = Math.min(
      window.innerWidth - 10,
      Math.max(80, rect.left + rect.width / 2)
    );

    btn.style.top     = top + 'px';
    btn.style.left    = left + 'px';
    btn.style.display = 'flex';
    btn.style.opacity = '1';
  }

  function hideBtn() {
    if (btn) {
      btn.style.display  = 'none';
      btn.style.opacity  = '0';
    }
  }

  // ─── Selection detection ─────────────────────────────────────────────────────
  let selTimer = null;

  function checkSelection() {
    clearTimeout(selTimer);
    selTimer = setTimeout(() => {
      const sel = window.getSelection();
      const text = sel ? sel.toString().trim() : '';

      // Ignore selections shorter than 1 char or same as button label
      if (text.length < 1 || text === btn?.textContent?.trim()) {
        hideBtn();
        currentText = '';
        return;
      }

      currentText = text;
      showBtn(text);
    }, 120); // small delay so selection is fully rendered
  }

  // ─── Save word via background script ─────────────────────────────────────────
  async function onBtnClick(e) {
    e.preventDefault();
    e.stopPropagation();

    const textToSave = currentText;
    if (!textToSave) return;

    hideBtn();
    currentText = '';

    // Extension bị invalidate (reload sau khi cài) → hướng dẫn user
    if (!isExtensionValid()) {
      showToast('⚠ Extension vừa được cập nhật, hãy reload lại trang này.', 'error');
      return;
    }

    showToast('⏳ Đang lưu…', 'info');

    const result = await safeSendMessage({
      type: 'SAVE_WORD',
      payload: { text: textToSave }
    });

    if (result === null) {
      showToast('⚠ Extension lỗi — hãy reload lại trang (F5).', 'error');
      return;
    }

    if (result?.success) {
      if (result.alreadyExists) {
        showToast(`📚 "${textToSave}" đã có trong từ vựng!`, 'info');
      } else {
        showToast(`✓ Đã lưu "${textToSave}"!`, 'success');
      }
    } else {
      const msg = result?.error || 'Unknown error';
      if (msg.includes('đăng nhập') || msg.includes('401') || msg.toLowerCase().includes('unauthorized')) {
        showToast('⚠ Chưa đăng nhập! Mở localhost:3000 để đăng nhập.', 'error');
      } else {
        showToast('✗ ' + msg, 'error');
      }
    }
  }

  // ─── Toast notification ──────────────────────────────────────────────────────
  let toastEl = null;
  let toastTimer = null;

  function showToast(message, type = 'info') {
    if (!toastEl) {
      toastEl = document.createElement('div');
      Object.assign(toastEl.style, {
        position:     'fixed',
        bottom:       '24px',
        right:        '24px',
        zIndex:       '2147483646',
        padding:      '12px 18px',
        borderRadius: '12px',
        fontFamily:   '-apple-system,BlinkMacSystemFont,"Segoe UI",sans-serif',
        fontSize:     '13px',
        fontWeight:   '600',
        boxShadow:    '0 8px 32px rgba(0,0,0,0.4)',
        maxWidth:     '300px',
        pointerEvents:'none',
        transition:   'opacity 0.2s,transform 0.2s',
        opacity:      '0',
        transform:    'translateY(10px)',
      });
      document.documentElement.appendChild(toastEl);
    }

    const colors = {
      success: { bg: '#14532d', border: '#22c55e', color: '#86efac' },
      error:   { bg: '#450a0a', border: '#ef4444', color: '#fca5a5' },
      info:    { bg: '#1e3a5f', border: '#3b82f6', color: '#93c5fd' },
    };
    const c = colors[type] || colors.info;
    Object.assign(toastEl.style, {
      background:  c.bg,
      border:      `1px solid ${c.border}44`,
      color:       c.color,
    });

    toastEl.textContent = message;
    toastEl.style.opacity   = '1';
    toastEl.style.transform = 'translateY(0)';

    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => {
      toastEl.style.opacity   = '0';
      toastEl.style.transform = 'translateY(10px)';
    }, 3000);
  }

  // ─── Event listeners ─────────────────────────────────────────────────────────
  document.addEventListener('mouseup',  checkSelection, true);
  document.addEventListener('keyup',    checkSelection, true);
  document.addEventListener('touchend', checkSelection, true);

  // Hide on click outside
  document.addEventListener('mousedown', e => {
    if (e.target !== btn) {
      hideBtn();
    }
  }, true);

  // Reposition on scroll/resize
  window.addEventListener('scroll', () => {
    if (currentText) checkSelection();
  }, { passive: true });

  window.addEventListener('resize', () => {
    if (currentText) checkSelection();
  });

  // Init button early
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', createBtn, { once: true });
  } else {
    createBtn();
  }
})();
