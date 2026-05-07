/* ══════════════════════════════════════════
   nav.js — Navigation & Cipher UI Controls
   Quản lý lịch sử điều hướng (Undo/Redo),
   soft reload, và các action của cipher.
   ══════════════════════════════════════════ */

// ══════════════════════════════════════════
// NAVIGATION HISTORY
// ══════════════════════════════════════════

function updateNavBtns() {
  var undoBtn   = document.getElementById('btn-undo');
  var redoBtn   = document.getElementById('btn-redo');
  var reloadBtn = document.getElementById('btn-reload');

  reloadBtn.style.display = 'flex';

  if (!_loggedIn) {
    undoBtn.disabled = true;
    redoBtn.disabled = true;
    return;
  }

  undoBtn.disabled = _hidx <= 1;
  redoBtn.disabled = _hidx >= _hist.length - 1;
}

/**
 * Thêm một state mới vào lịch sử điều hướng.
 * @param {string} s  — ví dụ 'log', 'main-d', 'main-e'
 */
function navPush(s) {
  if (_hidx >= 0 && _hist[_hidx] === s) return; // tránh duplicate liền kề
  _hist = _hist.slice(0, _hidx + 1);
  _hist.push(s);
  _hidx = _hist.length - 1;
  updateNavBtns();
}

function navUndo() {
  if (!_loggedIn || _hidx <= 1) return;
  _hidx--;
  applyNav(_hist[_hidx]);
  updateNavBtns();
}

function navRedo() {
  if (!_loggedIn || _hidx >= _hist.length - 1) return;
  _hidx++;
  applyNav(_hist[_hidx]);
  updateNavBtns();
}

/**
 * Reload mềm — làm mới data mà không cần reload trang.
 */
function softReload() {
  var btn = document.getElementById('btn-reload');
  var svg = btn.querySelector('svg');
  svg.classList.add('spin-anim');
  setTimeout(function() { svg.classList.remove('spin-anim'); }, 600);

  if (!_loggedIn) {
    // Trên màn hình lock: xoá input, focus lại
    document.getElementById('pw-input').value = '';
    document.getElementById('pw-input').focus();
  } else {
    var s = _hist[_hidx];
    if (s === 'log') {
      loadLogs();
    } else {
      run();
    }
    showToast('✓ Data refreshed');
  }
}

/**
 * Áp dụng một navigation state: hiện đúng màn hình.
 * @param {string} s
 */
function applyNav(s) {
  var logEl  = document.getElementById('log-screen');
  var mainEl = document.getElementById('main-wrap');
  logEl.style.display  = 'none';
  mainEl.style.display = 'none';

  if (s === 'log') {
    logEl.style.display = 'block';
    if (_allLogs.length > 0) {
      var statusEl = document.getElementById('log-status');
      if (statusEl) statusEl.style.display = 'none';
      renderLogs();
      renderIpStats();
    } else {
      loadLogs();
    }
  } else {
    mainEl.style.display = 'block';
    var mode = (s === 'main-e') ? 'e' : 'd';
    _mode = mode;
    _applyMode(mode);
  }
}

// ══════════════════════════════════════════
// CIPHER UI CONTROLS
// ══════════════════════════════════════════

/**
 * Chuyển tab mã hoá / giải mã.
 * @param {'d'|'e'} m
 */
function setMode(m) {
  _mode = m;
  _applyMode(m);
  clr();
  if (_loggedIn) navPush('main-' + m);
}

function _applyMode(m) {
  document.getElementById('tab-d').classList.toggle('active', m === 'd');
  document.getElementById('tab-e').classList.toggle('active', m === 'e');
  document.getElementById('lbl-in').textContent  = m === 'd' ? 'Enter cipher' : 'Enter text';
  document.getElementById('lbl-out').textContent = m === 'd' ? 'Decoded text' : 'Encoded text';
  document.getElementById('inp').placeholder     = m === 'd' ? 'Enter cipher to decode...' : 'Enter text to encode...';
}

/**
 * Dịch nội dung textarea và hiện kết quả.
 * Nếu decode thành công đúng secret message → hiện congrats.
 */
function run() {
  var v = document.getElementById('inp').value.trim();
  var o = document.getElementById('out');

  if (!v) {
    o.textContent = '';
    o.classList.add('empty');
    _lastCongratulatedText = '';
    return;
  }

  var translated = window._tr(v, _mode);
  o.textContent = translated;
  o.classList.remove('empty');

  // Kiểm tra congrats chỉ ở chế độ decode và không phải Founder
  if (_mode === 'd' && _loggedIn && _currentLoginRole !== 'founder') {
    var targetSecret = currentSecretMsgs[_currentLoginRole];
    if (targetSecret) {
      var isCipherSecret = !LETTER_REGEX.test(targetSecret);
      if (isCipherSecret && v === targetSecret.trim()) {
        if (_lastCongratulatedText !== targetSecret.trim()) {
          _lastCongratulatedText = targetSecret.trim();
          showCongrats(translated);
        }
      } else {
        _lastCongratulatedText = '';
      }
    }
  }
}

// Live sync: chạy ngay khi người dùng gõ
function syncLive() { run(); }

function clr() {
  document.getElementById('inp').value = '';
  var o = document.getElementById('out');
  o.textContent = '';
  o.classList.add('empty');
  _lastCongratulatedText = '';
}

function cp() {
  var t = document.getElementById('out').textContent;
  if (!t) return;
  if (navigator.clipboard && window.isSecureContext) {
    navigator.clipboard.writeText(t)
      .then(function()  { showToast('✓ Copied to clipboard!'); })
      .catch(function() { fbCopy(t); });
  } else {
    fbCopy(t);
  }
}