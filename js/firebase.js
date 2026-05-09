/* ══════════════════════════════════════════
   FIREBASE — init, counters, listeners
   ══════════════════════════════════════════ */

function initFirebase() {
  try {
    firebase.initializeApp(firebaseConfig);
    db = firebase.database();

    // ── AUTO-MIGRATION DỮ LIỆU CŨ ──
    // Quét kiểm tra xem mảng offsets mới đã tồn tại chưa
    db.ref('settings/counter_offsets').once('value', function(snap) {
      if (!snap.exists()) {
        // Nếu chưa tồn tại (chạy lần đầu sau update), tiến hành copy toàn bộ dữ liệu từ counters cũ
        db.ref('counters').once('value', function(oldSnap) {
          if (oldSnap.exists()) {
            db.ref('settings/counter_offsets').set(oldSnap.val());
            console.log("Migration Successful: Legacy counters saved as offsets.");
          }
        });
      }
    });

    db.ref('settings/passwords_v3').on('value', function(snap) {
      if (snap.exists() && snap.val().founder) {
        currentHashes.normal    = snap.val().normal;
        currentHashes.secondary = snap.val().secondary;
        currentHashes.admin     = snap.val().admin;
        currentHashes.founder   = snap.val().founder;
        var setupSc = document.getElementById('setup-screen');
        if (setupSc) setupSc.style.display = 'none';
        if (!_loggedIn) document.getElementById('pw-screen').style.display = 'flex';
      } else {
        document.getElementById('pw-screen').style.display = 'none';
        document.getElementById('setup-screen').style.display = 'flex';
      }
    });

    db.ref('settings/hints_v3').on('value', function(snap) {
      if (snap.exists()) {
        currentHints.hint1 = snap.val().hint1 || defaultHints.hint1;
        currentHints.hint2 = snap.val().hint2 || defaultHints.hint2;
        renderHints();
      } else {
        db.ref('settings/hints_v3').set(currentHints);
      }
    });

    db.ref('settings/secretMsgs_v3').on('value', function(snap) {
      if (snap.exists()) {
        currentSecretMsgs.normal    = snap.val().normal    || defaultSecretMsgs.normal;
        currentSecretMsgs.secondary = snap.val().secondary || defaultSecretMsgs.secondary;
        currentSecretMsgs.admin     = snap.val().admin     || defaultSecretMsgs.admin;
      } else {
        db.ref('settings/secretMsgs_v3').set(currentSecretMsgs);
      }
    });

    db.ref('settings/notes_v2').on('value', function(snap) {
      if (snap.exists()) {
        currentNotes.tagline = snap.val().tagline || defaultNotes.tagline;
        currentNotes.footer  = snap.val().footer  || defaultNotes.footer;
        renderNotes();
      } else {
        db.ref('settings/notes_v2').set(currentNotes);
      }
    });

    db.ref('settings/protection').on('value', function(snap) { _isProtected = !!snap.val(); updateProtectionUI(); });
    db.ref('settings/blockedIPs').on('value', function(snap) { _blockedIPs = snap.val() || {}; checkBlock(); });
    db.ref('settings/popups').on('value', function(snap) {
      if (snap.exists()) {
        currentPopups.wrong = snap.val().wrong || defaultPopups.wrong;
        currentPopups.close = snap.val().close || defaultPopups.close;
      } else {
        db.ref('settings/popups').set(currentPopups);
      }
    });
    db.ref('settings/titles').on('value', function(snap) {
      if (snap.exists()) {
        currentTabTitle  = snap.val().tab  || defaultTabTitle;
        currentMainTitle = snap.val().main || defaultMainTitle;
        renderTitle();
      } else {
        db.ref('settings/titles').set({ tab: currentTabTitle, main: currentMainTitle });
      }
    });
    db.ref('settings/welcome').on('value', function(snap) {
      if (snap.exists()) {
        currentWelcome = snap.val() || defaultWelcome;
        renderWelcome();
      } else {
        db.ref('settings/welcome').set(currentWelcome);
      }
    });

    if (document.getElementById('pw-screen').style.display !== 'none') {
      fbIncrement('view');
      fbListenOuter();
    }

  } catch(e) {
    console.error(e);
    var el = document.getElementById('fb-err');
    if (el) el.style.display = 'block';
  }
}

/* ── INCREMENT COUNTERS & PUSH LOG ── */
function fbIncrement(type) {
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

  function pushData(data) {
    db.ref('logs').push(data).then(function(snap) {
      if (type === 'view')                           _sessionKeys.view      = snap.key;
      else if (type === 'login_normal')              _sessionKeys.normal    = snap.key;
      else if (type === 'login_secondary')           _sessionKeys.secondary = snap.key;
      else if (type === 'login_admin')               _sessionKeys.admin     = snap.key;
      else if (type === 'login_founder')             _sessionKeys.founder   = snap.key;
    });
  }

  _fetchGeo()
    .then(function(geo) { Object.assign(logData, geo); pushData(logData); })
    .catch(function()   { logData.geoSrc = 0; pushData(logData); });
}

/* ── APPLY COMPUTED COUNTS ── */
function applyCounts() {
  _vOuter   = Math.max(0, _rawCounts.outer + (_offsets.outer || 0));
  _vReal    = Math.max(0, _rawCounts.real_visitors + (_offsets.real_visitors || 0));
  _vNormal  = Math.max(0, _rawCounts.inner_normal + (_offsets.inner_normal || 0));
  _vSec     = Math.max(0, _rawCounts.inner_secondary + (_offsets.inner_secondary || 0));
  _vAdmin   = Math.max(0, _rawCounts.admin + (_offsets.admin || 0));
  _vFounder = Math.max(0, _rawCounts.founder + (_offsets.founder || 0));
  updateStatsUI();
}

/* ── LISTEN: outer only (before login) ── */
function fbListenOuter() {
  if (!db) return;
  db.ref('logs').orderByChild('type').equalTo('view').on('value', function(snap) {
    var cOut = 0;
    snap.forEach(function(c) {
      if (c.val().ts >= _CUTOFF_TS) cOut++;
    });
    _rawCounts.outer = cOut;
    applyCounts();
  });
  db.ref('settings/counter_offsets').on('value', function(snap) {
    if (snap.exists()) _offsets = snap.val();
    applyCounts();
  });
}

/* ── LISTEN: all counters + logs (after login) ── */
function fbListenAll() {
  if (!db) return;
  
  db.ref('logs').off(); // Clear any previous listeners to prevent overlap
  db.ref('settings/counter_offsets').off();

  db.ref('settings/counter_offsets').on('value', function(s) {
    if (s.exists()) _offsets = s.val();
    applyCounts();
  });

  db.ref('logs').on('value', function(snap) {
    var list = [];
    var cOut = 0, cNorm = 0, cSec = 0, cAdm = 0, cFou = 0;
    var uniqueDevs = new Set();
    
    snap.forEach(function(c) {
      var val = c.val();
      list.push(Object.assign({ _k: c.key }, val));
      
      // Calculate dynamic counters exactly post-cutoff
      if (val.ts >= _CUTOFF_TS) {
        if (val.type === 'view') {
          cOut++;
          if (val.deviceId) uniqueDevs.add(val.deviceId);
          else if (val.ip) uniqueDevs.add(val.ip);
        }
        else if (val.type === 'login_normal') cNorm++;
        else if (val.type === 'login_secondary') cSec++;
        else if (val.type === 'login_admin') cAdm++;
        else if (val.type === 'login_founder') cFou++;
      }
    });

    _allLogs = list.reverse();
    _rawCounts.outer = cOut;
    _rawCounts.real_visitors = uniqueDevs.size;
    _rawCounts.inner_normal = cNorm;
    _rawCounts.inner_secondary = cSec;
    _rawCounts.admin = cAdm;
    _rawCounts.founder = cFou;

    applyCounts();

    var logScreen = document.getElementById('log-screen');
    if (logScreen && logScreen.style.display === 'block') {
      renderLogs();
      renderIpStats();
    }
  });
}