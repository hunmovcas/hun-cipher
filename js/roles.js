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
  setNum('drop-views',      _vOuter);
  setNum('drop-unique',     _vReal);
  setNum('stat-outer',      _vOuter);
  setNum('stat-real',       _vReal);

  var totalAuth = _vNormal + _vSec + _vAdmin + _vFounder;
  setNum('num-auth',    totalAuth);
  setNum('drop-main',   _vNormal);
  setNum('drop-sub',    _vSec);
  setNum('drop-admin',  _vAdmin);
  setNum('drop-founder',_vFounder);
  setNum('stat-inner',  _vNormal + _vSec);
  setNum('stat-admin',  _vAdmin);
  setNum('stat-founder',_vFounder);
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