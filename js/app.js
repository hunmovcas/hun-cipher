/* ══════════════════════════════════════════
   APP — entry point, keyboard events, initApp
   ══════════════════════════════════════════ */

function initApp() {
  renderHints();
  renderTitle();
  renderNotes();
  renderWelcome();
  initFirebase();
}

document.addEventListener('DOMContentLoaded', function() {
  // Hide all counters and main content on load
  ['div-switch','cnt-switch','div-secret','cnt-secret','div-elevate','cnt-elevate',
   'div-shield','cnt-shield','div-noti','cnt-noti','div-traffic','cnt-traffic',
   'div-auth','cnt-auth','div-profile','cnt-profile'].forEach(function(id) {
    var el = document.getElementById(id); if (el) el.style.display = 'none';
  });

  var mw = document.getElementById('main-wrap');
  if (mw) mw.style.display = 'none';
  document.getElementById('nav-btns').style.display = 'none';
  updateNavBtns();

  // Password input: Enter key + focus
  var pwInput = document.getElementById('pw-input');
  if (pwInput) {
    pwInput.focus();
    pwInput.addEventListener('keydown', function(e) {
      if (e.key === 'Enter') { e.preventDefault(); checkPw(); }
    });
  }

  initApp();
});

/* ── GLOBAL KEYBOARD SHORTCUTS ── */
document.addEventListener('keydown', function(e) {
  // Escape closes everything
  if (e.key === 'Escape') {
    closeConfirm(); closeAdjust(); closeAllMenus();
    closeChangePw(); closeChangeHints(); closeChangeTitle(); closeChangePopup();
    closeElevateModal(); closeChangeNotes(); closeChangeWelcome(); closeChangeSecret();
    closeSecretDisplay(); closeAdminSecretDisplay(); closeCongrats();
    closeShieldModal(); closeBlockManager(); closeTrash(); closeAdminDenyModal();
    if(typeof closeIdentityManager === 'function') closeIdentityManager();
    if(typeof closeLinkIdentity === 'function') closeLinkIdentity();
    if(typeof closeFlagNotify === 'function') closeFlagNotify();
    if(typeof closeChangeFlagNotify === 'function') closeChangeFlagNotify();
    if(typeof closeNotiTrash === 'function') closeNotiTrash();
  }

  // Enter confirms open dialogs
  if (e.key === 'Enter' && document.getElementById('adjust-overlay').classList.contains('open'))  { doAdjustCounter(); }
  if (e.key === 'Enter' && document.getElementById('elevate-overlay').classList.contains('open')) { submitElevate(); }
  if (e.key === 'Enter' && document.getElementById('shield-overlay').classList.contains('open'))  { submitToggleShield(); }

  // Enter in cipher textarea
  if (e.target && e.target.id === 'inp' && e.key === 'Enter' && !e.shiftKey) {
    e.preventDefault(); run();
  }

  // Global shortcuts
  if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') run();
  if (e.altKey && e.key === 'ArrowLeft')  { e.preventDefault(); navUndo(); }
  if (e.altKey && e.key === 'ArrowRight') { e.preventDefault(); navRedo(); }
});