/* ══════════════════════════════════════════
   ROLES — RBAC, switch role, apply mode UI
   ══════════════════════════════════════════ */

function updateProfileIcon() {
  var isUser    = (_currentLoginRole === 'normal' || _currentLoginRole === 'secondary');
  var isAdmin   = (_currentLoginRole === 'admin');
  var isFounder = (_currentLoginRole === 'founder');
  document.getElementById('icon-prof-normal').style.display  = isUser    ? 'block' : 'none';
  document.getElementById('icon-prof-admin').style.display   = isAdmin   ? 'block' : 'none';
  document.getElementById('icon-prof-founder').style.display = isFounder ? 'block' : 'none';
  var pf = document.getElementById('cnt-profile');
  pf.style.color = isFounder ? 'var(--founder)' : (isAdmin ? 'var(--orange)' : 'var(--accent2)');
}

function applyAdminModeUI() {
  if (_currentLoginRole === 'founder' || _currentLoginRole === 'admin') {
    document.body.classList.add('role-founder');
  } else {
    document.body.classList.remove('role-founder');
  }

  document.querySelectorAll('.normal-only').forEach(function(el)    { el.style.display = 'none'; });
  document.querySelectorAll('.protected-only').forEach(function(el) { el.style.display = 'block'; });
  document.querySelectorAll('.admin-only').forEach(function(el)     { el.style.display = 'block'; });

  _show('div-shield', 'cnt-shield');
  _show('div-noti',   'cnt-noti');
  _show('div-traffic','cnt-traffic');
  _show('div-auth',   'cnt-auth');
  _show('div-profile','cnt-profile');

  var uView = document.getElementById('item-unique-view');
  if (uView) uView.style.display = 'flex';

  if (_currentLoginRole !== 'founder') {
    _show('div-elevate', 'cnt-elevate');
  } else {
    _hide('div-elevate', 'cnt-elevate');
  }

  if (_currentLoginRole !== 'founder' && _currentLoginRole !== 'admin') {
    _show('div-secret', 'cnt-secret');
  } else {
    _hide('div-secret', 'cnt-secret');
  }

  _show('div-switch', 'cnt-switch');
  updateProfileIcon();
  fbListenNoti();
}

function applyUserModeUI() {
  document.body.classList.remove('role-founder');

  document.querySelectorAll('.normal-only').forEach(function(el)    { el.style.display = 'block'; });
  document.querySelectorAll('.protected-only').forEach(function(el) { el.style.display = 'none'; });
  document.querySelectorAll('.admin-only').forEach(function(el)     { el.style.display = 'none'; });

  _hide('div-shield', 'cnt-shield');
  _hide('div-noti',   'cnt-noti');
  _hide('div-auth',   'cnt-auth');

  _show('div-traffic','cnt-traffic');
  if (_currentLoginRole === 'secondary') {
    var uv = document.getElementById('item-unique-view');
    if (uv) uv.style.display = 'none';
  } else {
    var uv2 = document.getElementById('item-unique-view');
    if (uv2) uv2.style.display = 'flex';
  }

  _show('div-secret',  'cnt-secret');
  _show('div-elevate', 'cnt-elevate');
  _show('div-profile', 'cnt-profile');

  if (sessionStorage.getItem('hun_known_founder') === 'true') {
    _show('div-switch', 'cnt-switch');
  } else {
    _hide('div-switch', 'cnt-switch');
  }

  updateProfileIcon();
}

/* ── SWITCH ROLE (Founder only) ── */
function switchRole(newRole) {
  if (sessionStorage.getItem('hun_known_founder') !== 'true') { showToast('Access Denied'); return; }
  if (_currentLoginRole === newRole) { showToast('Already in this role!'); return; }
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

/* ── PROTECTION UI ── */
function updateProtectionUI() {
  if (_isProtected) {
    document.body.classList.add('is-protected');
    document.getElementById('shield-status-text').textContent  = 'ENABLED';
    document.getElementById('shield-status-text').style.color  = 'var(--secure)';
    document.getElementById('btn-toggle-shield').textContent   = 'Disable Protection';
    document.getElementById('btn-toggle-shield').style.background  = 'var(--accent)';
    document.getElementById('btn-toggle-shield').style.borderColor = 'var(--accent)';
  } else {
    document.body.classList.remove('is-protected');
    document.getElementById('shield-status-text').textContent  = 'DISABLED';
    document.getElementById('shield-status-text').style.color  = 'var(--muted)';
    document.getElementById('btn-toggle-shield').textContent   = 'Enable Protection';
    document.getElementById('btn-toggle-shield').style.background  = 'var(--secure)';
    document.getElementById('btn-toggle-shield').style.borderColor = 'var(--secure)';
  }
}

/* ── BLOCK CHECK ── */
function checkBlock() {
  if (window._myIP && _blockedIPs[window._myIP.replace(/\./g, '-')]) {
    document.body.innerHTML = '<div style="display:flex;height:100vh;align-items:center;justify-content:center;background:#1a1a2e;color:#e74c3c;font-family:monospace;font-size:24px;font-weight:bold;letter-spacing:2px;">ACCESS DENIED</div>';
  }
}

/* ── STATS UI ── */
function setNum(id, n) { var el = document.getElementById(id); if (el) el.textContent = n; }

function updateStatsUI() {
  setNum('login-outer-num', _vOuter);
  setNum('num-traffic',     _vOuter);
  
  // Dropdown adjustments
  setNum('drop-views',      _vOuter);
  setNum('drop-unique',     _vReal);

  var totalAuth = _vNormal + _vSec + _vAdmin + _vFounder;
  setNum('num-auth',    totalAuth);
  
  // Update Dropdown Session Breakdown
  setNum('drop-sub',    _vSec);
  setNum('drop-main',   _vNormal);
  setNum('drop-admin',  _vAdmin);
  setNum('drop-founder',_vFounder);
  
  setNum('drop-sub-u',    _vUSec);
  setNum('drop-main-u',   _vUNormal);
  setNum('drop-admin-u',  _vUAdmin);
  setNum('drop-founder-u',_vUFounder);
  
  // Update UI Stats Bar (Total Logins)
  setNum('stat-outer',  _vOuter);
  setNum('stat-sec',    _vSec);
  setNum('stat-inner',  _vNormal);
  setNum('stat-admin',  _vAdmin);
  setNum('stat-founder',_vFounder);

  // Update UI Stats Bar (Unique Logins)
  setNum('stat-real',      _vReal);
  setNum('stat-u-sec',     _vUSec);
  setNum('stat-u-inner',   _vUNormal);
  setNum('stat-u-admin',   _vUAdmin);
  setNum('stat-u-founder', _vUFounder);
}

/* ── ADJUST VIA OFFSETS ── */
function admAdjustCounter(e, key) {
  e.stopPropagation(); closeAllMenus();
  if (_currentLoginRole !== 'founder') return;
  if (_isProtected) { showToast('System is protected. Action denied!'); return; }
  
  _pendingAdjustKey = key;
  var lbls = { 
    outer: '👁 Views', real_visitors: '👤 Unique',
    inner_normal: '🔒 Total', unique_normal: '🔒 Unique',
    inner_secondary: '🗝 Total', unique_secondary: '🗝 Unique',
    admin: '★ Total', unique_admin: '★ Unique',
    founder: '👑 Total', unique_founder: '👑 Unique'
  };
  document.getElementById('adjust-title').textContent = 'Adjust ' + (lbls[key]||'Counter');
  
  var val = { 
    outer: _vOuter, real_visitors: _vReal, 
    inner_normal: _vNormal, inner_secondary: _vSec, admin: _vAdmin, founder: _vFounder,
    unique_normal: _vUNormal, unique_secondary: _vUSec, unique_admin: _vUAdmin, unique_founder: _vUFounder
  }[key] || 0;
  
  var inp = document.getElementById('adjust-input');
  inp.value = val;
  document.getElementById('adjust-overlay').classList.add('open');
  setTimeout(function() { inp.focus(); inp.select(); }, 50);
}

function doAdjustCounter() {
  var val = parseInt(document.getElementById('adjust-input').value) || 0;
  if (val < 0) val = 0;
  var key = _pendingAdjustKey;
  closeAdjust();
  if (!db || !key) return;

  var computed = _rawCounts[key] || 0;
  var newOffset = val - computed;
  db.ref('settings/counter_offsets/' + key).set(newOffset, function() { showToast('✓ Updated successfully!'); });
}

/* ── internal show/hide helpers ── */
function _show(divId, cntId) {
  var d = document.getElementById(divId), c = document.getElementById(cntId);
  if (d) d.style.display = 'block';
  if (c) c.style.display = 'flex';
}
function _hide(divId, cntId) {
  var d = document.getElementById(divId), c = document.getElementById(cntId);
  if (d) d.style.display = 'none';
  if (c) c.style.display = 'none';
}