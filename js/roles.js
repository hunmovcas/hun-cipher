/* ══════════════════════════════════════════
   ROLES — RBAC, switch role, apply mode UI
   ══════════════════════════════════════════ */

function updateProfileIcon() {
  var lv = ROLE_LEVEL[_currentLoginRole] || 1;
  document.getElementById('icon-prof-normal').style.display  = (lv <= 2) ? 'block' : 'none';
  document.getElementById('icon-prof-admin').style.display   = (lv >= 3 && lv < 7) ? 'block' : 'none';
  document.getElementById('icon-prof-founder').style.display = (lv === 7) ? 'block' : 'none';
  
  var pf = document.getElementById('cnt-profile');
  if (lv === 7) pf.style.color = 'var(--founder)';
  else if (lv === 6) pf.style.color = 'var(--cofounder)';
  else if (lv === 5) pf.style.color = 'var(--manager)';
  else if (lv === 4) pf.style.color = 'var(--head)';
  else if (lv === 3) pf.style.color = 'var(--orange)';
  else pf.style.color = 'var(--accent2)';
}

function applyAdminModeUI() {
  var lv = ROLE_LEVEL[_currentLoginRole] || 1;
  
  // Manager(5), Co-Founder(6), Founder(7) có UI của Founder
  if (lv >= 5) document.body.classList.add('role-founder');
  else document.body.classList.remove('role-founder');
  
  // Admin(3) trở lên có giao diện Admin
  if (lv >= 3) document.body.classList.add('role-admin');
  else document.body.classList.remove('role-admin');

  document.querySelectorAll('.normal-only').forEach(function(el)    { el.style.display = 'none'; });
  document.querySelectorAll('.protected-only').forEach(function(el) { el.style.display = 'block'; });
  document.querySelectorAll('.admin-only').forEach(function(el)     { el.style.display = 'block'; });

  _show('div-shield', 'cnt-shield');
  _show('div-traffic','cnt-traffic');
  _show('div-auth',   'cnt-auth');
  _show('div-profile','cnt-profile');
  
  // Notification (CHỈ FOUNDER nhận được)
  if (lv === 7) {
    _show('div-noti', 'cnt-noti');
    fbListenNoti();
  } else {
    _hide('div-noti', 'cnt-noti');
  }

  var uView = document.getElementById('item-unique-view');
  if (uView) uView.style.display = 'flex';

  // Elevate (Ẩn với người đã đạt max level - Founder)
  if (lv < 7) { _show('div-elevate', 'cnt-elevate'); }
  else { _hide('div-elevate', 'cnt-elevate'); }

  _hide('div-secret', 'cnt-secret');

  // Switch Role (Head(4) trở lên hoặc đã biết pass Founder)
  if (lv >= 4 || sessionStorage.getItem('hun_known_founder') === 'true') {
    _show('div-switch', 'cnt-switch');
  } else {
    _hide('div-switch', 'cnt-switch');
  }

  updateProfileIcon();
  updateProtectionUI();
}

function applyUserModeUI() {
  document.body.classList.remove('role-founder');
  document.body.classList.remove('role-admin');

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
  updateProtectionUI();
}

/* ── SWITCH ROLE ── */
function switchRole(newRole) {
  var lv = ROLE_LEVEL[_currentLoginRole] || 1;
  if (lv < 4 && sessionStorage.getItem('hun_known_founder') !== 'true') { showToast('Access Denied'); return; }
  
  if (_currentLoginRole === newRole) { showToast('Already in this role!'); return; }
  _currentLoginRole = newRole;
  
  var newLv = ROLE_LEVEL[newRole] || 1;
  if (newLv >= 3) {
    _isAdmin = true;
    applyAdminModeUI();
  } else {
    _isAdmin = false;
    applyUserModeUI();
    if (document.getElementById('log-screen').style.display === 'block') {
      navPush('main-' + _mode); applyNav('main-' + _mode);
    }
  }
  closeAllMenus();
  showToast('✓ Switched role to ' + newRole.toUpperCase() + '!');
}

/* ── PROTECTION UI ── */
function updateProtectionUI() {
  var lv = ROLE_LEVEL[_currentLoginRole] || 1;
  var isImmune = (lv >= 6); // Founder và Co-Founder miễn nhiễm
  
  var shieldText = document.getElementById('shield-status-text');
  var shieldBtn = document.getElementById('btn-toggle-shield');
  
  if (_isProtected) {
    if (!isImmune) { document.body.classList.add('is-protected'); } 
    else { document.body.classList.remove('is-protected'); }
    
    if (shieldText) {
      shieldText.textContent = isImmune ? 'ENABLED (IMMUNE)' : 'ENABLED';
      shieldText.style.color = isImmune ? 'var(--orange)' : 'var(--secure)';
    }
    if (shieldBtn) {
      shieldBtn.textContent  = 'Disable Protection';
      shieldBtn.style.background  = 'var(--accent)';
      shieldBtn.style.borderColor = 'var(--accent)';
    }
  } else {
    document.body.classList.remove('is-protected');
    if (shieldText) {
      shieldText.textContent = 'DISABLED';
      shieldText.style.color = 'var(--muted)';
    }
    if (shieldBtn) {
      shieldBtn.textContent  = 'Enable Protection';
      shieldBtn.style.background  = 'var(--secure)';
      shieldBtn.style.borderColor = 'var(--secure)';
    }
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

  var totalAuth = _vNormal + _vSec + _vAdmin + _vHead + _vManager + _vCoFounder + _vFounder;
  setNum('num-auth', totalAuth);
  
  // Update Dropdown Session Breakdown
  setNum('drop-sub',       _vSec);
  setNum('drop-main',      _vNormal);
  setNum('drop-admin',     _vAdmin);
  setNum('drop-head',      _vHead);
  setNum('drop-manager',   _vManager);
  setNum('drop-cofounder', _vCoFounder);
  setNum('drop-founder',   _vFounder);
  
  setNum('drop-sub-u',       _vUSec);
  setNum('drop-main-u',      _vUNormal);
  setNum('drop-admin-u',     _vUAdmin);
  setNum('drop-head-u',      _vUHead);
  setNum('drop-manager-u',   _vUManager);
  setNum('drop-cofounder-u', _vUCoFounder);
  setNum('drop-founder-u',   _vUFounder);
  
  // Update UI Stats Bar (Total Logins)
  setNum('stat-outer',     _vOuter);
  setNum('stat-sec',       _vSec);
  setNum('stat-inner',     _vNormal);
  setNum('stat-admin',     _vAdmin);
  setNum('stat-head',      _vHead);
  setNum('stat-manager',   _vManager);
  setNum('stat-cofounder', _vCoFounder);
  setNum('stat-founder',   _vFounder);

  // Update UI Stats Bar (Unique Logins)
  setNum('stat-real',        _vReal);
  setNum('stat-u-sec',       _vUSec);
  setNum('stat-u-inner',     _vUNormal);
  setNum('stat-u-admin',     _vUAdmin);
  setNum('stat-u-head',      _vUHead);
  setNum('stat-u-manager',   _vUManager);
  setNum('stat-u-cofounder', _vUCoFounder);
  setNum('stat-u-founder',   _vUFounder);
}

/* ── ADJUST VIA OFFSETS ── */
function admAdjustCounter(e, key) {
  e.stopPropagation(); closeAllMenus();
  var lv = ROLE_LEVEL[_currentLoginRole] || 1;
  
  if (lv < 5) return; // Chỉ Manager trở lên mới được phép dùng
  if (_isProtected && lv < 6) { showToast('System is protected. Action denied!'); return; }
  
  _pendingAdjustKey = key;
  var lbls = { 
    outer: '👁 Views', real_visitors: '👤 Unique',
    inner_normal: '🔒 Total', unique_normal: '🔒 Unique',
    inner_secondary: '🔑 Total', unique_secondary: '🔑 Unique',
    admin: '🌟 Total', unique_admin: '🌟 Unique',
    head: '⚜️ Total', unique_head: '⚜️ Unique',
    manager: '🔱 Total', unique_manager: '🔱 Unique',
    cofounder: '💎 Total', unique_cofounder: '💎 Unique',
    founder: '👑 Total', unique_founder: '👑 Unique'
  };
  document.getElementById('adjust-title').textContent = 'Adjust ' + (lbls[key]||'Counter');
  
  var val = { 
    outer: _vOuter, real_visitors: _vReal, 
    inner_normal: _vNormal, inner_secondary: _vSec, admin: _vAdmin, head: _vHead, manager: _vManager, cofounder: _vCoFounder, founder: _vFounder,
    unique_normal: _vUNormal, unique_secondary: _vUSec, unique_admin: _vUAdmin, unique_head: _vUHead, unique_manager: _vUManager, unique_cofounder: _vUCoFounder, unique_founder: _vUFounder
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