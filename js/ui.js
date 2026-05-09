/* ══════════════════════════════════════════
   UI — render helpers, dialogs, toast, secret
   ══════════════════════════════════════════ */

/* ── RENDER HELPERS ── */
function esc(s) {
  return String(s||'').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;').replace(/'/g,'&#39;');
}

function showToast(m) {
  var el = document.getElementById('toast');
  el.textContent = m;
  el.classList.add('show');
  setTimeout(function() { el.classList.remove('show'); }, 2000);
}

function renderHints() {
  var el = document.getElementById('pw-hints-display');
  if (el) el.innerHTML =
    '<div class="hint-title">Password Hints</div>' +
    '<div style="margin-bottom:12px"><strong>💡 Hint 1:</strong><br>' + esc(currentHints.hint1) + '</div>' +
    '<div><strong>💡 Hint 2:</strong><br>' + esc(currentHints.hint2) + '</div>';
}

function renderTitle() {
  var el = document.getElementById('main-title');
  if (el) el.innerHTML = currentMainTitle;
  document.title = currentTabTitle;
}

function renderNotes() {
  var tagEl  = document.getElementById('main-tagline');
  var footEl = document.getElementById('main-footer');
  if (tagEl)  tagEl.innerHTML  = currentNotes.tagline;
  if (footEl) footEl.innerHTML = currentNotes.footer;
}

function renderWelcome() {
  var welEl = document.getElementById('pw-welcome-display');
  if (welEl) welEl.innerHTML = esc(currentWelcome);
}

/* ── SECRET MESSAGE ── */
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
  } else { fbCopy(t); }

  var isCipher = !_letterRegex.test(t);
  if (!isCipher) {
    closeSecretDisplay();
    setTimeout(function() { showCongrats(t); }, 300);
  }
}

function closeSecretDisplay()      { document.getElementById('secret-display-overlay').classList.remove('open'); }
function closeAdminSecretDisplay() { document.getElementById('admin-secret-overlay').classList.remove('open'); }
function showCongrats(text)        { document.getElementById('congrats-msg').textContent = text; document.getElementById('congrats-overlay').classList.add('open'); }
function closeCongrats()           { document.getElementById('congrats-overlay').classList.remove('open'); }

/* ── CONFIRM / ADJUST DIALOGS ── */
function closeConfirm() {
  _pendingClearKey   = null;
  _pendingDeleteRow  = null;
  document.getElementById('confirm-overlay').classList.remove('open');
}

function closeAdjust() {
  _pendingAdjustKey = null;
  document.getElementById('adjust-overlay').classList.remove('open');
}

/* ── CONFIG DIALOGS ── */
function openChangeWelcome() {
  if (_isProtected) { showToast('System is protected!'); return; }
  document.getElementById('welcome-input').value = currentWelcome;
  document.getElementById('welcome-change-overlay').classList.add('open');
  closeAllMenus();
}
function closeChangeWelcome() { document.getElementById('welcome-change-overlay').classList.remove('open'); }
function submitChangeWelcome() {
  if (_isProtected) { showToast('System is protected!'); return; }
  var nW = document.getElementById('welcome-input').value.trim() || defaultWelcome;
  currentWelcome = nW; renderWelcome();
  if (db) db.ref('settings/welcome').set(nW, function(err) {
    if (err) showToast('⚠ Error!'); else { closeChangeWelcome(); showToast('✓ Updated successfully'); }
  }); else closeChangeWelcome();
}

function openChangeTitle() {
  if (_isProtected) { showToast('System is protected!'); return; }
  document.getElementById('tab-title-input').value  = currentTabTitle;
  document.getElementById('main-title-input').value = currentMainTitle;
  document.getElementById('title-change-overlay').classList.add('open');
  closeAllMenus();
}
function closeChangeTitle() { document.getElementById('title-change-overlay').classList.remove('open'); }
function submitChangeTitle() {
  if (_isProtected) { showToast('System is protected!'); return; }
  var tTab  = document.getElementById('tab-title-input').value.trim()  || defaultTabTitle;
  var tMain = document.getElementById('main-title-input').value.trim() || defaultMainTitle;
  currentTabTitle = tTab; currentMainTitle = tMain; renderTitle();
  if (db) db.ref('settings/titles').set({ tab: tTab, main: tMain }, function(err) {
    if (err) showToast('⚠ Error!'); else { closeChangeTitle(); showToast('✓ Updated successfully'); }
  }); else closeChangeTitle();
}

function openChangePopup() {
  if (_isProtected) { showToast('System is protected!'); return; }
  document.getElementById('popup-wrong-input').value = currentPopups.wrong;
  document.getElementById('popup-close-input').value = currentPopups.close;
  document.getElementById('popup-change-overlay').classList.add('open');
  closeAllMenus();
}
function closeChangePopup() { document.getElementById('popup-change-overlay').classList.remove('open'); }
function submitChangePopup() {
  if (_isProtected) { showToast('System is protected!'); return; }
  var pWrong = document.getElementById('popup-wrong-input').value.trim() || defaultPopups.wrong;
  var pClose = document.getElementById('popup-close-input').value.trim() || defaultPopups.close;
  currentPopups.wrong = pWrong; currentPopups.close = pClose;
  if (db) db.ref().update({ 'settings/popups/wrong': pWrong, 'settings/popups/close': pClose }, function(err) {
    if (err) showToast('⚠ Error!'); else { closeChangePopup(); showToast('✓ Updated successfully'); }
  }); else closeChangePopup();
}

function openChangeNotes() {
  if (_isProtected) { showToast('System is protected!'); return; }
  document.getElementById('note-tagline-input').value = currentNotes.tagline;
  document.getElementById('note-footer-input').value  = currentNotes.footer;
  document.getElementById('notes-change-overlay').classList.add('open');
  closeAllMenus();
}
function closeChangeNotes() { document.getElementById('notes-change-overlay').classList.remove('open'); }
function submitChangeNotes() {
  if (_isProtected) { showToast('System is protected!'); return; }
  var tL = document.getElementById('note-tagline-input').value.trim() || defaultNotes.tagline;
  var fT = document.getElementById('note-footer-input').value.trim()  || defaultNotes.footer;
  currentNotes.tagline = tL; currentNotes.footer = fT; renderNotes();
  if (db) db.ref().update({ 'settings/notes_v2/tagline': tL, 'settings/notes_v2/footer': fT }, function(err) {
    if (err) showToast('⚠ Error!'); else { closeChangeNotes(); showToast('✓ Updated successfully'); }
  }); else closeChangeNotes();
}

function openChangeHints() {
  if (_isProtected) { showToast('System is protected!'); return; }
  document.getElementById('hint1-input').value = currentHints.hint1;
  document.getElementById('hint2-input').value = currentHints.hint2;
  document.getElementById('hint-change-overlay').classList.add('open');
  closeAllMenus();
}
function closeChangeHints() { document.getElementById('hint-change-overlay').classList.remove('open'); }
function submitChangeHints() {
  if (_isProtected) { showToast('System is protected!'); return; }
  var h1 = document.getElementById('hint1-input').value.trim() || defaultHints.hint1;
  var h2 = document.getElementById('hint2-input').value.trim() || defaultHints.hint2;
  currentHints.hint1 = h1; currentHints.hint2 = h2; renderHints();
  if (db) db.ref().update({ 'settings/hints_v3/hint1': h1, 'settings/hints_v3/hint2': h2 }, function(err) {
    if (err) showToast('⚠ Error!'); else { closeChangeHints(); showToast('✓ Updated successfully'); }
  }); else closeChangeHints();
}

function openChangeSecret() {
  if (_isProtected) { showToast('System is protected!'); return; }
  document.getElementById('secret-normal-input').value    = currentSecretMsgs.normal;
  document.getElementById('secret-secondary-input').value = currentSecretMsgs.secondary;
  document.getElementById('secret-admin-input').value     = currentSecretMsgs.admin;
  document.getElementById('secret-change-overlay').classList.add('open');
  closeAllMenus();
}
function closeChangeSecret() { document.getElementById('secret-change-overlay').classList.remove('open'); }
function submitChangeSecret() {
  if (_isProtected) { showToast('System is protected!'); return; }
  var n = document.getElementById('secret-normal-input').value.trim();
  var s = document.getElementById('secret-secondary-input').value.trim();
  var a = document.getElementById('secret-admin-input').value.trim();
  currentSecretMsgs.normal = n; currentSecretMsgs.secondary = s; currentSecretMsgs.admin = a;
  if (db) db.ref('settings/secretMsgs_v3').set(currentSecretMsgs, function(err) {
    if (err) showToast('⚠ Error!'); else { closeChangeSecret(); showToast('✓ Messages updated'); }
  }); else closeChangeSecret();
}

/* ── BLOCKED IP MANAGER ── */
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
    listEl.innerHTML = '<div style="text-align:center;padding:20px;color:var(--muted)">No blocked IPs</div>';
  } else {
    listEl.innerHTML = keys.map(function(k) {
      var ip = k.replace(/-/g, '.'), ts = _blockedIPs[k];
      var ds = new Date(ts).toLocaleDateString('en-US') + ' ' + new Date(ts).toLocaleTimeString('en-US');
      return '<div style="display:flex;justify-content:space-between;border-bottom:1px solid var(--border);padding:8px 0;align-items:center;">' +
        '<div><strong style="color:var(--accent);font-size:12px;">' + esc(ip) + '</strong><br>' +
        '<span style="color:var(--muted)">Blocked at: ' + ds + '</span></div>' +
        '<button class="allow-protected" style="padding:4px 8px;border:1px solid #27ae60;background:transparent;color:#27ae60;border-radius:3px;cursor:pointer;" onclick="unblockIP(\'' + k + '\')">Unblock</button>' +
        '</div>';
    }).join('');
  }
  document.getElementById('block-overlay').classList.add('open');
}
function closeBlockManager() { document.getElementById('block-overlay').classList.remove('open'); }

/* ── CLIPBOARD FALLBACK ── */
function fbCopy(t) {
  try {
    var ta = document.createElement('textarea');
    ta.value = t; ta.style.cssText = 'position:fixed;opacity:0';
    document.body.appendChild(ta); ta.select(); document.execCommand('copy');
    document.body.removeChild(ta); showToast('✓ Copied to clipboard!');
  } catch(e) { showToast('⚠ Failed to copy'); }
}