/* ══════════════════════════════════════════
   UI — render helpers, dialogs, toast, secret, identity
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
  var lv = ROLE_LEVEL[_currentLoginRole] || 1;
  if (lv >= 3) {
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

/* ── IDENTITY MANAGEMENT ── */
var _editingProfileId = null;
var _tempIds = [];

function openIdentityManager() {
  var lv = ROLE_LEVEL[_currentLoginRole] || 1;
  if (_isProtected && lv < 6) { showToast('System is protected!'); return; }
  closeAllMenus();
  document.getElementById('identity-manager-overlay').classList.add('open');
  resetIdentityForm();
  populateUnassignedIds();
  renderIdentityList();
}
function closeIdentityManager() {
  document.getElementById('identity-manager-overlay').classList.remove('open');
}

function populateUnassignedIds() {
  var allIds = new Set();
  _allLogs.forEach(function(l) { if (l.deviceId) allIds.add(l.deviceId); });
  
  var assignedIds = new Set();
  Object.values(_identities).forEach(function(profile) { 
    var idsArray = (profile && profile.ids) ? profile.ids : (Array.isArray(profile) ? profile : []);
    idsArray.forEach(function(id) { assignedIds.add(id); });
  });

  var available = Array.from(allIds).filter(function(id) { return !assignedIds.has(id); });
  var sel = document.getElementById('id-dev-select');
  if (!sel) return;
  
  sel.innerHTML = '<option value="">-- Quick pick unassigned ID</option>' +
                  available.map(function(id) { return '<option value="'+esc(id)+'">'+esc(id)+'</option>'; }).join('');
}

function resetIdentityForm() {
  _editingProfileId = null;
  _tempIds = [];
  document.getElementById('id-profile-name').value = '';
  // Chỉ Founder mới được tùy ý sửa tên Alias
  document.getElementById('id-profile-name').disabled = (_currentLoginRole !== 'founder');
  document.getElementById('id-dev-input').value = '';
  var sel = document.getElementById('id-dev-select');
  if (sel) sel.value = '';
  renderTempIds();
  
  document.getElementById('btn-id-save').textContent = 'Save Profile';
  document.getElementById('btn-id-cancel').style.display = 'none';
}

function renderTempIds() {
  var wrap = document.getElementById('id-tags-wrap');
  if (_tempIds.length === 0) {
    wrap.innerHTML = '<span style="color:var(--muted);font-size:12px;font-style:italic;">No IDs added yet...</span>';
    return;
  }
  wrap.innerHTML = _tempIds.map(function(id, i) {
    return '<span class="dev-badge" style="display:inline-flex;align-items:center;background:rgba(44,62,122,0.1);color:var(--accent2);border:1px solid rgba(44,62,122,0.2);padding:4px 8px;border-radius:4px;font-size:12px;font-weight:bold;margin-right:6px;margin-bottom:6px;">' + 
           esc(String(id)) + 
           ' <span style="cursor:pointer;margin-left:6px;color:#e74c3c;font-size:14px;line-height:1;" onclick="removeTempId('+i+')" title="Remove">×</span></span>';
  }).join('');
}

function handleSelectDevId(e) {
  var val = e.target.value;
  if (val && _tempIds.indexOf(val) === -1) {
    _tempIds.push(val);
    e.target.value = ''; 
    renderTempIds();
  }
}

function handleDevInputKey(e) {
  if (e.key === 'Enter') {
    e.preventDefault();
    var val = e.target.value.trim();
    if (val && _tempIds.indexOf(val) === -1) {
      _tempIds.push(val);
      e.target.value = '';
      renderTempIds();
    }
  }
}

function removeTempId(idx) {
  _tempIds.splice(idx, 1);
  renderTempIds();
}

function saveIdentity() {
  var lv = ROLE_LEVEL[_currentLoginRole] || 1;
  if (_isProtected && lv < 6) { showToast('System is protected!'); return; }
  
  var nameInput = document.getElementById('id-profile-name').value.trim();
  // Nếu không phải Founder (bị disable ô Name), nameInput sẽ dùng giá trị placeholder (ID gốc)
  var idToSave = _editingProfileId || ('id_' + Date.now() + '_' + Math.random().toString(36).substr(2, 5));
  var finalName = nameInput || idToSave; 
  
  if (_tempIds.length === 0) { showToast('At least one Device ID required!'); return; }

  var dataToSave = { name: finalName, ids: _tempIds };

  if (db) {
    var updates = {};
    updates['settings/identities/' + idToSave] = dataToSave;
    db.ref().update(updates, function(err) {
      if (!err) {
        showToast('✓ Profile saved!');
        _identities[idToSave] = { name: finalName, ids: _tempIds.slice() }; 
        resetIdentityForm();
        populateUnassignedIds();
        renderIdentityList();
        if (typeof renderLogs === 'function') { renderLogs(); renderUniqueLogs(); renderIpStats(); }
      } else {
        showToast('⚠ Error saving profile');
      }
    });
  }
}

function editIdentity(key) {
  var profile = _identities[key];
  if (!profile) return;
  _editingProfileId = key;
  
  var pName = profile.name || key;
  // Các role khác Founder không được sửa Alias (Tên)
  if (_currentLoginRole === 'founder') {
    document.getElementById('id-profile-name').value = pName;
    document.getElementById('id-profile-name').disabled = false;
  } else {
    document.getElementById('id-profile-name').value = key; // Chỉ hiện ID Gốc
    document.getElementById('id-profile-name').disabled = true;
  }
  
  _tempIds = Array.isArray(profile.ids) ? profile.ids.slice() : (Array.isArray(profile) ? profile.slice() : []);
  renderTempIds();
  
  document.getElementById('btn-id-save').textContent = 'Update Profile';
  document.getElementById('btn-id-cancel').style.display = 'inline-block';
}

function removeIdentity(key, displayName) {
  var lv = ROLE_LEVEL[_currentLoginRole] || 1;
  if (_isProtected && lv < 6) { showToast('System is protected!'); return; }
  var confirmMsg = (_currentLoginRole === 'founder') ? 'Delete profile "'+displayName+'"?' : 'Delete identity grouping "'+key+'"?';
  if (confirm(confirmMsg + ' Log records will revert to original IDs.')) {
    if (db) {
      db.ref('settings/identities/' + key).remove(function(err) {
        if (!err) {
          showToast('✓ Profile deleted');
          delete _identities[key]; 
          populateUnassignedIds();
          renderIdentityList();
          if (typeof renderLogs === 'function') { renderLogs(); renderUniqueLogs(); renderIpStats(); }
          if (_editingProfileId === key) resetIdentityForm();
        }
      });
    }
  }
}

function renderIdentityList() {
  var listEl = document.getElementById('id-active-profiles');
  if (!listEl) return;
  var keys = Object.keys(_identities);
  if (keys.length === 0) {
    listEl.innerHTML = '<div style="padding:20px;text-align:center;color:var(--muted);font-size:13px;background:var(--bg);border-radius:6px;border:1px dashed var(--border);">No active profiles yet.</div>';
    return;
  }
  listEl.innerHTML = keys.map(function(k) {
    var profile = _identities[k];
    // Rule: Chỉ hiển thị tên Alias đối với Founder, còn lại show ID/Key.
    var displayName = (_currentLoginRole === 'founder' && profile.name) ? profile.name : k;
    
    var ids = Array.isArray(profile.ids) ? profile.ids : (Array.isArray(profile) ? profile : []);
    var tags = ids.map(function(id) { 
      return '<span style="display:inline-block;background:rgba(44,62,122,0.08);color:var(--accent2);padding:3px 6px;border-radius:4px;margin:3px 6px 3px 0;font-size:11px;border:1px solid rgba(44,62,122,0.15);">'+esc(String(id))+'</span>'; 
    }).join('');
    
    return '<div style="padding:14px;background:var(--bg);border:1px solid var(--border);border-radius:8px;box-shadow:0 2px 4px rgba(0,0,0,0.02);">' +
           '<div style="display:flex;justify-content:space-between;align-items:flex-start;margin-bottom:8px;">' +
           '<div style="font-weight:800;color:var(--ink);font-size:14px;display:flex;align-items:center;gap:8px;"><svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg> ' + esc(String(displayName)) + '</div>' +
           '<div style="display:flex;gap:6px;"><button class="btn-ghost" style="padding:4px 12px;font-size:11px;border-radius:4px;background:rgba(44,62,122,0.05);color:var(--accent2);font-weight:bold;cursor:pointer;" onclick="editIdentity(\''+esc(String(k))+'\')">Edit</button>' +
           '<button class="btn-ghost" style="padding:4px 12px;font-size:11px;border-radius:4px;color:#e74c3c;background:rgba(231,76,60,0.05);font-weight:bold;cursor:pointer;" onclick="removeIdentity(\''+esc(String(k))+'\', \''+esc(String(displayName).replace(/'/g, "\\'"))+'\')">Delete</button></div>' +
           '</div>' +
           '<div style="font-family:\'Space Mono\',monospace;margin-top:6px;">' + tags + '</div>' +
           '</div>';
  }).join('');
}

/* ── QUICK LINK IDENTITY ── */
var _pendingLinkId = null;
function openLinkIdentity(devId) {
  var lv = ROLE_LEVEL[_currentLoginRole] || 1;
  if (_isProtected && lv < 6) { showToast('System is protected!'); return; }
  _pendingLinkId = devId;
  document.getElementById('link-id-display').textContent = devId;
  var select = document.getElementById('link-profile-select');
  var keys = Object.keys(_identities);
  if (keys.length === 0) {
    select.innerHTML = '<option value="">-- No profiles exist</option>';
    select.disabled = true;
  } else {
    select.innerHTML = '<option value="">-- Select Profile</option>' + keys.map(function(k) {
      // Logic tương tự: Chỉ Founder mới thấy Alias trong Menu này
      var displayName = (_currentLoginRole === 'founder' && _identities[k].name) ? _identities[k].name : k;
      return '<option value="'+esc(String(k))+'">'+esc(String(displayName))+'</option>';
    }).join('');
    select.disabled = false;
  }
  document.getElementById('identity-link-overlay').classList.add('open');
}

function closeLinkIdentity() {
  document.getElementById('identity-link-overlay').classList.remove('open');
}

function submitLinkIdentity() {
  var sel = document.getElementById('link-profile-select');
  var profileKey = sel.value;
  if (!profileKey || !_pendingLinkId) return;
  
  var profile = _identities[profileKey];
  var ids = Array.isArray(profile.ids) ? profile.ids.slice() : (Array.isArray(profile) ? profile.slice() : []);
  
  if (ids.indexOf(_pendingLinkId) === -1) {
    ids.push(_pendingLinkId);
    var dataToSave = profile.name ? { name: profile.name, ids: ids } : ids;
    
    if (db) {
      db.ref('settings/identities/' + profileKey).set(dataToSave, function(err) {
        if (!err) {
          showToast('✓ ID linked to profile!');
          _identities[profileKey] = dataToSave; 
          closeLinkIdentity();
          if (document.getElementById('identity-manager-overlay').classList.contains('open')) {
            populateUnassignedIds();
            renderIdentityList();
          }
          if (typeof renderLogs === 'function') { renderLogs(); renderUniqueLogs(); renderIpStats(); }
        }
      });
    }
  } else {
    showToast('ID already in this profile');
    closeLinkIdentity();
  }
}

/* ── CONFIG DIALOGS ── */
function openChangeWelcome() {
  var lv = ROLE_LEVEL[_currentLoginRole] || 1;
  if (_isProtected && lv < 6) { showToast('System is protected!'); return; }
  document.getElementById('welcome-input').value = currentWelcome;
  document.getElementById('welcome-change-overlay').classList.add('open');
  closeAllMenus();
}
function closeChangeWelcome() { document.getElementById('welcome-change-overlay').classList.remove('open'); }
function submitChangeWelcome() {
  var lv = ROLE_LEVEL[_currentLoginRole] || 1;
  if (_isProtected && lv < 6) { showToast('System is protected!'); return; }
  var nW = document.getElementById('welcome-input').value.trim() || defaultWelcome;
  currentWelcome = nW; renderWelcome();
  if (db) db.ref('settings/welcome').set(nW, function(err) {
    if (err) showToast('⚠ Error!'); else { closeChangeWelcome(); showToast('✓ Updated successfully'); }
  }); else closeChangeWelcome();
}

function openChangeTitle() {
  var lv = ROLE_LEVEL[_currentLoginRole] || 1;
  if (_isProtected && lv < 6) { showToast('System is protected!'); return; }
  document.getElementById('tab-title-input').value  = currentTabTitle;
  document.getElementById('main-title-input').value = currentMainTitle;
  document.getElementById('title-change-overlay').classList.add('open');
  closeAllMenus();
}
function closeChangeTitle() { document.getElementById('title-change-overlay').classList.remove('open'); }
function submitChangeTitle() {
  var lv = ROLE_LEVEL[_currentLoginRole] || 1;
  if (_isProtected && lv < 6) { showToast('System is protected!'); return; }
  var tTab  = document.getElementById('tab-title-input').value.trim()  || defaultTabTitle;
  var tMain = document.getElementById('main-title-input').value.trim() || defaultMainTitle;
  currentTabTitle = tTab; currentMainTitle = tMain; renderTitle();
  if (db) db.ref('settings/titles').set({ tab: tTab, main: tMain }, function(err) {
    if (err) showToast('⚠ Error!'); else { closeChangeTitle(); showToast('✓ Updated successfully'); }
  }); else closeChangeTitle();
}

function openChangePopup() {
  var lv = ROLE_LEVEL[_currentLoginRole] || 1;
  if (_isProtected && lv < 6) { showToast('System is protected!'); return; }
  document.getElementById('popup-wrong-input').value = currentPopups.wrong;
  document.getElementById('popup-close-input').value = currentPopups.close;
  document.getElementById('popup-change-overlay').classList.add('open');
  closeAllMenus();
}
function closeChangePopup() { document.getElementById('popup-change-overlay').classList.remove('open'); }
function submitChangePopup() {
  var lv = ROLE_LEVEL[_currentLoginRole] || 1;
  if (_isProtected && lv < 6) { showToast('System is protected!'); return; }
  var pWrong = document.getElementById('popup-wrong-input').value.trim() || defaultPopups.wrong;
  var pClose = document.getElementById('popup-close-input').value.trim() || defaultPopups.close;
  currentPopups.wrong = pWrong; currentPopups.close = pClose;
  if (db) db.ref().update({ 'settings/popups/wrong': pWrong, 'settings/popups/close': pClose }, function(err) {
    if (err) showToast('⚠ Error!'); else { closeChangePopup(); showToast('✓ Updated successfully'); }
  }); else closeChangePopup();
}

function openChangeNotes() {
  var lv = ROLE_LEVEL[_currentLoginRole] || 1;
  if (_isProtected && lv < 6) { showToast('System is protected!'); return; }
  document.getElementById('note-tagline-input').value = currentNotes.tagline;
  document.getElementById('note-footer-input').value  = currentNotes.footer;
  document.getElementById('notes-change-overlay').classList.add('open');
  closeAllMenus();
}
function closeChangeNotes() { document.getElementById('notes-change-overlay').classList.remove('open'); }
function submitChangeNotes() {
  var lv = ROLE_LEVEL[_currentLoginRole] || 1;
  if (_isProtected && lv < 6) { showToast('System is protected!'); return; }
  var tL = document.getElementById('note-tagline-input').value.trim() || defaultNotes.tagline;
  var fT = document.getElementById('note-footer-input').value.trim()  || defaultNotes.footer;
  currentNotes.tagline = tL; currentNotes.footer = fT; renderNotes();
  if (db) db.ref().update({ 'settings/notes_v2/tagline': tL, 'settings/notes_v2/footer': fT }, function(err) {
    if (err) showToast('⚠ Error!'); else { closeChangeNotes(); showToast('✓ Updated successfully'); }
  }); else closeChangeNotes();
}

function openChangeHints() {
  var lv = ROLE_LEVEL[_currentLoginRole] || 1;
  if (_isProtected && lv < 6) { showToast('System is protected!'); return; }
  document.getElementById('hint1-input').value = currentHints.hint1;
  document.getElementById('hint2-input').value = currentHints.hint2;
  document.getElementById('hint-change-overlay').classList.add('open');
  closeAllMenus();
}
function closeChangeHints() { document.getElementById('hint-change-overlay').classList.remove('open'); }
function submitChangeHints() {
  var lv = ROLE_LEVEL[_currentLoginRole] || 1;
  if (_isProtected && lv < 6) { showToast('System is protected!'); return; }
  var h1 = document.getElementById('hint1-input').value.trim() || defaultHints.hint1;
  var h2 = document.getElementById('hint2-input').value.trim() || defaultHints.hint2;
  currentHints.hint1 = h1; currentHints.hint2 = h2; renderHints();
  if (db) db.ref().update({ 'settings/hints_v3/hint1': h1, 'settings/hints_v3/hint2': h2 }, function(err) {
    if (err) showToast('⚠ Error!'); else { closeChangeHints(); showToast('✓ Updated successfully'); }
  }); else closeChangeHints();
}

function openChangeSecret() {
  var lv = ROLE_LEVEL[_currentLoginRole] || 1;
  if (_isProtected && lv < 6) { showToast('System is protected!'); return; }
  document.getElementById('secret-normal-input').value    = currentSecretMsgs.normal;
  document.getElementById('secret-secondary-input').value = currentSecretMsgs.secondary;
  document.getElementById('secret-admin-input').value     = currentSecretMsgs.admin;
  document.getElementById('secret-change-overlay').classList.add('open');
  closeAllMenus();
}
function closeChangeSecret() { document.getElementById('secret-change-overlay').classList.remove('open'); }
function submitChangeSecret() {
  var lv = ROLE_LEVEL[_currentLoginRole] || 1;
  if (_isProtected && lv < 6) { showToast('System is protected!'); return; }
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
  var lv = ROLE_LEVEL[_currentLoginRole] || 1;
  if (_isProtected && lv < 6) { showToast('System is protected. Action denied!'); return; }
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
  var lv = ROLE_LEVEL[_currentLoginRole] || 1;
  if (_isProtected && lv < 6) { showToast('System is protected. Action denied!'); return; }
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
      var dObj = new Date(ts);
      var ds = isNaN(dObj.getTime()) ? 'N/A' : (dObj.toLocaleDateString('en-US') + ' ' + dObj.toLocaleTimeString('en-US'));
      return '<div style="display:flex;justify-content:space-between;border-bottom:1px solid var(--border);padding:8px 0;align-items:center;">' +
        '<div><strong style="color:var(--accent);font-size:12px;">' + esc(String(ip)) + '</strong><br>' +
        '<span style="color:var(--muted)">Blocked at: ' + ds + '</span></div>' +
        '<button class="allow-protected" style="padding:4px 8px;border:1px solid #27ae60;background:transparent;color:#27ae60;border-radius:3px;cursor:pointer;" onclick="unblockIP(\'' + esc(String(k)) + '\')">Unblock</button>' +
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