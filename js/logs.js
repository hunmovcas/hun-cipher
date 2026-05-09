/* ══════════════════════════════════════════
   LOGS — loadLogs, renderLogs, renderIpStats, trash, delete, export
   ══════════════════════════════════════════ */

/* ── COMPUTE UNIQUE LOGS ── */
function computeUniqueLogs() {
  var seen = {};
  var uLogs = [];
  var sorted = _allLogs.slice().sort(function(a,b) { return a.ts - b.ts; });
  sorted.forEach(function(log) {
    if (log.ts >= _UNIQUE_CUTOFF_TS) {
      var id = log.deviceId ? 'dev_' + log.deviceId : 'fp_' + (log.ip||'')+'|'+(log.device||'')+'|'+(log.os||'')+'|'+(log.browser||'')+'|'+(log.screen||'');
      var key = log.type + '_' + id;
      if (!seen[key]) {
        seen[key] = true;
        uLogs.push(log);
      }
    }
  });
  _uniqueLogs = uLogs.sort(function(a,b) { return b.ts - a.ts; });
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
      if (val.ts >= _CUTOFF_TS) _allLogs.push(Object.assign({ _k: c.key }, val));
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
    if (_filter !== 'all' && l.type !== _filter) return false;
    if (search) {
      var hay = [l.deviceId||'', l.ip||'', l.city||'', l.district||'', l.region||'', l.country||'',
                 l.isp||'', l.browser||'', l.device||'', l.os||'', l.ua||'', l.tz||'', l.lang||'',
                 l.screen||'', labelType(l.type)].join(' ').toLowerCase();
      if (hay.indexOf(search) === -1) return false;
    }
    if (dateFrom) { var ds  = new Date(l.ts).toISOString().slice(0,10); if (ds  < dateFrom) return false; }
    if (dateTo)   { var ds2 = new Date(l.ts).toISOString().slice(0,10); if (ds2 > dateTo)   return false; }
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
    if (_filterU !== 'all' && l.type !== _filterU) return false;
    if (search) {
      var hay = [l.deviceId||'', l.ip||'', l.city||'', l.district||'', l.region||'', l.country||'',
                 l.isp||'', l.browser||'', l.device||'', l.os||'', l.ua||'', l.tz||'', l.lang||'',
                 l.screen||'', labelType(l.type)].join(' ').toLowerCase();
      if (hay.indexOf(search) === -1) return false;
    }
    if (dateFrom) { var ds  = new Date(l.ts).toISOString().slice(0,10); if (ds  < dateFrom) return false; }
    if (dateTo)   { var ds2 = new Date(l.ts).toISOString().slice(0,10); if (ds2 > dateTo)   return false; }
    return true;
  }).sort(function(a, b) {
    var va = a[_sortFieldU]||'', vb = b[_sortFieldU]||'';
    if (_sortDirU === 'asc') return va > vb ? 1 : va < vb ? -1 : 0;
    return va < vb ? 1 : va > vb ? -1 : 0;
  });
}

function buildLocationStr(log) {
  var parts = [], district = (log.district||'').trim(), city = (log.city||'').trim(),
      region = (log.region||'').trim(), country = (log.country||'').trim();
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
  if (type === 'login_secondary') return '<span class="badge badge-login_normal" style="background:rgba(44,62,122,.05);color:var(--accent2);border-color:rgba(44,62,122,.2)"><span class="badge-icon">🗝</span>Sub</span>';
  if (type === 'login_normal')    return '<span class="badge badge-login_normal"><span class="badge-icon">🔒</span>Main</span>';
  if (type === 'login_founder')   return '<span class="badge badge-login_admin" style="background:rgba(142,68,173,.1);color:var(--founder);border-color:rgba(142,68,173,.3)"><span class="badge-icon">👑</span>Founder</span>';
  return '<span class="badge badge-login_admin"><span class="badge-icon">★</span>Admin</span>';
}

function labelType(t) {
  return t==='view' ? '👁 Page view' : t==='login_secondary' ? '🗝 Sub' : t==='login_normal' ? '🔒 Main' : t==='login_founder' ? '👑 Founder' : '★ Admin';
}

/* ── TOTAL LOGS EVENTS ── */
function setFilter(type) {
  _filter = type; _page = 1;
  ['all','view','login_secondary','login_normal','login_admin','login_founder'].forEach(function(t) {
    var id = 'f-' + (t==='login_normal'?'normal':t==='login_secondary'?'sec':t==='login_admin'?'admin':t==='login_founder'?'founder':t);
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
  ['all','view','login_secondary','login_normal','login_admin','login_founder'].forEach(function(t) {
    var id = 'fu-' + (t==='login_normal'?'normal':t==='login_secondary'?'sec':t==='login_admin'?'admin':t==='login_founder'?'founder':t);
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
  var d = new Date(log.ts), dstr = d.toLocaleDateString('en-US') + ' ' + d.toLocaleTimeString('en-US',{hour:'2-digit',minute:'2-digit',second:'2-digit'});
  var browser = log.browser || _detectBrowser(log.ua||''), device = log.device || _detectDevice(log.ua||''), os = log.os || _detectOS(log.ua||'');
  var locStr = buildLocationStr(log), locHtml = locStr ? '📍 ' + esc(locStr) + geoSrcBadge(log.geoSrc) : '<span style="color:var(--muted);font-style:italic">No location</span>';
  var postalStr = log.postal ? ' <span style="color:var(--muted);font-size:8px">[' + esc(log.postal) + ']</span>' : '';
  var ipStr = log.ip ? esc(log.ip) : '–', ispStr = log.isp ? esc(log.isp) : '';
  var coordStr = (log.latitude && log.longitude) ? '<a href="https://maps.google.com/?q='+log.latitude+','+log.longitude+'" target="_blank" style="color:var(--accent2);font-size:8px;text-decoration:none;" title="View map">🗺 '+String(log.latitude).slice(0,8)+','+String(log.longitude).slice(0,8)+'</a>' : '';
  var extra = [log.tz, log.screen].filter(Boolean).join(' · ');
  var devIdStr = log.deviceId ? '<span class="dev-badge">' + esc(log.deviceId) + '</span>' : '<span style="color:var(--muted);font-style:italic">Unknown</span>';
  var delBtn = '<button class="btn-del-ip allow-protected" style="margin:0 auto" title="Delete log" onclick="deleteSingleLog(\''+log._k+'\', \''+log.type+'\', this)"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/><path d="M10 11v6"/><path d="M14 11v6"/></svg></button>';
  return '<tr><td>' + badgeHtml(log.type) + '</td><td><span style="color:var(--ink)">' + esc(dstr) + '</span></td><td>' + devIdStr + '</td><td><div class="cell-main">' + esc(browser) + '</div><div class="cell-sub">' + esc(device) + (os?' · '+esc(os):'') + '</div></td><td><div class="cell-loc">' + locHtml + postalStr + '</div><div class="cell-ip">🌐 ' + ipStr + (coordStr?' &nbsp;'+coordStr:'') + '</div>' + (ispStr?'<div class="cell-isp">'+ispStr+(log.asn?' · '+esc(log.asn):'')+'</div>':'') + '</td><td><div class="cell-sub">' + esc(extra) + '</div></td><td style="vertical-align:middle;">' + delBtn + '</td></tr>';
}

function renderLogs() {
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
  if (_page > totalPages) _page = totalPages;
  var start = (_page-1)*_perPage, end = Math.min(start+_perPage, list.length), pageList = list.slice(start, end);

  tbody.innerHTML = pageList.map(generateRowHtml).join('');
  tableEl.style.display = 'table'; statusEl.style.display = 'none';
  renderPagination(totalPages, list.length, start, end, 'log-pagination', 'goPage', _page);
}

function renderUniqueLogs() {
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
  if (_pageU > totalPages) _pageU = totalPages;
  var start = (_pageU-1)*_perPage, end = Math.min(start+_perPage, list.length), pageList = list.slice(start, end);

  tbody.innerHTML = pageList.map(generateRowHtml).join('');
  tableEl.style.display = 'table'; statusEl.style.display = 'none';
  renderPagination(totalPages, list.length, start, end, 'log-pagination-u', 'goPageU', _pageU);
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
  if (_isProtected) { showToast('System is protected. Action denied!'); return; }
  _pendingSingleDelete = { key: key, type: type, row: btnEl.closest('tr') };
  document.getElementById('confirm-title').textContent = 'Move Log to Trash?';
  document.getElementById('confirm-msg').innerHTML = 'This log entry will be moved to the Trash and the counter will be deducted.<br><span style="font-size:11px;color:var(--muted)">Logs in trash are kept for 24 hours.</span>';
  document.getElementById('confirm-yes').onclick = function() { doDeleteSingleLog(); };
  document.getElementById('confirm-overlay').classList.add('open');
}

function doDeleteSingleLog() {
  if (_isProtected) { showToast('System is protected!'); return; }
  closeConfirm();
  if (!db || !_pendingSingleDelete) return;
  var key = _pendingSingleDelete.key, type = _pendingSingleDelete.type, row = _pendingSingleDelete.row;
  var logObj = _allLogs.find(function(l) { return l._k === key; });
  if (!logObj) return;
  if (row) { row.style.opacity = '0'; setTimeout(function() { row.remove(); }, 300); }
  var trashData = Object.assign({}, logObj); delete trashData._k; trashData.deletedAt = Date.now();
  var updates = {}; updates['trash/logs/' + key] = trashData; updates['logs/' + key] = null;
  
  db.ref().update(updates, function(err) {
    if (err) { showToast('⚠ Error wiping log!'); return; }
    showToast('✓ Log moved to trash!');
    _pendingSingleDelete = null;
  });
}

function deleteDeviceLogs(keysStr, btnEl) {
  if (_isProtected) { showToast('System is protected. Action denied!'); return; }
  try { _pendingDeleteKeys = JSON.parse(keysStr); } catch(e) { return; }
  _pendingDeleteRow = btnEl.closest('.ip-row');
  document.getElementById('confirm-title').textContent = 'Delete IP / Device?';
  document.getElementById('confirm-msg').innerHTML = 'This IP/Device and ALL related logs will be <strong>permanently deleted</strong>. ALL traces will be wiped.<br><strong style="color:var(--accent)">Note: Traffic counters will also be instantly deducted!</strong>';
  document.getElementById('confirm-yes').onclick = function() { doDeleteDeviceLogs(); };
  document.getElementById('confirm-overlay').classList.add('open');
}

function doDeleteDeviceLogs() {
  if (_isProtected) { showToast('System is protected!'); return; }
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
  if (_isProtected) { showToast('System is protected!'); return; }
  document.getElementById('trash-overlay').classList.add('open');
  var listEl = document.getElementById('trash-list');
  listEl.innerHTML = '<div style="text-align:center;padding:20px;"><span class="spin">⟳</span> Loading trash...</div>';
  db.ref('trash/logs').once('value', function(snap) {
    var now = Date.now(), items = [], toDelete = {};
    snap.forEach(function(c) {
      var val = c.val();
      if (now - val.deletedAt > 86400000) toDelete['trash/logs/' + c.key] = null;
      else items.push(Object.assign({ _k: c.key }, val));
    });
    if (Object.keys(toDelete).length > 0) db.ref().update(toDelete);
    items.sort(function(a,b) { return b.deletedAt - a.deletedAt; });
    if (items.length === 0) {
      listEl.innerHTML = '<div style="text-align:center;padding:20px;color:var(--muted)">Trash is empty.</div>';
    } else {
      listEl.innerHTML = items.map(function(item) {
        var d = new Date(item.ts), delD = new Date(item.deletedAt);
        return '<div style="display:flex;justify-content:space-between;align-items:center;border-bottom:1px solid var(--border);padding:8px 4px;">' +
          '<div><span style="color:var(--accent)">['+labelType(item.type)+']</span> '+d.toLocaleDateString()+' '+d.toLocaleTimeString([],{hour:'2-digit',minute:'2-digit'})+'<br>' +
          '<span style="color:var(--muted);font-size:8px;">IP: '+(item.ip||'Unknown')+' | Del: '+delD.toLocaleString()+'</span></div>' +
          '<button style="padding:4px 8px;border:1px solid var(--secure);background:transparent;color:var(--secure);cursor:pointer;font-family:\'Nunito\',sans-serif;font-weight:bold;font-size:10px;border-radius:3px;" onclick="restoreLog(\''+item._k+'\')">Restore</button>' +
          '</div>';
      }).join('');
    }
  });
}

function closeTrash() { document.getElementById('trash-overlay').classList.remove('open'); }

function restoreLog(key) {
  if (_isProtected) { showToast('System is protected!'); return; }
  db.ref('trash/logs/' + key).once('value', function(snap) {
    var data = snap.val(); if (!data) { showToast('Log not found!'); return; }
    var type = data.type; delete data.deletedAt;
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
  ['all','normal','sec','admin','founder'].forEach(function(m) {
    var el = document.getElementById('ipt-'+m); if (el) el.classList.toggle('active', m === mode);
  });
  renderIpStats();
}

function buildDeviceMap(typeFilter) {
  var map = {}, idToGroup = {}, fpToGroup = {}, groupCounter = 0;
  var logs = _allLogs.slice().sort(function(a,b) { return a.ts - b.ts; });
  logs.forEach(function(log) {
    if (log.type === 'view') return;
    if (typeFilter === 'sec'     && log.type !== 'login_secondary') return;
    if (typeFilter === 'normal'  && log.type !== 'login_normal')    return;
    if (typeFilter === 'admin'   && log.type !== 'login_admin')     return;
    if (typeFilter === 'founder' && log.type !== 'login_founder')   return;
    var devId = log.deviceId || '', fp = (log.ip||'')+'|'+(log.device||'')+'|'+(log.os||'')+'|'+(log.browser||'')+'|'+(log.screen||'');
    var groupId = null;
    if (devId && idToGroup[devId]) groupId = idToGroup[devId];
    else if (fpToGroup[fp]) groupId = fpToGroup[fp];
    else { groupCounter++; groupId = 'G' + groupCounter; }
    if (devId) idToGroup[devId] = groupId; fpToGroup[fp] = groupId;
    if (!map[groupId]) map[groupId] = { id: devId||log.ip||'Unknown Visitor', groupId: groupId, logKeys: [], devIds: [], ips: [], total:0, sec:0, normal:0, admin:0, founder:0, lastTs:0, ip:log.ip||'', city:log.city||'', district:log.district||'', region:log.region||'', country:log.country||'', isp:log.isp||'', browser:log.browser||_detectBrowser(log.ua||''), device:log.device||_detectDevice(log.ua||''), os:log.os||_detectOS(log.ua||'') };
    var entry = map[groupId];
    if (log._k) entry.logKeys.push(log._k);
    if (devId && entry.devIds.indexOf(devId) === -1) entry.devIds.push(devId);
    if (log.ip && entry.ips.indexOf(log.ip) === -1)  entry.ips.push(log.ip);
    entry.total++;
    if (log.type === 'login_secondary') entry.sec++;
    if (log.type === 'login_normal')  entry.normal++;
    if (log.type === 'login_admin')   entry.admin++;
    if (log.type === 'login_founder') entry.founder++;
    if (log.ts >= entry.lastTs) {
      entry.lastTs = log.ts;
      if (log.ip) entry.ip = log.ip; if (log.city) entry.city = log.city; if (log.district) entry.district = log.district;
      if (log.region) entry.region = log.region; if (log.country) entry.country = log.country; if (log.isp) entry.isp = log.isp;
      if (log.browser) entry.browser = log.browser; if (log.device) entry.device = log.device; if (log.os) entry.os = log.os;
    }
  });
  return map;
}

function renderIpStats() {
  var grid = document.getElementById('ip-stats-grid'); if (!grid) return;
  var cols = [
    { key:'all',     label:'All Users',  cls:'col-all',     numCls:'cnt-all',    barCls:'bar-all',    icon:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="7" r="4"/><path d="M5.5 21a8.38 8.38 0 0 1 13 0"/></svg>' },
    { key:'sec',     label:'🗝 Sub',     cls:'col-normal',  numCls:'cnt-normal', barCls:'bar-normal', icon:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="11" width="18" height="11" rx="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg>' },
    { key:'normal',  label:'🔒 Main',    cls:'col-normal',  numCls:'cnt-normal', barCls:'bar-normal', icon:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="11" width="18" height="11" rx="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg>' },
    { key:'admin',   label:'★ Admin',    cls:'col-admin',   numCls:'cnt-admin',  barCls:'bar-admin',  icon:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 2l3 7h7l-6 4 2 7-6-4-6 4 2-7-6-4h7z"/></svg>' },
    { key:'founder', label:'👑 Founder', cls:'col-founder', numCls:'cnt-admin',  barCls:'bar-founder',icon:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polygon points="12 4 8 11 2 4 5 16 19 16 22 4 16 11 12 4"></polygon><line x1="5" y1="20" x2="19" y2="20"></line></svg>' }
  ];
  var showKeys = _ipMode === 'all' ? ['all','sec','normal','admin','founder'] : [_ipMode];
  var filteredCols = cols.filter(function(c) { return showKeys.indexOf(c.key) !== -1; });
  var html = '';

  filteredCols.forEach(function(col) {
    var map = buildDeviceMap(col.key);
    var cnt = function(e) { return col.key==='sec'?e.sec:col.key==='normal'?e.normal:col.key==='admin'?e.admin:col.key==='founder'?e.founder:e.total; };
    var sorted = Object.values(map).sort(function(a,b) { return cnt(b) - cnt(a); });
    var top = sorted.slice(0, 8), maxCount = top.length ? cnt(top[0]) : 1;
    html += '<div class="ip-col-wrap"><div class="ip-col-head '+col.cls+'">'+col.icon+' '+esc(col.label)+'</div>';
    if (top.length === 0) { html += '<div class="ip-empty">No data</div>'; }
    else top.forEach(function(entry, idx) {
      var rank = idx+1, rankCls = rank<=3?' rank-'+rank:'', count = cnt(entry), barPct = maxCount>0?Math.round(count/maxCount*100):0;
      var locStr = buildLocationStr(entry), accessInfo = [entry.browser, entry.device, entry.os].filter(Boolean).join(' · ');
      var lastStr = entry.lastTs ? new Date(entry.lastTs).toLocaleDateString('en-US')+' '+new Date(entry.lastTs).toLocaleTimeString('en-US',{hour:'2-digit',minute:'2-digit'}) : '';
      html += '<div class="ip-row"><div class="ip-rank'+rankCls+'">#'+rank+'</div><div class="ip-info">';
      var ipDisplay = entry.ips.length>0 ? entry.ips[0]+(entry.ips.length>1?' (+'+(entry.ips.length-1)+')':'') : 'Unknown IP';
      html += '<div class="ip-addr">🌐 '+esc(ipDisplay)+'</div>';
      if (entry.devIds && entry.devIds.length>0) html += '<div style="margin-top:4px;margin-bottom:2px;">'+entry.devIds.map(function(id){ return '<span class="dev-badge" style="margin-right:4px;font-size:8px;">'+esc(id)+'</span>'; }).join('')+'</div>';
      if (locStr) html += '<div class="ip-location">📍 '+esc(locStr)+'</div>';
      if (accessInfo) html += '<div class="ip-isp">'+esc(accessInfo)+'</div>';
      if (entry.isp) html += '<div class="ip-isp" style="color:var(--muted)">'+esc(entry.isp)+'</div>';
      if (lastStr) html += '<div class="ip-last">🕐 '+esc(lastStr)+'</div>';
      html += '<div class="ip-bar-wrap"><div class="ip-bar '+col.barCls+'" style="width:'+barPct+'%"></div></div></div>';
      html += '<div class="ip-count-badge"><div class="ip-count-num '+col.numCls+'">'+count+'</div><div class="ip-count-label">times</div></div>';
      var keysStr = JSON.stringify(entry.logKeys).replace(/"/g,'&quot;');
      html += '<div style="display:flex;flex-direction:column;">';
      html += '<button class="btn-del-ip" title="Delete completely" data-keys="'+keysStr+'" onclick="deleteDeviceLogs(this.dataset.keys,this)"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/><path d="M10 11v6"/><path d="M14 11v6"/></svg></button>';
      if (entry.ips.length>0) html += '<button class="btn-block-ip" title="Block this IP" onclick="blockIP(\''+esc(entry.ips[0])+'\')"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"></circle><line x1="4.93" y1="4.93" x2="19.07" y2="19.07"></line></svg></button>';
      html += '</div></div>';
    });
    html += '</div>';
  });

  grid.style.gridTemplateColumns = filteredCols.length===5?'repeat(5,1fr)':(filteredCols.length===1?'1fr':'repeat(auto-fit,minmax(200px,1fr))');
  grid.innerHTML = html;
}

/* ── CSV EXPORT ── */
function exportCSV() {
  var list = getFilteredLogs();
  var rows = [['Type','Timestamp','Device ID','IP Address','District','City','Region','Country','Postal Code','Coordinates','ISP','ASN','Browser','Device','OS','Timezone','Language','Screen','Geo Source']];
  var srcMap = {1:'ipinfo.io', 2:'freeipapi.com', 3:'ipwho.is', 4:'cloudflare-trace', 5:'geojs.io', 6:'ipapi.co'};
  list.forEach(function(l) {
    var d = new Date(l.ts), dstr = d.toLocaleDateString('en-US') + ' ' + d.toLocaleTimeString('en-US');
    var coord = (l.latitude && l.longitude) ? l.latitude+','+l.longitude : '';
    rows.push([labelType(l.type), dstr, l.deviceId||'', l.ip||'', l.district||'', l.city||'', l.region||'', l.country||'', l.postal||'', coord, l.isp||'', l.asn||'', l.browser||_detectBrowser(l.ua||''), l.device||_detectDevice(l.ua||''), l.os||_detectOS(l.ua||''), l.tz||'', l.lang||'', l.screen||'', srcMap[l.geoSrc]||'']);
  });
  var csv = rows.map(function(r) { return r.map(function(c) { return '"'+String(c).replace(/"/g,'""')+'"'; }).join(','); }).join('\n');
  var blob = new Blob(['\ufeff'+csv], {type:'text/csv;charset=utf-8'});
  var url = URL.createObjectURL(blob), a = document.createElement('a');
  a.href = url; a.download = 'logs_'+Date.now()+'.csv';
  document.body.appendChild(a); a.click(); document.body.removeChild(a);
  URL.revokeObjectURL(url); showToast('✓ CSV Exported!');
}