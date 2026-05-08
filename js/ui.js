/* ══════════════════════════════════════════
   ui.js — Hàm render & cập nhật giao diện
   Tất cả hàm chỉ đọc state rồi phản ánh ra DOM,
   không tự thay đổi state.
   ══════════════════════════════════════════ */

// ── Alias helper ──

function getAliasForId(devId) {
  if (!devId || !_aliases) return null;
  for (var aliasName in _aliases) {
    var ids = _aliases[aliasName].split(',').map(function(s) { return s.trim(); });
    if (ids.indexOf(devId) !== -1) return aliasName;
  }
  return null;
}

// ── Render content areas ──

function renderHints() {
  var el = document.getElementById('pw-hints-display');
  if (!el) return;
  el.innerHTML =
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

// ── System protection UI ──

function updateProtectionUI() {
  var statusText = document.getElementById('shield-status-text');
  var toggleBtn  = document.getElementById('btn-toggle-shield');

  if (_isProtected) {
    document.body.classList.add('is-protected');
    if (statusText) { statusText.textContent = 'ENABLED'; statusText.style.color = 'var(--secure)'; }
    if (toggleBtn)  { toggleBtn.textContent = 'Disable Protection'; toggleBtn.style.background = 'var(--accent)'; toggleBtn.style.borderColor = 'var(--accent)'; }
  } else {
    document.body.classList.remove('is-protected');
    if (statusText) { statusText.textContent = 'DISABLED'; statusText.style.color = 'var(--muted)'; }
    if (toggleBtn)  { toggleBtn.textContent = 'Enable Protection'; toggleBtn.style.background = 'var(--secure)'; toggleBtn.style.borderColor = 'var(--secure)'; }
  }
}

// ── Counters & stats (Tính toán động 100% qua logs sau mốc Cutoff) ──

function _groupSessions(logs, cutoff) {
  var SESSION_GAP = 2 * 60 * 60 * 1000;
  var relevant = logs.filter(function(l) {
    return l.ts >= cutoff && l.type !== 'view';
  }).sort(function(a, b) { return a.ts - b.ts; });

  var byId = {};
  relevant.forEach(function(l) {
    var id = l.deviceId || l.ip || 'unknown';
    if (!byId[id]) byId[id] = [];
    byId[id].push({ ts: l.ts, type: l.type });
  });

  var sessions = [];
  Object.keys(byId).forEach(function(id) {
    var entries = byId[id];
    var curSession = null;
    entries.forEach(function(e) {
      if (!curSession || e.ts - curSession.lastTs > SESSION_GAP) {
        curSession = { id: id, types: new Set(), counts: {}, lastTs: e.ts };
        sessions.push(curSession);
      }
      curSession.types.add(e.type);
      curSession.counts[e.type] = (curSession.counts[e.type] || 0) + 1;
      curSession.lastTs = e.ts;
    });
  });
  return sessions;
}

function updateSessionBreakdown() {
  // Được xử lý tập trung bên trong updateStatsUI để đồng bộ
}

function updateStatsUI() {
  if (!_allLogs) return;

  var cOuter = 0, cSec = 0, cMain = 0, cAdmin = 0, cFounder = 0;
  var uniqueIPs = new Set();

  var sessions = _groupSessions(_allLogs, GLOBAL_CUTOFF);

  // Tính số liệu đăng nhập triệt để theo luật gộp phiên:
  // Nếu Founder đăng nhập trong phiên, mọi log Sub/Main/Admin trong phiên bị XÓA TRẮNG trên hệ thống đếm.
  var uSub = 0, uMain = 0, uAdmin = 0, uFounder = 0; // Unique Sessions

  sessions.forEach(function(s) {
    var hasFounder = s.types.has('login_founder');
    if (hasFounder) {
      uFounder++;
      cFounder += s.counts['login_founder'] || 0;
    } else {
      if (s.types.has('login_secondary')) { uSub++; cSec   += s.counts['login_secondary']; }
      if (s.types.has('login_normal'))    { uMain++; cMain  += s.counts['login_normal']; }
      if (s.types.has('login_admin'))     { uAdmin++; cAdmin += s.counts['login_admin']; }
    }
  });

  // Views tính riêng, quét thuần tùy theo mốc
  _allLogs.forEach(function(l) {
    if (l.ts < GLOBAL_CUTOFF) return;
    if (l.type === 'view') {
      cOuter++;
      if (l.ip) uniqueIPs.add(l.ip);
    }
  });

  var cReal = uniqueIPs.size;

  _vOuter = cOuter;
  _vReal = cReal;

  setNum('login-outer-num', cOuter);
  setNum('num-traffic',     cOuter);
  setNum('drop-views',      cOuter);
  setNum('drop-unique',     cReal);
  setNum('stat-outer',      cOuter);
  setNum('stat-real',       cReal);

  var totalAuth = cMain + cSec + cAdmin + cFounder;
  setNum('num-auth',       totalAuth);
  
  // Tổng thể Auth
  setNum('stat-sub',       cSec);
  setNum('stat-inner',     cMain);
  setNum('stat-admin',     cAdmin);
  setNum('stat-founder',   cFounder);

  // Session Dropdown Breakdown
  setNum('drop-sub-t',     cSec);
  setNum('drop-main-t',    cMain);
  setNum('drop-admin-t',   cAdmin);
  setNum('drop-founder-t', cFounder);

  setNum('drop-sub-u',     uSub);
  setNum('drop-main-u',    uMain);
  setNum('drop-admin-u',   uAdmin);
  setNum('drop-founder-u', uFounder);
}

// ── Notification list ──

function renderNotiList() {
  var listEl = document.getElementById('noti-list');
  if (_allNoti.length === 0) {
    listEl.innerHTML = '<div style="padding:10px; color:var(--muted); font-size:10px;">No new notifications</div>';
    return;
  }
  listEl.innerHTML = _allNoti.map(function(n) {
    var d = new Date(n.ts);
    var timeStr = d.toLocaleDateString('en-US') + ' ' +
                  d.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
    return '<div class="noti-item ' + (n.read ? '' : 'unread') + '">' +
             '<div>' + esc(n.text) + '</div>' +
             '<div class="noti-time">' + timeStr + '</div>' +
           '</div>';
  }).join('');
}

// ── Profile icon ──

function updateProfileIcon() {
  var isNormal   = _currentLoginRole === 'normal' || _currentLoginRole === 'secondary';
  var isAdmin    = _currentLoginRole === 'admin';
  var isFounder  = _currentLoginRole === 'founder';

  document.getElementById('icon-prof-normal').style.display  = isNormal  ? 'block' : 'none';
  document.getElementById('icon-prof-admin').style.display   = isAdmin   ? 'block' : 'none';
  document.getElementById('icon-prof-founder').style.display = isFounder ? 'block' : 'none';

  var pf = document.getElementById('cnt-profile');
  pf.style.color = isFounder ? 'var(--founder)' : (isAdmin ? 'var(--orange)' : 'var(--accent2)');
}

// ── Check block ──

function checkBlock() {
  if (window._myIP && _blockedIPs[window._myIP.replace(/\./g, '-')]) {
    document.body.innerHTML =
      '<div style="display:flex;height:100vh;align-items:center;justify-content:center;' +
      'background:#1a1a2e;color:#e74c3c;font-family:monospace;font-size:24px;' +
      'font-weight:bold;letter-spacing:2px;">ACCESS DENIED</div>';
  }
}

// ── Toggle password visibility ──

function toggleEye() {
  var inp = document.getElementById('pw-input');
  var btn = document.getElementById('pw-eye');
  if (inp.type === 'password') {
    inp.type = 'text';
    btn.innerHTML = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" width="16" height="16"><path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"></path><line x1="1" y1="1" x2="23" y2="23"></line></svg>';
  } else {
    inp.type = 'password';
    btn.innerHTML = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" width="16" height="16"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path><circle cx="12" cy="12" r="3"></circle></svg>';
  }
}

// ── Toast & utility ──

function showToast(msg) {
  var el = document.getElementById('toast');
  el.textContent = msg;
  el.classList.add('show');
  setTimeout(function() { el.classList.remove('show'); }, 2000);
}

function setNum(id, n) {
  var el = document.getElementById(id);
  if (el) el.textContent = n;
}

function esc(s) {
  return String(s || '')
    .replace(/&/g, '&')
    .replace(/</g, '<')
    .replace(/>/g, '>')
    .replace(/"/g, '"')
    .replace(/'/g, "'");
}

function buildLocationStr(log) {
  var parts    = [];
  var district = (log.district || '').trim();
  var city     = (log.city     || '').trim();
  var region   = (log.region   || '').trim();
  var country  = (log.country  || '').trim();
  if (district && district !== city && district !== region) parts.push(district);
  if (city     && city     !== region)                      parts.push(city);
  if (region)                                               parts.push(region);
  if (country)                                              parts.push(country);
  return parts.filter(Boolean).join(', ');
}