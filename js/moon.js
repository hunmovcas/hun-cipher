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
  var sw = document.getElementById('moon-cnt-switch');
  var swD = document.getElementById('moon-div-switch');
  if (sw && swD) {
    var showSwitch = lv >= 3 || sessionStorage.getItem('hun_known_founder') === 'true';
    sw.style.display = showSwitch ? 'flex' : 'none';
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

  /* Bảng dữ liệu người dùng - Co-Founder(6) & Founder(7) */
  if (lv >= 6) {
    html += '<div class="adm-section">'
      + '<div class="adm-section-label">Dữ liệu</div>'
      + '<button class="adm-item success" onclick="switchMoonAdminSection(\'userdata\'); closeAllMoonMenus();">👥 Bảng dữ liệu người dùng</button>'
      + '</div>';
  }

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
  var sections = ['guide', 'news', 'suggest', 'origin', 'rename', 'userdata'];
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

  if (section === 'userdata') {
    renderMoonIngameTable();
    renderMoonAllIdentitiesTable();
    var lv = ROLE_LEVEL[_currentLoginRole] || 1;
    // Co-founder (lv=6) không được nhìn thấy các cột chứa tên xanh lá, vàng, nút merge

    // Bảng 1
    var thGreen1 = document.getElementById('th-green-1'); if (thGreen1) thGreen1.style.display = (lv === 7) ? '' : 'none';
    var thGold1 = document.getElementById('th-gold-1'); if (thGold1) thGold1.style.display = (lv === 7) ? '' : 'none';
    var thAction1 = document.getElementById('th-action-1'); if (thAction1) thAction1.style.display = (lv === 7) ? '' : 'none';

    // Bảng 2
    var thGreen2 = document.getElementById('th-green-2'); if (thGreen2) thGreen2.style.display = (lv === 7) ? '' : 'none';
    var thGold2 = document.getElementById('th-gold-2'); if (thGold2) thGold2.style.display = (lv === 7) ? '' : 'none';
    var thAction2 = document.getElementById('th-action-2'); if (thAction2) thAction2.style.display = (lv === 7) ? '' : 'none';
  }
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

async function submitMoonFounder() {
  const pwInput = document.getElementById('moon-founder-pw').value.toLowerCase().trim();
  const errEl = document.getElementById('moon-founder-overlay-err');

  if (!pwInput) {
    errEl.innerText = 'Vui lòng nhập mật khẩu!';
    errEl.style.display = 'block';
    return;
  }

  // Mã hóa mật khẩu bằng SHA-256 để so sánh với currentHashes trên Firebase
  var buf = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(pwInput));
  var hash = Array.from(new Uint8Array(buf)).map(function (b) { return b.toString(16).padStart(2, '0'); }).join('');

  if (hash === currentHashes.founder) {
    // Đúng pass -> Đóng overlay và dọn dẹp
    errEl.style.display = 'none';
    document.getElementById('moon-founder-pw').value = '';
    closeMoonFounderOverlay();

    // Cập nhật đúng các biến State của hệ thống
    _loggedIn = true;
    _originalRole = 'founder';
    _currentLoginRole = 'founder';
    _isAdmin = true;
    sessionStorage.setItem('hun_known_founder', 'true');

    // Load dữ liệu identities từ DB (giống logic Sun)
    if (db) {
      var idSnap = await db.ref('settings/identities').once('value');
      _identities = idSnap.val() || {};
    }

    // QUAN TRỌNG NHẤT: Ẩn màn hình Sun Login đang đè lên trên (vì z-index 9000 > 8500)
    var pwScreen = document.getElementById('pw-screen');
    if (pwScreen) pwScreen.style.display = 'none';

    // Chuyển luồng hiển thị sang Moon Admin
    document.getElementById('moon-screen').style.display = 'none';
    showMoonAdminScreen('founder');

    // Bật lắng nghe Log và ghi Traffic
    fbIncrement('login_founder', null);
    fbListenAll();
    showToast('✓ Xin chào Founder!');
  } else {
    // Sai pass
    errEl.innerText = 'Sai mật khẩu Founder!';
    errEl.style.display = 'block';
    setTimeout(function () { errEl.style.display = 'none'; }, 2500);
  }
}

/* ══════════════════════════════════════════
   BẢNG 1: USER DATA (MOON INGAME)
   ══════════════════════════════════════════ */
function renderMoonIngameTable() {
  var lv = ROLE_LEVEL[_currentLoginRole] || 1;
  if (lv < 6) return;

  var tbody = document.getElementById('moon-ingame-tbody');
  if (!tbody) return;

  var moonData = {};
  for (var devId in _moonUsers) {
    var mName = _moonUsers[devId].name;
    if (!moonData[mName]) moonData[mName] = { ids: new Set(), greenNames: new Set(), goldNames: new Set(), founderKeys: new Set() };
    moonData[mName].ids.add(devId);
  }

  for (var mName in moonData) {
    var ids = Array.from(moonData[mName].ids);
    ids.forEach(function (id) {
      for (var k in _identities) {
        var p = _identities[k];
        var pIds = Array.isArray(p.ids) ? p.ids : (typeof p.ids === 'object' ? Object.values(p.ids) : []);
        if (pIds.indexOf(id) !== -1) {
          var pName = p.name || k;
          if (p.merged) {
            moonData[mName].goldNames.add(pName);
            moonData[mName].founderKeys.add(k); // Thêm key để phục vụ Unmerge
          } else {
            moonData[mName].greenNames.add(pName);
            moonData[mName].founderKeys.add(k);
          }
        }
      }
    });
  }

  var html = '';
  for (var mName in moonData) {
    var d = moonData[mName];
    // Truyền tableType = 1 cho Bảng 1
    html += _buildMoonTableRowHtml(mName, Array.from(d.ids), Array.from(d.greenNames), Array.from(d.goldNames), Array.from(d.founderKeys), lv, false, 1);
  }
  tbody.innerHTML = html;
}

/* ══════════════════════════════════════════
   BẢNG 2: TẤT CẢ ĐỊNH DANH HỆ THỐNG
   ══════════════════════════════════════════ */
function renderMoonAllIdentitiesTable() {
  var lv = ROLE_LEVEL[_currentLoginRole] || 1;
  if (lv < 6) return;

  var tbody = document.getElementById('moon-all-identities-tbody');
  if (!tbody) return;

  var groupedData = [];
  var processedIds = new Set();

  for (var k in _identities) {
    var p = _identities[k];
    var pName = p.name || k;
    var pIds = Array.isArray(p.ids) ? p.ids : (typeof p.ids === 'object' ? Object.values(p.ids) : []);

    var entry = {
      ids: new Set(pIds),
      blueNames: new Set(),
      greenNames: new Set(),
      goldNames: new Set(),
      founderKeys: new Set([k])
    };

    if (p.merged) entry.goldNames.add(pName);
    else entry.greenNames.add(pName);

    pIds.forEach(function (id) {
      processedIds.add(id);
      if (_moonUsers && _moonUsers[id] && _moonUsers[id].name) {
        entry.blueNames.add(_moonUsers[id].name);
      }
    });
    groupedData.push(entry);
  }

  var orphanMoon = {};
  for (var devId in _moonUsers) {
    if (!processedIds.has(devId)) {
      var mName = _moonUsers[devId].name;
      if (!orphanMoon[mName]) orphanMoon[mName] = { ids: new Set(), blueNames: new Set([mName]), greenNames: new Set(), goldNames: new Set(), founderKeys: new Set() };
      orphanMoon[mName].ids.add(devId);
    }
  }
  for (var mName in orphanMoon) { groupedData.push(orphanMoon[mName]); }

  var html = '';
  groupedData.forEach(function (entry) {
    var blueArr = Array.from(entry.blueNames);
    var mainName = (blueArr.length > 0) ? blueArr[0] : (Array.from(entry.greenNames)[0] || 'Unknown');
    // Truyền tableType = 2 cho Bảng 2
    html += _buildMoonTableRowHtml(mainName, Array.from(entry.ids), Array.from(entry.greenNames), Array.from(entry.goldNames), Array.from(entry.founderKeys), lv, blueArr.length === 0, 2);
  });
  tbody.innerHTML = html;
}

/* ── HELPER: BUILD TABLE ROW (Áp dụng UI Nhận diện 2 Bảng) ── */
function _buildMoonTableRowHtml(mainName, idsArr, greenArr, goldArr, fKeysArr, lv, isNoIngame = false, tableType = 1) {
  var blueStr = isNoIngame
    ? '<span style="color:var(--muted);font-style:italic;font-size:0.8rem;">(Chưa có Ingame)</span>'
    : '<span style="color:#2980b9;font-weight:900;">' + esc(mainName) + '</span>';

  var greenStr = (lv >= 7) ? greenArr.map(function (n) { return '<span style="color:#27ae60;font-weight:900;">' + esc(n) + '</span>'; }).join('<br>') : '';
  var goldStr = (lv >= 7) ? goldArr.map(function (n) { return '<span style="color:#b8860b;font-weight:900;">' + esc(n) + '</span>'; }).join('<br>') : '';

  var actionStr = '<div style="display:flex; gap:8px; justify-content:center;">';

  if (lv >= 7) {
    var fKeysStr = JSON.stringify(fKeysArr).replace(/"/g, '&quot;');
    var idsStr = JSON.stringify(idsArr).replace(/"/g, '&quot;');

    // Nút MERGE (Hiển thị khi có Xanh lá, chưa có Vàng)
    if (greenArr.length > 0 && goldArr.length === 0) {
      actionStr += '<button class="allow-protected" onclick="mergeMoonRow(\'' + esc(mainName) + '\', \'' + fKeysStr + '\', \'' + idsStr + '\')" title="Tích hợp" style="background:rgba(39,174,96,0.1); border:1px solid rgba(39,174,96,0.3); color:#27ae60; padding:6px; border-radius:6px; cursor:pointer; transition:all 0.2s;" onmouseover="this.style.background=\'#27ae60\';this.style.color=\'#fff\'" onmouseout="this.style.background=\'rgba(39,174,96,0.1)\';this.style.color=\'#27ae60\'">' +
        '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="16" height="16" stroke-linecap="round" stroke-linejoin="round"><path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"></path><path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"></path></svg></button>';
    }

    // Nút UNMERGE (Hiển thị khi có Vàng)
    if (goldArr.length > 0) {
      actionStr += '<button class="allow-protected" onclick="unmergeMoonRow(\'' + fKeysStr + '\')" title="Hủy tích hợp" style="background:rgba(184,134,11,0.1); border:1px solid rgba(184,134,11,0.3); color:#b8860b; padding:6px; border-radius:6px; cursor:pointer; transition:all 0.2s;" onmouseover="this.style.background=\'#b8860b\';this.style.color=\'#fff\'" onmouseout="this.style.background=\'rgba(184,134,11,0.1)\';this.style.color=\'#b8860b\'">' +
        '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="16" height="16" stroke-linecap="round" stroke-linejoin="round"><path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"></path><path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"></path><line x1="8" y1="8" x2="16" y2="16"></line></svg></button>';
    }

    // Nút DELETE (Luôn hiển thị)
    actionStr += '<button class="allow-protected" onclick="deleteMoonRowData(\'' + esc(mainName) + '\', \'' + idsStr + '\', \'' + fKeysStr + '\')" title="Xóa dữ liệu" style="background:rgba(231,76,60,0.1); border:1px solid rgba(231,76,60,0.3); color:#e74c3c; padding:6px; border-radius:6px; cursor:pointer; transition:all 0.2s;" onmouseover="this.style.background=\'#e74c3c\';this.style.color=\'#fff\'" onmouseout="this.style.background=\'rgba(231,76,60,0.1)\';this.style.color=\'#e74c3c\'">' +
      '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="16" height="16" stroke-linecap="round" stroke-linejoin="round"><polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/><path d="M10 11v6"/><path d="M14 11v6"/></svg></button>';
  }
  actionStr += '</div>';

  // Xác định màu vạch trái tùy thuộc vào Bảng 1 hay Bảng 2
  var accentColor = tableType === 1 ? 'var(--accent2)' : 'var(--founder)';
  var rowStyle = 'background:var(--card); box-shadow:0 2px 6px rgba(0,0,0,0.04); transition: transform 0.15s, box-shadow 0.15s;';
  var hoverLogic = 'onmouseover="this.style.transform=\'translateY(-2px)\'; this.style.boxShadow=\'0 4px 10px rgba(0,0,0,0.08)\';" onmouseout="this.style.transform=\'none\'; this.style.boxShadow=\'0 2px 6px rgba(0,0,0,0.04)\';"';

  var output = '<tr style="' + rowStyle + '" ' + hoverLogic + '>' +
    '<td style="padding:16px; border-top-left-radius:8px; border-bottom-left-radius:8px; border-top:1px solid var(--border); border-bottom:1px solid var(--border); border-left:4px solid ' + accentColor + '; vertical-align:middle; font-family:\'Space Mono\',monospace; font-size:10px;">' +
    idsArr.map(function (id) { return '<span class="dev-badge" style="margin-bottom:4px;display:inline-block;background:rgba(44,62,122,0.06);color:var(--accent2);border-color:rgba(44,62,122,0.2);">' + esc(id) + '</span>'; }).join(' ') +
    '</td>' +
    '<td style="padding:16px; border-top:1px solid var(--border); border-bottom:1px solid var(--border); vertical-align:middle;">' + blueStr + '</td>';

  if (lv === 7) {
    output += '<td style="padding:16px; border-top:1px solid var(--border); border-bottom:1px solid var(--border); vertical-align:middle;">' + greenStr + '</td>' +
      '<td style="padding:16px; border-top:1px solid var(--border); border-bottom:1px solid var(--border); vertical-align:middle;">' + goldStr + '</td>' +
      '<td style="padding:16px; border-top:1px solid var(--border); border-bottom:1px solid var(--border); border-right:1px solid var(--border); border-top-right-radius:8px; border-bottom-right-radius:8px; text-align:center; vertical-align:middle;">' + actionStr + '</td>';
  } else {
    output += '<td style="display:none;"></td><td style="display:none;"></td><td style="display:none;"></td>';
  }
  output += '</tr>';
  return output;
}

/* ══════════════════════════════════════════
   ACTIONS: MERGE / UNMERGE / DELETE / TRASH
   ══════════════════════════════════════════ */

window.mergeMoonRow = function (moonName, founderKeysStr, idsStr) {
  var fKeys = JSON.parse(founderKeysStr);
  var moonIds = JSON.parse(idsStr);
  if (fKeys.length === 0) return;

  var mainKey = fKeys[0];
  var mainProfile = _identities[mainKey];

  var mergedIds = new Set(moonIds);
  var existingIds = Array.isArray(mainProfile.ids) ? mainProfile.ids : (typeof mainProfile.ids === 'object' ? Object.values(mainProfile.ids) : []);
  existingIds.forEach(function (id) { mergedIds.add(id); });

  var updates = {};
  updates['settings/identities/' + mainKey] = {
    name: mainProfile.name || mainKey,
    ids: Array.from(mergedIds),
    merged: true
  };
  if (mainProfile.rank) updates['settings/identities/' + mainKey].rank = mainProfile.rank;

  for (var i = 1; i < fKeys.length; i++) { updates['settings/identities/' + fKeys[i]] = null; }

  if (db) {
    db.ref().update(updates, function (err) {
      if (!err) {
        showToast('✓ Đã tích hợp thành công!');
        renderMoonIngameTable();
        renderMoonAllIdentitiesTable();
      } else showToast('⚠ Lỗi khi tích hợp dữ liệu!');
    });
  }
};

window.unmergeMoonRow = function (founderKeysStr) {
  var fKeys = JSON.parse(founderKeysStr);
  if (fKeys.length === 0 || !db) return;

  document.getElementById('confirm-title').textContent = 'Xác nhận Hủy Tích Hợp?';
  document.getElementById('confirm-msg').innerHTML = 'Hồ sơ sẽ được gỡ cờ tích hợp và hoàn nguyên về trạng thái độc lập. Các ID thiết bị được bảo lưu nguyên vẹn.<br>Xác nhận hủy?';

  document.getElementById('confirm-yes').onclick = function () {
    closeConfirm();
    var updates = {};
    fKeys.forEach(function (k) {
      var p = _identities[k];
      if (p && p.merged) {
        updates['settings/identities/' + k + '/merged'] = null; // Gỡ cờ merged
      }
    });
    if (Object.keys(updates).length > 0) {
      db.ref().update(updates, function (err) {
        if (!err) {
          showToast('✓ Đã hủy tích hợp thành công!');
          renderMoonIngameTable();
          renderMoonAllIdentitiesTable();
        }
      });
    }
  };
  document.getElementById('confirm-overlay').classList.add('open');
};

var _pendingDeleteMoonData = null;
window.deleteMoonRowData = function (moonName, idsStr, fKeysStr) {
  var ids = JSON.parse(idsStr);
  var fKeys = JSON.parse(fKeysStr);
  if ((ids.length === 0 && fKeys.length === 0) || !db) return;

  _pendingDeleteMoonData = { name: moonName, ids: ids, fKeys: fKeys };

  document.getElementById('confirm-title').textContent = 'Xóa hồ sơ?';
  document.getElementById('confirm-msg').innerHTML = 'Hồ sơ và liên kết định danh của <strong>' + esc(moonName) + '</strong> sẽ bị xóa.<br>Dữ liệu có thể khôi phục trong vòng 7 ngày. Lịch sử truy cập gốc được bảo lưu.';

  document.getElementById('confirm-yes').onclick = function () {
    closeConfirm();
    if (!_pendingDeleteMoonData) return;

    var dataIds = _pendingDeleteMoonData.ids;
    var dataKeys = _pendingDeleteMoonData.fKeys;
    var trashId = 'trash_' + Date.now();

    var trashObj = {
      deletedAt: Date.now(),
      name: _pendingDeleteMoonData.name,
      moonUsers: {},
      identities: {}
    };

    var updates = {};

    dataIds.forEach(function (id) {
      if (_moonUsers[id]) {
        trashObj.moonUsers[id] = _moonUsers[id];
        updates['moon_users/' + id] = null;
      }
    });

    dataKeys.forEach(function (k) {
      if (_identities[k]) {
        trashObj.identities[k] = _identities[k];
        updates['settings/identities/' + k] = null;
      }
    });

    updates['trash/moon_data/' + trashId] = trashObj;

    db.ref().update(updates, function (err) {
      if (!err) {
        showToast('✓ Dữ liệu đã được chuyển vào Thùng rác!');
        var trashBtn = document.getElementById('btn-moon-trash');
        if (trashBtn) trashBtn.style.display = 'flex';
        renderMoonIngameTable();
        renderMoonAllIdentitiesTable();
      }
      _pendingDeleteMoonData = null;
    });
  };
  document.getElementById('confirm-overlay').classList.add('open');
};

/* ── THÙNG RÁC MOON DATA ── */
window.openMoonTrash = function () {
  var lv = ROLE_LEVEL[_currentLoginRole] || 1;
  if (lv < 7) { showToast('Chỉ Founder mới xem được thùng rác!'); return; }

  document.getElementById('moon-trash-overlay').classList.add('open');
  var listEl = document.getElementById('moon-trash-list');
  listEl.innerHTML = '<div style="text-align:center;padding:20px;"><span class="spin">⟳</span> Loading...</div>';

  if (!db) return;
  db.ref('trash/moon_data').once('value', function (snap) {
    var now = Date.now(), items = [], toDelete = {};
    snap.forEach(function (c) {
      var val = c.val();
      // 7 ngày = 7 * 24 * 60 * 60 * 1000 = 604800000
      if (val && now - (val.deletedAt || 0) > 604800000) {
        toDelete['trash/moon_data/' + c.key] = null;
      } else {
        items.push(Object.assign({ _k: c.key }, val || {}));
      }
    });

    if (Object.keys(toDelete).length > 0) db.ref().update(toDelete);
    items.sort(function (a, b) { return (b.deletedAt || 0) - (a.deletedAt || 0); });

    var trashBtn = document.getElementById('btn-moon-trash');
    if (items.length === 0) {
      listEl.innerHTML = '<div style="text-align:center;padding:20px;color:var(--muted)">Thùng rác trống.</div>';
      if (trashBtn) trashBtn.style.display = 'none';
    } else {
      if (trashBtn) trashBtn.style.display = 'flex';
      listEl.innerHTML = items.map(function (item) {
        var delD = new Date(item.deletedAt);
        var uCount = Object.keys(item.moonUsers || {}).length;
        var iCount = Object.keys(item.identities || {}).length;

        return '<div style="display:flex;justify-content:space-between;align-items:center;border-bottom:1px solid var(--border);padding:12px 8px;">' +
          '<div><strong style="color:#2980b9;font-size:14px;">' + esc(item.name) + '</strong><br>' +
          '<span style="color:var(--muted);font-size:11px;">Bao gồm: ' + uCount + ' Ingame, ' + iCount + ' Profile</span><br>' +
          '<span style="color:var(--muted);font-size:10px;">Xóa lúc: ' + delD.toLocaleString() + '</span></div>' +
          '<button style="padding:6px 12px;border:1px solid var(--secure);background:rgba(39,174,96,0.1);color:var(--secure);cursor:pointer;font-family:\'Nunito\',sans-serif;font-weight:bold;font-size:11px;border-radius:4px;transition:all 0.2s;" onmouseover="this.style.background=\'var(--secure)\';this.style.color=\'#fff\'" onmouseout="this.style.background=\'rgba(39,174,96,0.1)\';this.style.color=\'var(--secure)\'" onclick="restoreMoonTrash(\'' + String(item._k) + '\')">Khôi phục</button>' +
          '</div>';
      }).join('');
    }
  });
};

window.closeMoonTrash = function () {
  document.getElementById('moon-trash-overlay').classList.remove('open');
};

window.restoreMoonTrash = function (key) {
  if (!db) return;
  db.ref('trash/moon_data/' + key).once('value', function (snap) {
    var data = snap.val();
    if (!data) return;

    var updates = {};
    if (data.moonUsers) {
      for (var id in data.moonUsers) { updates['moon_users/' + id] = data.moonUsers[id]; }
    }
    if (data.identities) {
      for (var ik in data.identities) { updates['settings/identities/' + ik] = data.identities[ik]; }
    }

    updates['trash/moon_data/' + key] = null;

    db.ref().update(updates, function (err) {
      if (!err) {
        showToast('✓ Đã khôi phục dữ liệu!');
        openMoonTrash(); // refresh list
        renderMoonIngameTable();
        renderMoonAllIdentitiesTable();
      }
    });
  });
};

// Gọi check khi khởi tạo trang Admin (để hiện nút Thùng rác nếu có đồ)
setTimeout(function () {
  if (db && ROLE_LEVEL[_currentLoginRole] === 7) {
    db.ref('trash/moon_data').once('value', function (s) {
      var trashBtn = document.getElementById('btn-moon-trash');
      if (trashBtn && s.exists()) trashBtn.style.display = 'flex';
    });
  }
}, 3000);