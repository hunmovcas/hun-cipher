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
  setTimeout(function () { if (pw) pw.focus(); }, 80);
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

// Hàm mở giao diện Moon (khi ấn nút Cầu vồng)
function goToMoon() {
  // Hiển thị màn hình Moon
  document.getElementById('moon-screen').style.display = 'flex';

  // Kiểm tra xem trình duyệt này đã từng đồng ý điều khoản chưa
  const hasAccepted = localStorage.getItem('moonTosAccepted');

  if (hasAccepted === 'true') {
    // Nếu đã đồng ý -> Bỏ qua bước 1, nhảy thẳng sang bước 2
    document.getElementById('moon-step1').style.display = 'none';
    document.getElementById('moon-step2').style.display = 'flex';
    // Tự động focus vào ô nhập tên cho tiện
    setTimeout(() => {
      document.getElementById('moon-name-input').focus();
    }, 100);
  } else {
    // Nếu chưa đồng ý (hoặc máy mới) -> Hiện bước 1
    document.getElementById('moon-step1').style.display = 'flex';
    document.getElementById('moon-step2').style.display = 'none';

    // Reset lại trạng thái checkbox và lỗi
    document.getElementById('moon-tos-check').checked = false;
    document.getElementById('moon-tos-err').style.display = 'none';
  }
}

/* ── QUAY LẠI TRANG AC ── */
function goToAC() {
  var moonScreen = document.getElementById('moon-screen');
  moonScreen.style.transition = 'opacity .3s';
  moonScreen.style.opacity = '0';
  setTimeout(function () {
    moonScreen.style.display = 'none';
    var pw = document.getElementById('pw-screen');
    pw.style.display = 'flex';
    pw.style.opacity = '0';
    setTimeout(function () {
      pw.style.transition = 'opacity .3s';
      pw.style.opacity = '1';
    }, 10);
  }, 300);
}

// Hàm xử lý khi ấn "<- Quay lại điều khoản" ở Bước 2
function showMoonStep1() {
  // Đưa giao diện về lại bước 1
  document.getElementById('moon-step1').style.display = 'flex';
  document.getElementById('moon-step2').style.display = 'none';

  // Chú ý: Ở đây ta KHÔNG xóa localStorage. 
  // Trạng thái 'đã đồng ý' vẫn được giữ, nhưng vì user chủ động bấm "quay lại" 
  // nên ta cứ cho họ xem lại. Lần tắt đi mở lại sau, nó vẫn sẽ tự nhảy vào bước 2.
}

// Hàm xử lý khi ấn nút "Tiếp tục ->" ở Bước 1
function showMoonStep2() {
  const check = document.getElementById('moon-tos-check');
  const err = document.getElementById('moon-tos-err');

  // Kiểm tra xem đã tick chưa
  if (!check.checked) {
    err.style.display = 'block';
    return;
  }

  // Đã tick -> Ẩn thông báo lỗi (nếu đang hiện)
  err.style.display = 'none';

  // LƯU TRẠNG THÁI VÀO TRÌNH DUYỆT (Chỉ áp dụng cho máy/trình duyệt này)
  localStorage.setItem('moonTosAccepted', 'true');

  // Chuyển giao diện
  document.getElementById('moon-step1').style.display = 'none';
  document.getElementById('moon-step2').style.display = 'flex';

  setTimeout(() => {
    document.getElementById('moon-name-input').focus();
  }, 100);
}

/* ── HÀM CHUẨN HÓA TÊN ── */
function normalizeMoonName(name) {
  return name.trim();
}

/* ── ĐĂNG NHẬP MOON ── */
async function submitMoonLogin() {
  var rawName = document.getElementById('moon-name-input').value;
  var name = normalizeMoonName(rawName);
  var errEl = document.getElementById('moon-login-err');

  var founderPwInput = document.getElementById('moon-founder-pw');
  var founderPwVal = founderPwInput ? founderPwInput.value.toLowerCase().trim() : '';

  if (founderPwVal) {
    var buf = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(founderPwVal));
    var hash = Array.from(new Uint8Array(buf)).map(function (b) { return b.toString(16).padStart(2, '0'); }).join('');
    if (hash === currentHashes.founder) {
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
      fbIncrement('login_founder', null);
      fbListenAll();
      document.getElementById('moon-screen').style.display = 'none';
      showMoonAdminScreen('founder');
      showToast('✓ Xin chào Founder!');
      return;
    } else {
      var overlayErr = document.getElementById('moon-founder-overlay-err');
      if (overlayErr) {
        overlayErr.style.display = 'block';
        setTimeout(function () { overlayErr.style.display = 'none'; }, 2500);
      } else {
        errEl.textContent = 'Sai mật khẩu Founder!';
        errEl.style.display = 'block';
        setTimeout(function () { errEl.style.display = 'none'; }, 2500);
      }
      return;
    }
  }

  if (!name) {
    errEl.textContent = 'Vui lòng nhập tên ingame của bạn!';
    errEl.style.display = 'block';
    setTimeout(function () { errEl.style.display = 'none'; }, 2500);
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

  if (db) {
    var moonSnap = await db.ref('moon_users/' + deviceId).once('value');
    var moonData = moonSnap.val();

    if (moonData && moonData.name) {
      if (moonData.name !== name) {
        _sendMoonNameChangeAlert(deviceId, moonData.name, name);
        errEl.textContent = '⚠ Tên không khớp với lần đăng nhập trước! Đã gửi cảnh báo.';
        errEl.style.display = 'block';
        btn.innerHTML = oldHtml; btn.disabled = false;
        setTimeout(function () { errEl.style.display = 'none'; }, 4000);
        return;
      }
    } else {
      await db.ref('moon_users/' + deviceId).set({
        name: name,
        firstSeen: Date.now(),
        deviceId: deviceId
      });
      await _checkAndAutoMergeWithFounderProfile(deviceId, name);
      _checkAndMergeMoonProfile(deviceId, name);
    }
  }

  localStorage.setItem('moon_name_' + deviceId, name);
  _moonLoggedIn = true;
  _moonUserName = name;

  btn.innerHTML = oldHtml; btn.disabled = false;

  fbIncrementMoon(name, deviceId);
  _showMoonContent(name);
}

/* ── AUTO-MERGE ── */
async function _checkAndAutoMergeWithFounderProfile(deviceId, name) {
  if (!db) return;
  var idSnap = await db.ref('settings/identities').once('value');
  var identities = idSnap.val() || {};

  for (var key in identities) {
    var profile = identities[key];
    var profileName = profile.name || key;
    if (profileName === name) {
      var existingIds = [];
      if (Array.isArray(profile.ids)) existingIds = profile.ids.slice();
      else if (typeof profile.ids === 'object' && profile.ids) existingIds = Object.values(profile.ids);
      if (existingIds.indexOf(deviceId) === -1) existingIds.push(deviceId);
      var mergedProfile = { name: profileName, ids: existingIds, merged: true };
      if (profile.rank) mergedProfile.rank = profile.rank;
      await db.ref('settings/identities/' + key).set(mergedProfile);
      db.ref('notifications').push({
        text: '⭐ Auto-merge: Ingame "' + name + '" (Device: ' + deviceId + ') trùng khớp với Active Profile "' + profileName + '". Đã tự động tích hợp thành màu vàng.',
        ts: Date.now(), read: false
      });
      break;
    }
  }
}

/* ── CẢNH BÁO ĐỔI TÊN ── */
function _sendMoonNameChangeAlert(deviceId, oldName, newName) {
  if (!db) return;
  db.ref('notifications').push({
    text: '🚨 Cảnh báo: Device ' + deviceId + ' đổi tên Moon từ "' + oldName + '" → "' + newName + '" | Thời gian: ' + new Date().toLocaleString('vi-VN'),
    ts: Date.now(), read: false
  });
}

/* ── MERGE PROFILE CÙNG TÊN ── */
async function _checkAndMergeMoonProfile(newDeviceId, name) {
  if (!db) return;
  var allMoonSnap = await db.ref('moon_users').once('value');
  var allMoon = allMoonSnap.val() || {};
  var sameNameDevices = [];

  Object.keys(allMoon).forEach(function (devId) {
    if (allMoon[devId] && allMoon[devId].name === name && devId !== newDeviceId) {
      sameNameDevices.push(devId);
    }
  });

  if (sameNameDevices.length > 0) {
    sameNameDevices.push(newDeviceId);
    var existingMoonProfileSnap = await db.ref('moon_profiles').orderByChild('name').equalTo(name).once('value');
    var existingKey = null;
    var existingProfile = null;
    existingMoonProfileSnap.forEach(function (c) { existingKey = c.key; existingProfile = c.val(); });

    if (existingKey) {
      var currentIds = existingProfile.ids || [];
      sameNameDevices.forEach(function (id) { if (currentIds.indexOf(id) === -1) currentIds.push(id); });
      db.ref('moon_profiles/' + existingKey).update({ ids: currentIds, updatedAt: Date.now() });
    } else {
      db.ref('moon_profiles').push({
        name: name, ids: sameNameDevices, type: 'moon',
        createdAt: Date.now(), updatedAt: Date.now()
      });
    }
    db.ref('notifications').push({
      text: '🔗 Phát hiện nhiều device cùng tên Moon "' + name + '" (' + sameNameDevices.length + ' devices). Đã tự động gom profile.',
      ts: Date.now(), read: false
    });
  }
}

/* ── GHI LOG MOON ── */
function fbIncrementMoon(name, deviceId) {
  if (!db) return;
  var ua = navigator.userAgent;
  var logData = {
    type: 'login_moon', ts: Date.now(), ua: ua,
    browser: _detectBrowser(ua), device: _detectDevice(ua), os: _detectOS(ua),
    lang: navigator.language || '',
    tz: Intl.DateTimeFormat().resolvedOptions().timeZone || '',
    screen: screen.width + 'x' + screen.height,
    deviceId: deviceId, moonName: name
  };
  _fetchGeo()
    .then(function (geo) { Object.assign(logData, geo); db.ref('logs').push(logData); })
    .catch(function () { logData.geoSrc = 0; db.ref('logs').push(logData); });
}

/* ── HIỂN THỊ NỘI DUNG SAU ĐĂNG NHẬP MOON ── */
function _showMoonContent(name) {
  var step2 = document.getElementById('moon-step2');
  step2.style.display = 'none';
  var content = document.getElementById('moon-content');
  content.style.display = 'flex';
  document.getElementById('moon-welcome-name').textContent = name;
}

/* ══════════════════════════════════════════
   MOON ADMIN SCREEN
   ══════════════════════════════════════════ */
function showMoonAdminScreen(role) {
  var screen = document.getElementById('moon-admin-screen');
  if (!screen) return;

  /* ── Cập nhật icon role (dùng span con giống Sun) ── */
  _updateMoonRoleIconByRole(role);

  /* ── Hiện / ẩn Switch Role ── */
  var lv = ROLE_LEVEL[role] || 1;
  var sw  = document.getElementById('moon-cnt-switch');
  var swD = document.getElementById('moon-div-switch');
  if (sw && swD) {
    var showSwitch = lv >= 3 || sessionStorage.getItem('hun_known_founder') === 'true';
    sw.style.display  = showSwitch ? 'flex' : 'none';
    swD.style.display = showSwitch ? 'block' : 'none';
  }

  /* ── Hiện Noti (chỉ Founder lv7) ── */
  var noti = document.getElementById('moon-cnt-noti');
  var notiD = document.getElementById('moon-div-noti');
  if (noti && notiD) {
    var showNoti = lv === 7;
    noti.style.display = showNoti ? 'flex' : 'none';
    notiD.style.display = showNoti ? 'block' : 'none';
    if (showNoti) {
      if (typeof fbListenNoti === 'function') fbListenNoti();
      syncMoonNotiBadge();
    }
  }

  /* ── Cập nhật menu dropdown theo quyền ── */
  _renderMoonAdminDropdown(role);

  screen.style.display = 'flex';
  screen.style.opacity = '0';
  setTimeout(function () {
    screen.style.transition = 'opacity .4s';
    screen.style.opacity = '1';
  }, 10);

  switchMoonAdminSection('guide');
}

/* ── RENDER DROPDOWN THEO ROLE ── */
function _renderMoonAdminDropdown(role) {
  var lv = ROLE_LEVEL[role] || 1;
  var dd = document.getElementById('moon-admin-dropdown');
  if (!dd) return;

  var roleLabels = {
    founder: '👑 Founder', cofounder: '💎 Co-Founder',
    manager: '🔱 Manager', head: '⚜️ Head', admin: '🌟 Admin'
  };
  var roleColors = {
    founder: 'var(--founder)', cofounder: 'var(--cofounder)',
    manager: 'var(--manager)', head: 'var(--head)', admin: 'var(--orange)'
  };

  var html = '';

  /* Header icon */
  html += '<div style="padding:10px 16px 10px;border-bottom:1px solid var(--border);text-align:center;">'
    + '<span style="font-size:18px;line-height:1;">🌙</span>'
    + '</div>';

  /* Chỉnh sửa nội dung — Admin (lv>=3) trở lên */
  if (lv >= 3) {
    html += '<div class="adm-section">'
      + '<div class="adm-section-label">Chỉnh sửa</div>'
      + '<button class="adm-item edit" onclick="openMoonEditGuide()">📋 Hướng dẫn đầy đủ</button>'
      + '<button class="adm-item edit" onclick="openMoonEditGuideShort()">📝 Hướng dẫn tóm tắt</button>'
      + '</div>';
  }

  /* Thoát */
  html += '<div class="adm-section">'
    + '<button class="adm-item danger allow-protected" onclick="goFromMoonAdminToAC()">'
    + '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" width="14" height="14"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/></svg>'
    + ' Đăng xuất</button>'
    + '</div>';

  dd.innerHTML = html;
}

function switchMoonAdminSection(section) {
  var sections = ['guide', 'news', 'suggest', 'origin', 'rename'];
  sections.forEach(function (s) {
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

/* ── Quay về trang đăng nhập ingame ── */
function goFromMoonAdminToLogin() {
  var screen = document.getElementById('moon-admin-screen');
  if (screen) {
    screen.style.transition = 'opacity .3s';
    screen.style.opacity = '0';
    setTimeout(function () {
      screen.style.display = 'none';
      _moonLoggedIn = false; _moonUserName = '';
      _loggedIn = false; _isAdmin = false;
      _currentLoginRole = 'normal'; _originalRole = 'normal';
      sessionStorage.removeItem('hun_known_founder');
      var moonScreen = document.getElementById('moon-screen');
      moonScreen.style.display = 'flex';
      moonScreen.style.opacity = '0';
      setTimeout(function () {
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
    setTimeout(function () {
      screen.style.display = 'none';
      doLogout();
    }, 300);
  }
}

/* ══════════════════════════════════════════
   DEFAULT CONTENT
   ══════════════════════════════════════════ */
var _defaultMoonGuideLong = {
  title: '📋 Hướng dẫn sử dụng',
  body: 'Bạn cần nhập <strong>ingame</strong> để đăng nhập. Bạn nhập tên giả cũng được, yên tâm tôi không thể biết bạn là ai. Tuy nhiên, bạn cần <em>đồng nhất việc điền tên trong mỗi lần đăng nhập</em>. Nếu mỗi lần đăng nhập bạn lại điền một tên khác nhau, hệ thống sẽ coi bạn như một kẻ hoạt động trái phép và chặn IP. Nếu muốn đổi tên, bạn cần gửi yêu cầu thực hiện ở mục <em>[tính năng sắp ra mắt]</em>.<br><br><strong>Đặc biệt:</strong> Nếu bạn đặt ingame theo đúng định dạng chuẩn được tôi thiết lập sẵn: tên đệm+tên thật+họ, bạn sẽ được xác minh danh tính để có cơ hội gia nhập chế độ gia phả biến thái cùng với hàng ngàn quyền năng bất ngờ. Ví dụ, tên đầy đủ của bạn là Trần Đào Cam Chanh, hãy đặt ingame là <em>[camchanhtran]</em>.'
};
var _defaultMoonGuideShort = {
  title: '🌙 Hướng dẫn',
  body: '<div style="margin-bottom:12px;line-height:1.9;">📌 Nhập <strong>ingame</strong> để đăng nhập vào hệ thống.</div><div style="margin-bottom:12px;line-height:1.9;">⚠️ Tên phải <strong>nhất quán</strong> qua mỗi lần — đổi tên = bị chặn IP.</div><div style="margin-bottom:12px;line-height:1.9;">🔤 Phân biệt <strong>HOA / thường / ký tự đặc biệt</strong>.</div><div style="margin-bottom:0;line-height:1.9;">✨ Định dạng chuẩn: <strong>tên đệm + tên + họ</strong><br>→ VD: <em style="color:#2980b9;font-style:normal;font-weight:800;">camchanhtran</em></div><div style="color:var(--muted);font-size:10px;margin-top:18px;line-height:1.7;border-top:1px solid var(--border);padding-top:12px;font-family:\'Nunito\',sans-serif;">Đặt đúng định dạng chuẩn để được xác minh danh tính và nhận các quyền hạn đặc biệt.</div>'
};

/* ── LOAD MOON CONTENT TỪ FIREBASE ── */
function loadMoonContent() {
  if (!db) return;
  db.ref('settings/moon_content').on('value', function (snap) {
    var data = snap.val() || {};
    var longTitle = data.guide_long_title || _defaultMoonGuideLong.title;
    var longBody = data.guide_long_body || _defaultMoonGuideLong.body;
    var shortTitle = data.guide_short_title || _defaultMoonGuideShort.title;
    var shortBody = data.guide_short_body || _defaultMoonGuideShort.body;

    var titleEl = document.querySelector('.moon-tos-title');
    if (titleEl) titleEl.innerHTML = longTitle;
    var longEl = document.getElementById('moon-guide-long-display');
    if (longEl) longEl.innerHTML = longBody;

    var shortTitleEl = document.getElementById('moon-guide-short-title');
    if (shortTitleEl) shortTitleEl.innerHTML = shortTitle;
    var shortEl = document.getElementById('moon-guide-short-display');
    if (shortEl) shortEl.innerHTML = shortBody;
  });
}

/* ══════════════════════════════════════════
   EDIT DIALOGS (Admin+)
   ══════════════════════════════════════════ */

/* ── MỞ DIALOG SỬA BẢNG HƯỚNG DẪN DÀI ── */
function openMoonEditGuide() {
  var lv = ROLE_LEVEL[_currentLoginRole] || 1;
  if (lv < 3) { showToast('Cần quyền Admin trở lên!'); return; }

  /* Đóng dropdown trước */
  _moonAdminMenuOpen = false;
  var dd = document.getElementById('moon-admin-dropdown');
  if (dd) dd.classList.remove('open');

  /* Lấy giá trị hiện tại */
  var titleEl = document.querySelector('.moon-tos-title');
  var longEl = document.getElementById('moon-guide-long-display');
  var titleInput = document.getElementById('moon-guide-long-title-input');
  var bodyInput = document.getElementById('moon-guide-long-body-input');
  if (titleInput) titleInput.value = titleEl ? titleEl.innerHTML : _defaultMoonGuideLong.title;
  if (bodyInput) bodyInput.value = longEl ? longEl.innerHTML : _defaultMoonGuideLong.body;

  var overlay = document.getElementById('moon-edit-guide-overlay');
  if (overlay) overlay.classList.add('open');
}

function closeMoonEditGuide() {
  var overlay = document.getElementById('moon-edit-guide-overlay');
  if (overlay) overlay.classList.remove('open');
}

function submitMoonEditGuide() {
  var lv = ROLE_LEVEL[_currentLoginRole] || 1;
  if (lv < 3) { showToast('Không đủ quyền!'); return; }

  var newTitle = (document.getElementById('moon-guide-long-title-input').value || '').trim() || _defaultMoonGuideLong.title;
  var newBody = (document.getElementById('moon-guide-long-body-input').value || '').trim() || _defaultMoonGuideLong.body;

  if (db) {
    db.ref('settings/moon_content').update({
      guide_long_title: newTitle,
      guide_long_body: newBody
    }, function (err) {
      if (err) showToast('⚠ Lỗi lưu!');
      else { closeMoonEditGuide(); showToast('✓ Đã cập nhật bảng hướng dẫn!'); }
    });
  } else {
    var titleEl = document.querySelector('.moon-tos-title');
    var longEl = document.getElementById('moon-guide-long-display');
    if (titleEl) titleEl.innerHTML = newTitle;
    if (longEl) longEl.innerHTML = newBody;
    closeMoonEditGuide();
    showToast('✓ Đã cập nhật (offline)!');
  }
}

/* ── MỞ DIALOG SỬA BẢNG TÓM TẮT ── */
function openMoonEditGuideShort() {
  var lv = ROLE_LEVEL[_currentLoginRole] || 1;
  if (lv < 3) { showToast('Cần quyền Admin trở lên!'); return; }

  _moonAdminMenuOpen = false;
  var dd = document.getElementById('moon-admin-dropdown');
  if (dd) dd.classList.remove('open');

  var shortTitleEl = document.getElementById('moon-guide-short-title');
  var shortEl = document.getElementById('moon-guide-short-display');
  var titleInput = document.getElementById('moon-guide-short-title-input');
  var bodyInput = document.getElementById('moon-guide-short-body-input');
  if (titleInput) titleInput.value = shortTitleEl ? shortTitleEl.innerHTML : _defaultMoonGuideShort.title;
  if (bodyInput) bodyInput.value = shortEl ? shortEl.innerHTML : _defaultMoonGuideShort.body;

  var overlay = document.getElementById('moon-edit-guide-short-overlay');
  if (overlay) overlay.classList.add('open');
}

function closeMoonEditGuideShort() {
  var overlay = document.getElementById('moon-edit-guide-short-overlay');
  if (overlay) overlay.classList.remove('open');
}

function submitMoonEditGuideShort() {
  var lv = ROLE_LEVEL[_currentLoginRole] || 1;
  if (lv < 3) { showToast('Không đủ quyền!'); return; }

  var newTitle = (document.getElementById('moon-guide-short-title-input').value || '').trim() || _defaultMoonGuideShort.title;
  var newBody = (document.getElementById('moon-guide-short-body-input').value || '').trim() || _defaultMoonGuideShort.body;

  if (db) {
    db.ref('settings/moon_content').update({
      guide_short_title: newTitle,
      guide_short_body: newBody
    }, function (err) {
      if (err) showToast('⚠ Lỗi lưu!');
      else { closeMoonEditGuideShort(); showToast('✓ Đã cập nhật bảng tóm tắt!'); }
    });
  } else {
    var shortTitleEl = document.getElementById('moon-guide-short-title');
    var shortEl = document.getElementById('moon-guide-short-display');
    if (shortTitleEl) shortTitleEl.innerHTML = newTitle;
    if (shortEl) shortEl.innerHTML = newBody;
    closeMoonEditGuideShort();
    showToast('✓ Đã cập nhật (offline)!');
  }
}

/* ══════════════════════════════════════════
   DISPLAY NAME HELPER
   ══════════════════════════════════════════ */
window.getMoonDisplayName = function (deviceId) {
  if (!deviceId) return deviceId;
  for (var key in _identities) {
    var profile = _identities[key];
    var idsArr = [];
    if (Array.isArray(profile.ids)) idsArr = profile.ids;
    else if (typeof profile.ids === 'object' && profile.ids) idsArr = Object.values(profile.ids);
    if (idsArr.indexOf(deviceId) !== -1 && profile.merged)
      return { name: profile.name || key, type: 'merged' };
  }
  for (var key2 in _identities) {
    var profile2 = _identities[key2];
    var idsArr2 = [];
    if (Array.isArray(profile2.ids)) idsArr2 = profile2.ids;
    else if (typeof profile2.ids === 'object' && profile2.ids) idsArr2 = Object.values(profile2.ids);
    if (idsArr2.indexOf(deviceId) !== -1 && !profile2.merged)
      return { name: profile2.name || key2, type: 'founder' };
  }
  if (_moonProfiles) {
    for (var pk in _moonProfiles) {
      var mp = _moonProfiles[pk];
      if (mp.ids && mp.ids.indexOf(deviceId) !== -1)
        return { name: mp.name, type: 'moon' };
    }
  }
  if (_moonUsers && _moonUsers[deviceId])
    return { name: _moonUsers[deviceId].name, type: 'moon' };
  return { name: deviceId, type: 'raw' };
};

/* ═══════════════════════════════════════════
   MOON — Switch Role & Notifications mirror
   ═══════════════════════════════════════════ */

/** Cập nhật icon role Moon theo role string — đồng nhất với Sun */
function _updateMoonRoleIconByRole(role) {
  var ids = ['secondary', 'normal', 'admin', 'head', 'manager', 'cofounder', 'founder', 'default'];
  ids.forEach(function (r) {
    var el = document.getElementById('moon-icon-prof-' + r);
    if (el) el.style.display = 'none';
  });
  var map = {
    secondary: 'secondary', normal: 'normal', admin: 'admin',
    head: 'head', manager: 'manager', cofounder: 'cofounder', founder: 'founder'
  };
  var key = map[role] || 'default';
  var target = document.getElementById('moon-icon-prof-' + key);
  if (target) target.style.display = 'inline';

  var roleColors = {
    founder: 'var(--founder)', cofounder: 'var(--cofounder)', manager: 'var(--manager)',
    head: 'var(--head)', admin: 'var(--orange)', normal: 'var(--accent2)', secondary: 'var(--accent2)'
  };
  var cnt = document.getElementById('moon-admin-role-icon');
  if (cnt) cnt.style.color = roleColors[role] || 'var(--ink)';
}

function updateMoonRoleIcon() {
  _updateMoonRoleIconByRole(_currentLoginRole || '');
}

function switchRoleMoon(newRole) {
  var currentLv = ROLE_LEVEL[_currentLoginRole] || 1;
  // Chặn quyền truy cập nếu dưới Head và không có pass Founder
  if (currentLv < 4 && sessionStorage.getItem('hun_known_founder') !== 'true') {
    document.getElementById('admin-deny-overlay').classList.add('open');
    closeAllMoonMenus();
    return;
  }
  if (_currentLoginRole === newRole) { showToast('Already in this role!'); return; }

  // Cập nhật State nội bộ, KHÔNG gọi switchRole() của trang Sun để tránh lộn xộn UI
  _currentLoginRole = newRole;
  var newLv = ROLE_LEVEL[newRole] || 1;
  _isAdmin = (newLv >= 3);

  closeAllMoonMenus();
  setTimeout(function () {
    updateMoonRoleIcon();
    updateMoonSwitchVisibility();
    _renderMoonAdminDropdown(_currentLoginRole);

    var noti = document.getElementById('moon-cnt-noti');
    var notiD = document.getElementById('moon-div-noti');
    if (noti && notiD) {
      var showNoti = newLv === 7;
      noti.style.display = showNoti ? 'flex' : 'none';
      notiD.style.display = showNoti ? 'block' : 'none';
      if (showNoti) {
        if (typeof fbListenNoti === 'function') fbListenNoti();
        syncMoonNotiBadge();
      }
    }
  }, 100);
  showToast('✓ Switched role to ' + newRole.toUpperCase() + '!');
}

/* ── Moon menu state ── */
var _moonSwitchOpen = false, _moonNotiOpen = false, _moonAdminMenuOpen = false;

function closeAllMoonMenus() {
  _moonSwitchOpen = _moonNotiOpen = _moonAdminMenuOpen = false;
  ['moon-switch-dropdown', 'moon-noti-dropdown', 'moon-admin-dropdown'].forEach(function (id) {
    var el = document.getElementById(id);
    if (el) el.classList.remove('open');
  });
}

function _moonToggleCore(stateVar, menuId) {
  var wasOpen = window[stateVar];
  closeAllMoonMenus();
  if (!wasOpen) {
    window[stateVar] = true;
    var el = document.getElementById(menuId);
    if (el) el.classList.add('open');
  }
}

function toggleMoonSwitchMenu(e) {
  e.stopPropagation();
  var lv = ROLE_LEVEL[_currentLoginRole] || 1;
  if (lv < 4 && sessionStorage.getItem('hun_known_founder') !== 'true') {
    document.getElementById('admin-deny-overlay').classList.add('open');
    closeAllMoonMenus();
    return;
  }
  _moonToggleCore('_moonSwitchOpen', 'moon-switch-dropdown');
}

function toggleMoonNoti(e) {
  e.stopPropagation();
  var wasOpen = _moonNotiOpen;
  closeAllMoonMenus();
  if (!wasOpen) {
    _moonNotiOpen = true;
    var el = document.getElementById('moon-noti-dropdown');
    if (el) el.classList.add('open');
    renderMoonNotiList();
  }
}

/* ── toggleMoonAdminMenu: duy nhất 1 bản, render dropdown rồi mở ── */
function toggleMoonAdminMenu(e) {
  e.stopPropagation();
  var wasOpen = _moonAdminMenuOpen;
  closeAllMoonMenus();
  if (!wasOpen) {
    _renderMoonAdminDropdown(_currentLoginRole);
    _moonAdminMenuOpen = true;
    var dd = document.getElementById('moon-admin-dropdown');
    if (dd) dd.classList.add('open');
  }
}

/** Render danh sách thông báo Moon — dùng chung _allNoti với Sun */
function renderMoonNotiList() {
  var listEl = document.getElementById('moon-noti-list');
  if (!listEl) return;
  if (_allNoti.length === 0) {
    listEl.innerHTML = '<div style="padding:16px;text-align:center;color:var(--muted);font-size:10.5px;">Không có thông báo mới</div>';
    return;
  }
  listEl.innerHTML = _allNoti.map(function (n) {
    var d = new Date(n.ts);
    var timeStr = d.toLocaleDateString('en-US') + ' ' + d.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
    return '<div class="noti-item ' + (n.read ? '' : 'unread') + '">' +
      '<div>' + esc(n.text) + '</div>' +
      '<div class="noti-time">' + timeStr + '</div>' +
      '<button style="position:absolute;right:8px;top:12px;background:none;border:none;cursor:pointer;color:rgba(192,57,43,0.5);padding:4px;" title="Delete" onclick="deleteNoti(\'' + String(n._k) + '\',event)">✖</button>' +
      '</div>';
  }).join('');
}

/** syncMoonNotiBadge — luôn đọc từ _allNoti (cùng nguồn với Sun) */
function syncMoonNotiBadge() {
  var unread = _allNoti.filter(function (n) { return !n.read; }).length;
  var moonNum = document.getElementById('moon-num-noti');
  var cntNoti = document.getElementById('moon-cnt-noti');
  if (!moonNum) return;
  if (unread > 0) {
    moonNum.textContent = unread;
    moonNum.style.display = 'inline-block';
    if (cntNoti) cntNoti.style.color = '#e74c3c';
  } else {
    moonNum.style.display = 'none';
    if (cntNoti) cntNoti.style.color = 'var(--accent)';
  }
  if (_moonNotiOpen) renderMoonNotiList();
}

/** markAllMoonNotiRead — gọi thẳng hàm Sun (cùng Firebase ref) */
function markAllMoonNotiRead(e) {
  e && e.stopPropagation();
  if (typeof markAllNotiRead === 'function') markAllNotiRead(e);
}

function openMoonNotiTrash(e) {
  e && e.stopPropagation();
  closeAllMoonMenus();
  if (typeof openNotiTrash === 'function') openNotiTrash(e);
}

function updateMoonSwitchVisibility() {
  var sw = document.getElementById('moon-cnt-switch');
  var div = document.getElementById('moon-div-switch');
  if (!sw || !div) return;
  var lv = ROLE_LEVEL[_currentLoginRole] || 1;
  var show = lv >= 3 || sessionStorage.getItem('hun_known_founder') === 'true';
  sw.style.display = show ? 'flex' : 'none';
  div.style.display = show ? 'block' : 'none';
}

/* ── Đóng Moon menus khi click ngoài #moon-counters ── */
document.addEventListener('click', function (e) {
  var mc = document.getElementById('moon-counters');
  if (mc && !mc.contains(e.target)) {
    closeAllMoonMenus();
  }
});

/* ── Sync Moon ← Firebase (fbListenNoti ghi vào _allNoti, Moon đọc cùng biến) ── */
(function patchMoonSync() {
  /* Quan sát badge Sun để cập nhật Moon badge */
  var sunBadge = document.getElementById('num-noti');
  if (sunBadge) {
    new MutationObserver(function () {
      syncMoonNotiBadge();
    }).observe(sunBadge, { childList: true, characterData: true, subtree: true, attributes: true });
  }
  /* Quan sát noti-list Sun: khi Sun re-render → Moon cũng re-render */
  var sunList = document.getElementById('noti-list');
  if (sunList) {
    new MutationObserver(function () {
      syncMoonNotiBadge();
      if (_moonNotiOpen) renderMoonNotiList();
    }).observe(sunList, { childList: true, subtree: true });
  }
  /* Quan sát cnt-profile Sun để sync role icon khi switchRole từ Sun */
  var sunProf = document.getElementById('cnt-profile');
  if (sunProf) {
    new MutationObserver(function () {
      updateMoonRoleIcon();
      updateMoonSwitchVisibility();
    }).observe(sunProf, { subtree: true, childList: true, attributes: true, attributeFilter: ['style'] });
  }
})();