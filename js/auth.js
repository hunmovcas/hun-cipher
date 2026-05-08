/* ══════════════════════════════════════════
   auth.js — Xác thực & phân quyền
   Toàn bộ logic liên quan đến mật khẩu, đăng nhập,
   nâng quyền (elevate), chuyển vai (switch role).
   ══════════════════════════════════════════ */

// ── Initial Setup (lần đầu chưa có mật khẩu) ──

async function submitSetup() {
  var f = document.getElementById('setup-founder').value.toLowerCase().trim();
  var a = document.getElementById('setup-admin').value.toLowerCase().trim();
  var n = document.getElementById('setup-normal').value.toLowerCase().trim();
  var s = document.getElementById('setup-secondary').value.toLowerCase().trim();

  if (!f || !a || !n || !s) { showToast('Please enter all 4 passwords!'); return; }

  var enc = new TextEncoder();
  async function hash(v) {
    var buf = await crypto.subtle.digest('SHA-256', enc.encode(v));
    return Array.from(new Uint8Array(buf)).map(function(b) { return b.toString(16).padStart(2, '0'); }).join('');
  }

  var newHashes = {
    founder:   await hash(f),
    admin:     await hash(a),
    normal:    await hash(n),
    secondary: await hash(s),
  };

  db.ref('settings/passwords_v3').set(newHashes, function(err) {
    if (!err) {
      document.getElementById('setup-screen').style.display = 'none';
      document.getElementById('pw-screen').style.display = 'flex';
      showToast('✓ Initialization complete!');
    } else {
      showToast('⚠ Database save error!');
    }
  });
}

// ── Password Login ──

async function sha256(val) {
  var buf = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(val));
  return Array.from(new Uint8Array(buf)).map(function(b) { return b.toString(16).padStart(2, '0'); }).join('');
}

async function isOneCharOff(val) {
  if (!val) return false;
  var charset =
    'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!@#$%^&*()_+-=[]{}|;\':",./<>?`~ ' +
    'áàảãạâấầẩẫậăắằẳẵặéèẻẽẹêếềểễệíìỉĩịóòỏõọôốồổỗộơớờởỡợúùủũụưứừửữựýỳỷỹỵđ' +
    'ÁÀẢÃẠÂẤẦẨẪẬĂẮẰẲẴẶÉÈẺẼẸÊẾỀỂỄỆÍÌỈĨỊÓÒỎÕỌÔỐỒỔỖỘƠỚỜỞỠỢÚÙỦŨỤƯỨỪỬỮỰÝỲỶỸỴĐ';

  var variations = new Set();
  for (var i = 0; i < val.length; i++) { variations.add(val.slice(0, i) + val.slice(i + 1)); }
  for (var i = 0; i < val.length; i++) {
    for (var j = 0; j < charset.length; j++) { if (charset[j] !== val[i]) variations.add(val.slice(0, i) + charset[j] + val.slice(i + 1)); }
  }
  for (var i = 0; i <= val.length; i++) {
    for (var j = 0; j < charset.length; j++) { variations.add(val.slice(0, i) + charset[j] + val.slice(i)); }
  }

  var arr = Array.from(variations);
  var encoder = new TextEncoder();

  for (var i = 0; i < arr.length; i += 1000) {
    var batch = arr.slice(i, i + 1000);
    var hashes = await Promise.all(batch.map(async function(v) {
      var buf = await crypto.subtle.digest('SHA-256', encoder.encode(v));
      var hex = '';
      new Uint8Array(buf).forEach(function(b) { hex += b.toString(16).padStart(2, '0'); });
      return hex;
    }));
    if (hashes.indexOf(currentHashes.normal)    !== -1 ||
        hashes.indexOf(currentHashes.admin)      !== -1 ||
        hashes.indexOf(currentHashes.secondary)  !== -1 ||
        hashes.indexOf(currentHashes.founder)    !== -1) {
      return true;
    }
  }
  return false;
}

async function checkPw() {
  var val = document.getElementById('pw-input').value.toLowerCase();
  if (!val) return;

  var btn = document.querySelector('.btn-pw');
  var oldText = btn.innerHTML;
  btn.innerHTML = '<span class="spin" style="margin-right:6px">⟳</span> Processing...';
  btn.disabled = true;

  var hash = await sha256(val);

  if      (hash === currentHashes.founder)   { _originalRole = 'founder';   _currentLoginRole = 'founder';   _isAdmin = true;  _loggedIn = true; }
  else if (hash === currentHashes.admin)     { _originalRole = 'admin';     _currentLoginRole = 'admin';     _isAdmin = true;  _loggedIn = true; }
  else if (hash === currentHashes.secondary) { _originalRole = 'secondary'; _currentLoginRole = 'secondary'; _isAdmin = false; _loggedIn = true; }
  else if (hash === currentHashes.normal)    { _originalRole = 'normal';    _currentLoginRole = 'normal';    _isAdmin = false; _loggedIn = true; }

  if (_loggedIn) {
    btn.innerHTML = oldText;
    btn.disabled  = false;

    var pw = document.getElementById('pw-screen');
    pw.style.transition = 'opacity .4s';
    pw.style.opacity = '0';
    setTimeout(function() { pw.style.display = 'none'; }, 400);

    if (_isAdmin) localStorage.setItem('hun_is_admin', 'true');
    if (_currentLoginRole === 'founder') sessionStorage.setItem('hun_known_founder', 'true');

    _hist = ['lock', 'main-d'];
    _hidx = 1;

    document.getElementById('main-wrap').style.display = 'block';
    document.getElementById('nav-btns').style.display  = 'flex';
    updateNavBtns();

    var logType = _isAdmin
      ? (_currentLoginRole === 'founder' ? 'login_founder' : 'login_admin')
      : (_currentLoginRole === 'secondary' ? 'login_secondary' : 'login_normal');

    fbIncrement(logType);
    fbListenAll();

    if (_isAdmin) applyAdminModeUI();
    else          applyUserModeUI();

  } else {
    var isClose = await isOneCharOff(val);
    var popup   = document.getElementById('pw-popup');
    var inp     = document.getElementById('pw-input');
    var pwErr   = document.getElementById('pw-err');

    if (isClose) {
      popup.textContent = currentPopups.close;
      popup.className   = 'pw-popup-container show-close';
      inp.style.borderColor = 'var(--orange)';
    } else {
      popup.textContent = currentPopups.wrong;
      popup.className   = 'pw-popup-container show-wrong';
      inp.style.borderColor = 'var(--accent)';
      pwErr.style.display = 'block';
    }

    inp.value = '';
    inp.focus();
    btn.innerHTML = oldText;
    btn.disabled  = false;

    setTimeout(function() {
      popup.className   = 'pw-popup-container';
      popup.textContent = '';
      inp.style.borderColor = '';
      pwErr.style.display   = 'none';
    }, 3500);
  }
}

// ── Elevate Privilege ──

function openElevateModal() {
  document.getElementById('elevate-pw').value = '';
  document.getElementById('elevate-err').style.display = 'none';

  var title = document.getElementById('elevate-title');
  var desc  = document.getElementById('elevate-desc');
  var inp   = document.getElementById('elevate-pw');

  if (_currentLoginRole === 'admin') {
    title.innerHTML = 'Elevate Privilege <span style="color:var(--founder)">👑</span>';
    desc.textContent = 'Authenticate as Founder.';
    inp.placeholder  = 'Founder Password...';
  } else if (_currentLoginRole === 'secondary') {
    title.innerHTML = 'Elevate Privilege <span style="color:var(--accent2)">🚀</span>';
    desc.textContent = 'Authenticate as Main User, Admin, or Founder.';
    inp.placeholder  = 'Enter higher tier password...';
  } else {
    title.textContent = 'Elevate Privilege';
    desc.textContent  = 'Authenticate as Admin or Founder.';
    inp.placeholder   = 'Admin or Founder Password...';
  }

  document.getElementById('elevate-overlay').classList.add('open');
  setTimeout(function() { document.getElementById('elevate-pw').focus(); }, 50);
}

function closeElevateModal() {
  document.getElementById('elevate-overlay').classList.remove('open');
}

async function submitElevate() {
  var val  = document.getElementById('elevate-pw').value.toLowerCase();
  var hash = await sha256(val);

  var newRole = null;
  if      (hash === currentHashes.founder)   newRole = 'founder';
  else if (hash === currentHashes.admin)     newRole = 'admin';
  else if (hash === currentHashes.secondary) newRole = 'secondary';
  else if (hash === currentHashes.normal)    newRole = 'normal';

  if (!newRole) {
    var err = document.getElementById('elevate-err');
    err.style.display = 'block';
    setTimeout(function() { err.style.display = 'none'; }, 2000);
    return;
  }

  if (ROLE_HIERARCHY[newRole] <= ROLE_HIERARCHY[_currentLoginRole]) {
    showToast('Already at this or higher privilege level!');
    closeElevateModal();
    return;
  }

  closeElevateModal();
  _currentLoginRole = newRole;

  if (newRole === 'founder' || newRole === 'admin') {
    _isAdmin = true;
    localStorage.setItem('hun_is_admin', 'true');
    _hist = ['lock', 'main-' + _mode];
    _hidx = 1;

    if (newRole === 'founder') {
      _originalRole = 'founder';
      sessionStorage.setItem('hun_known_founder', 'true');

      var updates = {};
      if (_sessionKeys.secondary) {
        updates['logs/' + _sessionKeys.secondary] = null;
        db.ref('counters/inner_secondary').transaction(function(n) { return Math.max(0, (n || 0) - 1); });
        _sessionKeys.secondary = null;
      }
      if (_sessionKeys.normal) {
        updates['logs/' + _sessionKeys.normal] = null;
        db.ref('counters/inner_normal').transaction(function(n) { return Math.max(0, (n || 0) - 1); });
        _sessionKeys.normal = null;
      }
      if (_sessionKeys.admin) {
        updates['logs/' + _sessionKeys.admin] = null;
        db.ref('counters/admin').transaction(function(n) { return Math.max(0, (n || 0) - 1); });
        _sessionKeys.admin = null;
      }
      if (Object.keys(updates).length > 0) db.ref().update(updates);

      fbIncrement('login_founder');
    } else {
      if (_originalRole !== 'founder') _originalRole = 'admin';
      fbIncrement('login_admin');
    }

    applyAdminModeUI();
    showToast(newRole === 'founder' ? '✓ Elevated to Founder!' : '✓ Elevated to Admin!');

  } else if (newRole === 'normal') {
    _isAdmin = false;
    _originalRole = 'normal';
    fbIncrement('login_normal');
    applyUserModeUI();
    showToast('✓ Elevated to Main User!');
  } else if (newRole === 'secondary') {
    _isAdmin = false;
    _originalRole = 'secondary';
    fbIncrement('login_secondary');
    applyUserModeUI();
    showToast('✓ Elevated to Sub User!');
  }
}

// ── Switch Role (Founder-only) ──

function switchRole(newRole) {
  if (sessionStorage.getItem('hun_known_founder') !== 'true') {
    showToast('Access Denied');
    return;
  }
  if (_currentLoginRole === newRole) {
    showToast('Already in this role!');
    return;
  }

  _currentLoginRole = newRole;

  if (newRole === 'founder' || newRole === 'admin') {
    _isAdmin = true;
    applyAdminModeUI();
  } else {
    _isAdmin = false;
    applyUserModeUI();
    if (document.getElementById('log-screen').style.display === 'block') {
      navPush('main-' + _mode);
      applyNav('main-' + _mode);
    }
  }

  closeAllMenus();
  showToast('✓ Switched role!');
}

// ── Apply Role UI ──

function applyAdminModeUI() {
  if (_currentLoginRole === 'founder' || _currentLoginRole === 'admin') {
    document.body.classList.add('role-founder');
  } else {
    document.body.classList.remove('role-founder');
  }

  document.querySelectorAll('.normal-only').forEach(function(el)    { el.style.display = 'none'; });
  document.querySelectorAll('.protected-only').forEach(function(el) { el.style.display = 'block'; });
  document.querySelectorAll('.admin-only').forEach(function(el)     { el.style.display = 'block'; });

  _showCounterIcon('div-shield', 'cnt-shield');
  _showCounterIcon('div-noti',   'cnt-noti');
  _showCounterIcon('div-traffic','cnt-traffic');
  _showCounterIcon('div-auth',   'cnt-auth');
  _showCounterIcon('div-profile','cnt-profile');

  var uView = document.getElementById('item-unique-view');
  if (uView) uView.style.display = 'flex';

  if (_currentLoginRole !== 'founder') {
    _showCounterIcon('div-elevate', 'cnt-elevate');
  } else {
    _hideCounterIcon('div-elevate', 'cnt-elevate');
  }

  if (_currentLoginRole !== 'founder' && _currentLoginRole !== 'admin') {
    _showCounterIcon('div-secret', 'cnt-secret');
  } else {
    _hideCounterIcon('div-secret', 'cnt-secret');
  }

  _showCounterIcon('div-switch', 'cnt-switch');
  updateProfileIcon();
  fbListenNoti();
}

function applyUserModeUI() {
  document.body.classList.remove('role-founder');

  document.querySelectorAll('.normal-only').forEach(function(el)    { el.style.display = 'block'; });
  document.querySelectorAll('.protected-only').forEach(function(el) { el.style.display = 'none'; });
  document.querySelectorAll('.admin-only').forEach(function(el)     { el.style.display = 'none'; });

  _hideCounterIcon('div-shield', 'cnt-shield');
  _hideCounterIcon('div-noti',   'cnt-noti');
  _hideCounterIcon('div-auth',   'cnt-auth');

  _showCounterIcon('div-traffic', 'cnt-traffic');
  var uView = document.getElementById('item-unique-view');
  if (uView) uView.style.display = (_currentLoginRole === 'secondary') ? 'none' : 'flex';

  _showCounterIcon('div-secret',  'cnt-secret');
  _showCounterIcon('div-elevate', 'cnt-elevate');
  _showCounterIcon('div-profile', 'cnt-profile');

  if (sessionStorage.getItem('hun_known_founder') === 'true') {
    _showCounterIcon('div-switch', 'cnt-switch');
  } else {
    _hideCounterIcon('div-switch', 'cnt-switch');
  }

  updateProfileIcon();
}

// ── Logout ──

function doLogout(e) {
  if (e) e.stopPropagation();
  closeAllMenus();
  sessionStorage.removeItem('hun_known_founder');
  fbDetachAll();

  _loggedIn = false;
  _isAdmin  = false;
  _hist     = [];
  _hidx     = -1;
  _currentLoginRole = 'normal';
  _originalRole     = 'normal';
  _sessionKeys = { view: null, secondary: null, normal: null, admin: null, founder: null };

  document.body.classList.remove('role-founder');
  document.getElementById('main-wrap').style.display  = 'none';
  document.getElementById('log-screen').style.display = 'none';
  document.getElementById('nav-btns').style.display   = 'none';

  ['div-switch','cnt-switch','div-secret','cnt-secret','div-elevate','cnt-elevate',
   'div-shield','cnt-shield','div-noti','cnt-noti','div-traffic','cnt-traffic',
   'div-auth','cnt-auth','div-profile','cnt-profile'].forEach(function(id) {
    var el = document.getElementById(id);
    if (el) el.style.display = 'none';
  });

  var pw = document.getElementById('pw-screen');
  pw.style.display = 'flex';
  pw.style.opacity = '0';
  setTimeout(function() { pw.style.transition = 'opacity .3s'; pw.style.opacity = '1'; }, 10);

  fbListenOuter();

  var inp = document.getElementById('pw-input');
  inp.value = '';
  setTimeout(function() { inp.focus(); }, 350);
  updateNavBtns();
}

// ── Change Password ──

function openChangePw(type) {
  if (_isProtected && type !== 'founder') { showToast('System is protected!'); return; }
  _pwChangeType = type;

  var labels = { normal: 'Change Main Pass', secondary: 'Change Sub Pass', admin: 'Change Admin Pass', founder: 'Change Founder Pass' };
  document.getElementById('pw-change-title').textContent = labels[type];
  document.getElementById('pw-old').value     = '';
  document.getElementById('pw-new').value     = '';
  document.getElementById('pw-confirm').value = '';
  document.getElementById('pw-change-err').style.display = 'none';

  if (type === 'founder') closeShieldModal();
  document.getElementById('pw-change-overlay').classList.add('open');
  closeAllMenus();
}

function closeChangePw() { document.getElementById('pw-change-overlay').classList.remove('open'); }

async function submitChangePw() {
  if (_isProtected && _pwChangeType !== 'founder') { showToast('System is protected!'); return; }

  var oldPw     = document.getElementById('pw-old').value.toLowerCase();
  var newPw     = document.getElementById('pw-new').value.toLowerCase();
  var confirmPw = document.getElementById('pw-confirm').value.toLowerCase();
  var errEl     = document.getElementById('pw-change-err');

  if (!oldPw || !newPw || !confirmPw) { errEl.textContent = 'Please fill in all fields'; errEl.style.display = 'block'; return; }
  if (newPw !== confirmPw)            { errEl.textContent = 'New passwords do not match';  errEl.style.display = 'block'; return; }

  var oldHash = await sha256(oldPw);
  var isAuthorized =
    oldHash === currentHashes.founder ||
    (oldHash === currentHashes.admin && _pwChangeType !== 'founder') ||
    (_pwChangeType === 'normal'    && (oldHash === currentHashes.normal    || oldHash === currentHashes.secondary)) ||
    (_pwChangeType === 'secondary' && (oldHash === currentHashes.secondary || oldHash === currentHashes.normal));

  if (!isAuthorized) {
    errEl.textContent = 'Incorrect password or insufficient permissions';
    errEl.style.display = 'block';
    return;
  }

  var newHash = await sha256(newPw);
  var updates = {};
  updates['settings/passwords_v3/' + _pwChangeType] = newHash;

  db.ref().update(updates, function(error) {
    if (error) {
      errEl.textContent = 'Connection error';
      errEl.style.display = 'block';
    } else {
      closeChangePw();
      showToast('✓ Password updated');
      var ipStr = window._myIP || 'Unknown';
      db.ref('notifications').push({ text: '🔑 Password changed: ' + _pwChangeType + ' | IP: ' + ipStr, ts: Date.now(), read: false });
    }
  });
}

// ── System Protection (Shield) ──

function openShieldModal() {
  document.getElementById('shield-pw').value = '';
  document.getElementById('shield-err').style.display = 'none';
  document.getElementById('shield-overlay').classList.add('open');
  closeAllMenus();
  setTimeout(function() { document.getElementById('shield-pw').focus(); }, 50);
}

function closeShieldModal() { document.getElementById('shield-overlay').classList.remove('open'); }

async function submitToggleShield() {
  var val  = document.getElementById('shield-pw').value.toLowerCase();
  var hash = await sha256(val);

  if (hash === currentHashes.founder) {
    db.ref('settings/protection').set(!_isProtected, function(error) {
      if (!error) {
        closeShieldModal();
        showToast(!_isProtected ? '✓ Protection Enabled' : '✓ Protection Disabled');
      }
    });
  } else {
    var err = document.getElementById('shield-err');
    err.style.display = 'block';
    setTimeout(function() { err.style.display = 'none'; }, 2000);
  }
}

// ── Private helpers ──
function _showCounterIcon(divId, cntId) {
  var d = document.getElementById(divId); if (d) d.style.display = 'block';
  var c = document.getElementById(cntId); if (c) c.style.display = 'flex';
}
function _hideCounterIcon(divId, cntId) {
  var d = document.getElementById(divId); if (d) d.style.display = 'none';
  var c = document.getElementById(cntId); if (c) c.style.display = 'none';
}