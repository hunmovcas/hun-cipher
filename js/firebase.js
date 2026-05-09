/* ══════════════════════════════════════════
   FIREBASE — init, counters, listeners
   ══════════════════════════════════════════ */

function initFirebase() {
  try {
    firebase.initializeApp(firebaseConfig);
    db = firebase.database();

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
  var keyMap = { view: 'outer', login_admin: 'admin', login_founder: 'founder' };

  if (type === 'view') {
    if (_sessionLogged) return;
    _sessionLogged = true;
    if (localStorage.getItem('hun_is_admin') !== 'true') {
      db.ref('counters/real_visitors').transaction(function(n) { return (n||0) + 1; });
    }
  }

  var deviceId = localStorage.getItem('hun_device_id');
  if (!deviceId) {
    deviceId = 'ID-' + Math.random().toString(36).substring(2, 8).toUpperCase();
    localStorage.setItem('hun_device_id', deviceId);
  }

  if (type === 'login_normal' || type === 'login_secondary') {
    var subKey = type === 'login_normal' ? 'inner_normal' : 'inner_secondary';
    db.ref('counters/' + subKey).transaction(function(n) { return (n||0) + 1; });
  } else {
    db.ref('counters/' + keyMap[type]).transaction(function(n) { return (n||0) + 1; });
  }

  var logType = (type === 'login_secondary') ? 'login_normal' : type;
  var ua = navigator.userAgent;
  var logData = {
    type: logType, ts: Date.now(), ua: ua,
    browser: _detectBrowser(ua), device: _detectDevice(ua), os: _detectOS(ua),
    lang: navigator.language || '',
    tz: Intl.DateTimeFormat().resolvedOptions().timeZone || '',
    screen: screen.width + 'x' + screen.height,
    deviceId: deviceId
  };

  function pushData(data) {
    db.ref('logs').push(data).then(function(snap) {
      if (type === 'view')                                       _sessionKeys.view       = snap.key;
      else if (type === 'login_normal' || type === 'login_secondary') { _sessionKeys.normal = snap.key; _sessionKeys.normalType = type; }
      else if (type === 'login_admin')                           _sessionKeys.admin      = snap.key;
      else if (type === 'login_founder')                         _sessionKeys.founder    = snap.key;
    });
  }

  _fetchGeo()
    .then(function(geo) { Object.assign(logData, geo); pushData(logData); })
    .catch(function()   { logData.geoSrc = 0; pushData(logData); });
}

/* ── LISTEN: outer only (before login) ── */
function fbListenOuter() {
  if (!db) return;
  db.ref('counters/outer').on('value', function(s) { _vOuter = s.val()||0; updateStatsUI(); });
}

/* ── LISTEN: all counters + logs (after login) ── */
function fbListenAll() {
  if (!db) return;
  db.ref('counters/outer').on('value',          function(s) { _vOuter   = s.val()||0; updateStatsUI(); });
  db.ref('counters/inner_normal').on('value',   function(s) { _vNormal  = s.val()||0; updateStatsUI(); });
  db.ref('counters/inner_secondary').on('value',function(s) { _vSec     = s.val()||0; updateStatsUI(); });
  db.ref('counters/admin').on('value',          function(s) { _vAdmin   = s.val()||0; updateStatsUI(); });
  db.ref('counters/founder').on('value',        function(s) { _vFounder = s.val()||0; updateStatsUI(); });
  db.ref('counters/real_visitors').on('value',  function(s) { _vReal    = s.val()||0; updateStatsUI(); });

  db.ref('logs').on('value', function(snap) {
    var list = [];
    snap.forEach(function(c) { list.push(Object.assign({ _k: c.key }, c.val())); });
    _allLogs = list.reverse();
    var logScreen = document.getElementById('log-screen');
    if (logScreen && logScreen.style.display === 'block') {
      renderLogs();
      renderIpStats();
    }
  });
}