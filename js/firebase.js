/* ══════════════════════════════════════════
   FIREBASE — init, counters, listeners
   ══════════════════════════════════════════ */

function initFirebase() {
  try {
    firebase.initializeApp(firebaseConfig);
    db = firebase.database();

    db.ref('settings/counter_offsets').once('value', function (snap) {
      if (!snap.exists()) {
        db.ref('counters').once('value', function (oldSnap) {
          if (oldSnap.exists()) {
            db.ref('settings/counter_offsets').set(oldSnap.val());
            console.log("Migration Successful: Legacy counters saved as offsets.");
          }
        });
      }
    });

    db.ref('settings/identities').on('value', function (snap) {
      _identities = snap.val() || {};
      if (document.getElementById('log-screen') && document.getElementById('log-screen').style.display === 'block') {
        if (typeof computeUniqueLogs === 'function') computeUniqueLogs();
        if (typeof renderLogs === 'function') {
          renderLogs(); renderUniqueLogs(); renderIpStats();
        }
      }
      // Gọi đúng tên các hàm render UI
      if (typeof renderMoonAllIdentitiesTable === 'function') renderMoonAllIdentitiesTable();
      if (typeof renderMoonIngameTable === 'function') renderMoonIngameTable();
      if (typeof renderIdentityList === 'function') renderIdentityList();
    });

    // Lắng nghe Family Tree
    db.ref('settings/family_tree').on('value', function (snap) {
      _familyTree = snap.val() || {};
      if (typeof renderFamilyTree === 'function' && document.getElementById('family-tree-overlay') && document.getElementById('family-tree-overlay').classList.contains('open')) {
        renderFamilyTree();
      }
    });

    // Lắng nghe Moon Users & Profiles
    db.ref('moon_users').on('value', function (snap) {
      _moonUsers = snap.val() || {};
      if (typeof renderMoonUserTable === 'function') renderMoonUserTable();
    });
    db.ref('moon_profiles').on('value', function (snap) {
      _moonProfiles = snap.val() || {};
      if (typeof renderMoonUserTable === 'function') renderMoonUserTable();
    });

    // Kích hoạt tải và lắng nghe nội dung Hướng dẫn (Trang Moon)
    if (typeof loadMoonContent === 'function') loadMoonContent();

    db.ref('settings/passwords_v3').on('value', function (snap) {
      if (snap.exists() && snap.val().founder) {
        currentHashes.normal = snap.val().normal;
        currentHashes.secondary = snap.val().secondary;
        currentHashes.admin = snap.val().admin;
        currentHashes.founder = snap.val().founder;
        var setupSc = document.getElementById('setup-screen');
        if (setupSc) setupSc.style.display = 'none';
        if (!_loggedIn) document.getElementById('pw-screen').style.display = 'flex';
      } else {
        document.getElementById('pw-screen').style.display = 'none';
        document.getElementById('setup-screen').style.display = 'flex';
      }
    });

    db.ref('settings/hints_v3').on('value', function (snap) {
      if (snap.exists()) {
        currentHints.hint1 = snap.val().hint1 || defaultHints.hint1;
        currentHints.hint2 = snap.val().hint2 || defaultHints.hint2;
        renderHints();
      } else { db.ref('settings/hints_v3').set(currentHints); }
    });

    db.ref('settings/secretMsgs_v3').on('value', function (snap) {
      if (snap.exists()) {
        currentSecretMsgs.normal = snap.val().normal || defaultSecretMsgs.normal;
        currentSecretMsgs.secondary = snap.val().secondary || defaultSecretMsgs.secondary;
        currentSecretMsgs.admin = snap.val().admin || defaultSecretMsgs.admin;
      } else { db.ref('settings/secretMsgs_v3').set(currentSecretMsgs); }
    });

    db.ref('settings/notes_v2').on('value', function (snap) {
      if (snap.exists()) {
        currentNotes.tagline = snap.val().tagline || defaultNotes.tagline;
        currentNotes.footer = snap.val().footer || defaultNotes.footer;
        renderNotes();
      } else { db.ref('settings/notes_v2').set(currentNotes); }
    });

    db.ref('settings/flag_notify').on('value', function (snap) {
      if (snap.exists()) {
        currentFlagNotify.btnText = snap.val().btnText || snap.val().title || defaultFlagNotify.btnText;
        currentFlagNotify.vi = snap.val().vi || defaultFlagNotify.vi;
        currentFlagNotify.en = snap.val().en || defaultFlagNotify.en;
      } else { db.ref('settings/flag_notify').set(currentFlagNotify); }
    });

    db.ref('settings/protection').on('value', function (snap) { _isProtected = !!snap.val(); updateProtectionUI(); });
    db.ref('settings/blockedIPs').on('value', function (snap) { _blockedIPs = snap.val() || {}; checkBlock(); });
    db.ref('settings/popups').on('value', function (snap) {
      if (snap.exists()) {
        currentPopups.wrong = snap.val().wrong || defaultPopups.wrong;
        currentPopups.close = snap.val().close || defaultPopups.close;
      } else { db.ref('settings/popups').set(currentPopups); }
    });
    db.ref('settings/titles').on('value', function (snap) {
      if (snap.exists()) {
        currentTabTitle = snap.val().tab || defaultTabTitle;
        currentMainTitle = snap.val().main || defaultMainTitle;
        renderTitle();
      } else { db.ref('settings/titles').set({ tab: currentTabTitle, main: currentMainTitle }); }
    });
    db.ref('settings/welcome').on('value', function (snap) {
      if (snap.exists()) {
        currentWelcome = snap.val() || defaultWelcome;
        renderWelcome();
      } else { db.ref('settings/welcome').set(currentWelcome); }
    });

    if (document.getElementById('pw-screen').style.display !== 'none') {
      fbIncrement('view'); fbListenOuter();
    }

  } catch (e) {
    console.error(e);
    var el = document.getElementById('fb-err');
    if (el) el.style.display = 'block';
  }
}

/* ── INCREMENT COUNTERS & PUSH LOG ── */
function fbIncrement(type, authVia) {
  if (!db) return;

  if (type === 'view') {
    if (_sessionLogged) return;
    _sessionLogged = true;
  }

  var deviceId = localStorage.getItem('hun_device_id');
  if (!deviceId) {
    deviceId = 'ID-' + Math.random().toString(36).substring(2, 8).toUpperCase();
    localStorage.setItem('hun_device_id', deviceId);
  }

  var ua = navigator.userAgent;
  var logData = {
    type: type, ts: Date.now(), ua: ua,
    browser: _detectBrowser(ua), device: _detectDevice(ua), os: _detectOS(ua),
    lang: navigator.language || '',
    tz: Intl.DateTimeFormat().resolvedOptions().timeZone || '',
    screen: screen.width + 'x' + screen.height,
    deviceId: deviceId
  };

  if (authVia) logData.authVia = authVia;

  function pushData(data) {
    db.ref('logs').push(data).then(function (snap) {
      if (type === 'view') _sessionKeys.view = snap.key;
      else if (type === 'login_normal') _sessionKeys.normal = snap.key;
      else if (type === 'login_secondary') _sessionKeys.secondary = snap.key;
      else if (type === 'login_admin') _sessionKeys.admin = snap.key;
      else if (type === 'login_head') _sessionKeys.head = snap.key;
      else if (type === 'login_manager') _sessionKeys.manager = snap.key;
      else if (type === 'login_cofounder') _sessionKeys.cofounder = snap.key;
      else if (type === 'login_founder') _sessionKeys.founder = snap.key;
    });
  }

  _fetchGeo()
    .then(function (geo) { Object.assign(logData, geo); pushData(logData); })
    .catch(function () { logData.geoSrc = 0; pushData(logData); });
}

/* ── APPLY COMPUTED COUNTS ── */
function applyCounts() {
  _vReal = Math.max(0, (_rawCounts.real_visitors || 0) + (_offsets.real_visitors || 0));
  _vUNormal = Math.max(0, (_rawCounts.unique_normal || 0) + (_offsets.unique_normal || 0));
  _vUSec = Math.max(0, (_rawCounts.unique_secondary || 0) + (_offsets.unique_secondary || 0));
  _vUAdmin = Math.max(0, (_rawCounts.unique_admin || 0) + (_offsets.unique_admin || 0));
  _vUHead = Math.max(0, (_rawCounts.unique_head || 0) + (_offsets.unique_head || 0));
  _vUManager = Math.max(0, (_rawCounts.unique_manager || 0) + (_offsets.unique_manager || 0));
  _vUCoFounder = Math.max(0, (_rawCounts.unique_cofounder || 0) + (_offsets.unique_cofounder || 0));
  _vUFounder = Math.max(0, (_rawCounts.unique_founder || 0) + (_offsets.unique_founder || 0));

  var rawOuter = Math.max(0, (_rawCounts.outer || 0) + (_offsets.outer || 0));
  var rawNormal = Math.max(0, (_rawCounts.inner_normal || 0) + (_offsets.inner_normal || 0));
  var rawSec = Math.max(0, (_rawCounts.inner_secondary || 0) + (_offsets.inner_secondary || 0));
  var rawAdmin = Math.max(0, (_rawCounts.admin || 0) + (_offsets.admin || 0));
  var rawHead = Math.max(0, (_rawCounts.head || 0) + (_offsets.head || 0));
  var rawManager = Math.max(0, (_rawCounts.manager || 0) + (_offsets.manager || 0));
  var rawCoFounder = Math.max(0, (_rawCounts.cofounder || 0) + (_offsets.cofounder || 0));
  var rawFounder = Math.max(0, (_rawCounts.founder || 0) + (_offsets.founder || 0));

  _vOuter = Math.max(rawOuter, _vReal);
  _vNormal = Math.max(rawNormal, _vUNormal);
  _vSec = Math.max(rawSec, _vUSec);
  _vAdmin = Math.max(rawAdmin, _vUAdmin);
  _vHead = Math.max(rawHead, _vUHead);
  _vManager = Math.max(rawManager, _vUManager);
  _vCoFounder = Math.max(rawCoFounder, _vUCoFounder);
  _vFounder = Math.max(rawFounder, _vUFounder);
  _vFounderViews = Math.max(0, (_rawCounts.founder_views || 0) + (_offsets.founder_views || 0));

  if (typeof updateStatsUI === 'function') updateStatsUI();
}

/* ── LISTEN: outer only (before login) ── */
function fbListenOuter() {
  if (!db) return;
  db.ref('logs').orderByChild('type').equalTo('view').on('value', function (snap) {
    var cOut = 0;
    var uniqueDevs = new Set();
    snap.forEach(function (c) {
      var val = c.val();
      if (val.ts >= _CUTOFF_TS) cOut++;
      if (val.ts >= _UNIQUE_CUTOFF_TS) {
        var id = val.deviceId ? 'dev_' + val.deviceId : 'fp_' + (val.ip || '') + '|' + (val.device || '') + '|' + (val.os || '') + '|' + (val.browser || '') + '|' + (val.screen || '');
        uniqueDevs.add(id);
      }
    });
    _rawCounts.outer = cOut;
    _rawCounts.real_visitors = uniqueDevs.size;
    applyCounts();
  });
  db.ref('settings/counter_offsets').on('value', function (snap) {
    if (snap.exists()) _offsets = snap.val();
    applyCounts();
  });
}

/* ── LISTEN: all counters + logs (after login) ── */
function fbListenAll() {
  if (!db) return;

  db.ref('logs').off();
  db.ref('settings/counter_offsets').off();

  db.ref('settings/counter_offsets').on('value', function (s) {
    if (s.exists()) _offsets = s.val();
    applyCounts();
  });

  db.ref('logs').on('value', function (snap) {
    var list = [];
    var cOut = 0, cNorm = 0, cSec = 0, cAdm = 0, cHead = 0, cMan = 0, cCo = 0, cFou = 0, cFouViews = 0;
    var uDevs = new Set(), uNorm = new Set(), uSec = new Set(), uAdm = new Set(), uHead = new Set(), uMan = new Set(), uCo = new Set(), uFou = new Set();

    var fDevs = new Set();
    snap.forEach(function (c) {
      var val = c.val();
      if (val && (val.type === 'login_founder' || getIdentityRankByDevId(val.deviceId) === 'founder')) {
        fDevs.add(val.deviceId);
      }
    });

    snap.forEach(function (c) {
      var val = c.val();
      list.push(Object.assign({ _k: c.key }, val));

      var id = val.deviceId ? 'dev_' + val.deviceId : 'fp_' + (val.ip || '') + '|' + (val.device || '') + '|' + (val.os || '') + '|' + (val.browser || '') + '|' + (val.screen || '');

      if (val.ts >= _UNIQUE_CUTOFF_TS) {
        if (val.type === 'view') { uDevs.add(id); }
        else if (val.type === 'login_normal') { uNorm.add(id); }
        else if (val.type === 'login_secondary') { uSec.add(id); }
        else if (val.type === 'login_admin') { uAdm.add(id); }
        else if (val.type === 'login_head') { uHead.add(id); }
        else if (val.type === 'login_manager') { uMan.add(id); }
        else if (val.type === 'login_cofounder') { uCo.add(id); }
        else if (val.type === 'login_founder') { uFou.add(id); }
      }

      if (val.ts >= _CUTOFF_TS) {
        if (val.type === 'view') {
          cOut++;
          if (val.deviceId && fDevs.has(val.deviceId)) cFouViews++;
        }
        else if (val.type === 'login_normal') { cNorm++; }
        else if (val.type === 'login_secondary') { cSec++; }
        else if (val.type === 'login_admin') { cAdm++; }
        else if (val.type === 'login_head') { cHead++; }
        else if (val.type === 'login_manager') { cMan++; }
        else if (val.type === 'login_cofounder') { cCo++; }
        else if (val.type === 'login_founder') { cFou++; }
      }
    });

    _allLogs = list.reverse();
    computeUniqueLogs();

    _rawCounts.outer = cOut;
    _rawCounts.inner_normal = cNorm;
    _rawCounts.inner_secondary = cSec;
    _rawCounts.admin = cAdm;
    _rawCounts.head = cHead;
    _rawCounts.manager = cMan;
    _rawCounts.cofounder = cCo;
    _rawCounts.founder = cFou;
    _rawCounts.founder_views = cFouViews;

    _rawCounts.real_visitors = uDevs.size;
    _rawCounts.unique_normal = uNorm.size;
    _rawCounts.unique_secondary = uSec.size;
    _rawCounts.unique_admin = uAdm.size;
    _rawCounts.unique_head = uHead.size;
    _rawCounts.unique_manager = uMan.size;
    _rawCounts.unique_cofounder = uCo.size;
    _rawCounts.unique_founder = uFou.size;

    applyCounts();

    var logScreen = document.getElementById('log-screen');
    if (logScreen && logScreen.style.display === 'block') {
      renderLogs(); renderUniqueLogs(); renderIpStats();
    }
  });
}