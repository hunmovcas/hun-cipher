/* ══════════════════════════════════════════
   menus.js — Dropdown menus & config dialogs
   Quản lý open/close menu, các dialog chỉnh sửa
   nội dung (title, hints, popups, notes, secret).
   ══════════════════════════════════════════ */

// ══════════════════════════════════════════
// MENU MANAGEMENT
// ══════════════════════════════════════════

function closeAllMenus() {
  _profileOpen = _trafficOpen = _authOpen = _notiOpen = _switchOpen = false;
  document.querySelectorAll('.dropdown-menu.open').forEach(function(el) { el.classList.remove('open'); });
}

function toggleMenu(e, menuVarName, menuId) {
  e.stopPropagation();
  var wasOpen = window[menuVarName];
  closeAllMenus();
  if (!wasOpen) {
    window[menuVarName] = true;
    document.getElementById(menuId).classList.add('open');
  }
}

function toggleProfileMenu(e) { toggleMenu(e, '_profileOpen', 'profile-dropdown'); }
function toggleTrafficMenu(e) { toggleMenu(e, '_trafficOpen', 'traffic-dropdown'); }
function toggleAuthMenu(e)    { toggleMenu(e, '_authOpen',    'auth-dropdown'); }
function toggleNoti(e)        { toggleMenu(e, '_notiOpen',    'noti-dropdown'); }

function toggleSwitchMenu(e) {
  e.stopPropagation();
  if (sessionStorage.getItem('hun_known_founder') !== 'true') {
    document.getElementById('admin-deny-overlay').classList.add('open');
    closeAllMenus();
    return;
  }
  toggleMenu(e, '_switchOpen', 'switch-dropdown');
}

function closeAdminDenyModal() {
  document.getElementById('admin-deny-overlay').classList.remove('open');
}

// Close menus on outside click
document.addEventListener('click', function(e) {
  if (!e.target.closest('.cnt') && !e.target.closest('.dropdown-menu')) {
    closeAllMenus();
  }
});

// ══════════════════════════════════════════
// NOTIFICATIONS
// ══════════════════════════════════════════

function markAllNotiRead(e) {
  e.stopPropagation();
  if (!db) return;
  var updates = {};
  _allNoti.forEach(function(n) { if (!n.read) updates[n._k + '/read'] = true; });
  db.ref('notifications').update(updates);
}

// ══════════════════════════════════════════
// COUNTER ADJUST & RESET DIALOGS
// ══════════════════════════════════════════

var COUNTER_LABELS = {
  outer:           '👁',
  inner_normal:    '🔑',
  inner_secondary: '🗝',
  admin:           '★',
  founder:         '👑',
  real_visitors:   '👤',
};

function admClearCounter(e, key) {
  e.stopPropagation();
  closeAllMenus();
  if (_isProtected) { showToast('System is protected. Action denied!'); return; }

  _pendingClearKey = key;
  document.getElementById('confirm-title').textContent = 'Reset ' + COUNTER_LABELS[key] + '?';
  document.getElementById('confirm-msg').innerHTML = 'This action <strong>cannot be undone</strong>.<br>The counter will be reset to 0.';
  document.getElementById('confirm-yes').onclick = function() { doResetCounter(_pendingClearKey); };
  document.getElementById('confirm-overlay').classList.add('open');
}

function closeConfirm() {
  _pendingClearKey  = null;
  _pendingDeleteRow = null;
  document.getElementById('confirm-overlay').classList.remove('open');
}

function doResetCounter(key) {
  closeConfirm();
  if (!db || !key) return;
  db.ref('counters/' + key).set(0, function() { showToast('✓ Counter reset!'); });
}

function admAdjustCounter(e, key) {
  e.stopPropagation();
  closeAllMenus();
  if (_isProtected) { showToast('System is protected. Action denied!'); return; }

  _pendingAdjustKey = key;
  document.getElementById('adjust-title').textContent = 'Adjust ' + COUNTER_LABELS[key];

  var currentValues = {
    outer: _vOuter, real_visitors: _vReal, inner_normal: _vNormal,
    inner_secondary: _vSec, admin: _vAdmin, founder: _vFounder,
  };

  var inp = document.getElementById('adjust-input');
  inp.value = currentValues[key] || 0;
  document.getElementById('adjust-overlay').classList.add('open');
  setTimeout(function() { inp.focus(); inp.select(); }, 50);
}

function closeAdjust() {
  _pendingAdjustKey = null;
  document.getElementById('adjust-overlay').classList.remove('open');
}

function doAdjustCounter() {
  var val = parseInt(document.getElementById('adjust-input').value) || 0;
  if (val < 0) val = 0;
  var key = _pendingAdjustKey;
  closeAdjust();
  if (!db || !key) return;
  db.ref('counters/' + key).set(val, function() { showToast('✓ Updated successfully!'); });
}

// ══════════════════════════════════════════
// EDIT CONTENT DIALOGS (Founder only)
// ══════════════════════════════════════════

// ── Welcome Banner ──
function openChangeWelcome() {
  if (_isProtected) { showToast('System is protected!'); return; }
  document.getElementById('welcome-input').value = currentWelcome;
  document.getElementById('welcome-change-overlay').classList.add('open');
  closeAllMenus();
}
function closeChangeWelcome() {
  document.getElementById('welcome-change-overlay').classList.remove('open');
}
function submitChangeWelcome() {
  if (_isProtected) { showToast('System is protected!'); return; }
  var nW = document.getElementById('welcome-input').value.trim() || DEFAULT_WELCOME;
  currentWelcome = nW;
  renderWelcome();
  db.ref('settings/welcome').set(nW, function(err) {
    if (err) showToast('⚠ Error!');
    else { closeChangeWelcome(); showToast('✓ Updated successfully'); }
  });
}

// ── Title ──
function openChangeTitle() {
  if (_isProtected) { showToast('System is protected!'); return; }
  document.getElementById('tab-title-input').value  = currentTabTitle;
  document.getElementById('main-title-input').value = currentMainTitle;
  document.getElementById('title-change-overlay').classList.add('open');
  closeAllMenus();
}
function closeChangeTitle() {
  document.getElementById('title-change-overlay').classList.remove('open');
}
function submitChangeTitle() {
  if (_isProtected) { showToast('System is protected!'); return; }
  var tTab  = document.getElementById('tab-title-input').value.trim()  || DEFAULT_TAB_TITLE;
  var tMain = document.getElementById('main-title-input').value.trim() || DEFAULT_MAIN_TITLE;
  currentTabTitle  = tTab;
  currentMainTitle = tMain;
  renderTitle();
  db.ref('settings/titles').set({ tab: tTab, main: tMain }, function(err) {
    if (err) showToast('⚠ Error!');
    else { closeChangeTitle(); showToast('✓ Updated successfully'); }
  });
}

// ── Popups ──
function openChangePopup() {
  if (_isProtected) { showToast('System is protected!'); return; }
  document.getElementById('popup-wrong-input').value = currentPopups.wrong;
  document.getElementById('popup-close-input').value = currentPopups.close;
  document.getElementById('popup-change-overlay').classList.add('open');
  closeAllMenus();
}
function closeChangePopup() {
  document.getElementById('popup-change-overlay').classList.remove('open');
}
function submitChangePopup() {
  if (_isProtected) { showToast('System is protected!'); return; }
  var pWrong = document.getElementById('popup-wrong-input').value.trim() || DEFAULT_POPUPS.wrong;
  var pClose = document.getElementById('popup-close-input').value.trim() || DEFAULT_POPUPS.close;
  currentPopups.wrong = pWrong;
  currentPopups.close = pClose;
  db.ref().update({ 'settings/popups/wrong': pWrong, 'settings/popups/close': pClose }, function(err) {
    if (err) showToast('⚠ Error!');
    else { closeChangePopup(); showToast('✓ Updated successfully'); }
  });
}

// ── Notes (tagline & footer) ──
function openChangeNotes() {
  if (_isProtected) { showToast('System is protected!'); return; }
  document.getElementById('note-tagline-input').value = currentNotes.tagline;
  document.getElementById('note-footer-input').value  = currentNotes.footer;
  document.getElementById('notes-change-overlay').classList.add('open');
  closeAllMenus();
}
function closeChangeNotes() {
  document.getElementById('notes-change-overlay').classList.remove('open');
}
function submitChangeNotes() {
  if (_isProtected) { showToast('System is protected!'); return; }
  var tL = document.getElementById('note-tagline-input').value.trim() || DEFAULT_NOTES.tagline;
  var fT = document.getElementById('note-footer-input').value.trim()  || DEFAULT_NOTES.footer;
  currentNotes.tagline = tL;
  currentNotes.footer  = fT;
  renderNotes();
  db.ref().update({ 'settings/notes_v2/tagline': tL, 'settings/notes_v2/footer': fT }, function(err) {
    if (err) showToast('⚠ Error!');
    else { closeChangeNotes(); showToast('✓ Updated successfully'); }
  });
}

// ── Hints ──
function openChangeHints() {
  if (_isProtected) { showToast('System is protected!'); return; }
  document.getElementById('hint1-input').value = currentHints.hint1;
  document.getElementById('hint2-input').value = currentHints.hint2;
  document.getElementById('hint-change-overlay').classList.add('open');
  closeAllMenus();
}
function closeChangeHints() {
  document.getElementById('hint-change-overlay').classList.remove('open');
}
function submitChangeHints() {
  if (_isProtected) { showToast('System is protected!'); return; }
  var h1 = document.getElementById('hint1-input').value.trim() || DEFAULT_HINTS.hint1;
  var h2 = document.getElementById('hint2-input').value.trim() || DEFAULT_HINTS.hint2;
  currentHints.hint1 = h1;
  currentHints.hint2 = h2;
  renderHints();
  db.ref().update({ 'settings/hints_v3/hint1': h1, 'settings/hints_v3/hint2': h2 }, function(err) {
    if (err) showToast('⚠ Error!');
    else { closeChangeHints(); showToast('✓ Updated successfully'); }
  });
}

// ── Secret Messages ──
function openChangeSecret() {
  if (_isProtected) { showToast('System is protected!'); return; }
  document.getElementById('secret-normal-input').value    = currentSecretMsgs.normal;
  document.getElementById('secret-secondary-input').value = currentSecretMsgs.secondary;
  document.getElementById('secret-admin-input').value     = currentSecretMsgs.admin;
  document.getElementById('secret-change-overlay').classList.add('open');
  closeAllMenus();
}
function closeChangeSecret() {
  document.getElementById('secret-change-overlay').classList.remove('open');
}
function submitChangeSecret() {
  if (_isProtected) { showToast('System is protected!'); return; }
  var n = document.getElementById('secret-normal-input').value.trim();
  var s = document.getElementById('secret-secondary-input').value.trim();
  var a = document.getElementById('secret-admin-input').value.trim();
  currentSecretMsgs.normal    = n;
  currentSecretMsgs.secondary = s;
  currentSecretMsgs.admin     = a;
  db.ref('settings/secretMsgs_v3').set(currentSecretMsgs, function(err) {
    if (err) showToast('⚠ Error!');
    else { closeChangeSecret(); showToast('✓ Messages updated'); }
  });
}

// ── Secret Message Display ──

function showSecretCipher() {
  var msg = currentSecretMsgs[_currentLoginRole] || '';
  if (!msg) { showToast('No secret message set!'); return; }

  if (_currentLoginRole === 'admin' || _currentLoginRole === 'founder') {
    document.getElementById('admin-secret-content').textContent = msg;
    document.getElementById('admin-secret-overlay').classList.add('open');
  } else {
    document.getElementById('secret-display-text').textContent = msg;
    document.getElementById('secret-display-overlay').classList.add('open');
  }
}

function copySecretDisplay() {
  var t = document.getElementById('secret-display-text').textContent;
  if (navigator.clipboard && window.isSecureContext) {
    navigator.clipboard.writeText(t).then(function() { showToast('✓ Copied to clipboard!'); });
  } else {
    fbCopy(t);
  }
  // Nếu text đã giải mã (là plaintext), mở congrats
  var isCipher = !LETTER_REGEX.test(t);
  if (!isCipher) {
    closeSecretDisplay();
    setTimeout(function() { showCongrats(t); }, 300);
  }
}

function closeSecretDisplay()      { document.getElementById('secret-display-overlay').classList.remove('open'); }
function closeAdminSecretDisplay() { document.getElementById('admin-secret-overlay').classList.remove('open'); }
function showCongrats(text)        { document.getElementById('congrats-msg').textContent = text; document.getElementById('congrats-overlay').classList.add('open'); }
function closeCongrats()           { document.getElementById('congrats-overlay').classList.remove('open'); }

// ── Blocked IPs ──

function blockIP(ip) {
  if (_isProtected) { showToast('System is protected. Action denied!'); return; }
  if (!db || !ip) return;
  var safeIp = ip.replace(/\./g, '-');
  if (_blockedIPs[safeIp]) { showToast('IP is already blocked!'); return; }
  if (confirm('Block IP ' + ip + '? This user will lose access to the site.')) {
    db.ref('settings/blockedIPs/' + safeIp).set(Date.now(), function(err) {
      if (!err) showToast('✓ Blocked IP: ' + ip);
    });
  }
}

function unblockIP(safeIp) {
  if (_isProtected) { showToast('System is protected. Action denied!'); return; }
  if (!db) return;
  db.ref('settings/blockedIPs/' + safeIp).remove(function(err) {
    if (!err) { showToast('✓ Unblocked IP'); openBlockManager(); }
  });
}

function openBlockManager() {
  closeAllMenus();
  var listEl = document.getElementById('block-list');
  var keys   = Object.keys(_blockedIPs);

  if (keys.length === 0) {
    listEl.innerHTML = '<div style="text-align:center; padding: 20px; color:var(--muted)">No blocked IPs</div>';
  } else {
    listEl.innerHTML = keys.map(function(k) {
      var ip      = k.replace(/-/g, '.');
      var dateStr = new Date(_blockedIPs[k]).toLocaleDateString('en-US') + ' ' +
                    new Date(_blockedIPs[k]).toLocaleTimeString('en-US');
      return '<div style="display:flex;justify-content:space-between;border-bottom:1px solid var(--border);padding:8px 0;align-items:center;">' +
               '<div><strong style="color:var(--accent);font-size:12px;">' + esc(ip) + '</strong>' +
               '<br><span style="color:var(--muted)">Blocked at: ' + dateStr + '</span></div>' +
               '<button class="allow-protected" style="padding:4px 8px;border:1px solid #27ae60;background:transparent;color:#27ae60;border-radius:3px;cursor:pointer;" onclick="unblockIP(\'' + k + '\')">' +
               'Unblock</button></div>';
    }).join('');
  }
  document.getElementById('block-overlay').classList.add('open');
}

function closeBlockManager() {
  document.getElementById('block-overlay').classList.remove('open');
}

// ── Navigate to log screen ──

function admGoLog(e) {
  e.stopPropagation();
  closeAllMenus();
  navPush('log');
  applyNav('log');
}