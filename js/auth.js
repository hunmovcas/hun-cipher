/* ══════════════════════════════════════════
   AUTH — checkPw, elevate, setup, change password, shield
   ══════════════════════════════════════════ */

/* ── HELPERS ── */
function getIdentityRankByDevId(devId) {
  if (!devId) return null;
  devId = String(devId).trim();
  
  for (var key in _identities) {
    var profile = _identities[key];
    if (!profile) continue;
    
    // Ép kiểu chống suy biến Array của Firebase
    var idsArray = [];
    if (Array.isArray(profile.ids)) {
      idsArray = profile.ids;
    } else if (typeof profile.ids === 'object') {
      idsArray = Object.values(profile.ids);
    } else if (Array.isArray(profile)) {
      idsArray = profile;
    }
    
    for (var i = 0; i < idsArray.length; i++) {
      if (String(idsArray[i]).trim() === devId) {
        return profile.rank || null;
      }
    }
  }
  return null;
}

/* ── TOGGLE PASSWORD EYE ── */
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

/* ── FUZZY MATCH (1 char off) ── */
async function isOneCharOff(val) {
  if (!val) return false;
  var charset = "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!@#$%^&*()_+-=[]{}|;':\",./<>?`~ "
    + "áàảãạâấầẩẫậăắằẳẵặéèẻẽẹêếềểễệíìỉĩịóòỏõọôốồổỗộơớờởỡợúùủũụưứừửữựýỳỷỹỵđ"
    + "ÁÀẢÃẠÂẤẦẨẪẬĂẮẰẲẴẶÉÈẺẼẸÊẾỀỂỄỆÍÌỈĨỊÓÒỎÕỌÔỐỒỔỖỘƠỚỜỞỠỢÚÙỦŨỤƯỨỪỬỮỰÝỲỶỸỴĐ";
  var variations = new Set();
  for (var i = 0; i < val.length; i++) variations.add(val.slice(0, i) + val.slice(i + 1));
  for (var i = 0; i < val.length; i++) for (var j = 0; j < charset.length; j++) { if (charset[j] !== val[i]) variations.add(val.slice(0, i) + charset[j] + val.slice(i + 1)); }
  for (var i = 0; i <= val.length; i++) for (var j = 0; j < charset.length; j++) variations.add(val.slice(0, i) + charset[j] + val.slice(i));
  var arr = Array.from(variations), encoder = new TextEncoder();
  for (var i = 0; i < arr.length; i += 1000) {
    var batch  = arr.slice(i, i + 1000);
    var hashes = await Promise.all(batch.map(async function(v) {
      var buf = await crypto.subtle.digest('SHA-256', encoder.encode(v));
      var hex = ''; Array.from(new Uint8Array(buf)).forEach(function(b) { hex += b.toString(16).padStart(2, '0'); });
      return hex;
    }));
    if (hashes.indexOf(currentHashes.normal)    !== -1 ||
        hashes.indexOf(currentHashes.admin)     !== -1 ||
        hashes.indexOf(currentHashes.secondary) !== -1 ||
        hashes.indexOf(currentHashes.founder)   !== -1) return true;
  }
  return false;
}

/* ── MAIN LOGIN ── */
async function checkPw() {
  var val = document.getElementById('pw-input').value.toLowerCase();
  if (!val) return;
  var btn = document.querySelector('.btn-pw'), oldText = btn.innerHTML;
  btn.innerHTML = '<span class="spin" style="margin-right:6px">⟳</span> Processing...';
  btn.disabled = true;

  var buf  = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(val));
  var hash = Array.from(new Uint8Array(buf)).map(function(b) { return b.toString(16).padStart(2, '0'); }).join('');

  var pwRole = null;
  if      (hash === currentHashes.founder)   { pwRole = 'founder'; }
  else if (hash === currentHashes.admin)     { pwRole = 'admin'; }
  else if (hash === currentHashes.normal)    { pwRole = 'normal'; }
  else if (hash === currentHashes.secondary) { pwRole = 'secondary'; }

  if (pwRole) {
    _loggedIn = true;
    _originalRole = pwRole;
    
    if (pwRole === 'founder') sessionStorage.setItem('hun_known_founder', 'true');

    // Chặn luồng, ép tải dữ liệu Identities sạch từ Firebase
    if (db) {
      var idSnap = await db.ref('settings/identities').once('value');
      _identities = idSnap.val() || {};
    }

    var devId = localStorage.getItem('hun_device_id');
    var assignedRank = getIdentityRankByDevId(devId);
    
    // LOGIC DUAL TAGGING CHUẨN: So sánh Cấp bậc (ROLE_LEVEL)
    var newRole = pwRole;
    var finalAuthVia = null;

    if (assignedRank && assignedRank !== pwRole) {
      var rankLv = ROLE_LEVEL[assignedRank] || 0;
      var pwLv = ROLE_LEVEL[pwRole] || 0;
      
      if (rankLv > pwLv) {
        // Định danh có chức vụ CAO HƠN pass đang nhập (VD: Rank Co-Founder dùng Pass Sub)
        newRole = assignedRank;
        finalAuthVia = pwRole;
      } else {
        // Định danh có chức vụ THẤP HƠN pass đang nhập -> Ưu tiên theo Pass
        newRole = pwRole;
        finalAuthVia = null;
      }
    }

    _currentLoginRole = newRole;
    _authVia = finalAuthVia;

    _isAdmin = (ROLE_LEVEL[_currentLoginRole] >= 3);

    btn.innerHTML = oldText; btn.disabled = false;
    var pw = document.getElementById('pw-screen');
    pw.style.transition = 'opacity .4s'; pw.style.opacity = '0';
    setTimeout(function() { pw.style.display = 'none'; }, 400);

    if (_isAdmin) localStorage.setItem('hun_is_admin', 'true');
    _hist = ['lock', 'main-d']; _hidx = 1;

    document.getElementById('main-wrap').style.display = 'block';
    document.getElementById('nav-btns').style.display  = 'flex';
    updateNavBtns();

    fbIncrement('login_' + _currentLoginRole, _authVia);
    fbListenAll();

    if (_isAdmin) applyAdminModeUI(); else applyUserModeUI();
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
      pwErr.style.display   = 'block';
    }
    inp.value = ''; inp.focus(); btn.innerHTML = oldText; btn.disabled = false;
    setTimeout(function() { popup.className = 'pw-popup-container'; popup.textContent = ''; inp.style.borderColor = ''; pwErr.style.display = 'none'; }, 3500);
  }
}

/* ── INITIAL SETUP (empty DB) ── */
async function submitSetup() {
  var f = document.getElementById('setup-founder').value.toLowerCase().trim();
  var a = document.getElementById('setup-admin').value.toLowerCase().trim();
  var n = document.getElementById('setup-normal').value.toLowerCase().trim();
  var s = document.getElementById('setup-secondary').value.toLowerCase().trim();
  if (!f || !a || !n || !s) { showToast('Please enter all 4 passwords!'); return; }
  var enc  = new TextEncoder();
  var hash = async function(v) { return Array.from(new Uint8Array(await crypto.subtle.digest('SHA-256', enc.encode(v)))).map(function(b) { return b.toString(16).padStart(2,'0'); }).join(''); };
  var newHashes = { founder: await hash(f), admin: await hash(a), normal: await hash(n), secondary: await hash(s) };
  db.ref('settings/passwords_v3').set(newHashes, function(err) {
    if (!err) {
      document.getElementById('setup-screen').style.display = 'none';
      document.getElementById('pw-screen').style.display    = 'flex';
      showToast('✓ Initialization complete!');
    } else { showToast('⚠ Database save error!'); }
  });
}

/* ── ELEVATE PRIVILEGE ── */
function openElevateModal() {
  document.getElementById('elevate-pw').value          = '';
  document.getElementById('elevate-err').style.display = 'none';
  var title = document.getElementById('elevate-title');
  var desc  = document.getElementById('elevate-desc');
  var inp   = document.getElementById('elevate-pw');
  if (_currentLoginRole === 'admin') {
    title.innerHTML    = 'Elevate Privilege <span style="color:var(--founder)">👑</span>';
    desc.textContent   = 'Authenticate as Founder.';
    inp.placeholder    = 'Founder Password...';
  } else if (_currentLoginRole === 'secondary') {
    title.innerHTML    = 'Elevate Privilege <span style="color:var(--accent2)">🚀</span>';
    desc.textContent   = 'Authenticate as Main User, Admin, or Founder.';
    inp.placeholder    = 'Enter higher tier password...';
  } else {
    title.textContent  = 'Elevate Privilege';
    desc.textContent   = 'Authenticate as Admin or Founder.';
    inp.placeholder    = 'Admin or Founder Password...';
  }
  document.getElementById('elevate-overlay').classList.add('open');
  setTimeout(function() { document.getElementById('elevate-pw').focus(); }, 50);
}
function closeElevateModal() { document.getElementById('elevate-overlay').classList.remove('open'); }

async function submitElevate() {
  var val  = document.getElementById('elevate-pw').value.toLowerCase();
  var buf  = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(val));
  var hash = Array.from(new Uint8Array(buf)).map(function(b) { return b.toString(16).padStart(2,'0'); }).join('');

  var pwRole = null;
  if (hash === currentHashes.founder) pwRole = 'founder';
  else if (hash === currentHashes.admin)  pwRole = 'admin';
  else if (hash === currentHashes.normal) pwRole = 'normal';

  if (!pwRole) {
    var err = document.getElementById('elevate-err');
    err.style.display = 'block';
    setTimeout(function() { err.style.display = 'none'; }, 2000);
    return;
  }

  if (db) {
    var idSnap = await db.ref('settings/identities').once('value');
    _identities = idSnap.val() || {};
  }

  var devId = localStorage.getItem('hun_device_id');
  var assignedRank = getIdentityRankByDevId(devId);
  
  // Áp dụng chung logic Đẳng cấp như hàm checkPw
  var newRole = pwRole;
  var newAuthVia = null;

  if (assignedRank && assignedRank !== pwRole) {
    var rankLv = ROLE_LEVEL[assignedRank] || 0;
    var pwLv = ROLE_LEVEL[pwRole] || 0;
    
    if (rankLv > pwLv) {
      newRole = assignedRank;
      newAuthVia = pwRole;
    } else {
      newRole = pwRole;
      newAuthVia = null;
    }
  }

  if ((ROLE_LEVEL[newRole] || 0) <= (ROLE_LEVEL[_currentLoginRole] || 0)) {
    showToast('Already at this or higher privilege level!');
    closeElevateModal();
    return;
  }

  closeElevateModal();
  _currentLoginRole = newRole;
  _authVia = newAuthVia;

  if (ROLE_LEVEL[newRole] >= 3) {
    _isAdmin = true;
    localStorage.setItem('hun_is_admin', 'true');
    _hist = ['lock', 'main-' + _mode]; _hidx = 1;

    if (newRole === 'founder' || pwRole === 'founder') {
      _originalRole = 'founder';
      sessionStorage.setItem('hun_known_founder', 'true');
      
      var updates = {};
      if (_sessionKeys.normal) { updates['logs/' + _sessionKeys.normal] = null; _sessionKeys.normal = null; }
      if (_sessionKeys.secondary) { updates['logs/' + _sessionKeys.secondary] = null; _sessionKeys.secondary = null; }
      if (_sessionKeys.admin) { updates['logs/' + _sessionKeys.admin] = null; _sessionKeys.admin = null; }
      
      if (Object.keys(updates).length > 0) db.ref().update(updates);
    } else {
      if (_originalRole !== 'founder') _originalRole = 'admin';
    }
    
    fbIncrement('login_' + _currentLoginRole, _authVia);
    applyAdminModeUI();
    showToast('✓ Elevated to ' + newRole.toUpperCase() + '!');

  } else {
    _isAdmin = false;
    _originalRole = pwRole;
    fbIncrement('login_' + _currentLoginRole, _authVia);
    applyUserModeUI();
    showToast('✓ Elevated to ' + newRole.toUpperCase() + '!');
  }
}

/* ── SHIELD (SYSTEM PROTECTION) ── */
function openShieldModal() {
  document.getElementById('shield-pw').value          = '';
  document.getElementById('shield-err').style.display = 'none';
  document.getElementById('shield-overlay').classList.add('open');
  closeAllMenus();
  setTimeout(function() { document.getElementById('shield-pw').focus(); }, 50);
}
function closeShieldModal() { document.getElementById('shield-overlay').classList.remove('open'); }

async function submitToggleShield() {
  var val  = document.getElementById('shield-pw').value.toLowerCase();
  var buf  = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(val));
  var hash = Array.from(new Uint8Array(buf)).map(function(b) { return b.toString(16).padStart(2,'0'); }).join('');
  if (hash === currentHashes.founder) {
    if (db) db.ref('settings/protection').set(!_isProtected, function(error) {
      if (!error) { closeShieldModal(); showToast(!_isProtected ? '✓ Protection Enabled' : '✓ Protection Disabled'); }
    });
  } else {
    var err = document.getElementById('shield-err');
    err.style.display = 'block';
    setTimeout(function() { err.style.display = 'none'; }, 2000);
  }
}

/* ── CHANGE PASSWORD ── */
var _pwChangeType = 'normal';
function openChangePw(type) {
  if (_isProtected && type !== 'founder') { showToast('System is protected!'); return; }
  _pwChangeType = type;
  var labels = { normal: 'Change Main Pass', secondary: 'Change Sub Pass', admin: 'Change Admin Pass', founder: 'Change Founder Pass' };
  document.getElementById('pw-change-title').textContent   = labels[type];
  document.getElementById('pw-old').value                  = '';
  document.getElementById('pw-new').value                  = '';
  document.getElementById('pw-confirm').value              = '';
  document.getElementById('pw-change-err').style.display   = 'none';
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
  if (newPw !== confirmPw)            { errEl.textContent = 'New passwords do not match'; errEl.style.display = 'block'; return; }

  var hash = async function(v) { var buf = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(v)); return Array.from(new Uint8Array(buf)).map(function(b){return b.toString(16).padStart(2,'0');}).join(''); };
  var oldHash = await hash(oldPw);
  var isAuthorized = false;
  if (oldHash === currentHashes.founder)                                                                                         isAuthorized = true;
  else if (oldHash === currentHashes.admin && _pwChangeType !== 'founder')                                                       isAuthorized = true;
  else if (_pwChangeType === 'normal'    && (oldHash === currentHashes.normal    || oldHash === currentHashes.secondary)) isAuthorized = true;
  else if (_pwChangeType === 'secondary' && (oldHash === currentHashes.secondary || oldHash === currentHashes.normal))   isAuthorized = true;
  if (!isAuthorized) { errEl.textContent = 'Incorrect password or insufficient permissions'; errEl.style.display = 'block'; return; }

  var newHash = await hash(newPw);
  if (db) {
    var updates = {}; updates['settings/passwords_v3/' + _pwChangeType] = newHash;
    db.ref().update(updates, function(error) {
      if (error) { errEl.textContent = 'Connection error'; errEl.style.display = 'block'; }
      else {
        closeChangePw();
        showToast('✓ Password updated');
        db.ref('notifications').push({ text: '🔑 Password changed: ' + _pwChangeType + ' | IP: ' + (window._myIP || 'Unknown'), ts: Date.now(), read: false });
      }
    });
  }
}