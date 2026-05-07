/* ══════════════════════════════════════════
   firebase.js — Tầng database
   Toàn bộ tương tác với Firebase Realtime DB.
   Nếu muốn đổi sang backend khác, chỉ sửa file này.
   ══════════════════════════════════════════ */

/**
 * Khởi tạo Firebase và lắng nghe tất cả settings.
 */
function initFirebase() {
  try {
    firebase.initializeApp(FIREBASE_CONFIG);
    db = firebase.database();

    // ── Passwords ──
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

    // ── Hints ──
    db.ref('settings/hints_v3').on('value', function(snap) {
      if (snap.exists()) {
        currentHints.hint1 = snap.val().hint1 || DEFAULT_HINTS.hint1;
        currentHints.hint2 = snap.val().hint2 || DEFAULT_HINTS.hint2;
        renderHints();
      } else {
        db.ref('settings/hints_v3').set(currentHints);
      }
    });

    // ── Secret messages ──
    db.ref('settings/secretMsgs_v3').on('value', function(snap) {
      if (snap.exists()) {
        currentSecretMsgs.normal    = snap.val().normal    || DEFAULT_SECRET_MSGS.normal;
        currentSecretMsgs.secondary = snap.val().secondary || DEFAULT_SECRET_MSGS.secondary;
        currentSecretMsgs.admin     = snap.val().admin     || DEFAULT_SECRET_MSGS.admin;
      } else {
        db.ref('settings/secretMsgs_v3').set(currentSecretMsgs);
      }
    });

    // ── Notes (tagline & footer) ──
    db.ref('settings/notes_v2').on('value', function(snap) {
      if (snap.exists()) {
        currentNotes.tagline = snap.val().tagline || DEFAULT_NOTES.tagline;
        currentNotes.footer  = snap.val().footer  || DEFAULT_NOTES.footer;
        renderNotes();
      } else {
        db.ref('settings/notes_v2').set(currentNotes);
      }
    });

    // ── Identity profiles (aliases) ──
    db.ref('settings/aliases').on('value', function(snap) {
      _aliases = snap.val() || {};
      if (document.getElementById('log-screen').style.display === 'block') {
        renderLogs();
        renderIpStats();
      }
    });

    // ── System protection ──
    db.ref('settings/protection').on('value', function(snap) {
      _isProtected = !!snap.val();
      updateProtectionUI();
    });

    // ── Blocked IPs ──
    db.ref('settings/blockedIPs').on('value', function(snap) {
      _blockedIPs = snap.val() || {};
      checkBlock();
    });

    // ── Popups ──
    db.ref('settings/popups').on('value', function(snap) {
      if (snap.exists()) {
        currentPopups.wrong = snap.val().wrong || DEFAULT_POPUPS.wrong;
        currentPopups.close = snap.val().close || DEFAULT_POPUPS.close;
      } else {
        db.ref('settings/popups').set(currentPopups);
      }
    });

    // ── Titles ──
    db.ref('settings/titles').on('value', function(snap) {
      if (snap.exists()) {
        currentTabTitle  = snap.val().tab  || DEFAULT_TAB_TITLE;
        currentMainTitle = snap.val().main || DEFAULT_MAIN_TITLE;
        renderTitle();
      } else {
        db.ref('settings/titles').set({ tab: currentTabTitle, main: currentMainTitle });
      }
    });

    // ── Welcome banner ──
    db.ref('settings/welcome').on('value', function(snap) {
      if (snap.exists()) {
        currentWelcome = snap.val() || DEFAULT_WELCOME;
        renderWelcome();
      } else {
        db.ref('settings/welcome').set(currentWelcome);
      }
    });

    if (document.getElementById('pw-screen').style.display !== 'none') {
      fbIncrement('view');
      fbListenOuter();
    }
  } catch (e) {
    console.error('[Firebase] Init failed:', e);
    var errEl = document.getElementById('fb-err');
    if (errEl) errEl.style.display = 'block';
  }
}

/**
 * Ghi log & tăng counter theo loại sự kiện.
 * @param {'view'|'login_normal'|'login_secondary'|'login_admin'|'login_founder'} type
 */
function fbIncrement(type) {
  if (!db) return;

  // Tăng counter duy nhất theo loại
  if (type === 'view') {
    if (_sessionLogged) return;
    _sessionLogged = true;
    // Chỉ tăng unique visitors nếu không phải admin/founder
    if (localStorage.getItem('hun_is_admin') !== 'true') {
      db.ref('counters/real_visitors').transaction(function(n) { return (n || 0) + 1; });
    }
    db.ref('counters/outer').transaction(function(n) { return (n || 0) + 1; });
  } else if (type === 'login_normal') {
    db.ref('counters/inner_normal').transaction(function(n) { return (n || 0) + 1; });
  } else if (type === 'login_secondary') {
    db.ref('counters/inner_secondary').transaction(function(n) { return (n || 0) + 1; });
  } else if (type === 'login_admin') {
    db.ref('counters/admin').transaction(function(n) { return (n || 0) + 1; });
  } else if (type === 'login_founder') {
    db.ref('counters/founder').transaction(function(n) { return (n || 0) + 1; });
  }

  // Gán loại log thực tế (login_secondary hiển thị là login_normal trong bảng)
  var logType = (type === 'login_secondary') ? 'login_normal' : type;

  // Lấy/tạo device ID
  var deviceId = localStorage.getItem('hun_device_id');
  if (!deviceId) {
    deviceId = 'ID-' + Math.random().toString(36).substring(2, 8).toUpperCase();
    localStorage.setItem('hun_device_id', deviceId);
  }

  var ua = navigator.userAgent;
  var logData = {
    type:     logType,
    ts:       Date.now(),
    ua:       ua,
    browser:  _detectBrowser(ua),
    device:   _detectDevice(ua),
    os:       _detectOS(ua),
    lang:     navigator.language || '',
    tz:       Intl.DateTimeFormat().resolvedOptions().timeZone || '',
    screen:   screen.width + 'x' + screen.height,
    deviceId: deviceId,
  };

  function pushLog(data) {
    db.ref('logs').push(data).then(function(snap) {
      if      (type === 'view')                            _sessionKeys.view = snap.key;
      else if (type === 'login_normal' || type === 'login_secondary') {
        _sessionKeys.normal     = snap.key;
        _sessionKeys.normalType = type;
      }
      else if (type === 'login_admin')   _sessionKeys.admin   = snap.key;
      else if (type === 'login_founder') _sessionKeys.founder = snap.key;
    });
  }

  _fetchGeo()
    .then(function(geo) { Object.assign(logData, geo); pushLog(logData); })
    .catch(function()   { logData.geoSrc = 0;          pushLog(logData); });
}

/**
 * Lắng nghe counter "outer" (total views) — dùng trên màn hình lock.
 */
function fbListenOuter() {
  if (!db) return;
  db.ref('counters/outer').on('value', function(s) {
    _vOuter = s.val() || 0;
    updateStatsUI();
  });
}

/**
 * Lắng nghe tất cả counters và toàn bộ log — dùng sau khi đăng nhập.
 */
function fbListenAll() {
  if (!db) return;
  db.ref('counters/outer').on('value',         function(s) { _vOuter   = s.val() || 0; updateStatsUI(); });
  db.ref('counters/inner_normal').on('value',  function(s) { _vNormal  = s.val() || 0; updateStatsUI(); });
  db.ref('counters/inner_secondary').on('value',function(s){ _vSec     = s.val() || 0; updateStatsUI(); });
  db.ref('counters/admin').on('value',         function(s) { _vAdmin   = s.val() || 0; updateStatsUI(); });
  db.ref('counters/founder').on('value',       function(s) { _vFounder = s.val() || 0; updateStatsUI(); });
  db.ref('counters/real_visitors').on('value', function(s) { _vReal    = s.val() || 0; updateStatsUI(); });

  // Lắng nghe log realtime
  db.ref('logs').on('value', function(snap) {
    var list = [];
    snap.forEach(function(c) { list.push(Object.assign({ _k: c.key }, c.val())); });
    _allLogs = list.reverse();
    updateSessionBreakdown();
    var logScreen = document.getElementById('log-screen');
    if (logScreen && logScreen.style.display === 'block') {
      renderLogs();
      renderIpStats();
    }
  });
}

/**
 * Lắng nghe thông báo (notifications) — chỉ khi là admin/founder.
 */
function fbListenNoti() {
  if (!db) return;
  db.ref('notifications').orderByChild('ts').limitToLast(20).on('value', function(snap) {
    _allNoti = [];
    var unreadCount = 0;
    snap.forEach(function(c) {
      var val = c.val();
      _allNoti.push(Object.assign({ _k: c.key }, val));
      if (!val.read) unreadCount++;
    });
    _allNoti.reverse();

    var numEl = document.getElementById('num-noti');
    if (unreadCount > 0) {
      numEl.textContent = unreadCount;
      numEl.style.display = 'inline-block';
      document.getElementById('cnt-noti').style.color = '#e74c3c';
    } else {
      numEl.style.display = 'none';
      document.getElementById('cnt-noti').style.color = 'var(--accent)';
    }
    renderNotiList();
  });
}

/**
 * Ngắt kết nối tất cả Firebase listeners — gọi khi logout.
 */
function fbDetachAll() {
  if (!db) return;
  db.ref('counters/outer').off();
  db.ref('counters/inner_normal').off();
  db.ref('counters/inner_secondary').off();
  db.ref('counters/admin').off();
  db.ref('counters/founder').off();
  db.ref('counters/real_visitors').off();
  db.ref('logs').off();
  db.ref('notifications').off();
}