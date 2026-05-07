/* ══════════════════════════════════════════
   app.js — Entry Point
   Khởi động ứng dụng, đăng ký tất cả global
   event listeners. Đây là file CUỐI CÙNG
   được load, sau khi tất cả module khác đã sẵn sàng.
   ══════════════════════════════════════════ */

// ══════════════════════════════════════════
// APP INIT
// ══════════════════════════════════════════

function initApp() {
  // Render UI mặc định ngay lập tức (trước khi Firebase trả về)
  renderHints();
  renderTitle();
  renderNotes();
  renderWelcome();

  // Khởi động Firebase (sẽ gọi các listeners và hiện màn hình phù hợp)
  initFirebase();
}

// ══════════════════════════════════════════
// GLOBAL KEYBOARD SHORTCUTS
// ══════════════════════════════════════════

document.addEventListener('keydown', function(e) {
  var key = e.key;

  // --- Đóng tất cả overlay bằng Escape ---
  if (key === 'Escape') {
    closeConfirm();
    closeAdjust();
    closeAllMenus();
    closeChangePw();
    closeChangeHints();
    closeChangeTitle();
    closeChangePopup();
    closeElevateModal();
    closeChangeNotes();
    closeChangeWelcome();
    closeChangeSecret();
    closeSecretDisplay();
    closeAdminSecretDisplay();
    closeCongrats();
    closeShieldModal();
    closeBlockManager();
    closeTrash();
    closeAdminDenyModal();
    closeAliasManager();
    return;
  }

  // --- Enter trong dialogs ---
  if (key === 'Enter') {
    if (document.getElementById('adjust-overlay').classList.contains('open'))  { doAdjustCounter(); return; }
    if (document.getElementById('elevate-overlay').classList.contains('open')) { submitElevate();   return; }
    if (document.getElementById('shield-overlay').classList.contains('open'))  { submitToggleShield(); return; }
  }

  // --- Enter trong textarea cipher (không phải Shift+Enter) ---
  if (e.target && e.target.id === 'inp' && key === 'Enter' && !e.shiftKey) {
    e.preventDefault();
    run();
    return;
  }

  // --- Shortcuts ---
  if ((e.ctrlKey || e.metaKey) && key === 'Enter') { run(); return; }
  if (e.altKey && key === 'ArrowLeft')  { e.preventDefault(); navUndo(); return; }
  if (e.altKey && key === 'ArrowRight') { e.preventDefault(); navRedo(); return; }
});

// ══════════════════════════════════════════
// DOM CONTENT LOADED
// ══════════════════════════════════════════

document.addEventListener('DOMContentLoaded', function() {

  // Ẩn tất cả counter icons ban đầu
  ['div-switch','cnt-switch','div-secret','cnt-secret','div-elevate','cnt-elevate',
   'div-shield','cnt-shield','div-noti','cnt-noti','div-traffic','cnt-traffic',
   'div-auth','cnt-auth','div-profile','cnt-profile'].forEach(function(id) {
    var el = document.getElementById(id);
    if (el) el.style.display = 'none';
  });

  var mw = document.getElementById('main-wrap');
  if (mw) mw.style.display = 'none';
  document.getElementById('nav-btns').style.display = 'none';
  updateNavBtns();

  // Bind password input Enter key
  var pwInput = document.getElementById('pw-input');
  if (pwInput) {
    pwInput.focus();
    pwInput.addEventListener('keydown', function(e) {
      if (e.key === 'Enter') { e.preventDefault(); checkPw(); }
    });
  }

  // Bind alias tag input
  initAliasTagInput();

  // Start app
  initApp();
});