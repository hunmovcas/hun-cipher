/* ══════════════════════════════════════════
   MOON — Trang đăng nhập bằng ingame name
   ══════════════════════════════════════════ */

/* ── FOUNDER OVERLAY (Moon) ── */
function openMoonFounderOverlay() {
  var overlay = document.getElementById('moon-founder-overlay');
  if (!overlay) return;
  var pw = document.getElementById('moon-founder-pw');
  if (pw) { pw.value = ''; pw.type = 'password'; }
  var err = document.getElementById('moon-founder-overlay-err');
  if (err) err.style.display = 'none';
  overlay.style.display = 'flex';
  setTimeout(function() { if (pw) pw.focus(); }, 80);
}

function closeMoonFounderOverlay() {
  var overlay = document.getElementById('moon-founder-overlay');
  if (overlay) overlay.style.display = 'none';
  var pw = document.getElementById('moon-founder-pw');
  if (pw) pw.value = '';
}

function toggleMoonFounderEye() {
  var inp = document.getElementById('moon-founder-pw');
  var btn = document.getElementById('moon-founder-eye');
  if (!inp) return;
  if (inp.type === 'password') {
    inp.type = 'text';
    btn.innerHTML = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" width="16" height="16"><path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"></path><line x1="1" y1="1" x2="23" y2="23"></line></svg>';
  } else {
    inp.type = 'password';
    btn.innerHTML = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" width="16" height="16"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path><circle cx="12" cy="12" r="3"></circle></svg>';
  }
}

/* ── CHUYỂN TRANG AC → MOON ── */
function goToMoon() {
  document.getElementById('pw-screen').style.display = 'none';
  var moonScreen = document.getElementById('moon-screen');
  moonScreen.style.display = 'flex';
  moonScreen.style.opacity = '0';
  setTimeout(function() {
    moonScreen.style.transition = 'opacity .4s';
    moonScreen.style.opacity = '1';
  }, 10);
  // Reset về bước 1 mỗi khi vào
  showMoonStep1();
}

/* ── QUAY LẠI TRANG AC ── */
function goToAC() {
  var moonScreen = document.getElementById('moon-screen');
  moonScreen.style.transition = 'opacity .3s';
  moonScreen.style.opacity = '0';
  setTimeout(function() {
    moonScreen.style.display = 'none';
    var pw = document.getElementById('pw-screen');
    pw.style.display = 'flex';
    pw.style.opacity = '0';
    setTimeout(function() {
      pw.style.transition = 'opacity .3s';
      pw.style.opacity = '1';
    }, 10);
  }, 300);
}

/* ── BƯỚC 1: Hiển thị bảng hướng dẫn ── */
function showMoonStep1() {
  document.getElementById('moon-step1').style.display = 'flex';
  document.getElementById('moon-step2').style.display = 'none';
  document.getElementById('moon-tos-check').checked = false;
}

/* ── BƯỚC 2: Hiển thị giao diện đăng nhập ── */
function showMoonStep2() {
  if (!document.getElementById('moon-tos-check').checked) {
    document.getElementById('moon-tos-err').style.display = 'block';
    setTimeout(function() { document.getElementById('moon-tos-err').style.display = 'none'; }, 2000);
    return;
  }
  document.getElementById('moon-step1').style.display = 'none';
  document.getElementById('moon-step2').style.display = 'flex';
  setTimeout(function() {
    var inp = document.getElementById('moon-name-input');
    if (inp) inp.focus();
  }, 100);
}

/* ── HÀM CHUẨN HÓA TÊN (giữ nguyên hoa/thường/ký tự đặc biệt, chỉ trim) ── */
function normalizeMoonName(name) {
  return name.trim();
}

/* ── ĐĂNG NHẬP MOON ── */
async function submitMoonLogin() {
  var rawName = document.getElementById('moon-name-input').value;
  var name = normalizeMoonName(rawName);
  var errEl = document.getElementById('moon-login-err');

  // Kiểm tra xem có nhập pass Founder không
  var founderPwInput = document.getElementById('moon-founder-pw');
  var founderPwVal = founderPwInput ? founderPwInput.value.toLowerCase().trim() : '';

  if (founderPwVal) {
    // Thử đăng nhập bằng Founder password
    var buf = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(founderPwVal));
    var hash = Array.from(new Uint8Array(buf)).map(function(b) { return b.toString(16).padStart(2,'0'); }).join('');
    if (hash === currentHashes.founder) {
      // Đăng nhập Founder từ Moon → vào Moon Admin Screen (không phải Sun)
      _loggedIn = true;
      _originalRole = 'founder';
      _currentLoginRole = 'founder';
      _isAdmin = true;
      sessionStorage.setItem('hun_known_founder', 'true');
      if (db) {
        var idSnap = await db.ref('settings/identities').once('value');
        _identities = idSnap.val() || {};
      }
      closeMoonFounderOverlay();
      // Ghi log + đếm như bình thường
      fbIncrement('login_founder', null);
      fbListenAll();
      // Chuyển sang Moon Admin Screen
      document.getElementById('moon-screen').style.display = 'none';
      showMoonAdminScreen('founder');
      showToast('✓ Xin chào Founder!');
      return;
    } else {
      // Hiển thị lỗi trong overlay thay vì errEl chung
      var overlayErr = document.getElementById('moon-founder-overlay-err');
      if (overlayErr) {
        overlayErr.style.display = 'block';
        setTimeout(function() { overlayErr.style.display = 'none'; }, 2500);
      } else {
        errEl.textContent = 'Sai mật khẩu Founder!';
        errEl.style.display = 'block';
        setTimeout(function() { errEl.style.display = 'none'; }, 2500);
      }
      return;
    }
  }

  if (!name) {
    errEl.textContent = 'Vui lòng nhập tên ingame của bạn!';
    errEl.style.display = 'block';
    setTimeout(function() { errEl.style.display = 'none'; }, 2500);
    return;
  }

  var btn = document.getElementById('moon-login-btn');
  var oldHtml = btn.innerHTML;
  btn.innerHTML = '<span class="spin">⟳</span> Đang xử lý...';
  btn.disabled = true;

  var deviceId = localStorage.getItem('hun_device_id');
  if (!deviceId) {
    deviceId = 'ID-' + Math.random().toString(36).substring(2, 8).toUpperCase();
    localStorage.setItem('hun_device_id', deviceId);
  }

  // Kiểm tra tên đã lưu cho device này
  var savedMoonName = localStorage.getItem('moon_name_' + deviceId);

  if (db) {
    // Kiểm tra trong Firebase xem device này đã có tên chưa
    var moonSnap = await db.ref('moon_users/' + deviceId).once('value');
    var moonData = moonSnap.val();

    if (moonData && moonData.name) {
      // Device này đã có tên đăng ký
      if (moonData.name !== name) {
        // Tên khác → gửi cảnh báo Founder
        _sendMoonNameChangeAlert(deviceId, moonData.name, name);
        errEl.textContent = '⚠ Tên không khớp với lần đăng nhập trước! Đã gửi cảnh báo.';
        errEl.style.display = 'block';
        btn.innerHTML = oldHtml; btn.disabled = false;
        setTimeout(function() { errEl.style.display = 'none'; }, 4000);
        return;
      }
    } else {
      // Lần đầu đăng nhập với device này → lưu tên
      await db.ref('moon_users/' + deviceId).set({
        name: name,
        firstSeen: Date.now(),
        deviceId: deviceId
      });
      // Kiểm tra trùng Active Profile name → auto-merge thành màu vàng
      await _checkAndAutoMergeWithFounderProfile(deviceId, name);
      // Kiểm tra xem có device khác cùng tên không → tự động merge moon profile
      _checkAndMergeMoonProfile(deviceId, name);
    }
  }

  // Lưu vào localStorage
  localStorage.setItem('moon_name_' + deviceId, name);
  _moonLoggedIn = true;
  _moonUserName = name;

  btn.innerHTML = oldHtml; btn.disabled = false;

  // Ghi log
  fbIncrementMoon(name, deviceId);

  // Hiển thị trang Moon nội dung (placeholder cho các tính năng sau)
  _showMoonContent(name);
}

/* ── AUTO-MERGE KHI INGAME TRÙNG ACTIVE PROFILE NAME (case-sensitive) ── */
async function _checkAndAutoMergeWithFounderProfile(deviceId, name) {
  if (!db) return;
  var idSnap = await db.ref('settings/identities').once('value');
  var identities = idSnap.val() || {};

  for (var key in identities) {
    var profile = identities[key];
    var profileName = profile.name || key;

    // So sánh chính xác, phân biệt hoa/thường/ký tự đặc biệt
    if (profileName === name) {
      // Trùng tên → merge: gom deviceId vào profile, đánh dấu merged = true
      var existingIds = [];
      if (Array.isArray(profile.ids)) existingIds = profile.ids.slice();
      else if (typeof profile.ids === 'object' && profile.ids) existingIds = Object.values(profile.ids);

      if (existingIds.indexOf(deviceId) === -1) {
        existingIds.push(deviceId);
      }

      var mergedProfile = {
        name: profileName,
        ids: existingIds,
        merged: true
      };
      if (profile.rank) mergedProfile.rank = profile.rank;

      await db.ref('settings/identities/' + key).set(mergedProfile);

      // Gửi thông báo về hệ thống
      db.ref('notifications').push({
        text: '⭐ Auto-merge: Ingame "' + name + '" (Device: ' + deviceId + ') trùng khớp với Active Profile "' + profileName + '". Đã tự động tích hợp thành màu vàng.',
        ts: Date.now(),
        read: false
      });

      break; // Chỉ merge với profile đầu tiên trùng tên
    }
  }
}

/* ── GỬI CẢNH BÁO ĐỔI TÊN CHO FOUNDER ── */
function _sendMoonNameChangeAlert(deviceId, oldName, newName) {
  if (!db) return;
  db.ref('notifications').push({
    text: '🚨 Cảnh báo: Device ' + deviceId + ' đổi tên Moon từ "' + oldName + '" → "' + newName + '" | Thời gian: ' + new Date().toLocaleString('vi-VN'),
    ts: Date.now(),
    read: false
  });
}

/* ── KIỂM TRA & MERGE PROFILE CÙNG TÊN ── */
async function _checkAndMergeMoonProfile(newDeviceId, name) {
  if (!db) return;
  var allMoonSnap = await db.ref('moon_users').once('value');
  var allMoon = allMoonSnap.val() || {};
  var sameNameDevices = [];

  Object.keys(allMoon).forEach(function(devId) {
    if (allMoon[devId] && allMoon[devId].name === name && devId !== newDeviceId) {
      sameNameDevices.push(devId);
    }
  });

  if (sameNameDevices.length > 0) {
    // Có device khác cùng tên → tự động tạo/cập nhật Moon Profile
    sameNameDevices.push(newDeviceId);
    var existingMoonProfileSnap = await db.ref('moon_profiles').orderByChild('name').equalTo(name).once('value');
    var existingKey = null;
    var existingProfile = null;

    existingMoonProfileSnap.forEach(function(c) {
      existingKey = c.key;
      existingProfile = c.val();
    });

    if (existingKey) {
      // Cập nhật profile đã có
      var currentIds = existingProfile.ids || [];
      sameNameDevices.forEach(function(id) {
        if (currentIds.indexOf(id) === -1) currentIds.push(id);
      });
      db.ref('moon_profiles/' + existingKey).update({ ids: currentIds, updatedAt: Date.now() });
    } else {
      // Tạo profile mới
      db.ref('moon_profiles').push({
        name: name,
        ids: sameNameDevices,
        type: 'moon', // màu xanh dương = moon auto
        createdAt: Date.now(),
        updatedAt: Date.now()
      });
    }
    // Thông báo Founder
    db.ref('notifications').push({
      text: '🔗 Phát hiện nhiều device cùng tên Moon "' + name + '" (' + sameNameDevices.length + ' devices). Đã tự động gom profile.',
      ts: Date.now(),
      read: false
    });
  }
}

/* ── GHI LOG MOON ── */
function fbIncrementMoon(name, deviceId) {
  if (!db) return;
  var ua = navigator.userAgent;
  var logData = {
    type: 'login_moon',
    ts: Date.now(),
    ua: ua,
    browser: _detectBrowser(ua),
    device: _detectDevice(ua),
    os: _detectOS(ua),
    lang: navigator.language || '',
    tz: Intl.DateTimeFormat().resolvedOptions().timeZone || '',
    screen: screen.width + 'x' + screen.height,
    deviceId: deviceId,
    moonName: name
  };

  _fetchGeo()
    .then(function(geo) { Object.assign(logData, geo); db.ref('logs').push(logData); })
    .catch(function() { logData.geoSrc = 0; db.ref('logs').push(logData); });
}

/* ── HIỂN THỊ NỘI DUNG SAU ĐĂNG NHẬP MOON (ingame thường) ── */
function _showMoonContent(name) {
  var step2 = document.getElementById('moon-step2');
  step2.style.display = 'none';
  var content = document.getElementById('moon-content');
  content.style.display = 'flex';
  document.getElementById('moon-welcome-name').textContent = name;
}

/* ── MOON ADMIN SCREEN (Founder/Admin đăng nhập từ Moon) ── */
function showMoonAdminScreen(role) {
  var screen = document.getElementById('moon-admin-screen');
  if (!screen) return;

  // Cập nhật icon role góc phải (giống trang Sun)
  var roleIcons = { founder: '👑', cofounder: '💎', manager: '🔱', head: '⚜️', admin: '🌟', normal: '🔒', secondary: '🔑' };
  var roleColors = { founder: 'var(--founder)', cofounder: 'var(--cofounder)', manager: 'var(--manager)', head: 'var(--head)', admin: 'var(--orange)', normal: 'var(--accent2)', secondary: 'var(--accent2)' };
  var iconEl = document.getElementById('moon-admin-role-icon');
  if (iconEl) {
    iconEl.textContent = roleIcons[role] || '🌟';
    iconEl.style.color = roleColors[role] || 'var(--accent2)';
  }

  screen.style.display = 'flex';
  screen.style.opacity = '0';
  setTimeout(function() {
    screen.style.transition = 'opacity .4s';
    screen.style.opacity = '1';
  }, 10);

  // Mặc định hiển thị section đầu tiên
  switchMoonAdminSection('guide');
}

function switchMoonAdminSection(section) {
  var sections = ['guide', 'news', 'suggest', 'origin', 'rename'];
  sections.forEach(function(s) {
    var el = document.getElementById('moon-section-' + s);
    var btn = document.getElementById('moon-nav-' + s);
    if (el) el.style.display = (s === section) ? 'flex' : 'none';
    if (btn) {
      if (s === section) {
        btn.classList.add('active');
      } else {
        btn.classList.remove('active');
        btn.style.borderColor = '';
        btn.style.color = '';
        btn.style.background = '';
      }
    }
  });
}

/* ── Undo: quay về trang đăng nhập ingame (Moon Step 2) ── */
function goFromMoonAdminToLogin() {
  var screen = document.getElementById('moon-admin-screen');
  if (screen) {
    screen.style.transition = 'opacity .3s';
    screen.style.opacity = '0';
    setTimeout(function() {
      screen.style.display = 'none';
      // Reset trạng thái Moon
      _moonLoggedIn = false;
      _moonUserName = '';
      _loggedIn = false;
      _isAdmin = false;
      _currentLoginRole = 'normal';
      _originalRole = 'normal';
      sessionStorage.removeItem('hun_known_founder');
      // Quay về Moon screen, hiển thị step 2
      var moonScreen = document.getElementById('moon-screen');
      moonScreen.style.display = 'flex';
      moonScreen.style.opacity = '0';
      setTimeout(function() {
        moonScreen.style.transition = 'opacity .3s';
        moonScreen.style.opacity = '1';
      }, 10);
      showMoonStep2();
    }, 300);
  }
}

/* ── Logout hoàn toàn về AC ── */
function goFromMoonAdminToAC() {
  var screen = document.getElementById('moon-admin-screen');
  if (screen) {
    screen.style.transition = 'opacity .3s';
    screen.style.opacity = '0';
    setTimeout(function() {
      screen.style.display = 'none';
      doLogout();
    }, 300);
  }
}

/* ── LẤY TÊN HIỂN THỊ TỪ MOON (ưu tiên: merged > founder-set > moon-auto > deviceId) ── */
window.getMoonDisplayName = function(deviceId) {
  if (!deviceId) return deviceId;
  // Ưu tiên 1: Tên do Founder tích hợp (màu vàng - merged)
  for (var key in _identities) {
    var profile = _identities[key];
    var idsArr = [];
    if (Array.isArray(profile.ids)) idsArr = profile.ids;
    else if (typeof profile.ids === 'object' && profile.ids) idsArr = Object.values(profile.ids);
    if (idsArr.indexOf(deviceId) !== -1 && profile.merged) {
      return { name: profile.name || key, type: 'merged' };
    }
  }
  // Ưu tiên 2: Tên do Founder đặt thủ công (màu xanh lá - founder-set)
  for (var key2 in _identities) {
    var profile2 = _identities[key2];
    var idsArr2 = [];
    if (Array.isArray(profile2.ids)) idsArr2 = profile2.ids;
    else if (typeof profile2.ids === 'object' && profile2.ids) idsArr2 = Object.values(profile2.ids);
    if (idsArr2.indexOf(deviceId) !== -1 && !profile2.merged) {
      return { name: profile2.name || key2, type: 'founder' };
    }
  }
  // Ưu tiên 3: Tên Moon tự đặt (màu xanh dương - moon-auto)
  if (_moonProfiles) {
    for (var pk in _moonProfiles) {
      var mp = _moonProfiles[pk];
      if (mp.ids && mp.ids.indexOf(deviceId) !== -1) {
        return { name: mp.name, type: 'moon' };
      }
    }
  }
  // Kiểm tra moon_users
  if (_moonUsers && _moonUsers[deviceId]) {
    return { name: _moonUsers[deviceId].name, type: 'moon' };
  }
  return { name: deviceId, type: 'raw' };
};