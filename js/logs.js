/* ══════════════════════════════════════════
   LOGS — loadLogs, renderLogs, renderIpStats, trash, delete, export
   ══════════════════════════════════════════ */

/* ── HELPER IDENTITY ── */
function getIdentityName(devId) {
  if (!devId) return devId;
  if (_currentLoginRole !== 'founder') return devId;

  for (var key in _identities) {
    var profile = _identities[key];
    var idsArray = (profile && profile.ids) ? profile.ids : (Array.isArray(profile) ? profile : []);
    if (idsArray.indexOf(devId) !== -1) {
      return profile.name || key;
    }
  }
  return devId;
}

/* ── MULTI-ROLE EXCLUSION LOGIC ── */
function updateExclusions() {
  _excludedRanks = Array.from(document.querySelectorAll('.chk-exclude:checked')).map(function(cb) { return cb.value; });
  _excludedProfiles = Array.from(document.querySelectorAll('.chk-exclude-prof:checked')).map(function(cb) { return cb.value; });
  
  var totalExcluded = _excludedRanks.length + _excludedProfiles.length;
  var btn = document.getElementById('btn-exclude-menu');
  if (btn) {
    if (totalExcluded > 0) {
      btn.style.background = 'var(--ink)'; btn.style.color = 'var(--card)';
      btn.innerHTML = '🚫 Excluding (' + totalExcluded + ')';
    } else {
      btn.style.background = 'var(--card)'; btn.style.color = 'var(--ink)';
      btn.innerHTML = '🚫 Exclude Profiles';
    }
  }
  _page = 1; _pageU = 1;
  renderLogs(); renderUniqueLogs(); renderIpStats();
}

function updateGuestExclusions() {
  _guestExcludedRanks = Array.from(document.querySelectorAll('#auth-dropdown input[type="checkbox"]:checked')).map(function(cb) { return cb.value; });
  computeUniqueLogs();
}

function isLogExcluded(log) {
  if (_excludedRanks.length === 0 && _excludedProfiles.length === 0) return false;

  var idenName = log.deviceId ? getIdentityName(log.deviceId) : null;
  if (idenName && _excludedProfiles.indexOf(idenName) !== -1) return true;

  var idenRank = getIdentityRankByDevId(log.deviceId);
  
  if (log.type === 'view') {
    return idenRank ? _excludedRanks.indexOf(idenRank) !== -1 : false;
  }
  
  var passRole = log.type.replace('login_', '');
  var finalRank = passRole;
  if (idenRank && idenRank !== passRole) {
    var rLv = ROLE_LEVEL[idenRank] || 0;
    var pLv = ROLE_LEVEL[passRole] || 0;
    if (rLv > pLv) finalRank = idenRank;
  }
  return _excludedRanks.indexOf(finalRank) !== -1;
}

/* ── COMPUTE UNIQUE LOGS & GUEST COUNTERS ── */
function computeUniqueLogs() {
  var seen = {};
  var uLogs = [];
  var uNorm=new Set(), uSec=new Set(), uAdm=new Set(), uHead=new Set(), uMan=new Set(), uCo=new Set(), uFou=new Set();
  var uDevs=new Set();

  var gNorm=new Set(), gSec=new Set(), gAdm=new Set(), gHead=new Set(), gMan=new Set(), gCo=new Set(), gFou=new Set();
  var gDevs=new Set();

  var guestExcludedIds = new Set();
  var guestExcludeDevsTraffic = new Set();

  var sorted = _allLogs.slice().sort(function(a,b) { return (a.ts||0) - (b.ts||0); });
  sorted.forEach(function(log) {
    if (log.ts >= _UNIQUE_CUTOFF_TS) {
      var id = log.deviceId ? 'dev_' + log.deviceId : 'fp_' + (log.ip||'')+'|'+(log.device||'')+'|'+(log.os||'')+'|'+(log.browser||'')+'|'+(log.screen||'');
      var key = log.type + '_' + id;
      if (!seen[key]) {
        seen[key] = true;
        uLogs.push(log);
      }
      
      // Standard sets
      if (log.type === 'view') uDevs.add(id);
      else if (log.type === 'login_normal') uNorm.add(id);
      else if (log.type === 'login_secondary') uSec.add(id);
      else if (log.type === 'login_admin') uAdm.add(id);
      else if (log.type === 'login_head') uHead.add(id);
      else if (log.type === 'login_manager') uMan.add(id);
      else if (log.type === 'login_cofounder') uCo.add(id);
      else if (log.type === 'login_founder') uFou.add(id);

      // Guest sets (Filtered by cutoff timestamp)
      if (log.ts >= _GUEST_CUTOFF_TS) {
        if (log.type === 'view') gDevs.add(id);
        else if (log.type === 'login_normal') gNorm.add(id);
        else if (log.type === 'login_secondary') gSec.add(id);
        else if (log.type === 'login_admin') gAdm.add(id);
        else if (log.type === 'login_head') gHead.add(id);
        else if (log.type === 'login_manager') gMan.add(id);
        else if (log.type === 'login_cofounder') gCo.add(id);
        else if (log.type === 'login_founder') gFou.add(id);
      }

      // Identify roles for Guest Exclusion
      var passRole = log.type.replace('login_', '');
      var idenRank = getIdentityRankByDevId(log.deviceId);
      var finalRank = passRole;
      if (idenRank && idenRank !== passRole && log.type !== 'view') {
        var rLv = ROLE_LEVEL[idenRank] || 0;
        var pLv = ROLE_LEVEL[passRole] || 0;
        if (rLv > pLv) finalRank = idenRank;
      }

      if (log.type !== 'view' && typeof _guestExcludedRanks !== 'undefined' && _guestExcludedRanks.indexOf(finalRank) !== -1) {
        guestExcludedIds.add(id);
      }

      if (finalRank === 'founder' || idenRank === 'founder') {
        guestExcludeDevsTraffic.add(id);
      }
    }
  });
  
  _uniqueLogs = uLogs.sort(function(a,b) { return (b.ts||0) - (a.ts||0); });
  
  // Calculate Guests by filtering out devices that fall under excluded ranks from the Guest-specific sets
  var filterGuest = function(setObj) {
    var c = 0;
    setObj.forEach(function(id) { if (!guestExcludedIds.has(id)) c++; });
    return c;
  };

  _vGuestSec = filterGuest(gSec);
  _vGuestNormal = filterGuest(gNorm);
  _vGuestAdmin = filterGuest(gAdm);
  _vGuestHead = filterGuest(gHead);
  _vGuestManager = filterGuest(gMan);
  _vGuestCoFounder = filterGuest(gCo);
  _vGuestFounder = filterGuest(gFou);
  
  var cView = 0;
  gDevs.forEach(function(id) { if (!guestExcludeDevsTraffic.has(id)) cView++; });
  _vGuestOuter = cView;
  
  if (typeof updateStatsUI === 'function') updateStatsUI();
}

/* ── FILTER / SORT / SEARCH ── */
function loadLogs() {
  var statusEl = document.getElementById('log-status');
  var tableEl  = document.getElementById('log-table');
  if (!db) { statusEl.innerHTML = '⚠ Firebase unavailable'; statusEl.style.display = 'block'; tableEl.style.display = 'none'; return; }
  statusEl.innerHTML = '<span class="spin">⟳</span> Loading...';
  statusEl.style.display = 'block'; tableEl.style.display = 'none';
  db.ref('logs').orderByChild('ts').once('value', function(snap) {
    _allLogs = [];
    snap.forEach(function(c) {
      var val = c.val();
      if (val && val.ts >= _CUTOFF_TS) _allLogs.push(Object.assign({ _k: c.key }, val));
    });
    _allLogs.reverse();
    computeUniqueLogs();
    statusEl.style.display = 'none';
    _page = 1; _pageU = 1;
    renderLogs(); renderUniqueLogs(); renderIpStats();
  }, function(err) { statusEl.innerHTML = '⚠ Error: ' + err.message; });
}

function getFilteredLogs() {
  var search   = (document.getElementById('log-search').value || '').toLowerCase().trim();
  var dateFrom = document.getElementById('date-from').value;
  var dateTo   = document.getElementById('date-to').value;
  return _allLogs.filter(function(l) {
    if (isLogExcluded(l)) return false;
    if (_filter !== 'all' && l.type !== _filter) return false;
    if (search) {
      var idName = l.deviceId ? getIdentityName(l.deviceId) : '';
      var coordCombo = (l.latitude && l.longitude) ? l.latitude+','+l.longitude : '';
      var hay = [l.deviceId||'', idName||'', l.ip||'', l.city||'', l.district||'', l.region||'', l.country||'',
                 l.latitude||'', l.longitude||'', coordCombo,
                 l.isp||'', l.browser||'', l.device||'', l.os||'', l.ua||'', l.tz||'', l.lang||'',
                 l.screen||'', labelType(l.type), l.authVia ? labelType('login_'+l.authVia) : ''].join(' ').toLowerCase();
      if (hay.indexOf(search) === -1) return false;
    }
    if (dateFrom || dateTo) {
      var dObj = new Date(l.ts);
      if (!isNaN(dObj.getTime())) {
        var ds = dObj.toISOString().slice(0,10);
        if (dateFrom && ds < dateFrom) return false;
        if (dateTo && ds > dateTo) return false;
      } else { return false; }
    }
    return true;
  }).sort(function(a, b) {
    var va = a[_sortField]||'', vb = b[_sortField]||'';
    if (_sortDir === 'asc') return va > vb ? 1 : va < vb ? -1 : 0;
    return va < vb ? 1 : va > vb ? -1 : 0;
  });
}

function getFilteredUniqueLogs() {
  var search   = (document.getElementById('log-search-u').value || '').toLowerCase().trim();
  var dateFrom = document.getElementById('date-from-u').value;
  var dateTo   = document.getElementById('date-to-u').value;
  return _uniqueLogs.filter(function(l) {
    if (isLogExcluded(l)) return false;
    if (_filterU !== 'all' && l.type !== _filterU) return false;
    if (search) {
      var idName = l.deviceId ? getIdentityName(l.deviceId) : '';
      var coordCombo = (l.latitude && l.longitude) ? l.latitude+','+l.longitude : '';
      var hay = [l.deviceId||'', idName||'', l.ip||'', l.city||'', l.district||'', l.region||'', l.country||'',
                 l.latitude||'', l.longitude||'', coordCombo,
                 l.isp||'', l.browser||'', l.device||'', l.os||'', l.ua||'', l.tz||'', l.lang||'',
                 l.screen||'', labelType(l.type), l.authVia ? labelType('login_'+l.authVia) : ''].join(' ').toLowerCase();
      if (hay.indexOf(search) === -1) return false;
    }
    if (dateFrom || dateTo) {
      var dObj = new Date(l.ts);
      if (!isNaN(dObj.getTime())) {
        var ds = dObj.toISOString().slice(0,10);
        if (dateFrom && ds < dateFrom) return false;
        if (dateTo && ds > dateTo) return false;
      } else { return false; }
    }
    return true;
  }).sort(function(a, b) {
    var va = a[_sortFieldU]||'', vb = b[_sortFieldU]||'';
    if (_sortDirU === 'asc') return va > vb ? 1 : va < vb ? -1 : 0;
    return va < vb ? 1 : va > vb ? -1 : 0;
  });
}

function buildLocationStr(log) {
  var parts = [], 
      district = String(log.district||'').trim(), 
      city = String(log.city||'').trim(),
      region = String(log.region||'').trim(), 
      country = String(log.country||'').trim();
  if (district && district !== city && district !== region) parts.push(district);
  if (city && city !== region) parts.push(city);
  if (region)  parts.push(region);
  if (country) parts.push(country);
  return parts.filter(Boolean).join(', ');
}

function geoSrcBadge(src) {
  if (!src) return '';
  var labels = { 1:'ipinfo', 2:'freeipapi', 3:'ipwho', 4:'cf', 5:'geojs', 6:'ipapi' };
  var cls    = { 1:'geo-src-1', 2:'geo-src-2', 3:'geo-src-3', 4:'geo-src-4', 5:'geo-src-2', 6:'geo-src-1' };
  return '<span class="geo-src ' + (cls[src]||'geo-src-1') + '">' + (labels[src]||'geo') + '</span>';
}

function badgeHtml(type) {
  if (type === 'view')            return '<span class="badge badge-view"><span class="badge-icon">👁</span>Page view</span>';
  if (type === 'login_secondary') return '<span class="badge badge-login_normal" style="background:rgba(44,62,122,.05);color:var(--accent2);border-color:rgba(44,62,122,.2)"><span class="badge-icon">🔑</span>Sub</span>';
  if (type === 'login_normal')    return '<span class="badge badge-login_normal"><span class="badge-icon">🔒</span>Main</span>';
  if (type === 'login_admin')     return '<span class="badge badge-login_admin"><span class="badge-icon">🌟</span>Admin</span>';
  if (type === 'login_head')      return '<span class="badge badge-login_head"><span class="badge-icon">⚜️</span>Head</span>';
  if (type === 'login_manager')   return '<span class="badge badge-login_manager"><span class="badge-icon">🔱</span>Manager</span>';
  if (type === 'login_cofounder') return '<span class="badge badge-login_cofounder"><span class="badge-icon">💎</span>Co-Founder</span>';
  if (type === 'login_founder')   return '<span class="badge badge-login_admin" style="background:rgba(142,68,173,.1);color:var(--founder);border-color:rgba(142,68,173,.3)"><span class="badge-icon">👑</span>Founder</span>';
  return '<span class="badge badge-view"><span class="badge-icon">❓</span>Unknown</span>';
}

function labelType(t) {
  if (t === 'view') return '👁 Page view';
  if (t === 'login_secondary') return '🔑 Sub';
  if (t === 'login_normal') return '🔒 Main';
  if (t === 'login_admin') return '🌟 Admin';
  if (t === 'login_head') return '⚜️ Head';
  if (t === 'login_manager') return '🔱 Manager';
  if (t === 'login_cofounder') return '💎 Co-Founder';
  if (t === 'login_founder') return '👑 Founder';
  return 'Unknown';
}

/* ── TOTAL LOGS EVENTS ── */
function setFilter(type) {
  _filter = type; _page = 1;
  ['all','view','login_secondary','login_normal','login_admin','login_head','login_manager','login_cofounder','login_founder'].forEach(function(t) {
    var id = 'f-' + (t==='login_normal'?'normal':t==='login_secondary'?'sec':t==='login_admin'?'admin':t==='login_head'?'head':t==='login_manager'?'manager':t==='login_cofounder'?'cofounder':t==='login_founder'?'founder':t);
    var el = document.getElementById(id);
    if (el) el.classList.toggle('active', t === type);
  });
  renderLogs();
}

function toggleSort(field) {
  if (_sortField === field) _sortDir = _sortDir==='desc'?'asc':'desc';
  else { _sortField = field; _sortDir = 'desc'; }
  ['ts','br'].forEach(function(f) {
    var th = document.getElementById('th-'+f);
    if (!th) return;
    th.classList.remove('sort-asc','sort-desc');
    if (f === _sortField) th.classList.add('sort-' + _sortDir);
  });
  renderLogs();
}

/* ── UNIQUE LOGS EVENTS ── */
function setFilterU(type) {
  _filterU = type; _pageU = 1;
  ['all','view','login_secondary','login_normal','login_admin','login_head','login_manager','login_cofounder','login_founder'].forEach(function(t) {
    var id = 'fu-' + (t==='login_normal'?'normal':t==='login_secondary'?'sec':t==='login_admin'?'admin':t==='login_head'?'head':t==='login_manager'?'manager':t==='login_cofounder'?'cofounder':t==='login_founder'?'founder':t);
    var el = document.getElementById(id);
    if (el) el.classList.toggle('active', t === type);
  });
  renderUniqueLogs();
}

function toggleSortU(field) {
  if (_sortFieldU === field) _sortDirU = _sortDirU==='desc'?'asc':'desc';
  else { _sortFieldU = field; _sortDirU = 'desc'; }
  ['ts','br'].forEach(function(f) {
    var th = document.getElementById('thu-'+f);
    if (!th) return;
    th.classList.remove('sort-asc','sort-desc');
    if (f === _sortFieldU) th.classList.add('sort-' + _sortDirU);
  });
  renderUniqueLogs();
}

/* ── RENDER TABLES ── */
function generateRowHtml(log) {
  var dObj = new Date(log.ts);
  var dstr = isNaN(dObj.getTime()) ? 'Invalid Date' : (dObj.toLocaleDateString('en-US') + ' ' + dObj.toLocaleTimeString('en-US',{hour:'2-digit',minute:'2-digit',second:'2-digit'}));
  var browser = String(log.browser || _detectBrowser(log.ua||'')), 
      device = String(log.device || _detectDevice(log.ua||'')), 
      os = String(log.os || _detectOS(log.ua||''));
  var locStr = buildLocationStr(log), locHtml = locStr ? '📍 ' + esc(locStr) + geoSrcBadge(log.geoSrc) : '<span style="color:var(--muted);font-style:italic">No location</span>';
  var postalStr = log.postal ? ' <span style="color:var(--muted);font-size:8px">[' + esc(String(log.postal)) + ']</span>' : '';
  var ipStr = log.ip ? esc(String(log.ip)) : '–', ispStr = log.isp ? esc(String(log.isp)) : '';
  var coordStr = (log.latitude && log.longitude) ? '<a href="https://maps.google.com/?q='+log.latitude+','+log.longitude+'" target="_blank" style="color:var(--accent2);font-size:8px;text-decoration:none;" title="View map">🗺 '+String(log.latitude).slice(0,8)+','+String(log.longitude).slice(0,8)+'</a>' : '';
  var extra = [log.tz, log.screen].filter(Boolean).map(String).join(' · ');
  
  var mappedName = log.deviceId ? getIdentityName(log.deviceId) : null;
  var isIden = mappedName && mappedName !== log.deviceId;
  var devIdStr = log.deviceId ? 
    '<span class="dev-badge" style="' + (isIden ? 'background:rgba(39,174,96,0.1);color:#27ae60;border-color:rgba(39,174,96,0.3);' : '') + '">' + 
    (isIden ? '👤 ' : '') + esc(String(mappedName)) + '</span>' + 
    ' <span style="cursor:pointer;font-size:10px;opacity:0.6;vertical-align:middle;margin-left:4px;" onclick="openLinkIdentity(\''+esc(String(log.deviceId))+'\')" title="Link to Profile">🔗</span>'
    : '<span style="color:var(--muted);font-style:italic">Unknown</span>';
    
  var authBadgeStr = log.authVia ? '<span class="auth-via-label">via '+labelType('login_'+log.authVia).replace(/[^a-zA-Z\s-]/g, '').trim().toLowerCase()+'</span>' : '';

  var delBtn = '<button class="btn-del-ip allow-protected" style="margin:0 auto" title="Delete log" onclick="deleteSingleLog(\''+String(log._k)+'\', \''+String(log.type)+'\', this)"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/><path d="M10 11v6"/><path d="M14 11v6"/></svg></button>';
  
  return '<tr><td>' + badgeHtml(log.type) + authBadgeStr + '</td><td><span style="color:var(--ink)">' + esc(dstr) + '</span></td><td>' + devIdStr + '</td><td><div class="cell-main">' + esc(browser) + '</div><div class="cell-sub">' + esc(device) + (os?' · '+esc(os):'') + '</div></td><td><div class="cell-loc">' + locHtml + postalStr + '</div><div class="cell-ip">🌐 ' + ipStr + (coordStr?'  '+coordStr:'') + '</div>' + (ispStr?'<div class="cell-isp">'+ispStr+(log.asn?' · '+esc(String(log.asn)):'')+'</div>':'') + '</td><td><div class="cell-sub">' + esc(extra) + '</div></td><td style="vertical-align:middle;">' + delBtn + '</td></tr>';
}

function renderLogs() {
  try {
    var list = getFilteredLogs();
    var countEl = document.getElementById('log-count');
    if (countEl) countEl.textContent = list.length + ' records';
    var tbody = document.getElementById('log-body'), tableEl = document.getElementById('log-table'), statusEl = document.getElementById('log-status');
    if (!tbody) return;
    if (list.length === 0) {
      statusEl.innerHTML = 'No matching records found'; statusEl.style.display = 'block'; tableEl.style.display = 'none';
      document.getElementById('log-pagination').innerHTML = '';
      return;
    }
    var totalPages = Math.ceil(list.length / _perPage);
    if (_page > totalPages) _page = Math.max(1, totalPages);
    var start = (_page-1)*_perPage, end = Math.min(start+_perPage, list.length), pageList = list.slice(start, end);

    tbody.innerHTML = pageList.map(generateRowHtml).join('');
    tableEl.style.display = 'table'; statusEl.style.display = 'none';
    renderPagination(totalPages, list.length, start, end, 'log-pagination', 'goPage', _page);
  } catch (err) { console.error("renderLogs Error:", err); }
}

function renderUniqueLogs() {
  try {
    var list = getFilteredUniqueLogs();
    var countEl = document.getElementById('log-count-u');
    if (countEl) countEl.textContent = list.length + ' records';
    var tbody = document.getElementById('log-body-u'), tableEl = document.getElementById('log-table-u'), statusEl = document.getElementById('log-status-u');
    if (!tbody) return;
    if (list.length === 0) {
      statusEl.innerHTML = 'No matching records found'; statusEl.style.display = 'block'; tableEl.style.display = 'none';
      document.getElementById('log-pagination-u').innerHTML = '';
      return;
    }
    var totalPages = Math.ceil(list.length / _perPage);
    if (_pageU > totalPages) _pageU = Math.max(1, totalPages);
    var start = (_pageU-1)*_perPage, end = Math.min(start+_perPage, list.length), pageList = list.slice(start, end);

    tbody.innerHTML = pageList.map(generateRowHtml).join('');
    tableEl.style.display = 'table'; statusEl.style.display = 'none';
    renderPagination(totalPages, list.length, start, end, 'log-pagination-u', 'goPageU', _pageU);
  } catch (err) { console.error("renderUniqueLogs Error:", err); }
}

function renderPagination(total, count, start, end, containerId, fnName, currentPage) {
  var pg = document.getElementById(containerId);
  if (total <= 1) { pg.innerHTML = ''; return; }
  var html = '<button class="pg-btn" onclick="'+fnName+'('+(currentPage-1)+')" '+(currentPage<=1?'disabled':'')+'>←</button>';
  var rs = Math.max(1, currentPage-2), re = Math.min(total, currentPage+2);
  if (rs > 1) html += '<button class="pg-btn" onclick="'+fnName+'(1)">1</button>';
  if (rs > 2) html += '<span class="pg-info">…</span>';
  for (var i=rs; i<=re; i++) html += '<button class="pg-btn'+(i===currentPage?' active':'')+'" onclick="'+fnName+'('+i+')">'+i+'</button>';
  if (re < total-1) html += '<span class="pg-info">…</span>';
  if (re < total)   html += '<button class="pg-btn" onclick="'+fnName+'('+total+')">'+total+'</button>';
  html += '<button class="pg-btn" onclick="'+fnName+'('+(currentPage+1)+')" '+(currentPage>=total?'disabled':'')+'>→</button>';
  html += '<span class="pg-info">'+(start+1)+'–'+end+' / '+count+'</span>';
  pg.innerHTML = html;
}

function goPage(n) { _page = n; renderLogs(); }
function goPageU(n) { _pageU = n; renderUniqueLogs(); }

/* ── DELETE / TRASH ── */
function deleteSingleLog(key, type, btnEl) {
  var lv = ROLE_LEVEL[_currentLoginRole] || 1;
  if (_isProtected && lv < 6) { showToast('System is protected. Action denied!'); return; }
  _pendingSingleDelete = { key: key, type: type, row: btnEl.closest('tr') };
  document.getElementById('confirm-title').textContent = 'Move Log to Trash?';
  document.getElementById('confirm-msg').innerHTML = 'This log entry will be moved to the Trash and the counter will be deducted.<br><span style="font-size:11px;color:var(--muted)">Logs in trash are kept for 24 hours.</span>';
  document.getElementById('confirm-yes').onclick = function() { doDeleteSingleLog(); };
  document.getElementById('confirm-overlay').classList.add('open');
}

function doDeleteSingleLog() {
  var lv = ROLE_LEVEL[_currentLoginRole] || 1;
  if (_isProtected && lv < 6) { showToast('System is protected!'); return; }
  closeConfirm();
  if (!db || !_pendingSingleDelete) return;
  var key = _pendingSingleDelete.key, type = _pendingSingleDelete.type, row = _pendingSingleDelete.row;
  var logObj = _allLogs.find(function(l) { return String(l._k) === String(key); });
  if (!logObj) return;
  if (row) { row.style.opacity = '0'; setTimeout(function() { row.remove(); }, 300); }
  var trashData = Object.assign({}, logObj); 
  delete trashData._k; 
  trashData.deletedAt = Date.now();
  
  var updates = {}; updates['trash/logs/' + key] = trashData; updates['logs/' + key] = null;
 
  db.ref().update(updates, function(err) {
    if (err) { showToast('⚠ Error wiping log!'); return; }
    showToast('✓ Log moved to trash!');
    _pendingSingleDelete = null;
  });
}

function deleteDeviceLogs(keysStr, btnEl) {
  var lv = ROLE_LEVEL[_currentLoginRole] || 1;
  if (_isProtected && lv < 6) { showToast('System is protected. Action denied!'); return; }
  try { _pendingDeleteKeys = JSON.parse(keysStr); } catch(e) { return; }
  _pendingDeleteRow = btnEl.closest('.ip-row');
  document.getElementById('confirm-title').textContent = 'Delete IP / Device?';
  document.getElementById('confirm-msg').innerHTML = 'This IP/Device and ALL related logs will be <strong>permanently deleted</strong>. ALL traces will be wiped.<br><strong style="color:var(--accent)">Note: Traffic counters will also be instantly deducted!</strong>';
  document.getElementById('confirm-yes').onclick = function() { doDeleteDeviceLogs(); };
  document.getElementById('confirm-overlay').classList.add('open');
}

function doDeleteDeviceLogs() {
  var lv = ROLE_LEVEL[_currentLoginRole] || 1;
  if (_isProtected && lv < 6) { showToast('System is protected!'); return; }
  closeConfirm();
  if (!db || !_pendingDeleteKeys || !_pendingDeleteKeys.length) return;
 
  if (_pendingDeleteRow) {
    _pendingDeleteRow.style.opacity = '0'; _pendingDeleteRow.style.transform = 'scale(0.95)';
    setTimeout(function() { if (_pendingDeleteRow) _pendingDeleteRow.remove(); }, 300);
  }
  var updates = {};
  _pendingDeleteKeys.forEach(function(k) { updates['logs/' + k] = null; });
  db.ref().update(updates, function(err) {
    if (err) { showToast('⚠ Error deleting traces!'); return; }
    showToast('✓ IP completely wiped!');
    _pendingDeleteKeys = [];
  });
}

function openTrash() {
  var lv = ROLE_LEVEL[_currentLoginRole] || 1;
  if (_isProtected && lv < 6) { showToast('System is protected!'); return; }
  document.getElementById('trash-overlay').classList.add('open');
  var listEl = document.getElementById('trash-list');
  listEl.innerHTML = '<div style="text-align:center;padding:20px;"><span class="spin">⟳</span> Loading trash...</div>';
  db.ref('trash/logs').once('value', function(snap) {
    var now = Date.now(), items = [], toDelete = {};
    snap.forEach(function(c) {
      var val = c.val();
      if (val && now - (val.deletedAt||0) > 86400000) toDelete['trash/logs/' + c.key] = null;
      else items.push(Object.assign({ _k: c.key }, val||{}));
    });
    if (Object.keys(toDelete).length > 0) db.ref().update(toDelete);
    items.sort(function(a,b) { return (b.deletedAt||0) - (a.deletedAt||0); });
    if (items.length === 0) {
      listEl.innerHTML = '<div style="text-align:center;padding:20px;color:var(--muted)">Trash is empty.</div>';
    } else {
      listEl.innerHTML = items.map(function(item) {
        var dObj = new Date(item.ts), delD = new Date(item.deletedAt);
        var tsStr = isNaN(dObj) ? 'N/A' : dObj.toLocaleDateString()+' '+dObj.toLocaleTimeString([],{hour:'2-digit',minute:'2-digit'});
        var delStr = isNaN(delD) ? 'N/A' : delD.toLocaleString();
        return '<div style="display:flex;justify-content:space-between;align-items:center;border-bottom:1px solid var(--border);padding:8px 4px;">' +
          '<div><span style="color:var(--accent)">['+labelType(item.type)+']</span> '+tsStr+'<br>' +
          '<span style="color:var(--muted);font-size:8px;">IP: '+(item.ip||'Unknown')+' | Del: '+delStr+'</span></div>' +
          '<button style="padding:4px 8px;border:1px solid var(--secure);background:transparent;color:var(--secure);cursor:pointer;font-family:\'Nunito\',sans-serif;font-weight:bold;font-size:10px;border-radius:3px;" onclick="restoreLog(\''+String(item._k)+'\')">Restore</button>' +
          '</div>';
      }).join('');
    }
  });
}

function closeTrash() { document.getElementById('trash-overlay').classList.remove('open'); }

function restoreLog(key) {
  var lv = ROLE_LEVEL[_currentLoginRole] || 1;
  if (_isProtected && lv < 6) { showToast('System is protected!'); return; }
  db.ref('trash/logs/' + key).once('value', function(snap) {
    var data = snap.val(); if (!data) { showToast('Log not found!'); return; }
    delete data.deletedAt;
    var updates = {}; updates['logs/' + key] = data; updates['trash/logs/' + key] = null;
    db.ref().update(updates, function(err) {
      if (err) { showToast('⚠ Error restoring log!'); return; }
      showToast('✓ Log restored!');
      openTrash();
    });
  });
}

/* ── DEVICE FINGERPRINT STATS ── */
function setIpMode(mode) {
  _ipMode = mode;
  ['all','normal','sec','admin','head','manager','cofounder','founder'].forEach(function(m) {
    var el = document.getElementById('ipt-'+m); if (el) el.classList.toggle('active', m === mode);
  });
  renderIpStats();
}

function buildDeviceMap(typeFilter) {
  var map = {}, idToGroup = {}, fpToGroup = {}, profileToGroup = {}, groupCounter = 0;
  var logs = _allLogs.slice().sort(function(a,b) { return (a.ts||0) - (b.ts||0); });
  
  logs.forEach(function(log) {
    if (log.type === 'view') return;
    if (isLogExcluded(log)) return;
    
    if (typeFilter === 'sec'       && log.type !== 'login_secondary') return;
    if (typeFilter === 'normal'    && log.type !== 'login_normal')    return;
    if (typeFilter === 'admin'     && log.type !== 'login_admin')     return;
    if (typeFilter === 'head'      && log.type !== 'login_head')      return;
    if (typeFilter === 'manager'   && log.type !== 'login_manager')   return;
    if (typeFilter === 'cofounder' && log.type !== 'login_cofounder') return;
    if (typeFilter === 'founder'   && log.type !== 'login_founder')   return;
    
    var devId = log.deviceId || '', fp = (log.ip||'')+'|'+(log.device||'')+'|'+(log.os||'')+'|'+(log.browser||'')+'|'+(log.screen||'');
    var profileName = devId ? getIdentityName(devId) : null;
    var isIden = profileName && profileName !== devId;
    var groupId = null;
    
    if (isIden) {
      if (!profileToGroup[profileName]) { groupCounter++; profileToGroup[profileName] = 'G' + groupCounter; }
      groupId = profileToGroup[profileName];
    } else if (devId && idToGroup[devId]) { groupId = idToGroup[devId]; }
    else if (fpToGroup[fp]) { groupId = fpToGroup[fp]; }
    else { groupCounter++; groupId = 'G' + groupCounter; }
    
    if (devId) idToGroup[devId] = groupId; fpToGroup[fp] = groupId;
    
    if (!map[groupId]) map[groupId] = { profile: (isIden ? profileName : null), id: devId||log.ip||'Unknown Visitor', groupId: groupId, logKeys: [], devIds: [], ips: [], total:0, sec:0, normal:0, admin:0, head:0, manager:0, cofounder:0, founder:0, lastTs:0, ip:log.ip||'', city:log.city||'', district:log.district||'', region:log.region||'', country:log.country||'', isp:log.isp||'', browser:log.browser||_detectBrowser(log.ua||''), device:log.device||_detectDevice(log.ua||''), os:log.os||_detectOS(log.ua||'') };
    var entry = map[groupId];
    if (isIden && !entry.profile) entry.profile = profileName;

    if (log._k) entry.logKeys.push(log._k);
    if (devId && entry.devIds.indexOf(devId) === -1) entry.devIds.push(devId);
    if (log.ip && entry.ips.indexOf(log.ip) === -1)  entry.ips.push(log.ip);
    entry.total++;
    // Đếm số liệu nhóm DỰA TRÊN log.type đã đóng băng
    if (log.type === 'login_secondary') entry.sec++;
    if (log.type === 'login_normal')  entry.normal++;
    if (log.type === 'login_admin')   entry.admin++;
    if (log.type === 'login_head')    entry.head++;
    if (log.type === 'login_manager') entry.manager++;
    if (log.type === 'login_cofounder') entry.cofounder++;
    if (log.type === 'login_founder') entry.founder++;
    if ((log.ts||0) >= entry.lastTs) {
      entry.lastTs = log.ts||0;
      if (log.ip) entry.ip = log.ip; if (log.city) entry.city = log.city; if (log.district) entry.district = log.district;
      if (log.region) entry.region = log.region; if (log.country) entry.country = log.country; if (log.isp) entry.isp = log.isp;
      if (log.browser) entry.browser = log.browser; if (log.device) entry.device = log.device; if (log.os) entry.os = log.os;
    }
  });
  return map;
}

function renderIpStats() {
  try {
    var grid = document.getElementById('ip-stats-grid'); if (!grid) return;
    var cols = [
      { key:'all',       label:'All Users',  cls:'col-all',        numCls:'cnt-all',    barCls:'bar-all',       icon:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="7" r="4"/><path d="M5.5 21a8.38 8.38 0 0 1 13 0"/></svg>' },
      { key:'sec',       label:'🔑 Sub',     cls:'col-normal',    numCls:'cnt-normal', barCls:'bar-normal',    icon:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="11" width="18" height="11" rx="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg>' },
      { key:'normal',    label:'🔒 Main',    cls:'col-normal',    numCls:'cnt-normal', barCls:'bar-normal',    icon:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="11" width="18" height="11" rx="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg>' },
      { key:'admin',     label:'🌟 Admin',   cls:'col-admin',     numCls:'cnt-admin',  barCls:'bar-admin',     icon:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 2l3 7h7l-6 4 2 7-6-4-6 4 2-7-6-4h7z"/></svg>' },
      { key:'head',      label:'⚜️ Head',      cls:'col-head',      numCls:'cnt-admin',  barCls:'bar-head',      icon:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 2l3 7h7l-6 4 2 7-6-4-6 4 2-7-6-4h7z"/></svg>' },
      { key:'manager',   label:'🔱 Manager',   cls:'col-manager',   numCls:'cnt-admin',  barCls:'bar-manager',   icon:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 2l3 7h7l-6 4 2 7-6-4-6 4 2-7-6-4h7z"/></svg>' },
      { key:'cofounder', label:'💎 Co-Founder',cls:'col-cofounder', numCls:'cnt-admin',  barCls:'bar-cofounder', icon:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polygon points="12 4 8 11 2 4 5 16 19 16 22 4 16 11 12 4"></polygon><line x1="5" y1="20" x2="19" y2="20"></line></svg>' },
      { key:'founder',   label:'👑 Founder', cls:'col-founder',   numCls:'cnt-admin',  barCls:'bar-founder',   icon:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polygon points="12 4 8 11 2 4 5 16 19 16 22 4 16 11 12 4"></polygon><line x1="5" y1="20" x2="19" y2="20"></line></svg>' }
    ];
    var showKeys = _ipMode === 'all' ? ['all','sec','normal','admin','head','manager','cofounder','founder'] : [_ipMode];
    var filteredCols = cols.filter(function(c) { return showKeys.indexOf(c.key) !== -1; });
    var html = '';

    filteredCols.forEach(function(col) {
      var map = buildDeviceMap(col.key);
      var cnt = function(e) { 
        if (col.key==='sec') return e.sec; if (col.key==='normal') return e.normal; 
        if (col.key==='admin') return e.admin; if (col.key==='head') return e.head;
        if (col.key==='manager') return e.manager; if (col.key==='cofounder') return e.cofounder;
        if (col.key==='founder') return e.founder; return e.total; 
      };
      var sorted = Object.values(map).sort(function(a,b) { return cnt(b) - cnt(a); });
      var top = sorted.slice(0, 8), maxCount = top.length ? cnt(top[0]) : 1;
      html += '<div class="ip-col-wrap"><div class="ip-col-head '+col.cls+'">'+col.icon+' '+esc(col.label)+'</div>';
      if (top.length === 0) { html += '<div class="ip-empty">No data</div>'; }
      else top.forEach(function(entry, idx) {
        var rank = idx+1, rankCls = rank<=3?' rank-'+rank:'', count = cnt(entry), barPct = maxCount>0?Math.round(count/maxCount*100):0;
        var locStr = buildLocationStr(entry), accessInfo = [entry.browser, entry.device, entry.os].filter(Boolean).map(String).join(' · ');
        var lastStr = entry.lastTs ? new Date(entry.lastTs).toLocaleDateString('en-US')+' '+new Date(entry.lastTs).toLocaleTimeString('en-US',{hour:'2-digit',minute:'2-digit'}) : '';
        
        var ipDisplay = entry.ips.length>0 ? String(entry.ips[0])+(entry.ips.length>1?' (+'+(entry.ips.length-1)+')':'') : 'Unknown IP';
        
        var profileTitle = entry.profile ? '<div style="font-weight:900;color:#27ae60;font-size:14px;margin-bottom:4px;display:flex;align-items:center;gap:4px;">👤 ' + esc(String(entry.profile)) + ' <span style="cursor:pointer;font-size:12px;opacity:0.6;" onclick="openLinkIdentity(\''+esc(String(entry.devIds[0]||''))+'\')" title="Link to Profile">🔗</span></div>' : '';

        html += '<div class="ip-row"><div class="ip-rank'+rankCls+'">#'+rank+'</div><div class="ip-info">';
        if (profileTitle) html += profileTitle;
        
        html += '<div class="ip-addr" style="display:flex;align-items:center;gap:4px;">🌐 '+esc(ipDisplay);
        if (!entry.profile && entry.devIds.length > 0) {
          html += ' <span style="cursor:pointer;font-size:12px;opacity:0.6;" onclick="openLinkIdentity(\''+esc(String(entry.devIds[0]))+'\')" title="Link to Profile">🔗</span>';
        }
        html += '</div>';
        
        if (entry.devIds && entry.devIds.length>0) html += '<div style="margin-top:4px;margin-bottom:2px;">'+entry.devIds.map(function(id){ return '<span class="dev-badge" style="margin-right:4px;font-size:8px;">'+esc(String(id))+'</span>'; }).join('')+'</div>';
        if (locStr) html += '<div class="ip-location">📍 '+esc(locStr)+'</div>';
        if (accessInfo) html += '<div class="ip-isp">'+esc(accessInfo)+'</div>';
        if (entry.isp) html += '<div class="ip-isp" style="color:var(--muted)">'+esc(String(entry.isp))+'</div>';
        if (lastStr) html += '<div class="ip-last">🕐 '+esc(lastStr)+'</div>';
        html += '<div class="ip-bar-wrap"><div class="ip-bar '+col.barCls+'" style="width:'+barPct+'%"></div></div></div>';
        html += '<div class="ip-count-badge"><div class="ip-count-num '+col.numCls+'">'+count+'</div><div class="ip-count-label">times</div></div>';
        var keysStr = JSON.stringify(entry.logKeys).replace(/"/g,'"');
        html += '<div style="display:flex;flex-direction:column;">';
        html += '<button class="btn-del-ip allow-protected" title="Delete completely" data-keys="'+keysStr+'" onclick="deleteDeviceLogs(this.dataset.keys,this)"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/><path d="M10 11v6"/><path d="M14 11v6"/></svg></button>';
        if (entry.ips.length>0) html += '<button class="btn-block-ip allow-protected" title="Block this IP" onclick="blockIP(\''+esc(String(entry.ips[0]))+'\')"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"></circle><line x1="4.93" y1="4.93" x2="19.07" y2="19.07"></line></svg></button>';
        html += '</div></div>';
      });
      html += '</div>';
    });

    grid.style.gridTemplateColumns = filteredCols.length > 1 ? 'repeat(auto-fit, minmax(240px, 1fr))' : '1fr';
    grid.innerHTML = html;
  } catch (err) { console.error("renderIpStats Error:", err); }
}

/* ── CSV EXPORT ── */
function exportCSV() {
  var list = getFilteredLogs();
  var rows = [['Type','Auth Via','Timestamp','Profile Name','Device ID','IP Address','District','City','Region','Country','Postal Code','Coordinates','ISP','ASN','Browser','Device','OS','Timezone','Language','Screen','Geo Source']];
  var srcMap = {1:'ipinfo.io', 2:'freeipapi.com', 3:'ipwho.is', 4:'cloudflare-trace', 5:'geojs.io', 6:'ipapi.co'};
  list.forEach(function(l) {
    var dObj = new Date(l.ts);
    var dstr = isNaN(dObj.getTime()) ? 'Invalid Date' : (dObj.toLocaleDateString('en-US') + ' ' + dObj.toLocaleTimeString('en-US'));
    var coord = (l.latitude && l.longitude) ? l.latitude+','+l.longitude : '';
    var profile = l.deviceId ? getIdentityName(l.deviceId) : '';
    profile = (profile === l.deviceId) ? '' : profile; 
    
    var typeText = labelType(l.type).replace(/[^a-zA-Z\s-]/g, '').trim();
    var viaText = l.authVia ? labelType('login_'+l.authVia).replace(/[^a-zA-Z\s-]/g, '').trim().toLowerCase() : '';

    rows.push([typeText, viaText, dstr, profile, l.deviceId||'', l.ip||'', l.district||'', l.city||'', l.region||'', l.country||'', l.postal||'', coord, l.isp||'', l.asn||'', l.browser||_detectBrowser(l.ua||''), l.device||_detectDevice(l.ua||''), l.os||_detectOS(l.ua||''), l.tz||'', l.lang||'', l.screen||'', srcMap[l.geoSrc]||'']);
  });
  var csv = rows.map(function(r) { return r.map(function(c) { return '"'+String(c).replace(/"/g,'""')+'"'; }).join(','); }).join('\n');
  var blob = new Blob(['\ufeff'+csv], {type:'text/csv;charset=utf-8'});
  var url = URL.createObjectURL(blob), a = document.createElement('a');
  a.href = url; a.download = 'logs_'+Date.now()+'.csv';
  document.body.appendChild(a); a.click(); document.body.removeChild(a);
  URL.revokeObjectURL(url); showToast('✓ CSV Exported!');
}